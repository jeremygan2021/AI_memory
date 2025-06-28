#!/bin/bash

# 部署管理工具
# 提供统一的部署管理接口

# 获取脚本所在目录
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载配置文件
CONFIG_FILE="$SCRIPT_PATH/config.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "错误：配置文件不存在: $CONFIG_FILE"
    exit 1
fi

# 定义颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示使用帮助
show_help() {
    echo -e "${BLUE}部署管理工具使用说明${NC}"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "本地命令："
    echo "  deploy              - 执行完整部署流程（构建+上传+部署）"
    echo "  build               - 仅构建项目"
    echo "  upload              - 仅上传文件到服务器"
    echo "  check               - 检查本地环境和依赖"
    echo ""
    echo "远程服务器命令："
    echo "  remote-deploy       - 仅执行远程部署"
    echo "  remote-start        - 启动远程应用"
    echo "  remote-stop         - 停止远程应用"
    echo "  remote-restart      - 重启远程应用"
    echo "  remote-status       - 检查远程应用状态"
    echo "  remote-logs         - 查看远程应用日志"
    echo ""
    echo "监控命令："
    echo "  monitor-start       - 启动监控守护进程"
    echo "  monitor-stop        - 停止监控守护进程"
    echo "  monitor-status      - 检查监控守护进程状态"
    echo "  monitor-restart     - 重启监控守护进程"
    echo ""
    echo "Nginx命令："
    echo "  nginx-config        - 配置Nginx反向代理"
    echo "  nginx-status        - 检查Nginx状态"
    echo "  nginx-reload        - 重新加载Nginx配置"
    echo ""
    echo "工具命令："
    echo "  config              - 显示当前配置"
    echo "  setup               - 运行配置向导"
    echo "  health              - 执行健康检查"
    echo "  detect-type         - 检测远程部署类型"
    echo "  help                - 显示此帮助信息"
    echo ""
    echo "示例："
    echo "  $0 deploy           # 完整部署"
    echo "  $0 remote-status    # 检查服务状态"
    echo "  $0 monitor-start    # 启动监控"
}

# 显示配置信息
show_config() {
    echo -e "${BLUE}当前配置信息：${NC}"
    echo "构建目录: $BUILD_DIR"
    echo "构建命令: $BUILD_COMMAND"
    echo "包管理器: $PACKAGE_MANAGER"
    echo "部署类型: $DEPLOY_TYPE"
    echo "服务器: $SERVER"
    echo "远程项目目录: $REMOTE_PROJECT_DIR"
    echo "远程脚本目录: $REMOTE_SCRIPT_DIR"
    echo "服务端口: $SERVICE_PORT"
    echo "服务名称: $SERVICE_NAME"
    echo "目标URL: $TARGET_URL"
    
    if [ "$DEPLOY_TYPE" = "static" ] || [ "$DEPLOY_TYPE" = "auto" ]; then
        echo "静态服务器命令: $STATIC_SERVER_COMMAND"
    fi
    
    echo ""
    echo "Nginx配置:"
    echo "  启用状态: ${ENABLE_NGINX:-false}"
    if [ "${ENABLE_NGINX:-false}" = "true" ]; then
        echo "  域名: ${DOMAIN_NAME:-未配置}"
        echo "  Nginx端口: ${NGINX_PORT:-80}"
        echo "  内部端口: ${INTERNAL_PORT:-$SERVICE_PORT}"
    fi
}

# 检查本地环境
check_environment() {
    echo -e "${YELLOW}检查本地环境...${NC}"
    
    # 检查必要命令
    commands=("$PACKAGE_MANAGER" "sshpass" "zip" "unzip" "curl")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            echo -e "${RED}❌ 错误: 未找到 $cmd 命令${NC}"
            return 1
        fi
    done
    
    # 检查构建目录
    if [ ! -d "$BUILD_DIR" ]; then
        echo -e "${RED}❌ 错误: 构建目录不存在: $BUILD_DIR${NC}"
        return 1
    fi
    
    # 检查脚本文件
    REQUIRED_FILES=("$SCRIPT_PATH/server_deploy.sh" "$SCRIPT_PATH/monitor_daemon.sh" "$SCRIPT_PATH/config.conf")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 错误: 必需文件不存在: $file${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
    return 0
}

# 执行远程命令
execute_remote_command() {
    local command="$1"
    echo -e "${YELLOW}执行远程命令: $command${NC}"
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "$command"
}

# 健康检查
health_check() {
    echo -e "${YELLOW}执行健康检查...${NC}"
    
    if [ -n "$TARGET_URL" ]; then
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" || echo "000")
        
        if [ "$http_code" -eq 200 ]; then
            echo -e "${GREEN}✅ 服务健康检查通过 (状态码: $http_code)${NC}"
            
            if [ -n "$HEALTH_CHECK_KEYWORD" ]; then
                local page_content
                page_content=$(curl -s "$TARGET_URL" | head -n 100)
                if echo "$page_content" | grep -q "$HEALTH_CHECK_KEYWORD"; then
                    echo -e "${GREEN}✅ 关键内容验证通过${NC}"
                else
                    echo -e "${YELLOW}⚠️ 未找到关键内容 '$HEALTH_CHECK_KEYWORD'${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ 服务健康检查失败 (状态码: $http_code)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ 未配置目标URL，跳过健康检查${NC}"
    fi
}

# 主函数
main() {
    local command="${1:-help}"
    
    case "$command" in
        "deploy")
            echo -e "${BLUE}开始完整部署流程...${NC}"
            "$SCRIPT_PATH/local_deploy.sh"
            ;;
        "build")
            echo -e "${BLUE}开始构建项目...${NC}"
            cd "$BUILD_DIR" && $BUILD_COMMAND
            ;;
        "upload")
            echo -e "${BLUE}开始上传文件...${NC}"
            # 这里可以提取upload逻辑到单独函数
            echo "请使用 deploy 命令执行完整流程"
            ;;
        "check")
            check_environment
            ;;
        "remote-deploy")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh deploy"
            ;;
        "remote-start")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh start"
            ;;
        "remote-stop")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh stop"
            ;;
        "remote-restart")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh restart"
            ;;
        "remote-status")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh status"
            ;;
        "remote-logs")
            execute_remote_command "tail -f /var/log/${SERVICE_NAME}.log"
            ;;
        "monitor-start")
            execute_remote_command "$REMOTE_SCRIPT_DIR/monitor_daemon.sh start"
            ;;
        "monitor-stop")
            execute_remote_command "$REMOTE_SCRIPT_DIR/monitor_daemon.sh stop"
            ;;
        "monitor-status")
            execute_remote_command "$REMOTE_SCRIPT_DIR/monitor_daemon.sh status"
            ;;
        "monitor-restart")
            execute_remote_command "$REMOTE_SCRIPT_DIR/monitor_daemon.sh restart"
            ;;
        "nginx-config")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh nginx-config"
            ;;
        "nginx-status")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh nginx-status"
            ;;
        "nginx-reload")
            execute_remote_command "$REMOTE_SCRIPT_DIR/server_deploy.sh nginx-reload"
            ;;
        "config")
            show_config
            ;;
        "setup")
            echo -e "${BLUE}启动配置向导...${NC}"
            "$SCRIPT_PATH/setup_wizard.sh"
            ;;
        "health")
            health_check
            ;;
        "detect-type")
            execute_remote_command "cd $REMOTE_PROJECT_DIR/build 2>/dev/null && if [ -f package.json ]; then echo 'Node.js应用 (发现package.json)'; else echo '静态文件 (未发现package.json)'; fi"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}错误：未知命令 '$command'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 