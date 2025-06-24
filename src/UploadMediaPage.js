import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadMediaPage.css'; // 复用现有样式
import { validateUserCode } from './utils/userCode';

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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  // 生成唯一的视频标识码
  const generateUniqueVideoId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const uniqueId = Math.random().toString(36).substr(2, 8); // 8位唯一ID
    return `vid_${timestamp}_${random}_${uniqueId}`;
  };

  // 生成唯一的图片标识码
  const generateUniqueImageId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const uniqueId = Math.random().toString(36).substr(2, 8); // 8位唯一ID
    return `img_${timestamp}_${random}_${uniqueId}`;
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
      const newSessionId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userid}/upload-media/${newSessionId}`, { replace: true });
      return;
    }
    
    // 验证会话ID（应该是8位字符）
    if (sessionid && sessionid.length === 8) {
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

  // 上传文件到服务器，支持进度跟踪
  const uploadFile = async (file, tempId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 设置上传进度监听
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadingFiles(prev => new Map(prev.set(tempId, {
              ...prev.get(tempId),
              progress: percentComplete
            })));
          }
        });
        
        xhr.addEventListener('loadstart', () => {
          setUploadingFiles(prev => new Map(prev.set(tempId, {
            fileName: file.name,
            progress: 0,
            uploading: true
          })));
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.success) {
                // 上传成功，显示成功状态
                setUploadingFiles(prev => new Map(prev.set(tempId, {
                  ...prev.get(tempId),
                  progress: 100,
                  uploading: false,
                  success: true
                })));
                
                // 2秒后移除进度显示
                setTimeout(() => {
                  setUploadingFiles(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(tempId);
                    return newMap;
                  });
                }, 2000);
                
                resolve({
                  success: true,
                  cloudUrl: result.file_url,
                  objectKey: result.object_key,
                  etag: result.etag,
                  requestId: result.request_id
                });
              } else {
                throw new Error(result.message || '上传失败');
              }
            } catch (parseError) {
              reject(new Error('响应解析失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.status} - ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('网络错误'));
        });
        
        xhr.addEventListener('abort', () => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('上传被取消'));
        });
        
        xhr.open('POST', `${API_BASE_URL}/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      alert(`文件上传失败: ${error.message}`);
      return { success: false, error: error.message };
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
      
      if (isImage) {
        // 处理图片文件
        const reader = new FileReader();
        reader.onload = (e) => {
          const uniqueId = generateUniqueImageId(); // 生成唯一图片ID
          const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
          
          const newFile = {
            id: uniqueId,
            tempId: tempId,
            name: file.name,
            url: e.target.result,
            file: file,
            type: 'image',
            uploadTime: new Date().toLocaleString(),
            size: file.size,
            sessionId: sessionid // 添加会话ID
          };
          setUploadedFiles(prev => [...prev, newFile]);
          
          // 上传到服务器
          uploadFile(file, tempId).then(result => {
            if (result.success) {
              const fileInfo = {
                id: uniqueId,
                name: newFile.name,
                preview: result.cloudUrl,
                type: newFile.type,
                uploadTime: newFile.uploadTime,
                objectKey: result.objectKey,
                sessionId: sessionid
              };
              saveToLocalStorage(fileInfo);
            }
          });
        };
        reader.readAsDataURL(file);
      } else if (isVideo) {
        // 处理视频文件
        const uniqueId = generateUniqueVideoId(); // 生成唯一视频ID
        const tempId = Date.now() + Math.random(); // 临时ID用于跟踪上传进度
        const videoUrl = URL.createObjectURL(file);
        
        const newFile = {
          id: uniqueId,
          tempId: tempId,
          name: file.name,
          url: videoUrl,
          file: file,
          type: 'video',
          uploadTime: new Date().toLocaleString(),
          size: file.size,
          sessionId: sessionid // 添加会话ID
        };
        setUploadedFiles(prev => [...prev, newFile]);
        
        // 上传到服务器
        uploadFile(file, tempId).then(result => {
          if (result.success) {
            const fileInfo = {
              id: uniqueId,
              name: newFile.name,
              preview: result.cloudUrl,
              type: newFile.type,
              uploadTime: newFile.uploadTime,
              objectKey: result.objectKey,
              sessionId: sessionid
            };
            saveToLocalStorage(fileInfo);
          }
        });
      }
    });
  };

  // 保存到本地存储
  const saveToLocalStorage = (fileInfo) => {
    const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const updated = [...saved, fileInfo];
    console.log('保存文件到localStorage:', fileInfo); // 调试信息
    console.log('更新后的文件列表:', updated); // 调试信息
    localStorage.setItem('uploadedFiles', JSON.stringify(updated));
    window.dispatchEvent(new Event('filesUpdated'));
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
      
      // 从本地状态删除
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      // 从localStorage删除
      const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const updated = saved.filter(file => file.id !== fileId);
      localStorage.setItem('uploadedFiles', JSON.stringify(updated));
      window.dispatchEvent(new Event('filesUpdated'));
      
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

  const handlePreviewFile = (file) => {
    if (file.type === 'video') {
      // // 视频跳转到播放页面，使用新的独立路由
      // if (file.id && file.id.startsWith('vid_')) {
      //   // 新的独立视频ID，无需sessionid
      //   navigate(`/${userCode}/video-player/${file.id}`);
      // } else {
        // 兼容旧的视频ID，使用sessionid路由
        navigate(`/${userCode}/video-player/${sessionid}/${file.id}`);
      // }
    } else {
      // 图片显示预览弹窗
      setPreviewFile(file);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  // 页面加载时读取文件
  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      try {
        const allFiles = JSON.parse(saved);
        console.log('加载的历史文件:', allFiles); // 调试信息
        // 显示所有历史文件，不按会话过滤
        setUploadedFiles(allFiles);
      } catch (e) {
        console.error('加载历史文件失败:', e);
        setUploadedFiles([]);
      }
    } else {
      console.log('没有找到历史文件'); // 调试信息
    }
    
    const handleFilesUpdated = () => {
      const updated = localStorage.getItem('uploadedFiles');
      if (updated) {
        try {
          const allFiles = JSON.parse(updated);
          // 显示所有历史文件，不按会话过滤
          setUploadedFiles(allFiles);
        } catch (e) {
          setUploadedFiles([]);
        }
      }
    };
    
    window.addEventListener('filesUpdated', handleFilesUpdated);
    return () => window.removeEventListener('filesUpdated', handleFilesUpdated);
  }, []);

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
          capture={isMobile ? 'environment' : undefined}
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
                  <div className="media-content" onClick={() => handlePreviewFile(file)}>
                    {file.type === 'image' ? (
                      <img src={file.preview || file.url} alt={file.name} className="media-preview" />
                    ) : (
                      <div className="video-preview">
                        <video 
                          src={file.preview || file.url} 
                          className="media-preview"
                          muted
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            e.target.currentTime = 1;
                          }}
                        />
                        <div className="video-overlay">
                          <div className="video-play-icon">▶</div>
                        </div>
                        {/* 显示视频唯一ID */}
                        {file.id && file.id.startsWith('vid_') && (
                          <div className="video-id-display">
                            ID: {file.id.split('_').pop()}
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
              
              {/* 上传进度显示 */}
              {Array.from(uploadingFiles.entries()).map(([tempId, uploadInfo]) => (
                <div key={tempId} className="media-item uploading-item">
                  <div className="upload-progress-container">
                    <div className="upload-progress-circle">
                      <div className="progress-ring">
                        <svg className="progress-ring-svg" width="120" height="120">
                          <circle
                            className="progress-ring-background"
                            cx="60"
                            cy="60"
                            r="54"
                          />
                          <circle
                            className="progress-ring-progress"
                            cx="60"
                            cy="60"
                            r="54"
                            style={{
                              strokeDasharray: `${2 * Math.PI * 54}`,
                              strokeDashoffset: `${2 * Math.PI * 54 * (1 - uploadInfo.progress / 100)}`
                            }}
                          />
                        </svg>
                        <div className="progress-text">
                          {uploadInfo.success ? (
                            <div className="success-icon">✓</div>
                          ) : (
                            <div className="progress-percentage">{Math.round(uploadInfo.progress)}%</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="upload-file-name">{uploadInfo.fileName}</div>
                    {uploadInfo.success && (
                      <div className="upload-success-message">上传成功！</div>
                    )}
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

      {/* 预览弹窗 - 仅用于图片 */}
      {previewFile && previewFile.type === 'image' && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>×</button>
            <img src={previewFile.preview || previewFile.url} alt={previewFile.name} className="preview-media" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadMediaPage; 