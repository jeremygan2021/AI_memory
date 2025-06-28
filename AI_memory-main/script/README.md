# 模块化自动部署系统

一个完整的、模块化的自动部署解决方案，支持构建、上传、部署、监控和自动重启功能。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐
│   本地环境      │    │   服务器环境    │
├─────────────────┤    ├─────────────────┤
│ local_deploy.sh │───▶│ server_deploy.sh│
│ deploy_manager  │    │ monitor_daemon  │
│ config.conf     │    │ config.conf     │
└─────────────────┘    └─────────────────┘
```

## 📁 文件说明

### 核心脚本
- **`config.conf`** - 统一配置文件，所有参数在此管理
- **`setup_wizard.sh`** - 交互式配置向导（首次使用推荐）
- **`local_deploy.sh`** - 本地部署脚本（构建+上传+部署）
- **`server_deploy.sh`** - 服务器部署脚本（部署+启动+监控）
- **`monitor_daemon.sh`** - 监控守护进程管理
- **`deploy_manager.sh`** - 部署管理工具（统一入口）

### 旧文件（已优化）
- **`server_depoly.sh`** - 旧的服务器脚本（已被server_deploy.sh替代）

## ⚙️ 配置说明

### 🎯 配置向导（推荐）

首次使用时，强烈推荐使用交互式配置向导：

```bash
# 运行配置向导
./deploy_manager.sh setup
```

配置向导将引导你完成以下设置：
1. **部署类型选择** - Node.js应用、静态文件或自动检测
2. **包管理器选择** - npm、yarn、bun、pnpm
3. **静态服务器选择** - Python HTTP Server、npx serve、http-server等
4. **项目信息配置** - 项目路径、服务名称、端口等
5. **服务器信息配置** - 服务器地址、密码、远程路径等
6. **Nginx反向代理配置** - 域名、端口映射、自动配置等
7. **健康检查配置** - URL验证、关键词检查等

### 📝 手动配置

也可以直接编辑 `config.conf` 文件来适配你的项目：

```bash
# ==================== 本地配置 ====================
BUILD_DIR="/path/to/your/project"           # 项目构建目录
BUILD_COMMAND="npm run build"               # 构建命令
PACKAGE_MANAGER="npm"                       # 包管理器

# ==================== 服务器配置 ====================
SERVER="user@your-server.com"               # 服务器地址
PASSWORD="your-password"                    # 服务器密码
REMOTE_PROJECT_DIR="/path/to/remote/project" # 远程项目目录
REMOTE_SCRIPT_DIR="/path/to/remote/scripts" # 远程脚本目录

# ==================== 服务配置 ====================
SERVICE_PORT=3000                           # 应用端口
SERVICE_NAME="your-app-name"                # 服务名称

# ==================== Nginx配置 ====================
ENABLE_NGINX="true"                          # 启用Nginx反向代理
DOMAIN_NAME="myapp.tangledup-ai.com"        # 域名配置
NGINX_PORT=80                               # Nginx监听端口
INTERNAL_PORT=3000                          # 内部应用端口

# ==================== 健康检查配置 ====================
TARGET_URL="https://your-domain.com"        # 健康检查URL
HEALTH_CHECK_KEYWORD="关键词"               # 页面关键词验证
```

## 🚀 快速开始

### 0. 环境准备
chmod +x setup_wizard.sh

### 1. 完整部署（推荐）
```bash
# 使用管理工具执行完整部署
./deploy_manager.sh deploy

# 或者直接使用部署脚本
./local_deploy.sh
```

### 2. 检查环境
```bash
./deploy_manager.sh check
```

### 3. 查看配置
```bash
./deploy_manager.sh config
```

## 📋 命令参考

### 本地命令
```bash
./deploy_manager.sh deploy              # 完整部署流程
./deploy_manager.sh build               # 仅构建项目
./deploy_manager.sh check               # 检查本地环境
```

### 远程服务器命令
```bash
./deploy_manager.sh remote-deploy       # 仅执行远程部署
./deploy_manager.sh remote-start        # 启动远程应用
./deploy_manager.sh remote-stop         # 停止远程应用
./deploy_manager.sh remote-restart      # 重启远程应用
./deploy_manager.sh remote-status       # 检查应用状态
./deploy_manager.sh remote-logs         # 查看应用日志
```

### 监控命令
```bash
./deploy_manager.sh monitor-start       # 启动监控守护进程
./deploy_manager.sh monitor-stop        # 停止监控守护进程
./deploy_manager.sh monitor-status      # 检查监控状态
./deploy_manager.sh monitor-restart     # 重启监控守护进程
```

### Nginx命令
```bash
./deploy_manager.sh nginx-config        # 配置Nginx反向代理
./deploy_manager.sh nginx-status        # 检查Nginx状态
./deploy_manager.sh nginx-reload        # 重新加载Nginx配置
```

### 工具命令
```bash
./deploy_manager.sh setup               # 运行配置向导
./deploy_manager.sh health              # 健康检查
./deploy_manager.sh config              # 显示配置
./deploy_manager.sh detect-type         # 检测远程部署类型
./deploy_manager.sh help                # 显示帮助
```

## 🔄 部署流程

### 完整流程
1. **环境检查** - 检查本地依赖和文件
2. **项目构建** - 执行构建命令
3. **文件压缩** - 压缩构建结果
4. **脚本上传** - 上传部署脚本到服务器
5. **文件上传** - 上传构建文件到服务器
6. **远程部署** - 在服务器上部署应用
7. **服务启动** - 启动应用服务
8. **监控启动** - 启动监控守护进程
9. **健康检查** - 验证服务是否正常
10. **清理文件** - 清理本地临时文件

### 监控功能
- **自动重启** - 应用异常时自动重启
- **日志记录** - 详细的操作日志
- **状态检查** - 定期检查应用状态
- **故障恢复** - 多次重启尝试机制

### Nginx反向代理功能
- **自动配置** - 自动生成Nginx配置文件并启用
- **域名支持** - 支持自定义域名访问（如：myapp.tangledup-ai.com）
- **端口映射** - 将80端口请求代理到应用端口
- **性能优化** - 内置缓存、压缩、静态文件优化
- **日志记录** - 独立的访问和错误日志
- **配置验证** - 自动测试配置文件有效性
- **服务管理** - 支持重新加载、重启等操作

## 🛠️ 自定义适配

### 支持不同的部署类型

系统自动检测部署类型，也可以手动配置：

```bash
# 自动检测（推荐）
DEPLOY_TYPE="auto"

# Node.js 应用
DEPLOY_TYPE="nodejs"
PACKAGE_MANAGER="npm"
BUILD_COMMAND="npm run build"

# 静态文件（如React/Vue构建产物）
DEPLOY_TYPE="static"
STATIC_SERVER_COMMAND="python3 -m http.server"

# yarn 项目
PACKAGE_MANAGER="yarn"
BUILD_COMMAND="yarn build"

# bun 项目
PACKAGE_MANAGER="bun" 
BUILD_COMMAND="bun run build"
```

### 支持不同的项目类型
```bash
# React 项目
BUILD_DIR="/path/to/react-app"
BUILD_COMMAND="npm run build"

# Vue 项目
BUILD_DIR="/path/to/vue-app"
BUILD_COMMAND="npm run build"

# Next.js 项目
BUILD_DIR="/path/to/nextjs-app"
BUILD_COMMAND="npm run build"
```

### 支持不同的服务器环境
```bash
# 开发环境
SERVER="dev@dev-server.com"
SERVICE_PORT=3000

# 生产环境
SERVER="prod@prod-server.com"
SERVICE_PORT=80
```

## 🔐 安全建议

1. **使用SSH密钥** - 推荐使用SSH密钥而不是密码
2. **权限控制** - 确保脚本文件有适当的执行权限
3. **配置保护** - 不要将包含敏感信息的config.conf提交到版本控制
4. **网络安全** - 在生产环境中使用VPN或防火墙保护

## 🐛 故障排除

### 常见问题

1. **权限错误**
   ```bash
   chmod +x *.sh
   ```

2. **依赖缺失**
   ```bash
   # macOS
   brew install sshpass

   # Ubuntu
   sudo apt-get install sshpass
   ```

3. **网络连接问题**
   ```bash
   # 测试SSH连接
   ssh user@server

   # 测试网络连接
   curl -I https://your-domain.com
   ```

4. **服务启动失败**
   ```bash
   # 查看服务日志
   ./deploy_manager.sh remote-logs

   # 检查服务状态
   ./deploy_manager.sh remote-status
   
   # 检测部署类型
   ./deploy_manager.sh detect-type
   ```

5. **package.json文件不存在错误**
   ```bash
   # 如果是静态文件项目，设置部署类型为static
   # 编辑config.conf文件：
   DEPLOY_TYPE="static"
   
   # 或者使用auto自动检测（推荐）
   DEPLOY_TYPE="auto"
   ```

## 📊 监控日志

### 日志文件位置
- **应用日志**: `/var/log/${SERVICE_NAME}.log`
- **监控日志**: `/var/log/${SERVICE_NAME}-monitor.log`
- **部署日志**: `/var/log/app-monitor.log`

### 查看日志
```bash
# 实时查看应用日志
./deploy_manager.sh remote-logs

# 查看完整日志
ssh user@server "cat /var/log/your-app.log"
```

## 🔄 版本升级

当需要升级部署系统时：

1. 备份现有配置
2. 下载新版本脚本
3. 更新配置文件
4. 重新部署

## 🌐 Nginx使用示例

### 启用Nginx反向代理
```bash
# 1. 在配置向导中启用Nginx
./deploy_manager.sh setup

# 2. 或手动配置Nginx
./deploy_manager.sh nginx-config

# 3. 检查Nginx状态
./deploy_manager.sh nginx-status

# 4. 重新加载Nginx配置
./deploy_manager.sh nginx-reload
```

### 生成的Nginx配置示例
系统会自动在 `/etc/nginx/sites-available/` 创建类似以下的配置：

```nginx
server {
    listen 80;
    server_name myapp.tangledup-ai.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 域名解析设置
1. 在DNS服务商处添加A记录
2. 将域名指向服务器IP
3. 等待DNS生效（通常几分钟到几小时）

## 📞 技术支持

如果遇到问题，请检查：
1. 配置文件是否正确
2. 网络连接是否正常
3. 依赖软件是否安装
4. 日志文件中的错误信息
5. Nginx配置是否有效（`nginx -t`）

---

**注意**: 首次使用前请仔细阅读配置说明，并在测试环境中验证所有功能。 