# PN 规则可信度策略

采集日期：2026-05-08

规则库可以使用本地 `fdb` / `fdfdb` 辅助推断，但准入需要区分可信度。可信度字段只允许放在 DSL 内部 metadata，例如 `tables.reference` / `tables.densityReference`，不得 merge 到 `extraInfo` 或其他用户可见输出。

## 可信度等级

| 状态 | 含义 | 可做动作 |
| --- | --- | --- |
| `external_confirmed` | 原厂页面、公开 datasheet、TechInsights、TechPowerUp 等能直接确认 PN、产品线、容量、die 或代际 | 可进入规则和 testcase |
| `external_table_confirmed` | FlashInfo、论坛 flash-id 表、SSD dump、分销页面等外部网页与本地 fdb/fdfdb 同向 | 可进入规则，但文档需说明来源档位 |
| `local_pending_external_reference` | 仅本地 fdb/fdfdb 或 MPTool 数据，暂未找到外部网页 | 不删除候选；可保留内部 metadata 和待确认文档，不作为确定结论 |

## 准入原则

- 禁止完整 PN 白名单匹配；规则必须按结构 token 解析。
- 单个 MPTool / fdfdb 条目不能单独提升为确定规则。
- 本地多源一致时可以保留候选，但应标记 `local_pending_external_reference`。
- 外部网页确认前，不应在文档中写成“已确定”。
- `status`、`source`、`reference`、`inference_source` 等维护字段不得出现在解析结果中。

## 推荐 DSL metadata 结构

```json
{
  "reference": {
    "TOKEN": {
      "status": "external_confirmed",
      "source": "Samsung official product page",
      "examples": ["KLUFG8RHHF-F0G1"],
      "notes": "UFS 4.0, 512GB"
    }
  }
}
```

当前编译器不会消费未被 step 引用的 `tables.reference`，因此该表只作为规则维护信息使用。
