function Bubble(props) {
  const { msg } = props;

  // 根据消息角色确定头像
  const getAvatar = () => {
    if (msg.role === 'user') {
      return '/images/user.png'; // 用户头像
    } else if (msg.role === 'assistant' || msg.role === 'ai') {
      return '/images/AIBot.png'; // AI头像
    }
    return null; // 系统消息不显示头像
  };

  const avatar = getAvatar();

  return (
    <div className={`message ${msg.role}`}>
      {avatar && (
        <img 
          className="message-avatar" 
          src={avatar} 
          alt={msg.role === 'user' ? '用户' : 'AI'} 
        />
      )}
      <div className="message-content-wrapper">
        <div className="message-content">
          {msg.textDelta ?? msg.textFinal ?? ""}
        </div>
      </div>
    </div>
  );
}

export default Bubble;
export { Bubble };
