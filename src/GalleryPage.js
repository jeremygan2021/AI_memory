import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './common.css';
import './GalleryPage.css';

const GalleryPage = () => {
  const navigate = useNavigate();
  const { userid } = useParams();
  const [activeTab, setActiveTab] = useState('photos');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // 验证用户ID
  useEffect(() => {
    if (!userid || userid.length !== 4 || !/^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
      navigate('/');
    }
  }, [userid, navigate]);

  // 加载上传的文件
  useEffect(() => {
    const loadUploadedFiles = () => {
      try {
        const saved = localStorage.getItem('uploadedFiles');
        if (saved) {
          const files = JSON.parse(saved);
          // 按上传时间排序，最新的在前面
          const sortedFiles = files
            .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
          
          // 分离照片和视频
          const photos = sortedFiles.filter(file => file.type === 'image');
          const videos = sortedFiles.filter(file => file.type === 'video');
          setUploadedPhotos(photos);
          setUploadedVideos(videos);
        }
      } catch (error) {
        console.error('加载上传文件失败:', error);
      }
    };

    loadUploadedFiles();
    
    // 监听localStorage变化
    const handleStorageChange = (e) => {
      if (e.key === 'uploadedFiles') {
        loadUploadedFiles();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 也监听自定义事件，用于同页面更新
    const handleFilesUpdate = () => {
      loadUploadedFiles();
    };
    
    window.addEventListener('filesUpdated', handleFilesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('filesUpdated', handleFilesUpdate);
    };
  }, []);

  // 处理上传照片和视频
  const handleUpload = (type) => {
    if (userid) {
      if (type === 'photo') {
        navigate(`/${userid}/upload-photos`);
      } else if (type === 'video') {
        navigate(`/${userid}/upload-videos`);
      }
    }
  };

  // 打开照片预览
  const openPhotoPreview = (photo) => {
    setPreviewPhoto(photo);
  };

  // 关闭照片预览
  const closePhotoPreview = () => {
    setPreviewPhoto(null);
  };

  // 打开视频播放器
  const openVideoPlayer = (idx) => {
    if (userid && uploadedVideos[idx]) {
      const videoFile = uploadedVideos[idx];
      navigate(`/${userid}/video-player/${videoFile.id || idx}`);
    }
  };

  // 返回首页
  const goBack = () => {
    navigate(`/${userid}`);
  };

  const currentData = activeTab === 'photos' ? uploadedPhotos : uploadedVideos;

  return (
    <div className="gallery-page">
      {/* 顶部导航 */}
      <div className="gallery-header">
        <button className="back-btn" onClick={goBack}>
          ← 返回首页
        </button>
        <h1 className="gallery-title">相册</h1>
        <div className="gallery-actions">
          <button 
            className="upload-btn photos-btn" 
            onClick={() => handleUpload('photo')}
          >
            上传照片
          </button>
          <button 
            className="upload-btn videos-btn" 
            onClick={() => handleUpload('video')}
          >
            上传视频
          </button>
        </div>
      </div>

      {/* 切换标签 */}
      <div className="gallery-tabs">
        <button 
          className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          照片 ({uploadedPhotos.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          视频 ({uploadedVideos.length})
        </button>
      </div>

      {/* 内容区域 */}
      <div className="gallery-content">
        {currentData.length === 0 ? (
          <div className="empty-gallery">
            <div className="empty-icon">
              {activeTab === 'photos' ? '📷' : '🎬'}
            </div>
            <div className="empty-text">
              还没有{activeTab === 'photos' ? '照片' : '视频'}
            </div>
            <div className="empty-desc">
              点击上方按钮开始上传{activeTab === 'photos' ? '照片' : '视频'}
            </div>
          </div>
        ) : (
          <div className="gallery-grid">
            {currentData.map((file, idx) => (
              <div
                key={file.id || idx}
                className="gallery-item"
                onClick={() => {
                  if (activeTab === 'photos') {
                    openPhotoPreview(file);
                  } else {
                    openVideoPlayer(idx);
                  }
                }}
              >
                {activeTab === 'photos' ? (
                  <img
                    src={file.preview}
                    className="gallery-img"
                    alt={file.name || `照片${idx + 1}`}
                  />
                ) : (
                  <div className="video-preview-container">
                    <video
                      src={file.preview}
                      className="gallery-video"
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        e.target.currentTime = 1;
                      }}
                    />
                    <div className="video-overlay">
                      <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/asset/play_button.png" className="play-icon" alt="播放" />
                    </div>
                  </div>
                )}
                <div className="item-info">
                  <div className="item-name">{file.name}</div>
                  <div className="item-time">
                    {new Date(file.uploadTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 照片预览弹窗 */}
      {previewPhoto && (
        <div className="gallery-preview-mask" onClick={closePhotoPreview}>
          <div className="gallery-preview-box" onClick={e => e.stopPropagation()}>
            <img className="gallery-preview-img" src={previewPhoto.preview} alt="照片预览" />
            <button className="gallery-preview-close" onClick={closePhotoPreview}>×</button>
            <div className="preview-info">
              <div className="preview-name">{previewPhoto.name}</div>
              <div className="preview-date">
                {new Date(previewPhoto.uploadTime).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage; 