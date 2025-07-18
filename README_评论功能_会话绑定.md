# 评论功能 - 会话绑定与持久化存储

## 功能概述

评论功能已升级为支持会话绑定的持久化存储系统，确保评论与特定的会话ID绑定，并且支持云端和本地双重存储。

## 核心特性

### 1. 会话绑定
- **唯一标识**: 使用 `userCode_sessionId_recordingId` 作为会话密钥
- **数据隔离**: 不同会话的评论完全独立，互不干扰
- **NFC共享**: 其他人通过NFC扫描可以看到相同的评论

### 2. 双重存储
- **云端存储**: 优先保存到云端API
- **本地备份**: 云端失败时自动降级到本地存储
- **数据同步**: 本地数据会在网络恢复时同步到云端

### 3. 持久化保证
- **页面刷新**: 评论不会丢失
- **设备切换**: 通过云端同步在不同设备间共享
- **离线支持**: 网络断开时仍可正常使用

## 技术实现

### 会话密钥生成
```javascript
const sessionKey = `${userCode}_${sessionId}_${recordingId}`;
```

### 存储策略
1. **云端优先**: 尝试保存到云端API
2. **本地备份**: 同时保存到localStorage
3. **数据合并**: 加载时合并云端和本地数据
4. **去重排序**: 按时间戳排序并去重

### API接口

#### 获取评论
```
GET /comments?sessionKey={sessionKey}
```

#### 保存评论
```
POST /comments
Content-Type: application/json

{
  "id": "unique_id",
  "content": "评论内容",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessionKey": "userCode_sessionId_recordingId",
  "recordingId": "recording_123",
  "userCode": "USER001",
  "sessionId": "20241201_001",
  "author": "访客123",
  "deviceId": "device_123456789"
}
```

#### 同步评论
```
POST /comments/sync
Content-Type: application/json

{
  "sessionKey": "userCode_sessionId_recordingId",
  "comments": [...]
}
```

## 使用方法

### 在播放页面中使用
```javascript
import CommentSection from './components/CommentSection';

// 在播放页面组件中
<CommentSection 
  recordingId={recordingId}
  userCode={userCode}
  sessionId={sessionId}
/>
```

### 测试功能
访问 `/comment-test` 路由可以测试评论功能：
- 修改测试参数
- 验证会话绑定
- 测试持久化存储

## 数据结构

### 评论对象
```javascript
{
  id: "1704067200000_abc123def",           // 唯一ID
  content: "这是一条评论",                   // 评论内容
  timestamp: "2024-01-01T00:00:00.000Z",   // 时间戳
  sessionKey: "USER001_20241201_001_recording_123", // 会话密钥
  recordingId: "recording_123",             // 录音ID
  userCode: "USER001",                      // 用户代码
  sessionId: "20241201_001",                // 会话ID
  author: "访客123",                        // 作者
  deviceId: "device_123456789"             // 设备ID
}
```

## 错误处理

### 网络错误
- 自动降级到本地存储
- 显示友好的错误提示
- 网络恢复时自动同步

### 数据验证
- 评论内容长度限制（500字符）
- 必填字段验证
- 时间戳格式验证

## 性能优化

### 懒加载
- 评论列表按需加载
- 滚动到底部时自动加载更多

### 缓存策略
- 本地存储作为缓存
- 减少不必要的API调用
- 智能数据合并

## 安全考虑

### 数据保护
- 评论内容长度限制
- 防止XSS攻击
- 设备ID匿名化

### 隐私保护
- 不收集个人信息
- 设备ID仅用于去重
- 评论作者使用随机昵称

## 兼容性

### 浏览器支持
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### 移动端支持
- iOS Safari 12+
- Android Chrome 60+
- 响应式设计适配

## 故障排除

### 常见问题

1. **评论不显示**
   - 检查网络连接
   - 查看浏览器控制台错误
   - 确认会话参数正确

2. **评论丢失**
   - 检查localStorage是否被清除
   - 确认会话密钥一致
   - 验证API接口状态

3. **同步失败**
   - 检查网络连接
   - 查看API响应状态
   - 确认数据格式正确

### 调试工具
- 浏览器开发者工具
- 网络请求监控
- localStorage查看器

## 更新日志

### v2.0.0 (2024-01-01)
- ✅ 添加会话绑定功能
- ✅ 实现双重存储策略
- ✅ 支持NFC共享评论
- ✅ 优化错误处理
- ✅ 添加测试页面

### v1.0.0 (2023-12-01)
- ✅ 基础评论功能
- ✅ 本地存储
- ✅ 响应式设计

## 未来计划

### 即将推出
- [ ] 评论点赞功能
- [ ] 评论回复功能
- [ ] 评论搜索功能
- [ ] 评论审核机制
- [ ] 实时同步功能

### 长期规划
- [ ] 评论统计分析
- [ ] 智能推荐系统
- [ ] 多语言支持
- [ ] 高级权限管理 