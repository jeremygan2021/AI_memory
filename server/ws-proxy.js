const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = process.env.WS_PROXY_PORT || 8088;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs, req) => {
  const params = url.parse(req.url, true).query;
  const model = params.model || 'step-1o-audio';
  const apiKey = params.apiKey;

  if (!apiKey) {
    console.error('No API key provided');
    clientWs.close(1008, 'API key required');
    return;
  }

  console.log(`[Proxy] New connection for model: ${model}`);

  const messageBuffer = [];

  // Connect to StepFun API with Authorization header
  const stepfunUrl = `wss://api.stepfun.com/v1/realtime?model=${model}`;
  const stepfunWs = new WebSocket(stepfunUrl, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  // Forward messages from client to StepFun
  clientWs.on('message', (data) => {
    console.log('[Proxy] Client -> StepFun:', data.toString().substring(0, 200)); 
    if (stepfunWs.readyState === WebSocket.OPEN) {
      stepfunWs.send(data);
    } else {
      console.log('[Proxy] Buffering message for StepFun...');
      messageBuffer.push(data);
    }
  });

  // Forward messages from StepFun to client
  stepfunWs.on('message', (data) => {
    let logContent = data;
    if (data instanceof Buffer) {
      try {
        logContent = data.toString('utf8');
      } catch (e) {
        logContent = 'Binary data (failed to decode)';
      }
    }
    console.log('[Proxy] StepFun -> Client:', logContent.substring(0, 300));
    
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  // Handle StepFun connection open
  stepfunWs.on('open', () => {
    console.log('[Proxy] Connected to StepFun API');
    // Flush buffer
    while (messageBuffer.length > 0) {
      const data = messageBuffer.shift();
      stepfunWs.send(data);
      console.log('[Proxy] Sent buffered message');
    }
  });

  // Handle errors
  stepfunWs.on('error', (error) => {
    console.error('[Proxy] StepFun error:', error.message);
    clientWs.close(1011, 'Upstream error');
  });

  clientWs.on('error', (error) => {
    console.error('[Proxy] Client error:', error.message);
  });

  // Handle close events
  stepfunWs.on('close', (code, reason) => {
    console.log(`[Proxy] StepFun closed: ${code} ${reason}`);
    clientWs.close(code, reason);
  });

  clientWs.on('close', (code, reason) => {
    console.log(`[Proxy] Client closed: ${code} ${reason}`);
    if (stepfunWs.readyState === WebSocket.OPEN) {
      stepfunWs.close();
    }
  });

  // Handle ping/pong for heartbeat
  clientWs.on('ping', () => {
    if (stepfunWs.readyState === WebSocket.OPEN) {
      stepfunWs.ping();
    }
  });

  stepfunWs.on('pong', () => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.pong();
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket proxy server running on ws://localhost:${PORT}`);
});
