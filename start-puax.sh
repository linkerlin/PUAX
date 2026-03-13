#!/bin/bash
#
# PUAX 2.0 启动脚本
# 一键启动完整的PUAX系统
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示Logo
show_logo() {
    echo -e "${BLUE}"
    cat << "EOF"
 ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗
 ██╔══██╗██║   ██║██╔══██╗╚██╗██╔╝
 ██████╔╝██║   ██║███████║ ╚███╔╝ 
 ██╔═══╝ ██║   ██║██╔══██║ ██╔██╗ 
 ██║     ╚██████╔╝██║  ██║██╔╝ ██╗
 ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
                                   
    AI Agent 激励系统 v2.0
EOF
    echo -e "${NC}"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 版本过低，需要18+，当前: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js 版本: $(node --version)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    print_success "npm 版本: $(npm --version)"
}

# 安装依赖
install_dependencies() {
    print_info "安装依赖..."
    
    cd puax-mcp-server
    
    if [ ! -d "node_modules" ]; then
        print_info "首次运行，安装依赖..."
        npm install
    else
        print_info "依赖已安装"
    fi
    
    cd ..
}

# 生成Bundle
generate_bundle() {
    print_info "生成角色Bundle..."
    
    cd puax-mcp-server
    npm run generate-bundle
    cd ..
    
    print_success "Bundle生成完成"
}

# 验证角色
validate_roles() {
    print_info "验证角色..."
    
    node scripts/validate-role.js --all > /tmp/validate.log 2>&1
    PASSED=$(grep "通过:" /tmp/validate.log | awk '{print $2}')
    FAILED=$(grep "失败:" /tmp/validate.log | awk '{print $2}')
    
    print_success "角色验证: ${PASSED}个通过, ${FAILED}个失败"
    
    if [ "$FAILED" -gt 0 ]; then
        print_warning "有${FAILED}个角色未通过验证(可能是v1.0风格角色)"
    fi
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    
    cd puax-mcp-server
    npm test > /tmp/test.log 2>&1
    
    if [ $? -eq 0 ]; then
        TESTS=$(grep "Tests:" /tmp/test.log | awk '{print $2}')
        print_success "测试通过: ${TESTS}"
    else
        print_error "测试失败，请检查日志: /tmp/test.log"
        exit 1
    fi
    
    cd ..
}

# 启动服务器
start_server() {
    print_info "启动PUAX MCP服务器..."
    print_info "服务器将在 http://localhost:3000 启动"
    print_info "按 Ctrl+C 停止服务器"
    echo ""
    
    cd puax-mcp-server
    npm start
}

# 显示使用说明
show_usage() {
    echo ""
    echo "PUAX 2.0 启动脚本"
    echo ""
    echo "用法: ./start-puax.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --skip-tests       跳过测试"
    echo "  --skip-validate    跳过角色验证"
    echo "  --force-install    强制重新安装依赖"
    echo "  -h, --help         显示帮助"
    echo ""
    echo "示例:"
    echo "  ./start-puax.sh                    # 完整启动"
    echo "  ./start-puax.sh --skip-tests       # 跳过测试"
    echo "  ./start-puax.sh --force-install    # 重新安装依赖"
    echo ""
}

# 主函数
main() {
    SKIP_TESTS=false
    SKIP_VALIDATE=false
    FORCE_INSTALL=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-validate)
                SKIP_VALIDATE=true
                shift
                ;;
            --force-install)
                FORCE_INSTALL=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "未知选项: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 显示Logo
    show_logo
    
    # 检查是否在正确目录
    if [ ! -d "puax-mcp-server" ]; then
        print_error "请在PUAX项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行步骤
    check_dependencies
    
    if [ "$FORCE_INSTALL" = true ]; then
        rm -rf puax-mcp-server/node_modules
    fi
    
    install_dependencies
    generate_bundle
    
    if [ "$SKIP_VALIDATE" = false ]; then
        validate_roles
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    # 启动服务器
    echo ""
    print_success "所有检查通过，启动服务器..."
    echo ""
    
    start_server
}

# 捕获Ctrl+C
trap 'print_info "正在停止服务器..."; exit 0' INT

# 运行主函数
main "$@"
