import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemoryTimeline.css';

const MemoryTimeline = ({ userCode }) => {
  const navigate = useNavigate();
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  useEffect(() => {
    if (userCode) {
      loadTimelineData();
    }
  }, [userCode]);

  // 加载时间线数据
  const loadTimelineData = async () => {
    try {
      setLoading(true);
      if (!userCode) return;

      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=100`
      );
      
      if (!response.ok) throw new Error('获取文件失败');
      
      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];

      // 处理文件数据，分类并生成时间线项目
      const processedItems = files.map(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        const uploadTime = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
        
        // 解析会话ID
        const pathParts = objectKey ? objectKey.split('/') : [];
        const sessionId = pathParts.length >= 3 ? pathParts[2] : 'unknown';

        // 判断文件类型
        const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
        const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
        const isAudio = contentType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma|amr|3gp|opus|webm)$/i.test(fileName);

        if (!isImage && !isVideo && !isAudio) return null;

        // 生成OSS URL
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const previewUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';

        // 生成唯一ID
        const timestamp = Date.parse(uploadTime);
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const uniqueId = nameWithoutExt.slice(-8) || Math.random().toString(36).substr(2, 8);
        
        let type, icon, pageUrl;
        if (isAudio) {
          type = 'audio';
          icon = '🎵';
          // 提取录音ID用于跳转
          const parts = nameWithoutExt.split('_');
          const recordingId = parts[parts.length - 1] || 'default';
          pageUrl = `/${userCode}/${sessionId}/play/${recordingId}`;
        } else if (isImage) {
          type = 'image';
          icon = '📷';
          pageUrl = `/${userCode}/gallery`;
        } else if (isVideo) {
          type = 'video';
          icon = '🎬';
          // 生成视频ID用于跳转
          const videoId = `vid_${sessionId}_${timestamp}_${uniqueId}`;
          pageUrl = `/${userCode}/video-player/${sessionId}/${videoId}`;
        }

        return {
          id: `${type}_${sessionId}_${timestamp}_${uniqueId}`,
          type,
          icon,
          title: getFileDisplayName(fileName, type),
          sessionId,
          uploadTime,
          timestamp,
          previewUrl,
          pageUrl,
          fileName
        };
      }).filter(Boolean);

      // 按时间倒序排序，取最近的10项
      const sortedItems = processedItems
        .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
        .slice(0, 10);

      setTimelineItems(sortedItems);
    } catch (error) {
      console.error('加载时间线数据失败:', error);
      setTimelineItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 生成友好的文件显示名称
  const getFileDisplayName = (fileName, type) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    switch (type) {
      case 'audio':
        return '录音回忆';
      case 'image':
        return '照片回忆';
      case 'video':
        return '视频回忆';
      default:
        return nameWithoutExt;
    }
  };

  // 格式化时间显示
  const formatTimeDisplay = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 处理点击事件
  const handleItemClick = (item) => {
    if (item.pageUrl) {
      navigate(item.pageUrl);
    }
  };

  if (loading) {
    return (
      <div className="memory-timeline">
        <div className="timeline-loading">
          <div className="loading-spinner"></div>
          <span>加载回忆中...</span>
        </div>
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="memory-timeline">
        <div className="timeline-empty">
          <div className="empty-icon">📝</div>
          <div className="empty-text">还没有回忆记录</div>
          <div className="empty-desc">开始录音或上传照片吧</div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-timeline">
      <div className="timeline-list">
        {timelineItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`timeline-item ${item.type}`}
            onClick={() => handleItemClick(item)}
          >
            <div className="timeline-dot">
              <div className="timeline-dot-inner"></div>
            </div>
            
            <div className="timeline-content">
              <div className="timeline-icon">{item.icon}</div>
              <div className="timeline-info">
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-time">{formatTimeDisplay(item.uploadTime)}</div>
                <div className="timeline-session">会话: {item.sessionId}</div>
              </div>
              
              {item.type !== 'audio' && item.previewUrl && (
                <div className="timeline-preview">
                  {item.type === 'image' ? (
                    <img 
                      src={item.previewUrl} 
                      alt="预览" 
                      className="preview-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <video 
                      src={item.previewUrl} 
                      className="preview-video"
                      muted
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            
            {index < timelineItems.length - 1 && <div className="timeline-line"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryTimeline; 