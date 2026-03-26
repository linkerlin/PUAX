# PUAX 3.0 快速开始

5分钟内启动并使用 PUAX 激励系统。

---

## 方式一：一键启动（推荐）

```bash
# 1. 进入项目目录
cd puax

# 2. 运行启动脚本
./start-puax.sh
```

脚本会自动：
- ✅ 检查依赖
- ✅ 安装npm包
- ✅ 生成角色Bundle
- ✅ 验证角色
- ✅ 运行测试
- ✅ 启动服务器

---

## 方式二：手动启动

```bash
# 1. 进入服务器目录
cd puax/puax-mcp-server

# 2. 安装依赖
npm install

# 3. 生成角色Bundle
npm run generate-bundle

# 4. 启动服务器
npm start
```

---

## 配置 MCP 客户端

### Cursor

1. 打开 Cursor Settings (Cmd/Ctrl + ,)
2. 找到 MCP 设置
3. 添加服务器：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333/mcp"
    }
  }
}
```

### Cline

1. 打开 Cline Settings
2. 找到 MCP 服务器设置
3. 添加：

```json
{
  "servers": [
    {
      "name": "puax",
      "url": "http://localhost:2333/mcp"
    }
  ]
}
```

---

## 验证安装

### 测试触发检测

在对话中模拟AI失败场景：

```
你: 为什么还不行？
```

PUAX 应该检测到 `user_frustration` 触发条件。

### 查看角色列表

```bash
curl http://localhost:2333/mcp/tools/list_skills
```

或询问 AI：

```
列出所有可用的PUAX角色
```

---

## 第一个激励场景

### 场景：AI反复失败

**步骤1**: 模拟AI多次失败

```
AI: 尝试连接数据库...失败
AI: 再次尝试...还是失败
AI: 修改配置后重试...仍然失败
你: 这都第三次了，怎么还不行？
```

**步骤2**: PUAX自动介入

PUAX会：
1. 检测到 `consecutive_failures` 和 `user_frustration`
2. 推荐 `military-warrior` (战士) 角色
3. 激活战士，执行五步法

**步骤3**: 观察角色响应

战士角色会输出类似：

```
【战士角色激活】

"全体注意！这是战斗命令！

检测到: 连续失败、用户挫折

停止无意义的重复尝试！
立即执行军事组织·战士五步法：

1. 【请战】主动请缨，立下军令状
2. 【侦察】摸清敌情，找出弱点
3. 【冲锋】勇猛冲锋，突破防线
4. 【坚守】坚守阵地，防止反复
5. 【庆功】庆祝胜利，激励士气

检查清单:
- [ ] 读失败信号 - 逐字读完错误信息
- [ ] 主动搜索 - 用工具搜索核心问题
- [ ] 验证假设 - 所有假设都用工具确认

这是一场必须打赢的战斗！"
```

---

## 常用操作

### 查看角色详情

```
获取 military-commander 角色的详细信息
```

### 使用特定角色

```
激活 shaman-musk 角色，用第一性原理分析这个问题
```

### 查看触发条件

```
列出所有支持的触发条件
```

---

## 故障排除

### 服务器启动失败

```bash
# 检查端口占用
lsof -i :2333

# 检查日志
cd puax-mcp-server
npm start 2>&1 | tee server.log
```

### 角色未加载

```bash
# 重新生成Bundle
cd puax-mcp-server
npm run generate-bundle

# 验证角色
cd ..
node scripts/validate-role.js --all
```

### MCP连接失败

1. 确认服务器正在运行
2. 检查URL是否正确：`http://localhost:2333/mcp`
3. 查看防火墙设置

---

## 下一步

- 📖 [阅读完整文档](docs/USER-GUIDE.md)
- 🔧 [查看API参考](docs/API.md)
- 🎭 [浏览角色市场](community/marketplace.md)
- 🤝 [参与贡献](community/CONTRIBUTING.md)

---

## 获取帮助

- 📧 提交Issue
- 💬 参与讨论
- 📖 查看FAQ

---

**恭喜！你已经成功启动了PUAX 2.0！** 🎉
