import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemoryTimeline.css';
import { getCustomName, deriveDisplayNameFromFileName, syncAllCustomNamesFromCloud } from '../../utils/displayName';

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
  const [syncing, setSyncing] = useState(false); // 是否正在同步
  
  // 新增状态：用于手动输入大事件
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [majorEvents, setMajorEvents] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState('⭐'); // 选中的图标
  const [selectedColor, setSelectedColor] = useState('#FF6B6B'); // 选中的颜色
  
  // 定义可选的图标
const eventIcons = [
  { value: '🍼', label: '出生' }, // 人生起点
  { value: '🧸', label: '童年' }, // 无忧无虑的童年时光
  { value: '🎒', label: '入学' }, // 第一次走进校园
  { value: '🌱', label: '青春期' }, // 懵懂又热烈的少年时代
  { value: '💘', label: '初恋' }, // 第一次心动
  { value: '🎓', label: '毕业' }, // 重要学业节点（小学/中学/大学）
  { value: '💼', label: '入职' }, // 第一份工作
  { value: '💍', label: '结婚' }, // 与伴侣组建家庭
  { value: '👼', label: '生子' }, // 成为父母
  { value: '🏆', label: '成就' }, // 事业/人生重要突破
  { value: '👴', label: '亲情' }, // 与父母/长辈的难忘时刻
  { value: '🔄', label: '转折' }, // 人生重大选择（换城市/换行等）
  { value: '🎂', label: '生日' }, // 特别的生日（如18岁/60岁）
  { value: '🌴', label: '退休' }, // 告别职场
  { value: '📅', label: '纪念' }, // 重要纪念日（结婚周年等）
  { value: '✈️', label: '远行' }, // 改变心境的旅行
  { value: '🤝', label: '重逢' }, // 与老友/故人再遇
  { value: '💪', label: '康复' }, // 战胜疾病或困境
  { value: '🌟', label: '高光' }, // 人生闪亮瞬间
  { value: '🌅', label: '暮年' }, // 回望一生的平静时刻
];
  
  // 定义可选的颜色
  const eventColors = [
    { value: '#FF6B6B', label: '热情红' },
    { value: '#4ECDC4', label: '清新青' },
    { value: '#45B7D1', label: '天空蓝' },
    { value: '#96CEB4', label: '自然绿' },
    { value: '#FECA57', label: '阳光黄' },
    { value: '#DDA0DD', label: '梦幻紫' },
    { value: '#FF9FF3', label: '甜美粉' },
    { value: '#54A0FF', label: '深海蓝' }
  ];

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  useEffect(() => {
    if (userCode) {
      // 先从云端同步自定义名称
      syncAllCustomNamesFromCloud(userCode)
        .then(result => {
          console.log('自定义名称云端同步结果:', result);
          // 同步完成后加载时间线数据
          loadTimelineData();
          // 加载本地存储的大事件
          loadMajorEvents();
        })
        .catch(error => {
          console.error('自定义名称云端同步失败:', error);
          // 同步失败仍然加载时间线数据，使用本地存储的自定义名称
          loadTimelineData();
          // 加载本地存储的大事件
          loadMajorEvents();
        });
    }
  }, [userCode]);

  // 监听自定义名称更新事件
  useEffect(() => {
    const handleCustomNamesUpdated = () => {
      // 当自定义名称更新时，重新加载时间线数据
      if (userCode) {
        loadTimelineData();
      }
    };

    // 添加事件监听器
    window.addEventListener('customNamesUpdated', handleCustomNamesUpdated);

    // 清理函数，组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('customNamesUpdated', handleCustomNamesUpdated);
    };
  }, [userCode]);

  // 监听主题变化事件
  useEffect(() => {
    const handleThemeChange = (event) => {
      console.log('MemoryTimeline: 收到主题变化事件');
      // 主题变化时强制重新渲染组件
      // 由于样式使用CSS变量，会自动应用新主题
    };

    // 添加主题变化事件监听器
    window.addEventListener('themeChanged', handleThemeChange);

    // 清理函数，组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // 加载时间线数据
  const loadTimelineData = async () => {
    if (!userCode) return;
    
    setLoading(true);
    try {
      // 不再加载云端文件，只加载本地存储的大事件
      setAllItems([]);
      setTimelineItems([]);
      loadMajorEvents();
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

  // 加载本地存储的大事件
  const loadMajorEvents = () => {
    try {
      const storedEvents = localStorage.getItem(`majorEvents_${userCode}`);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        setMajorEvents(events);
        // 将大事件合并到时间线中
        mergeEventsWithTimeline(events);
      }
    } catch (error) {
      console.error('加载大事件失败:', error);
    }
  };
  
  // 保存大事件到本地存储
  const saveMajorEvents = (events) => {
    try {
      localStorage.setItem(`majorEvents_${userCode}`, JSON.stringify(events));
      setMajorEvents(events);
      // 将大事件合并到时间线中
      mergeEventsWithTimeline(events);
    } catch (error) {
      console.error('保存大事件失败:', error);
    }
  };
  
  // 将大事件合并到时间线中
  const mergeEventsWithTimeline = (events) => {
    // 将大事件转换为时间线项目格式
    const eventItems = events.map(event => ({
      id: event.id,
      type: 'major-event',
      icon: event.icon || '⭐',
      color: event.color || '#FF6B6B',
      title: event.title,
      uploadTime: new Date(event.date).toISOString(),
      timestamp: new Date(event.date).getTime(),
      sessionId: 'major-event',
      pageUrl: null,
      previewUrl: null,
      description: event.description,
      isMajorEvent: true
    }));
    
    // 只显示大事件，不显示上传的文件记录
    setAllItems(eventItems);
    setTimelineItems(eventItems.slice(0, itemsPerPage));
  };
  
  // 添加新的大事件
  const handleAddEvent = () => {
    if (!eventTitle.trim() || !eventDate) {
      alert('请填写事件标题和日期');
      return;
    }
    
    const newEvent = {
      id: `event_${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      description: eventDescription.trim(),
      icon: selectedIcon,
      color: selectedColor
    };
    
    const updatedEvents = [...majorEvents, newEvent];
    saveMajorEvents(updatedEvents);
    
    // 重置表单
    setEventTitle('');
    setEventDate('');
    setEventDescription('');
    setSelectedIcon('⭐');
    setSelectedColor('#FF6B6B');
    setShowEventForm(false);
  };
  
  // 删除大事件
  const handleDeleteEvent = (eventId) => {
    if (window.confirm('确定要删除这个重要事件吗？')) {
      const updatedEvents = majorEvents.filter(event => event.id !== eventId);
      saveMajorEvents(updatedEvents);
    }
  };
  const handleSyncCustomNames = async () => {
    if (!userCode || syncing) return;
    
    try {
      setSyncing(true);
      console.log('开始手动同步自定义名称...');
      
      const result = await syncAllCustomNamesFromCloud(userCode);
      console.log('手动同步自定义名称结果:', result);
      
      // 同步完成后重新加载时间线数据
      await loadTimelineData();
      
      // 显示同步结果提示
      if (result.success) {
        alert(`同步成功！从 ${result.sessionsCount || 0} 个会话同步了 ${result.totalMappings || 0} 个自定义名称`);
      } else {
        alert(`同步失败：${result.error || result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('手动同步自定义名称失败:', error);
      alert(`同步失败：${error.message}`);
    } finally {
      setSyncing(false);
    }
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
        <div className="add-event-section">
          <button 
            className="add-event-btn"
            onClick={() => setShowEventForm(!showEventForm)}
          >
            ⭐ {showEventForm ? '取消' : '添加'}重要事件
          </button>
        </div>
        
        {showEventForm && (
          <div className="event-form">
            <div className="form-group">
              <label>事件标题</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="输入重要事件的标题"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>事件日期</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>事件描述（可选）</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="描述这个重要事件"
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>选择图标</label>
              <div className="icon-selector">
                {eventIcons.map((icon) => (
                  <button
                    key={icon.value}
                    className={`icon-option ${selectedIcon === icon.value ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(icon.value)}
                    title={icon.label}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>选择颜色</label>
              <div className="color-selector">
                {eventColors.map((color) => (
                  <button
                    key={color.value}
                    className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button onClick={handleAddEvent} className="submit-btn">
                保存事件
              </button>
              <button onClick={() => {
                setShowEventForm(false);
                setEventTitle('');
                setEventDate('');
                setEventDescription('');
                setSelectedIcon('⭐');
                setSelectedColor('#FF6B6B');
              }} className="cancel-btn">
                取消
              </button>
            </div>
          </div>
        )}
        
        <div className="timeline-empty">
          <div className="empty-icon">📝</div>
          <div className="empty-text">还没有添加任何重要事件</div>
          <div className="empty-desc">点击上方按钮添加宝宝成长中的重要时刻</div>
        </div>
      </div>
    );
  }

  const totalPages = getTotalPages();

  return (
    <div className="memory-timeline">
      {/* 添加大事件按钮 */}
      <div className="add-event-section">
        <button 
          className="add-event-btn"
          onClick={() => setShowEventForm(!showEventForm)}
        >
          ⭐ {showEventForm ? '取消' : '添加'}重要事件
        </button>
      </div>
      
      {/* 大事件输入表单 */}
      {showEventForm && (
        <div className="event-form">
          <div className="form-group">
            <label>事件标题</label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="输入重要事件的标题"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>事件日期</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>事件描述（可选）</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="描述这个重要事件"
              className="form-textarea"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>选择图标</label>
            <div className="icon-selector">
              {eventIcons.map((icon) => (
                <button
                  key={icon.value}
                  className={`icon-option ${selectedIcon === icon.value ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon.value)}
                  title={icon.label}
                >
                  {icon.value}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>选择颜色</label>
            <div className="color-selector">
              {eventColors.map((color) => (
                <button
                  key={color.value}
                  className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAddEvent} className="submit-btn">
              保存事件
            </button>
            <button onClick={() => {
              setShowEventForm(false);
              setEventTitle('');
              setEventDate('');
              setEventDescription('');
              setSelectedIcon('⭐');
              setSelectedColor('#FF6B6B');
            }} className="cancel-btn">
              取消
            </button>
          </div>
        </div>
      )}
      
      {/* 日期筛选器 */}
      <div className="timeline-filters">
        <div className="filter-buttons">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            📅 {showDateFilter ? '隐藏' : '显示'}日期筛选
          </button>
        </div>
        
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
        <span>共找到 {allItems.length} 条重要事件</span>
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
            onClick={() => !item.isMajorEvent && handleItemClick(item)}
          >
            <div className="timeline-dot">
              <div className="timeline-dot-inner"></div>
            </div>
            
            <div className="timeline-content">
              <div className="timeline-icon" style={{ color: item.isMajorEvent && item.color ? item.color : undefined }}>
                {item.icon}
              </div>
              <div className="timeline-info">
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-time">{formatTimeDisplay(item.uploadTime)}</div>
                {item.isMajorEvent && item.description && (
                  <div className="timeline-description">{item.description}</div>
                )}
                {!item.isMajorEvent && (
                  <div className="timeline-session">会话: {item.sessionId}</div>
                )}
              </div>
              
              {item.isMajorEvent && (
                <button 
                  className="delete-event-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(item.id);
                  }}
                >
                  删除
                </button>
              )}
              
              {!item.isMajorEvent && item.type !== 'audio' && item.previewUrl && (
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