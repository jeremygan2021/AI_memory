import React, { useState } from 'react';
import './common.css';
import './index.css';

const albumImages = [
  '/images/qz1.png',
  '/images/qz2.png',
  '/images/qz3.png',
  '/images/qz4.png',
  '/images/qz5.png',
  '/images/qz6.png'
];

// 折线图数据
const chartData = [
  { day: '周一', time: 45 },
  { day: '周二', time: 60 },
  { day: '周三', time: 35 },
  { day: '周四', time: 80 },
  { day: '周五', time: 55 },
  { day: '周六', time: 90 },
  { day: '周日', time: 75 }
];

// 折线图组件
const LineChart: React.FC = () => {
  const width = 450;  // 增加宽度
  const height = 240; // 增加高度
  const padding = 50; // 增加内边距
  const maxTime = Math.max(...chartData.map(d => d.time));
  
  // 计算点的坐标
  const points = chartData.map((data, index) => {
    const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
    const y = height - padding - ((data.time / maxTime) * (height - 2 * padding));
    return { x, y, ...data };
  });
  
  // 生成路径字符串
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="line-chart-container">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* 网格线 */}
        <defs>
          <pattern id="grid" width="50" height="35" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 35" fill="none" stroke="#e3f6f2" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Y轴刻度线 */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = height - padding - ((value / maxTime) * (height - 2 * padding));
          return (
            <g key={value}>
              <line 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="#b7e5df" 
                strokeWidth="1" 
                strokeDasharray="4,4"
              />
              <text 
                x={padding - 15} 
                y={y + 5} 
                fontSize="12" 
                fill="#3bb6a6" 
                textAnchor="end"
                fontWeight="400"
              >
                {value}分
              </text>
            </g>
          );
        })}
        
        {/* 折线 */}
        <path
          d={pathData}
          fill="none"
          stroke="#3bb6a6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 渐变填充区域 */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3bb6a6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3bb6a6" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#chartGradient)"
        />
        
        {/* 数据点 */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#fff"
              stroke="#3bb6a6"
              strokeWidth="3"
              className="chart-point"
            />
            <text
              x={point.x}
              y={height - 15}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              fontWeight="400"
            >
              {point.day}
            </text>
            {/* 悬停显示数值 */}
            <text
              x={point.x}
              y={point.y - 15}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              className="chart-value"
              fontWeight="bold"
            >
              {point.time}分
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const App: React.FC = () => {
  // 大图预览相关状态
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // 搜索相关状态
  const [searchValue, setSearchValue] = useState('');
  // 孩子年龄相关状态 (以月为单位)
  const [babyAgeMonths, setBabyAgeMonths] = useState(18); // 默认18个月
  // 活动列表状态
  const [activities, setActivities] = useState([
    { id: 1, text: '到公园散步', completed: false },
    { id: 2, text: '一起阅读绘本故事', completed: false },
    { id: 3, text: '玩扔球游戏', completed: false }
  ]);
  // 新活动输入状态
  const [newActivity, setNewActivity] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const openPreview = (idx: number) => setPreviewIndex(idx);
  const closePreview = () => setPreviewIndex(null);
  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex(previewIndex !== null ? (previewIndex + albumImages.length - 1) % albumImages.length : null);
  };
  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex(previewIndex !== null ? (previewIndex + 1) % albumImages.length : null);
  };

  // 搜索功能
  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log('搜索内容:', searchValue);
      // 这里可以添加实际的搜索逻辑
      alert(`搜索: ${searchValue}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理年龄调节
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBabyAgeMonths(parseInt(e.target.value));
  };

  // 格式化年龄显示
  const formatAge = (months: number) => {
    if (months < 12) {
      return `${months}月`;
    } else if (months === 12) {
      return '1岁';
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years}岁`;
      } else {
        return `${years}岁${remainingMonths}月`;
      }
    }
  };

  // 添加新活动
  const handleAddActivity = () => {
    if (newActivity.trim()) {
      const newItem = {
        id: Math.max(...activities.map(a => a.id), 0) + 1,
        text: newActivity.trim(),
        completed: false
      };
      setActivities([...activities, newItem]);
      setNewActivity('');
      setShowAddInput(false);
    }
  };

  // 显示添加输入框
  const showAddActivityInput = () => {
    setShowAddInput(true);
  };

  // 取消添加
  const cancelAddActivity = () => {
    setNewActivity('');
    setShowAddInput(false);
  };

  // 处理活动状态变化
  const handleActivityToggle = (id: number) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    ));
  };

  // 删除活动
  const handleActivityDelete = (id: number) => {
    setActivities(activities.filter(activity => activity.id !== id));
  };

  // 处理输入框回车
  const handleActivityInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddActivity();
    } else if (e.key === 'Escape') {
      cancelAddActivity();
    }
  };

  // 计算进度百分比 (假设最大36个月为100%)
  const progressPercentage = Math.min((babyAgeMonths / 36) * 100, 100);

  return (
    <div className="memory-app-bg">
      {/* 顶部导航栏 */}
      <div className="memory-navbar">
        <div className="navbar-left">
          <img src="/images/shouye.png" className="memory-logo" alt="logo"  />
          <span className="memory-title">Memory</span>
        </div>
        <div className="navbar-center">
          <div className="search-container">
            <input 
              className="memory-search" 
              placeholder="Search" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="search-btn" onClick={handleSearch}>
              <img src="/images/search.png" alt="搜索" className="search-icon" />
            </button>
          </div>
        </div>
        <div className="navbar-right">
          <span className="memory-icon bell" />
          <span className="memory-icon settings" />
          <span className="memory-icon user" />
        </div>
      </div>
      {/* 菜单栏 */}
      <div className="memory-menu">
        <span className="menu-item active">首页</span>
        <span className="menu-item">我的相册</span>
        <span className="menu-item">成长日志</span>
        <span className="menu-item">纪念日</span>
      </div>
      {/* 主体内容区 */}
      <div className="memory-main">
        {/* 左侧重点回忆卡片 */}
        <div className="memory-left">
          <div className="memory-left-title">重点回忆</div>
          <div className="memory-card-list">
            <div className="memory-card">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">宝宝满月</div>
                <div className="card-desc">宝宝第一次笑</div>
                <img className="card-dont" src="/images/done1.png"/>
              </div>
              <img className="card-img" src="/images/baby1.png"  />
            </div>
            <div className="memory-card">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">学步初体验</div>
                <div className="card-desc">第一次画画</div>
                <img className="card-dont" src="/images/done3.png"/>
              </div>
              <img className="card-img" src="/images/baby2.png"  />
            </div>
            <div className="memory-card">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">画本涂鸦</div>
                <div className="card-desc">第一次画画</div>
                <img className="card-dont1" src="/images/done4.png"/>
              </div>
              <img className="card-img" src="/images/baby3.png" />
            </div>
          </div>
        </div>
        {/* 中间宝宝信息和亲子活动 */}
        <div className="memory-center">
          <div className="baby-info">
            <div className="baby-avatar" />
            <div className="baby-age">{formatAge(babyAgeMonths)}<br />BABY</div>
            <div className="baby-progress">
              <input
                type="range"
                min="1"
                max="36"
                value={babyAgeMonths}
                onChange={handleAgeChange}
                className="age-slider"
              />
              <div className="progress-bar">
                <div className="progress-inner" style={{width: `${progressPercentage}%`}} />
              </div>
              <div className="age-labels">
                <span>1月</span>
                <span>3岁</span>
              </div>
            </div>
          </div>
          <div className="parent-activity">
            <div className="activity-title">每天的亲子活动</div>
            <ul className="activity-list">
              {activities.map((activity) => (
                <li key={activity.id} className={activity.completed ? 'completed' : ''}>
                  <input 
                    type="checkbox" 
                    checked={activity.completed}
                    onChange={() => handleActivityToggle(activity.id)}
                  /> 
                  <span className="activity-text">{activity.text}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => handleActivityDelete(activity.id)}
                    title="删除活动"
                  >
                    ×
                  </button>
                </li>
              ))}
              {showAddInput && (
                <li className="add-activity-item">
                  <input 
                    type="text"
                    className="add-activity-input"
                    placeholder="输入新的活动..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={handleActivityInputKeyPress}
                    autoFocus
                  />
                  <div className="add-activity-buttons">
                    <button className="confirm-btn" onClick={handleAddActivity}>✓</button>
                    <button className="cancel-btn" onClick={cancelAddActivity}>×</button>
                  </div>
                </li>
              )}
            </ul>
            {!showAddInput && (
              <button className="activity-add" onClick={showAddActivityInput}>+</button>
            )}
          </div>
          <div className="activity-chart">
            <div className="chart-title">亲子活动时长</div>
            <LineChart />
          </div>
        </div>
        {/* 右侧亲子相册 */}
        <div className="memory-right">
          <div className="activity-board">
            <div className="activity-title">亲子相册</div>
            <div className="album-list">
              {albumImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  className="album-img"
                  alt={`相册图片${idx + 1}`}
                  onClick={() => openPreview(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* 大图预览弹窗 */}
      {previewIndex !== null && (
        <div className="album-preview-mask" onClick={closePreview}>
          <div className="album-preview-box" onClick={e => e.stopPropagation()}>
            <img className="album-preview-img" src={albumImages[previewIndex]} alt="大图预览" />
            <button className="album-preview-close" onClick={closePreview}>×</button>
            <button className="album-preview-arrow left" onClick={showPrev}>‹</button>
            <button className="album-preview-arrow right" onClick={showNext}>›</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

