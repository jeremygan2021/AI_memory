#!/bin/bash

# Set ports
# PORT is for the SvelteKit main server (we don't use its UI, so put it on a different port)
export PORT=8082
# WS_PORT is for the WebSocket relay server (this is what our React app connects to)
export WS_PORT=8081

# Check if the build directory exists
if [ ! -d "Step-Realtime-Console/build" ]; then
    echo "Build directory not found. Building project..."
    cd Step-Realtime-Console && bun run build
    cd ..
fi

echo "Starting StepFun Realtime Relay Server (Production Mode)..."
echo "SvelteKit Server: http://localhost:$PORT"
echo "WebSocket Relay:  ws://localhost:$WS_PORT"

# Run the built Bun server
bun Step-Realtime-Console/build/index.js
