#!/bin/bash

# =============================================================================
# Docker Compose 自动化部署脚本
# 用法:
#   ./docker_deplay.sh          # 构建镜像、导出、上传并部署 (默认AMD64)
#   ./docker_deplay.sh -arm     # 构建ARM64架构
#   ./docker_deplay.sh -upload  # 跳过构建，仅上传并部署
# =============================================================================

# 配置变量 - 请根据实际情况修改
SERVER_HOST="47.101.218.42"           # 服务器IP地址
SERVER_USER="ecs-user"             # 服务器用户名
SERVER_PASSWORD="123quant-speed"     # 服务器密码
SERVER_PORT="22"                 # SSH端口，默认22

# 项目配置
PROJECT_NAME="ai_memory"         # Docker Compose 项目名称
TAR_FILE="ai_memory_images.tar"  # 镜像压缩包文件名
REMOTE_DIR="~/${PROJECT_NAME}" # 远程部署目录

# 镜像列表 (需与 docker-compose.yml 中的 image 字段一致)
IMAGES=("tangledup-ai-frontend:latest" "tangledup-ai-relay:latest")

# 架构相关变量
PLATFORM="linux/amd64"           # 默认架构
ARCH_SUFFIX="-amd64"             # 架构后缀

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    for cmd in docker sshpass; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd 未安装，请先安装"
            exit 1
        fi
    done
    log_success "依赖检查完成"
}

# 加载 .env 文件
load_env() {
    if [ -f ".env" ]; then
        log_info "加载 .env 环境变量..."
        export $(grep -v '^#' .env | xargs)
    else
        log_warning ".env 文件不存在，将使用默认环境变量或空值"
    fi
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -amd)
                PLATFORM="linux/amd64"
                ARCH_SUFFIX="-amd64"
                log_info "设置目标架构为 AMD64"
                shift ;;
            -arm)
                PLATFORM="linux/arm64"
                ARCH_SUFFIX="-arm64"
                log_info "设置目标架构为 ARM64"
                shift ;;
            -upload)
                UPLOAD_ONLY=true
                log_info "设置为仅上传模式"
                shift ;;
            *)
                log_error "未知参数: $1"
                exit 1 ;;
        esac
    done
    TAR_FILE="ai_memory_images${ARCH_SUFFIX}.tar"

    # 智能检测：如果是仅上传模式且默认文件不存在，尝试查找其他架构的文件
    if [ "$UPLOAD_ONLY" = true ] && [ ! -f "$TAR_FILE" ]; then
        if [ "$PLATFORM" = "linux/amd64" ] && [ -f "ai_memory_images-arm64.tar" ]; then
            log_warning "未找到 AMD64 镜像包 ($TAR_FILE)，但发现了 ARM64 镜像包。"
            log_warning "自动切换为 ARM64 模式进行上传..."
            PLATFORM="linux/arm64"
            ARCH_SUFFIX="-arm64"
            TAR_FILE="ai_memory_images-arm64.tar"
        elif [ "$PLATFORM" = "linux/arm64" ] && [ -f "ai_memory_images-amd64.tar" ]; then
            log_warning "未找到 ARM64 镜像包 ($TAR_FILE)，但发现了 AMD64 镜像包。"
            log_warning "自动切换为 AMD64 模式进行上传..."
            PLATFORM="linux/amd64"
            ARCH_SUFFIX="-amd64"
            TAR_FILE="ai_memory_images-amd64.tar"
        fi
    fi
}

# 构建 Docker 镜像
build_images() {
    log_info "开始构建 Docker 镜像 (架构: $PLATFORM)..."
    
    # 使用 docker buildx 构建多架构镜像并加载到本地 docker daemon (如果是当前架构)
    # 或者直接 build (如果不需要多架构支持，直接用 docker compose build 也可以，但为了指定 platform，我们显式 build)
    
    # 1. 设置 docker buildx
    if ! docker buildx inspect mybuilder > /dev/null 2>&1; then
        docker buildx create --name mybuilder --use || true
    else
        docker buildx use mybuilder
    fi

    # 2. 构建 Frontend
    log_info "构建 Frontend..."
    
    # 确定 WebSocket 地址
    # 如果未设置 REACT_APP_REALTIME_ENDPOINT，则默认使用 wss://me.tangledup-ai.com/step-realtime (适配生产环境)
    REALTIME_ENDPOINT=${REACT_APP_REALTIME_ENDPOINT:-wss://me.tangledup-ai.com/step-realtime}
    
    # 确定 API KEY
    # 如果 .env 中没有设置，使用硬编码的默认值 (User Requested)
    STEP_API_KEY=${REACT_APP_STEP_API_KEY:-2cWTfZARIvc6QkurxSHKyXmBPt6o10f5psYU23XKuJHADzMQkwWnlo9rJsEi1VNWG}
    
    docker buildx build --platform "$PLATFORM" \
        -t "${IMAGES[0]}" \
        --load \
        --build-arg REACT_APP_API_URL=${REACT_APP_API_URL:-https://data.tangledup-ai.com} \
        --build-arg REACT_APP_STEP_API_KEY=${STEP_API_KEY} \
        --build-arg REACT_APP_REALTIME_ENDPOINT=${REALTIME_ENDPOINT} \
        -f Dockerfile . \
        || { log_error "Frontend 构建失败"; exit 1; }

    # 3. 构建 Relay
    log_info "构建 Relay..."
    docker buildx build --platform "$PLATFORM" \
        -t "${IMAGES[1]}" \
        --load \
        -f Step-Realtime-Console/Dockerfile Step-Realtime-Console \
        || { log_error "Relay 构建失败"; exit 1; }

    log_success "镜像构建完成"

    # 4. 导出镜像
    log_info "正在导出镜像到 ${TAR_FILE}..."
    docker save -o "$TAR_FILE" "${IMAGES[@]}"
    
    if [ $? -eq 0 ]; then
        log_success "镜像导出完成: ${TAR_FILE}"
    else
        log_error "镜像导出失败"
        exit 1
    fi
}

# 上传文件到服务器
upload_to_server() {
    log_info "准备上传文件..."
    
    # 创建远程目录
    sshpass -p "$SERVER_PASSWORD" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${REMOTE_DIR}"
    
    # 上传 tar 文件
    log_info "上传镜像包 (可能需要几分钟)..."
    sshpass -p "$SERVER_PASSWORD" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$TAR_FILE" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/" || { log_error "镜像上传失败"; exit 1; }
    
    # 上传 docker-compose.yml
    log_info "上传 docker-compose.yml..."
    sshpass -p "$SERVER_PASSWORD" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "docker-compose.yml" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/" || { log_error "配置文件上传失败"; exit 1; }
    
    # 上传 .env (如果存在)
    if [ -f ".env" ]; then
        log_info "上传 .env..."
        sshpass -p "$SERVER_PASSWORD" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no ".env" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/"
    fi

    log_success "文件上传成功"
}

# 在服务器上部署
deploy_on_server() {
    log_info "开始在服务器上部署..."
    
    # 构造清理镜像的命令
    CLEAN_IMAGES_CMD=""
    for img in "${IMAGES[@]}"; do
        CLEAN_IMAGES_CMD="${CLEAN_IMAGES_CMD}
        if \$SUDO docker image inspect $img >/dev/null 2>&1; then
            echo \"[INFO] 发现同名镜像，正在删除: $img\"
            \$SUDO docker rmi -f $img || true
        fi"
    done

    sshpass -p "$SERVER_PASSWORD" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" << EOF
        set -e
        cd ${REMOTE_DIR}
        
        # 使用 sudo 如果需要，这里假设用户有 docker 权限或需要 sudo
        if command -v sudo >/dev/null; then SUDO="sudo"; else SUDO=""; fi
        
        # 查找 docker compose
        if docker compose version >/dev/null 2>&1; then
            DOCKER_COMPOSE="docker compose"
        elif command -v docker-compose >/dev/null; then
            DOCKER_COMPOSE="docker-compose"
        else
            echo "[ERROR] 未找到 docker compose 或 docker-compose"
            exit 1
        fi

        echo "[INFO] 停止旧服务..."
        # 尝试停止并删除容器（忽略错误）
        \$SUDO \$DOCKER_COMPOSE down --rmi local --volumes || true
        
        echo "[INFO] 清理旧镜像..."
        ${CLEAN_IMAGES_CMD}
        
        echo "[INFO] 加载 Docker 镜像..."
        \$SUDO docker load -i ${TAR_FILE}
        
        echo "[INFO] 启动服务..."
        \$SUDO \$DOCKER_COMPOSE up -d --no-build
        
        echo "[INFO] 清理镜像包..."
        rm -f ${TAR_FILE}
        
        echo "[SUCCESS] 服务已启动"
        \$SUDO \$DOCKER_COMPOSE ps
EOF

    if [ $? -eq 0 ]; then
        log_success "服务器部署完成"
    else
        log_error "服务器部署失败"
        exit 1
    fi
}

# 清理本地文件
cleanup_local() {
    if [ -f "$TAR_FILE" ]; then
        rm -f "$TAR_FILE"
        log_info "已清理本地临时文件"
    fi
}

# 主函数
main() {
    load_env
    parse_arguments "$@"
    
    if [ "$UPLOAD_ONLY" != true ]; then
        check_dependencies
        build_images
    fi
    
    upload_to_server
    deploy_on_server
    cleanup_local
    
    echo ""
    log_success "全部流程执行完毕！"
    echo "访问地址: http://${SERVER_HOST}:3000"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
