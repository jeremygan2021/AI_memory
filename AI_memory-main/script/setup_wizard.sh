#!/bin/bash

# 部署配置向导
# 交互式引导用户配置部署选项

# 获取脚本所在目录
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_PATH/config.conf"

# 定义颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# 清屏函数
clear_screen() {
    clear
}

# 显示标题
show_header() {
    echo -e "${BLUE}${BOLD}
╔══════════════════════════════════════════════════════════════╗
║                   🚀 部署配置向导 🚀                        ║
║               自动化部署系统配置工具                         ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
}

# 显示分隔线
show_separator() {
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
}

# 暂停等待用户按键
pause() {
    echo -e "\n${YELLOW}按任意键继续...${NC}"
    read -n 1 -s
}

# 询问是否继续
ask_continue() {
    echo -e "\n${YELLOW}是否继续? (y/n): ${NC}"
    read -r answer
    case $answer in
        [Yy]* ) return 0 ;;
        [Nn]* ) echo -e "${RED}配置已取消${NC}"; exit 0 ;;
        * ) echo -e "${RED}请输入 y 或 n${NC}"; ask_continue ;;
    esac
}

# 验证目录是否存在
validate_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo -e "${RED}错误: 目录不存在: $dir${NC}"
        return 1
    fi
    return 0
}

# 验证命令是否可用
validate_command() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${YELLOW}警告: 命令 '$cmd' 未找到，请确保已安装${NC}"
        return 1
    fi
    return 0
}

# 选择部署类型
select_deploy_type() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 1: 选择部署类型${NC}\n"
    
    echo "请选择你的项目类型:"
    echo ""
    echo "1) Node.js 应用 (需要 package.json 和 npm/yarn/bun start)"
    echo "2) 静态文件 (React/Vue/Angular 构建产物等)"
    echo "3) 自动检测 (推荐 - 系统自动判断)"
    echo ""
    echo -e "${YELLOW}请输入选项 (1-3): ${NC}"
    
    while true; do
        read -r choice
        case $choice in
            1)
                DEPLOY_TYPE="nodejs"
                echo -e "${GREEN}✅ 已选择: Node.js 应用${NC}"
                break
                ;;
            2)
                DEPLOY_TYPE="static"
                echo -e "${GREEN}✅ 已选择: 静态文件${NC}"
                break
                ;;
            3)
                DEPLOY_TYPE="auto"
                echo -e "${GREEN}✅ 已选择: 自动检测${NC}"
                break
                ;;
            *)
                echo -e "${RED}无效选择，请输入 1-3${NC}"
                ;;
        esac
    done
    
    pause
}

# 选择包管理器 (仅限Node.js)
select_package_manager() {
    if [ "$DEPLOY_TYPE" = "static" ]; then
        return 0
    fi
    
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 2: 选择包管理器和构建工具${NC}\n"
    
    echo "请选择你使用的包管理器:"
    echo ""
    echo "1) npm (Node.js 默认)"
    echo "2) yarn (Facebook 开发)"
    echo "3) bun (极速 JavaScript 运行时)"
    echo "4) pnpm (快速、节省磁盘空间)"
    echo ""
    echo -e "${YELLOW}请输入选项 (1-4): ${NC}"
    
    while true; do
        read -r choice
        case $choice in
            1)
                PACKAGE_MANAGER="npm"
                BUILD_COMMAND="npm run build"
                echo -e "${GREEN}✅ 已选择: npm${NC}"
                validate_command "npm"
                break
                ;;
            2)
                PACKAGE_MANAGER="yarn"
                BUILD_COMMAND="yarn build"
                echo -e "${GREEN}✅ 已选择: yarn${NC}"
                validate_command "yarn"
                break
                ;;
            3)
                PACKAGE_MANAGER="bun"
                BUILD_COMMAND="bun run build"
                echo -e "${GREEN}✅ 已选择: bun${NC}"
                validate_command "bun"
                break
                ;;
            4)
                PACKAGE_MANAGER="pnpm"
                BUILD_COMMAND="pnpm run build"
                echo -e "${GREEN}✅ 已选择: pnpm${NC}"
                validate_command "pnpm"
                break
                ;;
            *)
                echo -e "${RED}无效选择，请输入 1-4${NC}"
                ;;
        esac
    done
    
    pause
}

# 选择静态文件服务器 (仅限静态文件)
select_static_server() {
    if [ "$DEPLOY_TYPE" = "nodejs" ]; then
        return 0
    fi
    
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 3: 选择静态文件服务器${NC}\n"
    
    echo "请选择静态文件服务器:"
    echo ""
    echo "1) Python HTTP Server (python3 -m http.server)"
    echo "2) Node.js serve (npx serve)"
    echo "3) Node.js http-server (npx http-server)"
    echo "4) Nginx (需要预先配置)"
    echo "5) 自定义命令"
    echo ""
    echo -e "${YELLOW}请输入选项 (1-5): ${NC}"
    
    while true; do
        read -r choice
        case $choice in
            1)
                STATIC_SERVER_COMMAND="python3 -m http.server"
                echo -e "${GREEN}✅ 已选择: Python HTTP Server${NC}"
                validate_command "python3"
                break
                ;;
            2)
                STATIC_SERVER_COMMAND="npx serve -s . -p"
                echo -e "${GREEN}✅ 已选择: npx serve${NC}"
                validate_command "npx"
                break
                ;;
            3)
                STATIC_SERVER_COMMAND="npx http-server -p"
                echo -e "${GREEN}✅ 已选择: npx http-server${NC}"
                validate_command "npx"
                break
                ;;
            4)
                STATIC_SERVER_COMMAND="nginx"
                echo -e "${GREEN}✅ 已选择: Nginx${NC}"
                echo -e "${YELLOW}注意: 需要预先配置 Nginx${NC}"
                break
                ;;
            5)
                echo -e "${YELLOW}请输入自定义命令 (不包括端口号): ${NC}"
                read -r STATIC_SERVER_COMMAND
                echo -e "${GREEN}✅ 已设置自定义命令: $STATIC_SERVER_COMMAND${NC}"
                break
                ;;
            *)
                echo -e "${RED}无效选择，请输入 1-5${NC}"
                ;;
        esac
    done
    
    pause
}

# 配置项目信息
configure_project() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 4: 配置项目信息${NC}\n"
    
    # 构建目录
    echo -e "${CYAN}项目构建目录:${NC}"
    echo -e "${YELLOW}请输入项目的完整路径 (默认: 当前目录的上级目录): ${NC}"
    read -r build_dir
    if [ -z "$build_dir" ]; then
        BUILD_DIR="$(dirname "$SCRIPT_PATH")"
    else
        BUILD_DIR="$build_dir"
    fi
    
    # 验证目录
    while ! validate_directory "$BUILD_DIR"; do
        echo -e "${YELLOW}请重新输入有效的项目目录: ${NC}"
        read -r BUILD_DIR
    done
    echo -e "${GREEN}✅ 项目目录: $BUILD_DIR${NC}"
    
    # 服务名称
    echo -e "\n${CYAN}服务名称:${NC}"
    echo -e "${YELLOW}请输入服务名称 (默认: my-app): ${NC}"
    read -r service_name
    SERVICE_NAME="${service_name:-my-app}"
    echo -e "${GREEN}✅ 服务名称: $SERVICE_NAME${NC}"
    
    # 服务端口
    echo -e "\n${CYAN}服务端口:${NC}"
    echo -e "${YELLOW}请输入服务端口 (默认: 3000): ${NC}"
    read -r service_port
    SERVICE_PORT="${service_port:-3000}"
    echo -e "${GREEN}✅ 服务端口: $SERVICE_PORT${NC}"
    
    pause
}

# 配置服务器信息
configure_server() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 5: 配置服务器信息${NC}\n"
    
    # 服务器地址
    echo -e "${CYAN}服务器连接信息:${NC}"
    echo -e "${YELLOW}请输入服务器地址 (格式: user@host 或 IP): ${NC}"
    read -r SERVER
    
    while [ -z "$SERVER" ]; do
        echo -e "${RED}服务器地址不能为空${NC}"
        echo -e "${YELLOW}请重新输入: ${NC}"
        read -r SERVER
    done
    echo -e "${GREEN}✅ 服务器: $SERVER${NC}"
    
    # 服务器密码
    echo -e "\n${CYAN}服务器密码:${NC}"
    echo -e "${YELLOW}请输入服务器密码 (输入时不显示): ${NC}"
    read -s PASSWORD
    echo ""
    
    while [ -z "$PASSWORD" ]; do
        echo -e "${RED}密码不能为空${NC}"
        echo -e "${YELLOW}请重新输入: ${NC}"
        read -s PASSWORD
        echo ""
    done
    echo -e "${GREEN}✅ 密码已设置${NC}"
    
    # 远程项目目录
    echo -e "\n${CYAN}远程项目目录:${NC}"
    echo -e "${YELLOW}请输入远程项目目录 (默认: /root/$SERVICE_NAME): ${NC}"
    read -r remote_dir
    REMOTE_PROJECT_DIR="${remote_dir:-/root/$SERVICE_NAME}"
    echo -e "${GREEN}✅ 远程项目目录: $REMOTE_PROJECT_DIR${NC}"
    
    # 远程脚本目录
    echo -e "\n${CYAN}远程脚本目录:${NC}"
    echo -e "${YELLOW}请输入远程脚本目录 (默认: /root/script): ${NC}"
    read -r script_dir
    REMOTE_SCRIPT_DIR="${script_dir:-/root/script}"
    echo -e "${GREEN}✅ 远程脚本目录: $REMOTE_SCRIPT_DIR${NC}"
    
    pause
}

# 配置Nginx反向代理
configure_nginx() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 6: 配置Nginx反向代理${NC}\n"
    
    echo -e "${CYAN}是否启用Nginx反向代理? (y/n): ${NC}"
    echo -e "${YELLOW}(Nginx可以提供域名访问、负载均衡、SSL等功能)${NC}"
    read -r enable_nginx
    
    if [[ $enable_nginx =~ ^[Yy]$ ]]; then
        ENABLE_NGINX="true"
        
        # 域名配置
        echo -e "\n${CYAN}域名配置:${NC}"
        echo -e "${YELLOW}请输入你的域名 (如: myapp.tangledup-ai.com): ${NC}"
        read -r domain_name
        
        while [ -z "$domain_name" ]; do
            echo -e "${RED}域名不能为空${NC}"
            echo -e "${YELLOW}请重新输入: ${NC}"
            read -r domain_name
        done
        DOMAIN_NAME="$domain_name"
        echo -e "${GREEN}✅ 域名: $DOMAIN_NAME${NC}"
        
        # 内部端口配置
        echo -e "\n${CYAN}内部应用端口:${NC}"
        echo -e "${YELLOW}请输入应用实际运行的端口 (默认: $SERVICE_PORT): ${NC}"
        read -r internal_port
        INTERNAL_PORT="${internal_port:-$SERVICE_PORT}"
        echo -e "${GREEN}✅ 内部端口: $INTERNAL_PORT${NC}"
        
        # Nginx监听端口
        echo -e "\n${CYAN}Nginx监听端口:${NC}"
        echo -e "${YELLOW}请输入Nginx监听端口 (默认: 80): ${NC}"
        read -r nginx_port
        NGINX_PORT="${nginx_port:-80}"
        echo -e "${GREEN}✅ Nginx端口: $NGINX_PORT${NC}"
        
        echo -e "\n${GREEN}✅ Nginx反向代理配置完成${NC}"
        echo -e "${CYAN}配置信息:${NC}"
        echo "  域名: $DOMAIN_NAME"
        echo "  Nginx端口: $NGINX_PORT → 内部端口: $INTERNAL_PORT"
        
    else
        ENABLE_NGINX="false"
        DOMAIN_NAME=""
        INTERNAL_PORT="$SERVICE_PORT"
        NGINX_PORT=80
        echo -e "${YELLOW}⚠️ 跳过Nginx配置${NC}"
    fi
    
    pause
}

# 配置健康检查
configure_health_check() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}步骤 7: 配置健康检查${NC}\n"
    
    echo -e "${CYAN}是否配置健康检查? (y/n): ${NC}"
    read -r enable_health
    
    if [[ $enable_health =~ ^[Yy]$ ]]; then
        # 目标URL
        echo -e "\n${CYAN}健康检查URL:${NC}"
        echo -e "${YELLOW}请输入应用的访问URL (如: https://example.com): ${NC}"
        read -r TARGET_URL
        
        if [ -n "$TARGET_URL" ]; then
            echo -e "${GREEN}✅ 健康检查URL: $TARGET_URL${NC}"
            
            # 关键词检查
            echo -e "\n${CYAN}页面关键词验证 (可选):${NC}"
            echo -e "${YELLOW}请输入页面中的关键词用于验证 (留空跳过): ${NC}"
            read -r HEALTH_CHECK_KEYWORD
            
            if [ -n "$HEALTH_CHECK_KEYWORD" ]; then
                echo -e "${GREEN}✅ 关键词: $HEALTH_CHECK_KEYWORD${NC}"
            fi
        fi
    else
        TARGET_URL=""
        HEALTH_CHECK_KEYWORD=""
        echo -e "${YELLOW}⚠️ 跳过健康检查配置${NC}"
    fi
    
    pause
}

# 显示配置摘要
show_summary() {
    clear_screen
    show_header
    echo -e "${PURPLE}${BOLD}配置摘要${NC}\n"
    
    echo -e "${CYAN}部署配置:${NC}"
    echo "  部署类型: $DEPLOY_TYPE"
    
    if [ "$DEPLOY_TYPE" != "static" ]; then
        echo "  包管理器: $PACKAGE_MANAGER"
        echo "  构建命令: $BUILD_COMMAND"
    fi
    
    if [ "$DEPLOY_TYPE" != "nodejs" ]; then
        echo "  静态服务器: $STATIC_SERVER_COMMAND"
    fi
    
    echo ""
    echo -e "${CYAN}项目配置:${NC}"
    echo "  项目目录: $BUILD_DIR"
    echo "  服务名称: $SERVICE_NAME"
    echo "  服务端口: $SERVICE_PORT"
    
    echo ""
    echo -e "${CYAN}服务器配置:${NC}"
    echo "  服务器: $SERVER"
    echo "  远程项目目录: $REMOTE_PROJECT_DIR"
    echo "  远程脚本目录: $REMOTE_SCRIPT_DIR"
    
    if [ "$ENABLE_NGINX" = "true" ]; then
        echo ""
        echo -e "${CYAN}Nginx配置:${NC}"
        echo "  启用状态: 是"
        echo "  域名: $DOMAIN_NAME"
        echo "  Nginx端口: $NGINX_PORT"
        echo "  内部端口: $INTERNAL_PORT"
    fi
    
    if [ -n "$TARGET_URL" ]; then
        echo ""
        echo -e "${CYAN}健康检查:${NC}"
        echo "  目标URL: $TARGET_URL"
        [ -n "$HEALTH_CHECK_KEYWORD" ] && echo "  关键词: $HEALTH_CHECK_KEYWORD"
    fi
    
    echo ""
    show_separator
    echo -e "${YELLOW}${BOLD}确认保存配置? (y/n): ${NC}"
    read -r confirm
    
    case $confirm in
        [Yy]* ) return 0 ;;
        [Nn]* ) return 1 ;;
        * ) echo -e "${RED}请输入 y 或 n${NC}"; show_summary ;;
    esac
}

# 生成配置文件
generate_config() {
    echo -e "${BLUE}正在生成配置文件...${NC}"
    
    # 备份现有配置
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
        echo -e "${YELLOW}已备份现有配置到: $CONFIG_FILE.backup${NC}"
    fi
    
    # 生成新配置
    cat > "$CONFIG_FILE" << EOF
# 部署配置文件 - 由配置向导自动生成
# 生成时间: $(date)

# ==================== 本地配置 ====================
# 本地项目构建目录
BUILD_DIR="$BUILD_DIR"
# 构建命令
BUILD_COMMAND="${BUILD_COMMAND:-echo 'No build command needed'}"
# 包管理器
PACKAGE_MANAGER="${PACKAGE_MANAGER:-npm}"

# ==================== 服务器配置 ====================
# 服务器连接信息
SERVER="$SERVER"
PASSWORD="$PASSWORD"

# 服务器路径配置
REMOTE_PROJECT_DIR="$REMOTE_PROJECT_DIR"
REMOTE_SCRIPT_DIR="$REMOTE_SCRIPT_DIR"

# 服务配置
SERVICE_PORT=$SERVICE_PORT
SERVICE_NAME="$SERVICE_NAME"

# 部署类型配置
DEPLOY_TYPE="$DEPLOY_TYPE"

# 静态文件服务配置
STATIC_SERVER_COMMAND="${STATIC_SERVER_COMMAND:-python3 -m http.server}"
STATIC_SERVER_LOG="/var/log/\${SERVICE_NAME}-server.log"

# ==================== Nginx配置 ====================
# 是否启用Nginx反向代理
ENABLE_NGINX="${ENABLE_NGINX:-false}"
# 域名配置
DOMAIN_NAME="${DOMAIN_NAME:-}"
# Nginx配置文件路径
NGINX_CONFIG_PATH="/etc/nginx/sites-available"
# Nginx启用配置路径  
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled"
# 内部应用端口（Nginx代理的目标端口）
INTERNAL_PORT="${INTERNAL_PORT:-$SERVICE_PORT}"
# Nginx监听端口
NGINX_PORT="${NGINX_PORT:-80}"

# ==================== 文件配置 ====================
ZIP_FILE="build.zip"

# ==================== 健康检查配置 ====================
# 目标URL用于健康检查
TARGET_URL="${TARGET_URL:-}"
# 健康检查关键词
HEALTH_CHECK_KEYWORD="${HEALTH_CHECK_KEYWORD:-}"
# 等待服务启动时间（秒）
STARTUP_WAIT_TIME=5

# ==================== 监控配置 ====================
# 监控检查间隔（秒）
MONITOR_INTERVAL=30
# 重启尝试次数
MAX_RESTART_ATTEMPTS=3
# 日志文件路径
LOG_FILE="/var/log/app-monitor.log"
EOF

    echo -e "${GREEN}✅ 配置文件已生成: $CONFIG_FILE${NC}"
}

# 显示下一步提示
show_next_steps() {
    clear_screen
    show_header
    echo -e "${GREEN}${BOLD}🎉 配置完成！${NC}\n"
    
    echo -e "${CYAN}下一步操作:${NC}"
    echo ""
    echo "1. 检查配置:"
    echo "   ${YELLOW}./deploy_manager.sh config${NC}"
    echo ""
    echo "2. 检查本地环境:"
    echo "   ${YELLOW}./deploy_manager.sh check${NC}"
    echo ""
    echo "3. 执行部署:"
    echo "   ${YELLOW}./deploy_manager.sh deploy${NC}"
    echo ""
    echo "4. 查看帮助:"
    echo "   ${YELLOW}./deploy_manager.sh help${NC}"
    echo ""
    
    if [ -f "$CONFIG_FILE.backup" ]; then
        echo -e "${YELLOW}注意: 原配置文件已备份为: $CONFIG_FILE.backup${NC}"
        echo ""
    fi
    
    show_separator
    echo -e "${GREEN}配置向导完成！祝你部署愉快！ 🚀${NC}"
}

# 主函数
main() {
    # 检查是否有现有配置
    if [ -f "$CONFIG_FILE" ]; then
        clear_screen
        show_header
        echo -e "${YELLOW}检测到现有配置文件${NC}"
        echo ""
        echo -e "${CYAN}是否重新配置? 现有配置将被备份 (y/n): ${NC}"
        read -r overwrite
        
        case $overwrite in
            [Nn]* ) 
                echo -e "${GREEN}保持现有配置${NC}"
                exit 0
                ;;
        esac
    fi
    
    # 执行配置步骤
    select_deploy_type
    select_package_manager
    select_static_server
    configure_project
    configure_server
    configure_nginx
    configure_health_check
    
    # 显示摘要并确认
    while ! show_summary; do
        echo -e "${YELLOW}重新配置...${NC}"
        sleep 1
    done
    
    # 生成配置文件
    generate_config
    
    # 显示下一步
    show_next_steps
}

# 运行主函数
main "$@" 