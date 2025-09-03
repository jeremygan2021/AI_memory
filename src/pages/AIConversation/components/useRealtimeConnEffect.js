// WebSocked链接管理

import { useEffect } from 'react'
import useWebSocket from 'react-use-websocket'
import useRealtimeMsgEffect from './useRealtimeMsgEffect.js'
import useConversationStore from './useConversationStore.js'

const useRealtimeConnEffect = () => {
  const { wsConnected, setWsConnected, setWsInstance } = useConversationStore()
  
  // 配置你的WebSocket URL
  const apiKey = process.env.NEXT_PUBLIC_STEP_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_REALTIME_ENDPOINT
  const url = new URL(baseUrl ?? 'wss://api.stepfun.com/v1/realtime')
  url.searchParams.set('model', 'step-1o-audio')
  url.searchParams.set('apiKey', apiKey ?? '')

  const wsInstance = useWebSocket(
    url.href,
    {
      share: true,
      heartbeat: {
        message: 'ping' + Date.now(),
        interval: 15000,
      },
      onClose: () => {
        setWsConnected(false)
      },
    },
    wsConnected
  )

  useEffect(() => {
    setWsInstance(wsInstance)
  }, [wsInstance.readyState])

  useRealtimeMsgEffect(wsInstance)
}

export default useRealtimeConnEffect
