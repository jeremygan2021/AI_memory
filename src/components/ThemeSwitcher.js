import React, { useState, useEffect } from 'react';
import { getAllThemes, getCurrentTheme, applyTheme } from '../themes/themeConfig';
import './ThemeSwitcher.css';

const ThemeSwitcher = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const [themes] = useState(getAllThemes());

  useEffect(() => {
    // 初始化应用当前主题
    applyTheme(currentTheme.id);
  }, []);

  const handleThemeChange = (themeId) => {
    const newTheme = applyTheme(themeId);
    setCurrentTheme(newTheme);
    setIsOpen(false);
    
    // 通知父组件主题已更改
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="theme-switcher">
      {/* 主题切换按钮 */}
      <button 
        className="theme-toggle-btn"
        onClick={toggleOpen}
        title="切换主题"
      >
        <span className="theme-icon">{currentTheme.icon}</span>
        <span className="theme-name">{currentTheme.name}</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* 主题选择面板 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div className="theme-overlay" onClick={() => setIsOpen(false)} />
          
          {/* 主题列表 */}
          <div className="theme-panel">
            <div className="theme-panel-header">
              <h3>选择主题</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className="theme-grid">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div 
                    className="theme-preview"
                    style={{
                      background: theme.colors.primaryBg,
                      borderColor: theme.colors.primary
                    }}
                  >
                    <div 
                      className="theme-preview-content"
                      style={{
                        backgroundColor: theme.colors.containerBg,
                        color: theme.colors.textPrimary
                      }}
                    >
                      <span className="preview-icon">{theme.icon}</span>
                    </div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-emoji">{theme.icon}</span>
                    <span className="theme-title">{theme.name}</span>
                  </div>
                  {currentTheme.id === theme.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="theme-panel-footer">
              <p>主题设置会自动保存</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher; 