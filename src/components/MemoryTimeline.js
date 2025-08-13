import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemoryTimeline.css';
import { getCustomName, deriveDisplayNameFromFileName } from '../utils/displayName';

const MemoryTimeline = ({ userCode }) => {
  const navigate = useNavigate();
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]); // 存储所有项目
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 每页显示20个项目
  const [startDate, setStartDate] = useState(''); // 开始日期
  const [endDate, setEndDate] = useState(''); // 结束日期
  const [showDateFilter, setShowDateFilter] = useState(false); // 是否显示日期筛选器

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
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
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
          // 跳转到图片大图预览页面，携带对象键以直达原图
          pageUrl = `/${userCode}/image-viewer/${sessionId}/${encodeURIComponent(nameWithoutExt)}?ok=${encodeURIComponent(objectKey)}`;
        } else if (isVideo) {
          type = 'video';
          icon = '🎬';
          // 生成视频ID用于跳转
          const videoId = `vid_${sessionId}_${timestamp}_${uniqueId}`;
          pageUrl = `/${userCode}/video-player/${sessionId}/${videoId}`;
        }

        const displayName = getCustomName(objectKey) || deriveDisplayNameFromFileName(fileName);

        return {
          id: `${type}_${sessionId}_${timestamp}_${uniqueId}`,
          type,
          icon,
          title: displayName,
          sessionId,
          uploadTime,
          timestamp,
          previewUrl,
          pageUrl,
          fileName,
          objectKey
        };
      }).filter(Boolean);

      // 按时间倒序排序
      const sortedItems = processedItems
        .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      setAllItems(sortedItems);
      setTimelineItems(sortedItems.slice(0, itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error('加载时间线数据失败:', error);
      setTimelineItems([]);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 应用日期筛选
  const applyDateFilter = () => {
    let filtered = [...allItems];
    
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      filtered = filtered.filter(item => new Date(item.uploadTime) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(item => new Date(item.uploadTime) <= end);
    }
    
    setTimelineItems(filtered.slice(0, itemsPerPage));
    setCurrentPage(1);
    setShowDateFilter(false); // 应用筛选后隐藏日期筛选面板
  };

  // 清除日期筛选
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimelineItems(allItems.slice(0, itemsPerPage));
    setCurrentPage(1);
  };

  // 分页处理
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    let filtered = [...allItems];
    
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      filtered = filtered.filter(item => new Date(item.uploadTime) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(item => new Date(item.uploadTime) <= end);
    }
    
    setTimelineItems(filtered.slice(startIndex, endIndex));
  };

  // 获取总页数
  const getTotalPages = () => {
    let filtered = [...allItems];
    
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      filtered = filtered.filter(item => new Date(item.uploadTime) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(item => new Date(item.uploadTime) <= end);
    }
    
    return Math.ceil(filtered.length / itemsPerPage);
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
    // 在云端时间基础上加8小时（东八区）
    const adjustedDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const now = new Date();
    const diffInHours = (now - adjustedDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return adjustedDate.toLocaleDateString('zh-CN');
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

  if (allItems.length === 0) {
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

  const totalPages = getTotalPages();

  return (
    <div className="memory-timeline">
      {/* 日期筛选器 */}
      <div className="timeline-filters">
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowDateFilter(!showDateFilter)}
        >
          📅 {showDateFilter ? '隐藏' : '显示'}日期筛选
        </button>
        
        {showDateFilter && (
          <div className="date-filter-panel">
            <div className="date-inputs">
              <div className="date-input-group">
                <label>开始日期:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>
              <div className="date-input-group">
                <label>结束日期:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
            <div className="filter-actions">
              <button onClick={applyDateFilter} className="apply-filter-btn">
                应用筛选
              </button>
              <button onClick={clearDateFilter} className="clear-filter-btn">
                清除筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="timeline-stats">
        <span>共找到 {allItems.length} 条回忆记录</span>
        {(startDate || endDate) && (
          <span className="filter-info">
            (已筛选: {startDate || '不限'} 至 {endDate || '不限'})
          </span>
        )}
      </div>

      {/* 时间线列表 */}
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

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="timeline-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            上一页
          </button>
          
          <span className="pagination-info">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryTimeline; 