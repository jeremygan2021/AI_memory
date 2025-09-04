import React, { useState, useEffect } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onFinished }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    // 3秒后开始淡出
    const timer = setTimeout(() => {
      setFadeOut(true);
      
      // 淡出动画完成后隐藏组件
      const fadeTimer = setTimeout(() => {
        setVisible(false);
        if (onFinished) {
          onFinished();
        }
      }, 500); // 与CSS中的过渡时间一致
      
      return () => clearTimeout(fadeTimer);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [onFinished]);
  
  if (!visible) return null;
  
  return (
    <div className={`welcome-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="welcome-text">欢迎来到我的回忆</div>
    </div>
  );
};

export default WelcomeScreen;