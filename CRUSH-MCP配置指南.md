# Crush MCP 配置指南

## Crush 配置文件位置

Crush 的配置目录：`C:\Users\linke\.crush\`

## MCP 配置方法

### 方法 1：创建 JSON 配置文件

在 `C:\Users\linke\.crush\` 目录创建 `config.json` 或 `settings.json`：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:23333"
    }
  }
}
```

### 方法 2：环境变量配置

在系统环境变量中添加：

```bash
# Windows PowerShell
$env:CRUSH_MCP_SERVER_PUAX="http://localhost:23333"

# 或使用 setx 永久设置
setx CRUSH_MCP_SERVER_PUAX "http://localhost:23333"
```

### 方法 3：命令行参数（如果支持）

```bash
crush --mcp-server puax=http://localhost:23333
```

## 配置验证

### 1. 启动 MCP 服务器

```bash
cd C:/GitHub/PUAX/puax-mcp-server
npm start
```

### 2. 测试连接

```bash
# 健康检查
curl http://localhost:23333/health
```

## 快速配置步骤

### Windows 系统

```powershell
# 1. 创建配置文件目录（如果不存在）
mkdir -Force $env:USERPROFILE\.crush

# 2. 创建配置文件
cat > $env:USERPROFILE\.crush\config.json << 'EOF'
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:23333"
    }
  }
}
EOF

# 3. 验证文件创建成功
cat $env:USERPROFILE\.crush\config.json

# 4. 启动 MCP 服务器
cd C:/GitHub/PUAX/puax-mcp-server && npm start
```

### 手动配置

1. 打开目录：`C:\Users\linke\.crush\`
2. 创建文件：`config.json`
3. 添加内容：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:23333"
    }
  }
}
```

4. 保存并重启 Crush

## 配置文件参考

Crush 可能支持的配置格式：

### JSON 格式（推荐）
```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:23333"
    }
  }
}
```

### YAML 格式
```yaml
mcpServers:
  puax:
    url: http://localhost:23333
```

### TOML 格式
```toml
[mcpServers.puax]
url = "http://localhost:23333"
```

## 自动配置工具

一键配置脚本：

### Windows 批处理
```batch
@echo off
set CONFIG_DIR=%USERPROFILE%\.crush
set CONFIG_FILE=%CONFIG_DIR%\config.json

if not exist %CONFIG_DIR% mkdir %CONFIG_DIR%

echo { > %CONFIG_FILE%
echo   "mcpServers": { >> %CONFIG_FILE%
echo     "puax": { >> %CONFIG_FILE%
echo       "url": "http://localhost:23333" >> %CONFIG_FILE%
echo     } >> %CONFIG_FILE%
echo   } >> %CONFIG_FILE%
echo } >> %CONFIG_FILE%

echo Crush MCP 配置已完成！
echo 配置文件路径：%CONFIG_FILE%
type %CONFIG_FILE%
```

### PowerShell 脚本
```powershell
$crushDir = "$env:USERPROFILE\.crush"
$configPath = "$crushDir\config.json"

# 创建目录
if (!(Test-Path $crushDir)) {
    New-Item -ItemType Directory -Path $crushDir -Force
}

# 创建配置文件
@{
    mcpServers = @{
        puax = @{
            url = "http://localhost:23333"
        }
    }
} | ConvertTo-Json -Depth 3 | Out-File -FilePath $configPath -Encoding utf8

Write-Host "✓ Crush MCP 配置文件已创建!" -ForegroundColor Green
Write-Host "路径: $configPath" -ForegroundColor Cyan
Write-Host 
Write-Host "内容:"
Get-Content $configPath
```

## 故障排除

### 配置文件未生效

1. **检查文件路径**：确认文件位于 `C:\Users\linke\.crush\`
2. **检查文件格式**：确保是有效的 JSON/YAML 格式
3. **检查语法**：使用在线 JSON 验证工具检查语法
4. **重启 Crush**：配置文件修改后需要重启 Crush

### 连接测试

```bash
# 测试 MCP 服务器
curl http://localhost:23333/health

# 测试 SSE 连接
curl http://localhost:23333/
```

### 日志检查

查看 Crush 日志：`C:\Users\linke\.crush\logs\`

## 完整配置示例

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:23333",
      "description": "PUAX AI角色管理系统"
    }
  },
  "activeMcpProfile": "puax",
  "mcpTimeout": 30000
}
```

## 相关文档

- [MCP 配置指南](./MCP-配置指南.md)
- [PUAX MCP Server 文档](./puax-mcp-server/README_HTTP.md)
