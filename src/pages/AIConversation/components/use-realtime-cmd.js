import { v4 as uuidv4 } from "uuid";
import { useAgentStore } from "./use-agent-store";
import { useConversationStore } from "./use-conversation-store";

const useRealtimeCmd = () => {
  const { agent } = useAgentStore();
  const { wsInstance } = useConversationStore();

  /** @description 创建/更新 Session - 支持实时对话 */
  function sendPrompt() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: agent?.agent_prompt,
        voice: agent?.voice_type,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
        },
        tools: [],
      },
    });
  }

  /** @description 添加会话消息 */
  function createHello(text) {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "conversation.item.create",
      item: {
        id: uuidv4(),
        // previous_item_id: previousItemId,
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
  }

  /** @description 创建推理 */
  function createResponse() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "response.create",
    });
  }

  /** @description 追加音频内容 */
  function appendUserVoice(audioBase64) {
    wsInstance?.sendJsonMessage({
      audio: audioBase64,
      event_id: uuidv4(),
      type: "input_audio_buffer.append",
    });
  }

  /** @description 提交音频内容 */
  function commitUserVoice() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "input_audio_buffer.commit",
    });
  }

  /** @description 清空音频缓冲区 - 用于实时对话模式 */
  function clearAudioBuffer() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "input_audio_buffer.clear",
    });
  }

  /** @description 取消当前响应 - 用于中断AI回答 */
  function cancelResponse() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "response.cancel",
    });
  }

  return {
    sendPrompt,
    createHello,
    createResponse,
    appendUserVoice,
    commitUserVoice,
    clearAudioBuffer,
    cancelResponse,
  };
};

export default useRealtimeCmd;
export { useRealtimeCmd };
