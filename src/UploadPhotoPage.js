import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadPhotoPage.css';
import { validateUserCode } from './utils/userCode';

const UploadPhotoPage = () => {
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

  // 新增：上传图片/视频文件到服务器
  const uploadMediaFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 可选：自定义文件夹路径
      // const folderPath = `user/${userid}`;
      // const uploadUrl = new URL(`${API_BASE_URL}/upload`);
      // uploadUrl.searchParams.append('folder', folderPath);

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
        // 上传成功，返回云端URL等

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
      alert(`文件上传失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // 处理文件选择
  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    const imageFiles = fileList.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('请选择图片文件');
      return;
    }
    
    // 移动端限制文件数量和大小
    if (isMobile && imageFiles.length > 10) {
      alert('移动端单次最多上传10个图片文件');
      return;
    }
    
    imageFiles.forEach(file => {
     // 文件大小限制
     if (isMobile && file.size > 50 * 1024 * 1024) { // 50MB
      alert(`图片文件 ${file.name} 过大，移动端单个文件不能超过50MB`);
      return;
    }
    
    if (!isMobile && file.size > 100 * 1024 * 1024) { // 100MB
      alert(`图片文件 ${file.name} 过大，单个文件不能超过100MB`);
      return;
    }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: e.target.result,
          file: file,
          type: 'image',
          uploadTime: new Date().toLocaleString(),
          size: file.size
        };
        setUploadedFiles(prev => [...prev, newFile]);
        // 新增：上传到服务器
        uploadMediaFile(file).then(result => {
          if (result.success) {
            // 存储到localStorage
            const fileInfo = {
              id: newFile.id,
              name: newFile.name,
              preview: result.cloudUrl, // 用云端URL
              type: newFile.type,
              uploadTime: newFile.uploadTime,
              objectKey: result.objectKey // 新增objectKey
            };
            // 追加到本地存储
            const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
            localStorage.setItem('uploadedFiles', JSON.stringify([...saved, fileInfo]));
            // 触发事件通知主页刷新
            window.dispatchEvent(new Event('filesUpdated'));
            // 控制台输出云端URL

          }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // 点击上传区域
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // 文件输入变化
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // 拖拽相关事件
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isMobile) { // 移动端不支持拖拽
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
    if (!isMobile) {
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
    }
  };

  // 移动端粘贴功能
  const handlePaste = (e) => {
    if (isMobile && e.clipboardData && e.clipboardData.files.length > 0) {
      handleFileSelect(e.clipboardData.files);
    }
  };

  // 删除上传的文件（先请求后端删除，再移除本地）
  const handleDeleteFile = async (fileId) => {
    const fileToDelete = uploadedFiles.find(file => file.id === fileId);
    if (!fileToDelete) return;
    if (!window.confirm('确定要删除这张图片吗？')) return;
    try {
      // 先请求后端删除
      if (fileToDelete.objectKey) {
        const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(fileToDelete.objectKey)}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('服务器删除失败');
        }
      }
      // 本地移除
      const newFiles = uploadedFiles.filter(file => file.id !== fileId);
      setUploadedFiles(newFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(newFiles));
      // 如果删除后当前页没有文件了，回到上一页
      const totalPages = Math.ceil(newFiles.length / filesPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 预览文件
  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewFile(null);
  };

  // 页面加载时读取所有云端照片和视频
  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      try {
        const allFiles = JSON.parse(saved);
        const imageFiles = allFiles.filter(file => file.type === 'image');
        setUploadedFiles(imageFiles);
      } catch (e) {
        setUploadedFiles([]);
      }
    }
    // 监听filesUpdated事件，自动刷新
    const handleFilesUpdated = () => {
      const updated = localStorage.getItem('uploadedFiles');
      if (updated) {
        try {
          const allFiles = JSON.parse(updated);
          const imageFiles = allFiles.filter(file => file.type === 'image');
          setUploadedFiles(imageFiles);
        } catch (e) {
          setUploadedFiles([]);
        }
      }
    };
    window.addEventListener('filesUpdated', handleFilesUpdated);
    return () => window.removeEventListener('filesUpdated', handleFilesUpdated);
  }, []);

  // 分页逻辑
  const totalPages = Math.ceil(uploadedFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = uploadedFiles.slice(startIndex, endIndex);

  // 分页导航
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

  const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
    ['/images/qz1.png', '/images/qz2.png', '/images/qz3.png', '/images/qz4.png', '/images/qz5.png', '/images/qz6.png'].map(src => ({ preview: src, type: 'image' }));

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
          {isMobile ? '点击或粘贴图片到此处开始上传' : '点击、粘贴或拖放图片到此处开始上传'}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          capture={isMobile ? 'environment' : undefined} // 移动端默认后置摄像头
        />
      </div>

      {/* 所有照片展示区域 */}
      <div className="photos-container">
        <div className="all-photos-section">
          <div className="section-header">
            <h3 className="section-title">所有照片 ({uploadedFiles.length})</h3>
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
                      <img src={file.preview} alt={file.name} className="media-preview" />
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
              <div className="empty-icon">📷</div>
              <p className="empty-text">还没有上传任何照片</p>
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
            <img src={previewFile.preview} alt={previewFile.name} className="preview-media" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPhotoPage; 