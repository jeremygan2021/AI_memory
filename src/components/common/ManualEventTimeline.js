import React, { useState, useEffect } from 'react';
import './ManualEventTimeline.css';

const ManualEventTimeline = ({ userCode }) => {
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    category: 'milestone' // 默认类别为里程碑
  });

  // 类别选项
  const categories = [
    { value: 'milestone', label: '里程碑', icon: '🏆', color: '#ff6b6b' },
    { value: 'growth', label: '成长', icon: '🌱', color: '#4ecdc4' },
    { value: 'education', label: '教育', icon: '📚', color: '#45b7d1' },
    { value: 'health', label: '健康', icon: '💪', color: '#96ceb4' },
    { value: 'social', label: '社交', icon: '👥', color: '#feca57' },
    { value: 'travel', label: '旅行', icon: '✈️', color: '#ff9ff3' },
    { value: 'family', label: '家庭', icon: '👨‍👩‍👧‍👦', color: '#54a0ff' },
    { value: 'hobby', label: '爱好', icon: '🎨', color: '#5f27cd' },
    { value: 'other', label: '其他', icon: '📌', color: '#999999' }
  ];

  // 从本地存储加载事件数据
  useEffect(() => {
    if (userCode) {
      loadEvents();
    }
  }, [userCode]);

  // 加载事件数据
  const loadEvents = () => {
    try {
      const storageKey = `manual_events_${userCode}`;
      const savedEvents = localStorage.getItem(storageKey);
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        // 按日期倒序排序
        parsedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error('加载事件数据失败:', error);
    }
  };

  // 保存事件数据到本地存储
  const saveEvents = (updatedEvents) => {
    try {
      const storageKey = `manual_events_${userCode}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('保存事件数据失败:', error);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 添加或更新事件
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      alert('请填写标题和日期');
      return;
    }

    if (editingEvent) {
      // 更新现有事件
      const updatedEvents = events.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...formData }
          : event
      );
      updatedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      setEditingEvent(null);
    } else {
      // 添加新事件
      const newEvent = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      const updatedEvents = [newEvent, ...events];
      updatedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
    }

    // 重置表单
    setFormData({
      title: '',
      date: '',
      description: '',
      category: 'milestone'
    });
    setShowAddForm(false);
  };

  // 编辑事件
  const handleEdit = (event) => {
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description,
      category: event.category
    });
    setEditingEvent(event);
    setShowAddForm(true);
  };

  // 删除事件
  const handleDelete = (eventId) => {
    if (window.confirm('确定要删除这个事件吗？')) {
      const updatedEvents = events.filter(event => event.id !== eventId);
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
    }
  };

  // 取消表单
  const handleCancel = () => {
    setFormData({
      title: '',
      date: '',
      description: '',
      category: 'milestone'
    });
    setShowAddForm(false);
    setEditingEvent(null);
  };

  // 获取类别信息
  const getCategoryInfo = (categoryValue) => {
    return categories.find(cat => cat.value === categoryValue) || categories[categories.length - 1];
  };

  // 格式化日期显示
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算年龄（如果需要）
  const calculateAge = (birthDate, eventDate) => {
    if (!birthDate) return '';
    
    const birth = new Date(birthDate);
    const event = new Date(eventDate);
    
    let years = event.getFullYear() - birth.getFullYear();
    let months = event.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years}岁${months > 0 ? months + '个月' : ''}`;
    } else if (months > 0) {
      return `${months}个月`;
    } else {
      return '新生儿';
    }
  };

  return (
    <div className="manual-event-timeline">
      <div className="timeline-header">
        <h3>主人公大事件时间线</h3>
        <button 
          className="add-event-btn"
          onClick={() => setShowAddForm(true)}
        >
          + 添加事件
        </button>
      </div>

      {/* 添加/编辑事件表单 */}
      {showAddForm && (
        <div className="event-form-overlay">
          <div className="event-form">
            <h3>{editingEvent ? '编辑事件' : '添加新事件'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">事件标题 *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="例如：第一次说话"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date">事件日期 *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">事件类别</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">事件描述</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="详细描述这个事件..."
                  rows={4}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingEvent ? '更新' : '添加'}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 事件列表 */}
      {events.length === 0 ? (
        <div className="empty-timeline">
          <div className="empty-icon">📝</div>
          <div className="empty-text">还没有记录任何事件</div>
          <div className="empty-desc">点击"添加事件"开始记录主人公的重要时刻</div>
        </div>
      ) : (
        <div className="events-container">
          {events.map((event, index) => {
            const categoryInfo = getCategoryInfo(event.category);
            return (
              <div key={event.id} className="event-item">
                <div className="event-dot" style={{ backgroundColor: categoryInfo.color }}>
                  <span className="event-icon">{categoryInfo.icon}</span>
                </div>
                
                <div className="event-content">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(event)}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(event.id)}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="event-meta">
                    <span className="event-date">{formatDateDisplay(event.date)}</span>
                    <span className="event-category" style={{ color: categoryInfo.color }}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                  </div>
                  
                  {event.description && (
                    <div className="event-description">
                      {event.description}
                    </div>
                  )}
                </div>
                
                {index < events.length - 1 && <div className="event-line"></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManualEventTimeline;