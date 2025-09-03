//实时命令管理

import { v4 as uuidv4 } from 'uuid'
import useConversationStore from './useConversationStore.js'
import useAgentStore from './useAgentStore.js'

const useRealtimeCmd = () => {
  const { agent } = useAgentStore()
  const { wsInstance } = useConversationStore()

  /** @description 创建/更新 Session - 支持实时对话 */
  function sendPrompt() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: agent?.agent_prompt,
        voice: agent?.voice_type,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
        },
        tool_choice: 'auto',
        temperature: 0.8,
        max_response_output_tokens: 4096,
      },
    })
  }

  /** @description 追加音频内容 */
  function appendUserVoice(audioBase64) {
    wsInstance?.sendJsonMessage({
      audio: audioBase64,
      event_id: uuidv4(),
      type: 'input_audio_buffer.append',
    })
  }

  /** @description 提交音频内容 */
  function commitUserVoice() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: 'input_audio_buffer.commit',
    })
  }

  /** @description 清空音频缓冲区 */
  function clearAudioBuffer() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: 'input_audio_buffer.clear',
    })
  }

  /** @description 取消当前响应 */
  function cancelResponse() {
    wsInstance?.sendJsonMessage({
      event_id: uuidv4(),
      type: 'response.cancel',
    })
  }

  return {
    sendPrompt,
    appendUserVoice,
    commitUserVoice,
    clearAudioBuffer,
    cancelResponse,
  }
}

export default useRealtimeCmd