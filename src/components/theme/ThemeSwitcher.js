import React, { useState, useEffect, useRef } from 'react';
import { getAllThemes, getCurrentTheme, applyTheme } from '../../themes/themeConfig';
import './ThemeSwitcher.css';
import { createPortal } from 'react-dom';

const ThemeSwitcher = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const [themes] = useState(getAllThemes());
  const [panelStyle, setPanelStyle] = useState({});
  const btnRef = useRef(null);

  useEffect(() => {
    // 初始化应用当前主题（不保存到云端，避免重复保存）
    applyTheme(currentTheme.id, { saveToCloud: false });

    // 监听外部主题变化事件
    const handleExternalThemeChange = (event) => {
      const { theme } = event.detail;
      console.log('ThemeSwitcher: 收到外部主题变化事件:', theme);
      setCurrentTheme(theme);
    };

    window.addEventListener('themeChanged', handleExternalThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleExternalThemeChange);
    };
  }, []);

  const handleThemeChange = async (themeId) => {
    try {
      // 应用主题（包含云端保存）
      const newTheme = await applyTheme(themeId);
      setCurrentTheme(newTheme);
      setIsOpen(false);
      
      // 通知父组件主题已更改
      if (onThemeChange) {
        onThemeChange(newTheme);
      }
    } catch (error) {
      console.error('主题切换失败:', error);
      // 即使云端保存失败，也要更新本地主题
      const newTheme = await applyTheme(themeId, { saveToCloud: false });
      setCurrentTheme(newTheme);
      setIsOpen(false);
      
      if (onThemeChange) {
        onThemeChange(newTheme);
      }
    }
  };

  const toggleOpen = () => {
    if (!isOpen && btnRef.current) {
      // 计算按钮位置
      const rect = btnRef.current.getBoundingClientRect();
      // 计算面板宽度
      const panelWidth = window.innerWidth <= 480 ? 260 : (window.innerWidth <= 768 ? 280 : 320);
      // 计算 left，防止超出屏幕
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
      // 计算 top
      let top = rect.bottom + 8;
      // 如果底部空间不够，往上弹
      const panelHeight = 320;
      if (top + panelHeight > window.innerHeight) {
        top = Math.max(8, rect.top - panelHeight - 8);
      }
      setPanelStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9998,
        width: `${panelWidth}px`,
        maxWidth: '90vw',
        borderRadius: '20px',
      });
    }
    setIsOpen(!isOpen);
  };

  // Portal内容
  const portalContent = isOpen ? (
    <>
      {/* 遮罩层 */}
      {createPortal(
        <div className="theme-overlay" onClick={() => setIsOpen(false)} />, document.body
      )}
      {/* 主题选择面板 */}
      {createPortal(
        <div className="theme-panel" style={panelStyle}>
          <div className="theme-panel-header">
            <h3>选择主题</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
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
                <div className="selected-indicator">
                  {currentTheme.id === theme.id ? '✓' : ''}
                </div>
                )}
              </div>
            ))}
          </div>
          <div className="theme-panel-footer">
            <p>主题设置会自动保存到云端</p>
          </div>
        </div>,
        document.body
      )}
    </>
  ) : null;

  return (
    <div className="theme-switcher">
      {/* 主题切换按钮 */}
      <button
        className="theme-toggle-btn"
        onClick={toggleOpen}
        title="切换主题"
        ref={btnRef}
      >
        <span className="theme-icon">{currentTheme.icon}</span>
        <span className="theme-name">{currentTheme.name}</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {portalContent}
    </div>
  );
};

export default ThemeSwitcher; 