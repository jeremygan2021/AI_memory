# AI Memory - 智能记忆助手

一个基于React的智能家居管理系统，根据Figma设计稿精心打造的现代化界面。

## 项目功能

### 主页面 (AI管家)
- 智能家居控制面板
- 温度和灯光控制
- 用电量统计图表
- 语音录制功能（支持录音、暂停、停止、播放和历史记录管理）
- 回忆相册功能
- 任务管理和登录系统

### 亲子页面 (Family Page)
- 温馨的橙色粉色主题设计
- 家庭成员管理
- 亲子活动追踪（阅读、游戏、拍照、日程）
- 今日任务清单
- 活动统计和进度显示
- 美好回忆记录
- 快速添加功能

## 页面结构

### 主页布局
- **顶部导航栏**: 包含AI管家logo（可点击切换页面）、搜索栏、通知和设置按钮
- **左侧功能区**: 录制声音（可点击进入录音页面）、回忆相册、时间回溯功能卡片
- **中间控制区**: 温度控制、灯光控制、用电量图表
- **右侧应用区**: 应用图标、事项记录、登录账号

### 亲子页面布局
- **顶部欢迎区**: 温馨标题和家庭成员头像
- **左侧活动栏**: 亲子活动选择和今日任务
- **中间内容区**: 活动统计卡片、活动详情、书籍推荐
- **右侧回忆录**: 美好回忆展示和快速添加功能

## 技术特点

- **响应式设计**: 支持不同设备尺寸
- **现代化UI**: 使用毛玻璃效果和渐变背景
- **动画效果**: 丰富的CSS动画和过渡效果
- **组件化开发**: React函数组件和Hooks
- **语义化标签**: 清晰的HTML结构
- **CSS Grid/Flexbox**: 现代布局技术
- **Web Audio API**: 实现浏览器原生录音功能
- **媒体流处理**: 支持音频录制、暂停、恢复和播放
- **本地存储**: 录音历史记录管理和音频文件处理

## 样式说明

### 主页样式 (App.css)
- 绿色系渐变背景
- 毛玻璃效果卡片
- 悬浮动画和交互效果

### 亲子页面样式 (FamilyPage.css)
- 橙色粉色温馨主题
- 心跳动画和浮动效果
- 渐变按钮和进度条

## 录音功能详细说明

### 功能特性
- **一键录音**: 点击主页左侧"录制我的声音"卡片即可进入录音页面
- **实时控制**: 支持开始、暂停、继续、停止录音操作
- **时长显示**: 实时显示录音时长，格式为MM:SS
- **状态指示**: 可视化录音状态（准备、录音中、已暂停）
- **即时播放**: 录音完成后可立即播放试听
- **历史管理**: 自动保存录音历史，支持播放和删除
- **响应式设计**: 适配手机、平板、桌面等不同设备

### 技术实现
- **MediaRecorder API**: 使用浏览器原生录音接口
- **getUserMedia**: 获取麦克风权限和音频流
- **Blob处理**: 音频数据的存储和URL生成
- **React Hooks**: useState、useRef、useEffect管理组件状态
- **CSS动画**: 录音状态的视觉反馈效果

### 浏览器兼容性
- Chrome 47+
- Firefox 29+
- Safari 14+
- Edge 79+

### 使用方法
1. 在主页点击左侧"录制我的声音"卡片
2. 首次使用时浏览器会请求麦克风权限，请点击"允许"
3. 点击"开始录音"按钮开始录制
4. 录音过程中可以暂停/继续，或直接停止
5. 录音完成后可以播放试听
6. 所有录音会自动保存到历史记录中
7. 点击左上角"返回主页"按钮回到主界面

### 注意事项
- 需要HTTPS环境或localhost才能正常使用录音功能
- 首次使用需要用户授权麦克风权限
- 录音文件仅保存在浏览器本地，刷新页面后会丢失
- 建议使用现代浏览器以获得最佳体验

## 开发说明

本项目使用Create React App创建，支持热重载开发。所有样式都经过精心设计，确保在不同设备上都有良好的用户体验。

### 运行项目
```bash
npm start
```

### 构建项目
```bash
npm run build
```

项目采用现代化的React开发模式，代码结构清晰，易于维护和扩展。

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# 智能录音组件 - API集成版本

这是一个集成了FastAPI后端的智能录音组件，支持音频录制、云端上传、本地存储和播放功能。

## 🎯 主要功能

### 🎙️ 录音功能
- **高质量录音**：支持WebM格式，opus编解码器
- **实时录音控制**：开始、暂停、继续、停止
- **长按录音**：移动端支持长按快速录音
- **录音时长显示**：实时显示录音时间
- **触觉反馈**：移动设备振动反馈

### ☁️ 云端存储
- **自动上传**：录音完成后自动上传到阿里云OSS
- **状态显示**：上传进度和状态实时显示
- **错误重试**：上传失败可手动重试
- **文件管理**：支持删除云端文件

### 📱 本地管理
- **录音列表**：待绑定录音和已绑定录音分别管理
- **会话绑定**：录音可绑定到特定会话ID
- **本地存储**：使用localStorage持久化数据
- **音频播放**：内置音频播放器

## 🔧 API配置

### 基础配置
```javascript
const API_BASE_URL = 'http://6.6.6.65:8000';
```

### 支持的API接口
- `POST /upload` - 上传音频文件
- `DELETE /files/{object_key}` - 删除云端文件

### 上传参数
- `file`: 音频文件 (multipart/form-data)
- `folder`: 存储文件夹路径 (默认: `recordings/{sessionId}`)

## 📋 使用方法

### 1. 开始录音
- 桌面端：点击"开始录音"按钮
- 移动端：点击或长按录音按钮

### 2. 控制录音
- **暂停/继续**：点击暂停按钮
- **停止录音**：点击停止按钮
- **重置**：清除当前录音

### 3. 管理录音
- **自动上传**：录音完成后自动上传到云端
- **绑定录音**：将录音绑定到当前会话
- **重试上传**：上传失败时可重试
- **删除录音**：删除本地和云端文件

### 4. 状态指示
- 🎤 **准备录音**：系统就绪
- 🔴 **录音中**：正在录制音频
- ⏸️ **已暂停**：录音已暂停
- ⏳ **上传中**：正在上传到云端
- ☁️ **已上传**：上传成功
- ❌ **上传失败**：需要重试

## 💾 数据存储

### 录音数据结构
```javascript
{
  id: 时间戳ID,
  url: 本地URL,
  audioBlob: 音频Blob对象,
  duration: 录音时长(秒),
  timestamp: 录制时间,
  sessionId: 会话ID,
  cloudUrl: 云端URL,
  objectKey: OSS对象键,
  uploaded: 是否已上传,
  boundAt: 绑定时间
}
```

### 本地存储
- 待绑定录音：内存存储
- 已绑定录音：localStorage持久化
- 存储键：`bound_recordings_{sessionId}`

## 🔐 权限要求

### 浏览器权限
- **麦克风权限**：必需，用于录音
- **存储权限**：用于本地数据存储

### API权限
- **文件上传权限**：上传到OSS
- **文件删除权限**：删除OSS文件

## 🌐 浏览器兼容性

### 支持的浏览器
- ✅ Chrome 60+
- ✅ Firefox 29+
- ✅ Safari 11+
- ✅ Edge 79+

### 不支持的功能
- ❌ IE浏览器
- ❌ 旧版移动浏览器

## 📱 移动端特性

### 触摸优化
- **长按录音**：长按500ms开始录音，松开停止
- **触觉反馈**：录音开始和结束的振动提示
- **响应式设计**：适配各种屏幕尺寸

### 移动端提示
- 显示"点击或长按录音"提示
- 长按录音模式指示
- 触摸状态视觉反馈

## 🔧 开发配置

### 环境变量
```javascript
// API基础URL - 可根据环境修改
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://6.6.6.65:8000';
```

### 依赖项
- React 18+
- React Router DOM
- 现代浏览器支持

## 📚 扩展功能

### 可添加的功能
- 音频格式转换
- 音频质量设置
- 批量上传
- 音频编辑
- 语音转文字
- 音频分享

### API扩展
- 音频文件列表查询
- 音频文件信息获取
- 批量文件操作
- 用户权限管理

## 🐛 故障排除

### 常见问题
1. **麦克风权限被拒绝**
   - 检查浏览器权限设置
   - 重新加载页面并允许权限

2. **上传失败**
   - 检查网络连接
   - 确认API服务可用
   - 使用重试功能

3. **录音无声音**
   - 检查麦克风硬件
   - 确认音频输入设备
   - 测试其他录音应用

4. **浏览器不支持**
   - 更新到最新浏览器版本
   - 使用支持的浏览器
   - 检查HTTPS协议

## 📞 技术支持

如有问题或建议，请联系开发团队。

---

© 2024 智能录音组件 - 集成云端存储的现代化录音解决方案
