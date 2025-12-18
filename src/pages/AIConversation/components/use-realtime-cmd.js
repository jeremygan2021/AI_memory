import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAgentStore } from "./use-agent-store";
import { useConversationStore } from "./use-conversation-store";

const useRealtimeCmd = () => {
  const { userid } = useParams();
  const { agent } = useAgentStore();
  const { wsInstance } = useConversationStore();

  const [tools, setTools] = useState([]);

  useEffect(() => {
    if (userid === "FRD1") {
      setTools([
        {
          type: "retrieval",
          function: {
            description:
              "本知识库可以回答用户【我的故事：家族与传承的交织故事】相关问题",
            options: {
              // 文本检索
              vector_store_id: "276921286739320832",
              prompt_template:
                "严格从文档{{knowledge}}中找到问题{{query}}的答案。根据文档内容中的语句找到答案, 如果文档中没用答案则告诉用户找不到",
            },
          },
        },
        {
          type: "retrieval",
          function: {
            description:
              "本知识库可以回答用户【我的故事：家族与传承的交织故事】相关问题",
            options: {
              // 图片检索
              vector_store_id: "276946092016758784",
              prompt_template:
                "严格从文档{{knowledge}}中找到问题{{query}}的答案。根据文档内容中的语句找到答案, 如果文档中没用答案则告诉用户找不到",
            },
          },
        },
      ]);
    }
  }, [userid]);

  /** @description 创建/更新 Session - 支持实时对话 */
  function sendPrompt() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: agent?.agent_prompt ?? "你是一个智能助手",
        voice: agent?.voice_type ?? "jingdiannvsheng", // Use server default to be safe
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
        },
        tools,
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
