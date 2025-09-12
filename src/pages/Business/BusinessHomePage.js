import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BusinessHomePage.css';
// import MemoryTimeline from '../../components/common/MemoryTimeline';
// import BusinessMemoryTree from '../../components/common/BusinessMemoryTree';
import LifetimeTimeline from '../../components/common/LifetimeTimeline';
import WelcomeScreen from '../../components/common/WelcomeScreen';
import { getUserCode } from '../../utils/userCode';
import { formatBabyAge } from '../../services/babyInfoCloudService';

const BusinessHomePage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [protagonistAgeMonths] = useState(24); // 改为主人公年龄
  const [uploadedPhotos] = useState([
    // 添加一些示例照片数据用于时间轴显示
    { id: 1, name: '家庭聚会', createTime: Date.now() - 86400000 * 7, type: 'photo' },
    { id: 2, name: '生日庆祝', createTime: Date.now() - 86400000 * 14, type: 'photo' },
    { id: 3, name: '旅行记录', createTime: Date.now() - 86400000 * 30, type: 'photo' },
  ]);
  const [booksCount] = useState(0);
  const [totalConversations] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid) {
      setUserCode(userid);
    } else {
      const code = getUserCode();
      if (code) {
        setUserCode(code);
      }
    }
  }, [userid]);

  // 格式化年龄显示
  const formattedAge = useMemo(() => {
    return formatBabyAge(protagonistAgeMonths);
  }, [protagonistAgeMonths]);

  const handleNavigate = (page) => {
    const currentUserCode = getUserCode();
    if (!currentUserCode) {
      alert('请先输入用户代码');
      return;
    }

    switch (page) {
      case 'audio-library':
        navigate(`/${currentUserCode}/audio-library`);
        break;
      case 'gallery':
        navigate(`/${currentUserCode}/gallery`);
        break;
      case 'ai-conversation':
        navigate(`/${currentUserCode}/ai-conversation`);
        break;
      case 'user-profile':
        navigate(`/${currentUserCode}/user-profile`);
        break;
      default:
        break;
    }
  };

  // 处理欢迎页面完成
  const handleWelcomeFinished = () => {
    setShowWelcome(false);
  };

  return (
    <div className="chronos-app">
      {/* 欢迎页面 */}
      {showWelcome && <WelcomeScreen onFinished={handleWelcomeFinished} />}
      
      {/* 顶部导航栏 */}
      <div className="chronos-header">
        <div className="chronos-logo">
          <span className="logo-icon">⏰</span>
          <span className="logo-text">CHRONOS</span>
        </div>
        <div className="chronos-search">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
        <div className="chronos-nav">
          <div className="nav-item">首页</div>
          <div className="nav-item active">HOME</div>
          <div className="nav-item">AUDIO</div>
          <div className="nav-item">上传</div>
          <div className="nav-item">回忆</div>
        </div>
        <div className="chronos-user-controls">
          <div className="user-notifications">🔔</div>
          <div className="user-settings">⚙️</div>
          <div className="user-profile">👤</div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="chronos-main">
        {/* 左侧用户信息 */}
        <div className="chronos-sidebar-left">
          <div className="user-profile-card">
            <div className="profile-avatar">
              <div className="avatar-3d">
                <div className="wireframe-head"></div>
              </div>
            </div>
            <div className="profile-info">
              <h3>YOUR PROFILE</h3>
              <div className="profile-details">
                <div className="profile-name">NAME: {userCode || 'John Smith'}</div>
                <div className="profile-birth">1996 年 28, 1980 日</div>
              </div>
              <div className="profile-stats">
                <div className="stat-circle">
                  <div className="circle-progress"></div>
                  <div className="stat-text">
                    <div className="stat-number">1000</div>
                    <div className="stat-label">COMPLETE</div>
                  </div>
                </div>
                <div className="age-display">{formattedAge}</div>
              </div>
            </div>
          </div>
          
          <LifetimeTimeline 
            userCode={userCode}
            photos={uploadedPhotos}
            videos={[
              { id: 1, name: '回忆视频', createTime: Date.now() - 86400000 * 3, type: 'video' }
            ]}
            conversations={[
              { id: 1, name: 'AI对话记录', createTime: Date.now() - 86400000 * 1, type: 'conversation' },
              { id: 2, name: '情感分析', createTime: Date.now() - 86400000 * 5, type: 'conversation' }
            ]}
          />
        </div>

        {/* 中央内容区 */}
        <div className="chronos-center">
          {/* 录音功能区 */}
          <div className="recording-section">
            <div className="recording-header">
              <div className="mic-icon">🎤</div>
              <h2>录制我的声音</h2>
              <p>智能语音助手，记录您的每时每刻</p>
            </div>
            <div className="waveform">
              <div className="wave-container">
                {Array.from({length: 50}, (_, i) => (
                  <div key={i} className="wave-bar" style={{
                    height: Math.random() * 40 + 10 + 'px',
                    animationDelay: i * 0.1 + 's'
                  }}></div>
                ))}
              </div>
            </div>
            <div className="recording-controls">
              <button className="record-btn">开始录制</button>
            </div>
          </div>

          {/* 回忆书籍区域 */}
          <div className="memory-books-section">
            <div className="books-header">
              <div className="books-icon animated-icon">📚</div>
              <h3>回忆书籍</h3>
              <div className="stats-container">
                <div className="books-count">
                  <span className="count-number animated-count">{booksCount}</span>
                  <span className="count-label">本书</span>
                </div>
                <div className="conversations-count">
                  <span className="count-number animated-count">{totalConversations}</span>
                  <span className="count-label">对话</span>
                </div>
              </div>
            </div>
            <p>与 AI 进行智能对话和内容推荐</p>
            <div className="action-buttons">
              <button className="ai-chat-btn" onClick={() => handleNavigate('ai-conversation')}>
                🤖 AI对话
              </button>
              <button className="upload-book-btn">
                📚 首批书籍
              </button>
            </div>
          </div>
        </div>

        {/* 右侧媒体管理 */}
        <div className="chronos-sidebar-right">
          <div className="media-management">
            <div className="media-tabs">
              <div className="tab active">🖼️ 我的照片</div>
              <div className="tab">🎬 视频</div>
            </div>
            <div className="upload-section">
              <button className="upload-btn">上传照片</button>
            </div>
            <div className="media-preview">
              <div className="preview-placeholder">
                <div className="preview-icon">📷</div>
                <div className="preview-count">{uploadedPhotos.length}</div>
                <p>No photos uploaded yet. Click to begin visual history.</p>
              </div>
            </div>
            <div className="media-stats">
              <div className="stat-dot active"></div>
              <div className="stat-dot"></div>
              <div className="stat-dot"></div>
              <div className="pagination">1 2 3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHomePage;
