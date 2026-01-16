@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo  ======================================
echo   PUAX MCP Server - 快速启动
echo  ======================================
echo.

REM 获取脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装或未添加到 PATH
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

REM 检查是否已构建
if not exist "build\index.js" (
    echo [构建] 未找到构建文件，正在构建...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] 构建失败!
        pause
        exit /b 1
    )
)

echo [启动] 正在启动服务器...
echo.

REM 启动服务器
start /B "PUAX-MCP-Server" node build\index.js %*

REM 等待用户按下 Ctrl-C
echo 按 Ctrl-C 停止服务器
echo.

REM 设置 Ctrl-C 处理
setlocal enabledelayedexpansion
:wait_loop
timeout /t 1 /nobreak >nul 2>&1
if errorlevel 1 goto cleanup
goto wait_loop

:cleanup
echo.
echo [清理] 正在停止服务器...

REM 杀死所有 node.exe 进程（只杀死当前启动的）
taskkill /FI "WINDOWTITLE eq PUAX-MCP-Server*" /F >nul 2>&1

REM 额外检查：杀死监听 2333 端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":2333" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [成功] 服务器已停止
echo.
pause