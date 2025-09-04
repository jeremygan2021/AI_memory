import React, { useState } from "react";
import { Mic } from "lucide-react";

import useDeviceStore from "./useDeviceStore.js";
import useConversationStore from "./useConversationStore.js";
import useRealtimeCmd from "./useRealtimeCmd.js";
import { arrayBufferToBase64 } from "./audioUtils.js";

export default function VoiceChat() {
  const { wavRecorder, wavStreamPlayer } = useDeviceStore();
  const { wsInstance, setWsConnected } = useConversationStore();
  const { appendUserVoice, commitUserVoice } = useRealtimeCmd();

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
    try {
      await wavRecorder.end();
      setIsRecording(false);
      commitUserVoice();
    } catch (error) {
      console.error("停止录音失败:", error);
    }
  }

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
