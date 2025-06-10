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
