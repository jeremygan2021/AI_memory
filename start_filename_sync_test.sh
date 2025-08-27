#!/bin/bash

# 文件名云端同步功能测试脚本

echo "🚀 启动文件名云端同步功能测试..."

# 设置环境变量
export REACT_APP_API_URL=https://data.tangledup-ai.com

# 启动开发服务器
echo "📡 启动开发服务器..."
npm start &

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

echo "✅ 文件名云端同步功能测试已启动！"
echo ""
echo "🧪 测试功能包括："
echo "  1. 用户自定义文件名上传到云端"
echo "  2. 页面加载时从云端同步文件名映射"
echo "  3. 文件名映射在多个组件间同步更新"
echo "  4. 实时响应云端文件名变化"
echo ""
echo "🔗 访问 http://localhost:3000 开始测试"
echo ""
echo "📋 测试步骤："
echo "  1. 输入用户代码进入应用"
echo "  2. 上传音频/图片/视频文件并自定义名称"
echo "  3. 刷新页面，检查文件名是否从云端同步"
echo "  4. 在不同页面间切换，验证文件名显示一致性"
echo ""
echo "💡 按 Ctrl+C 停止测试"

# 保持脚本运行
wait
