# Samsung E2NAND / eNAND 产品线记录

采集日期：2026-05-08

## 结论

目前没有找到 Samsung 使用 `E2NAND` 作为公开产品线名称的资料。`E2NAND3.0` 在现有规则库中属于 SK hynix / H27 文档范围，不应迁移到 Samsung。

Samsung 公开嵌入式 NAND 产品线主要是：

- eMMC / eStorage
- UFS / eStorage
- eMCP / uMCP / MCP
- 历史 OneNAND / Flex-OneNAND

## 来源

- Samsung eStorage 官方页面覆盖 eMMC 与 UFS。
  <https://semiconductor.samsung.com/estorage/>
- Samsung eMMC 到 UFS 技术博客说明 eMMC 是 managed NAND solution，UFS 是后续移动存储方向。
  <https://org-ap-publish-cn.semiconductor.samsung.com/us/newsroom/tech-blog/emmc-to-ufs-how-nand-memory-for-mobile-products-is-evolving/>
- Samsung 旧新闻资料记录 OneNAND / Flex-OneNAND，而不是 E2NAND。
  <https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-%EB%8F%84%EC%8B%9C%EB%B0%94%EC%97%90-%ED%93%A8%EC%A0%84%EB%A9%94%EB%AA%A8%EB%A6%AC-%EC%9B%90%EB%82%B8%EB%93%9C%EF%BC%88onenand%EF%BC%89-%EB%9D%BC%EC%9D%B4>

## 规则状态

不新增 Samsung E2NAND decoder。若后续发现 Samsung 特定 eNAND/OneNAND PN ordering table，应新建独立规则，不复用 SK hynix E2NAND3.0 规则。
