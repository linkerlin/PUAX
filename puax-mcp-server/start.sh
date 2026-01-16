#!/bin/bash
# PUAX MCP Server 启动脚本 (Bash)
# 用法: ./start.sh [--port 8080] [--host 0.0.0.0] [--quiet]

set -e

# 默认值
PORT=23333
HOST="127.0.0.1"
QUIET=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -H|--host)
            HOST="$2"
            shift 2
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        -h|--help)
            cat << EOF

PUAX MCP Server 启动脚本

用法:
  ./start.sh [选项]

选项:
  -p, --port <端口>    指定监听端口 (默认: 23333)
  -H, --host <主机>    指定监听主机 (默认: 127.0.0.1)
  -q, --quiet          静默模式，减少日志输出
  -h, --help           显示此帮助信息

示例:
  ./start.sh                          # 使用默认配置启动
  ./start.sh -p 8080                  # 在 8080 端口启动
  ./start.sh --host 0.0.0.0           # 允许外部访问

EOF
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查是否已构建
if [ ! -f "build/index.js" ]; then
    echo -e "\033[33m[PUAX]\033[0m Build not found, building..."
    npm run build
fi

# 构建参数
ARGS=""
if [ "$PORT" != "23333" ]; then
    ARGS="$ARGS --port $PORT"
fi
if [ "$HOST" != "127.0.0.1" ]; then
    ARGS="$ARGS --host $HOST"
fi
if [ "$QUIET" = true ]; then
    ARGS="$ARGS --quiet"
fi

# 启动服务器
echo -e "\033[36m[PUAX]\033[0m Starting server..."
node build/index.js $ARGS
