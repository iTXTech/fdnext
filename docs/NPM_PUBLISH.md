# NPM 发布准备

本文档记录 `fdnext` 第一批 npm registry 发布包和发布前检查流程。

## 第一批发布包

第一批面向外部 SDK、命令行和标准 HTTP server 集成：

- `@itxtech/fdnext-core`
- `@itxtech/fdnext-decodepack`
- `@itxtech/fdnext-resources`
- `@itxtech/fdnext-runtime`
- `@itxtech/fdnext-cli`
- `@itxtech/fdnext-server`

第一批不包含 serverless adapter、FDBGen 和 contract-test。它们可以在第一批验证稳定后再发布：

- `@itxtech/fdnext-cf-workers`
- `@itxtech/fdnext-aliyun-fc`
- `@itxtech/fdnext-fdbgen`
- `@itxtech/fdnext-contract-test`

## 发布前检查

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm contract:check
git diff --check
```

## 打包检查

第一批 package 应只发布运行所需的 `dist` 文件和资源 JSON，不应包含 `src`、`test`、`tsconfig.tsbuildinfo` 或本地缓存。

```bash
rm -rf /tmp/fdnext-pack
mkdir -p /tmp/fdnext-pack

pnpm -C packages/core pack --pack-destination /tmp/fdnext-pack --json
pnpm -C packages/decodepack pack --pack-destination /tmp/fdnext-pack --json
pnpm -C packages/resources pack --pack-destination /tmp/fdnext-pack --json
pnpm -C packages/runtime pack --pack-destination /tmp/fdnext-pack --json
pnpm -C packages/cli pack --pack-destination /tmp/fdnext-pack --json
pnpm -C packages/server pack --pack-destination /tmp/fdnext-pack --json
```

至少抽查：

```bash
tar -tf /tmp/fdnext-pack/itxtech-fdnext-cli-*.tgz
tar -tf /tmp/fdnext-pack/itxtech-fdnext-server-*.tgz
tar -xOf /tmp/fdnext-pack/itxtech-fdnext-server-*.tgz package/package.json
```

## 发布

确认 npm 登录身份和组织权限：

```bash
npm whoami
```

第一批发布：

```bash
pnpm -C packages/core publish --access public
pnpm -C packages/decodepack publish --access public
pnpm -C packages/resources publish --access public
pnpm -C packages/runtime publish --access public
pnpm -C packages/cli publish --access public
pnpm -C packages/server publish --access public
```

发布后检查：

```bash
npm view @itxtech/fdnext-core version
npm view @itxtech/fdnext-cli version
npm view @itxtech/fdnext-server version
npm exec @itxtech/fdnext-cli -- capabilities eng
```
