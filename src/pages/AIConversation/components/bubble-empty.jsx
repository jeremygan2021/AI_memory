import { useConversationStore } from "./use-conversation-store";

function BubbleEmpty() {
  const { sessionList, currentSessionId } = useConversationStore();
  return (
    <div
      className="empty-conversation"
      style={{
        [sessionList.filter((session) => session.id === currentSessionId).at(0)
          ?.message.length > 0 && "display"]: "none",
      }}
    >
      <div className="empty-icon">💬</div>
      <p></p>
      <div className="conversation-tips">
        <p>对话提示：</p>
        <ul>
          <li>点击"开始对话"按钮开始语音对话</li>
          <li>对话过程中可以随时静音或结束</li>
          <li>对话内容将实时显示在这里</li>
        </ul>
      </div>
    </div>
  );
}

export default BubbleEmpty;
export { BubbleEmpty };
