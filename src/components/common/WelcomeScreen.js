import React, { useState, useEffect } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ visible, onFinished, onWelcomeComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    if (!visible) return;
    
    // 3秒后开始淡出
    const timer = setTimeout(() => {
      setFadeOut(true);
      
      // 淡出动画完成后隐藏组件
      const fadeTimer = setTimeout(() => {
        if (onFinished) {
          onFinished();
        }
        if (onWelcomeComplete) {
          onWelcomeComplete();
        }
      }, 1000); // 与CSS中的过渡时间一致
      
      return () => clearTimeout(fadeTimer);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [visible, onFinished, onWelcomeComplete]);
  
  if (!visible) return null;
  
  return (
    <div className={`welcome-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="welcome-container">
        <div className="welcome-slogan">
          记录每一段平凡而伟大的生命故事，<br />
          让所有珍贵的记忆与人生智慧代代相传
        </div>
        <div className="welcome-logo">
          <img src="/logo.png" alt="墨与时 Logo" />
        </div>
        <div className="welcome-company">
          - 墨与时(昆明)文化传播有限公司 -
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;