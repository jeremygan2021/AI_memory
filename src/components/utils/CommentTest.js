import React, { useState, useEffect } from 'react';
import CommentSection from '../common/CommentSection';
import { applyTheme, getAllThemes } from '../../themes/themeConfig';

const CommentTest = () => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const themes = getAllThemes();

  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  useEffect(() => {
    // 应用默认主题
    applyTheme('default');
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--theme-primaryBg, linear-gradient(135deg, #a8e6a3 0%, #88d982 50%, #a8e6a3 100%))',
      padding: '20px',
      fontFamily: 'MUYAO-SOFTBRUSH, Inter, Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      transition: 'background 0.3s ease'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: 'var(--theme-textPrimary, #2d5016)', 
        marginBottom: '30px',
        transition: 'color 0.3s ease'
      }}>
        评论功能测试
      </h1>
      
      {/* 主题选择器 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ 
          color: 'var(--theme-textPrimary, #2d5016)', 
          marginBottom: '15px',
          transition: 'color 0.3s ease'
        }}>
          选择主题
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                padding: '10px 15px',
                background: currentTheme === theme.id 
                  ? 'var(--theme-primary, #4ac967)' 
                  : 'rgba(255, 255, 255, 0.2)',
                color: currentTheme === theme.id 
                  ? 'var(--theme-textLight, white)' 
                  : 'var(--theme-textPrimary, #2d5016)',
                border: '2px solid var(--theme-primary, #4ac967)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                if (currentTheme !== theme.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentTheme !== theme.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              {theme.icon} {theme.name}
            </button>
          ))}
        </div>
      </div>
      
      <CommentSection 
        recordingId="test-recording-123"
        userCode="TEST"
        sessionId="test-session-456"
      />
    </div>
  );
};

export default CommentTest; 