// 主题配置文件
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
export const applyTheme = (themeId) => {
  const theme = themes[themeId] || themes.default;
  const root = document.documentElement;
  
  // 应用CSS变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  // 新增：设置背景图片变量
if (theme.assets && theme.assets.backgroundImage) {
  root.style.setProperty('--theme-backgroundImage', `url('${theme.assets.backgroundImage}')`);
} else {
  root.style.setProperty('--theme-backgroundImage', '');
}

  // 保存到localStorage
  localStorage.setItem('selectedTheme', themeId);
  
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