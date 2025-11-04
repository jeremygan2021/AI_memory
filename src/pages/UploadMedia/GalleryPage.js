import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './GalleryPage.css'; // 使用专门的样式文件
import { validateUserCode } from '../../utils/userCode';
import { isWechatMiniProgram } from '../../utils/environment';
import { getCurrentTheme } from '../../themes/themeConfig';

const GalleryPage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photos' 或 'videos'
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const filesPerPage = 12;
  const videoRef = useRef(null);
  const [videoAutoFullscreenTried, setVideoAutoFullscreenTried] = useState(false);
  // 长按视频相关状态
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  // 从视频ID中提取session信息的辅助函数
  const extractSessionFromVideoId = (videoId) => {
    if (videoId && videoId.startsWith('vid_')) {
      const idParts = videoId.split('_');
      if (idParts.length >= 3) {
        // 视频ID格式: vid_sessionId_timestamp_...
        const extractedSessionId = idParts[1];
        if (extractedSessionId && (extractedSessionId.length === 6 || extractedSessionId.length === 8)) {
          return extractedSessionId;
        }
      }
    }
    return 'default'; // 默认返回当前session
  };

  // 从图片ID中提取session信息的辅助函数
  const extractSessionFromImageId = (imageId) => {
    if (imageId && imageId.startsWith('img_')) {
      const idParts = imageId.split('_');
      if (idParts.length >= 3) {
        // 图片ID格式: img_sessionId_timestamp_...
        const extractedSessionId = idParts[1];
        if (extractedSessionId && (extractedSessionId.length === 6 || extractedSessionId.length === 8)) {
          return extractedSessionId;
        }
      }
    }
    return 'default'; // 默认返回当前session
  };

  // 加载云端媒体文件（只加载当前userCode的图片和视频）
  const loadCloudMediaFiles = async () => {
    try {
      if (!userCode) return;
      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );
      if (!response.ok) throw new Error('获取云端文件失败');
      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];

      // 并发获取所有文件的可访问签名URL
      const mapped = await Promise.all(files.map(async file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
        const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
        if (!isImage && !isVideo) return null;

        // 从objectKey解析会话ID
        const pathParts = objectKey ? objectKey.split('/') : [];
        const fileSessionId = pathParts.length >= 3 ? pathParts[2] : 'unknown';
        
        // 生成基于文件名和时间的唯一ID
        const timestamp = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
        const fileExtension = fileName.split('.').pop() || '';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const uniqueId = nameWithoutExt.slice(-8) || Math.random().toString(36).substr(2, 8);
        const prefix = isImage ? 'img' : 'vid';
        const generatedId = `${prefix}_${fileSessionId}_${Date.parse(timestamp)}_${uniqueId}`;

        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const ossUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        
        // 智能判断是否从录音页面上传
        const isFromRecordPage = fileSessionId && 
          fileSessionId.length === 8 && 
          fileSessionId !== 'homepage' && 
          fileSessionId !== 'default' &&
          !/^upload-/.test(fileSessionId);

        return {
          id: generatedId,
          name: fileName,
          preview: ossUrl,
          ossUrl,
          type: isImage ? 'image' : 'video',
          uploadTime: timestamp,
          objectKey,
          sessionId: fileSessionId,
          userCode,
          fromRecordPage: isFromRecordPage,
          isCloudFile: true
        };
      }));

      // 过滤空值并按上传时间倒序排序
      const sortedFiles = mapped.filter(Boolean)
        .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setUploadedFiles(sortedFiles);
    } catch (e) {
      console.error('云端媒体文件加载失败:', e);
      setUploadedFiles([]);
    }
  };

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      navigate('/');
      return;
    }
  }, [userid, navigate]);

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = (event) => {
      const { theme } = event.detail;
      console.log('GalleryPage: 主题已更新:', theme.name);
      setCurrentTheme(theme);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理媒体文件点击
  const handleMediaClick = (file) => {
    if (file.type === 'image') {
      setPreviewFile(file);
    } else if (file.type === 'video') {
      // 从视频ID中提取session信息
      const targetSessionId = extractSessionFromVideoId(file.id);
      
      // 跳转到视频播放页面
      navigate(`/${userCode}/video-player/${targetSessionId}/${file.id}?from=upload${file.objectKey ? `&ok=${encodeURIComponent(file.objectKey)}` : ''}`);
    }
  };

  // 长按开始处理
  const handleLongPressStart = (file, e) => {
    // 只在事件可取消时才调用preventDefault
    if (e && e.cancelable) {
      e.preventDefault();
    }
    setIsLongPress(false);
    
    // 设置长按定时器（800ms后触发）
    const timer = setTimeout(() => {
      setIsLongPress(true);
      
      // 根据文件类型执行不同的操作
      if (file.type === 'video') {
        copyVideoLink(file);
      } else if (file.type === 'image') {
        copyImageLink(file);
      }
    }, 800);
    
    setLongPressTimer(timer);
  };

  // 长按结束处理
  const handleLongPressEnd = (e) => {
    // 只在事件可取消时才调用preventDefault
    if (e && e.cancelable) {
      e.preventDefault();
    }
    
    // 清除长按定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // 重置长按状态
    setIsLongPress(false);
  };

  // 长按结束处理（带点击事件）
  const handleLongPressEndWithClick = (file, e) => {
    // 只在事件可取消时才调用preventDefault
    if (e && e.cancelable) {
      e.preventDefault();
    }
    
    // 清除长按定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // 如果不是长按状态，则执行正常的点击操作（仅桌面设备）
    if (!isLongPress) {
      handleMediaClick(file);
    }
    
    // 重置长按状态
    setIsLongPress(false);
  };

  // 复制视频播放链接
  const copyVideoLink = async (file) => {
    try {
      const videoId = file.id;
      if (!videoId || typeof videoId !== 'string') {
        alert('无法生成播放链接：视频ID无效');
        return;
      }
      
      // 从视频ID中提取session信息
      const targetSessionId = extractSessionFromVideoId(videoId);
      
      // 生成完整的播放链接
      const baseUrl = window.location.origin;
      let playLink = `${baseUrl}/${userCode}/video-player/${targetSessionId}/${videoId}?from=upload`;
      if (file.objectKey) {
        playLink += `&ok=${encodeURIComponent(file.objectKey)}`;
      }
      
      // 优先使用现代Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(playLink);
          alert('✅ 视频播放链接已复制到剪贴板！');
          return;
        } catch (err) {
          // Clipboard API失败，降级
          fallbackCopyTextToClipboard(playLink);
        }
      } else {
        // 直接使用降级方法
        fallbackCopyTextToClipboard(playLink);
      }
    } catch (error) {
      console.error('复制链接失败:', error);
      alert('复制链接失败，请稍后重试');
    }
  };

  // 复制图片查看链接
  const copyImageLink = async (file) => {
    try {
      const imageId = file.id;
      if (!imageId || typeof imageId !== 'string') {
        alert('无法生成查看链接：图片ID无效');
        return;
      }
      
      // 从图片ID中提取session信息
      const targetSessionId = extractSessionFromImageId(imageId);
      
      // 生成完整的查看链接
      const baseUrl = window.location.origin;
      let viewLink = `${baseUrl}/${userCode}/image-viewer/${targetSessionId}/${imageId}?from=upload`;
      if (file.objectKey) {
        viewLink += `&ok=${encodeURIComponent(file.objectKey)}`;
      }
      
      // 优先使用现代Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(viewLink);
          alert('✅ 图片查看链接已复制到剪贴板！');
          return;
        } catch (err) {
          // Clipboard API失败，降级
          fallbackCopyTextToClipboard(viewLink);
        }
      } else {
        // 直接使用降级方法
        fallbackCopyTextToClipboard(viewLink);
      }
    } catch (error) {
      console.error('复制图片链接失败:', error);
      alert('复制链接失败，请稍后重试');
    }
  };

  // 降级复制方法
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    // 尝试多种选择方法
    try {
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
    } catch (err) {
      console.log('选择文本失败:', err);
    }
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.log('execCommand复制失败:', err);
      success = false;
    }
    
    document.body.removeChild(textArea);
    
    if (success) {
      alert('✅ 链接已复制到剪贴板！');
    } else {
      // 最后的备选方案：显示可复制的提示框
      const copyPrompt = window.prompt('请手动复制以下链接：', text);
      if (copyPrompt !== null) {
        alert('✅ 感谢您的操作！');
      }
    }
  }

  // 返回上一页
  const goBack = () => {
    navigate(-1);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewFile(null);
    
    // 立即移除CSS类恢复页面滚动
    document.body.classList.remove('fullscreen-preview-open');
    document.documentElement.classList.remove('fullscreen-preview-open');
    
    // 确保滚动恢复正常（添加小延迟让CSS变化生效）
    setTimeout(() => {
      // 强制重置滚动相关样式
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    }, 50);
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      // 退出全屏（兼容各平台）
      if (videoRef.current._fullscreenCleanup) {
        videoRef.current._fullscreenCleanup();
        videoRef.current._fullscreenCleanup = null;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      if (videoRef.current.webkitExitFullscreen) {
        videoRef.current.webkitExitFullscreen();
      }
    }
  };

  // 自动全屏播放（仅移动端视频弹窗，且只尝试一次）
  useEffect(() => {
    if (!(isMobile && previewFile && previewFile.type === 'video')) {
      setVideoAutoFullscreenTried(false); // 关闭弹窗时重置
    }
  }, [isMobile, previewFile]);

  // 视频 loadedmetadata 后自动播放（不自动全屏）
  const handleVideoLoadedMetadata = () => {
    if (isMobile && previewFile && previewFile.type === 'video' && videoRef.current && !videoAutoFullscreenTried) {
      setVideoAutoFullscreenTried(true);
      const video = videoRef.current;
      // 只自动播放，不自动全屏
      video.play().catch(() => {});
      // 清理全屏监听
      if (video._fullscreenCleanup) {
        video._fullscreenCleanup();
        video._fullscreenCleanup = null;
      }
    }
  };

  // 用户点击播放时再自动全屏
  const handleVideoPlay = () => {
    if (isMobile && previewFile && previewFile.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      // 检测iOS设备
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      try {
        if (isIOS) {
          // iOS设备使用特殊的全屏API
          if (video.webkitEnterFullscreen) {
            // 确保视频已开始播放再进入全屏
            setTimeout(() => {
              video.webkitEnterFullscreen();
            }, 100);
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        } else {
          // 非iOS设备使用标准全屏API
          if (video.requestFullscreen) {
            video.requestFullscreen().catch(() => {});
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        }
      } catch (e) {
        console.log('全屏播放失败:', e);
      }
      
      // 监听全屏变化，退出全屏时自动关闭弹窗
      const handleFullscreenChange = () => {
        const isFull = document.fullscreenElement === video || 
                      video.webkitDisplayingFullscreen || 
                      document.webkitFullscreenElement === video;
        if (!isFull) {
          setTimeout(() => {
            setPreviewFile(null);
          }, 200);
        }
      };
      
      // iOS需要监听不同的全屏事件
      if (isIOS) {
        video.addEventListener('webkitbeginfullscreen', () => {
          console.log('iOS视频进入全屏');
        });
        video.addEventListener('webkitendfullscreen', handleFullscreenChange);
      } else {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      }
      
      // 清理函数
      video._fullscreenCleanup = () => {
        if (isIOS) {
          video.removeEventListener('webkitendfullscreen', handleFullscreenChange);
        } else {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        }
      };
    }
  };

  // 筛选当前标签页的文件
  const filteredFiles = uploadedFiles.filter(file => {
    if (activeTab === 'all') return true;
    if (activeTab === 'photos') return file.type === 'image';
    if (activeTab === 'videos') return file.type === 'video';
    return true;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = filteredFiles.slice(startIndex, endIndex);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 获取最近上传的6张照片和视频
  const getRecentMedia = () => {
    // 按上传时间倒序排序，取前6个
    return uploadedFiles
      .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
      .slice(0, 6);
  };

  const recentMedia = getRecentMedia();

  // userCode变化时加载云端媒体文件
  useEffect(() => {
    if (userCode) {
      loadCloudMediaFiles();
    }
  }, [userCode, refreshTrigger]);

  return (
    <div className="gallery-upload-page">
      {/* 顶部导航 - 小程序环境下隐藏 */}
      {!isWechatMiniProgram() && (
      <div className="gallery-upload-header">
        <div className="gallery-back-button" onClick={goBack}>
            <span className="gallery-back-text">
            返回主页
          </span>
        </div>
        
        <div className="gallery-session-info">
          <span>用户: {userCode}</span>
        </div>
      </div>
      )}

      {/* 文件展示区域 */}
      <div className="gallery-photos-container">
        <div className="gallery-all-photos-section">
          {/* 文件类型标签 */}
          <div className="gallery-file-type-tabs">
            <button 
              className={`gallery-file-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
            >
              📁 全部 ({uploadedFiles.length})
            </button>
            <button 
              className={`gallery-file-tab ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('photos');
                setCurrentPage(1);
              }}
            >
              📷 照片 ({uploadedFiles.filter(f => f.type === 'image').length})
            </button>
            <button 
              className={`gallery-file-tab ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('videos');
                setCurrentPage(1);
              }}
            >
              🎬 视频 ({uploadedFiles.filter(f => f.type === 'video').length})
            </button>
          </div>
          
          {/* 移动端最近媒体预览 - 只在移动端显示 */}
          {isMobile && (
            <div className="mobile-recent-media">
              <div className="mobile-recent-media-title">最近上传</div>
              <div className="mobile-recent-media-grid">
                {recentMedia.length > 0 ? (
                  recentMedia.map(file => (
                    <div 
                      key={file.id} 
                      className="mobile-recent-media-item"
                      onClick={() => handleMediaClick(file)}
                    >
                      {file.type === 'image' ? (
                        <img 
                          src={file.ossUrl || file.preview || file.url} 
                          alt={file.name} 
                          className="mobile-recent-media-preview"
                          onError={e => { e.target.style.background = '#fdd'; }}
                        />
                      ) : (
                        <div className="mobile-recent-video-preview">
                          <video 
                            src={file.ossUrl || file.preview || file.url} 
                            className="mobile-recent-media-preview"
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => { e.target.currentTime = 1; }}
                            onError={e => { e.target.style.background = '#fdd'; }}
                          />
                          <div className="mobile-recent-video-play-icon">▶</div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="mobile-recent-media-empty">暂无最近上传的媒体</div>
                )}
              </div>
            </div>
          )}
          
          <div className="gallery-section-header">
            {totalPages > 1 && (
              <div className="gallery-pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            )}
          </div>
          
          {filteredFiles.length > 0 ? (
            <>
              <div className="gallery-photos-grid">
                {currentFiles.map(file => (
                  <div key={file.id} className="gallery-media-item">
                    <div 
                      className="gallery-media-content" 
                      onMouseDown={(e) => handleLongPressStart(file, e)}
                      onMouseUp={(e) => handleLongPressEndWithClick(file, e)}
                      onMouseLeave={(e) => handleLongPressEnd(e)}
                      onTouchStart={(e) => {
                        // 确保事件不是被动的，以便可以调用preventDefault
                        handleLongPressStart(file, e);
                      }}
                      onTouchEnd={(e) => {
                        handleLongPressEnd(e);
                        // 如果不是长按，则触发点击事件
                        if (!isLongPress) {
                          handleMediaClick(file);
                        }
                      }}
                      onTouchCancel={(e) => handleLongPressEnd(e)}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ 
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                    >
                      {file.type === 'image' ? (
                        <div className="gallery-image-preview">
                          <img src={file.ossUrl || file.preview || file.url} alt={file.name} className="gallery-media-preview" 
                            onError={e => { console.error('图片加载失败', file.ossUrl || file.preview || file.url, file); e.target.style.background = '#fdd'; }}
                          />
                          {/* 显示图片ID，区分是否从录音页面上传 */}
                          {file.id && typeof file.id === 'string' && file.id.startsWith('img_') && (
                            <div className="gallery-image-id-display1">
                              {/* 检查ID格式：img_sessionId_timestamp_random_uniqueId */}
                              {(() => {
                                const idParts = file.id.split('_');
                                if (idParts.length >= 5) {
                                  const sessionId = idParts[1];
                                  const uniqueId = idParts.slice(-1)[0];
                                  if (sessionId.length === 8) {
                                    return <>录音会话: {sessionId} | 图片ID: {uniqueId}</>;
                                  } else if (sessionId.length === 6) {
                                    return <>会话: {sessionId} | 图片ID: {uniqueId}</>;
                                  } else {
                                    return <>图片ID: {uniqueId}</>;
                                  }
                                } else if (idParts.length >= 4) {
                                  const sessionId = idParts[1];
                                  const uniqueId = idParts.slice(-1)[0];
                                  if (sessionId.length === 8) {
                                    return <>录音会话: {sessionId} | 图片ID: {uniqueId}</>;
                                  } else if (sessionId.length === 6) {
                                    return <>会话: {sessionId} | 图片ID: {uniqueId}</>;
                                  } else {
                                    return <>图片ID: {uniqueId}</>;
                                  }
                                } else {
                                  return <>图片ID: {file.id}</>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="gallery-video-preview">
                          <video 
                            src={file.ossUrl || file.preview || file.url} 
                              className="gallery-media-preview"
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => { e.target.currentTime = 1; }}
                            onError={e => { console.error('视频加载失败', file.ossUrl || file.preview || file.url, file); e.target.style.background = '#fdd'; }}
                          />
                          <div className="gallery-video-overlay">
                            <div className="gallery-video-play-icon">▶</div>
                          </div>
                          {/* 显示视频ID，区分是否从录音页面上传 */}
                          {file.id && typeof file.id === 'string' && file.id.startsWith('vid_') && (
                            <div className="gallery-video-id-display1">
                              {/* 检查ID格式：vid_sessionId_timestamp_random_uniqueId */}
                              {(() => {
                                const idParts = file.id.split('_');
                                if (idParts.length >= 5) {
                                  const sessionId = idParts[1];
                                  const uniqueId = idParts.slice(-1)[0];
                                  if (sessionId.length === 8) {
                                    return <>录音会话: {sessionId} | 视频ID: {uniqueId}</>;
                                  } else if (sessionId.length === 6) {
                                    return <>会话: {sessionId} | 视频ID: {uniqueId}</>;
                                  } else {
                                    return <>视频ID: {uniqueId}</>;
                                  }
                                } else if (idParts.length >= 4) {
                                  const sessionId = idParts[1];
                                  const uniqueId = idParts.slice(-1)[0];
                                  if (sessionId.length === 8) {
                                    return <>录音会话: {sessionId} | 视频ID: {uniqueId}</>;
                                  } else if (sessionId.length === 6) {
                                    return <>会话: {sessionId} | 视频ID: {uniqueId}</>;
                                  } else {
                                    return <>视频ID: {uniqueId}</>;
                                  }
                                } else {
                                  return <>视频ID: {file.id}</>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="gallery-pagination gallery-pagination-row">
                  <button 
                    className="gallery-pagination-btn"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  <span className="gallery-pagination-current-page">{currentPage}</span>
                  <span className="gallery-pagination-total-page">/ {totalPages} 页</span>
                  <button 
                    className="gallery-pagination-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="gallery-empty-state">
              <div className="gallery-empty-icon">
                {activeTab === 'all' ? '📁' : activeTab === 'photos' ? '📷' : '🎬'}
              </div>
              <p className="gallery-empty-text">
                还没有{activeTab === 'all' ? '任何文件' : activeTab === 'photos' ? '照片' : '视频'}
              </p>
              <p className="gallery-empty-subtext">请上传文件后查看</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 - 移动端全屏，PC端图片 */}
      {previewFile && (
        <div className={`preview-modal${isMobile ? ' fullscreen' : ''}`} onClick={closePreview}>
          <div className="gallery-preview-content" onClick={e => e.stopPropagation()}>
            {previewFile.type === 'image' ? (
              <img 
                src={previewFile.ossUrl || previewFile.preview || previewFile.url} 
                alt={previewFile.name} 
                className={`preview-media${isMobile ? ' fullscreen-media' : ''}`} 
                onClick={closePreview}
                style={{ cursor: 'pointer' }}
                onError={e => { console.error('大图预览加载失败', previewFile.ossUrl || previewFile.preview || previewFile.url, previewFile); e.target.style.background = '#fdd'; }}
              />
            ) : (
              // 视频全屏预览（移动端弹窗）
              <div className={`fullscreen-video-wrapper${isMobile ? ' mobile' : ''}`}>
                <video
                  ref={videoRef}
                  src={previewFile.ossUrl || previewFile.preview || previewFile.url}
                  className={`preview-media${isMobile ? ' fullscreen-media' : ''}`}
                  controls
                  autoPlay
                  playsInline={!isMobile} // iOS全屏时不使用playsInline
                  webkit-playsinline={!isMobile} // 旧版iOS兼容
                  crossOrigin="anonymous"
                  preload="metadata"
                  onPlay={e => { handleVideoPlay(); }}
                  onClick={e => e.stopPropagation()}
                  style={{ 
                    maxHeight: isMobile ? '70vh' : undefined,
                    backgroundColor: '#000', // 确保视频背景是黑色
                    objectFit: 'contain' // 确保视频正确显示
                  }}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onError={e => {
                    console.error('大视频预览加载失败', previewFile.ossUrl || previewFile.preview || previewFile.url, previewFile);
                    e.target.style.background = '#fdd';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default GalleryPage;