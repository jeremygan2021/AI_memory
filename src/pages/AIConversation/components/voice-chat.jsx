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
    await wavStreamPlayer.connect();
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
    if (wsInstance?.readyState === ReadyState.OPEN) {
      sendPrompt();
      createHello("你好");
      createResponse();
    }
  }, [wsInstance?.readyState]);

  return (
    <div className="flex flex-col items-center gap-4">
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
    </div>
  );
}

export default VoiceChat;
export { VoiceChat };
