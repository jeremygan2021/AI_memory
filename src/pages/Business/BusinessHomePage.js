import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BusinessHomePage.css';
// import MemoryTimeline from '../../components/common/MemoryTimeline';
// import BusinessMemoryTree from '../../components/common/BusinessMemoryTree';
import LifetimeTimeline from '../../components/common/LifetimeTimeline';
import WelcomeScreen from '../../components/common/WelcomeScreen';
import { getUserCode } from '../../utils/userCode';
import { formatBabyAge, calculateBabyAgeInMonths} from '../../services/babyInfoCloudService';
import { loadBabyBirthDateFromCloud, saveBabyBirthDateToCloud } from '../../services/babyInfoCloudService';

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
  
  // 出生日期相关状态
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyAgeMonths, setBabyAgeMonths] = useState(0);
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [isLoadingBirthDate, setIsLoadingBirthDate] = useState(false);
  
  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid) {
      // 验证用户ID格式（4字符）
      if (userid.length === 4 && /^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
        const upperUserCode = userid.toUpperCase();
        setUserCode(upperUserCode);
        // 同时存储到localStorage作为备份
        localStorage.setItem('currentUserCode', upperUserCode);
      } else {
        // 如果URL中的用户ID格式不正确，跳转到默认页面
        navigate('/');
      }
    } else {
      // 如果没有用户ID，显示输入提示
      setUserCode('');
    }
  }, [userid, navigate]);

  // 加载宝宝出生日期
  useEffect(() => {
    const loadBabyBirthDate = async () => {
      const currentUserCode = userCode || getUserCode();
      if (!currentUserCode) return;
      
      setIsLoadingBirthDate(true);
      
      try {
        // 首先尝试从云端加载
        const cloudResult = await loadBabyBirthDateFromCloud(currentUserCode);
        
        if (cloudResult.success && cloudResult.birthDate) {
          setBabyBirthDate(cloudResult.birthDate);
          const months = calculateBabyAgeInMonths(cloudResult.birthDate);
          setBabyAgeMonths(months);
          console.log('从云端加载宝宝出生日期成功:', cloudResult.birthDate);
        } else {
          // 云端加载失败，尝试从本地存储加载
          const localBirthDate = localStorage.getItem(`baby_birth_date_${currentUserCode}`);
          if (localBirthDate) {
            setBabyBirthDate(localBirthDate);
            const months = calculateBabyAgeInMonths(localBirthDate);
            setBabyAgeMonths(months);
            console.log('从本地加载宝宝出生日期:', localBirthDate);
          }
        }
      } catch (error) {
        console.error('加载宝宝出生日期失败:', error);
      } finally {
        setIsLoadingBirthDate(false);
      }
    };
    
    loadBabyBirthDate();
  }, [userCode]);

  // 保存宝宝出生日期
  const saveBabyBirthDate = async (date) => {
    const currentUserCode = userCode || getUserCode();
    if (!currentUserCode) return;
    
    try {
      // 尝试保存到云端
      const cloudResult = await saveBabyBirthDateToCloud(currentUserCode, date);
      
      if (cloudResult.success) {
        console.log('宝宝出生日期已保存到云端:', date);
      } else {
        console.warn('云端保存失败，仅保存到本地');
      }
      
      // 出错时也保存到本地
      setBabyBirthDate(date);
      const months = calculateBabyAgeInMonths(date);
      setBabyAgeMonths(months);
      localStorage.setItem(`baby_birth_date_${currentUserCode}`, date);
    } catch (error) {
      console.error('保存宝宝出生日期失败:', error);
      // 出错时也保存到本地
      setBabyBirthDate(date);
      const months = calculateBabyAgeInMonths(date);
      setBabyAgeMonths(months);
      localStorage.setItem(`baby_birth_date_${currentUserCode}`, date);
    }
  };

  // 开始编辑出生日期
  const startEditBirthDate = () => {
    setTempBirthDate(babyBirthDate || '');
    setIsEditingBirthDate(true);
  };

  // 取消编辑出生日期
  const cancelEditBirthDate = () => {
    setIsEditingBirthDate(false);
    setTempBirthDate('');
  };

  // 确认保存出生日期
  const confirmSaveBirthDate = async () => {
    if (tempBirthDate) {
      await saveBabyBirthDate(tempBirthDate);
    }
    setIsEditingBirthDate(false);
    setTempBirthDate('');
  };

  // 计算滑块的最大值（根据宝宝年龄动态设置）
  const calculateSliderMax = (currentAgeMonths) => {
    // 根据实际年龄加一岁（12个月）计算最大值
    return currentAgeMonths + 12;
  };

  // 处理月份滑块变化（禁用手动调节）
  const handleAgeSliderChange = (e) => {
    // 滑块已禁用，此函数不会被调用
    // 保留函数以避免错误
  };

  // 格式化年龄显示
  const formattedAge = useMemo(() => {
    return formatBabyAge(babyAgeMonths);
  }, [babyAgeMonths]);

  const handleNavigate = (page) => {
    const currentUserCode = userCode || getUserCode();
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

  // 跳转到相册页面（无上传功能）
  const goToGallery = useCallback(() => {
    const currentUserCode = userCode || getUserCode();
    if (currentUserCode) {
      navigate(`/${currentUserCode}/gallerys`);
    } else {
      alert('请先输入用户代码');
    }
  }, [navigate, userCode]);

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
        {/* <div className="chronos-logo">
          <span className="logo-icon">⏰</span>
          <span className="logo-text">CHRONOS</span>
        </div>
        <div className="chronos-search">
          <input type="text" placeholder="Search" className="search-input" />
        </div> */}
        <div className="chronos-nav">
          <div className="nav-item">首页</div>
          <div className="nav-item">录音</div>
          <div className="nav-item">上传</div>
          <div className="nav-item">回忆</div>
        </div>
        {/* <div className="chronos-user-controls">
          <div className="user-notifications">🔔</div>
          <div className="user-settings">⚙️</div>
          <div className="user-profile">👤</div>
        </div> */}
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
                    <div className="profile-name">NAME: {userCode}</div>
                    <div className="profile-birth">
                        {babyBirthDate ? new Date(babyBirthDate).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : '未设置出生日期'}
                    </div>
                </div>
                <div className="profile-stats">
                    <div className="stat-circle">
                        <div className="circle-progress"></div>
                        <div className="stat-text">
                            <div className="stat-number">1000</div>
                            <div className="stat-label">COMPLETE</div>
                        </div>
                    </div>
                    <div className="age-display">
                        <span className="age-label">年龄:</span>
                        <span className="age-value">{formattedAge}</span>
                        {isLoadingBirthDate ? (
                            <span className="loading-indicator">加载中...</span>
                        ) : (
                            <button 
                                className="edit-birth-date-btn" 
                                onClick={startEditBirthDate}
                                title="设置出生日期"
                            >
                                设置生日
                            </button>
                        )}
                    </div>
                </div>
                
                {/* 出生日期编辑器 */}
                {isEditingBirthDate && (
                    <div className="birth-date-editor">
                        <div className="editor-title">设置出生日期</div>
                        <input
                            type="date"
                            value={tempBirthDate}
                            onChange={(e) => setTempBirthDate(e.target.value)}
                            className="birth-date-input"
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <div className="editor-buttons">
                            <button 
                                className="cancel-btn" 
                                onClick={cancelEditBirthDate}
                            >
                                取消
                            </button>
                            <button 
                                className="save-btn" 
                                onClick={confirmSaveBirthDate}
                                disabled={!tempBirthDate}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                )}
                
                {/* 年龄进度条 */}
                {babyBirthDate && !isEditingBirthDate && (
                    <div className="baby-progress">
                        <div className="age-slider-container">
                            <input
                                type="range"
                                min="1"
                                max={calculateSliderMax(babyAgeMonths)}
                                value={babyAgeMonths}
                                onChange={handleAgeSliderChange}
                                className="age-slider"
                                disabled
                                readOnly
                            />
                            <div className="slider-marks">
                                <span>1月</span>
                                <span>
                                    {calculateSliderMax(babyAgeMonths) >= 12 
                                        ? `${Math.floor(calculateSliderMax(babyAgeMonths) / 12)}岁` 
                                        : `${calculateSliderMax(babyAgeMonths)}月`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
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
              <button className="upload-btn" onClick={goToGallery}>查看相册</button>
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
