# 修复 WebSocket 连接鉴权问题

## 问题分析
根据报错信息 `WebSocket is closed before the connection is established` 和 StepFun 文档，问题的原因是：
1. **鉴权方式不兼容**：StepFun API 要求在 WebSocket 握手请求的 `Header` 中包含 `Authorization: Bearer <API_KEY>`。
2. **浏览器限制**：浏览器端的 WebSocket API 不支持自定义 Headers。
3. **当前配置**：项目当前配置直接从浏览器连接 StepFun (`wss://api.stepfun.com/v1/realtime`)，并尝试通过 URL 参数传递 `apiKey`，但这不被 StepFun 支持，导致连接被拒绝 (401 Unauthorized)。

## 解决方案
使用项目中的 `server/ws-proxy.js` 作为中间代理。该代理服务器可以接收浏览器的连接请求，提取 URL 参数中的 `apiKey`，并将其放入 Header 中转发给 StepFun。

## 实施步骤
1. **停止旧服务**：停止当前 Terminal 6 中运行的 `proxy-server.js`（该文件似乎已丢失且报错）。
2. **启动正确的代理服务**：启动 `server/ws-proxy.js`，该服务监听 8088 端口。
3. **更新前端配置**：修改 `.env` 文件，将 WebSocket 目标地址指向本地代理。
   - 修改前：`REACT_APP_REALTIME_ENDPOINT=wss://api.stepfun.com/v1/realtime`
   - 修改后：`REACT_APP_REALTIME_ENDPOINT=ws://localhost:8088`
4. **验证修复**：重启前端并尝试连接。
