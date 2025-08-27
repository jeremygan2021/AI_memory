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
      
      // 主色调
      primary: '#4ac967',
      primaryHover: '#88d982',
      secondary: '#2d5016',
      
      // 按钮色
      buttonBg: '#f8fae6',
      buttonText: '#2d5016',
      buttonHover: 'rgba(255, 255, 255, 0.35)',
      
      // 文本色
      textPrimary: '#2d5016',
      textSecondary: '#333',
      textLight: 'white',
      
      // 边框和阴影
      border: 'rgba(255, 255, 255, 0.3)',
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
      
      primary: '#bfa46f', // 温暖金色
      primaryHover: '#ffe6a7',
      secondary: '#6d4c41', // 深棕色
      
      buttonBg: '#ffe6a7',
      buttonText: '#232946',
      buttonHover: 'rgba(191, 164, 111, 0.25)',
      
      textPrimary: '#232946',
      textSecondary: '#6d4c41',
      textLight: '#fff',
      
      border: 'rgba(191, 164, 111, 0.3)',
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
      
      primary: '#74b9ff',
      primaryHover: '#0984e3',
      secondary: '#ddd',
      
      buttonBg: '#636e72',
      buttonText: '#ddd',
      buttonHover: 'rgba(116, 185, 255, 0.35)',
      
      textPrimary: '#ddd',
      textSecondary: '#ccc',
      textLight: 'white',
      
      border: 'rgba(116, 185, 255, 0.3)',
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
      
      primary: '#0984e3',
      primaryHover: '#74b9ff',
      secondary: '#2d3436',
      
      buttonBg: '#e3f2fd',
      buttonText: '#2d3436',
      buttonHover: 'rgba(116, 185, 255, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      
      border: 'rgba(116, 185, 255, 0.3)',
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
      
      primary: '#e17055',
      primaryHover: '#fdcb6e',
      secondary: '#5d4037',
      
      buttonBg: '#fff3e0',
      buttonText: '#5d4037',
      buttonHover: 'rgba(253, 203, 110, 0.35)',
      
      textPrimary: '#5d4037',
      textSecondary: '#333',
      textLight: 'white',
      
      border: 'rgba(253, 203, 110, 0.3)',
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
      
      primary: '#6c5ce7',
      primaryHover: '#a29bfe',
      secondary: '#2d3436',
      
      buttonBg: '#f3f0ff',
      buttonText: '#2d3436',
      buttonHover: 'rgba(162, 155, 254, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      
      border: 'rgba(162, 155, 254, 0.3)',
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
      primaryBg: 'linear-gradient(135deg, #fd79a8 0%, #e84393 50%, #fd79a8 100%)',
      containerBg: '#fce4ec',
      headerBg: 'rgba(253, 121, 168, 0.15)',
      commentBg: 'rgba(252, 228, 236, 0.8)',
      
      primary: '#e84393',
      primaryHover: '#fd79a8',
      secondary: '#2d3436',
      
      buttonBg: '#fce4ec',
      buttonText: '#2d3436',
      buttonHover: 'rgba(253, 121, 168, 0.35)',
      
      textPrimary: '#2d3436',
      textSecondary: '#333',
      textLight: 'white',
      
      border: 'rgba(253, 121, 168, 0.3)',
      shadow: 'rgba(232, 67, 147, 0.15)',
      cardShadow: '0 25px 80px rgba(232, 67, 147, 0.15), 0 10px 35px rgba(232, 67, 147, 0.1)',
    },
    assets: {
      backgroundImage: '/asset/yhbj.jpg',
      elephantIcon: '/asset/flower.png',
    }
  }

};

// 主题工具函数
export const applyTheme = async (themeId, options = {}) => {
  const theme = themes[themeId] || themes.default;
  const root = document.documentElement;
  
  console.log('开始应用主题:', themeId, theme);
  
  // 强制清除所有现有的主题变量
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
  
  // 保存到云端（如果启用）
  if (options.saveToCloud !== false) {
    try {
      const userCode = getUserCode();
      const sessionId = options.sessionId || 'global';
      
      if (userCode) {
        console.log('保存主题到云端:', { themeId, userCode, sessionId });
        
        // 添加去重逻辑，避免重复保存
        const saveResult = await saveThemeToCloud(themeId, userCode, sessionId);
        
        if (saveResult.success) {
          console.log('主题云端保存成功:', saveResult.message);
        } else {
          console.warn('主题云端保存失败:', saveResult.message);
        }
      } else {
        console.log('用户代码不存在，跳过云端保存');
      }
    } catch (error) {
      console.error('主题云端保存异常:', error);
    }
  }
  
  // 触发主题变化事件，让组件能够响应
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  
  return theme;
};

// 获取当前主题
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem('selectedTheme');
  return themes[savedTheme] || themes.default;
};

// 获取所有主题列表
export const getAllThemes = () => {
  return Object.values(themes);
};

// 从云端加载主题设置
export const loadThemeFromCloudAndApply = async (userCode, sessionId = 'global') => {
  try {
    const result = await loadThemeFromCloud(userCode, sessionId);
    
    if (result.success && result.themeId) {
      // 应用加载的主题，但不再次保存到云端
      await applyTheme(result.themeId, { saveToCloud: false });
      return result;
    }
    
    return result;
  } catch (error) {
    console.error('加载云端主题失败:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'local'
    };
  }
};

// 同步主题设置（应用启动时调用）
export const syncThemeOnStartup = async () => {
  try {
    const userCode = getUserCode();
    
    if (!userCode) {
      console.log('用户代码不存在，使用本地主题');
      const localTheme = localStorage.getItem('selectedTheme') || 'default';
      await applyTheme(localTheme, { saveToCloud: false });
      return { success: true, source: 'local', themeId: localTheme };
    }

    console.log('应用启动时同步主题设置...', userCode);
    const syncResult = await syncThemeSettings(userCode, 'global');
    
    if (syncResult.success && syncResult.themeId) {
      // 应用同步的主题，不再次保存到云端（避免循环）
      await applyTheme(syncResult.themeId, { saveToCloud: false });
    }
    
    return syncResult;
  } catch (error) {
    console.error('启动时同步主题失败:', error);
    
    // 降级到本地主题
    const localTheme = localStorage.getItem('selectedTheme') || 'default';
    await applyTheme(localTheme, { saveToCloud: false });
    
    return {
      success: false,
      error: error.message,
      themeId: localTheme,
      source: 'local'
    };
  }
};

// 手动触发主题云端同步
export const triggerThemeSync = async (sessionId = 'global') => {
  try {
    const userCode = getUserCode();
    
    if (!userCode) {
      return { success: false, message: '用户代码不存在' };
    }

    console.log('手动触发主题同步...', { userCode, sessionId });
    const syncResult = await syncThemeSettings(userCode, sessionId);
    
    if (syncResult.success && syncResult.themeId) {
      await applyTheme(syncResult.themeId, { saveToCloud: false });
    }
    
    return syncResult;
  } catch (error) {
    console.error('手动同步主题失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 