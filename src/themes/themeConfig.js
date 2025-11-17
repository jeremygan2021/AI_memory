// 主题配置文件
import { saveThemeToCloud, loadThemeFromCloud, syncThemeSettings } from '../services/themeCloudService.js';
import { getUserCode } from '../utils/userCode.js';

export const themes = {
  // 默认绿色主题（优化后的清新绿意）
  default: {
    id: 'default',
    name: '清新绿意',
    icon: '🌿',
    colors: {
      // 背景色 - 使用与开屏页相同的墨绿色渐变
      primaryBg: 'linear-gradient(135deg, #0a2e0a 0%, #1a4d1a 30%, #2d5a2d 70%, #1a4d1a 100%)',
      containerBg: 'rgba(45, 90, 45, 0.85)',
      headerBg: 'rgba(10, 46, 10, 0.9)',
      commentBg: 'rgba(26, 77, 26, 0.8)',
      secondaryBg: 'rgba(15, 40, 15, 0.7)',
      
      // 主色调 - 调整为与墨绿色背景协调的颜色
      primary: '#4a7c59',
      primaryHover: '#5a8c69',
      secondary: '#2d5a2d',
      tertiary: '#6fa86f',
      accent: '#7fb069',
      
      // 按钮色
      buttonBg: '#4a7c59',
      buttonText: '#ffffff',
      buttonHover: '#5a8c69',
      
      // 文本色 - 使用更亮的颜色确保在深色背景上可读
      textPrimary: '#e8f5e9',
      textSecondary: '#c8e6c9',
      textLight: '#ffffff',
      text: '#dcedc8',
      
      // 边框和阴影 - 调整为与墨绿色背景协调
      border: 'rgba(74, 124, 89, 0.4)',
      borderLight: 'rgba(74, 124, 89, 0.3)',
      borderDark: 'rgba(45, 90, 45, 0.3)',
      shadow: 'rgba(10, 46, 10, 0.3)',
      cardShadow: '0 8px 24px rgba(10, 46, 10, 0.25), 0 4px 12px rgba(10, 46, 10, 0.15)',
    },
    assets: {
      backgroundImage: '/asset/background2.png',
      elephantIcon: '/asset/elephant.png',
    }
  },

   // 温馨深邃主题（优化后的配色）
  serene: {
    id: 'serene',
    name: '温馨深邃',
    icon: '🕯️',
    colors: {
      primaryBg: 'linear-gradient(135deg, #3e2723 0%, #5d4037 50%, #6d4c41 100%)',
      containerBg: '#efebe9',
      headerBg: 'rgba(239, 235, 233, 0.9)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#d7ccc8',
      
      primary: '#8d6e63', // 温暖棕色
      primaryHover: '#a1887f',
      secondary: '#3e2723', // 深棕色
      tertiary: '#bcaaa4',
      accent: '#ff8a65',
      
      buttonBg: '#8d6e63',
      buttonText: '#ffffff',
      buttonHover: '#a1887f',
      
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textLight: '#ffffff',
      text: '#3e2723',
      
      border: 'rgba(141, 110, 99, 0.3)',
      borderLight: 'rgba(141, 110, 99, 0.2)',
      borderDark: 'rgba(62, 39, 35, 0.2)',
      shadow: 'rgba(62, 39, 35, 0.1)',
      cardShadow: '0 8px 24px rgba(62, 39, 35, 0.12), 0 4px 12px rgba(62, 39, 35, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/wxbj.png',
      elephantIcon: '/asset/sunFlower.png',
    }
  },

  // 宇宙主题（优化后的配色）
  dark: {
    id: 'dark',
    name: '宇宙黑洞',
    icon: '🌙',
    colors: {
      primaryBg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      containerBg: 'rgba(36, 36, 62, 0.8)',
      headerBg: 'rgba(15, 12, 41, 0.9)',
      commentBg: 'rgba(48, 43, 99, 0.7)',
      secondaryBg: 'rgba(15, 12, 41, 0.6)',
      
      primary: '#6a5acd', // 深紫色
      primaryHover: '#7b68ee',
      secondary: '#e0e0e0',
      tertiary: '#9370db',
      accent: '#ff6b6b',
      
      buttonBg: '#6a5acd',
      buttonText: '#ffffff',
      buttonHover: '#7b68ee',
      
      textPrimary: '#e0e0e0',
      textSecondary: '#bdbdbd',
      textLight: '#ffffff',
      text: '#e0e0e0',
      
      border: 'rgba(106, 90, 205, 0.3)',
      borderLight: 'rgba(106, 90, 205, 0.2)',
      borderDark: 'rgba(0, 0, 0, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)',
    },
    assets: {
      backgroundImage: '/asset/yzbj.jpg',
      elephantIcon: '/asset/planet.png',
    }
  },

  // 海洋蓝主题（优化后的配色）
  ocean: {
    id: 'ocean',
    name: '深海蓝调',
    icon: '🌊',
    colors: {
      primaryBg: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)',
      containerBg: '#e3f2fd',
      headerBg: 'rgba(227, 242, 253, 0.9)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#bbdefb',
      
      primary: '#1976d2',
      primaryHover: '#42a5f5',
      secondary: '#0d47a1',
      tertiary: '#64b5f6',
      accent: '#00acc1',
      
      buttonBg: '#1976d2',
      buttonText: '#ffffff',
      buttonHover: '#42a5f5',
      
      textPrimary: '#0d47a1',
      textSecondary: '#1565c0',
      textLight: '#ffffff',
      text: '#0d47a1',
      
      border: 'rgba(25, 118, 210, 0.3)',
      borderLight: 'rgba(25, 118, 210, 0.2)',
      borderDark: 'rgba(13, 71, 161, 0.2)',
      shadow: 'rgba(13, 71, 161, 0.1)',
      cardShadow: '0 8px 24px rgba(13, 71, 161, 0.12), 0 4px 12px rgba(13, 71, 161, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/hybj.jpg',
      elephantIcon: '/asset/fish.png',
    }
  },

  // 温暖橙主题（优化后的配色）
  sunset: {
    id: 'sunset',
    name: '温暖黄昏',
    icon: '🌅',
    colors: {
      primaryBg: 'linear-gradient(135deg, #ff8a65 0%, #ff7043 50%, #ff5722 100%)',
      containerBg: '#fff3e0',
      headerBg: 'rgba(255, 243, 224, 0.9)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#ffe0b2',
      
      primary: '#ff7043',
      primaryHover: '#ff8a65',
      secondary: '#bf360c',
      tertiary: '#ffab91',
      accent: '#ffb74d',
      
      buttonBg: '#ff7043',
      buttonText: '#ffffff',
      buttonHover: '#ff8a65',
      
      textPrimary: '#bf360c',
      textSecondary: '#d84315',
      textLight: '#ffffff',
      text: '#bf360c',
      
      border: 'rgba(255, 112, 67, 0.3)',
      borderLight: 'rgba(255, 112, 67, 0.2)',
      borderDark: 'rgba(191, 54, 12, 0.2)',
      shadow: 'rgba(191, 54, 12, 0.1)',
      cardShadow: '0 8px 24px rgba(191, 54, 12, 0.12), 0 4px 12px rgba(191, 54, 12, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/wxbj.jpg',
      elephantIcon: '/asset/sun.png',
    }
  },

  // 紫色梦幻主题（优化后的配色）
  purple: {
    id: 'purple',
    name: '紫色梦境',
    icon: '🔮',
    colors: {
      primaryBg: 'linear-gradient(135deg, #7b1fa2 0%, #8e24aa 50%, #9c27b0 100%)',
      containerBg: '#f3e5f5',
      headerBg: 'rgba(243, 229, 245, 0.9)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#e1bee7',
      
      primary: '#8e24aa',
      primaryHover: '#ab47bc',
      secondary: '#4a148c',
      tertiary: '#ce93d8',
      accent: '#ec407a',
      
      buttonBg: '#8e24aa',
      buttonText: '#ffffff',
      buttonHover: '#ab47bc',
      
      textPrimary: '#4a148c',
      textSecondary: '#6a1b9a',
      textLight: '#ffffff',
      text: '#4a148c',
      
      border: 'rgba(142, 36, 170, 0.3)',
      borderLight: 'rgba(142, 36, 170, 0.2)',
      borderDark: 'rgba(74, 20, 140, 0.2)',
      shadow: 'rgba(74, 20, 140, 0.1)',
      cardShadow: '0 8px 24px rgba(74, 20, 140, 0.12), 0 4px 12px rgba(74, 20, 140, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/zsbj.jpg',
      elephantIcon: '/asset/grape.png',
    }
  },

  

  // 粉色甜美主题（优化后的配色）
  pink: {
    id: 'pink',
    name: '粉色甜心',
    icon: '🌸',
    colors: {
      primaryBg: 'linear-gradient(135deg, #f48fb1 0%, #f06292 50%, #ec407a 100%)',
      containerBg: '#fce4ec',
      headerBg: 'rgba(252, 228, 236, 0.9)',
      commentBg: 'rgba(255, 255, 255, 0.8)',
      secondaryBg: '#f8bbd0',
      
      primary: '#ec407a',
      primaryHover: '#f06292',
      secondary: '#880e4f',
      tertiary: '#f48fb1',
      accent: '#ff80ab',
      
      buttonBg: '#ec407a',
      buttonText: '#ffffff',
      buttonHover: '#f06292',
      
      textPrimary: '#880e4f',
      textSecondary: '#ad1457',
      textLight: '#ffffff',
      text: '#880e4f',
      
      border: 'rgba(236, 64, 122, 0.3)',
      borderLight: 'rgba(236, 64, 122, 0.2)',
      borderDark: 'rgba(136, 14, 79, 0.2)',
      shadow: 'rgba(136, 14, 79, 0.1)',
      cardShadow: '0 8px 24px rgba(136, 14, 79, 0.12), 0 4px 12px rgba(136, 14, 79, 0.08)',
    },
    assets: {
      backgroundImage: '/asset/yhbj.jpg',
      elephantIcon: '/asset/flower.png',
    }
  },

  // 商务风格主题（优化后的配色）
  business: {
    id: 'business',
    name: '商务风格',
    icon: '💼',
    colors: {
      // 背景色
      primaryBg: 'linear-gradient(135deg, #1a237e 0%, #283593 25%, #3949ab 50%, #3f51b5 75%, #5c6bc0 100%)',
      containerBg: 'rgba(26, 35, 126, 0.8)',
      headerBg: 'rgba(26, 35, 126, 0.95)',
      commentBg: 'rgba(255, 255, 255, 0.9)',
      secondaryBg: 'rgba(22, 33, 62, 0.9)',
      
      // 主色调
      primary: '#00acc1',
      primaryHover: '#26c6da',
      secondary: '#ffffff',
      tertiary: '#5c6bc0',
      accent: '#7986cb',
      
      // 按钮色
      buttonBg: '#00acc1',
      buttonText: '#ffffff',
      buttonHover: '#26c6da',
      
      // 文本色
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textLight: '#ffffff',
      text: '#ffffff',
      
      // 边框和阴影
      border: 'rgba(255, 255, 255, 0.15)',
      borderLight: 'rgba(255, 255, 255, 0.1)',
      borderDark: 'rgba(0, 0, 0, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.25)',
      cardShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15)',
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