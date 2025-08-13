#!/bin/bash

echo "🚀 启动评论功能演示..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未安装npm，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    echo ""
fi

echo "🌐 启动开发服务器..."
echo "📱 请在浏览器中访问：http://localhost:3000/comment-test"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm start
