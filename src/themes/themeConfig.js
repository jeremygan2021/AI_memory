// 主题配置文件
import { saveThemeToCloud, loadThemeFromCloud, syncThemeSettings } from '../services/themeCloudService.js';
import { getUserCode } from '../utils/userCode.js';

export const themes = {
  // 默认绿色主题（现有的）
  default: {
    id: 'default',
    name: '清新绿意',
    icon: '🌿',
    colors: {
      // 背景色
      primaryBg: 'linear-gradient(135deg, #a8e6a3 0%, #88d982 50%, #a8e6a3 100%)',
      containerBg: '#ffffe6',
      headerBg: 'rgba(255, 255, 255, 0.15)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#f0f8e6',
      
      // 主色调
      primary: '#4ac967',
      primaryHover: '#88d982',
      secondary: '#2d5016',
      tertiary: '#88d982',
      accent: '#4ac967',
      
      // 按钮色
      buttonBg: '#f8fae6',
      buttonText: '#2d5016',
      buttonHover: 'rgba(255, 255, 255, 0.35)',
      
      // 文本色
      textPrimary: '#2d5016',
      textSecondary: '#333',
      textLight: 'white',
      text: '#2d5016',
      
      // 边框和阴影
      border: 'rgba(255, 255, 255, 0.3)',
      borderLight: 'rgba(255, 255, 255, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(45, 80, 22, 0.15)',
      cardShadow: '0 25px 80px rgba(45, 80, 22, 0.15), 0 10px 35px rgba(45, 80, 22, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/background2.png',
      elephantIcon: '/asset/elephant.png',
    }
  },

   // 严肃深沉又温馨主题
   serene: {
    id: 'serene',
    name: '温馨深邃',
    icon: '🕯️',
    colors: {
      primaryBg: 'linear-gradient(135deg, #232946 0%, #393e46 50%, #232946 100%)',
      containerBg: '#f6e7cb',
      headerBg: 'rgba(35, 41, 70, 0.7)',
      commentBg: 'rgba(246, 231, 203, 0.85)',
      secondaryBg: '#e6d7bb',
      
      primary: '#bfa46f', // 温暖金色
      primaryHover: '#ffe6a7',
      secondary: '#6d4c41', // 深棕色
      tertiary: '#ffe6a7',
      accent: '#bfa46f',
      
      buttonBg: '#ffe6a7',
      buttonText: '#232946',
      buttonHover: 'rgba(191, 164, 111, 0.25)',
      
      textPrimary: '#232946',
      textSecondary: '#6d4c41',
      textLight: '#fff',
      text: '#232946',
      
      border: 'rgba(191, 164, 111, 0.3)',
      borderLight: 'rgba(191, 164, 111, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(35, 41, 70, 0.15)',
      cardShadow: '0 25px 80px rgba(35, 41, 70, 0.15), 0 10px 35px rgba(191, 164, 111, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/wxbj.png',
      elephantIcon: '/asset/sunFlower.png',
    }
  },

  // 宇宙主题
  dark: {
    id: 'dark',
    name: '宇宙黑洞',
    icon: '🌙',
    colors: {
      primaryBg: 'linear-gradient(135deg, #2d3436 0%, #636e72 50%, #2d3436 100%)',
      containerBg: '#2d3436',
      headerBg: 'rgba(45, 52, 54, 0.8)',
      commentBg: 'rgba(45, 52, 54, 0.9)',
      secondaryBg: '#1a1a1e',
      
      primary: '#74b9ff',
      primaryHover: '#0984e3',
      secondary: '#ddd',
      tertiary: '#a29bfe',
      accent: '#fd79a8',
      
      buttonBg: '#636e72',
      buttonText: '#ddd',
      buttonHover: 'rgba(116, 185, 255, 0.35)',
      
      textPrimary: '#ddd',
      textSecondary: '#ccc',
      textLight: 'white',
      text: '#ddd',
      
      border: 'rgba(116, 185, 255, 0.3)',
      borderLight: 'rgba(116, 185, 255, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      cardShadow: '0 25px 80px rgba(0, 0, 0, 0.3), 0 10px 35px rgba(0, 0, 0, 0.2)',
    },
    assets: {
      backgroundImage: '/asset/yzbj.jpg',
      elephantIcon: '/asset/planet.png',
    }
  },

  // 海洋蓝主题
  ocean: {
    id: 'ocean',
    name: '深海蓝调',
    icon: '🌊',
    colors: {
      primaryBg: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #74b9ff 100%)',
      containerBg: '#e3f2fd',
      headerBg: 'rgba(116, 185, 255, 0.15)',
      commentBg: 'rgba(227, 242, 253, 0.8)',
      secondaryBg: '#bbdefb',
      
      primary: '#0984e3',
      primaryHover: '#74b9ff',
      secondary: '#2d3436',
      tertiary: '#74b9ff',
      accent: '#00cec9',
      
      buttonBg: '#e3f2fd',
      buttonText: '#2d3436',
      buttonHover: 'rgba(116, 185, 255, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      text: '#2d3436',
      
      border: 'rgba(116, 185, 255, 0.3)',
      borderLight: 'rgba(116, 185, 255, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(9, 132, 227, 0.15)',
      cardShadow: '0 25px 80px rgba(9, 132, 227, 0.15), 0 10px 35px rgba(9, 132, 227, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/hybj.jpg',
      elephantIcon: '/asset/fish.png',
    }
  },

  // 温暖橙主题
  sunset: {
    id: 'sunset',
    name: '温暖黄昏',
    icon: '🌅',
    colors: {
      primaryBg: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 50%, #fdcb6e 100%)',
      containerBg: '#fff3e0',
      headerBg: 'rgba(253, 203, 110, 0.15)',
      commentBg: 'rgba(255, 243, 224, 0.8)',
      secondaryBg: '#ffe0b2',
      
      primary: '#e17055',
      primaryHover: '#fdcb6e',
      secondary: '#5d4037',
      tertiary: '#fdcb6e',
      accent: '#ff8a65',
      
      buttonBg: '#fff3e0',
      buttonText: '#5d4037',
      buttonHover: 'rgba(253, 203, 110, 0.35)',
      
      textPrimary: '#5d4037',
      textSecondary: '#333',
      textLight: 'white',
      text: '#5d4037',
      
      border: 'rgba(253, 203, 110, 0.3)',
      borderLight: 'rgba(253, 203, 110, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(225, 112, 85, 0.15)',
      cardShadow: '0 25px 80px rgba(225, 112, 85, 0.15), 0 10px 35px rgba(225, 112, 85, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/wxbj.jpg',
      elephantIcon: '/asset/sun.png',
    }
  },

  // 紫色梦幻主题
  purple: {
    id: 'purple',
    name: '紫色梦境',
    icon: '🔮',
    colors: {
      primaryBg: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 50%, #a29bfe 100%)',
      containerBg: '#f3f0ff',
      headerBg: 'rgba(162, 155, 254, 0.15)',
      commentBg: 'rgba(243, 240, 255, 0.8)',
      secondaryBg: '#e8e5ff',
      
      primary: '#6c5ce7',
      primaryHover: '#a29bfe',
      secondary: '#2d3436',
      tertiary: '#a29bfe',
      accent: '#fd79a8',
      
      buttonBg: '#f3f0ff',
      buttonText: '#2d3436',
      buttonHover: 'rgba(162, 155, 254, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      text: '#2d3436',
      
      border: 'rgba(162, 155, 254, 0.3)',
      borderLight: 'rgba(162, 155, 254, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(108, 92, 231, 0.15)',
      cardShadow: '0 25px 80px rgba(108, 92, 231, 0.15), 0 10px 35px rgba(108, 92, 231, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/zsbj.jpg',
      elephantIcon: '/asset/grape.png',
    }
  },

  

  // 粉色甜美主题
  pink: {
    id: 'pink',
    name: '粉色甜心',
    icon: '🌸',
    colors: {
      primaryBg: 'linear-gradient(135deg, #ffb6c1 0%, #ff91a4 50%, #ff6b95 100%)',
      containerBg: '#fff0f5',
      headerBg: 'rgba(255, 182, 193, 0.15)',
      commentBg: 'rgba(255, 240, 245, 0.8)',
      secondaryBg: '#ffe4ec',
      
      primary: '#ff69b4',
      primaryHover: '#ff91a4',
      secondary: '#2d3436',
      tertiary: '#ffb6c1',
      accent: '#ff1493',
      
      buttonBg: '#fff0f5',
      buttonText: '#2d3436',
      buttonHover: 'rgba(255, 182, 193, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      text: '#2d3436',
      
      border: 'rgba(255, 182, 193, 0.3)',
      borderLight: 'rgba(255, 182, 193, 0.4)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(255, 105, 180, 0.15)',
      cardShadow: '0 25px 80px rgba(255, 105, 180, 0.15), 0 10px 35px rgba(255, 105, 180, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/yhbj.jpg',
      elephantIcon: '/asset/flower.png',
    }
  },

  // 商务风格主题
  business: {
    id: 'business',
    name: '商务风格',
    icon: '💼',
    colors: {
      // 背景色
      primaryBg: 'linear-gradient(135deg, rgba(26, 35, 126, 0.8) 0%, rgba(40, 53, 147, 0.7) 25%, rgba(57, 73, 171, 0.6) 50%, rgba(63, 81, 181, 0.7) 75%, rgba(92, 107, 192, 0.8) 100%)',
      containerBg: 'rgba(26, 35, 126, 0.7)',
      headerBg: 'rgba(26, 35, 126, 0.9)',
      commentBg: 'rgba(26, 35, 126, 0.7)',
      secondaryBg: 'rgba(22, 33, 62, 0.8)',
      
      // 主色调
      primary: '#00bcd4',
      primaryHover: '#4dd0e1',
      secondary: '#ffffff',
      tertiary: '#667eea',
      accent: '#764ba2',
      
      // 按钮色
      buttonBg: 'rgba(0, 188, 212, 0.2)',
      buttonText: '#00bcd4',
      buttonHover: 'rgba(0, 188, 212, 0.3)',
      
      // 文本色
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textLight: '#ffffff',
      text: '#ffffff',
      
      // 边框和阴影
      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.15)',
      borderDark: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.2)',
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    assets: {
      backgroundImage: '/asset/earth.png',
      elephantIcon: '/asset/planet.png',
    }
  }

};

// 主题工具函数
export const applyTheme = async (themeId, options = {}) => {
  const theme = themes[themeId];
  if (!theme) {
    console.error(`主题 ${themeId} 不存在，使用默认主题`);
    return applyTheme('default', options);
  }
  
  const root = document.documentElement;
  
  console.log('应用主题:', themeId, theme);
  
  // 清除所有现有的主题变量
  const existingVars = Array.from(root.style).filter(prop => prop.startsWith('--theme-'));
  existingVars.forEach(prop => {
    root.style.removeProperty(prop);
  });
  
  // 等待一帧确保清除完成
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // 应用CSS变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
    console.log(`设置CSS变量: --theme-${key} = ${value}`);
  });
  
  // 新增：设置背景图片变量
  if (theme.assets && theme.assets.backgroundImage) {
    root.style.setProperty('--theme-backgroundImage', `url('${theme.assets.backgroundImage}')`);
    console.log(`设置背景图片: --theme-backgroundImage = url('${theme.assets.backgroundImage}')`);
  } else {
    root.style.setProperty('--theme-backgroundImage', '');
  }

  // 强制触发重绘和重排
  root.style.setProperty('--theme-update-timestamp', Date.now().toString());
  
  // 等待两帧确保所有变量都已应用
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  
  console.log('主题CSS变量应用完成:', themeId);

  // 保存到localStorage
  localStorage.setItem('selectedTheme', themeId);
  
  // 保存到云端（除非明确禁用）
  if (options.saveToCloud !== false) {
    try {
      const userCode = getUserCode();
      if (userCode) {
        await saveThemeToCloud(userCode, themeId, options.sessionId || 'global');
        console.log('主题已保存到云端');
      }
    } catch (error) {
      console.error('保存主题到云端失败:', error);
    }
  }
  
  // 触发主题变化事件，让组件能够响应
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  
  return theme;
};

// 获取当前主题
export const getCurrentTheme = () => {
  // 从localStorage获取当前主题，如果没有则使用默认主题
  const currentThemeId = localStorage.getItem('selectedTheme') || 'default';
  return themes[currentThemeId] || themes.default;
};

// 获取所有主题列表
export const getAllThemes = () => {
  // 返回所有可用主题
  return Object.values(themes);
};

// 从云端加载主题设置
export const loadThemeFromCloudAndApply = async (userCode, sessionId = 'global') => {
  try {
    console.log('尝试从云端加载主题设置');
    const cloudResult = await loadThemeFromCloud(userCode, sessionId);
    
    if (cloudResult.success && cloudResult.themeId) {
      // 从云端加载成功，应用云端主题
      await applyTheme(cloudResult.themeId, { saveToCloud: false });
      return {
        success: true,
        themeId: cloudResult.themeId,
        source: 'cloud',
        message: '已从云端加载主题'
      };
    } else {
      // 云端没有主题设置，使用本地存储的主题
      const localThemeId = localStorage.getItem('selectedTheme') || 'default';
      await applyTheme(localThemeId, { saveToCloud: false });
      return {
        success: true,
        themeId: localThemeId,
        source: 'local',
        message: '已使用本地主题设置'
      };
    }
  } catch (error) {
    console.error('加载云端主题失败:', error);
    
    // 降级到本地主题
    const localThemeId = localStorage.getItem('selectedTheme') || 'default';
    await applyTheme(localThemeId, { saveToCloud: false });
    
    return {
      success: false,
      error: error.message,
      themeId: localThemeId,
      source: 'local'
    };
  }
};

// 同步主题设置（应用启动时调用）
export const syncThemeOnStartup = async () => {
  try {
    console.log('启动时同步主题设置');
    const userCode = getUserCode();
    
    if (userCode) {
      // 有用户代码，尝试从云端同步
      const result = await loadThemeFromCloudAndApply(userCode, 'global');
      return result;
    } else {
      // 没有用户代码，使用本地主题
      const localThemeId = localStorage.getItem('selectedTheme') || 'default';
      await applyTheme(localThemeId, { saveToCloud: false });
      return { 
        success: true, 
        source: 'local', 
        themeId: localThemeId,
        message: '已使用本地主题设置'
      };
    }
  } catch (error) {
    console.error('启动时同步主题失败:', error);
    
    // 降级到本地主题
    const localThemeId = localStorage.getItem('selectedTheme') || 'default';
    await applyTheme(localThemeId, { saveToCloud: false });
    
    return {
      success: false,
      error: error.message,
      themeId: localThemeId,
      source: 'local'
    };
  }
};

// 手动触发主题云端同步
export const triggerThemeSync = async (sessionId = 'global') => {
  try {
    console.log('手动触发主题云端同步');
    const userCode = getUserCode();
    
    if (!userCode) {
      throw new Error('用户代码不存在，无法同步主题');
    }
    
    // 获取当前主题
    const currentThemeId = localStorage.getItem('selectedTheme') || 'default';
    
    // 同步到云端
    await saveThemeToCloud(userCode, currentThemeId, sessionId);
    
    return { 
      success: true, 
      themeId: currentThemeId,
      message: '主题已同步到云端'
    };
  } catch (error) {
    console.error('手动同步主题失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};