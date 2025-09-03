//Agent状态管理

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useAgentStore = create(
  devtools((set, get) => ({
    agent: {
      agent_prompt: '你是一个智能助手，可以帮助用户解答问题和进行对话。',
      voice_type: 'alloy',
    },
    setAgent: (agentData) => set({ agent: agentData }),
  }))
)

export default useAgentStore