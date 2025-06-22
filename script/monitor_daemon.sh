#!/bin/bash

# 应用监控守护进程脚本
# 用于持续监控应用状态并自动重启

# 加载配置文件
CONFIG_FILE="/root/script/config.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "错误：配置文件不存在: $CONFIG_FILE"
    exit 1
fi

DAEMON_PID_FILE="/var/run/${SERVICE_NAME}-monitor.pid"
DAEMON_SCRIPT="/root/script/server_deploy.sh"

# 启动监控守护进程
start_daemon() {
    if [ -f "$DAEMON_PID_FILE" ]; then
        local old_pid=$(cat "$DAEMON_PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            echo "监控守护进程已在运行 (PID: $old_pid)"
            return 0
        else
            echo "清理旧的PID文件..."
            rm -f "$DAEMON_PID_FILE"
        fi
    fi
    
    echo "启动监控守护进程..."
    nohup "$DAEMON_SCRIPT" monitor > /var/log/${SERVICE_NAME}-monitor.log 2>&1 &
    local daemon_pid=$!
    echo $daemon_pid > "$DAEMON_PID_FILE"
    
    sleep 2
    if kill -0 "$daemon_pid" 2>/dev/null; then
        echo "监控守护进程启动成功 (PID: $daemon_pid)"
    else
        echo "监控守护进程启动失败"
        rm -f "$DAEMON_PID_FILE"
        return 1
    fi
}

# 停止监控守护进程
stop_daemon() {
    if [ -f "$DAEMON_PID_FILE" ]; then
        local pid=$(cat "$DAEMON_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "停止监控守护进程 (PID: $pid)..."
            kill -TERM "$pid"
            sleep 2
            
            # 如果进程仍在运行，强制杀死
            if kill -0 "$pid" 2>/dev/null; then
                echo "强制停止监控守护进程..."
                kill -9 "$pid"
            fi
            
            rm -f "$DAEMON_PID_FILE"
            echo "监控守护进程已停止"
        else
            echo "监控守护进程未运行"
            rm -f "$DAEMON_PID_FILE"
        fi
    else
        echo "监控守护进程未运行"
    fi
}

# 检查守护进程状态
status_daemon() {
    if [ -f "$DAEMON_PID_FILE" ]; then
        local pid=$(cat "$DAEMON_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "监控守护进程正在运行 (PID: $pid)"
            return 0
        else
            echo "监控守护进程未运行（PID文件存在但进程已停止）"
            rm -f "$DAEMON_PID_FILE"
            return 1
        fi
    else
        echo "监控守护进程未运行"
        return 1
    fi
}

# 重启守护进程
restart_daemon() {
    echo "重启监控守护进程..."
    stop_daemon
    sleep 1
    start_daemon
}

# 主函数
case "${1:-status}" in
    "start")
        start_daemon
        ;;
    "stop")
        stop_daemon
        ;;
    "restart")
        restart_daemon
        ;;
    "status")
        status_daemon
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        echo "  start   - 启动监控守护进程"
        echo "  stop    - 停止监控守护进程"
        echo "  restart - 重启监控守护进程"
        echo "  status  - 检查守护进程状态"
        exit 1
        ;;
esac 