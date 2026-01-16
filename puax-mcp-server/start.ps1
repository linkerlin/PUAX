#!/usr/bin/env pwsh
# PUAX MCP Server 启动脚本 (PowerShell)
# 用法: .\start.ps1 [-Port 8080] [-HostName "0.0.0.0"] [-Quiet]

param(
    [int]$Port = 23333,
    [string]$HostName = "127.0.0.1",
    [switch]$Quiet,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# 显示帮助
if ($Help) {
    Write-Host @"

PUAX MCP Server 启动脚本

用法:
  .\start.ps1 [-Port <端口>] [-HostName <主机>] [-Quiet]

参数:
  -Port <端口>        指定监听端口 (默认: 23333)
  -HostName <主机>    指定监听主机 (默认: 127.0.0.1)
  -Quiet              静默模式，减少日志输出
  -Help               显示此帮助信息

示例:
  .\start.ps1                              # 使用默认配置启动
  .\start.ps1 -Port 8080                   # 在 8080 端口启动
  .\start.ps1 -HostName "0.0.0.0"          # 允许外部访问

"@
    exit 0
}

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 检查端口是否被占用
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

if (Test-PortInUse -Port $Port) {
    Write-Host ""
    Write-Host "[ERROR] Port $Port is already in use!" -ForegroundColor Red
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Stop the process using port $Port" -ForegroundColor Yellow
    Write-Host "  2. Use a different port: .\start.ps1 -Port <PORT>" -ForegroundColor Yellow
    Write-Host "  3. Find process: Get-NetTCPConnection -LocalPort $Port" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 检查是否已构建
if (-not (Test-Path "build/index.js")) {
    Write-Host "[PUAX] Build not found, building..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[PUAX] Build failed!" -ForegroundColor Red
        exit 1
    }
}

# 构建参数
$args = @()
if ($Port -ne 23333) {
    $args += "--port"
    $args += $Port.ToString()
}
if ($HostName -ne "127.0.0.1") {
    $args += "--host"
    $args += $HostName
}
if ($Quiet) {
    $args += "--quiet"
}

# 启动服务器
Write-Host "[PUAX] Starting server..." -ForegroundColor Cyan
node build/index.js @args
