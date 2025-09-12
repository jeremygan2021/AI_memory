import React, { useState, useEffect, useMemo } from 'react';
import './BusinessMemoryTree.css';

const BusinessMemoryTree = ({ userCode, photos = [], videos = [], conversations = [] }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const allItems = [...photos, ...videos, ...conversations];

  // 按日期组织数据，创建树状结构
  const timelineData = useMemo(() => {
    const dataMap = new Map();
    
    // 处理照片
    photos.forEach(photo => {
      const date = new Date(photo.createTime || photo.timestamp || Date.now());
      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: key,
          displayDate: date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          items: []
        });
      }
      
      dataMap.get(key).items.push({
        ...photo,
        type: 'photo',
        icon: '📸'
      });
    });

    // 处理视频
    videos.forEach(video => {
      const date = new Date(video.createTime || video.timestamp || Date.now());
      const key = date.toISOString().split('T')[0];
      
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: key,
          displayDate: date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          items: []
        });
      }
      
      dataMap.get(key).items.push({
        ...video,
        type: 'video',
        icon: '🎬'
      });
    });

    // 处理对话
    conversations.forEach(conv => {
      const date = new Date(conv.createTime || conv.timestamp || Date.now());
      const key = date.toISOString().split('T')[0];
      
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: key,
          displayDate: date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          items: []
        });
      }
      
      dataMap.get(key).items.push({
        ...conv,
        type: 'conversation',
        icon: '💬'
      });
    });

    // 转换为数组并排序
    return Array.from(dataMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); // 只显示最近10天的数据
  }, [photos, videos, conversations]);

  // 触发动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 模拟数据加载
  const loadTimelineData = () => {
    // 这里可以添加实际的数据加载逻辑
    console.log('Loading timeline data for user:', userCode);
  };

  useEffect(() => {
    if (userCode) {
      loadTimelineData();
    }
  }, [userCode]);

  const handleNodeClick = (item) => {
    setSelectedNode(selectedNode?.id === item.id ? null : item);
  };

  const getNodePosition = (index, total) => {
    // 创建更自然的树状分布
    const angle = (index / total) * 2 * Math.PI;
    const radius = 80 + Math.sin(index * 0.7) * 30;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  if (timelineData.length === 0) {
    return (
      <div className="business-memory-tree-container">
        <div className="memory-tree-empty">
          <div className="empty-tree-icon">🌱</div>
          <h4>记忆树正在生长</h4>
          <p>当您开始创建回忆时，这里将展现一棵美丽的记忆之树</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-memory-tree-container">
      <div className="memory-tree-canvas">
        {/* 中心节点 */}
        <div className="tree-center-node">
          <div className="center-avatar">
            <span className="center-icon">🧠</span>
          </div>
          <div className="center-label">记忆中枢</div>
        </div>

        {/* 主要分支线 */}
        <svg className="tree-connections" viewBox="-200 -200 400 400">
          <defs>
            <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="subBranchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {timelineData.map((dayData, dayIndex) => {
            const dayPosition = getNodePosition(dayIndex, timelineData.length);
            return (
              <g key={dayData.date}>
                {/* 主分支线 */}
                <line
                  x1="0"
                  y1="0"
                  x2={dayPosition.x}
                  y2={dayPosition.y}
                  className="tree-main-branch"
                  style={{
                    animationDelay: `${dayIndex * 0.2}s`
                  }}
                />
                
                {/* 子分支线 */}
                {dayData.items.map((item, itemIndex) => {
                  const itemAngle = (itemIndex / dayData.items.length) * Math.PI * 0.5 + 
                                   (dayIndex / timelineData.length) * 2 * Math.PI - Math.PI * 0.25;
                  const itemRadius = 25;
                  const itemX = dayPosition.x + Math.cos(itemAngle) * itemRadius;
                  const itemY = dayPosition.y + Math.sin(itemAngle) * itemRadius;
                  
                  return (
                    <line
                      key={`${dayData.date}-${itemIndex}`}
                      x1={dayPosition.x}
                      y1={dayPosition.y}
                      x2={itemX}
                      y2={itemY}
                      className="tree-sub-branch"
                      style={{
                        animationDelay: `${dayIndex * 0.2 + itemIndex * 0.1}s`
                      }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* 日期节点 */}
        {timelineData.map((dayData, dayIndex) => {
          const position = getNodePosition(dayIndex, timelineData.length);
          return (
            <div
              key={dayData.date}
              className="tree-day-node"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                animationDelay: `${dayIndex * 0.2}s`
              }}
            >
              <div className="day-node-content">
                <div className="day-date">{new Date(dayData.date).getDate()}</div>
                <div className="day-month">
                  {new Date(dayData.date).toLocaleDateString('zh-CN', { month: 'short' })}
                </div>
                <div className="day-items-count">{dayData.items.length}</div>
              </div>
              
              {/* 记忆项目节点 */}
              {dayData.items.map((item, itemIndex) => {
                const itemAngle = (itemIndex / dayData.items.length) * Math.PI * 0.5 + 
                                 (dayIndex / timelineData.length) * 2 * Math.PI - Math.PI * 0.25;
                const itemRadius = 25;
                const itemX = Math.cos(itemAngle) * itemRadius;
                const itemY = Math.sin(itemAngle) * itemRadius;
                
                return (
                  <div
                    key={`${dayData.date}-${itemIndex}`}
                    className={`tree-memory-node ${selectedNode?.id === item.id ? 'selected' : ''}`}
                    style={{
                      transform: `translate(${itemX}px, ${itemY}px)`,
                      animationDelay: `${dayIndex * 0.2 + itemIndex * 0.1}s`
                    }}
                    onClick={() => handleNodeClick(item)}
                  >
                    <div className="memory-node-content">
                      <span className="memory-icon">{item.icon}</span>
                    </div>
                    
                    {selectedNode?.id === item.id && (
                      <div className="memory-tooltip">
                        <div className="tooltip-header">
                          <span className="tooltip-icon">{item.icon}</span>
                          <span className="tooltip-type">{item.type}</span>
                        </div>
                        <div className="tooltip-content">
                          {item.name || item.title || '未命名回忆'}
                        </div>
                        <div className="tooltip-time">
                          {new Date(item.createTime || item.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 粒子效果 */}
        <div className="tree-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="memory-tree-stats">
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-label">总记忆</span>
          <span className="stat-value">{photos.length + videos.length + conversations.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📅</span>
          <span className="stat-label">活跃天数</span>
          <span className="stat-value">{timelineData.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⭐</span>
          <span className="stat-label">记忆分支</span>
          <span className="stat-value">
            {timelineData.reduce((sum, day) => sum + day.items.length, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessMemoryTree;
