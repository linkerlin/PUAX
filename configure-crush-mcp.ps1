# Crush MCP 自动化配置脚本
# 配置 PUAX MCP 服务器连接到 Crush

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Crush MCP 配置工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 定义配置参数
$MCP_SERVER_URL = "http://localhost:23333"
$MCP_SERVER_NAME = "puax"

# 获取用户主目录
$UserProfile = $env:USERPROFILE
$CrushDir = "$UserProfile\.crush"
$ConfigFile = "$CrushDir\config.json"

Write-Host "配置 MCP 服务器: $MCP_SERVER_NAME" -ForegroundColor Yellow
Write-Host "服务器地址: $MCP_SERVER_URL" -ForegroundColor Yellow
Write-Host "配置文件: $ConfigFile" -ForegroundColor Yellow
Write-Host ""

# 步骤 1: 创建 .crush 目录
Write-Host "步骤 1: 检查/创建 Crush 配置目录..." -ForegroundColor Green
if (Test-Path $CrushDir) {
    Write-Host "✓ 配置目录已存在: $CrushDir" -ForegroundColor White
} else {
    try {
        New-Item -ItemType Directory -Path $CrushDir -Force | Out-Null
        Write-Host "✓ 配置目录已创建: $CrushDir" -ForegroundColor White
    } catch {
        Write-Host "✗ 无法创建配置目录: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# 步骤 2: 创建配置文件
Write-Host "步骤 2: 创建 MCP 配置文件..." -ForegroundColor Green

try {
    $config = @{
        mcpServers = @{
            $MCP_SERVER_NAME = @{
                url = $MCP_SERVER_URL
                description = "PUAX AI角色管理系统"
            }
        }
        activeMcpProfile = $MCP_SERVER_NAME
        mcpTimeout = 30000
    }

    $config | ConvertTo-Json -Depth 3 | Out-File -FilePath $ConfigFile -Encoding utf8
    Write-Host "✓ 配置文件已创建" -ForegroundColor White
} catch {
    Write-Host "✗ 无法创建配置文件: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 步骤 3: 验证配置文件
Write-Host "步骤 3: 验证配置文件..." -ForegroundColor Green
if (Test-Path $ConfigFile) {
    $fileSize = (Get-Item $ConfigFile).length
    if ($fileSize -gt 0) {
        Write-Host "✓ 配置文件已创建，大小: $fileSize bytes" -ForegroundColor White
        Write-Host ""
        Write-Host "配置文件内容:" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content $ConfigFile | Write-Host -ForegroundColor White
        Write-Host "----------------------------------------" -ForegroundColor Gray
    } else {
        Write-Host "✗ 配置文件为空" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ 配置文件未找到" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 步骤 4: 测试 MCP 服务器连接
Write-Host "步骤 4: 测试 MCP 服务器连接..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$MCP_SERVER_URL/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "✓ MCP 服务器运行正常" -ForegroundColor White
        Write-Host "  状态: $($healthData.status)" -ForegroundColor White
        Write-Host "  服务: $($healthData.service)" -ForegroundColor White
        Write-Host "  版本: $($healthData.version)" -ForegroundColor White
    } else {
        Write-Host "⚠ MCP 服务器返回非 200 状态: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 无法连接 MCP 服务器: $MCP_SERVER_URL" -ForegroundColor Yellow
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请确保: " -ForegroundColor Cyan
    Write-Host "  1. 在另一个终端运行: cd C:/GitHub/PUAX/puax-mcp-server && npm start" -ForegroundColor Cyan
    Write-Host "  2. 服务器启动完成后再重新运行此脚本" -ForegroundColor Cyan
}
Write-Host ""

# 完成
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 启动 MCP 服务器:" -ForegroundColor White
Write-Host "   cd C:/GitHub/PUAX/puax-mcp-server && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 重启 Crush 以应用配置" -ForegroundColor White
Write-Host ""
Write-Host "3. 在 Crush 中使用 MCP 功能" -ForegroundColor White
Write-Host ""
Write-Host "配置详情:" -ForegroundColor Cyan
Write-Host "  服务器名称: $MCP_SERVER_NAME" -ForegroundColor White
Write-Host "  服务器地址: $MCP_SERVER_URL" -ForegroundColor White
Write-Host "  配置文件: $ConfigFile" -ForegroundColor White
Write-Host ""

# 提示查看完整指南
Write-Host "查看完整文档: CRUSH-MCP配置指南.md" -ForegroundColor Gray
