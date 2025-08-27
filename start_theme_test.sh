#!/bin/bash

# 主题云端同步功能测试启动脚本

echo "🎨 启动主题云端同步功能测试..."
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo ""
echo "主题云端同步功能已实现！"
echo ""
echo "📋 测试指南:"
echo "1. 打开浏览器访问: http://localhost:3000"
echo "2. 访问测试页面: http://localhost:3000/theme-cloud-test"
echo "3. 在测试页面中："
echo "   - 使用主题切换器切换主题（会自动保存到云端）"
echo "   - 点击各种测试按钮验证功能"
echo "   - 观察控制台日志了解同步过程"
echo ""
echo "💡 功能特性:"
echo "✅ 主题切换时自动保存到云端"
echo "✅ 应用启动时自动从云端加载"
echo "✅ 智能降级到本地存储"
echo "✅ 多设备同步支持"
echo "✅ 完整的错误处理机制"
echo ""
echo "🔧 实现方式:"
echo "- 参考评论和头像的云端保存机制"
echo "- 主题保存为txt文件格式"
echo "- 使用相同的API接口和路径结构"
echo "- 支持用户代码隔离和会话管理"
echo ""

# 启动应用
npm start
