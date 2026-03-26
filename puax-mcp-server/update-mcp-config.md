# 更新 MCP 配置使用 v2.1.0

## Claude Desktop

编辑 `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["-y", "puax-mcp-server@2.1.0"],
      "env": {
        "PUAX_HTTP_PORT": "2333"
      }
    }
  }
}
```

## Cursor

编辑 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["-y", "puax-mcp-server@2.1.0"]
    }
  }
}
```

## Windsurf

编辑 `%USERPROFILE%\.codeium\windsurf\mcp_config.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["-y", "puax-mcp-server@2.1.0"]
    }
  }
}
```

## VSCode + Cline/Continue

编辑 VSCode 设置中的 MCP 配置，添加版本号：

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["-y", "puax-mcp-server@2.1.0"],
      "transportType": "stdio"
    }
  }
}
```

## 验证步骤

1. 保存配置后重启 MCP 客户端
2. 查看 MCP 服务器列表，确认 `puax` 显示为 ✅ 已连接
3. 测试新功能：
   - 询问 AI "我现在是什么角色？" (测试 get_active_role)
   - 说 "帮我切换到程序员角色" (测试 switch_role)
   - 询问 "有哪些可用的方法论？" (测试 v2.1.0 新增的方法论路由)

## 降级方法

如果新版本有问题，可以回退到 v2.0.0：

```bash
# 修改配置文件中的版本号
npx puax-mcp-server@2.0.0
```
