# PUAX MCP Server - 测试说明

## 🚀 快速开始测试

### 方式1: 使用完整的测试套件（推荐）

```bash
cd puax-mcp-server

# 运行完整测试套件（自动处理服务器启动/停止）
node test-all.js
```

这个命令会：
1. 检查服务器是否在运行
2. 如果没有运行，询问你要如何继续
3. 自动运行所有测试
4. 生成测试报告

### 方式2: 手动启动服务器，然后测试

**步骤 1：启动服务器**
```bash
# 在终端1运行
npm start
```

**步骤 2：运行测试**（在新终端中）
```bash
# 运行所有测试
node run-with-server.js

# 或运行特定测试
node run-with-server.js test/unit
node run-with-server.js test/http
node run-with-server.js test/sse
node run-with-server.js test/tools
node run-with-server.js test/integration
```

### 方式3: 测试单个文件

确保服务器在运行（npm start），然后：

```bash
# 单元测试
npx jest test/unit/server.test.js --testTimeout=10000

# HTTP 测试
npx jest test/http/endpoint.test.js --testTimeout=10000

# SSE 测试
npx jest test/sse/transport.test.js --testTimeout=15000

# 工具测试
npx jest test/tools/tools.test.js --testTimeout=10000

# 集成测试
npx jest test/integration/mcp-flow.test.js --testTimeout=20000
```

### 方式4: 使用便捷脚本

```bash
# 自动处理服务器启动/停止
node test-with-server.js

# 带彩色输出的完整报告
node test-report.js
```

## 📝 测试类型

### 1. 单元测试 (test/unit/server.test.js)
- 5个测试用例
- 测试HTTP基础端点
- 不需要数据库或外部依赖
- **要求**: 服务器运行中

### 2. HTTP端点测试 (test/http/endpoint.test.js)
- 9个测试用例
- 测试所有HTTP端点
- 验证状态码、响应头、错误处理
- **要求**: 服务器运行中

### 3. SSE传输测试 (test/sse/transport.test.js)
- 9个测试用例
- 测试Server-Sent Events传输
- 验证会话管理、消息格式
- **要求**: 服务器运行中

### 4. 工具功能测试 (test/tools/tools.test.js)
- 11个测试用例
- 测试所有MCP工具调用
- 验证list_roles、get_role、search_roles、activate_role
- **要求**: 服务器运行中

### 5. 集成测试 (test/integration/mcp-flow.test.js)
- 6个测试用例
- 测试完整MCP流程
- 验证多客户端、并发请求、错误场景
- **要求**: 服务器运行中

## 🎯 测试覆盖

| 测试类型 | 数量 | 覆盖范围 |
|---------|------|---------|
| 单元测试 | 5 | HTTP基础功能 |
| HTTP测试 | 9 | HTTP端点 |
| SSE测试 | 9 | Server-Sent Events |
| 工具测试 | 11 | MCP工具调用 |
| 集成测试 | 6 | 完整流程 |
| **总计** | **40+** | **全功能覆盖** |

## 📊 测试脚本

### 完整的测试脚本列表

```bash
# 基础命令
npm start              # 启动服务器
npm test               # 运行测试（需要服务器运行）

# 自定义测试命令
npm run test:unit      # 单元测试
npm run test:http      # HTTP测试
npm run test:sse       # SSE测试
npm run test:tools     # 工具测试
npm run test:integration # 集成测试
npm run test:coverage  # 覆盖率报告
npm run test:watch     # 监听模式

# 便捷脚本
node test-all.js       # 完整测试套件
node test-with-server.js # 自动启动/停止服务器
node test-report.js    # 生成测试报告
node run-with-server.js # 检查服务器并运行测试
node verify-tests.js   # 验证测试配置
```

## ⚠️ 重要提示

### 测试要求服务器运行

大多数测试（除了验证配置文件外）**需要服务器在后台运行**。这是因为这些测试验证的是HTTP和MCP协议的实际行为。

### 常见错误

**错误**: `AggregateError` 或连接超时
**原因**: 服务器没有在运行
**解决**: 先运行 `npm start`，再运行测试

**错误**: `EADDRINUSE: address already in use`
**原因**: 服务器已经在运行
**解决**: 
```bash
# Windows
netstat -ano | findstr :2333
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :2333
kill -9 <pid>
```

**错误**: `SyntaxError: Cannot use import statement outside a module`
**原因**: Jest配置问题
**解决**: 确保已安装 `ts-jest` 和 `@types/jest`

### 快速验证

```bash
# 1. 检查服务器
node run-with-server.js check

# 2. 启动服务器（如果需要）
npm start

# 3. 测试健康端点
curl http://localhost:2333/health

# 4. 运行测试
node run-with-server.js
```

## 🔧 调试测试

### 查看详细输出

```bash
# 详细模式
npm test -- --verbose

# 查看单个测试
npm test -- --testNamePattern="should return health"

# 不清理缓存
npm test -- --no-cache
```

### 调试特定问题

```bash
# 增加超时时间
npx jest test/integration/mcp-flow.test.js --testTimeout=30000

# 检测未关闭的句柄
npx jest --detectOpenHandles

# 运行特定的测试文件
npx jest test/unit/server.test.js
```

## 📈 持续集成

### 在 CI/CD 中使用

在 `.github/workflows/test.yml` 或其他 CI 配置中：

```yaml
- name: Start server
  run: npm start &
  
- name: Wait for server
  run: npx wait-on http://localhost:2333/health
  
- name: Run tests
  run: npm test
```

## 📚 相关文档

- [测试用例文档](./测试用例文档.md) - 详细的测试用例说明
- [测试套件总结](./测试套件总结.md) - 测试覆盖总结
- [测试运行总结](./测试运行总结.md) - 测试结果总结

## 💡 最佳实践

1. **开发时**：使用 `node test-with-server.js` 自动管理服务器
2. **CI/CD**：先启动服务器，等待就绪，再运行测试
3. **调试**：使用 `node test-report.js` 查看详细报告
4. **快速验证**：使用 `node run-with-server.js` 检查基础功能
5. **覆盖率**：定期运行 `npm run test:coverage` 检查覆盖率

## 🆘 故障排除

**Q**: 测试失败，显示 "服务器未在运行"
**A**: 确保在另一个终端运行 `npm start`，或使用 `node test-with-server.js`

**Q**: 测试超时
**A**: 增加超时时间： `--testTimeout=30000`

**Q**: 端口被占用
**A**: 
```bash
# 终止占用进程
npm run stop  # 如果定义了
# 或手动查找并终止
```

**Q**: 所有测试都跳过
**A**: 这是预期的行为，当服务器未运行时。启动服务器后再试。

## 🎉 总结

**记住关键点**：
- ✅ 测试需要服务器运行
- ✅ 使用 `node test-all.js` 最方便
- ✅ 或者手动启动服务器：`npm start`
- ✅ 然后运行测试：`node run-with-server.js`

---

**需要帮助？** 查看测试文档或在项目 Issues 中提问。