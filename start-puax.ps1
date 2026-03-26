#!/usr/bin/env pwsh
#
# PUAX 2.0 启动脚本 (PowerShell)
# 一键启动完整的 PUAX 系统
#

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'
$ScriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $PSCommandPath }

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Logo {
    Write-Host @"
 ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗
 ██╔══██╗██║   ██║██╔══██╗╚██╗██╔╝
 ██████╔╝██║   ██║███████║ ╚███╔╝
 ██╔═══╝ ██║   ██║██╔══██║ ██╔██╗
 ██║     ╚██████╔╝██║  ██║██╔╝ ██╗
 ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝

    AI Agent 激励系统 v2.0
"@ -ForegroundColor Blue
}

function Show-Usage {
    Write-Host ''
    Write-Host 'PUAX 2.0 启动脚本'
    Write-Host ''
    Write-Host '用法:'
    Write-Host '  .\start-puax.ps1 [选项]'
    Write-Host '  pwsh -File .\start-puax.ps1 --skip-tests --force-install'
    Write-Host ''
    Write-Host '选项:'
    Write-Host '  -SkipTests, --skip-tests         跳过测试'
    Write-Host '  -SkipValidate, --skip-validate   跳过角色验证'
    Write-Host '  -ForceInstall, --force-install   强制重新安装依赖'
    Write-Host '  -Help, -h, --help                显示帮助'
    Write-Host ''
    Write-Host '示例:'
    Write-Host '  .\start-puax.ps1                               # 完整启动'
    Write-Host '  .\start-puax.ps1 -SkipTests                    # 跳过测试'
    Write-Host '  pwsh -File .\start-puax.ps1 --force-install    # 重新安装依赖'
    Write-Host ''
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

function Get-TempFilePath {
    param([string]$Name)
    return Join-Path ([System.IO.Path]::GetTempPath()) $Name
}

function Check-Dependencies {
    Write-Info '检查依赖...'

    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        Write-ErrorMessage 'Node.js 未安装，请先安装 Node.js 18+'
        exit 1
    }

    $nodeVersion = (& node --version).Trim()
    if ($nodeVersion -notmatch '^v(?<major>\d+)') {
        Write-ErrorMessage "无法识别 Node.js 版本: $nodeVersion"
        exit 1
    }

    if ([int]$Matches.major -lt 18) {
        Write-ErrorMessage "Node.js 版本过低，需要 18+，当前: $nodeVersion"
        exit 1
    }

    Write-Success "Node.js 版本: $nodeVersion"

    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        Write-ErrorMessage 'npm 未安装'
        exit 1
    }

    $npmVersion = (& npm --version).Trim()
    Write-Success "npm 版本: $npmVersion"
}

function Install-Dependencies {
    param([string]$ServerDir)

    Write-Info '安装依赖...'

    Push-Location $ServerDir
    try {
        if (-not (Test-Path 'node_modules' -PathType Container)) {
            Write-Info '首次运行，安装依赖...'
            Invoke-CheckedCommand -Command { npm install } -FailureMessage '依赖安装失败'
        }
        else {
            Write-Info '依赖已安装'
        }
    }
    finally {
        Pop-Location
    }
}

function Generate-Bundle {
    param([string]$ServerDir)

    Write-Info '生成角色 Bundle...'

    Push-Location $ServerDir
    try {
        Invoke-CheckedCommand -Command { npm run generate-bundle } -FailureMessage 'Bundle 生成失败'
    }
    finally {
        Pop-Location
    }

    Write-Success 'Bundle 生成完成'
}

function Validate-Roles {
    param([string]$ProjectRoot)

    Write-Info '验证角色...'

    $validateLog = Get-TempFilePath -Name 'puax-validate.log'
    if (Test-Path $validateLog) {
        Remove-Item $validateLog -Force
    }

    Push-Location $ProjectRoot
    try {
        Write-Info "验证日志将写入: $validateLog"
        & node scripts/validate-role.js --all 2>&1 | Tee-Object -FilePath $validateLog
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            Write-WarningMessage "角色验证命令返回非零退出码，请检查日志: $validateLog"
        }
    }
    finally {
        Pop-Location
    }

    $passed = 0
    $failed = 0
    $logContent = if (Test-Path $validateLog) { Get-Content $validateLog } else { @() }

    foreach ($line in $logContent) {
        if ($line -match '通过:\s*(\d+)') {
            $passed = [int]$Matches[1]
        }
        if ($line -match '失败:\s*(\d+)') {
            $failed = [int]$Matches[1]
        }
    }

    Write-Success "角色验证: $passed 个通过, $failed 个失败"

    if ($failed -gt 0) {
        Write-WarningMessage "有 $failed 个角色未通过验证(可能是 v1.0 风格角色)"
    }
}

function Run-Tests {
    param([string]$ServerDir)

    Write-Info '运行测试...'

    $testLog = Get-TempFilePath -Name 'puax-test.log'
    if (Test-Path $testLog) {
        Remove-Item $testLog -Force
    }

    Push-Location $ServerDir
    try {
        Write-Info "测试日志将写入: $testLog"
        Write-Info '测试输出将实时显示，这一步可能需要几分钟...'
        & npm test 2>&1 | Tee-Object -FilePath $testLog
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($exitCode -eq 0) {
        $testsLine = if (Test-Path $testLog) {
            Select-String -Path $testLog -Pattern '^Tests:' | Select-Object -First 1
        }
        else {
            $null
        }

        if ($testsLine) {
            $summary = ($testsLine.Line -replace '^Tests:\s*', '').Trim()
            Write-Success "测试通过: $summary"
        }
        else {
            Write-Success '测试通过'
        }
    }
    else {
        Write-ErrorMessage "测试失败，请检查日志: $testLog"
        exit 1
    }
}

function Start-Server {
    param([string]$ServerDir)

    Write-Info '启动 PUAX MCP 服务器...'
    Write-Info '服务器将在 http://127.0.0.1:2333 启动'
    Write-Info '按 Ctrl+C 停止服务器'
    Write-Host ''

    Push-Location $ServerDir
    try {
        npm start
    }
    finally {
        Pop-Location
        Write-Info '正在停止服务器...'
    }
}

function Get-Options {
    param([string[]]$RawArguments)

    $options = @{
        SkipTests = $false
        SkipValidate = $false
        ForceInstall = $false
        Help = $false
    }

    foreach ($argument in $RawArguments) {
        switch ($argument) {
            '-SkipTests' { $options.SkipTests = $true }
            '--skip-tests' { $options.SkipTests = $true }
            '-SkipValidate' { $options.SkipValidate = $true }
            '--skip-validate' { $options.SkipValidate = $true }
            '-ForceInstall' { $options.ForceInstall = $true }
            '--force-install' { $options.ForceInstall = $true }
            '-Help' { $options.Help = $true }
            '-h' { $options.Help = $true }
            '--help' { $options.Help = $true }
            default {
                Write-ErrorMessage "未知选项: $argument"
                Show-Usage
                exit 1
            }
        }
    }

    return $options
}

function Main {
    $scriptDir = $ScriptRoot
    Set-Location $scriptDir

    $options = Get-Options -RawArguments $Arguments
    if ($options.Help) {
        Show-Usage
        exit 0
    }

    Show-Logo

    $serverDir = Join-Path $scriptDir 'puax-mcp-server'
    if (-not (Test-Path $serverDir -PathType Container)) {
        Write-ErrorMessage '请在 PUAX 项目根目录运行此脚本'
        exit 1
    }

    Check-Dependencies

    if ($options.ForceInstall) {
        $nodeModulesDir = Join-Path $serverDir 'node_modules'
        if (Test-Path $nodeModulesDir) {
            Write-Info '强制重新安装依赖，删除现有 node_modules...'
            Remove-Item $nodeModulesDir -Recurse -Force
        }
    }

    Install-Dependencies -ServerDir $serverDir
    Generate-Bundle -ServerDir $serverDir

    if (-not $options.SkipValidate) {
        Validate-Roles -ProjectRoot $scriptDir
    }

    if (-not $options.SkipTests) {
        Run-Tests -ServerDir $serverDir
    }

    Write-Host ''
    Write-Success '所有检查通过，启动服务器...'
    Write-Host ''

    Start-Server -ServerDir $serverDir
}

Main