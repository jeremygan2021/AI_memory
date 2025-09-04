// Agent 状态管理
import { create } from "zustand";

const useAgentStore = create((set) => {
  return {
    agent: {
      agent_prompt: "你是一个智能助手，可以帮助用户解答问题和进行对话。",
      voice_type: "yuanqishaonv",
    },
    setAgent: (agentData) => set({ agent: agentData }),
  };
});

export default useAgentStore;
export { useAgentStore };
