#!/bin/bash

# 本地部署脚本 - 模块化版本
# 功能：构建项目、上传文件、部署到服务器

# 启用严格错误检查
set -euo pipefail

# 获取脚本所在目录
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载配置文件
CONFIG_FILE="$SCRIPT_PATH/config.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "错误：配置文件不存在: $CONFIG_FILE"
    echo "请确保 config.conf 文件存在于脚本目录中"
    exit 1
fi

# 定义颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BLINK='\033[5m'

# 打印欢迎信息
echo -e "${BLUE}
╔══════════════════════════════════════╗
║        🚀 开始部署流程 🚀          ║
╚══════════════════════════════════════╝
${NC}"

# 检查必要命令是否存在（保留原有逻辑）
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🔍 系统依赖检查          ║
╚══════════════════════════════════════╝\n${NC}\n${YELLOW}🔍 检查系统依赖...${NC}"
commands=("bun" "sshpass" "zip" "unzip")
for cmd in "${commands[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 $cmd 命令，请先安装${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ 所有依赖检查通过${NC}\n${BLUE}════════════════════════════════════════${NC}"

# 验证构建目录和脚本文件
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          📂 环境验证              ║
╚══════════════════════════════════════╝\n${NC}\n${YELLOW}📂 验证项目目录: ${BUILD_DIR}...${NC}"
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}❌ 错误: 构建目录不存在: ${BUILD_DIR}${NC}"
  exit 1
fi

echo -e "${YELLOW}📄 验证服务器脚本文件...${NC}"
REQUIRED_FILES=("$SCRIPT_PATH/server_deploy.sh" "$SCRIPT_PATH/monitor_daemon.sh" "$SCRIPT_PATH/config.conf")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ 错误: 必需文件不存在: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ 所有文件验证通过${NC}\n${BLUE}════════════════════════════════════════${NC}"

# 进入项目目录（保留原有逻辑）
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          📁 进入项目目录          ║
╚══════════════════════════════════════╝\n${NC}\n${BLUE}📁 进入项目目录: ${BUILD_DIR}${NC}"
cd "$BUILD_DIR" || {
  echo -e "${RED}❌ 无法进入项目目录，错误代码: $?${NC}"
  exit 1
}

# 清理/构建/压缩/上传（保留原有逻辑，增加失败时的详细错误代码）
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🧹 清理构建文件          ║
╚══════════════════════════════════════╝\n${NC}\n${YELLOW}🧹 清理历史构建文件...${NC}"
rm -rf build out .next "$ZIP_FILE" || {
  echo -e "${RED}❌ 清理失败，错误代码: $?${NC}"
  exit 1
}

echo -e "\n${BLUE}🛠️  正在构建项目...${NC}"
$BUILD_COMMAND || {
  echo -e "${RED}❌ 项目构建失败，错误代码: $?${NC}"
  exit 1
}
echo -e "${GREEN}✅ 项目构建成功${NC}\n${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          📦 压缩构建文件          ║
╚══════════════════════════════════════╝\n${NC}\n${YELLOW}📦 正在压缩构建文件...${NC}"
# 检查构建输出目录
if [ -d "out" ]; then
    echo -e "${BLUE}📦 发现 out 目录，压缩 out 文件夹...${NC}"
    zip -r "$ZIP_FILE" out || {
      echo -e "${RED}❌ 文件压缩失败，错误代码: $?${NC}"
      exit 1
    }
elif [ -d "build" ]; then
    echo -e "${BLUE}📦 发现 build 目录，压缩 build 文件夹...${NC}"
    zip -r "$ZIP_FILE" build || {
      echo -e "${RED}❌ 文件压缩失败，错误代码: $?${NC}"
      exit 1
    }
else
    echo -e "${RED}❌ 错误：未找到构建输出目录 (out 或 build)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 文件压缩成功 (${ZIP_FILE})${NC}\n${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🚀 文件上传服务器        ║
╚══════════════════════════════════════╝\n${NC}\n${BLUE}🚀 正在上传文件到服务器 (${SERVER})...${NC}"

# 确保远程目录存在
echo -e "${YELLOW}📁 确保远程目录存在...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "
  mkdir -p '$REMOTE_PROJECT_DIR'
  mkdir -p '$REMOTE_SCRIPT_DIR'
" || {
  echo -e "${RED}❌ 创建远程目录失败${NC}"
  exit 1
}

# 先上传脚本文件
echo -e "${YELLOW}📄 上传服务器脚本文件...${NC}"
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no \
  "$SCRIPT_PATH/server_deploy.sh" \
  "$SCRIPT_PATH/monitor_daemon.sh" \
  "$SCRIPT_PATH/config.conf" \
  "$SERVER:$REMOTE_SCRIPT_DIR/" || {
    echo -e "${RED}❌ 脚本文件上传失败，错误代码: $?${NC}"
    exit 1
}

# 设置脚本执行权限
echo -e "${YELLOW}🔧 设置脚本执行权限...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "
  chmod +x '$REMOTE_SCRIPT_DIR/server_deploy.sh'
  chmod +x '$REMOTE_SCRIPT_DIR/monitor_daemon.sh'
" || {
  echo -e "${RED}❌ 设置执行权限失败${NC}"
  exit 1
}

# 清理远程服务器上的旧构建文件
echo -e "${YELLOW}🧹 清理远程服务器上的旧构建文件...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "
  rm -rf '$REMOTE_PROJECT_DIR/build' '$REMOTE_PROJECT_DIR/out' '$REMOTE_PROJECT_DIR/.next' || echo '  ⚠️ 清理远程构建目录失败（不影响部署）'
  rm -f '$REMOTE_PROJECT_DIR/$ZIP_FILE' || echo '  ⚠️ 清理远程zip文件失败（不影响部署）'
" || {
  echo -e "${YELLOW}⚠️ 远程清理失败（继续上传）${NC}"
}

# 上传构建文件
echo -e "${YELLOW}📦 上传构建文件...${NC}"
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$ZIP_FILE" "$SERVER:$REMOTE_PROJECT_DIR/" || {
    echo -e "${RED}❌ 构建文件上传失败，错误代码: $?${NC}"
    exit 1
}

echo -e "${GREEN}✅ 所有文件上传成功${NC}\n${BLUE}════════════════════════════════════════${NC}"

# 执行远程部署脚本
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🚀 远程部署执行          ║
╚══════════════════════════════════════╝\n${NC}"

echo -e "${YELLOW}🚀 执行远程部署脚本...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$REMOTE_SCRIPT_DIR/server_deploy.sh deploy" || {
    echo -e "${RED}❌ 远程部署失败，错误代码: $?${NC}"
    exit 1
}

echo -e "${GREEN}✅ 远程部署成功${NC}"

# 启动监控守护进程
echo -e "\n${YELLOW}🔧 启动监控守护进程...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$REMOTE_SCRIPT_DIR/monitor_daemon.sh restart" || {
    echo -e "${YELLOW}⚠️ 监控守护进程启动失败，但不影响部署${NC}"
}

echo -e "${GREEN}\n╔══════════════════════════════════════╗
║          ✅ 远程部署流程完成      ║
╚══════════════════════════════════════╝${NC}"




# 等待服务启动
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          ⏳ 等待服务启动          ║
╚══════════════════════════════════════╝\n${NC}\n${YELLOW}⏳ 等待${BLINK}${STARTUP_WAIT_TIME}${NC}${YELLOW}秒以确保服务启动...${NC}"
sleep "$STARTUP_WAIT_TIME"

# 网页可用性检查
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🌐 网页可用性检查        ║
╚══════════════════════════════════════╝\n${NC}\n${BLUE}🌐 检查目标网页是否正常启动...${NC}"

if [ -n "$TARGET_URL" ]; then
    http_code=""
    page_content=""
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" || echo "000")
    
    if [ "$http_code" -eq 200 ]; then
        if [ -n "$HEALTH_CHECK_KEYWORD" ]; then
            page_content=$(curl -s "$TARGET_URL" | head -n 100)
            if echo "$page_content" | grep -q "$HEALTH_CHECK_KEYWORD"; then
                echo -e "${GREEN}✅ 网页启动成功，内容验证通过${NC}"
            else
                echo -e "${YELLOW}⚠️ 网页返回200但未找到关键内容 '$HEALTH_CHECK_KEYWORD'${NC}"
            fi
        else
            echo -e "${GREEN}✅ 网页访问成功 (状态码: $http_code)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 网页访问异常，状态码：$http_code（服务可能仍在启动中）${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ 未配置目标URL，跳过健康检查${NC}"
fi


# 打印开始删除本地文件的提示信息
echo -e "\n${BLUE}╔══════════════════════════════════════╗
║          🗑️ 开始清理本地文件          ║
╚══════════════════════════════════════╝\n${NC}"

# 删除本地的out.zip文件
echo -e "${YELLOW}🗑️ 正在删除本地的 $ZIP_FILE 文件...${NC}"
rm -rf "$ZIP_FILE" || {
    echo -e "${RED}❌ 删除 $ZIP_FILE 文件失败，错误代码: $?${NC}"
    exit 1
}
echo -e "${GREEN}✅ $ZIP_FILE 文件删除成功${NC}"

# 删除本地的构建文件夹
echo -e "${YELLOW}🗑️ 正在删除本地的构建文件夹...${NC}"
rm -rf build out .next || {
    echo -e "${RED}❌ 删除构建文件夹失败，错误代码: $?${NC}"
    exit 1
}
echo -e "${GREEN}✅ 构建文件夹删除成功${NC}"
echo -e "\n${GREEN}
╔══════════════════════════════════════╗
║         🎉 部署流程全部完成！       ║
╚══════════════════════════════════════╝
${NC}"