#!/bin/bash
# PUAX MCP Server 发布脚本

set -e

echo "🚀 发布 PUAX MCP Server v2.1.0"
echo ""

# 检查是否已登录 NPM
if ! npm whoami &> /dev/null; then
    echo "❌ 请先登录 NPM:"
    echo "   npm login"
    exit 1
fi

# 运行测试
echo "🧪 运行测试..."
npm test

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查版本
echo "📦 当前版本:"
node -p "require('./package.json').version"

# 发布到 NPM
echo "📤 发布到 NPM..."
npm publish --access public

echo ""
echo "✅ 发布成功!"
echo "🌐 访问: https://www.npmjs.com/package/puax-mcp-server"
