import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './common.css';
import './index.css';
import FamilyPage from './FamilyPage';
import RecordComponent from './record';
import PlayerPage from './PlayerPage';
import AudioLibrary from './AudioLibrary';
import { validateUserCode } from './utils/userCode';

// 相册图片数据 - 使用占位内容
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
const LineChart = () => {
  const width = 320;
  const height = 150;
  const padding = 40;
  const bottomPadding = 50;
  const leftPadding = 50;
  const maxTime = Math.max(...chartData.map(d => d.time));
  
  // 计算点的坐标
  const points = chartData.map((data, index) => {
    const x = leftPadding + (index * (width - leftPadding - padding)) / (chartData.length - 1);
    const y = padding + ((maxTime - data.time) / maxTime) * (height - padding - bottomPadding);
    return { x, y, ...data };
  });
  
  // 生成路径字符串
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="line-chart-container">
      <svg width="90%" height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* 网格线 */}
        <defs>
          <pattern id="grid" width="50" height="35" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 35" fill="none" stroke="#e3f6f2" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Y轴刻度线 */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = padding + ((maxTime - value) / maxTime) * (height - padding - bottomPadding);
          return (
            <g key={value}>
              <line 
                x1={leftPadding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="#b7e5df" 
                strokeWidth="1" 
                strokeDasharray="4,4"
              />
              <text 
                x={leftPadding - 8} 
                y={y + 4} 
                fontSize="8" 
                fill="#3bb6a6" 
                textAnchor="end"
                fontWeight="300"
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
          d={`${pathData} L ${points[points.length - 1].x} ${height - bottomPadding} L ${points[0].x} ${height - bottomPadding} Z`}
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
              y={height - 20}
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

// 录音页面组件
const RecordPage = () => {
  const { userid, id } = useParams();
  const navigate = useNavigate();
  
  // 验证用户ID
  useEffect(() => {
    if (!userid || userid.length !== 4 || !/^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
      navigate('/');
    }
  }, [userid, navigate]);
  
  return (
    <div>
      {/* 返回按钮和ID显示 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50px',
          padding: '10px 20px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }} onClick={() => navigate(`/${userid}`)}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>← 返回主页</span>
        </div>
        
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          borderRadius: '20px',
          padding: '8px 16px',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#4a90e2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>用户: {userid} | 会话: {id}</span>
        </div>
      </div>
      <RecordComponent />
    </div>
  );
};

// 主页组件
const HomePage = () => {
  const navigate = useNavigate();
  const { userid } = useParams();
  const [userCode, setUserCode] = useState('');
  
  // 大图预览相关状态
  const [previewIndex, setPreviewIndex] = useState(null);
  // 搜索相关状态
  const [searchValue, setSearchValue] = useState('');
  // 孩子年龄相关状态 (以月为单位)
  const [babyAgeMonths, setBabyAgeMonths] = useState(18);
  // 活动列表状态
  const [activities, setActivities] = useState([
    { id: 1, text: '到公园散步', completed: false },
    { id: 2, text: '一起阅读绘本故事', completed: false },
    { id: 3, text: '玩扔球游戏', completed: false }
  ]);
  // 新活动输入状态
  const [newActivity, setNewActivity] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  
  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid) {
      // 验证用户ID格式（4字符）
      if (userid.length === 4 && /^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
        setUserCode(userid.toUpperCase());
        // 同时存储到localStorage作为备份
        localStorage.setItem('currentUserCode', userid.toUpperCase());
      } else {
        // 如果URL中的用户ID格式不正确，跳转到默认页面
        navigate('/');
      }
    } else {
      // 如果没有用户ID，显示输入提示
      setUserCode('');
    }
  }, [userid, navigate]);
  
  // 跳转到音频库
  const goToAudioLibrary = () => {
    if (userCode) {
      navigate(`/${userCode}/audio-library`);
    }
  };

  // 大图预览相关函数
  const openPreview = (idx) => setPreviewIndex(idx);
  const closePreview = () => setPreviewIndex(null);
  const showPrev = (e) => {
    e.stopPropagation();
    setPreviewIndex(previewIndex !== null ? (previewIndex + albumImages.length - 1) % albumImages.length : null);
  };
  const showNext = (e) => {
    e.stopPropagation();
    setPreviewIndex(previewIndex !== null ? (previewIndex + 1) % albumImages.length : null);
  };

  // 搜索功能
  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log('搜索内容:', searchValue);
      alert(`搜索: ${searchValue}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理年龄调节
  const handleAgeChange = (e) => {
    setBabyAgeMonths(parseInt(e.target.value));
  };

  // 格式化年龄显示
  const formatAge = (months) => {
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
  const handleActivityToggle = (id) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    ));
  };

  // 删除活动
  const handleActivityDelete = (id) => {
    setActivities(activities.filter(activity => activity.id !== id));
  };

  // 处理输入框回车
  const handleActivityInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddActivity();
    } else if (e.key === 'Escape') {
      cancelAddActivity();
    }
  };

  // 计算进度百分比 (假设最大36个月为100%)
  const progressPercentage = Math.min((babyAgeMonths / 36) * 100, 100);

  // 如果没有用户ID，显示输入界面
  if (!userid) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🤖 AI智能录音管家</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
              请在URL中输入您的4字符用户标识
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '1rem', marginBottom: '10px' }}>访问格式：</p>
              <code style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '10px 15px',
                borderRadius: '5px',
                fontSize: '1.1rem',
                letterSpacing: '1px'
              }}>
                http://me.tangledup-ai.com/userid
              </code>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              用户标识为4个字符，包含大写字母和数字
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-app-bg">
      {/* 顶部导航栏 */}
      <div className="memory-navbar">
        <div className="navbar-left">
          <img src="/images/shouye.png" className="memory-logo" alt="logo" />
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
              <img src="/images/search.png" alt="搜索" className='search-icon'/>
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
        <span className="menu-item">智能回忆</span>
        <span className="menu-item">成长日志</span>
        <span className="menu-item">安全管家</span>
      </div>

      {/* 主体内容区 - 三栏布局 */}
      <div className="memory-main">
        {/* 左侧：用户信息、宝宝信息和其他功能 */}
        <div className="memory-left">
          <div className="memory-left-top">
            {/* 用户账户信息 */}
            <div className="user-account-card">
              <div className="user-code">{userCode}</div>
              <div className="user-status">✓ 已激活</div>
            </div>
            {/* 宝宝信息 */}
            <div className="baby-info">
              <div className="baby-info-top">
                <div className="baby-avatar" />
                <div className="baby-age">{formatAge(babyAgeMonths)}BABY</div>
              </div>
              <div className="baby-progress">
                <input
                  type="range"
                  min="1"
                  max="36"
                  value={babyAgeMonths}
                  onChange={handleAgeChange}
                  className="age-slider"
                />
                <div className="age-labels">
                  <span>1月</span>
                  <span>3岁</span>
                </div>
              </div>
            </div>
          </div>
          {/* 其他功能 */}
          <div className="memory-left-title">美好回忆</div>
          <div className="memory-card-list">
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">回忆相册</div>
                <div className="card-desc">美好时光收藏</div>
                <img className="card-dont1" src="/images/done1.png"/>
              </div>
              <img className="card-img" src="/images/baby1.png"  />
              <img className="card-dont2" src="/images/done2.png"/>
            </div>
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">时间回溯</div>
                <div className="card-desc">历史记录追踪</div>
                <img className="card-dont" src="/images/done3.png"/>
              </div>
              <img className="card-img" src="/images/baby2.png"  />
            </div>
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">成长档案</div>
                <div className="card-desc">宝宝成长每一步</div>
                <img className="card-dont3" src="/images/done4.png"/>
              </div>
              <img className="card-img" src="/images/baby3.png"  />
            </div>
          </div>
        </div>

        {/* 中间：录制声音、亲子活动和活动时长 */}
        <div className="memory-center">
          {/* 录制声音功能 */}
          <div className="center-voice-card" onClick={goToAudioLibrary}>
            <div className="voice-icon">🎤</div>
            <div className="voice-title">录制我的声音</div>
            <div className="voice-desc">智能语音助手，记录您的美好时光</div>
            <button className="voice-action">开始录制</button>
          </div>

          {/* 亲子活动 */}
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

          {/* 亲子活动时长图表 */}
          <div className="activity-chart">
            <div className="chart-title">亲子活动时长</div>
            <LineChart />
          </div>
        </div>

        {/* 右侧：亲子相册 */}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:userid" element={<HomePage />} />
      <Route path="/family" element={<FamilyPage />} />
      <Route path="/:userid/audio-library" element={<AudioLibrary />} />
      <Route path="/:userid/:id" element={<RecordPage />} />
      <Route path="/:userid/:id/play/:recordingId" element={<PlayerPage />} />
    </Routes>
  );
}

export default App;