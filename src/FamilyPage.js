import React, { useState } from 'react';
import './FamilyPage.css';

// 亲子相关图标组件
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" fill="currentColor"/>
  </svg>
);

const BabyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M3 21V19C3 16.7909 4.79086 15 7 15H17C19.2091 15 21 16.7909 21 19V21" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="9" cy="7" r="1" fill="currentColor"/>
    <circle cx="15" cy="7" r="1" fill="currentColor"/>
    <path d="M9 10C9 10 10.5 11 12 11C13.5 11 15 10 15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const GameIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="20" height="8" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="7" cy="12" r="1" fill="currentColor"/>
    <circle cx="17" cy="10" r="1" fill="currentColor"/>
    <circle cx="17" cy="14" r="1" fill="currentColor"/>
    <path d="M6 8V6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V8" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

function FamilyPage() {
  const [selectedActivity, setSelectedActivity] = useState('reading');
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: '爸爸', age: 35, avatar: '👨' },
    { id: 2, name: '妈妈', age: 32, avatar: '👩' },
    { id: 3, name: '小明', age: 8, avatar: '👦' },
    { id: 4, name: '小美', age: 5, avatar: '👧' }
  ]);

  const activities = [
    { id: 'reading', name: '亲子阅读', icon: <BookIcon />, color: '#FF6B6B' },
    { id: 'games', name: '亲子游戏', icon: <GameIcon />, color: '#4ECDC4' },
    { id: 'photos', name: '家庭相册', icon: <CameraIcon />, color: '#45B7D1' },
    { id: 'schedule', name: '家庭日程', icon: <CalendarIcon />, color: '#96CEB4' }
  ];

  const memories = [
    { id: 1, title: '海边度假', date: '2024-01-15', image: '🏖️', description: '全家一起在海边度过了美好的周末' },
    { id: 2, title: '生日派对', date: '2024-01-10', image: '🎂', description: '小明的8岁生日，大家一起庆祝' },
    { id: 3, title: '公园野餐', date: '2024-01-05', image: '🧺', description: '在公园享受阳光和美食的下午' }
  ];

  return (
    <div className="family-page">
      {/* 顶部欢迎区域 */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            <HeartIcon />
            温馨家庭时光
          </h1>
          <p className="welcome-subtitle">记录每一个珍贵的亲子时刻</p>
        </div>
        <div className="family-avatar-group">
          {familyMembers.map(member => (
            <div key={member.id} className="family-member">
              <div className="member-avatar">{member.avatar}</div>
              <span className="member-name">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="main-family-content">
        {/* 左侧活动选择 */}
        <div className="activity-sidebar">
          <h3 className="sidebar-title">亲子活动</h3>
          <div className="activity-list">
            {activities.map(activity => (
              <div 
                key={activity.id}
                className={`activity-item ${selectedActivity === activity.id ? 'active' : ''}`}
                onClick={() => setSelectedActivity(activity.id)}
                style={{'--activity-color': activity.color}}
              >
                <div className="activity-icon">{activity.icon}</div>
                <span className="activity-name">{activity.name}</span>
              </div>
            ))}
          </div>

          {/* 今日任务 */}
          <div className="daily-tasks">
            <h4 className="tasks-title">今日任务</h4>
            <div className="task-list">
              <div className="task-item completed">
                <span className="task-check">✓</span>
                <span className="task-text">陪孩子读故事书</span>
              </div>
              <div className="task-item">
                <span className="task-check">○</span>
                <span className="task-text">户外运动30分钟</span>
              </div>
              <div className="task-item">
                <span className="task-check">○</span>
                <span className="task-text">制作手工作品</span>
              </div>
            </div>
          </div>
        </div>

        {/* 中间内容区域 */}
        <div className="content-area">
          {/* 活动统计卡片 */}
          <div className="stats-cards">
            <div className="stat-card reading">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h4>本周阅读</h4>
                <span className="stat-number">12</span>
                <span className="stat-unit">本书</span>
              </div>
            </div>
            <div className="stat-card games">
              <div className="stat-icon">🎮</div>
              <div className="stat-info">
                <h4>游戏时间</h4>
                <span className="stat-number">8.5</span>
                <span className="stat-unit">小时</span>
              </div>
            </div>
            <div className="stat-card photos">
              <div className="stat-icon">📸</div>
              <div className="stat-info">
                <h4>新增照片</h4>
                <span className="stat-number">24</span>
                <span className="stat-unit">张</span>
              </div>
            </div>
          </div>

          {/* 活动详情区域 */}
          <div className="activity-details">
            <div className="activity-header">
              <h3>亲子阅读时光</h3>
              <div className="activity-controls">
                <button className="control-btn start">开始活动</button>
                <button className="control-btn pause">暂停</button>
              </div>
            </div>
            
            <div className="reading-progress">
              <div className="progress-info">
                <span>今日进度</span>
                <span>3/5 本</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '60%'}}></div>
              </div>
            </div>

            <div className="book-recommendations">
              <h4>推荐书籍</h4>
              <div className="book-grid">
                <div className="book-item">
                  <div className="book-cover">📖</div>
                  <span className="book-title">小王子</span>
                </div>
                <div className="book-item">
                  <div className="book-cover">📚</div>
                  <span className="book-title">安徒生童话</span>
                </div>
                <div className="book-item">
                  <div className="book-cover">📘</div>
                  <span className="book-title">十万个为什么</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧回忆录 */}
        <div className="memories-sidebar">
          <h3 className="sidebar-title">美好回忆</h3>
          <div className="memories-list">
            {memories.map(memory => (
              <div key={memory.id} className="memory-card">
                <div className="memory-image">{memory.image}</div>
                <div className="memory-content">
                  <h4 className="memory-title">{memory.title}</h4>
                  <p className="memory-date">{memory.date}</p>
                  <p className="memory-description">{memory.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 快速添加 */}
          <div className="quick-add">
            <h4 className="add-title">记录新回忆</h4>
            <div className="add-buttons">
              <button className="add-btn photo">
                <CameraIcon />
                拍照
              </button>
              <button className="add-btn note">
                <HeartIcon />
                写日记
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilyPage;