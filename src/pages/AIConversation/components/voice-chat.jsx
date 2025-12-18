import { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import { ReadyState } from "react-use-websocket";

import useDeviceStore from "./use-device-store";
import useConversationStore from "./use-conversation-store";
import useRealtimeCmd from "./use-realtime-cmd";
import { arrayBufferToBase64 } from "./audio-utils";

function VoiceChat() {
  const { wavRecorder, wavStreamPlayer } = useDeviceStore();
  const { wsInstance, setWsConnected, setCurrentSessionId } =
    useConversationStore();
  const { appendUserVoice, sendPrompt, createHello, createResponse } =
    useRealtimeCmd();

  const [isRecording, setIsRecording] = useState(false);

  async function requestPermission() {
    try {
      await wavStreamPlayer.connect();
    } catch (error) {
      console.error("WavStreamPlayer connect error:", error);
      // 检查是否是因为非安全上下文导致
      if (window.location.protocol === 'http:' && 
          !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        alert("⚠️ 录音组件初始化失败\n\n原因：浏览器限制 AudioWorklet 必须在 HTTPS 或 localhost 环境下运行。\n\n解决方法：\n1. 请配置 HTTPS 证书\n2. 或在 Chrome 地址栏输入 chrome://flags/#unsafely-treat-insecure-origin-as-secure \n   启用并将当前地址加入白名单");
      } else {
        alert(`录音组件初始化失败: ${error.message}`);
      }
      return;
    }

    const permissions = window.navigator.permissions;
    if (permissions) {
      const permissionStatus = await permissions.query({ name: "microphone" });
      if (permissionStatus.state === "denied") {
        console.warn("已拒绝授予麦克风权限");
      }
    }
  }

  async function startRecord() {
    setWsConnected(false);
    await requestPermission();
    setWsConnected(true);

    try {
      await wavRecorder.begin();
      await wavRecorder.clear();
      setIsRecording(true);
      await wavRecorder.record(({ mono }) => {
        const audioBase64 = arrayBufferToBase64(mono);
        appendUserVoice(audioBase64);
      });
    } catch {
      console.warn("打开麦克风失败");
    }
  }

  async function stopRecord() {
    const recorderStatus = wavRecorder.getStatus();
    wavStreamPlayer.interrupt();
    if (recorderStatus === "recording") {
      await wavRecorder.end();
      setIsRecording(false);
    }
    setWsConnected(false);
    setCurrentSessionId(Math.random().toString(36).slice(2));
  }

  useEffect(() => {
    // Only send prompt if explicitly needed, otherwise let the session initialization handle it
    // if (wsInstance?.readyState === ReadyState.OPEN) {
    //   sendPrompt();
    //   createHello("你好");
    //   createResponse();
    // }
  }, [wsInstance?.readyState]);

  return (
    <button
      onClick={isRecording ? stopRecord : startRecord}
      className={`ai-control-btn ${isRecording ? "end-btn" : "start-btn"}`}
    >
      <span className="btn-icon">
        <Mic />
      </span>
      <span className="btn-text">
        {isRecording ? "停止对话" : "开始对话"}
      </span>
    </button>
  );
}

export default VoiceChat;
export { VoiceChat };
