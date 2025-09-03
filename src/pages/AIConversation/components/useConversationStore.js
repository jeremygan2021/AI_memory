//会话状态管理

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useConversationStore = create(
  devtools((set, get) => ({
    wsConnected: false,
    setWsConnected: (bool) => set({ wsConnected: bool }),

    wsInstance: undefined,
    setWsInstance: (instance) => set({ wsInstance: instance }),

    currentSessionId: '',
    setCurrentSessionId: (id) => set({ currentSessionId: id }),

    sessionList: [],
    getCurrentSession: () => {
      const id = get().currentSessionId
      const session = get().sessionList.find((session) => session.id === id)
      return session
    },
    setCurrentSessionList: (setSessionAction) => {
      const _currentSession = get().getCurrentSession()
      const _currentSessionList = get().sessionList

      if (!_currentSession) {
        const firstSession = setSessionAction({ id: '', message: [] })
        set({ sessionList: [..._currentSessionList, firstSession] })
      } else {
        const newSessionList = _currentSessionList.map((session) => {
          if (session.id === _currentSession?.id) {
            return setSessionAction(session)
          }
          return session
        })
        set({ sessionList: newSessionList })
      }
    },
  }))
)

export default useConversationStore