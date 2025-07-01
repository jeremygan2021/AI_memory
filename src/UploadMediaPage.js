import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadMediaPage.css'; // 复用现有样式
import { validateUserCode } from './utils/userCode';

const buildRecordingPath = (sessionId, userCode) => {
  return `recordings/${userCode}/${sessionId}`;
};

const UploadMediaPage = () => {
  const { userid, sessionid } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photos' 或 'videos'
  const [uploadingFiles, setUploadingFiles] = useState(new Map()); // 跟踪上传进度的文件
  const [fromSource, setFromSource] = useState(''); // 来源页面标识
  const filesPerPage = 12;
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const [videoAutoFullscreenTried, setVideoAutoFullscreenTried] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  // 生成唯一的视频标识码（包含会话ID）
  const generateUniqueVideoId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const uniqueId = Math.random().toString(36).substr(2, 8); // 8位唯一ID
    const currentSessionId = sessionid || 'default';
    return `vid_${currentSessionId}_${timestamp}_${random}_${uniqueId}`;
  };

  // 生成唯一的图片标识码（包含会话ID）
  const generateUniqueImageId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const uniqueId = Math.random().toString(36).substr(2, 8); // 8位唯一ID
    const currentSessionId = sessionid || 'default';
    return `img_${currentSessionId}_${timestamp}_${random}_${uniqueId}`;
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
          // isFromUploadPage: isFromUploadPage,//智能判断时候从上传页面上传
          isCloudFile: true // 标记为云端文件
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

  // 从URL参数获取用户代码和会话ID
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      navigate('/');
      return;
    }
    // 如果没有会话ID，生成一个新的
    if (!sessionid) {
      // 判断来源，如果不是录音页面，主页跳转生成6位sessionId
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('from');
      const sessionLength = source === 'record' ? 8 : 6;
      const newSessionId = Math.random().toString(36).substr(2, sessionLength);
      navigate(`/${userid}/upload-media/${newSessionId}${window.location.search ? window.location.search : ''}`, { replace: true });
      return;
    }
    // 验证会话ID（录音页面8位，上传页面6位）
    if ((sessionid && sessionid.length === 8) || (sessionid && sessionid.length === 6)) {
      // 会话ID有效
    } else {
      navigate('/');
      return;
    }
    // 检查来源参数
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('from');
    setFromSource(source || '');
  }, [userid, sessionid, navigate]);

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

  // 阻止移动端双击缩放
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    const preventDoubleClick = (e) => {
      if (e.detail > 1) {
        e.preventDefault();
      }
    };
    
    if (isMobile) {
      document.addEventListener('touchstart', preventZoom, { passive: false });
      document.addEventListener('click', preventDoubleClick);
    }
    
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('click', preventDoubleClick);
    };
  }, [isMobile]);

  // 组件卸载时清理全屏预览状态
  useEffect(() => {
    return () => {
      // 确保组件卸载时恢复页面滚动
      document.body.classList.remove('fullscreen-preview-open');
      document.documentElement.classList.remove('fullscreen-preview-open');
    };
  }, []);

  // 返回逻辑 - 根据来源决定返回哪里
  const goBack = () => {
    if (fromSource === 'record') {
      // 从录音页面跳转过来的，返回录音页面
      navigate(`/${userCode}/${sessionid}`);
    } else {
      // 其他情况返回主页
      navigate(`/${userCode}`);
    }
  };

  // 上传媒体文件到服务器
  const uploadMediaFile = async (file, tempId) => {
    try {
      console.log('开始上传媒体文件:', { 
        fileName: file.name, 
        tempId, 
        blobSize: file.size,
        fileType: file.type,
        isMobile: isMobile,
        isTablet: isMobile && (window.innerWidth >= 768 && window.innerWidth <= 1366),
        userAgent: navigator.userAgent
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 设置上传进度监听
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            // console.log(`上传进度: ${percentComplete.toFixed(1)}% (${e.loaded}/${e.total})`);
            setUploadingFiles(prev => new Map(prev.set(tempId, {
              ...prev.get(tempId),
              progress: percentComplete
            })));
          }
        });
        
        xhr.addEventListener('loadstart', () => {
          console.log('开始上传文件到服务器');
          setUploadingFiles(prev => new Map(prev.set(tempId, {
            fileName: file.name,
            progress: 0,
            uploading: true
          })));
        });
        
        xhr.addEventListener('load', () => {
          console.log('服务器响应状态:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              console.log('服务器响应原文:', xhr.responseText);
              const result = JSON.parse(xhr.responseText);
              console.log('服务器响应结果:', result);
              if (result.success || result.code === 0 || result.status === 200) {
                // 上传成功，立即移除进度显示
                setUploadingFiles(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(tempId);
                  return newMap;
                });
                
                resolve({
                  success: true,
                  cloudUrl: result.file_url,
                  objectKey: result.object_key,
                  etag: result.etag,
                  requestId: result.request_id
                });
              } else {
                console.error('服务器返回错误:', result);
                throw new Error(result.message || '上传失败');
              }
            } catch (parseError) {
              console.error('响应解析失败:', parseError, '原始响应:', xhr.responseText);
              reject(new Error('响应解析失败，原始响应: ' + xhr.responseText));
            }
          } else {
            console.error('HTTP错误:', xhr.status, xhr.statusText, '响应:', xhr.responseText);
            reject(new Error(`上传失败: ${xhr.status} - ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          console.error('网络错误或请求失败');
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('网络错误'));
        });
        
        xhr.addEventListener('abort', () => {
          console.log('上传被取消');
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('上传被取消'));
        });
        
        // 构建URL，将folder作为查询参数，格式为 userCode/sessionId
        const uploadUrl = new URL(`${API_BASE_URL}/upload`);
        const folderPath = buildRecordingPath(sessionid || 'default', userCode);
        uploadUrl.searchParams.append('folder', folderPath);
        
        console.log('媒体文件上传URL:', uploadUrl.toString());
        console.log('文件夹路径:', folderPath);
        console.log('请求详情:', {
          method: 'POST',
          url: uploadUrl.toString(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
      
    } catch (error) {
      console.error('上传媒体文件失败:', error);
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  // 处理文件选择
  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    const mediaFiles = fileList.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFiles.length === 0) {
      alert('请选择图片或视频文件');
      return;
    }
    
    // 移动端限制文件数量和大小
    if (isMobile && mediaFiles.length > 10) {
      alert('移动端单次最多上传10个文件');
      return;
    }
    
    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 检测平板设备（包括Android平板）
    const isTablet = isMobile && (
      /iPad|Tablet|PlayBook|Kindle|Silk|Android.*(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
      (window.innerWidth >= 768 && window.innerWidth <= 1366)
    );
    
    mediaFiles.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      // 文件大小限制
      const maxSize = isMobile ? 
        (isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024) : // 移动端：视频100MB，图片50MB
        (isVideo ? 200 * 1024 * 1024 : 100 * 1024 * 1024); // 桌面端：视频200MB，图片100MB
      
      if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / 1024 / 1024);
        alert(`文件 ${file.name} 过大，${isVideo ? '视频' : '图片'}文件不能超过${sizeMB}MB`);
        return;
      }
      
      // 移动设备（包括平板）视频格式转换处理
      let processedFile = file;
      let originalFormat = '';
      let convertedFormat = '';
      
      if (isVideo && (isMobile || isTablet)) {
        // 扩展格式检测，不仅仅是mov格式
        const needsConversion = 
          file.type === 'video/quicktime' || 
          file.name.toLowerCase().endsWith('.mov') ||
          file.type === 'video/3gpp' ||
          file.name.toLowerCase().endsWith('.3gp') ||
          file.type === 'video/x-msvideo' ||
          file.name.toLowerCase().endsWith('.avi') ||
          // 某些Android设备可能产生的格式
          file.type === '' && /\.(mov|3gp|avi|wmv|flv)$/i.test(file.name);

        if (needsConversion) {
          console.log('检测到移动设备的非标准视频格式，准备转换为mp4格式');
          originalFormat = file.name.split('.').pop().toLowerCase() || file.type;
          
          // 创建新的文件名（统一改为.mp4）
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${nameWithoutExt}.mp4`;
          
          // 创建新的File对象，修改MIME类型为video/mp4
          processedFile = new File([file], newFileName, {
            type: 'video/mp4',
            lastModified: file.lastModified
          });
          
          convertedFormat = 'mp4';
          console.log(`移动端视频格式转换: ${originalFormat} -> ${convertedFormat}`);
          console.log(`文件名转换: ${file.name} -> ${newFileName}`);
          console.log(`MIME类型转换: ${file.type} -> video/mp4`);
        } else {
          // 只要不是标准mp4类型，都强制修正
          const ext = processedFile.name.split('.').pop().toLowerCase();
          if (ext !== 'mp4' || processedFile.type !== 'video/mp4') {
            const nameWithoutExt = processedFile.name.replace(/\.[^/.]+$/, '');
            processedFile = new File([processedFile], `${nameWithoutExt}.mp4`, {
              type: 'video/mp4',
              lastModified: processedFile.lastModified
            });
            convertedFormat = 'mp4';
            originalFormat = ext;
            console.log(`强制修正视频类型/扩展名: ${ext} -> mp4`);
          }
        }
      }
      
      // 上传前详细日志
      if (isVideo) {
        console.log('最终上传文件:', processedFile, 'MIME:', processedFile.type, '文件名:', processedFile.name);
      }
      
      // 增强的视频格式兼容性检查
      if (isVideo) {
        const supportedVideoFormats = ['mp4', 'webm', 'mov', '3gp', 'avi']; // 扩展支持的格式，会被转换为mp4
        const fileExtension = processedFile.name.split('.').pop().toLowerCase();
        
        if (!supportedVideoFormats.includes(fileExtension) && !processedFile.type.startsWith('video/')) {
          alert(`不支持的视频格式: ${processedFile.name}. 支持的格式：MP4, WebM, MOV, 3GP, AVI（移动端自动转换）`);
          return;
        }
        
        // 显示转换信息
        if (originalFormat && convertedFormat) {
          console.log(`✅ 移动端视频格式自动转换成功: ${originalFormat} → ${convertedFormat}`);
        }
      }
      
      if (isImage) {
        // 处理图片文件
        const reader = new FileReader();
        reader.onload = (e) => {
          const uniqueId = generateUniqueImageId(); // 生成唯一图片ID
          const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
          
          const newFile = {
            id: uniqueId,
            tempId: tempId,
            name: processedFile.name,
            url: e.target.result,
            file: processedFile,
            type: 'image',
            uploadTime: new Date().toLocaleString(),
            size: processedFile.size,
            sessionId: sessionid, // 添加会话ID
            userCode: userCode, // 添加userCode
            fromRecordPage: fromSource === 'record' // 新增：标记来源
          };
          setUploadedFiles(prev => [...prev, newFile]);
          
          // 上传到服务器
          uploadMediaFile(processedFile, tempId).then(result => {
            if (result.success) {
              // 显示上传成功提示
              alert(`图片上传成功！`);
              // 重新加载云端文件
              loadCloudMediaFiles();
            }
          }).catch(error => {
            alert(`图片上传失败: ${error.message}`);
          });
        };
        reader.readAsDataURL(processedFile);
      } else if (isVideo) {
        // 处理视频文件
        const uniqueId = generateUniqueVideoId(); // 生成唯一视频ID
        const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
        const videoUrl = URL.createObjectURL(processedFile);
        
        const newFile = {
          id: uniqueId,
          tempId: tempId,
          name: processedFile.name,
          url: videoUrl,
          file: processedFile,
          type: 'video',
          uploadTime: new Date().toLocaleString(),
          size: processedFile.size,
          sessionId: sessionid, // 添加会话ID
          originalFormat: originalFormat, // 记录原始格式
          convertedFormat: convertedFormat, // 记录转换后格式
          isConverted: !!(originalFormat && convertedFormat), // 是否经过转换
          userCode: userCode, // 添加userCode
          fromRecordPage: fromSource === 'record' // 新增：标记来源
        };
        setUploadedFiles(prev => [...prev, newFile]);
        
        // 上传到服务器
        uploadMediaFile(processedFile, tempId).then(result => {
          if (result.success) {
            // 显示上传成功提示，包含转换信息
            const successMessage = convertedFormat ? 
              `视频上传成功！(${originalFormat} → ${convertedFormat} 格式转换)` : 
              `视频上传成功！`;
            alert(successMessage);
            // 重新加载云端文件
            loadCloudMediaFiles();
          }
        }).catch(error => {
          alert(`视频上传失败: ${error.message}`);
        });
      }
    });
  };

  // 其他处理函数
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isMobile) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!isMobile) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isMobile && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        handleFileSelect(files);
      }
    }
  };

  const handleDeleteFile = async (fileId) => {
    const fileToDelete = uploadedFiles.find(file => file.id === fileId);
    if (!fileToDelete) return;
    
    if (!window.confirm('确定要删除这个文件吗？')) return;
    
    try {
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
      const totalPages = Math.ceil(newFiles.length / filesPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 处理媒体文件点击
  const handleMediaClick = (file) => {
    // 移动端：所有媒体文件都弹窗预览（图片和视频）
    // PC端：图片弹窗预览，视频也弹窗预览（不再跳转播放页面）
    setPreviewFile(file);
  };

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

  // userCode变化时加载云端媒体文件
  useEffect(() => {
    if (userCode) {
      loadCloudMediaFiles();
    }
  }, [userCode]);

  return (
    <div className="upload-page" onPaste={handlePaste}>
      {/* 顶部导航 */}
      <div className="upload-header">
        <div className="back-button" onClick={goBack}>
          <span className="back-text">
            ← {fromSource === 'record' ? '返回录音页面' : '返回主页'}
          </span>
        </div>
        <div className="session-info">
          <span>用户: {userCode} | 会话: {sessionid}</span>
        </div>
      </div>

      {/* 上传区域 */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onClick={handleUploadAreaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="upload-text">
          {isMobile ? '点击、粘贴照片或视频到此处开始上传' : '点击、粘贴或拖放照片和视频到此处开始上传'}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* 文件展示区域 */}
      <div className="photos-container">
        <div className="all-photos-section">
          {/* 文件类型标签 */}
          <div className="file-type-tabs">
            <button 
              className={`file-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
            >
              📁 全部 ({uploadedFiles.length})
            </button>
            <button 
              className={`file-tab ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('photos');
                setCurrentPage(1);
              }}
            >
              📷 照片 ({uploadedFiles.filter(f => f.type === 'image').length})
            </button>
            <button 
              className={`file-tab ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('videos');
                setCurrentPage(1);
              }}
            >
              🎬 视频 ({uploadedFiles.filter(f => f.type === 'video').length})
            </button>
          </div>
          
          <div className="section-header">
            {totalPages > 1 && (
              <div className="pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            )}
          </div>
          
          {filteredFiles.length > 0 ? (
            <>
              <div className="photos-grid">
                              {currentFiles.map(file => (
                <div key={file.id} className="media-item">
                  <div className="media-content" onClick={() => handleMediaClick(file)}>
                    {file.type === 'image' ? (
                      <div className="image-preview">
                      <img src={file.ossUrl || file.preview || file.url} alt={file.name} className="media-preview" 
                        onError={e => { console.error('图片加载失败', file.ossUrl || file.preview || file.url, file); e.target.style.background = '#fdd'; }}
                      />
                        {/* 显示图片ID，区分是否从录音页面上传 */}
                        {file.id && typeof file.id === 'string' && file.id.startsWith('img_') && (
                          <div className="image-id-display1">
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
                      <div className="video-preview">
                        <video 
                          src={file.ossUrl || file.preview || file.url} 
                          className="media-preview"
                          muted
                          preload="metadata"
                          onLoadedMetadata={(e) => { e.target.currentTime = 1; }}
                          onError={e => { console.error('视频加载失败', file.ossUrl || file.preview || file.url, file); e.target.style.background = '#fdd'; }}
                        />
                        <div className="video-overlay">
                          <div className="video-play-icon">▶</div>
                        </div>
                        {/* 显示视频ID，区分是否从录音页面上传 */}
                        {file.id && typeof file.id === 'string' && file.id.startsWith('vid_') && (
                          <div className="video-id-display1">
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
                    <div className="media-overlay">
                      <button 
                        className="delete-media-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
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
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  <span className="pagination-current-page">{currentPage}</span>
                  <span className="pagination-total-page">/ {totalPages} 页</span>
                  <button 
                    className="pagination-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {activeTab === 'all' ? '📁' : activeTab === 'photos' ? '📷' : '🎬'}
              </div>
              <p className="empty-text">
                还没有上传任何{activeTab === 'all' ? '文件' : activeTab === 'photos' ? '照片' : '视频'}
              </p>
              <p className="empty-subtext">点击上方区域开始上传</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 - 移动端全屏，PC端图片 */}
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
                  onPlay={e => { setVideoPlaying(true); handleVideoPlay(); }}
                  onPause={() => setVideoPlaying(false)}
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

export default UploadMediaPage; 