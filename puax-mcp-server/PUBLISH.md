# PUAX MCP Server 发布指南

本文档指导如何将 `puax-mcp-server` 发布到 NPM 仓库。

## 📋 发布前检查清单

### 1. 代码准备

- [ ] 所有功能已测试通过
- [ ] `npm run build` 构建成功
- [ ] `npm test` 测试通过
- [ ] 版本号已更新（遵循 SemVer）
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新

### 2. 登录 NPM

确保已注册 NPM 账号并登录：

```bash
# 检查当前登录用户
npm whoami

# 如果未登录，执行登录
npm login
```

### 3. 更新版本号

```bash
# 选择适当的版本号更新
npm version patch   # 修复 bug：1.6.0 -> 1.6.1
npm version minor   # 新功能：1.6.0 -> 1.7.0
npm version major   # 不兼容变更：1.6.0 -> 2.0.0
```

## 🚀 发布步骤

### 方式 1：使用 prepublishOnly 脚本（推荐）

```bash
# 直接发布（会自动执行 npm run build）
npm publish
```

### 方式 2：手动构建后发布

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 运行测试
npm test

# 4. 发布
npm publish
```

## ✅ 发布后验证

### 1. 检查 NPM 页面

访问 https://www.npmjs.com/package/puax-mcp-server 确认包已更新。

### 2. 测试 npx 安装

```bash
# 清理缓存（可选）
npm cache clean --force

# 测试 npx 运行
npx puax-mcp-server --version

# 测试 STDIO 模式
npx puax-mcp-server --stdio
```

### 3. 测试全局安装

```bash
# 全局安装
npm install -g puax-mcp-server

# 测试命令
puax-mcp-server --version
puax --version
```

## 🔧 常见问题

### Q: 发布时提示 "You must be logged in"

```bash
npm login
# 输入用户名、密码、邮箱
```

### Q: 包名已被占用

需要修改 `package.json` 中的 `name` 字段，使用不同的包名。

### Q: 发布时提示版本号已存在

```bash
# 查看当前版本
npm version

# 更新版本号
npm version patch
```

### Q: 如何发布测试版本（beta）

```bash
# 发布 beta 版本
npm version 1.7.0-beta.0
npm publish --tag beta

# 用户安装 beta 版本
npm install -g puax-mcp-server@beta
```

### Q: 如何撤销发布

```bash
# 撤销特定版本（72小时内有效）
npm unpublish puax-mcp-server@1.6.1

# 撤销整个包（谨慎使用！）
npm unpublish puax-mcp-server --force
```

## 📦 包文件说明

发布到 NPM 的文件由 `package.json` 中的 `files` 字段控制：

```json
{
  "files": [
    "build/**/*",      // 编译后的代码
    "README.md",       // 说明文档
    "LICENSE",         // 许可证
    "CHANGELOG.md"     // 更新日志
  ]
}
```

**注意**：`.npmignore` 文件也影响发布内容，确保不要发布敏感文件。

## 📝 版本号规范

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) 规范：

- **MAJOR**（主版本）：不兼容的 API 变更
- **MINOR**（次版本）：向下兼容的功能新增
- **PATCH**（修订号）：向下兼容的问题修复

示例：
- `1.6.0` -> `1.6.1`：修复 bug
- `1.6.1` -> `1.7.0`：新增功能（如新的传输模式）
- `1.7.0` -> `2.0.0`：不兼容的 API 变更

## 🔄 CI/CD 自动发布（可选）

可以配置 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📚 相关链接

- [NPM 官方文档](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [NPM 包页面](https://www.npmjs.com/package/puax-mcp-server)
