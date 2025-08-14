import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadMediaPage.css'; // 复用现有样式
import { validateUserCode } from './utils/userCode';
 import { isWechatMiniProgram } from './utils/environment';
import { buildUploadFileName, sanitizeCustomName, setCustomName } from './utils/displayName';

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
  // 长按视频相关状态
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);

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
    return sessionid; // 默认返回当前session
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
    return sessionid; // 默认返回当前session
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
      // 清理长按定时器
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

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
  const uploadMediaFile = async (file, tempId, customBaseName) => {
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
      let uploadFile = file;
      if (customBaseName) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const uniqueSuffix = Date.now().toString(36).slice(-8);
        const newFileName = buildUploadFileName(customBaseName, uniqueSuffix, ext);
        uploadFile = new File([file], newFileName, { type: file.type, lastModified: file.lastModified });
      }
      formData.append('file', uploadFile);
      
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
            fileName: uploadFile.name,
            fileSize: uploadFile.size,
            fileType: uploadFile.type
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
        const userInput = window.prompt('给这张图片起个名字（可选）\n\n支持：中英文、数字、空格、连字符(-_)、括号()[]', '');
        const customName = userInput ? sanitizeCustomName(userInput) : '';
        // 处理图片文件
        const reader = new FileReader();
        reader.onload = (e) => {
          const uniqueId = generateUniqueImageId(); // 生成唯一图片ID
          const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
          
           const newFile = {
            id: uniqueId,
            tempId: tempId,
            name: customName || processedFile.name,
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
           uploadMediaFile(processedFile, tempId, customName).then(result => {
            if (result.success) {
              // 显示上传成功提示
              alert(`图片上传成功！`);
               if (result.objectKey && customName) {
                 setCustomName(result.objectKey, customName);
               }
              // 重新加载云端文件
              loadCloudMediaFiles();
            }
          }).catch(error => {
            alert(`图片上传失败: ${error.message}`);
          });
        };
        reader.readAsDataURL(processedFile);
      } else if (isVideo) {
        const userInput = window.prompt('给这个视频起个名字（可选）\n\n支持：中英文、数字、空格、连字符(-_)、括号()[]', '');
        const customName = userInput ? sanitizeCustomName(userInput) : '';
        // 处理视频文件
        const uniqueId = generateUniqueVideoId(); // 生成唯一视频ID
        const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
        const videoUrl = URL.createObjectURL(processedFile);
        
        const newFile = {
          id: uniqueId,
          tempId: tempId,
          name: customName || processedFile.name,
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
        uploadMediaFile(processedFile, tempId, customName).then(result => {
          if (result.success) {
            // 显示上传成功提示，包含转换信息
            const successMessage = convertedFormat ? 
              `视频上传成功！(${originalFormat} → ${convertedFormat} 格式转换)` : 
              `视频上传成功！`;
            alert(successMessage);
            if (result.objectKey && customName) {
              setCustomName(result.objectKey, customName);
            }
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
    // 如果是长按操作，不执行点击逻辑
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }

    if (file.type === 'video') {
      // 视频点击跳转到视频播放页面
      const videoId = file.id;
      console.log('UploadMediaPage: 视频点击，准备跳转', { 
        videoId, 
        userCode, 
        sessionid, 
        fileInfo: file 
      });
      
      if (videoId && typeof videoId === 'string') {
        // 从视频ID中提取session信息
        const targetSessionId = extractSessionFromVideoId(videoId);
        console.log('UploadMediaPage: 从视频ID提取的session:', targetSessionId);
        
        const targetUrl = `/${userCode}/video-player/${targetSessionId}/${videoId}?from=upload`;
        console.log('UploadMediaPage: 跳转到视频播放页面:', targetUrl, '使用session:', targetSessionId);
        navigate(targetUrl);
      } else {
        console.warn('UploadMediaPage: 视频ID无效:', videoId, '文件:', file);
        // 降级到弹窗预览
        alert('视频ID无效，将使用弹窗预览模式');
        setPreviewFile(file);
      }
    } else {
      // 图片跳转到图片查看页面
      const imageId = file.id;
      if (imageId && typeof imageId === 'string') {
        const targetSessionId = extractSessionFromImageId(imageId);
        let targetUrl = `/${userCode}/image-viewer/${targetSessionId}/${imageId}?from=upload`;
        // 若有objectKey，追加查询参数，便于查看页精准定位
        if (file.objectKey) {
          const ok = encodeURIComponent(file.objectKey);
          targetUrl += `&ok=${ok}`;
        }
        console.log('UploadMediaPage: 跳转到图片查看页面:', targetUrl, '使用session:', targetSessionId, 'objectKey:', file.objectKey);
        navigate(targetUrl);
      } else {
        console.warn('UploadMediaPage: 图片ID无效:', imageId, '文件:', file);
        // 降级到弹窗预览
        alert('图片ID无效，将使用弹窗预览模式');
        setPreviewFile(file);
      }
    }
  };

  // 长按开始事件（支持图片和视频）
  const handleLongPressStart = (file, e) => {
    // 添加长按开始的视觉反馈
    const mediaElement = e.currentTarget;
    mediaElement.classList.add('long-pressing');
    
    const timer = setTimeout(() => {
      setIsLongPress(true);
      // 移除长按状态，添加成功状态
      mediaElement.classList.remove('long-pressing');
      mediaElement.classList.add('long-press-success');
      
      // 复制对应的查看链接
      if (file.type === 'video') {
        copyVideoLink(file);
      } else if (file.type === 'image') {
        copyImageLink(file);
      }
      
      // 2秒后移除成功状态
      setTimeout(() => {
        mediaElement.classList.remove('long-press-success');
      }, 600);
    }, 500); // 500ms长按触发
    
    setLongPressTimer(timer);
  };

  // 长按结束事件
  const handleLongPressEnd = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      // 如果提前松开，清理长按状态
      const mediaElement = e.currentTarget;
      mediaElement.classList.remove('long-pressing');
    }
  };

  // 复制视频播放链接
  const copyVideoLink = async (file) => {
    try {
      const videoId = file.id;
      console.log('UploadMediaPage: 开始复制视频链接', { videoId, file });
      if (!videoId || typeof videoId !== 'string') {
        console.error('UploadMediaPage: 视频ID无效:', videoId);
        alert('无法生成播放链接：视频ID无效');
        return;
      }
      
      // 从视频ID中提取session信息
      const targetSessionId = extractSessionFromVideoId(videoId);
      console.log('UploadMediaPage: 从视频ID提取的session:', targetSessionId);
      
      // 生成完整的播放链接
      const baseUrl = window.location.origin;
      const playLink = `${baseUrl}/${userCode}/video-player/${targetSessionId}/${videoId}?from=upload`;
      console.log('UploadMediaPage: 生成的播放链接:', playLink, '使用session:', targetSessionId);
      
      // 优先使用现代Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(playLink);
          console.log('UploadMediaPage: 视频播放链接已复制到剪贴板');
          alert('✅ 视频播放链接已复制到剪贴板！');
          return;
        } catch (err) {
          console.log('Clipboard API失败，尝试降级方法:', err);
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
      console.log('UploadMediaPage: 开始复制图片链接', { imageId, file });
      if (!imageId || typeof imageId !== 'string') {
        console.error('UploadMediaPage: 图片ID无效:', imageId);
        alert('无法生成查看链接：图片ID无效');
        return;
      }
      
      // 从图片ID中提取session信息
      const targetSessionId = extractSessionFromImageId(imageId);
      console.log('UploadMediaPage: 从图片ID提取的session:', targetSessionId);
      
      // 生成完整的查看链接
      const baseUrl = window.location.origin;
      let viewLink = `${baseUrl}/${userCode}/image-viewer/${targetSessionId}/${imageId}?from=upload`;
      if (file.objectKey) {
        viewLink += `&ok=${encodeURIComponent(file.objectKey)}`;
      }
      console.log('UploadMediaPage: 生成的图片查看链接:', viewLink, '使用session:', targetSessionId, 'objectKey:', file.objectKey);
      
      // 优先使用现代Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(viewLink);
          console.log('UploadMediaPage: 图片查看链接已复制到剪贴板');
          alert('✅ 图片查看链接已复制到剪贴板！');
          return;
        } catch (err) {
          console.log('Clipboard API失败，尝试降级方法:', err);
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
      console.log('UploadMediaPage: 降级方法复制成功');
      alert('✅ 视频播放链接已复制到剪贴板！');
    } else {
      console.log('UploadMediaPage: 所有复制方法都失败，显示手动复制提示');
      // 最后的备选方案：显示可复制的提示框
      const copyPrompt = window.prompt('请手动复制以下链接：', text);
      if (copyPrompt !== null) {
        alert('✅ 感谢您的操作！');
      }
    }
  }

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

  // 智能跳转到播放页面
  const goToPlayerPage = async () => {
    try {
      // 获取当前会话的录音文件
      const prefix = `recordings/${userCode}/${sessionid}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=100`
      );

      if (!response.ok) {
        alert('无法获取录音文件列表');
        return;
      }

      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];
      
      // 过滤出音频文件
      const audioFiles = files.filter(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        if (!objectKey) return false;
        const fileName = objectKey.split('/').pop();
        const contentType = file.content_type || '';
        const isAudio = contentType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma|amr|3gp|opus|webm)$/i.test(fileName);
        return isAudio;
      });

      if (audioFiles.length === 0) {
        alert('此会话中没有找到录音文件，请先录制一段音频');
        return;
      }

      // 使用最新的录音文件
      const latestAudio = audioFiles.sort((a, b) => {
        const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0);
        const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0);
        return timeB - timeA;
      })[0];

      // 从文件名提取recordingId
      const objectKey = latestAudio.object_key || latestAudio.objectKey || latestAudio.key || latestAudio.name;
      const fileName = objectKey.split('/').pop();
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split('_');
      const recordingId = parts[parts.length - 1] || '12345678';

      console.log('跳转到播放页面:', {
        userCode,
        sessionid,
        recordingId,
        fileName
      });

      // 跳转到播放页面
      navigate(`/${userCode}/player/${sessionid}/${recordingId}`);
    } catch (error) {
      console.error('跳转播放页面失败:', error);
      alert('跳转失败，请手动进入播放页面');
    }
  };

  return (
    <div className="upload-page" onPaste={handlePaste}>
      {/* 顶部导航 - 小程序环境下隐藏 */}
      {!isWechatMiniProgram() && (
      <div className="upload-header">
        <div className="back-button" onClick={goBack}>
          <span className="back-text">
            {fromSource === 'record' ? '返回录音页面' : '返回主页'}
          </span>
        </div>
        
        
        <div className="session-info">
          <span>用户: {userCode} | 会话: {sessionid}</span>
        </div>
      </div>
      )}

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
                  <div 
                    className="media-content" 
                    onClick={() => handleMediaClick(file)}
                    onMouseDown={(e) => handleLongPressStart(file, e)}
                    onMouseUp={(e) => handleLongPressEnd(e)}
                    onMouseLeave={(e) => handleLongPressEnd(e)}
                    onTouchStart={(e) => {
                      // 确保事件不是被动的，以便可以调用preventDefault
                      if (e.cancelable) {
                        e.preventDefault();
                      }
                      handleLongPressStart(file, e);
                    }}
                    onTouchEnd={(e) => handleLongPressEnd(e)}
                    onTouchCancel={(e) => handleLongPressEnd(e)}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                  >
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
                <div className="pagination pagination-row">
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