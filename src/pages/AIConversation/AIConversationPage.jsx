import React, { useState, useCallback, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VolumeX, Volume2 } from "lucide-react";
import { WebSocketSlot } from "./components/websocket-slot";
import { WavStreamPlayerSlot } from "./components/wav-stream-player-slot";
import { BubbleList } from "./components/bubble-list";
import { BubbleEmpty } from "./components/bubble-empty";
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
    navigate(-1);
  }, [navigate]);

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
              AI书籍对话
            </div>
            <div className="user-code-display">{userid}</div>
          </div>
        </div>

        <div className="ai-page-content">
          {/* 对话区域 - 全屏显示 */}
          <div className="ai-conversation-main-full">
            {/* 对话信息面板 */}
            {/* <div className="conversation-info-panel">
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

            </div> */}

            {/* 实时语音对话区域 */}
            <div className="realtime-conversation-wrapper">
              <div className="conversation-container">
                <div className="conversation-messages">
                  <BubbleList />
                  <BubbleEmpty />
                </div>
              </div>
            </div>
            <div className="conversation-controls">
              <VoiceChat />
              <button
                className={`ai-control-btn mute-btn ${isMuted ? "muted" : ""}`}
                onClick={toggleMute}
                disabled={!isConversationActive}
              >
                <span className="btn-icon">
                  {isMuted ? <Volume2 /> : <VolumeX />}
                </span>
                <span className="btn-text">
                  {isMuted ? "取消静音" : "静音"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default AIConversationPage;
