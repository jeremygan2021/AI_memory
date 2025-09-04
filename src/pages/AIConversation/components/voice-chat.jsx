import { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import { ReadyState } from "react-use-websocket";

import useDeviceStore from "./use-device-store";
import useConversationStore from "./use-conversation-store";
import useRealtimeCmd from "./use-realtime-cmd";
import { arrayBufferToBase64 } from "./audio-utils";

function VoiceChat() {
  const { wavRecorder, wavStreamPlayer } = useDeviceStore();
  const { wsInstance, setWsConnected } = useConversationStore();
  const { appendUserVoice, sendPrompt, createHello, createResponse } =
    useRealtimeCmd();

  const [isRecording, setIsRecording] = useState(false);

  async function startRecord() {
    await wavStreamPlayer.connect();
    setWsConnected(false);
    wavStreamPlayer.interrupt();
    setWsConnected(true);
    // try {
    //   await wavRecorder.begin();
    //   setIsRecording(true);

    //   wavRecorder.record(({ mono }) => {
    //     const audioBase64 = arrayBufferToBase64(mono);
    //     appendUserVoice(audioBase64);
    //   });
    // } catch (error) {
    //   console.error("开始录音失败:", error);
    // }
  }

  async function stopRecord() {
    // try {
    //   await wavRecorder.end();
    //   setIsRecording(false);
    //   commitUserVoice();
    // } catch (error) {
    //   console.error("停止录音失败:", error);
    // }
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
        className={`control-btn rounded-full ${
          isRecording ? "bg-red-500" : "bg-blue-500"
        }`}
      >
        {isRecording ? (
          <>
            <Mic className="mr-2" />
            停止对话
          </>
        ) : (
          <>
            <Mic className="mr-2" />
            开始对话
          </>
        )}
      </button>
    </div>
  );
}

export default VoiceChat;
export { VoiceChat };
