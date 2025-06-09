import React from 'react';
import './App.css';

// 图标组件
const MicrophoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
    <path d="M19 10V12C19 16.42 15.42 20 11 20V22H13V24H11H13H11V22H9V20C4.58 20 1 16.42 1 12V10H3V12C3 15.31 5.69 18 9 18H15C18.31 18 21 15.31 21 12V10H19Z" fill="currentColor"/>
  </svg>
);

const PhotoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L13 13L9 9L3 15" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M19.4 15A1.65 1.65 0 0 0 20.1 13.13 1.65 1.65 0 0 0 19.4 11.27L17.3 10.21A7.7 7.7 0 0 0 16.82 9.17L17.05 6.85C17.1 6.12 16.59 5.5 15.86 5.4L14.14 5.13C13.95 5.1 13.76 5.04 13.58 4.95L11.9 3.94C11.33 3.65 10.67 3.65 10.1 3.94L8.42 4.95C8.24 5.04 8.05 5.1 7.86 5.13L6.14 5.4C5.41 5.5 4.9 6.12 4.95 6.85L5.18 9.17C5.18 9.17 5.18 9.17 5.18 9.17A7.7 7.7 0 0 0 4.7 10.21L2.6 11.27A1.65 1.65 0 0 0 1.9 13.13 1.65 1.65 0 0 0 2.6 15L4.7 16.06A7.7 7.7 0 0 0 5.18 17.1L4.95 19.42C4.9 20.15 5.41 20.77 6.14 20.87L7.86 21.14C8.05 21.17 8.24 21.23 8.42 21.32L10.1 22.33C10.67 22.62 11.33 22.62 11.9 22.33L13.58 21.32C13.76 21.23 13.95 21.17 14.14 21.14L15.86 20.87C16.59 20.77 17.1 20.15 17.05 19.42L16.82 17.1A7.7 7.7 0 0 0 17.3 16.06L19.4 15Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M13.73 21A1.999 1.999 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

function App() {
  return (
    <div className="app">
      {/* 顶部导航栏 */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">🤖</div>
            <span>AI管家</span>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="搜索..." />
          </div>
        </div>
        <div className="header-right">
          <BellIcon />
          <SettingsIcon />
          <UserIcon />
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="main-content">
        {/* 左侧功能卡片 */}
        <div className="left-sidebar">
          <div className="feature-card voice-record">
            <div className="card-icon">
              <MicrophoneIcon />
            </div>
            <h3>录制我的声音</h3>
          </div>
          
          <div className="feature-card photo-memory">
            <div className="card-icon">
              <PhotoIcon />
            </div>
            <h3>回忆相册</h3>
          </div>
          
          <div className="feature-card time-rewind">
            <div className="card-icon">
              <ClockIcon />
            </div>
            <h3>时间回溯</h3>
            <p>Bedroom1</p>
          </div>
        </div>

        {/* 中间控制面板 */}
        <div className="center-panel">
          {/* 温度控制 */}
          <div className="control-card temperature-card">
            <div className="control-header">
              <span>Temperature</span>
              <div className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </div>
            </div>
            <div className="temperature-display">
              <span className="current-temp">26°C</span>
              <div className="temp-info">
                <span className="target-temp">🎯 32°C</span>
                <span className="humidity">💧 20%</span>
              </div>
            </div>
            <div className="control-slider">
              <input type="range" min="16" max="35" defaultValue="26" />
              <button className="plus-btn">+</button>
            </div>
          </div>

          {/* 灯光控制 */}
          <div className="control-card light-card">
            <div className="control-header">
              <span>Light</span>
              <div className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </div>
            </div>
            <div className="light-display">
              <span className="power">3 KW</span>
            </div>
            <div className="control-slider light-slider">
              <span className="brightness-icon">☀️</span>
              <input type="range" min="0" max="100" defaultValue="60" />
              <span className="moon-icon">🌙</span>
            </div>
          </div>

          {/* 用电量图表 */}
          <div className="chart-card">
            <div className="chart-header">
              <span>这周用电量</span>
              <select defaultValue="This Week">
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="chart">
              <div className="chart-bars">
                <div className="bar" style={{height: '20%'}}><span>Sun</span></div>
                <div className="bar" style={{height: '40%'}}><span>Mon</span></div>
                <div className="bar" style={{height: '30%'}}><span>Tue</span></div>
                <div className="bar" style={{height: '25%'}}><span>Wed</span></div>
                <div className="bar" style={{height: '45%'}}><span>Thu</span></div>
                <div className="bar" style={{height: '70%'}}><span>Fri</span></div>
                <div className="bar" style={{height: '85%'}}><span>Sat</span></div>
              </div>
              <div className="chart-labels">
                <span>0</span>
                <span>1 kW</span>
                <span>2 kW</span>
                <span>3 kW</span>
                <span>4 kW</span>
                <span>5 kW</span>
                <span>6 kW</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧应用区域 */}
        <div className="right-sidebar">
          {/* 应用图标 */}
          <div className="app-icons">
            <div className="app-icon memory-seed">
              <span>🌱</span>
              <p>记忆种子</p>
            </div>
            <div className="app-icon ai-memory">
              <span>🧠</span>
              <p>AI可忆</p>
            </div>
            <div className="app-icon table-record">
              <span>📊</span>
              <p>表格记录</p>
            </div>
            <div className="app-icon data-memory">
              <span>⏰</span>
              <p>数据回忆</p>
            </div>
          </div>

          {/* 事项记录 */}
          <div className="task-card">
            <div className="task-header">
              <span>事项记录</span>
              <div className="menu-dots">⋮</div>
            </div>
            <div className="task-content">
              <div className="task-item">
                <span className="check">✓</span>
                <div className="task-text">
                  <p>今天需要联系9个客户</p>
                  <span className="task-date">周三</span>
                </div>
              </div>
              <div className="task-description">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </div>
            </div>
          </div>

          {/* 登录账号 */}
          <div className="login-card">
            <div className="login-header">
              <span>登录账号</span>
              <div className="menu-dots">⋮</div>
            </div>
            <div className="login-content">
              <div className="username-field">
                <label>Username</label>
                <input type="text" placeholder="•••••••" />
              </div>
              <div className="login-visual">
                <div className="house-icon">🏠</div>
              </div>
              <button className="sign-up-btn">Sign Up</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 