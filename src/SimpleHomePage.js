import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import MemoryTimeline from './components/common/MemoryTimeline';
import WelcomeScreen from './components/common/WelcomeScreen';
import { getUserCode } from './utils/userCode';
import { uploadPdfToCloud, listPdfsFromCloud } from './services/bookCloudService';
import {
  calculateBabyAgeInMonths,
  formatBabyAge,
  loadBabyBirthDateFromCloud,
  saveBabyBirthDateToCloud
} from './services/babyInfoCloudService';

const SimpleHomePage = () => {
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
    <div className={`memory-app-bg`}>
      {/* 欢迎页面 */}
      {showWelcome && <WelcomeScreen />}

      {/* 主体内容区 - 单栏布局，与移动端保持一致 */}
      <div className="memory-main-single-column">
        {/* 用户账户信息 */}
        <div className="user-account-card">
          <div className="user-code">{userCode}</div>
          <div className="user-status">✓ 已激活</div>
        </div>
        
        {/* 宝宝信息 */}
        <div className="baby-info">
          <div className="baby-info-top">
            <div className="baby-avatar" />
            <div className="baby-age-display">
              <span className="age-label">宝宝年龄:</span>
              <span className="age-value">{formattedAge}</span>
              <span className="age-value">Baby</span>
              
              {isLoadingBirthDate ? (
                <span className="loading-indicator">加载中...</span>
              ) : (
                <button 
                  className="edit-birth-date-btn" 
                  onClick={startEditBirthDate}
                  title="设置宝宝出生日期"
                >
                  设置生日
                </button>
              )}
            </div>
          </div>
          
          {isEditingBirthDate && (
            <div className="birth-date-editor">
              <div className="editor-title">设置宝宝出生日期</div>
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
            <div style={{ marginTop: 8, color: '#4a90e2', fontSize: 12 }}>{pdfMessage}</div>
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
          <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={onChoosePdf} />
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

export default SimpleHomePage;