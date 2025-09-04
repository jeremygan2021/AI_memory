// 实时对话副作用

import { useEffect } from "react";
import useConversationStore from "./use-conversation-store";
import useDeviceStore from "./use-device-store";
import { base64ToArrayBuffer, mergeInt16Arrays } from "./audio-utils";

const useRealtimeMsgEffect = (wsInstance) => {
  const { setCurrentSessionId, setCurrentSessionList } = useConversationStore();
  const { wavStreamPlayer } = useDeviceStore();

  useEffect(() => {
    const parsedData = JSON.parse(wsInstance.lastMessage?.data ?? "{}");

    // 处理会话创建
    if (parsedData.type === "session.created") {
      setCurrentSessionId(parsedData.session.id);
      setCurrentSessionList(() => {
        return { id: parsedData.session.id, message: [] };
      });
    }

    // 处理音频增量数据
    if (parsedData.type === "response.audio.delta") {
      const currentEventId = parsedData.event_id;
      const currentEventName = parsedData.type;
      const currentItemId = parsedData.item_id;
      const currentDelta = parsedData.delta;

      const audioArrayBuffer = base64ToArrayBuffer(currentDelta);
      const audioInt16ArrayBuffer = new Int16Array(audioArrayBuffer);

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              audioDelta: audioInt16ArrayBuffer,
              audioFinal: mergeInt16Arrays(
                item.audioFinal ?? new Int16Array(0),
                audioInt16ArrayBuffer
              ),
              isStreaming: true,
            };
          }
          return item;
        }),
      }));
    }

    // 处理音频完成
    if (parsedData.type === "response.audio.done") {
      const currentEventId = parsedData.event_id;
      const currentItemId = parsedData.item_id;
      const currentEventName = parsedData.type;

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              audioDelta: undefined,
              isStreaming: false,
            };
          }
          return item;
        }),
      }));
    }

    // 处理语音检测
    if (parsedData.type === "input_audio_buffer.speech_started") {
      console.log("检测到用户开始说话 - 中断当前音频播放");
      wavStreamPlayer.interrupt();
    }
  }, [wsInstance.lastMessage?.data]);
};

export default useRealtimeMsgEffect;
