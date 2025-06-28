#!/bin/bash

# 服务器端部署脚本
# 功能：部署应用、启动服务、监控和自动重启

# 启用严格错误检查
set -euo pipefail

# 加载配置文件
CONFIG_FILE="/root/script/config.conf"
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

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 彩色输出函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log "INFO: $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "SUCCESS: $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "WARNING: $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR: $1"
}

# 检查并杀死占用端口的进程
kill_port_process() {
    local port=$1
    log_info "检查端口 $port 的占用情况..."
    
    # 使用多种方法查找进程
    local pids=""
    
    # 方法1: 使用lsof
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -t -i :$port 2>/dev/null || true)
    fi
    
    # 方法2: 使用netstat（如果lsof没找到进程）
    if [ -z "$pids" ] && command -v netstat >/dev/null 2>&1; then
        pids=$(netstat -tulnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d/ -f1 | grep -v '-' || true)
    fi
    
    if [ -n "$pids" ]; then
        log_warning "发现占用端口 $port 的进程: $pids"
        for pid in $pids; do
            if kill -9 "$pid" 2>/dev/null; then
                log_success "成功终止进程 $pid"
            else
                log_error "终止进程 $pid 失败"
            fi
        done
        sleep 2  # 等待进程完全终止
    else
        log_info "端口 $port 未被占用"
    fi
}

# 检测部署类型
detect_deploy_type() {
    local build_path="$REMOTE_PROJECT_DIR/build"
    
    if [ "$DEPLOY_TYPE" = "auto" ]; then
        if [ -f "$build_path/package.json" ]; then
            echo "nodejs"
        else
            echo "static"
        fi
    else
        echo "$DEPLOY_TYPE"
    fi
}

# 部署应用
deploy_app() {
    log_info "开始部署应用..."
    
    # 检查 build.zip 是否存在
    if [ ! -f "$REMOTE_PROJECT_DIR/$ZIP_FILE" ]; then
        log_error "未找到 $ZIP_FILE 文件"
        return 1
    fi
    
    # 进入项目目录
    cd "$REMOTE_PROJECT_DIR" || {
        log_error "无法进入项目目录: $REMOTE_PROJECT_DIR"
        return 1
    }
    
    # 备份旧版本（如果存在）
    for backup_dir in "build" "out"; do
        if [ -d "$backup_dir" ]; then
            log_info "备份旧版本 ($backup_dir)..."
            rm -rf "${backup_dir}.backup" 2>/dev/null || true
            mv "$backup_dir" "${backup_dir}.backup" || log_warning "备份 $backup_dir 失败，继续部署..."
        fi
    done
    
    # 解压新版本
    log_info "解压新版本..."
    if ! unzip -o "$ZIP_FILE"; then
        log_error "解压失败"
        # 如果有备份，尝试恢复
        for backup_dir in "build.backup" "out.backup"; do
            if [ -d "$backup_dir" ]; then
                log_info "尝试恢复备份版本 ($backup_dir)..."
                mv "$backup_dir" "${backup_dir%.backup}"
            fi
        done
        return 1
    fi
    
    # 检查解压后的目录（优先检查out，然后检查build）
    local app_dir=""
    if [ -d "$REMOTE_PROJECT_DIR/out" ]; then
        app_dir="$REMOTE_PROJECT_DIR/out"
        log_info "发现 out 目录，使用该目录作为应用根目录"
    elif [ -d "$REMOTE_PROJECT_DIR/build" ]; then
        app_dir="$REMOTE_PROJECT_DIR/build" 
        log_info "发现 build 目录，使用该目录作为应用根目录"
    else
        log_error "解压后未找到 out 或 build 目录"
        return 1
    fi
    
    cd "$app_dir" || {
        log_error "无法进入应用目录: $app_dir"
        return 1
    }
    
    # 检测部署类型
    local detected_type=$(detect_deploy_type)
    log_info "检测到部署类型: $detected_type"
    
    if [ "$detected_type" = "nodejs" ]; then
        # Node.js 应用部署
        if [ ! -f "package.json" ]; then
            log_error "Node.js模式下package.json文件不存在"
            return 1
        fi
        
        # 安装依赖
        log_info "安装Node.js依赖..."
        if ! $PACKAGE_MANAGER install; then
            log_error "依赖安装失败"
            return 1
        fi
        log_success "Node.js应用部署完成"
        
    elif [ "$detected_type" = "static" ]; then
        # 静态文件部署
        log_info "检测为静态文件部署，无需安装依赖"
        
        # 检查是否有index.html或其他静态文件
        if [ ! -f "index.html" ] && [ -z "$(find . -name "*.html" -o -name "*.js" -o -name "*.css" | head -1)" ]; then
            log_warning "未检测到常见的静态文件（index.html等），请确认部署内容正确"
        fi
        log_success "静态文件部署完成"
        
    else
        log_error "不支持的部署类型: $detected_type"
        return 1
    fi
    
    # 清理部署文件
    rm -f "$REMOTE_PROJECT_DIR/$ZIP_FILE"
    rm -rf "$REMOTE_PROJECT_DIR/build.backup" "$REMOTE_PROJECT_DIR/out.backup" 2>/dev/null || true
    
    log_success "应用部署完成"
    return 0
}

# 启动应用
start_app() {
    log_info "启动应用..."
    
    # 检查应用目录（优先检查out，然后检查build）
    local app_dir=""
    if [ -d "$REMOTE_PROJECT_DIR/out" ]; then
        app_dir="$REMOTE_PROJECT_DIR/out"
    elif [ -d "$REMOTE_PROJECT_DIR/build" ]; then
        app_dir="$REMOTE_PROJECT_DIR/build"
    else
        log_error "未找到应用目录 (out 或 build)"
        return 1
    fi
    
    cd "$app_dir" || {
        log_error "无法进入应用目录: $app_dir"
        return 1
    }
    
    # 终止可能存在的旧进程
    kill_port_process "$SERVICE_PORT"
    
    # 检测部署类型
    local detected_type=$(detect_deploy_type)
    log_info "启动 $detected_type 类型的应用..."
    
    local app_pid
    local log_file="/var/log/${SERVICE_NAME}.log"
    
    if [ "$detected_type" = "nodejs" ]; then
        # Node.js 应用启动
        log_info "在端口 $SERVICE_PORT 启动Node.js应用 $SERVICE_NAME..."
        nohup $PACKAGE_MANAGER start > "$log_file" 2>&1 &
        app_pid=$!
        
    elif [ "$detected_type" = "static" ]; then
        # 静态文件服务启动
        log_info "在端口 $SERVICE_PORT 启动静态文件服务器..."
        
        # 使用配置中的静态服务器命令，如果没有配置则使用默认值
        local static_cmd="${STATIC_SERVER_COMMAND:-python3 -m http.server}"
        local static_log="${STATIC_SERVER_LOG:-/var/log/${SERVICE_NAME}-server.log}"
        
        # 启动静态文件服务器
        nohup $static_cmd $SERVICE_PORT > "$static_log" 2>&1 &
        app_pid=$!
        log_file="$static_log"
        
    else
        log_error "不支持的应用类型: $detected_type"
        return 1
    fi
    
    # 保存PID
    echo $app_pid > "/var/run/${SERVICE_NAME}.pid"
    
    # 等待启动
    sleep 3
    
    # 检查进程是否还在运行
    if kill -0 $app_pid 2>/dev/null; then
        log_success "$detected_type 应用启动成功，PID: $app_pid"
        log_info "日志文件: $log_file"
        return 0
    else
        log_error "$detected_type 应用启动失败"
        # 显示启动日志帮助调试
        if [ -f "$log_file" ]; then
            log_error "启动日志:"
            tail -10 "$log_file" | while read line; do
                log_error "  $line"
            done
        fi
        return 1
    fi
}

# 检查应用状态
check_app_status() {
    local pid_file="/var/run/${SERVICE_NAME}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # 应用正在运行
        fi
    fi
    
    # 检查端口是否被占用
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :$SERVICE_PORT >/dev/null 2>&1; then
            return 0  # 端口被占用，可能应用在运行
        fi
    fi
    
    return 1  # 应用未运行
}

# 配置Nginx反向代理
configure_nginx() {
    if [ "$ENABLE_NGINX" != "true" ]; then
        log_info "跳过Nginx配置 (未启用)"
        return 0
    fi
    
    log_info "开始配置Nginx反向代理..."
    
    # 检查Nginx是否已安装
    if ! command -v nginx >/dev/null 2>&1; then
        log_warning "Nginx未安装，正在尝试安装..."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y nginx
        elif command -v yum >/dev/null 2>&1; then
            yum install -y nginx
        else
            log_error "无法自动安装Nginx，请手动安装"
            return 1
        fi
    fi
    
    # 确保Nginx目录存在
    mkdir -p "$NGINX_CONFIG_PATH" "$NGINX_ENABLED_PATH"
    
    # 生成Nginx配置文件
    local nginx_config_file="$NGINX_CONFIG_PATH/${SERVICE_NAME}.conf"
    log_info "生成Nginx配置文件: $nginx_config_file"
    
    cat > "$nginx_config_file" << EOF
# Nginx配置文件 - 由自动部署系统生成
# 生成时间: $(date)
# 服务名称: $SERVICE_NAME
# 域名: $DOMAIN_NAME

server {
    listen $NGINX_PORT;
    server_name $DOMAIN_NAME;
    
    # 日志配置
    access_log /var/log/nginx/${SERVICE_NAME}_access.log;
    error_log /var/log/nginx/${SERVICE_NAME}_error.log;
    
    # 反向代理配置
    location / {
        proxy_pass http://localhost:$INTERNAL_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://localhost:$INTERNAL_PORT/health;
        access_log off;
    }
    
    # 静态文件优化（如果是静态文件服务）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$INTERNAL_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # 创建符号链接启用站点
    local enabled_link="$NGINX_ENABLED_PATH/${SERVICE_NAME}.conf"
    if [ -L "$enabled_link" ]; then
        rm -f "$enabled_link"
    fi
    ln -s "$nginx_config_file" "$enabled_link"
    log_success "Nginx配置文件已启用"
    
    # 删除默认配置（如果存在）
    if [ -f "$NGINX_ENABLED_PATH/default" ]; then
        rm -f "$NGINX_ENABLED_PATH/default"
        log_info "已删除默认Nginx配置"
    fi
    
    # 测试Nginx配置
    log_info "测试Nginx配置..."
    if nginx -t; then
        log_success "Nginx配置测试通过"
    else
        log_error "Nginx配置测试失败"
        return 1
    fi
    
    # 重新加载Nginx
    log_info "重新加载Nginx配置..."
    if systemctl reload nginx; then
        log_success "Nginx配置重新加载成功"
    else
        log_warning "Nginx重新加载失败，尝试重启..."
        if systemctl restart nginx; then
            log_success "Nginx重启成功"
        else
            log_error "Nginx重启失败"
            return 1
        fi
    fi
    
    # 确保Nginx开机自启
    systemctl enable nginx 2>/dev/null || true
    
    log_success "Nginx反向代理配置完成"
    log_info "域名: $DOMAIN_NAME"
    log_info "监听端口: $NGINX_PORT"
    log_info "代理端口: $INTERNAL_PORT"
    
    return 0
}

# 检查Nginx状态
check_nginx_status() {
    if [ "$ENABLE_NGINX" != "true" ]; then
        return 0
    fi
    
    if systemctl is-active --quiet nginx; then
        log_info "Nginx运行正常"
        return 0
    else
        log_warning "Nginx未运行"
        return 1
    fi
}

# 监控和重启功能
monitor_app() {
    log_info "开始监控应用 $SERVICE_NAME..."
    
    local restart_count=0
    
    while true; do
        if check_app_status; then
            log_info "应用运行正常"
            restart_count=0  # 重置重启计数
        else
            restart_count=$((restart_count + 1))
            log_warning "应用未运行，尝试重启 (第 $restart_count 次)"
            
            if [ $restart_count -le $MAX_RESTART_ATTEMPTS ]; then
                if start_app; then
                    log_success "应用重启成功"
                    restart_count=0
                else
                    log_error "应用重启失败"
                fi
            else
                log_error "重启次数超过限制 ($MAX_RESTART_ATTEMPTS)，停止监控"
                break
            fi
        fi
        
        sleep "$MONITOR_INTERVAL"
    done
}

# 主函数
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            log_info "执行完整部署流程..."
            if deploy_app && start_app && configure_nginx; then
                log_success "部署完成"
            else
                log_error "部署失败"
                exit 1
            fi
            ;;
        "start")
            log_info "启动应用..."
            start_app
            ;;
        "stop")
            log_info "停止应用..."
            kill_port_process "$SERVICE_PORT"
            rm -f "/var/run/${SERVICE_NAME}.pid"
            ;;
        "restart")
            log_info "重启应用..."
            kill_port_process "$SERVICE_PORT"
            rm -f "/var/run/${SERVICE_NAME}.pid"
            start_app
            ;;
        "status")
            if check_app_status; then
                log_success "应用正在运行"
            else
                log_warning "应用未运行"
            fi
            ;;
        "monitor")
            monitor_app
            ;;
        "nginx-config")
            configure_nginx
            ;;
        "nginx-status")
            check_nginx_status
            ;;
        "nginx-reload")
            if [ "$ENABLE_NGINX" = "true" ]; then
                log_info "重新加载Nginx配置..."
                systemctl reload nginx && log_success "Nginx重新加载成功" || log_error "Nginx重新加载失败"
            else
                log_warning "Nginx未启用"
            fi
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|monitor|nginx-config|nginx-status|nginx-reload}"
            echo "  deploy       - 部署并启动应用"
            echo "  start        - 启动应用"
            echo "  stop         - 停止应用"
            echo "  restart      - 重启应用"
            echo "  status       - 检查应用状态"
            echo "  monitor      - 监控应用并自动重启"
            echo "  nginx-config - 配置Nginx反向代理"
            echo "  nginx-status - 检查Nginx状态"
            echo "  nginx-reload - 重新加载Nginx配置"
            exit 1
            ;;
    esac
}

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 执行主函数
main "$@" 