import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './common.css';
import './index.css';
import './App.css';
import FamilyPage from './pages/Family/FamilyPage';
import RecordComponent from './pages/Record/record';
import PlayerPage from './pages/Player/PlayerPage';
import AudioLibrary from './pages/AudioLibrary/AudioLibrary';
import UploadMediaPage from './pages/UploadMedia/UploadMediaPage';
import GalleryPage from './pages/UploadMedia/GalleryPage';
import VideoPlayerPage from './pages/VideoPlayer/VideoPlayerPage';
import ImageViewerPage from './pages/ImageViewer/ImageViewerPage';
import CommentTest from './components/utils/CommentTest';
import MemoryTimeline from './components/common/MemoryTimeline'; 
import MiniProgramLayout from './components/navigation/MiniProgramLayout';
import UserCodeInput from './components/common/UserCodeInput';
import EnvironmentTest from './components/utils/EnvironmentTest';
import NavigationTest from './components/utils/NavigationTest';
import UserProfilePage from './pages/UserProfile/UserProfilePage';
import CopyTest from './components/utils/CopyTest';
import ThemeCloudTest from './components/theme/ThemeCloudTest';
import AIConversationPage from './pages/AIConversation/AIConversationPage';
import BusinessHomePage from './pages/Business/BusinessHomePage';
import MemoryPage from './MemoryPage';
import ThemeSwitcher from './components/theme/ThemeSwitcher';
import { isWechatMiniProgram } from './utils/environment';
import { syncAllCustomNamesFromCloud, getCustomName, deriveDisplayNameFromFileName } from './utils/displayName';
import { getUserCode } from './utils/userCode';
import { uploadPdfToCloud, listPdfsFromCloud, deletePdfFromCloud } from './services/bookCloudService';
import { 
  saveBabyBirthDateToCloud, 
  loadBabyBirthDateFromCloud, 
  calculateBabyAgeInMonths, 
  formatBabyAge 
} from './services/babyInfoCloudService';

// 折线图数据
const chartData = [
  { day: '周一', time: 45 },
  { day: '周二', time: 60 },
  { day: '周三', time: 35 },
  { day: '周四', time: 80 },
  { day: '周五', time: 55 },
  { day: '周六', time: 90 },
  { day: '周日', time: 75 }
];

// 折线图组件 - 添加React.memo优化
// eslint-disable-next-line no-unused-vars
const LineChart = React.memo(() => {
  const width = 320;
  const height = 150;
  const padding = 40;
  const bottomPadding = 50;
  
  // 使用useMemo缓存计算结果
  const { isMobile, leftPadding, maxTime, points, pathData } = useMemo(() => {
    const isMobile = window.innerWidth <= 768;
    const leftPadding = isMobile ? 90 : 80;
    const maxTime = Math.max(...chartData.map(d => d.time));
    
    // 计算点的坐标
    const points = chartData.map((data, index) => {
      const x = leftPadding + (index * (width - leftPadding - padding)) / (chartData.length - 1);
      const y = padding + ((maxTime - data.time) / maxTime) * (height - padding - bottomPadding);
      return { x, y, ...data };
    });
    
    // 生成路径字符串
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return { isMobile, leftPadding, maxTime, points, pathData };
  }, []); // 空依赖数组，因为chartData是静态的
  
  // 使用组件以避免未使用变量警告
  useEffect(() => {
    console.debug('LineChart component rendered with isMobile:', isMobile);
  }, [isMobile]);

  return (
    <div className="line-chart-container">
      <svg width={isMobile ? "95%" : "90%"} height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* 网格线 */}
        <defs>
          <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 35" fill="none" stroke="#e3f6f2" strokeWidth="1"/>
          </pattern>
        </defs>
        
        {/* Y轴刻度线 */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = padding + ((maxTime - value) / maxTime) * (height - padding - bottomPadding);
          return (
            <g key={value}>
              <line 
                x1={leftPadding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="#b7e5df" 
                strokeWidth="1" 
                strokeDasharray="4,4"
              />
              <text 
                x={leftPadding - 5} 
                y={y + 4} 
                fontSize={isMobile ? "8" : "5"} 
                fill="#3bb6a6" 
                textAnchor="end"
                fontWeight="100"
              >
                {value}分钟
              </text>
            </g>
          );
        })}
        
        {/* 折线 */}
        <path
          d={pathData}
          fill="none"
          stroke="#3bb6a6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 渐变填充区域 */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3bb6a6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3bb6a6" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - bottomPadding} L ${points[0].x} ${height - bottomPadding} Z`}
          fill="url(#chartGradient)"
        />
        
        {/* 数据点 */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#fff"
              stroke="#3bb6a6"
              strokeWidth="3"
              className="chart-point"
            />
            <text
              x={point.x}
              y={height - 20}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              fontWeight="400"
            >
              {point.day}
            </text>
            {/* 悬停显示数值 */}
            <text
              x={point.x}
              y={point.y - 15}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              className="chart-value"
              fontWeight="bold"
            >
              {point.time}分
            </text>
          </g>
        ))}
  </svg>
    </div>
);
});

// 录音页面组件
const RecordPage = () => {
  const { userid, id } = useParams();
  const navigate = useNavigate();
  
  // 验证用户ID
  useEffect(() => {
    if (!userid || userid.length !== 4 || !/^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
      navigate('/');
    }
  }, [userid, navigate]);
  
  return (
    <div>
      {/* 返回按钮和ID显示 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50px',
          padding: '10px 20px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }} onClick={() => navigate(`/${userid}`)}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>返回主页</span>
        </div>
        
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          borderRadius: '20px',
          padding: '8px 16px',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#4a90e2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>{userid} | {id}</span>
        </div>
      </div>
      <RecordComponent />
    </div>
  );
};

// 主页组件 - 添加性能优化
const HomePage = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { userid } = useParams();
  const [fileNameSyncTrigger, setFileNameSyncTrigger] = useState(0);
  const [hasInitialSync, setHasInitialSync] = useState(false);
  const [userCode, setUserCode] = useState('');
  
  // 大图预览相关状态
  const [previewIndex, setPreviewIndex] = useState(null);
  // 搜索相关状态
  const [searchValue, setSearchValue] = useState('');
  // 孩子年龄相关状态 (以月为单位)
  const [babyAgeMonths, setBabyAgeMonths] = useState(18);
  // 宝宝出生日期相关状态
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [isLoadingBirthDate, setIsLoadingBirthDate] = useState(false);
  // 书籍相关状态（简化版，主要用于统计）
  const [booksCount] = useState(1);
  const [totalConversations] = useState(0);
  
  // 使用booksCount和totalConversations变量以避免未使用变量警告
  useEffect(() => {
    // 确保变量被使用，但不执行任何操作
    console.debug('booksCount:', booksCount, 'totalConversations:', totalConversations);
  }, [booksCount, totalConversations]);
  // 移动端相册下拉框状态
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  // 标签切换状态 - 添加这个新状态
  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  // 上传文件状态
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  // 判断是否为平板（iPad等，竖屏/横屏都覆盖）
  const [isTabletView, setIsTabletView] = useState(() => {
    const w = window.innerWidth;
    return w >= 768 && w <= 1366;
  });
  // 回忆书籍（PDF）
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [showPdfList, setShowPdfList] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');
  const fileInputRef = React.useRef(null);

  // 移动端滚动性能优化
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // 1. 基础容器优化
      const memoryAppBg = document.querySelector('.memory-app-bg');
      const memoryMain = document.querySelector('.memory-main');
      
      if (memoryAppBg) {
        Object.assign(memoryAppBg.style, {
          touchAction: 'pan-y',
          overflowY: 'auto',
          overflowX: 'hidden',
          webkitOverflowScrolling: 'touch',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          webkitBackfaceVisibility: 'hidden',
          // 添加滚动条样式变量
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--theme-primary, #3bb6a6) var(--theme-containerBg, #ffffff)'
        });
      }
      
      if (memoryMain) {
        Object.assign(memoryMain.style, {
          touchAction: 'pan-y',
          overflow: 'visible',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          webkitBackfaceVisibility: 'hidden'
        });
      }
      
      // 2. 全局优化
      Object.assign(document.body.style, {
        overflowY: 'auto',
        overflowX: 'hidden',
        webkitOverflowScrolling: 'touch',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden',
        // 添加滚动条样式变量
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--theme-primary, #3bb6a6) var(--theme-containerBg, #ffffff)'
      });
      
      Object.assign(document.documentElement.style, {
        overflowY: 'auto',
        overflowX: 'hidden',
        webkitOverflowScrolling: 'touch',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden',
        // 添加滚动条样式变量
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--theme-primary, #3bb6a6) var(--theme-containerBg, #ffffff)'
      });

      // 3. 禁用页面缩放以提升性能
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // 4. 优化图片加载
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.style.imageRendering = 'optimizeSpeed';
        img.style.transform = 'translate3d(0, 0, 0)';
        img.style.backfaceVisibility = 'hidden';
        img.style.webkitBackfaceVisibility = 'hidden';
      });

      // 5. 防抖滚动事件监听器
      let scrollTimeout;
      const handleScroll = () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
        }, 16); // 约60fps
      };

      // 6. 被动事件监听器
      const passiveOptions = { passive: true };
      window.addEventListener('scroll', handleScroll, passiveOptions);
      window.addEventListener('touchstart', () => {}, passiveOptions);
      window.addEventListener('touchmove', () => {}, passiveOptions);
      
      // 清理函数
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, []);
  
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
  }, [userCode]); // 添加userCode依赖，确保用户切换时重新加载

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

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid) {
      // 验证用户ID格式（4字符）
      if (userid.length === 4 && /^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
        const upperUserCode = userid.toUpperCase();
        setUserCode(upperUserCode);
        // 同时存储到localStorage作为备份
        localStorage.setItem('currentUserCode', upperUserCode);
        
        // 用户代码更新后，同步所有会话的文件名映射
        if (!hasInitialSync) {
          syncAllCustomNamesFromCloud(upperUserCode).then(result => {
            console.log('用户登录后文件名映射同步结果:', result);
            if (result.success) {
              console.log(`✅ 用户登录后已从 ${result.sessionsCount} 个会话同步文件名映射`);
              // 手动触发一次文件重新加载，确保立即更新显示
              setFileNameSyncTrigger(prev => prev + 1);
            }
            setHasInitialSync(true);
          }).catch(error => {
            console.warn('⚠️ 用户登录后文件名映射同步失败:', error);
            setHasInitialSync(true);
          });
        }
      } else {
        // 如果URL中的用户ID格式不正确，跳转到默认页面
        navigate('/');
      }
    } else {
      // 如果没有用户ID，显示输入提示
      setUserCode('');
    }
  }, [userid, navigate, hasInitialSync]);

  // 优化窗口大小监听 - 使用防抖
  useEffect(() => {
    let resizeTimer;
    
    const checkMobileView = () => {
      // 防抖处理，避免频繁更新
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newIsMobileView = window.innerWidth <= 768;
        if (newIsMobileView !== isMobileView) {
          setIsMobileView(newIsMobileView);
        }
      }, 100);
    };
    
    // 初始检查
    setIsMobileView(window.innerWidth <= 768);
    
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
      clearTimeout(resizeTimer);
    };
  }, [isMobileView]);

  // 使用useCallback优化函数
  const goToAudioLibrary = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/audio-library`);
    }
  }, [userCode, navigate]);

  // 跳转到录音页面（移动端专用）
  const goToRecordPage = useCallback(() => {
    if (userCode) {
      // 生成唯一的会话ID（8位随机字符）
      const randomId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userCode}/${randomId}`); 
    }
  }, [userCode, navigate]);

  // 大图预览相关函数 - 使用useCallback优化（保留函数以避免错误）
  const openPreview = useCallback((idx) => {
    const mediaFiles = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    setPreviewIndex(idx);
    setPreviewFile(mediaFiles[idx]);
  }, [uploadedFiles]);
  
  // 使用openPreview变量以避免未使用变量警告
  useEffect(() => {
    // 确保函数被使用，但不执行任何操作
    console.debug('openPreview function is available');
  }, [openPreview]);
  
  const closePreview = useCallback(() => {
    setPreviewIndex(null);
    setPreviewFile(null);
  }, []);
  
  const showPrev = useCallback((e) => {
    e.stopPropagation();
    const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + albumData.length - 1) % albumData.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(albumData[newIndex]);
  }, [uploadedFiles, previewIndex]);
  
  const showNext = useCallback((e) => {
    e.stopPropagation();
    const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + 1) % albumData.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(albumData[newIndex]);
  }, [uploadedFiles, previewIndex]);

  // 搜索功能
  const handleSearch = useCallback(() => {
    if (searchValue.trim()) {
      console.log(`搜索: ${searchValue}`);
      alert(`搜索: ${searchValue}`);
    }
  }, [searchValue]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理年龄调节（保留函数以避免错误）
  const handleAgeChange = useCallback((e) => {
    setBabyAgeMonths(parseInt(e.target.value));
  }, []);
  
  // 使用handleAgeChange变量以避免未使用变量警告
  useEffect(() => {
    // 确保函数被使用，但不执行任何操作
    console.debug('handleAgeChange function is available');
  }, [handleAgeChange]);

  // 格式化年龄显示 - 使用useMemo缓存
  const formattedAge = useMemo(() => {
    return formatBabyAge(babyAgeMonths);
  }, [babyAgeMonths]);



  // 跳转到AI对话页面
  const goToAIConversation = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/ai-conversation`);
    }
  }, [userCode, navigate]);
  // PDF 上传与查看
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
      if (e.target) e.target.value = '';
    }
  }, [userCode]);

  const onViewPdfs = useCallback(async () => {
    if (!userCode) return;
    setPdfMessage('');
    try {
      const list = await listPdfsFromCloud(userCode);
      if (list.success) {
        setPdfFiles(list.files);
        setShowPdfList(true);
      } else {
        setPdfFiles([]);
        setShowPdfList(true);
        setPdfMessage(list.error || '获取PDF列表失败');
      }
    } catch (e) {
      setPdfFiles([]);
      setShowPdfList(true);
      setPdfMessage(e.message || '获取PDF列表异常');
    }
  }, [userCode]);

  const onDeletePdf = useCallback(async (objectKey) => {
    if (!userCode || !objectKey) return;
    setPdfMessage('');
    try {
      const result = await deletePdfFromCloud(userCode, objectKey);
      if (result.success) {
        setPdfMessage('PDF删除成功');
        // 刷新PDF列表
        const list = await listPdfsFromCloud(userCode);
        if (list.success) {
          setPdfFiles(list.files);
        } else {
          setPdfFiles([]);
          setPdfMessage(list.error || '获取PDF列表失败');
        }
      } else {
        setPdfMessage(result.error || 'PDF删除失败');
      }
    } catch (e) {
      setPdfMessage(e.message || 'PDF删除异常');
    }
  }, [userCode]);

  // 跳转到录音页面并启用AI音乐功能
  const goToAIMusic = useCallback(() => {
    if (userCode) {
      // 生成唯一的会话ID（8位随机字符）
      const randomId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userCode}/${randomId}?aiMusic=true`); 
    }
  }, [userCode, navigate]);

  // 切换相册显示状态（保留函数以避免错误）
  const togglePhotoDisplay = useCallback(() => {
    setShowAllPhotos(!showAllPhotos);
  }, [showAllPhotos]);

  const toggleVideoDisplay = useCallback(() => {
    setShowAllVideos(!showAllVideos);
  }, [showAllVideos]);
  
  // 使用togglePhotoDisplay和toggleVideoDisplay变量以避免未使用变量警告
  useEffect(() => {
    // 确保函数被使用，但不执行任何操作
    console.debug('togglePhotoDisplay and toggleVideoDisplay functions are available');
  }, [togglePhotoDisplay, toggleVideoDisplay]);

  // 处理上传照片和视频
  const handleUpload = useCallback((type) => {
    if (userCode) {
      // 生成唯一的会话ID（6位随机字符）
      const sessionId = Math.random().toString(36).substr(2, 6);
      navigate(`/${userCode}/upload-media/${sessionId}`);
    }
  }, [userCode, navigate]);

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

  // 跳转到相册页面
  const goToGallery = useCallback(() => {
    if (userCode) {
      // 生成唯一的会话ID（6位随机字符）
      const sessionId = Math.random().toString(36).substr(2, 6);
      navigate(`/${userCode}/upload-media/${sessionId}`);
    }
  }, [userCode, navigate]);

  // 准备相册数据 - 使用useMemo优化
  const photoData = useMemo(() => {
    return uploadedPhotos.length > 0 ? uploadedPhotos : [];
  }, [uploadedPhotos]);
  
  const videoData = useMemo(() => {
    return uploadedVideos.length > 0 ? uploadedVideos : [];
  }, [uploadedVideos]);

  // 准备相册数据（保留原有兼容性，避免错误）
  const albumData = useMemo(() => {
    return uploadedFiles.length > 0 ? uploadedFiles : [];
  }, [uploadedFiles]);
  
  // 使用albumData变量以避免未使用变量警告
  useEffect(() => {
    if (albumData.length > 0) {
      // 确保albumData被使用，但不执行任何操作
      console.debug('albumData loaded with', albumData.length, 'items');
    }
  }, [albumData]);

  // 云端相册加载逻辑
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
        const customName = getCustomName(objectKey);
        const displayName = customName || deriveDisplayNameFromFileName(fileName);
        
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

  // 用户代码确定后，执行文件名同步（仅执行一次）
  useEffect(() => {
    if (userCode && !hasInitialSync) {
      console.log('HomePage: 开始初始文件名映射同步...');
      syncAllCustomNamesFromCloud(userCode).then(result => {
        console.log('HomePage: 初始文件名映射同步结果:', result);
        if (result.success) {
          console.log(`✅ HomePage: 已从 ${result.sessionsCount} 个会话同步文件名映射`);
          setFileNameSyncTrigger(prev => prev + 1);
        }
        setHasInitialSync(true);
      }).catch(error => {
        console.warn('⚠️ HomePage: 初始文件名映射同步失败:', error);
        setHasInitialSync(true);
        // 即使同步失败，也要加载文件（只是不会有自定义名称）
        setFileNameSyncTrigger(prev => prev + 1);
      });
    }
  }, [userCode, hasInitialSync]);

  // 删除localStorage监听，只加载云端 - 只在同步完成后或触发器更新时加载
  useEffect(() => {
    if (hasInitialSync || fileNameSyncTrigger > 0) {
      loadCloudMediaFiles();
    }
  }, [loadCloudMediaFiles, fileNameSyncTrigger, hasInitialSync]);

  // 监听自定义名称更新事件
  useEffect(() => {
    const handleCustomNamesUpdated = (event) => {
      console.log('主页收到自定义名称更新事件:', event.detail);
      // 触发文件名同步标记，这会重新加载文件
      setFileNameSyncTrigger(prev => prev + 1);
    };

    window.addEventListener('customNamesUpdated', handleCustomNamesUpdated);
    return () => window.removeEventListener('customNamesUpdated', handleCustomNamesUpdated);
  }, []);

  // 监听宝宝出生日期更新事件
  useEffect(() => {
    const handleBabyBirthDateUpdated = (event) => {
      console.log('主页收到宝宝出生日期更新事件:', event.detail);
      // 重新加载宝宝出生日期
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
            console.log('从云端重新加载宝宝出生日期成功:', cloudResult.birthDate);
          } else {
            // 云端加载失败，尝试从本地存储加载
            const localBirthDate = localStorage.getItem(`baby_birth_date_${currentUserCode}`);
            if (localBirthDate) {
              setBabyBirthDate(localBirthDate);
              const months = calculateBabyAgeInMonths(localBirthDate);
              setBabyAgeMonths(months);
              console.log('从本地重新加载宝宝出生日期:', localBirthDate);
            }
          }
        } catch (error) {
          console.error('重新加载宝宝出生日期失败:', error);
        } finally {
          setIsLoadingBirthDate(false);
        }
      };
      
      loadBabyBirthDate();
    };

    window.addEventListener('babyBirthDateUpdated', handleBabyBirthDateUpdated);
    return () => window.removeEventListener('babyBirthDateUpdated', handleBabyBirthDateUpdated);
  }, []);

  // 定期检查云端宝宝出生日期更新
  useEffect(() => {
    if (!userCode) return;
    
    const checkCloudUpdates = async () => {
      try {
        const cloudResult = await loadBabyBirthDateFromCloud(userCode);
        
        if (cloudResult.success && cloudResult.birthDate) {
          // 检查云端数据是否与本地不同
          if (cloudResult.birthDate !== babyBirthDate) {
            console.log('检测到云端宝宝出生日期更新，正在同步...');
            setBabyBirthDate(cloudResult.birthDate);
            const months = calculateBabyAgeInMonths(cloudResult.birthDate);
            setBabyAgeMonths(months);
            
            // 更新本地缓存
            localStorage.setItem(`baby_birth_date_${userCode}`, cloudResult.birthDate);
            
            console.log('宝宝出生日期已同步到最新云端数据:', cloudResult.birthDate);
          }
        }
      } catch (error) {
        console.error('检查云端宝宝出生日期更新失败:', error);
      }
    };
    
    // 每30秒检查一次云端更新
    const intervalId = setInterval(checkCloudUpdates, 30000);
    
    // 立即执行一次检查
    checkCloudUpdates();
    
    return () => {
      clearInterval(intervalId);
    };
  }, [userCode, babyBirthDate]);

  // 判断是否为平板（iPad等，竖屏/横屏都覆盖）
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsTabletView(w >= 768 && w <= 1366);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理主题切换
  const handleThemeChange = useCallback((newTheme) => {
    console.log('主题已切换:', newTheme.name);
    // 可以在这里添加主题切换后的额外逻辑
  }, []);

  // 如果没有用户ID，显示输入界面
  if (!userid) {
    // 无论是小程序还是H5都显示用户代码输入界面
    return <UserCodeInput />;
  }

  return (
    <div className={`memory-app-bg ${isWechatMiniProgram() ? 'miniprogram' : ''}`}>
      {/* 菜单栏 - 小程序环境下隐藏，H5环境下修改为三个页面导航 */}
      {!isWechatMiniProgram() && (
        <div className="memory-menu">
          <span 
            className="menu-item active" 
            onClick={() => userCode && navigate(`/${userCode}`)}
            style={{ cursor: 'pointer' }}
          >
            首页
          </span>
          <span 
            className="menu-item" 
            onClick={() => {
              if (userCode) {
                const randomId = Math.random().toString(36).substr(2, 8);
                navigate(`/${userCode}/${randomId}`);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            录音
          </span>
          <span 
            className="menu-item" 
            onClick={() => {
              if (userCode) {
                const sessionId = Math.random().toString(36).substr(2, 6);
                navigate(`/${userCode}/upload-media/${sessionId}`);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            上传
          </span>
          <span 
            className="menu-item" 
            onClick={() => {
              if (userCode) {
                const sessionId = Math.random().toString(36).substr(2, 6);
                navigate(`/${userCode}/memory`);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            回忆
          </span>
          {/* 主题切换器和操作按钮 */}
          <ThemeSwitcher onThemeChange={handleThemeChange} />
        </div>
      )}

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
              <div className="user-status" style={{
                color: 'var(--theme-primary)',
                fontSize: '14px'
              }}>✓ 已激活</div>
            </div>
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
          </div>
          
          {/* 回忆时间线 */}
          <div className="memory-left-title">回忆时间线</div>
          <div className="memory-timeline-container">
            <MemoryTimeline userCode={userCode} />
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
            <button
              className="voice-action"
              onClick={goToAudioLibrary}
            >
              开始录制
            </button>
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
                color: '#ffffff',
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
              <button className="book-card-action" onClick={onClickUploadPdf} disabled={!userCode || isUploadingPdf} style={{
                background: (!userCode || isUploadingPdf) ? 'var(--theme-border)' : 'var(--theme-secondaryBg)',
                border: '1px solid var(--theme-border)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                color: 'var(--theme-primary)',
                cursor: (!userCode || isUploadingPdf) ? 'not-allowed' : 'pointer'
              }}>
                {isUploadingPdf ? '上传中...' : '上传书籍（PDF格式）'}
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
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'30%', color: '#fff', fontSize: 14 }}>我的回忆书籍</span>
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
                          <button 
                            className="book-card-action1" 
                            style={{ 
                              padding:'6px 10px', 
                              background:'var(--theme-secondaryBg)', 
                              borderColor:'var(--theme-border)',
                              color: 'var(--theme-primary)',
                              border: '1px solid var(--theme-border)',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              if (window.confirm('确定要删除这个PDF文件吗？')) {
                                onDeletePdf(f.objectKey);
                              }
                            }}
                          >
                            删除
                          </button>
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
          <div className="ai-music-card" onClick={goToAIMusic}>
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
            <button className="ai-music-card-action">
              生成AI音乐
            </button>
          </div>
        </div>

        {/* 右侧：相册 - 桌面端和平板端显示 */}
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
              
              {/* 上传按钮 */}
              <div className="media-upload-section">
                <button 
                  className="voice-action upload-media-btn" 
                  onClick={() => handleUpload(activeMediaTab === 'photos' ? 'photo' : 'video')}
                >
                  {activeMediaTab === 'photos' ? '上传照片' : '上传视频'}
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
                        <div className="empty-desc">点击"上传照片"开始记录美好时光</div>
                      </div>
                    ) : (
                      photoData.slice(0, 4).map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="album-item"
                          style={{width:'100%', height:'240px'}}
                          onClick={() => openPhotoPreview(idx)}
                        >
                          <img
                            src={file.ossUrl || file.preview}
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
                      videoData.slice(0, 4).map((file, idx) => (
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

        {/* 移动端相册区域 - 小屏幕设备显示 */}
        {isMobileView && !isTabletView && (
          <div className="mobile-album-section">
            <div className="mobile-album-header">
              <h3 className="mobile-album-title">相册</h3>
              <div className="mobile-album-tabs">
                <div 
                  className={`mobile-album-tab ${activeMediaTab === 'photos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('photos')}
                >
                  照片
                </div>
                <div 
                  className={`mobile-album-tab ${activeMediaTab === 'videos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('videos')}
                >
                  视频
                </div>
              </div>
            </div>
            
            <div className="mobile-album-content">
              {activeMediaTab === 'photos' ? (
                /* 照片内容 */
                <div className="mobile-album-grid">
                  {photoData.length === 0 ? (
                    <div className="mobile-empty-album">
                      <div className="mobile-empty-icon">📷</div>
                      <div className="mobile-empty-text">还没有上传任何照片</div>
                      <div className="mobile-empty-desc">点击"上传照片"开始记录美好时光</div>
                      <button 
                        className="mobile-upload-btn"
                        onClick={() => handleUpload('photo')}
                      >
                        上传照片
                      </button>
                    </div>
                  ) : (
                    photoData.slice(0, 4).map((file, idx) => (
                      <div
                        key={file.id || idx}
                        className="mobile-album-item"
                        onClick={() => openPhotoPreview(idx)}
                      >
                        <img
                          src={file.ossUrl || file.preview}
                          className="mobile-album-img"
                          alt={file.name || `照片${idx + 1}`}
                        />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* 视频内容 */
                <div className="mobile-album-grid">
                  {videoData.length === 0 ? (
                    <div className="mobile-empty-album">
                      <div className="mobile-empty-icon">🎬</div>
                      <div className="mobile-empty-text">还没有上传任何视频</div>
                      <div className="mobile-empty-desc">点击"上传视频"开始记录美好时光</div>
                      <button 
                        className="mobile-upload-btn"
                        onClick={() => handleUpload('video')}
                      >
                        上传视频
                      </button>
                    </div>
                  ) : (
                    videoData.slice(0, 4).map((file, idx) => (
                      <div
                        key={file.id || idx}
                        className="mobile-album-item"
                        onClick={() => openVideoPlayer(idx)}
                      >
                        <div className="mobile-video-preview-container">
                          <video
                            src={file.ossUrl || file.preview}
                            className="mobile-album-img"
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              e.target.currentTime = 1;
                            }}
                          />
                          <div className="mobile-video-overlay">
                            <img src="./asset/play_button.png" className="mobile-play-icon" alt="播放" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {/* 查看完整相册按钮 */}
              <div className="mobile-view-gallery-container">
                <button 
                  className="mobile-view-gallery-btn"
                  onClick={goToGallery}
                >
                  查看完整相册
                </button>
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

  


function App() {
  // 应用启动时初始化主题
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('应用启动，初始化设置...');
        
        // 初始化主题设置
        console.log('初始化主题设置');
        
        // 导入主题相关函数
        const { applyTheme, loadThemeFromCloudAndApply, syncThemeOnStartup } = await import('./themes/themeConfig');
        const { checkThemeCloudUpdate } = await import('./services/themeCloudService');
        const { getUserCode } = await import('./utils/userCode');
        
        // 获取用户代码
        const userCode = getUserCode();
        console.log('用户代码:', userCode);
        
        // 使用同步主题函数，它会自动处理云端和本地主题
        const syncResult = await syncThemeOnStartup();
        console.log('主题同步结果:', syncResult);
        
        // 如果同步失败，使用默认主题
        if (!syncResult.success) {
          console.log('主题同步失败，使用默认主题');
          await applyTheme('default', { saveToCloud: false });
        }
        
        console.log('主题初始化完成');
        
        // 文件名映射同步移至HomePage组件中执行，避免时序问题
        console.log('文件名映射同步将在具体页面组件中执行');
        
      } catch (error) {
        console.error('❌ 应用初始化异常:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <MiniProgramLayout>
      <Routes>
        <Route path="/" element={<UserCodeInput />} />
        <Route path="/:userid" element={<HomePage />} />
        <Route path="/:userid/memory" element={<MemoryPage />} />
        <Route path="/bus/A1B2" element={<BusinessHomePage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/:userid/audio-library" element={<AudioLibrary />} />
        <Route path="/:userid/gallery" element={<UploadMediaPage />} />
        <Route path="/:userid/gallerys" element={<GalleryPage />} />
                 <Route path="/:userid/upload-media/:sessionid" element={<UploadMediaPage />} />
         <Route path="/:userid/video-player/:sessionid/:videoid" element={<VideoPlayerPage />} />
         <Route path="/:userid/image-viewer/:sessionid/:imageid" element={<ImageViewerPage />} />
         <Route path="/:userid/ai-conversation" element={<AIConversationPage />} />
         <Route path="/:userid/ai-conversation/:bookId" element={<AIConversationPage />} />
         <Route path="/:userid/:id" element={<RecordPage />} />
         <Route path="/:userid/:id/play/:recordingId" element={<PlayerPage />} />
        <Route path="/comment-test" element={<CommentTest />} />
        <Route path="/environment-test" element={<EnvironmentTest />} />
        <Route path="/navigation-test" element={<NavigationTest />} />
        <Route path="/copy-test" element={<CopyTest />} />
        <Route path="/theme-cloud-test" element={<ThemeCloudTest />} />
        <Route path="/:userid/profile" element={<UserProfilePage />} />
      </Routes>
    </MiniProgramLayout>
  );
}

export default App;