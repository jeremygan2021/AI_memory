import React, { useState, useEffect, useMemo } from 'react';
import './LifetimeTimeline.css';

const LifetimeTimeline = ({ userCode, photos = [], videos = [], conversations = [] }) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // 将所有数据项按时间排序并分组
  const timelineData = useMemo(() => {
    const allItems = [
      ...photos.map(item => ({ ...item, type: 'photo', icon: '📸' })),
      ...videos.map(item => ({ ...item, type: 'video', icon: '🎬' })),
      ...conversations.map(item => ({ ...item, type: 'conversation', icon: '💬' }))
    ];

    // 按创建时间排序
    allItems.sort((a, b) => {
      const timeA = new Date(a.createTime || a.timestamp || Date.now());
      const timeB = new Date(b.createTime || b.timestamp || Date.now());
      return timeA - timeB;
    });

    // 生成时间轴数据点
    const points = [];
    const timeSpan = 365 * 24 * 60 * 60 * 1000; // 一年的毫秒数
    const currentTime = Date.now();
    const startTime = currentTime - timeSpan;

    // 如果没有实际数据，生成一些示例数据点
    if (allItems.length === 0) {
      const sampleData = [
        { time: startTime + timeSpan * 0.1, value: 20, label: '开始记录', items: [] },
        { time: startTime + timeSpan * 0.25, value: 35, label: '第一次上传', items: [] },
        { time: startTime + timeSpan * 0.4, value: 60, label: '活跃期', items: [] },
        { time: startTime + timeSpan * 0.55, value: 45, label: '回忆整理', items: [] },
        { time: startTime + timeSpan * 0.7, value: 75, label: '高峰期', items: [] },
        { time: startTime + timeSpan * 0.85, value: 80, label: '近期活动', items: [] },
        { time: currentTime, value: 90, label: '现在', items: [] }
      ];
      return sampleData;
    }

    // 基于实际数据生成时间轴点
    const monthlyGroups = new Map();
    
    allItems.forEach(item => {
      const time = new Date(item.createTime || item.timestamp || Date.now());
      const monthKey = `${time.getFullYear()}-${time.getMonth()}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          time: time.getTime(),
          items: [],
          value: 0
        });
      }
      
      monthlyGroups.get(monthKey).items.push(item);
    });

    // 转换为数组并计算活跃度值
    Array.from(monthlyGroups.values()).forEach((group, index) => {
      const activityScore = Math.min(group.items.length * 10 + Math.random() * 20, 100);
      const date = new Date(group.time);
      
      points.push({
        time: group.time,
        value: activityScore,
        label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        items: group.items
      });
    });

    // 确保至少有7个点用于显示
    while (points.length < 7) {
      const lastPoint = points[points.length - 1];
      const newTime = lastPoint ? lastPoint.time + (30 * 24 * 60 * 60 * 1000) : currentTime;
      points.push({
        time: newTime,
        value: Math.random() * 60 + 20,
        label: new Date(newTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        items: []
      });
    }

    return points.slice(-10); // 只显示最近10个点
  }, [photos, videos, conversations]);

  // 生成SVG路径
  const generatePath = () => {
    if (timelineData.length < 2) return '';
    
    const width = 280;
    const height = 80;
    const padding = 20;
    
    const points = timelineData.map((point, index) => {
      const x = padding + (index / (timelineData.length - 1)) * (width - 2 * padding);
      const y = height - padding - (point.value / 100) * (height - 2 * padding);
      return { x, y, data: point };
    });

    const pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      } else {
        const prevPoint = points[index - 1];
        const cpx1 = prevPoint.x + (point.x - prevPoint.x) * 0.5;
        const cpx2 = point.x - (point.x - prevPoint.x) * 0.5;
        return `${path} C ${cpx1} ${prevPoint.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
      }
    }, '');

    return { pathData, points };
  };

  const { pathData, points } = generatePath();

  // 触发动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePointClick = (pointData) => {
    setSelectedPoint(selectedPoint?.time === pointData.time ? null : pointData);
  };

  const getActivityLevel = (value) => {
    if (value >= 80) return { level: 'high', color: '#00bcd4', label: '高活跃' };
    if (value >= 50) return { level: 'medium', color: '#3b82f6', label: '中活跃' };
    return { level: 'low', color: '#8b5cf6', label: '低活跃' };
  };

  return (
    <div className="lifetime-timeline-container">
      <div className="timeline-header">
        <h3>LIFETIME TIMELINE</h3>
        <div className="timeline-stats">
          <span className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{timelineData.reduce((sum, point) => sum + point.items.length, 0)}</span>
            <span className="stat-label">活动</span>
          </span>
          <span className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{Math.round(timelineData.reduce((sum, point) => sum + point.value, 0) / timelineData.length)}</span>
            <span className="stat-label">平均</span>
          </span>
        </div>
      </div>

      <div className="timeline-chart-container">
        <svg viewBox="0 0 280 80" className="timeline-svg">
          <defs>
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00bcd4" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="timelineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          
          {/* 背景网格 */}
          <g className="grid-lines" opacity="0.1">
            {[20, 40, 60].map(y => (
              <line key={y} x1="20" y1={y} x2="260" y2={y} stroke="currentColor" strokeWidth="1" />
            ))}
          </g>
          
          {/* 主要路径 */}
          <path
            d={pathData}
            stroke="url(#timelineGradient)"
            strokeWidth="2"
            fill="none"
            className="timeline-path"
            strokeDasharray="300"
            strokeDashoffset="300"
            style={{
              animation: `drawTimeline 2s ease-out ${animationTrigger * 0.1}s forwards`
            }}
          />
          
          {/* 发光效果 */}
          <path
            d={pathData}
            stroke="url(#timelineGlow)"
            strokeWidth="4"
            fill="none"
            className="timeline-glow"
            opacity="0.6"
            strokeDasharray="300"
            strokeDashoffset="300"
            style={{
              animation: `drawTimeline 2s ease-out ${animationTrigger * 0.1 + 0.5}s forwards`
            }}
          />
          
          {/* 数据点 */}
          {points.map((point, index) => {
            const activity = getActivityLevel(point.data.value);
            const isSelected = selectedPoint?.time === point.data.time;
            
            return (
              <g key={index} className="timeline-point-group">
                {/* 点击区域 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="transparent"
                  className="point-clickarea"
                  onClick={() => handlePointClick(point.data)}
                  style={{ cursor: 'pointer' }}
                />
                
                {/* 外层发光圈 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isSelected ? "6" : "4"}
                  fill={activity.color}
                  className="timeline-point-glow"
                  opacity="0.4"
                  style={{
                    animation: `pointPulse 2s ease-in-out infinite ${index * 0.2}s`
                  }}
                />
                
                {/* 主要数据点 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isSelected ? "4" : "3"}
                  fill={activity.color}
                  className="timeline-point"
                  style={{
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    filter: isSelected ? `drop-shadow(0 0 8px ${activity.color})` : 'none'
                  }}
                />
              </g>
            );
          })}
        </svg>
        
        {/* 时间轴标签 */}
        <div className="timeline-labels">
          {points.map((point, index) => (
            <div
              key={index}
              className="timeline-label"
              style={{
                left: `${(point.x / 280) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <span className="label-text">{point.data.label}</span>
              <span className="label-value">{Math.round(point.data.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 详细信息面板 */}
      {selectedPoint && (
        <div className="timeline-detail-panel">
          <div className="detail-header">
            <span className="detail-date">
              {new Date(selectedPoint.time).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="detail-activity">
              {getActivityLevel(selectedPoint.value).label}
            </span>
            <button 
              className="detail-close"
              onClick={() => setSelectedPoint(null)}
            >
              ×
            </button>
          </div>
          
          <div className="detail-content">
            <div className="detail-stats">
              <div className="detail-stat">
                <span className="stat-number">{selectedPoint.items.length}</span>
                <span className="stat-label">活动数量</span>
              </div>
              <div className="detail-stat">
                <span className="stat-number">{Math.round(selectedPoint.value)}</span>
                <span className="stat-label">活跃度</span>
              </div>
            </div>
            
            {selectedPoint.items.length > 0 && (
              <div className="detail-items">
                <h4>活动详情</h4>
                <div className="items-list">
                  {selectedPoint.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="item-card">
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name">
                        {item.name || item.title || `${item.type} ${index + 1}`}
                      </span>
                      <span className="item-time">
                        {new Date(item.createTime || item.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                  {selectedPoint.items.length > 3 && (
                    <div className="items-more">
                      还有 {selectedPoint.items.length - 3} 个活动...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LifetimeTimeline;
