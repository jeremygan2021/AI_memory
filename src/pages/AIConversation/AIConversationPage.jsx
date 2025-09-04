import React, { useState, useCallback, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WebSocketSlot } from "./components/websocket-slot";
import { WavStreamPlayerSlot } from "./components/wav-stream-player-slot";
import { VoiceChat } from "./components/voice-chat";
import "./AIConversationPage.css";

const AIConversationPage = () => {
  const navigate = useNavigate();
  const { userid, bookId } = useParams();

  // 对话状态
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationStartTime, setConversationStartTime] = useState(null);
  const [conversationDuration, setConversationDuration] = useState(0);

  // 对话计时器
  useEffect(() => {
    let interval;
    if (isConversationActive && conversationStartTime) {
      interval = setInterval(() => {
        setConversationDuration(
          Math.floor((Date.now() - conversationStartTime) / 1000)
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConversationActive, conversationStartTime]);

  const goBack = useCallback(() => {
    navigate(`/${userid}`);
  }, [userid, navigate]);

  // 开始对话
  const startConversation = useCallback(() => {
    setIsConversationActive(true);
    setConversationStartTime(Date.now());
    setConversationDuration(0);
    setConversationMessages([
      {
        id: 1,
        type: "system",
        content: "对话已开始",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 结束对话
  const endConversation = useCallback(() => {
    setIsConversationActive(false);
    setConversationMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: "system",
        content: "对话已结束",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // 格式化时间
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Fragment>
      <WebSocketSlot />
      <WavStreamPlayerSlot />
      <div className="ai-conversation-page">
        {/* 顶部导航栏 */}
        <div className="ai-page-header">
          <div className="ai-page-nav">
            <button className="back-btn" onClick={goBack}>
              <span className="back-icon">←</span>
              返回主页
            </button>
            <div className="ai-page-title">
              <span className="ai-icon">
                <img src="/images/AIBot.png" alt="AI" width={64} height={64} />
              </span>
              实时语音对话
            </div>
            <div className="user-code-display">{userid}</div>
          </div>
        </div>

        <div className="ai-page-content">
          {/* 对话区域 - 全屏显示 */}
          <div className="ai-conversation-main-full">
            {/* 对话信息面板 */}
            <div className="conversation-info-panel">
              <div className="conversation-status">
                <div
                  className={`status-indicator ${
                    isConversationActive ? "active" : "inactive"
                  }`}
                >
                  {isConversationActive ? "对话中" : "未开始"}
                </div>
                <div className="conversation-timer">
                  {formatDuration(conversationDuration)}
                </div>
              </div>

              <div className="conversation-controls">
                {/* 使用VoiceChat组件 */}
                <VoiceChat />

                <button
                  className={`ai-control-btn mute-btn ${
                    isMuted ? "muted" : ""
                  }`}
                  onClick={toggleMute}
                  disabled={!isConversationActive}
                >
                  <span className="btn-icon">{isMuted ? "🔇" : "🔊"}</span>
                  <span className="btn-text">
                    {isMuted ? "取消静音" : "静音"}
                  </span>
                </button>
              </div>
            </div>

            {/* 实时语音对话区域 */}
            <div className="realtime-conversation-wrapper">
              <div className="conversation-container">
                <div className="conversation-messages">
                  {conversationMessages.length === 0 ? (
                    <div className="empty-conversation">
                      <div className="empty-icon">💬</div>
                      <p>暂无对话记录</p>
                      <div className="conversation-tips">
                        <p>对话提示：</p>
                        <ul>
                          <li>点击"开始对话"按钮开始语音对话</li>
                          <li>对话过程中可以随时静音或结束</li>
                          <li>对话内容将实时显示在这里</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${message.type}`}
                      >
                        <div className="message-content">{message.content}</div>
                        <div className="message-time">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default AIConversationPage;
