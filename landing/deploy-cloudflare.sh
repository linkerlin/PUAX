#!/bin/bash
# Cloudflare Pages 部署脚本

echo "🚀 部署 PUAX Landing 到 Cloudflare Pages..."

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建
echo "🔨 构建项目..."
npm run build

# 部署到 Cloudflare Pages (使用 Wrangler)
echo "📤 部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=puax-landing

echo "✅ 部署完成!"
echo "🌐 访问: https://puax.net"
