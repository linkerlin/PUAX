# PUAX 跨平台 Hook 分发（polyglot 模式）

> 版本: v3.11 | 配套: [HOOK-ARCHITECTURE.md](HOOK-ARCHITECTURE.md)

方案借鉴 obra/superpowers 的 `hooks/run-hook.cmd` polyglot 模式：**单个文件同时是
Windows batch 与 Unix shell**。PUAX 的 hook 脚本是 node 入口（`hook.js`），本模式
用于在纯 shell 语境（无 node 直接调用条件）下兜底。

## 一、为什么需要 polyglot

- Claude Code / Cursor 的 hook 命令在 Windows 上可能被 cmd.exe 或 PowerShell 破坏（引号剥离、ParserError）
- 事件脚本需要同时工作于 Windows 与 Unix
- 宿主可能只接受"一个命令"的 hook 配置

## 二、分发器结构（`hooks/run-hook.cmd`）

```bash
: << 'CMDBLOCK'
@echo off
REM Windows: cmd.exe 执行本段
if "%~1"=="" exit /b 0
where node >nul 2>nul
if %ERRORLEVEL% neq 0 exit /b 0
node "%~dp0hook.js" %*
exit /b 0
CMDBLOCK

# Unix: bash 把 batch 段当 no-op heredoc，直接执行本段
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
command -v node >/dev/null 2>&1 || exit 0
exec node "${SCRIPT_DIR}/hook.js" "$@"
```

要点：
- `: << 'CMDBLOCK'` 使 batch 段对 bash 完全不可见（heredoc 直到 `CMDBLOCK` 标记）
- Windows 段用 `where node` 探测，找不到静默退出 0（优雅降级）
- `%~dp0` 为脚本所在目录（hook.js 同目录）

## 三、事件脚本命名

事件脚本**无扩展名**（`session-start` 而非 `session-start.sh`）：

- Claude Code 在 Windows 上会对含 `.sh` 的命令**自动前置 `bash`**，破坏 node 调用；
- 无扩展名脚本经 `#!/usr/bin/env bash` 由 bash 执行，内部 `exec node` 转交 node。

## 四、生成与安装

```bash
# 生成（Claude Code / Cursor 都会带出 hooks/ 目录）
npx puax-mcp-server --export=claude-code --output=./
# 产物
#   hooks/hooks.json      Claude Code 宿主配置
#   hooks/hook.js         node 入口（引擎共享层）
#   hooks/run-hook.cmd    polyglot 分发器
#   hooks/session-start   无扩展名事件脚本
#   hooks/pre-tool-use
#   hooks/post-tool-use
```

安装：将导出目录置于项目根（hooks.json 内命令为相对路径 `./hooks/hook.js`）。

## 五、降级契约

1. 无 node / 未安装 puax-mcp-server → `exit 0`，宿主会话不受影响
2. hook 脚本内一切错误由 `hook.js` 兜底为 `{}` 输出
3. 永不向 stderr 外泄 JSON 污染（日志一律走 stderr）
