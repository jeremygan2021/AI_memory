# 评论功能说明

## 功能概述

为播放页面新增了评论功能，用户可以在播放录音时查看和发表评论。

## 功能特点

### 1. 风格一致性
- 评论区域采用与播放页面相同的设计风格
- 使用相同的颜色主题（绿色渐变）
- 保持相同的字体和圆角设计
- 背景采用半透明毛玻璃效果

### 2. 位置布局
- 评论区域位于播放区域下方，与播放区域分离
- 在播放页面主容器外部独立显示
- 保持适当的间距，不会与播放控件重叠

### 3. 响应式设计
- **桌面端（>768px）**: 评论区域居中显示，最大宽度500px
- **平板端（768px）**: 评论区域边距调整为20px，圆角15px
- **手机端（480px）**: 评论区域边距调整为15px，圆角12px
- **小屏手机（375px）**: 评论区域边距调整为10px，圆角10px

## 组件结构

### CommentSection 组件
位置：`src/components/CommentSection.js`
样式：`src/components/CommentSection.css`

### 主要功能
1. **评论列表显示**
   - 显示评论数量
   - 评论作者头像（随机生成）
   - 评论内容和时间

2. **添加评论**
   - 点击"添加评论"按钮展开表单
   - 支持多行文本输入（最多500字符）
   - 实时字符计数
   - 支持Enter键快速发布

3. **数据存储**
   - 评论作为JSON文件存储在云端，与录音文件在同一目录下
   - 文件路径：`recordings/{userCode}/{sessionId}/comments_{recordingId}_{timestamp}.txt`
   - 自动清理旧评论文件，仅保留最新3个版本
   - 降级到本地localStorage存储作为备份
   - 支持离线使用

4. **用户体验**
   - 发布成功/失败提示
   - 自动滚动到最新评论
   - 加载状态显示

## 使用方法

### 在播放页面中使用
```jsx
import CommentSection from './components/CommentSection';

// 在播放页面组件中
{recording && (
  <CommentSection 
    recordingId={recordingId}
    userCode={userCode}
    sessionId={id}
  />
)}
```

### 测试页面
访问 `/comment-test` 路由可以查看评论功能的独立测试页面。

## API 接口

### 获取评论
通过文件列表API获取评论文件：
```
GET /files?prefix=recordings/{userCode}/{sessionId}/&max_keys=1000
```
然后筛选出以 `comments_{recordingId}_` 开头的 `.txt` 文件，获取最新的评论文件内容。

### 发布评论
通过文件上传API保存评论：
```
POST /upload
Content-Type: multipart/form-data

FormData:
- file: JSON文件 (comments_{recordingId}_{timestamp}.txt)
- folder: recordings/{userCode}/{sessionId}
```

评论文件格式：
```json
{
  "comments": [
    {
      "id": "timestamp",
      "content": "评论内容",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "recordingId": "recording-id",
      "userCode": "USER",
      "sessionId": "session-id",
      "author": "访客123"
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "recordingId": "recording-id",
  "userCode": "USER",
  "sessionId": "session-id"
}
```

## 样式特点

### 颜色主题
- 主色调：`#4ac967` 到 `#88d982` 的绿色渐变
- 背景：半透明白色 `rgba(255, 255, 255, 0.15)`
- 文字：深绿色 `#2d5016`

### 交互效果
- 按钮悬停时有轻微上移和阴影效果
- 输入框聚焦时有边框高亮
- 发布按钮在禁用状态下变灰

### 移动端优化
- 触摸设备优化，移除悬停效果
- 按钮最小高度44px，符合触摸标准
- 支持深色模式

## 浏览器兼容性

- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 移动端浏览器优化
- 支持iOS Safari的特殊处理

## 注意事项

1. 评论数据优先存储在云端，失败时降级到本地存储
2. 评论作者名称随机生成，实际使用时可以集成用户系统
3. 评论时间显示相对时间（如"刚刚"、"5分钟前"）
4. 支持键盘快捷键（Enter发布，Shift+Enter换行） 