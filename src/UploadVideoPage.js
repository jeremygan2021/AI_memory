import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadPhotoPage.css'; // 复用照片上传页面的样式
import { validateUserCode } from './utils/userCode';

const UploadVideoPage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userCode, setUserCode] = useState(''); // 4字符用户代码
  const filesPerPage = 12;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
      return;
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

  // 返回主页
  const goBack = () => {
    navigate(`/${userCode}`);
  };

  // 上传视频文件到服务器
  const uploadVideoFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || response.statusText;
        } catch {
          errorDetail = response.statusText;
        }
        throw new Error(`上传失败: ${response.status} - ${errorDetail}`);
      }

      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          cloudUrl: result.file_url,
          objectKey: result.object_key,
          etag: result.etag,
          requestId: result.request_id
        };
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      alert(`视频上传失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // 处理文件选择
  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    const videoFiles = fileList.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      alert('请选择视频文件');
      return;
    }
    
    // 移动端限制文件数量和大小
    if (isMobile && videoFiles.length > 5) {
      alert('移动端单次最多上传5个视频文件');
      return;
    }
    
    videoFiles.forEach(file => {
      // 文件大小限制
      if (isMobile && file.size > 100 * 1024 * 1024) { // 100MB
        alert(`视频文件 ${file.name} 过大，移动端单个文件不能超过100MB`);
        return;
      }
      
      if (!isMobile && file.size > 200 * 1024 * 1024) { // 200MB
        alert(`视频文件 ${file.name} 过大，单个文件不能超过200MB`);
        return;
      }
      
      // 创建视频URL用于预览
      const videoUrl = URL.createObjectURL(file);
      const newFile = {
        id: Date.now() + Math.random(),
        name: file.name,
        url: videoUrl,
        file: file,
        type: 'video',
        uploadTime: new Date().toLocaleString(),
        size: file.size
      };
      setUploadedFiles(prev => [...prev, newFile]);
      
      // 上传到服务器
      uploadVideoFile(file).then(result => {
        if (result.success) {
          // 存储到localStorage
          const fileInfo = {
            id: newFile.id,
            name: newFile.name,
            preview: result.cloudUrl,
            type: newFile.type,
            uploadTime: newFile.uploadTime,
            objectKey: result.objectKey
          };
          // 追加到本地存储
          const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
          localStorage.setItem('uploadedFiles', JSON.stringify([...saved, fileInfo]));
          // 触发事件通知主页刷新
          window.dispatchEvent(new Event('filesUpdated'));
        }
      });
    });
  };

  // 其他函数（复用上传照片页面的逻辑）
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
        if (items[i].kind === 'file' && items[i].type.startsWith('video/')) {
          files.push(items[i].getAsFile());
        }
      }
      if (files.length > 0) {
        handleFileSelect(files);
      }
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // 从本地状态中删除
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      // 从localStorage中删除
      const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const updated = saved.filter(file => file.id !== fileId);
      localStorage.setItem('uploadedFiles', JSON.stringify(updated));
      
      // 触发事件通知主页刷新
      window.dispatchEvent(new Event('filesUpdated'));
    } catch (error) {
      alert('删除视频失败');
    }
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  // 页面加载时读取所有云端视频
  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      try {
        const allFiles = JSON.parse(saved);
        const videoFiles = allFiles.filter(file => file.type === 'video');
        setUploadedFiles(videoFiles);
      } catch (e) {
        setUploadedFiles([]);
      }
    }
  }, []);

  // 分页逻辑
  const totalPages = Math.ceil(uploadedFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = uploadedFiles.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

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
          <span className="back-text">← 返回主页</span>
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
          {isMobile ? '点击或粘贴视频到此处开始上传' : '点击、粘贴或拖放视频到此处开始上传'}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          capture={isMobile ? 'environment' : undefined}
        />
      </div>

      {/* 所有视频展示区域 */}
      <div className="photos-container">
        <div className="all-photos-section">
          <div className="section-header">
            <h3 className="section-title">所有视频 ({uploadedFiles.length})</h3>
            {totalPages > 1 && (
              <div className="pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            )}
          </div>
          
          {uploadedFiles.length > 0 ? (
            <>
              <div className="photos-grid">
                {currentFiles.map(file => (
                  <div key={file.id} className="media-item">
                    <div className="media-content" onClick={() => handlePreviewFile(file)}>
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
                      </div>
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
              <div className="empty-icon">🎬</div>
              <p className="empty-text">还没有上传任何视频</p>
              <p className="empty-subtext">点击上方区域开始上传</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewFile && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>×</button>
            <video 
              src={previewFile.preview || previewFile.url} 
              controls 
              autoPlay 
              className="preview-media"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadVideoPage; 