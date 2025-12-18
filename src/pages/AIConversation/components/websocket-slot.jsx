// WebSocket Slot

import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import useConversationStore from "./use-conversation-store";
import useRealtimeMsgEffect from "./use-realtime-msg-effect";

function WebSocketSlot({ children }) {
  const { wsConnected, setWsConnected, setWsInstance } = useConversationStore();

  const apiKey = process.env.REACT_APP_STEP_API_KEY;
  const baseUrl = process.env.REACT_APP_REALTIME_ENDPOINT;
  
  // Use local proxy if baseUrl is not set or if it points to the direct StepFun API (which fails due to browser header limitations)
  const targetUrl = (baseUrl && !baseUrl.includes("api.stepfun.com")) 
    ? baseUrl 
    : "ws://localhost:8081";
    
  const url = new URL(targetUrl);
  url.searchParams.set("model", "step-1o-audio");
  url.searchParams.set("apiKey", apiKey ?? "");

  const wsInstance = useWebSocket(
    url.href,
    {
      share: true,
      heartbeat: {
        message: "ping" + Date.now(),
        interval: 15000,
      },
      onClose: () => {
        setWsConnected(false);
      },
    },
    wsConnected
  );

  useEffect(() => {
    setWsInstance(wsInstance);
  }, [wsInstance.readyState]);

  useRealtimeMsgEffect(wsInstance);

  return children;
}

export default WebSocketSlot;
export { WebSocketSlot };
