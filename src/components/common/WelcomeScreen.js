import React, { useState, useEffect } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onFinished }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  
  // 根据屏幕宽度选择不同的欢迎图片
  const getWelcomeImage = () => {
    return window.innerWidth >= 768 
      ? '/images/welcome2.png' 
      : '/images/welcome.png';
  };
  
  const [welcomeImage, setWelcomeImage] = useState(getWelcomeImage());
  
  useEffect(() => {
    // 监听窗口大小变化，更新欢迎图片
    const handleResize = () => {
      setWelcomeImage(getWelcomeImage());
    };
    
    window.addEventListener('resize', handleResize);
    
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
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [onFinished]);
  
  if (!visible) return null;
  
  return (
    <div className={`welcome-screen ${fadeOut ? 'fade-out' : ''}`}>
      <img 
        src={welcomeImage} 
        alt="欢迎" 
        className="welcome-image"
      />
    </div>
  );
};

export default WelcomeScreen;