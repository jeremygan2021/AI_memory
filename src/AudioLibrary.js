import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AudioLibrary.css';
import { getUserCode, validateUserCode } from './utils/userCode';
import SvgIcon from './components/SvgIcons';
import ModernSearchBox from './components/ModernSearchBox';

// API配置

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

const AudioLibrary = () => {
  const navigate = useNavigate();
  const { userid } = useParams(); // 从URL获取用户ID
  const [audioSessions, setAudioSessions] = useState([]);
  const [cloudFiles, setCloudFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, count
  const [apiError, setApiError] = useState(null);
  const [userCode, setUserCode] = useState(''); // 4字符用户代码
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 12;
  
  // 标签页状态
  const [activeMainTab, setActiveMainTab] = useState('sessions'); // 'sessions' 或 'media'
  
  // 媒体文件相关状态
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [mediaActiveTab, setMediaActiveTab] = useState('all'); // 'all', 'photos' 或 'videos'
  const [mediaCurrentPage, setMediaCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const [videoAutoFullscreenTried, setVideoAutoFullscreenTried] = useState(false);
  const mediaFilesPerPage = 12;

  // 新增长按相关状态
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
  }, [userid, navigate]);

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

  // 加载云端音频文件
  useEffect(() => {
    if (userCode) { 
      loadCloudAudioFiles();
      loadCloudMediaFiles(); // 改为加载云端媒体文件
    }
  }, [userCode]);

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
        
        // 智能判断是否从录音页面上传：
        // 1. 检查文件ID格式是否包含sessionId（新格式）
        // 2. 检查文件路径的sessionId是否为8位会话ID格式（录音页面生成的格式）
        // 3. 排除特殊标识如'homepage'等
        const isFromRecordPage = fileSessionId && 
          fileSessionId.length === 8 && 
          fileSessionId !== 'homepage' && 
          fileSessionId !== 'default' &&
          !/^upload-/.test(fileSessionId); // 排除上传页面生成的ID
        

        
        return {
          id: generatedId, // 使用生成的ID
          name: fileName,
          preview: ossUrl, // 直接用OSS直链
          ossUrl,
          type: isImage ? 'image' : 'video',
          uploadTime: timestamp,
          objectKey,
          sessionId: fileSessionId, // 解析出的会话ID
          userCode,
          fromRecordPage: isFromRecordPage, // 智能判断是否从录音页面上传
          isCloudFile: true // 标记为云端文件
        };
      }));

      // 过滤空值并按上传时间倒序排序
      const sortedFiles = mapped.filter(Boolean)
        .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setUploadedFiles(sortedFiles);
    } catch (error) {
      console.error('云端媒体文件加载失败:', error);
      setUploadedFiles([]);
    }
  };

  const loadCloudAudioFiles = async () => {
    try {
      setLoading(true);
      setApiError(null);

      // 调用API获取云端文件列表，使用用户代码作为路径前缀
      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );

      if (!response.ok) {
        throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      

      const isSuccess = result.success === true || result.status === 'success' || response.ok;
      
      if (isSuccess) {
        // 尝试不同的字段名来获取文件列表
        const files = result.files || result.data || result.objects || result.items || result.results || [];


        setCloudFiles(Array.isArray(files) ? files : []);
        processCloudFiles(Array.isArray(files) ? files : []);
      } else {
        throw new Error(result.message || result.error || result.detail || '获取文件列表失败');
      }
    } catch (error) {

      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理云端文件，按会话分组
  const processCloudFiles = (files) => {
    const sessionsMap = new Map();
    
    // 安全检查文件数组
    if (!Array.isArray(files)) {

      setAudioSessions([]);
      return;
    }
    
    if (files.length === 0) {

      setAudioSessions([]);
      return;
    }

    files.forEach((file, index) => {

      if (!file || typeof file !== 'object') {

        return;
      }
      
      // 检查不同可能的字段名
      const objectKey = file.object_key || file.objectKey || file.key || file.name;
      
      if (!objectKey) {

        return;
      }
      
      // 解析文件路径: recordings/{userCode}/{sessionId}/{filename}
      const pathParts = objectKey.split('/');
      if (pathParts.length >= 4 && pathParts[0] === 'recordings' && pathParts[1] === userCode) {
        const sessionId = pathParts[2];
        const fileName = pathParts[3];
        
        // 从文件名提取录音信息
        // 假设文件名格式: recording_{id}_{timestamp}.{extension}
        // 或者: {timestamp}_{uniqueId}.{extension}
        const recordingInfo = parseFileName(fileName, file);
        
        if (!sessionsMap.has(sessionId)) {
          const fileModified = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
          sessionsMap.set(sessionId, {
            sessionId,
            recordings: [],
            count: 0,
            totalDuration: 0,
            createdAt: fileModified,
            updatedAt: fileModified
          });
        }

        const session = sessionsMap.get(sessionId);
        session.recordings.push({
          id: recordingInfo.id,
          fileName: fileName,
          objectKey: objectKey,
          fileUrl: file.file_url || file.fileUrl || file.url,
          size: file.size || 0,
          lastModified: file.last_modified || file.lastModified || file.modified || new Date().toISOString(),
          contentType: file.content_type || file.contentType || 'audio/mp3',
          etag: file.etag || file.hash || '',
          duration: recordingInfo.duration || 0, // 如果无法从文件名获取，默认0
          timestamp: formatDateFromString(file.last_modified || file.lastModified || file.modified || new Date().toISOString()),
          uploaded: true,
          cloudUrl: file.file_url || file.fileUrl || file.url
        });

        session.count = session.recordings.length;
        
        const fileModified = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
        
        // 更新时间为最新文件的时间
        if (new Date(fileModified) > new Date(session.updatedAt)) {
          session.updatedAt = fileModified;
        }
        // 创建时间为最早文件的时间
        if (new Date(fileModified) < new Date(session.createdAt)) {
          session.createdAt = fileModified;
        }
      }
    });

    // 排序每个会话的录音（按时间倒序）
    const sessions = Array.from(sessionsMap.values()).map(session => {
      session.recordings.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      session.latestRecording = session.recordings[0];
      session.oldestRecording = session.recordings[session.recordings.length - 1];
      return session;
    });

    setAudioSessions(sessions);
  };

  // 解析文件名获取录音信息
  const parseFileName = (fileName, fileInfo) => {
    // 移除扩展名
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // 尝试从文件名提取ID
    let id = Date.now(); // 默认使用当前时间戳
    
    // 如果文件名包含recording_前缀
    if (nameWithoutExt.includes('recording_')) {
      const parts = nameWithoutExt.split('_');
      if (parts.length >= 2) {
        id = parts[1] || Date.now();
      }
    } else {
      // 使用文件的etag或其他唯一标识
      id = fileInfo.etag.slice(-8) || Date.now();
    }

    return {
      id: id,
      duration: 0 // 目前无法从文件信息获取音频时长，需要播放器加载后获取
    };
  };

  // 格式化日期字符串
  const formatDateFromString = (dateString) => {
    try {
      const date = new Date(dateString);
      // 在云端时间基础上加8小时（东八区）
      const adjustedDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
      return adjustedDate.toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '未知';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化总时长
  const formatTotalDuration = (totalSeconds) => {
    if (totalSeconds === 0) return '未知时长';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 过滤和排序
  const getFilteredAndSortedSessions = () => {
    let filtered = audioSessions;
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 排序
    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'count':
        return filtered.sort((a, b) => b.count - a.count);
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  };

  // 监听搜索、排序、数据变化时自动回到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, audioSessions]);

  // 监听媒体文件标签变化时回到第一页
  useEffect(() => {
    setMediaCurrentPage(1);
  }, [mediaActiveTab, uploadedFiles]);

  // 自动全屏播放（仅移动端视频弹窗，且只尝试一次）
  useEffect(() => {
    if (!(isMobile && previewFile && previewFile.type === 'video')) {
      setVideoAutoFullscreenTried(false); // 关闭弹窗时重置
    }
  }, [isMobile, previewFile]);

  // 组件卸载时清理全屏预览状态
  useEffect(() => {
    return () => {
      // 确保组件卸载时恢复页面滚动
      document.body.classList.remove('fullscreen-preview-open');
      document.documentElement.classList.remove('fullscreen-preview-open');
    };
  }, []);

  // 创建新录音会话
  const createNewSession = () => {
    if (userCode) {
      const randomId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userCode}/${randomId}`);
    }
  };

  // 进入会话
  const enterSession = (session) => {
    if (!userCode) return;
    
    // 如果有录音，跳转到播放页面；否则跳转到录音页面
    if (session.recordings.length > 0) {
      const latestRecording = session.recordings[0];
      navigate(`/${userCode}/${session.sessionId}/play/${latestRecording.id}`);
    } else {
      navigate(`/${userCode}/${session.sessionId}`);
    }
  };

  // 删除整个会话
  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`确定要删除会话 ${userCode}/${sessionId} 及其所有录音吗？这将删除云端的所有文件！`)) {
      return;
    }

    try {
      const session = audioSessions.find(s => s.sessionId === sessionId);
      if (!session) return;

      // 删除会话中的所有录音文件
      const deletePromises = session.recordings.map(async (recording) => {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(recording.objectKey)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {

          }
        } catch (error) {

        }
      });

      await Promise.all(deletePromises);
      
      // 重新加载文件列表
      await loadCloudAudioFiles();
      
    } catch (error) {

      alert(`删除会话失败: ${error.message}`);
    }
  };

  // 刷新文件列表
  const refreshFiles = () => {
    loadCloudAudioFiles();
    loadCloudMediaFiles();
  };

  // 处理媒体文件点击
  const handleMediaClick = (file) => {
    // 统一用弹窗预览，不再跳转播放页面
    setPreviewFile(file);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewFile(null);
    setVideoPlaying(false);
    setVideoAutoFullscreenTried(false);
    
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

  // 删除媒体文件
  const handleDeleteMediaFile = async (fileId) => {
    const fileToDelete = uploadedFiles.find(file => file.id === fileId);
    if (!fileToDelete) return;
    
    if (!window.confirm('确定要删除这个文件吗？')) return;
    
    try {
      // 只删除云端文件
      if (fileToDelete.objectKey) {
        const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(fileToDelete.objectKey)}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('服务器删除失败');
        }
      }
      
      // 重新加载云端文件
      await loadCloudMediaFiles();
      
      // 分页处理
      const newFiles = uploadedFiles.filter(file => file.id !== fileId);
      const totalPages = Math.ceil(newFiles.length / mediaFilesPerPage);
      if (mediaCurrentPage > totalPages && totalPages > 0) {
        setMediaCurrentPage(totalPages);
      }
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 视频加载元数据处理
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

  // 视频播放处理
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
            setVideoPlaying(false);
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

  // 筛选媒体文件
  const getFilteredMediaFiles = () => {
    return uploadedFiles.filter(file => {
      if (mediaActiveTab === 'all') return true;
      if (mediaActiveTab === 'photos') return file.type === 'image';
      if (mediaActiveTab === 'videos') return file.type === 'video';
      return true;
    });
  };

  // 复制视频播放链接函数
  const copyVideoLink = async (file) => {
    try {
      const videoId = file.id;
      if (!videoId || typeof videoId !== 'string') {
        alert('无法生成播放链接：视频ID无效');
        return;
      }
      const baseUrl = window.location.origin;
      const playLink = `${baseUrl}/${userCode}/video-player/${file.sessionId || 'unknown'}/${videoId}?from=library`;
      // iOS特殊处理
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        window.prompt('请手动长按下方链接并选择"复制"', playLink);
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(playLink);
          alert('✅ 视频播放链接已复制到剪贴板！');
        } catch (err) {
          fallbackCopyTextToClipboard(playLink);
        }
      } else {
        fallbackCopyTextToClipboard(playLink);
      }
    } catch (error) {
      alert('复制链接失败，请稍后重试');
    }
  };
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      success = false;
    }
    document.body.removeChild(textArea);
    if (success) {
      alert('✅ 视频播放链接已复制到剪贴板！');
    } else {
      alert('复制失败，请手动复制链接：' + text);
    }
  }

  // 长按事件处理
  const handleLongPressStart = (file, e) => {
    e.preventDefault();
    if (file.type === 'video') {
      const mediaElement = e.currentTarget;
      mediaElement.classList.add('long-pressing');
      const timer = setTimeout(() => {
        setIsLongPress(true);
        mediaElement.classList.remove('long-pressing');
        mediaElement.classList.add('long-press-success');
        copyVideoLink(file);
        setTimeout(() => {
          mediaElement.classList.remove('long-press-success');
        }, 600);
      }, 500);
      setLongPressTimer(timer);
    }
  };
  const handleLongPressEnd = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      const mediaElement = e.currentTarget;
      mediaElement.classList.remove('long-pressing');
    }
  };

  // 视频点击跳转播放页面
  const handleVideoClick = (file, e) => {
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }
    if (file.type === 'video') {
      const videoId = file.id;
      if (videoId && typeof videoId === 'string') {
        const targetUrl = `/${userCode}/video-player/${file.sessionId || 'unknown'}/${videoId}?from=library`;
        navigate(targetUrl);
      } else {
        alert('视频ID无效，将使用弹窗预览模式');
        setPreviewFile(file);
      }
    } else {
      setPreviewFile(file);
    }
  };

  if (loading) {
    return (
      <div className="audio-library loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载云端资源库...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="audio-library error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>连接云端失败</h3>
          <p>{apiError}</p>
          <div className="error-actions">
            <button onClick={refreshFiles} className="retry-btn">
            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/refresh.svg" className="icon-img" width={32} height={32} color='#ffffff'/>重试
            </button>
            <button onClick={() => navigate('/')} className="back-btn">
              ← 返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-library">
      {/* 背景装饰 */}
      <div className="library-background">
        <div className="bg-circle circle1"></div>
        <div className="bg-circle circle2"></div>
        <div className="bg-circle circle3"></div>
      </div>

      {/* 顶部导航 */}
      <header className="library-header">
        <button onClick={() => navigate(`/${userCode}`)} className="back-btn">
          <span className="back-icon">←</span>
          <span>返回主页</span>
        </button>
        
        <div className="header-content">
          <h1 className="library-title">
            <span className="title-icon">
            <SvgIcon name="cloud" className="icon-img" width={32} height={32} color="#3bb6a6" />
            </span>
            云端资源库
            
          </h1>
          <p className="library-subtitle">管理您在云端的所有录音会话和媒体文件</p>
        </div>
        
        <div className="header-actions">
          <button onClick={refreshFiles} className="refresh-btn" title="刷新">
            <span className="btn-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/sx.svg" className="icon-img" width={32} height={32}/>
            </span>
            <span>刷新</span>
          </button>
          <button onClick={createNewSession} className="new-session-btn">
            <span className="btn-icon">
            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/add.svg" className="btn-icon" width={30} height={30}/>
            </span>
            <span>新建录音</span>
          </button>
        </div>
      </header>

      {/* 主标签页 */}
      <div className="main-tabs">
        <button 
          className={`main-tab ${activeMainTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('sessions')}
        >
          🎵 音频会话
        </button>
        <button 
          className={`main-tab ${activeMainTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('media')}
        >
          📁 媒体文件
        </button>
      </div>

      {/* 控制栏 */}
      {activeMainTab === 'sessions' && (
        <div className="library-controls">
          <ModernSearchBox
            placeholder="搜索会话ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="medium"
            width="400px"
            theme="gradient"
          />
          
          <div className="sort-container">
            <label className="sort-label">排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">最新更新</option>
              <option value="oldest">最早创建</option>
              <option value="count">录音数量</option>
            </select>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="library-stats">
        {activeMainTab === 'sessions' ? (
          <>
            <div className="stat-item">
              <span className="stat-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/files.svg" className="stat-icon" width={50} height={50}/>
              </span>
              <div className="stat-content">
                <span className="stat-number">{audioSessions.length}</span>
                <span className="stat-label">会话</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/huatong.svg" className="stat-icon" width={50} height={50}/>
              </span>
              <div className="stat-content">
                <span className="stat-number">
                  {audioSessions.reduce((total, session) => total + session.count, 0)}
                </span>
                <span className="stat-label">录音</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/save.svg" className="stat-icon" width={50} height={50}/>
              </span>
              <div className="stat-content">
                <span className="stat-number">
                  {formatFileSize(
                    cloudFiles.reduce((total, file) => total + (file.size || 0), 0)
                  )}
                </span>
                <span className="stat-label">总大小</span>
              </div>
            </div>
            <div className="stat-item cloud-indicator">
              <span className="stat-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/scyd.svg" className="stat-icon" width={50} height={50}/>
              </span>
              <div className="stat-content">
                <span className="stat-number">云端</span>
                <span className="stat-label">存储</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-item">
              <span className="stat-icon">📁</span>
              <div className="stat-content">
                <span className="stat-number">{uploadedFiles.length}</span>
                <span className="stat-label">文件</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📷</span>
              <div className="stat-content">
                <span className="stat-number">
                  {uploadedFiles.filter(f => f.type === 'image').length}
                </span>
                <span className="stat-label">照片</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🎬</span>
              <div className="stat-content">
                <span className="stat-number">
                  {uploadedFiles.filter(f => f.type === 'video').length}
                </span>
                <span className="stat-label">视频</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💾</span>
              <div className="stat-content">
                <span className="stat-number">本地</span>
                <span className="stat-label">存储</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 主要内容区域 */}
      <main className={activeMainTab === 'sessions' ? "sessions-container" : "media-container"}>
        {activeMainTab === 'sessions' ? (
          // 音频会话标签页内容
          (() => {
            const filteredSessions = getFilteredAndSortedSessions();
            const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
            const paginatedSessions = filteredSessions.slice(
              (currentPage - 1) * sessionsPerPage,
              currentPage * sessionsPerPage
            );
            return paginatedSessions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">☁️</div>
                <h3>云端暂无录音会话</h3>
                <p>点击"新建录音"开始您的第一次录音并自动上传到云端</p>
                <button onClick={createNewSession} className="create-first-btn">
                  🎤 开始录音
                </button>
              </div>
            ) : (
              <>
              <div className="sessions-grid">
                {paginatedSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="session-card cloud-session"
                    onClick={() => enterSession(session)}
                  >
                    <div className="session-header">
                      <div className="session-info">
                        <h3 className="session-id">
                          <span className="id-icon">🆔</span>
                          {userCode}/{session.sessionId}
                          <span className="cloud-badge" title="云端存储">
                          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/scyd.svg" className="cloud-badge" width={20} height={20}/>
                          </span>
                        </h3>
                        <div className="session-meta">
                          <span className="session-count">
                          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/huatong.svg" className="session-count" width={15} height={15}/> {session.count} 个录音
                          </span>
                          <span className="session-size">
                          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/save.svg" className="session-count" width={15} height={15}/> {formatFileSize(
                              session.recordings.reduce((total, r) => total + (r.size || 0), 0)
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => deleteSession(session.sessionId, e)}
                        className="delete-session-btn"
                        title="删除会话及云端文件"
                      >
                        <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/delete.svg" className="delete-session-btn" width={50} height={50}/>
                      </button>
                    </div>

                    <div className="session-content">
                      <div className="latest-recording">
                        <h4 className="latest-title">最新录音</h4>
                        <div className="recording-preview">
                          <span className="recording-name">
                            {session.latestRecording.fileName}
                          </span>
                          <span className="recording-size">
                            {formatFileSize(session.latestRecording.size)}
                          </span>
                        </div>
                        <div className="recording-date">
                          {formatDateFromString(session.latestRecording.lastModified)}
                        </div>
                      </div>

                      <div className="session-actions">
                        <div className="action-icon">
                        <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/bf.svg" className="action-icon" width={50} height={50}/>
                          {session.recordings.length > 0 ? '' : ''}
                        </div>
                        <span className="action-text">
                          {session.recordings.length > 0 ? '播放' : '录音'}
                        </span>
                      </div>
                    </div>

                    <div className="session-footer">
                      <span className="created-date">
                        创建: {formatDateFromString(session.createdAt)}
                      </span>
                      <span className="updated-date">
                        更新: {formatDateFromString(session.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* 分页按钮 */}
              {totalPages > 1 && (
                <div className="pagination pagination-row">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  <span className="pagination-current-page">
                    {currentPage}
                  </span>
                  <span className="pagination-total-page">/ {totalPages} 页</span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
              </>
            );
          })()
        ) : (
          // 媒体文件标签页内容
          <div className="media-files-section">
            {/* 文件类型标签 */}
            <div className="file-type-tabs">
              <button 
                className={`file-tab ${mediaActiveTab === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setMediaActiveTab('all');
                  setMediaCurrentPage(1);
                }}
              >
                📁 全部 ({uploadedFiles.length})
              </button>
              <button 
                className={`file-tab ${mediaActiveTab === 'photos' ? 'active' : ''}`}
                onClick={() => {
                  setMediaActiveTab('photos');
                  setMediaCurrentPage(1);
                }}
              >
                📷 照片 ({uploadedFiles.filter(f => f.type === 'image').length})
              </button>
              <button 
                className={`file-tab ${mediaActiveTab === 'videos' ? 'active' : ''}`}
                onClick={() => {
                  setMediaActiveTab('videos');
                  setMediaCurrentPage(1);
                }}
              >
                🎬 视频 ({uploadedFiles.filter(f => f.type === 'video').length})
              </button>
            </div>

            {(() => {
              const filteredMediaFiles = getFilteredMediaFiles();
              const totalMediaPages = Math.ceil(filteredMediaFiles.length / mediaFilesPerPage);
              const startIndex = (mediaCurrentPage - 1) * mediaFilesPerPage;
              const endIndex = startIndex + mediaFilesPerPage;
              const currentMediaFiles = filteredMediaFiles.slice(startIndex, endIndex);

              return filteredMediaFiles.length > 0 ? (
                <>
                  <div className="section-header">
                    {totalMediaPages > 1 && (
                      <div className="pagination-info">
                        第 {mediaCurrentPage} 页，共 {totalMediaPages} 页
                      </div>
                    )}
                  </div>
                  
                  <div className="photos-grid">
                    {currentMediaFiles.map(file => (
                      <div key={file.id} className="media-item">
                        <div
                          className="media-content"
                          onClick={file.type === 'video' ? (e) => handleVideoClick(file, e) : () => handleMediaClick(file)}
                          onMouseDown={file.type === 'video' ? (e) => handleLongPressStart(file, e) : undefined}
                          onTouchStart={file.type === 'video' ? (e) => handleLongPressStart(file, e) : undefined}
                          onMouseUp={file.type === 'video' ? handleLongPressEnd : undefined}
                          onMouseLeave={file.type === 'video' ? handleLongPressEnd : undefined}
                          onTouchEnd={file.type === 'video' ? handleLongPressEnd : undefined}
                        >
                          {file.type === 'image' ? (
                            <div className="image-preview">
                              <img src={file.ossUrl || file.preview || file.url} alt={file.name} className="media-preview" />
                              {/* 显示图片ID和详细信息 */}
                              {file.id && typeof file.id === 'string' && (
                                <div className="image-id-display">
                                  {file.id.startsWith('img_') ? (
                                    (() => {
                                      const idParts = file.id.split('_');
                                      if (idParts.length >= 4) {
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
                                        return <>📷 ID: {file.id}</>;
                                      }
                                    })()
                                  ) : (
                                    <>📷 ID: {file.id}</>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="video-preview">
                              <video
                                src={file.ossUrl || file.preview || file.url}
                                className="media-preview"
                                controls
                                muted
                                playsInline
                                preload="metadata"
                                onLoadedMetadata={handleVideoLoadedMetadata}
                                onPlay={handleVideoPlay}
                              />
                              <div className="video-overlay">
                                <div className="video-play-icon">▶</div>
                              </div>
                              {/* 显示视频ID和详细信息 */}
                              {file.id && typeof file.id === 'string' && (
                                <div className="video-id-display">
                                  {file.id.startsWith('vid_') ? (
                                    (() => {
                                      const idParts = file.id.split('_');
                                      if (idParts.length >= 4) {
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
                                        return <>🎬 ID: {file.id}</>;
                                      }
                                    })()
                                  ) : (
                                    <>🎬 ID: {file.id}</>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="media-overlay">
                            <button 
                              className="delete-media-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMediaFile(file.id);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 分页控件 */}
                  {totalMediaPages > 1 && (
                    <div className="pagination pagination-row">
                      <button 
                        className="pagination-btn"
                        onClick={() => setMediaCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={mediaCurrentPage === 1}
                      >
                        上一页
                      </button>
                      <span className="pagination-current-page">{mediaCurrentPage}</span>
                      <span className="pagination-total-page">/ {totalMediaPages} 页</span>
                      <button 
                        className="pagination-btn"
                        onClick={() => setMediaCurrentPage(prev => Math.min(prev + 1, totalMediaPages))}
                        disabled={mediaCurrentPage === totalMediaPages}
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    {mediaActiveTab === 'all' ? '📁' : mediaActiveTab === 'photos' ? '📷' : '🎬'}
                  </div>
                  <p className="empty-text">
                    还没有上传任何{mediaActiveTab === 'all' ? '文件' : mediaActiveTab === 'photos' ? '照片' : '视频'}
                  </p>
                  <p className="empty-subtext">
                    前往录音页面或上传页面开始上传媒体文件
                  </p>
                  <button onClick={createNewSession} className="create-first-btn">
                    🎤 前往录音页面
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </main>
      {/* 媒体文件预览弹窗 - 移动端全屏，PC端图片 */}
      {previewFile && (
        <div className={`preview-modal${isMobile ? ' fullscreen' : ''}`} onClick={closePreview}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            {previewFile.type === 'image' ? (
              <img 
                src={previewFile.ossUrl || previewFile.preview || previewFile.url} 
                alt={previewFile.name} 
                className={`preview-media${isMobile ? ' fullscreen-media' : ''}`} 
                onClick={closePreview}
                style={{ cursor: 'pointer' }}
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
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onPlay={handleVideoPlay}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioLibrary;