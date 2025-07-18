import React, { useState, useEffect } from 'react';
import SvgIcon from './SvgIcons';
import { getCurrentTheme } from '../themes/themeConfig';

// 主题感知的图标组件
const ThemedIcon = ({ 
  name, 
  width = 24, 
  height = 24, 
  className = "",
  style = {},
  colorType = "primary" // primary, secondary, textPrimary, textLight 等
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  
  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(getCurrentTheme());
    };
    
    // 监听主题切换事件
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);
  
  // 根据 colorType 获取对应的主题颜色
  const getThemeColor = () => {
    switch (colorType) {
      case 'primary':
        return currentTheme.colors.primary;
      case 'secondary':
        return currentTheme.colors.secondary;
      case 'textPrimary':
        return currentTheme.colors.textPrimary;
      case 'textSecondary':
        return currentTheme.colors.textSecondary;
      case 'textLight':
        return currentTheme.colors.textLight;
      case 'buttonText':
        return currentTheme.colors.buttonText;
      default:
        return currentTheme.colors.primary;
    }
  };

  return (
    <SvgIcon 
      name={name}
      width={width}
      height={height}
      color={getThemeColor()}
      className={className}
      style={style}
    />
  );
};

export default ThemedIcon; 