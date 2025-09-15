import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Business/BusinessHomePage.css';
import WelcomeScreen from '../../components/common/WelcomeScreen';
import MemoryTimeline from '../../components/common/MemoryTimeline';
import ThemeSwitcher from '../../components/theme/ThemeSwitcher';
import { getUserCode } from '../../utils/userCode';
import {
  calculateBabyAgeInMonths,
  formatBabyAge,
  loadBabyBirthDateFromCloud,
  saveBabyBirthDateToCloud
} from '../../services/babyInfoCloudService';
import { listPdfsFromCloud } from '../../services/bookCloudService';
import { syncThemeOnStartup } from '../../themes/themeConfig';

const CombinedHomePage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [babyAgeMonths, setBabyAgeMonths] = useState(12);
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [isLoadingBirthDate, setIsLoadingBirthDate] = useState(false);
  const [booksCount, setBooksCount] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [showPdfList, setShowPdfList] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');
  
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
      const currentUserCode = getUserCode();
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

  // 同步宝宝出生日期
  useEffect(() => {
    const handleBirthDateUpdate = (event) => {
      const { birthDate, userCode: eventUserCode } = event.detail;
      if (eventUserCode === userCode && birthDate) {
        setBabyBirthDate(birthDate);
        const months = calculateBabyAgeInMonths(birthDate);
        setBabyAgeMonths(months);
        console.log('宝宝出生日期已同步更新:', birthDate);
      }
    };
    
    window.addEventListener('babyBirthDateUpdated', handleBirthDateUpdate);
    
    return () => {
      window.removeEventListener('babyBirthDateUpdated', handleBirthDateUpdate);
    };
  }, [userCode]);

  // 加载书籍数据
  useEffect(() => {
    if (userCode) {
      // 模拟加载书籍数据
      setBooksCount(3);
      setTotalConversations(15);
    }
  }, [userCode]);

  // 控制欢迎页面显示
  useEffect(() => {
    // 3秒后自动隐藏欢迎页面
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 同步主题设置
  useEffect(() => {
    const syncTheme = async () => {
      try {
        console.log('CombinedHomePage: 开始同步主题设置');
        const result = await syncThemeOnStartup();
        console.log('CombinedHomePage: 主题同步结果:', result);
      } catch (error) {
        console.error('CombinedHomePage: 主题同步失败:', error);
      }
    };
    
    syncTheme();
  }, []);

  // 监听主题变化事件
  useEffect(() => {
    const handleThemeChange = (event) => {
      console.log('CombinedHomePage: 收到主题变化事件:', event.detail.theme);
      // 可以在这里添加主题变化后的处理逻辑
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // 保存宝宝出生日期
  const saveBabyBirthDate = async (date) => {
    const currentUserCode = getUserCode();
    if (!currentUserCode || !date) return;
    
    try {
      // 保存到云端
      const cloudResult = await saveBabyBirthDateToCloud(currentUserCode, date);
      
      if (cloudResult.success) {
        setBabyBirthDate(date);
        const months = calculateBabyAgeInMonths(date);
        setBabyAgeMonths(months);
        
        // 同时保存到本地作为备份
        localStorage.setItem(`baby_birth_date_${currentUserCode}`, date);
        
        // 触发宝宝出生日期更新事件，通知其他页面同步
        const event = new CustomEvent('babyBirthDateUpdated', {
          detail: {
            birthDate: date,
            userCode: currentUserCode,
            timestamp: Date.now(),
            source: 'save'
          }
        });
        window.dispatchEvent(event);
        
        console.log('宝宝出生日期保存成功并触发同步事件:', date);
      } else {
        // 云端保存失败，至少保存到本地
        setBabyBirthDate(date);
        const months = calculateBabyAgeInMonths(date);
        setBabyAgeMonths(months);
        localStorage.setItem(`baby_birth_date_${currentUserCode}`, date);
        
        console.log('宝宝出生日期云端保存失败，已保存到本地:', date);
      }
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

  // 跳转到AI对话页面
  const goToAIConversation = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/ai-conversation`);
    }
  }, [userCode, navigate]);

  // 跳转到相册页面
  const goToGallery = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/gallerys`);
    }
  }, [userCode, navigate]);

  // 跳转到音频库页面
  const goToAudioLibrary = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/audio-library`);
    }
  }, [userCode, navigate]);

  // 格式化年龄显示 - 使用useMemo缓存
  const formattedAge = useMemo(() => {
    return formatBabyAge(babyAgeMonths);
  }, [babyAgeMonths]);

  // PDF相关功能
  const onViewPdfs = useCallback(async () => {
    if (!userCode) return;
    setPdfMessage('');
    const list = await listPdfsFromCloud(userCode);
    if (list.success) {
      setPdfFiles(list.files);
      setShowPdfList(true);
    } else {
      setPdfFiles([]);
      setShowPdfList(true);
      setPdfMessage(list.error || '获取PDF列表失败');
    }
  }, [userCode]);

  // 如果没有用户ID，显示输入界面
  if (!userid) {
    return <div>请输入用户代码</div>;
  }

  return (
    <div className="chronos-app">
      {/* 欢迎页面 */}
      {showWelcome && <WelcomeScreen />}

      {/* 主体内容区 - 单栏布局，与移动端保持一致 */}
      <div className="memory-main-single-column">
        {/* 用户账户信息 */}
        {!showWelcome && (
          <div className="user-account-card">
            <div className="user-code">{userCode}</div>
            <div className="user-status">✓ 已激活</div>
            <ThemeSwitcher compact={true} forceGreenTheme={true} />
          </div>
        )}
        
        {/* 用户信息 */}
        <div className="baby-info">
          <div className="baby-info-top">
            <div className="baby-avatar" />
            <div className="baby-age-display">
              <span className="age-label">年龄:</span>
              <span className="age-value">{formattedAge}</span>

              
              {isLoadingBirthDate ? (
                <span className="loading-indicator">加载中...</span>
              ) : (
                <button 
                  className="edit-birth-date-btn" 
                  onClick={startEditBirthDate}
                  title="设置用户出生日期"
                >
                  设置生日
                </button>
              )}
            </div>
          </div>
          
          {isEditingBirthDate && (
            <div className="birth-date-editor">
              <div className="editor-title">设置用户出生日期</div>
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
          
          {babyBirthDate && !isEditingBirthDate && (
            <div className="birth-date-display">
              <span className="birth-date-label">出生日期:</span>
              <span className="birth-date-value">
                {new Date(babyBirthDate).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
          
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
        </div>
        
        {/* 回忆书籍模块 */}
        <div className="book-memory-card" style={{top:'20px'}}>
          <div className="book-card-header">
            <div className="book-card-title">
              <span className="book-icon">📚</span>
              回忆书籍
            </div>
            <div className="book-card-stats">
              <span className="stat-item">
                <span className="stat-number">{booksCount}</span>
                <span className="stat-label">书籍</span>
              </span>
              <span className="stat-item">
                <span className="stat-number">{totalConversations}</span>
                <span className="stat-label">对话</span>
              </span>
            </div>
          </div>
          <div className="book-card-content">
            <p className="book-card-desc">查询书籍内容，与AI进行智能对话和内容检索</p>
            <div className="book-card-features">
              <span className="feature-tag">📖 内容检索</span>
              <span className="feature-tag">🤖 AI对话</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <button className="book-card-action" onClick={goToAIConversation}>
              开始AI对话
            </button>
            <button className="book-card-action" onClick={onViewPdfs} disabled={!userCode}>
              查看书籍列表
            </button>
          </div>
          {pdfMessage && (
            <div style={{ marginTop: 8, color: 'red', fontSize: 24 }}>{pdfMessage}</div>
          )}
          {showPdfList && (
            <div style={{ marginTop: 12, maxHeight: 220, overflowY: 'auto', borderTop: '1px dashed #e0e0e0', paddingTop: 10 }}>
              {pdfFiles.length === 0 ? (
                <div style={{ color:'#999', fontSize: 12 }}>暂无回忆书籍</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pdfFiles.map((f, idx) => (
                    <li key={f.objectKey || idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>我的回忆书籍</span>
                      <a href={f.url} target="_blank" rel="noreferrer" className="book-card-action1" style={{ padding:'6px 10px' }}>
                        查看
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        {/* 相册入口 */}
        <div className="mobile-gallery-entrance">
          <div className="mobile-gallery-card" onClick={goToGallery}>
            <div className="gallery-icon">📸</div>
            <div className="gallery-title">亲子相册</div>
            <div className="gallery-desc">点击查看相册</div>
            <button className="enter-gallery-btn">查看相册</button>
          </div>
        </div>
      </div>

      {/* 回忆时间线 - 移动端和平板端显示在底部 */}
      <div className="memory-timeline-mobile">
        <div className="memory-left-title">回忆时间线</div>
        <div className="memory-timeline-container">
          <MemoryTimeline userCode={userCode} />
        </div>
      </div>
    </div>
  );
};

export default CombinedHomePage;