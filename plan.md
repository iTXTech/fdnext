# sky.txt 清洗与 extra/fdb 审计计划

## 目标

将 `../fdfdb/archives/sky.txt` 清洗为可审计、可合并的 extra 补充数据，同时避免把一次性解析逻辑长期留在 fdnext 主仓库。

最终产物分为两类：

- `extra/sky.json`：纯 `fdnext.fdb.extra.v1` 兼容格式，只包含可安全合并的 sky 记录。
- `extra/base.json`：从原 `extra.json` 迁移来的人工维护基础补丁。
- `sky.review.json`：清洗时发现的歧义、冲突、不可信 PN、decodepack 差异和人工待确认项。

## 代码边界

### mptool-parser

sky 解析器放在 `../mptool-parser`，建议新增：

- `packages/sky/src/cli.js`
- 根入口 `node src/cli.js sky ...`

原因：

- sky 数据更像一次性的 archive 清洗，不应污染 fdnext 主仓库长期维护代码。
- `../mptool-parser` 已经是外部 MPTool / 支持表解析器仓库，并且 `packages/common` 已经承担 fdnext fdbgen v1 JSON 构造和基础归一化职责。
- `packages/common` 只放共享格式 helper；sky 专属规则放 `packages/sky`。

sky parser 直接输出 `fdnext.fdb.extra.v1` 兼容数据，不优先输出 `fdnext.fdbgen.v1c/v1f`。fdbgen v1 面向 PN/Flash ID/controller 支持表；sky 需要主 ID 覆盖、制程、cell、Samsung CER、die/CE topology 等 extra 字段。

`mptool-parser/packages/common` 的长期归属应迁到 fdnext 提供。fdnext 是 fdbgen v1 / extra / fdb schema 和归一化规则的源头，`mptool-parser` 不应长期复制一份会漂移的实现。迁移后有两种可接受形态：

- 首选：`mptool-parser` 直接依赖 `@itxtech/fdnext-fdbgen`，删除本地 common 中重复的 fdbgen v1 构造和归一化逻辑。
- 过渡：保留 `packages/common` 作为薄封装，只 re-export / proxy fdnext 提供的 helper，兼容浏览器 editor build 需要时再保留 UMD bundle。

### fdnext / fdbgen

fdnext 主仓库只沉淀通用能力，不写 sky 专属 parser：

- fdbgen v1 schema helper 和 validator。
- extra / generated `fdb.json` schema、parser、normalizer、validator。
- extra 与 base extra / `fdb.json` / decodepack 的审计库。
- CLI 审计入口，供 sky 产物和后续其他 extra 数据复用。

decodepack 审计不要让 fdbgen 通用库硬依赖 decodepack。推荐在 fdnext CLI 层注入 decode engine，通用库只接受 `decodePart` 结果或回调。

## sky 清洗规则

### 基础解析

- 每行按三段解析：`PN`、`Flash ID`、`备注`。
- Flash ID 标准化为大写 hex。
- sky 提供的 Flash ID 归一化后不足 6 bytes，也就是少于 12 个 hex 字符，直接丢弃，不进入 `extra/sky.json`；可在 `sky.review.json` 中记录为 `flash_id.too_short`。
- vendor 从备注首 token 归一化：
  - `Sandisk` / `SanDisk` -> `sndk`
  - `Toshiba` / `Koxia` / `KIOXIA` -> `kioxia`
  - `Hynix` -> `skhynix`
- 只把通过 PN 质量检查的记录写入 `extra/sky.json`；其他进入 `sky.review.json`。

### ID 覆盖与 priority

- sky 数据较可信，安全记录可使用 `id` 或 `fid` 表达主 Flash ID。
- `fid` 和 `id` 不得同时存在。
- `fid` 只允许出现在 extra 输入；生成后的 `fdb.json` 只应出现 `id`。
- 如果 sky 主 ID 会覆盖掉现有 base extra / `fdb.json` 中明显有用的 ID 或 controller 反向关系，审计必须报告。
- extra 顶层支持 `priority`，数字越大越优先，合并顺序与 decodepack 一致。
- `extra/base.json` 使用 schema + 高 priority；`extra/sky.json` 使用 schema + 低于 base 的 priority。
- sky 中 Micron PN 使用 `id` 而不是 `fid`，通过 priority stack 覆盖 raw 输入但不抢占 base。

### 05485 规则

统一使用现有 FDB 的零填充形态：

- `SNDK 05485 8G` -> `05485-008G`
- `SNDK 05485 16G` -> `05485-016G`
- `SNDK 05485 32G` -> `05485-032G`

不生成 `05485-8G`、`05485-16G`、`05485-32G`。

### 制程和 decodepack

- 清洗时先检查 decodepack 是否能从 PN 输出同等制程 / generation。
- decodepack 不支持、输出缺失，或输出语义不等价时，在 extra 记录中显式写 `l`。
- audit 需要报告 sky 备注与 decodepack 输出冲突的记录。
- 对 Samsung，`SSVx` / `3DvN` / `Vx` 这类备注可写入 `l`；`CER` 类备注单独保留到 `m`，并由 fdnext 后续白名单映射到 public `special_option`。
- Toshiba/KIOXIA PN 的制程基本可由 decodepack 解析，sky cleaner 默认不再把这类记录写入 `extra/sky.json`；`15nm` 与 `1znm` 视为同一代语义，不为这类等价表述额外写 extra。
- cell level 与 decodepack 冲突时以 decodepack 为准，整条 sky 记录不进入 `extra/sky.json`。
- process / generation 与 decodepack 语义等价时不写 `l`，交给 decodepack 输出；例如 `144L(N38B)` 等价于 `N38B 144L`，`144L(N38)` 等价于 `N38A 144L`。
- process / generation 与 decodepack 不等价时不进入 `extra/sky.json`，进入 `sky.review.json` 供后续修 decodepack 或人工确认。
- topology 与 decodepack 冲突时以 decodepack 为准，sky cleaner 不写入冲突的 `d/e/r/n` 字段，只在 review/audit 中留下冲突记录。

### Samsung CER

- 必须保留 Samsung CER 备注。
- 只允许白名单 CER 类备注输出到 public result，且统一格式化为 `CER`。
- `CERCE3`、`CER CE3`、`CER_TLC`、`CER_QLC`、`SSV4_MLC(CERCE3)` 等都只输出 `CER`。
- sky cleaner 对所有 Samsung CER 备注调用 decodepack 解 PN，并以 decodepack 输出的 `ce_count` / `die_count` 判断是否写入 `m: "CER"`。
- 只有每 CE 对应多 die 时保留 CER，例如 `2CE/4Die`、`2CE/8Die`、`4CE/8Die`；`8CE/8Die` 这类每 CE 仅 1 die 的配置只保留主 ID，不写 CER。
- decodepack 无法输出完整 `ce_count` / `die_count` 时也只保留主 ID，并进入 `sky.review.json`。
- 不应把 FDB 中任意 `m` 字段整体暴露给用户。
- fdnext 侧需要增加窄口径映射：Samsung raw NAND FDB `m` 中的 CER 备注 -> `fields.special_option`。

### bank / die / CE topology

`_2Die`、`*2B`、`_2B`、`*4B`、`*8B` 等不能盲目从 PN 中删除后直接合并。

约定：

- `2B` 表示 bank，即 `1CE 2Die`，写为 `d: 2, e: 1`。
- `4B` 写为 `d: 4, e: 1`。
- `8B` 写为 `d: 8, e: 1`。
- `_2Die` 按 `d: 2` 处理；CE 无法确认时不写 `e`，除非同一来源明确是 bank。

安全写入条件：

- 清洗后的 canonical PN 只有一种 topology，或多条 ID 属于同一 topology。
- 如果同一 canonical PN 下普通封装、`2B`、`4B`、`8B` 对应不同 ID 且 topology 不一致，不写入 `extra/sky.json`，放入 `sky.review.json`。
- 不在最终 authoritative PN key 中保留 `_2B`、`_4Die`、`*2B` 等 metadata suffix。

### SanDisk / KIOXIA die code

SanDisk/KIOXIA PN 清洗要删除 PN 中的 metadata suffix，但保留有价值的 Toshiba/KIOXIA die code 到 `m`：

- 删除：`_4Die`、`_2B`、`_4B`、`_1V2`、`*2B`、`*4B`、`*8B`。
- 保留到 `m`：`8DDK`、`8T23`、`9T23`、`0T24`、`9T24`、`8F24` 等 die / package 线索。
- `m` 可组合，例如 `8T23; 2B`，但 public 输出仍需 fdnext 白名单控制。

### 不可信 PN 过滤

直接清洗掉，不进入 `extra/sky.json`：

- 所有 `JS` 开头的 PN。
- `TC_8T24-032GB`。
- Intel 备注/vendor bucket 下的 Micron PN 形态，例如 `MT29...`。
- 泛化容量标签：`SNDK 128G`、`SNDK 128GB`、`SNDK 512GB`、`SNDK-1TB`。
- Flash ID 伪 PN：`YMTC(9B,C6,...)`。
- 只有 vendor / 容量 / 工艺描述而没有稳定 PN 的 synthetic label。
- 清洗后 vendor 与 Flash ID vendor 严重冲突且无法解释为兼容厂商的记录。

例外：

- `SNDK 05485 8G/16G/32G` 保留，并按零填充规则标准化。

## 审计要求

### schema 审计

新增或导出以下 schema/helper：

- `fdnext-fdbgen-v1` schema helper：复用现有 v1c/v1f schema。
- `extra.json` schema：`fdnext.fdb.extra.v1`
  - 支持顶层 vendor bucket 和 `vendors` wrapper。
  - 限制 `fid/id/f/a/l/c/t/m/d/e/r/n`。
  - `fid` 与 `id` 互斥。
  - Flash ID 必须至少是 6 bytes / 12 hex；超过 generated FDB 所需长度时由 fdbgen 归一化截取。
- `fdb.json` schema：`fdnext.fdb.v1`
  - generated FDB 禁止出现 `fid`。
  - `iddb.n` 必须指向现有 vendor PN。
  - vendor bucket 必须是已知 normalized vendor。

### extra/sky.json vs extra/base.json

审计同 vendor + PN 的差异：

- `fid/id` 不一致。
- `l/c/m/d/e/r/n/t/a/f` 不一致。
- sky 主 ID 覆盖现有 `extra/base.json` 的 `id/fid` 时列出被覆盖 ID。
- 现有 `extra/base.json` 有 controller / alias 信息而 sky 没有时报告，但不自动删除。

### extra/sky.json vs fdb.json

审计合并影响：

- sky 主 ID 会覆盖当前 generated `fdb.json` 中哪些 ID。
- 被覆盖 ID 是否仍被其他 PN 或 `iddb.n` 引用。
- 被覆盖 ID 是否有 controller 支持。
- 新增 PN 是否会造成同 ID fanout 明显增加。
- PN key 是否触发现有 `part.metadata_suffix`、`part.synthetic`、`vendor_mismatch` 等审计规则。

### extra/sky.json vs decodepack

对每条 sky 记录调用 decodepack PN 解码，比较：

- vendor
- chipKind / productType
- process_node / generation_info
- cell_level
- die_count
- ce_count
- rb_count / channel_count

审计输出分类：

- `decodepack.missing_process`：decodepack 未输出 sky 备注中的制程，extra 需要写 `l`。
- `decodepack.process_conflict`：decodepack 输出和 sky 备注冲突。
- `decodepack.topology_conflict`：decodepack topology 和 sky `d/e/r/n` 冲突。
- `decodepack.vendor_conflict`：decodepack vendor 和 sky vendor 冲突。
- `decodepack.not_found`：decodepack 无法识别 PN，但 PN 质量可信，可保留并依赖 extra。

## 推荐命令

sky 清洗：

```bash
node ../mptool-parser/src/cli.js sky clean \
  --input ../fdfdb/archives/sky.txt \
  --out ../fdfdb/extra/sky.json \
  --review ../fdfdb/sky.review.json
```

fdnext 审计：

```bash
pnpm fdbgen:audit-extra \
  --candidate ../fdfdb/extra/sky.json \
  --base-extra ../fdfdb/extra/base.json \
  --base-fdb packages/resources/resources/fdb.json \
  --decodepack \
  --json \
  --out ../fdfdb/sky.audit.json
```

人工确认后合并：

```bash
pnpm fdbgen:generate -- --input ../fdfdb --output packages/resources/resources/fdb.json --version <ver> --pretty
```

## 实施阶段

### Phase 1: fdbgen 通用 schema/helper

- [x] 导出 fdbgen v1 schema helper。
- [x] 将 `mptool-parser/packages/common` 中可复用的 fdbgen v1 构造、Flash ID / PN / vendor 归一化能力沉到 `@itxtech/fdnext-fdbgen`。
- [x] 新增 `extra.json` schema 和 validator。
- [x] 新增 generated `fdb.json` schema 和 validator。
- [x] 暴露 `parseExtraPayload` / `normalizeExtraPayload` / `validateExtraPayload`。
- [x] 保持 schema/helper 不依赖 sky parser。

### Phase 2: fdbgen extra 审计库

- [x] 实现 candidate extra vs base extra 审计。
- [x] 实现 candidate extra vs generated fdb 审计。
- [x] 复用现有 PN 质量、vendor、Flash ID、fanout 审计规则。
- [x] 输出 text/json，两种格式都支持 `--fail-on-issues`。

### Phase 3: decodepack 审计集成

- [x] 在 fdnext CLI 层加载 core/decodepack engine。
- [x] 将 decode result 注入 fdbgen audit。
- [x] 报告 decodepack 缺失、冲突和不支持项。
- [x] 不让 fdbgen 通用库直接依赖 decodepack 包。

### Phase 4: mptool-parser sky parser

- [x] 新增 `packages/sky`。
- [x] 实现 `sky clean`，输出 `extra/sky.json` 和 `sky.review.json`。
- [x] 接入根 CLI `node src/cli.js sky ...`。
- [x] 实现 05485、Samsung CER、bank topology、SanDisk/KIOXIA die code、不可信 PN 过滤规则。
- [x] 不提交生成结果，只提交 parser 和文档。

### Phase 5: Samsung CER public 输出

- [x] fdnext core 增加白名单映射：Samsung FDB `m` 中 CER 类备注 -> `fields.special_option`。
- [x] 测试确认 CER 可以 public 输出。
- [x] 测试确认普通 FDB `m` 不会泄漏。
- [x] 更新语言包或字段注册表时只使用现有 canonical key，不新增临时 alias。

### Phase 6: 生成与验证

- [x] 运行 sky clean。
- [x] 运行 extra/fdb/decodepack audit。
- [x] 人工处理 `sky.review.json` 中的 topology、PN 歧义和 sky-only 过滤项：保留 review issue，不合并到 `extra/base.json`。
- [x] 将原 `../fdfdb/extra.json` 迁移到 `../fdfdb/extra/base.json`，sky 产物写入 `../fdfdb/extra/sky.json`。
- [x] fdbgen build 自动发现并按文件名合并 `input/extra/*.json`，不再需要生成命令显式传入 `--extra`。
- [x] fdbgen build 自动发现 `input/extra/*.json` 后按 `priority` 从高到低合并，默认 `0`，同 priority 再按文件名排序。
- [x] 合并多个 extra 时，较高 priority 文件已有 PN `id/fid` 身份信息则保留 base，不让后续 sky 主 ID 覆盖。
- [x] 重新生成 `packages/resources/resources/fdb.json`。
- [x] 运行验证：

```bash
pnpm -C packages/fdbgen test
pnpm -C packages/fdbgen typecheck
pnpm -C packages/decodepack test
pnpm -C packages/resources typecheck
pnpm contract:check
git diff --check
```
