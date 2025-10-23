#!/bin/bash

# ==========================================
# 项目部署脚本
# 功能：
# 1. 构建React项目
# 2. 清理无用文件
# chmod +x 脚本文件名.sh
# 3. 部署到远程服务器
# ==========================================

# 设置变量
SERVER_IP="139.224.233.33"
SERVER_PATH="/root/me/build"
BUILD_DIR="build"
SERVER_PASSWORD="123quant-speed"

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令执行结果
check_result() {
    if [ $? -ne 0 ]; then
        print_error "$1"
        exit 1
    fi
}

# 检查sshpass是否安装
check_sshpass() {
    if ! command -v sshpass &> /dev/null; then
        print_error "sshpass 未安装，请先安装 sshpass"
        print_info "Mac 用户可以使用以下命令安装: brew install hudochenkov/sshpass/sshpass"
        print_info "或者使用: brew install esolitos/ipa/sshpass"
        exit 1
    fi
}

# 构建项目
print_info "开始构建项目..."
npm run build
check_result "项目构建失败"

print_info "项目构建完成"

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
    print_error "构建目录 $BUILD_DIR 不存在"
    exit 1
fi

# 删除无用文件（可选）
print_info "清理无用文件..."
# 删除.map文件（通常用于调试，生产环境不需要）
find $BUILD_DIR -name "*.map" -type f -delete
# 删除.DS_Store文件（Mac系统自动生成的文件）
find $BUILD_DIR -name ".DS_Store" -type f -delete
# 删除Thumbs.db文件（Windows系统自动生成的文件）
find $BUILD_DIR -name "Thumbs.db" -type f -delete
# 添加其他需要删除的无用文件...
print_info "无用文件清理完成"

# 部署到服务器
print_info "开始部署到服务器 $SERVER_IP:$SERVER_PATH ..."
# 使用rsync同步文件到服务器，-avz表示归档、详细输出、压缩传输
# --delete表示删除目标目录中源目录没有的文件，实现完全同步
# 使用sshpass提供密码认证
rsync -avz --delete -e "sshpass -p '$SERVER_PASSWORD' ssh -o StrictHostKeyChecking=no" $BUILD_DIR/ root@$SERVER_IP:$SERVER_PATH/
check_result "部署失败"

print_info "部署完成！"
print_info "项目已成功部署到 $SERVER_IP:$SERVER_PATH"