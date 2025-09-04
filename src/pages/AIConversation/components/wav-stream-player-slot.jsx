// WavStreamPlayer Slot

import { useEffect } from "react";
import { ReadyState } from "react-use-websocket";
import useDeviceStore from "./use-device-store";
import useConversationStore from "./use-conversation-store";

function WavStreamPlayerSlot({ children }) {
  const { wavStreamPlayer } = useDeviceStore();
  const { currentSessionId, sessionList, wsInstance } = useConversationStore();

  // 音频回调立即播放
  useEffect(() => {
    const currentSession = sessionList
      .filter((session) => session.id === currentSessionId)
      .at(0);

    currentSession?.message.forEach((item) => {
      if (item.audioDelta && item.eventName === "response.audio.delta") {
        wavStreamPlayer.add16BitPCM(item.audioDelta, item.itemId);
      }
    });
  }, [sessionList, currentSessionId, wavStreamPlayer]);

  // WebSocket 断开后立即中断音频
  useEffect(() => {
    if (wsInstance?.readyState === ReadyState.CLOSED) {
      wavStreamPlayer.interrupt();
    }
  }, [wsInstance?.readyState, wavStreamPlayer]);

  return children;
}

export default WavStreamPlayerSlot;
export { WavStreamPlayerSlot };
