import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import './themes/pink-theme-overrides.css';
import MemoryTimeline from './components/common/MemoryTimeline';
import WelcomeScreen from './components/common/WelcomeScreen';
import ThemeSwitcher from './components/theme/ThemeSwitcher';
import { getUserCode } from './utils/userCode';
import { isWechatMiniProgram } from './utils/environment';
import { uploadPdfToCloud, listPdfsFromCloud } from './services/bookCloudService';
import {
  calculateBabyAgeInMonths,
  formatBabyAge,
  loadBabyBirthDateFromCloud,
  saveBabyBirthDateToCloud
} from './services/babyInfoCloudService';
import { syncThemeOnStartup } from './themes/themeConfig';

const MemoryPage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [babyAgeMonths, setBabyAgeMonths] = useState(12);
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [isLoadingBirthDate, setIsLoadingBirthDate] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isTabletView, setIsTabletView] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  const [booksCount, setBooksCount] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
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

  // 优化窗口大小监听 - 使用防抖
  useEffect(() => {
    let resizeTimer;
    
    const checkMobileView = () => {
      // 防抖处理，避免频繁更新
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newIsMobileView = window.innerWidth <= 768;
        const newIsTabletView = window.innerWidth >= 768 && window.innerWidth <= 1366;
        if (newIsMobileView !== isMobileView) {
          setIsMobileView(newIsMobileView);
        }
        if (newIsTabletView !== isTabletView) {
          setIsTabletView(newIsTabletView);
        }
      }, 100);
    };
    
    // 初始检查
    setIsMobileView(window.innerWidth <= 768);
    setIsTabletView(window.innerWidth >= 768 && window.innerWidth <= 1366);
    
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
      clearTimeout(resizeTimer);
    };
  }, [isMobileView, isTabletView]);

  // 加载云端相册
  const loadCloudMediaFiles = useCallback(async () => {
    if (!userCode) return;
    const prefix = `recordings/${userCode}/`;
    const API_BASE_URL = 'https://data.tangledup-ai.com';
    const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
    try {
      const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`);
      if (!response.ok) throw new Error('云端文件获取失败');
      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];
      // 只保留图片和视频
      const mapped = files.map(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
        const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
        if (!isImage && !isVideo) return null;
        const ossUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        
        // 获取显示名称：优先使用自定义名称，然后从文件名推导
        const displayName = fileName ? fileName.split('.')[0] : '未命名';
        
        return {
          id: fileName,
          name: displayName, // 使用自定义名称或推导的显示名称
          fileName: fileName, // 保留原始文件名
          preview: ossUrl, // 直接用OSS直链
          ossUrl,
          type: isImage ? 'image' : 'video',
          uploadTime: file.last_modified || file.lastModified || file.modified || '',
          objectKey,
          sessionId: objectKey && objectKey.split('/')[2],
          userCode,
        };
      }).filter(Boolean);
      // 按上传时间倒序，取前6个
      const sortedFiles = mapped.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setUploadedFiles(sortedFiles.slice(0, 6));
      setUploadedPhotos(sortedFiles.filter(f => f.type === 'image').slice(0, 6));
      setUploadedVideos(sortedFiles.filter(f => f.type === 'video').slice(0, 6));
    } catch (e) {
      // 云端失败时清空，不再回退本地
      setUploadedFiles([]);
      setUploadedPhotos([]);
      setUploadedVideos([]);
      console.error('云端相册加载失败:', e);
    }
  }, [userCode]);

  // 加载相册数据
  useEffect(() => {
    if (userCode) {
      loadCloudMediaFiles();
    }
  }, [userCode, loadCloudMediaFiles]);
  
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
        console.log('MemoryPage: 开始同步主题设置');
        const result = await syncThemeOnStartup();
        console.log('MemoryPage: 主题同步结果:', result);
      } catch (error) {
        console.error('MemoryPage: 主题同步失败:', error);
      }
    };
    
    syncTheme();
  }, []);

  // 监听主题变化事件
  useEffect(() => {
    const handleThemeChange = (event) => {
      console.log('MemoryPage: 收到主题变化事件:', event.detail.theme);
      // 可以在这里添加主题变化后的处理逻辑
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // 处理主题切换
  const handleThemeChange = (theme) => {
    console.log('MemoryPage: 主题已切换:', theme);
    // 可以在这里添加主题变化后的处理逻辑
  };

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
  
  // 打开预览（保留函数以避免错误）
  const openPreview = useCallback((idx) => {
    // 预览功能已集成到其他函数中
  }, []);
  
  // 切换照片显示（保留函数以避免错误）
  const togglePhotoDisplay = useCallback(() => {
    // 照片显示功能已集成到其他函数中
  }, []);
  
  // 切换视频显示（保留函数以避免错误）
  const toggleVideoDisplay = useCallback(() => {
    // 视频显示功能已集成到其他函数中
  }, []);
  
  // 使用openPreview、togglePhotoDisplay和toggleVideoDisplay变量以避免未使用变量警告
  useEffect(() => {
    // 确保函数被使用，但不执行任何操作
    console.debug('openPreview, togglePhotoDisplay and toggleVideoDisplay functions are available');
  }, [openPreview, togglePhotoDisplay, toggleVideoDisplay]);

  // 跳转到AI对话页面
  const goToAIConversation = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/ai-conversation`);
    }
  }, [userCode, navigate]);

  // 跳转到相册页面（无上传功能）
  const goToGallery = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/gallerys`);
    }
  }, [userCode, navigate]);


  // 大图预览相关函数
  const closePreview = useCallback(() => {
    setPreviewIndex(null);
    setPreviewFile(null);
  }, []);
  
  const showPrev = useCallback((e) => {
    e.stopPropagation();
    const mediaFiles = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + mediaFiles.length - 1) % mediaFiles.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(mediaFiles[newIndex]);
  }, [uploadedFiles, previewIndex]);
  
  const showNext = useCallback((e) => {
    e.stopPropagation();
    const mediaFiles = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + 1) % mediaFiles.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(mediaFiles[newIndex]);
  }, [uploadedFiles, previewIndex]);

  // 打开照片预览
  const openPhotoPreview = useCallback((idx) => {
    setPreviewPhoto(uploadedPhotos[idx]);
    setPreviewIndex(idx);
  }, [uploadedPhotos]);

  // 关闭照片预览
  const closePhotoPreview = useCallback(() => {
    setPreviewPhoto(null);
    setPreviewIndex(null);
  }, []);

  // 照片预览 - 上一张
  const showPrevPhoto = useCallback((e) => {
    e.stopPropagation();
    if (previewIndex !== null && uploadedPhotos.length > 0) {
      const newIndex = (previewIndex + uploadedPhotos.length - 1) % uploadedPhotos.length;
      setPreviewIndex(newIndex);
      setPreviewPhoto(uploadedPhotos[newIndex]);
    }
  }, [previewIndex, uploadedPhotos]);

  // 照片预览 - 下一张
  const showNextPhoto = useCallback((e) => {
    e.stopPropagation();
    if (previewIndex !== null && uploadedPhotos.length > 0) {
      const newIndex = (previewIndex + 1) % uploadedPhotos.length;
      setPreviewIndex(newIndex);
      setPreviewPhoto(uploadedPhotos[newIndex]);
    }
  }, [previewIndex, uploadedPhotos]);

  // 打开视频播放器（改为弹窗，不跳转）
  const openVideoPlayer = useCallback((idx) => {
    setPreviewFile(uploadedVideos[idx]);
    setPreviewIndex(idx);
  }, [uploadedVideos]);

  // 准备相册数据 - 使用useMemo优化
  const photoData = useMemo(() => {
    return uploadedPhotos.length > 0 ? uploadedPhotos : [];
  }, [uploadedPhotos]);
  
  const videoData = useMemo(() => {
    return uploadedVideos.length > 0 ? uploadedVideos : [];
  }, [uploadedVideos]);

  // 格式化年龄显示 - 使用useMemo缓存
  const formattedAge = useMemo(() => {
    return formatBabyAge(babyAgeMonths);
  }, [babyAgeMonths]);

  // 回忆书籍（PDF）相关逻辑
  const fileInputRef = React.useRef(null);
  const onClickUploadPdf = useCallback(() => {
    if (!userCode) return;
    if (fileInputRef.current) fileInputRef.current.click();
  }, [userCode]);

  const onChoosePdf = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPdfMessage('');
    setIsUploadingPdf(true);
    try {
      const result = await uploadPdfToCloud(userCode, file);
      if (result.success) {
        setPdfMessage('PDF上传成功');
        // 上传成功后刷新列表
        const list = await listPdfsFromCloud(userCode);
        if (list.success) setPdfFiles(list.files);
        setShowPdfList(true);
      } else {
        setPdfMessage(result.error || 'PDF上传失败');
      }
    } catch (err) {
      setPdfMessage(err.message || 'PDF上传异常');
    } finally {
      setIsUploadingPdf(false);
      // 清空 input 以便下次选择同一文件也能触发
      if (e.target) e.target.value = '';
    }
  }, [userCode]);

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
    // 无论是小程序还是H5都显示用户代码输入界面
    return <div>请输入用户代码</div>;
  }

   return (
    <div className={`memory-app-bg ${isWechatMiniProgram() ? 'miniprogram' : ''}`}>
      {/* 顶部导航栏 - 小程序环境下隐藏 */}
      {/* {!isWechatMiniProgram() && (
        <div className="memory-navbar">
          <div className="navbar-left">
            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/shouye.png" className="memory-logo" alt="logo" />
            <span className="memory-title">Memory</span>
          </div>
          <div className="navbar-center">
            <ModernSearchBox
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              onKeyPress={handleKeyPress}
              size="medium"
              width="100%"
            />
          </div>
          <div className="navbar-right">
            <span className="memory-icon bell" />
            <span className="memory-icon settings" />
            <span className="memory-icon user" />
            <ThemeSwitcher forceGreenTheme={true} />
          </div>
        </div>
      )} */}

       {/* 欢迎屏幕 */}
      <WelcomeScreen 
        visible={showWelcome} 
        onWelcomeComplete={() => setShowWelcome(false)} 
      />

       {/* 主体内容区 - 三栏布局 */}
      <div className="memory-main">
        {/* 左侧：用户信息、宝宝信息和其他功能 */}
        <div className="memory-left">
          <div className="memory-left-top">
            {/* 用户账户信息 */}
            <div className="user-account-card" style={{
              background: 'var(--theme-containerBg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: 'var(--theme-cardShadow)'
            }}>
              <div className="user-code" style={{
                color: 'var(--theme-primary)',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>{userCode}</div>
              {/* 主题切换器和操作按钮 */}
          {!showWelcome && <ThemeSwitcher onThemeChange={handleThemeChange} />}
              <div className="user-status" style={{
                color: 'var(--theme-primary)',
                fontSize: '14px'
              }}>✓ 已激活</div>
            </div>
            {/* 平板专用：录音和相册入口，相册在前 */}
            {isTabletView && (
              <>
               <div className="center-voice-card tablet-only">
                  <div className="voice-icon">🎤</div>
                  <div className="voice-title">录制我的声音</div>
                  <div className="voice-desc">智能语音助手，记录您的美好时光</div>
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
                </div>
                <div className="mobile-gallery-entrance mobile-left-gallery tablet-only">
                  <div className="mobile-gallery-card" onClick={goToGallery}>
                    <div className="gallery-icon">📸</div>
                    <div className="gallery-title">亲子相册</div>
                    <div className="gallery-desc">点击可查看相册</div>
                    <button 
                  className="view-gallery-btn"
                  onClick={goToGallery}
                >
                  查看完整相册
                </button>
                  </div>
                  {/* 最近媒体文件缩略图 */}
                  <div className="recent-media-thumbnails">
                    {uploadedFiles.slice(0, 6).map((file, index) => (
                      <div key={file.id || index} className="thumbnail-item" onClick={(e) => {
                        e.stopPropagation();
                        if (file.type === 'image') {
                          openPhotoPreview(uploadedPhotos.findIndex(p => p.id === file.id));
                        } else {
                          openVideoPlayer(uploadedVideos.findIndex(v => v.id === file.id));
                        }
                      }}>
                        {file.type === 'image' ? (
                          <img src={file.ossUrl || file.preview} alt={`缩略图${index + 1}`} className="thumbnail-img" />
                        ) : (
                          <div className="video-thumbnail">
                            <video 
                              src={file.ossUrl || file.preview} 
                              className="thumbnail-video" 
                              muted
                              preload="metadata"
                            />
                            <div className="video-play-icon">▶</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
               
              </>
            )}
            {/* 非平板：原有移动端录音和相册入口 */}
            {!isTabletView && (
              <>
                {isMobileView && (
                  <div className="mobile-gallery-entrance mobile-left-gallery">
                    <div className="mobile-gallery-card" onClick={goToGallery}>
                      <div className="gallery-icon">📸</div>
                      <div className="gallery-title">亲子相册</div>
                      <div className="gallery-desc">点击可查看相册</div>
                      <button 
                  className="view-gallery-btn"
                  onClick={goToGallery}
                >
                  查看完整相册
                </button>
                    </div>
                    {/* 最近媒体文件缩略图 */}
                    <div className="recent-media-thumbnails">
                      {uploadedFiles.slice(0, 6).map((file, index) => (
                        <div key={file.id || index} className="thumbnail-item" onClick={(e) => {
                          e.stopPropagation();
                          if (file.type === 'image') {
                            openPhotoPreview(uploadedPhotos.findIndex(p => p.id === file.id));
                          } else {
                            openVideoPlayer(uploadedVideos.findIndex(v => v.id === file.id));
                          }
                        }}>
                          {file.type === 'image' ? (
                            <img src={file.ossUrl || file.preview} alt={`缩略图${index + 1}`} className="thumbnail-img" />
                          ) : (
                            <div className="video-thumbnail">
                              <video 
                                src={file.ossUrl || file.preview} 
                                className="thumbnail-video" 
                                muted
                                preload="metadata"
                              />
                              <div className="video-play-icon">▶</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="center-voice-card mobile-voice-card">
                  <div className="voice-icon">🎤</div>
                  <div className="voice-title">录制我的声音</div>
                  <div className="voice-desc">智能语音助手，记录您的美好时光</div>
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
                </div>
              </>            )}
            {/* 用户信息 */}
            <div className="baby-info" style={{
              background: 'var(--theme-containerBg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: 'var(--theme-cardShadow)'
            }}>
              <div className="baby-info-top" style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
              <div className="baby-avatar" style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--theme-secondaryBg)',
                marginRight: '12px'
              }} />
                <div className="baby-age-display" style={{
                  flex: 1
                }}>
                  <span className="age-label" style={{
                    color: 'var(--theme-primary)',
                    fontSize: '14px',
                    marginRight: '8px'
                  }}>年龄:</span>
                  <span className="age-value" style={{
                    color: 'var(--theme-primary)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>{formattedAge}</span>

                  
                  {isLoadingBirthDate ? (
                    <span className="loading-indicator" style={{
                      color: 'var(--theme-primary)',
                      fontSize: '12px',
                      marginLeft: '8px'
                    }}>加载中...</span>
                  ) : (
                    <button 
                      className="edit-birth-date-btn" 
                      onClick={startEditBirthDate}
                      title="设置用户出生日期"
                      style={{
                        background: 'var(--theme-secondaryBg)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: 'var(--theme-primary)',
                        cursor: 'pointer',
                        marginLeft: '8px'
                      }}
                    >
                      设置生日
                    </button>
                  )}
                </div>
              </div>
              
              {isEditingBirthDate && (
                <div className="birth-date-editor" style={{
                  background: 'var(--theme-secondaryBg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '12px'
                }}>
                  <div className="editor-title" style={{
                    color: 'var(--theme-primary)',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>设置用户出生日期</div>
                  <input
                    type="date"
                    value={tempBirthDate}
                    onChange={(e) => setTempBirthDate(e.target.value)}
                    className="birth-date-input"
                    max={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}
                  />
                  <div className="editor-buttons" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px'
                  }}>
                    <button 
                      className="cancel-btn" 
                      onClick={cancelEditBirthDate}
                      style={{
                        background: 'var(--theme-containerBg)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        color: 'var(--theme-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      取消
                    </button>
                    <button 
                      className="save-btn" 
                      onClick={confirmSaveBirthDate}
                      disabled={!tempBirthDate}
                      style={{
                        background: tempBirthDate ? 'var(--theme-primary)' : 'var(--theme-border)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '14px',
                        color: 'var(--theme-buttonText)',
                        cursor: tempBirthDate ? 'pointer' : 'not-allowed'
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
              
              {babyBirthDate && !isEditingBirthDate && (
                <div className="birth-date-display" style={{
                  marginTop: '12px'
                }}>
                  <span className="birth-date-label" style={{
                    color: 'var(--theme-primary)',
                    fontSize: '14px',
                    marginRight: '8px'
                  }}>出生日期:</span>
                  <span className="birth-date-value" style={{
                    color: 'var(--theme-primary)',
                    fontSize: '14px'
                  }}>
                    {new Date(babyBirthDate).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              
              <div className="baby-progress" style={{
                marginTop: '16px'
              }}>
                <div className="age-slider-container" style={{
                  position: 'relative'
                }}>
                  {/* <div className="slider-label">
                    年龄调节: {babyAgeMonths}个月
                  </div> */}
                  <input
                    type="range"
                    min="1"
                    max={calculateSliderMax(babyAgeMonths)}
                    value={babyAgeMonths}
                    onChange={handleAgeSliderChange}
                    className="age-slider"
                    disabled
                    readOnly
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'var(--theme-secondaryBg)',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      margin: '8px 0'
                    }}
                  />
                  <div className="slider-marks" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    width: '100%',
                    padding: '0 2px',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{
                      flex: '0 0 auto',
                      textAlign: 'left',
                      marginLeft: '8px',
                      fontSize: '14px',
                      color: 'var(--theme-primary)',
                      fontWeight: '500'
                    }}>1月</span>
                    <span style={{
                      flex: '0 0 auto',
                      textAlign: 'right',
                      marginRight: '8px',
                      fontSize: '14px',
                      color: 'var(--theme-primary)',
                      fontWeight: '500'
                    }}>
                      {calculateSliderMax(babyAgeMonths) >= 12 
                        ? `${Math.floor(calculateSliderMax(babyAgeMonths) / 12)}岁` 
                        : `${calculateSliderMax(babyAgeMonths)}月`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 回忆时间线 */}
            <div className="memory-left-title">回忆时间线</div>
            <div className="memory-timeline-container">
              <MemoryTimeline userCode={userCode} />
            </div>
          </div>
          
          </div>

        {/* 中间：录制声音、亲子活动和活动时长 */}
        <div className="memory-center">
          {/* 录制声音功能 */}
          <div className="center-voice-card center-voice-card-center">
            <div className="voice-icon">🎤</div>
            <div className="voice-title">录制我的声音</div>
            <div className="voice-desc">智能语音助手，记录您的美好时光</div>
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
          </div>

          {/* 回忆书籍模块：AI对话 + PDF上传/查看 */}
          <div className="book-memory-card" style={{
  background: 'var(--theme-containerBg)',
  border: '1px solid var(--theme-border)',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: 'var(--theme-cardShadow)'
}}>
            <div className="book-card-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div className="book-card-title" style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="book-icon" style={{
                  fontSize: '20px'
                }}>📚</span>
                回忆书籍
              </div>
            </div>
            <div className="book-card-content">
              <p className="book-card-desc" style={{
                color: '#fff',
                fontSize: '14px',
                marginBottom: '12px'
              }}>与AI进行智能对话和内容检索</p>
              <div className="book-card-features" style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <span className="feature-tag" style={{
                  background: 'var(--theme-secondaryBg)',
                  color: 'var(--theme-primary)',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '12px'
                }}>🤖 AI对话</span>
                <span className="feature-tag" style={{
                  background: 'var(--theme-secondaryBg)',
                  color: 'var(--theme-primary)',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '12px'
                }}>📚 云端书籍</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              <button className="book-card-action" onClick={goToAIConversation} style={{
                background: 'var(--theme-primary)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                color: 'var(--theme-buttonText)',
                cursor: 'pointer'
              }}>
                开始AI对话
              </button>
              <button className="book-card-action" onClick={onViewPdfs} disabled={!userCode} style={{
                background: userCode ? 'var(--theme-secondaryBg)' : 'var(--theme-border)',
                border: '1px solid var(--theme-border)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                color: 'var(--theme-primary)',
                cursor: userCode ? 'pointer' : 'not-allowed'
              }}>
                查看书籍列表
              </button>
            </div>
            {pdfMessage && (
              <div style={{ marginTop: 8, color: 'var(--theme-primary)', fontSize: 14 }}>{pdfMessage}</div>
            )}
            {showPdfList && (
              <div style={{ marginTop: 12, maxHeight: 220, overflowY: 'auto', borderTop: '1px dashed var(--theme-border)', paddingTop: 10, scrollbarWidth: 'thin', scrollbarColor: 'var(--theme-primary, #3bb6a6) var(--theme-containerBg, #ffffff)' }}>
                {pdfFiles.length === 0 ? (
                  <div style={{ color:'var(--theme-primary)', fontSize: 12 }}>暂无回忆书籍</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {pdfFiles.map((f, idx) => (
                      <li key={f.objectKey || idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', gap:'10px' }}>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'30%', color: 'white', fontSize: 14 }}>我的回忆书籍</span>
                        <div style={{display: 'flex' , flex: '1' , gap:'5px', alignItems:'end'}}>
                          <a href={f.url} target="_blank" rel="noreferrer" className="book-card-action1" style={{ 
                            padding:'6px 10px',
                            background: 'var(--theme-secondaryBg)',
                            color: 'var(--theme-primary)',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            border: '1px solid var(--theme-border)'
                          }}>
                            查看
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={onChoosePdf} />
          </div>

          {/* AI音乐生成模块 - 新增入口卡片 */}
          <div className="ai-music-card">
            <div className="ai-music-card-header">
              <div className="ai-music-card-title">
                <span className="ai-music-icon">🎵</span>
                AI音乐生成
              </div>
            </div>
            <div className="ai-music-card-content">
              <p className="ai-music-card-desc">使用AI技术创作个性化音乐，为您的回忆增添美妙旋律</p>
              <div className="ai-music-card-features">
                <span className="feature-tag">🎼 智能创作</span>
                <span className="feature-tag">🎹 多种风格</span>
                <span className="feature-tag">🎧 高品质音效</span>
              </div>
            </div>
            <div className="wave-container">
                {Array.from({length: 50}, (_, i) => (
                  <div key={i} className="wave-bar" style={{
                    height: Math.random() * 40 + 10 + 'px',
                    animationDelay: i * 0.1 + 's'
                  }}></div>
                ))}
              </div>
          </div>
        </div>

        {/* 右侧：亲子相册 - 桌面端和平板端显示 */}
        {(!isMobileView || isTabletView) && (
          <div className="memory-right">
            {/* 合并的亲子媒体模块 */}
            <div className="activity-board media-board media-board-right">
              {/* 标签导航 */}
              <div className="media-tabs">
                <div 
                  className={`media-tab ${activeMediaTab === 'photos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('photos')}
                >
                  照片
                </div>
                <div 
                  className={`media-tab ${activeMediaTab === 'videos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('videos')}
                >
                  视频
                </div>
              </div>
              
              {/* 查看相册按钮 */}
              <div className="view-gallery-btn-container">
                <button 
                  className="view-gallery-btn"
                  onClick={goToGallery}
                >
                  查看完整相册
                </button>
              </div>
              
              {/* 内容区域 */}
              <div className="media-content">
                {activeMediaTab === 'photos' ? (
                  /* 照片内容 */
                  <div className="album-list">
                    {photoData.length === 0 ? (
                      <div className="empty-album">
                        <div className="empty-icon">📷</div>
                        <div className="empty-text">还没有上传任何照片</div>
                      </div>
                    ) : (
                      photoData.slice(0, 5).map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="album-item"
                          style={{width:'100%', height:'240px', top:'10px'}}
                          onClick={() => openPhotoPreview(idx)}
                        >
                          <img
                            src={file.ossUrl || file.preview}
                            style={{marginTop:'10px'}}
                            className="album-img"
                            alt={file.name || `照片${idx + 1}`}
                          />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* 视频内容 */
                  <div className="album-list">
                    {videoData.length === 0 ? (
                      <div className="empty-album">
                        <div className="empty-icon">🎬</div>
                        <div className="empty-text">还没有上传任何视频</div>
                        <div className="empty-desc">点击"上传视频"开始记录美好时光</div>
                      </div>
                    ) : (
                      videoData.slice(0, 5).map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="album-item"
                          style={{width:'100%', height:'240px'}}
                          onClick={() => openVideoPlayer(idx)}
                        >
                          <div className="video-preview-container">
                            <video
                              src={file.ossUrl || file.preview}
                              className="album-img"
                              muted
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                e.target.currentTime = 1;
                              }}
                            />
                            <div className="video-overlay">
                              <img src="./asset/play_button.png" className="play-icon" alt="播放" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 大图预览弹窗 */}
      {previewIndex !== null && previewFile && (
        <div className="album-preview-mask" onClick={closePreview}>
          <div className="album-preview-box" onClick={e => e.stopPropagation()}>
            {previewFile.type === 'video' ? (
              <video 
                className="album-preview-video" 
                src={previewFile.ossUrl || previewFile.preview} 
                controls 
                autoPlay
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <img className="album-preview-img" src={previewFile.ossUrl || previewFile.preview} alt="大图预览" />
            )}
            <button className="album-preview-close" onClick={closePreview}>×</button>
            <button className="album-preview-arrow left" onClick={showPrev}>‹</button>
            <button className="album-preview-arrow right" onClick={showNext}>›</button>
          </div>
        </div>
      )}

      {/* 照片预览弹窗 */}
      {previewPhoto && (
        <div className="album-preview-mask" onClick={closePhotoPreview}>
          <div className="album-preview-box" onClick={e => e.stopPropagation()}>
            <img className="album-preview-img" src={previewPhoto.preview} alt="照片预览" />
            <button className="album-preview-close" onClick={closePhotoPreview}>×</button>
            {uploadedPhotos.length > 1 && (
              <>
                <button className="album-preview-arrow left" onClick={showPrevPhoto}>‹</button>
                <button className="album-preview-arrow right" onClick={showNextPhoto}>›</button>
              </>
            )}
          </div>
        </div>
      )}



          </div>
  );
};

export default MemoryPage;