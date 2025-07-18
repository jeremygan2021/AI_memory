import React from 'react';

// 通用SVG图标组件
const SvgIcon = ({ 
  name, 
  width = 24, 
  height = 24, 
  color = "#3bb6a6", 
  className = "",
  style = {} 
}) => {
  const iconProps = {
    width,
    height,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    style
  };

  const icons = {
    // 宝宝图标
    baby: (
      <svg {...iconProps} viewBox="0 0 100 100">
        <circle cx="50" cy="35" r="20" fill={color} opacity="0.8"/>
        <ellipse cx="50" cy="65" rx="15" ry="20" fill={color} opacity="0.6"/>
        <circle cx="45" cy="30" r="2" fill="white"/>
        <circle cx="55" cy="30" r="2" fill="white"/>
        <path d="M 45 40 Q 50 45 55 40" stroke="white" strokeWidth="2" fill="none"/>
        <ellipse cx="35" cy="55" rx="5" ry="12" fill={color} opacity="0.7"/>
        <ellipse cx="65" cy="55" rx="5" ry="12" fill={color} opacity="0.7"/>
        <ellipse cx="45" cy="80" rx="5" ry="12" fill={color} opacity="0.7"/>
        <ellipse cx="55" cy="80" rx="5" ry="12" fill={color} opacity="0.7"/>
      </svg>
    ),

    // 云朵图标
    cloud: (
      <svg {...iconProps}>
        <path 
          d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" 
          fill={color}
        />
      </svg>
    ),

    // 麦克风图标
    microphone: (
      <svg {...iconProps}>
        <path 
          d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" 
          fill={color}
        />
        <path 
          d="M19 10v2a7 7 0 0 1-14 0v-2" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <line 
          x1="12" 
          y1="19" 
          x2="12" 
          y2="23" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        <line 
          x1="8" 
          y1="23" 
          x2="16" 
          y2="23" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </svg>
    ),

    // 相册图标
    album: (
      <svg {...iconProps}>
        <rect 
          x="3" 
          y="3" 
          width="18" 
          height="18" 
          rx="2" 
          ry="2" 
          stroke={color} 
          strokeWidth="2" 
          fill="none"
        />
        <circle cx="8.5" cy="8.5" r="1.5" fill={color}/>
        <path 
          d="M21 15l-5-5L5 21" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
      </svg>
    ),

    // 时间图标
    time: (
      <svg {...iconProps}>
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke={color} 
          strokeWidth="2" 
          fill="none"
        />
        <polyline 
          points="12,6 12,12 16,14" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    ),

    // 成长图标
    growth: (
      <svg {...iconProps}>
        <path 
          d="M3 21l6-6 4 4 8-8" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        <path 
          d="M17 9l4 0 0 4" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
      </svg>
    ),

    // 搜索图标
    search: (
      <svg {...iconProps}>
        <circle 
          cx="11" 
          cy="11" 
          r="8" 
          stroke={color} 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="m21 21-4.35-4.35" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    ),

    // 播放按钮图标
    play: (
      <svg {...iconProps}>
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill={color}
          opacity="0.9"
        />
        <polygon 
          points="10,8 16,12 10,16" 
          fill="white"
        />
      </svg>
    ),

    // 音乐图标
    music: (
      <svg {...iconProps}>
        {/* 文档主体 */}
        <path 
          d="M4 2v20c0 0.5 0.5 1 1 1h14c0.5 0 1-0.5 1-1V6l-4-4H5c-0.5 0-1 0.5-1 1z"
          fill="rgba(255, 255, 255, 0.9)"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* 折角 */}
        <path 
          d="M16 2v4h4"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 音符 - 主音符 */}
        <ellipse 
          cx="9" 
          cy="16" 
          rx="1.8" 
          ry="1.3" 
          fill={color}
        />
        
        {/* 音符 - 副音符 */}
        <ellipse 
          cx="15" 
          cy="18" 
          rx="1.8" 
          ry="1.3" 
          fill={color}
        />
        
        {/* 音符符杆 */}
        <path 
          d="M10.8 16v-6"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path 
          d="M16.8 18v-6"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* 连音线 */}
        <path 
          d="M10.8 10c4 0 6 1.5 6 2v1.5c-2-0.5-4-1.5-6-2V10z"
          fill={color}
          opacity="0.8"
        />
      </svg>
    ),

    // 快进图标
    fast: (
      <svg {...iconProps}>
        <polygon 
          points="5,4 11,12 5,20" 
          fill={color}
        />
        <polygon 
          points="13,4 19,12 13,20" 
          fill={color}
        />
      </svg>
    ),

    // 停止按钮图标
    stop: (
      <svg {...iconProps}>
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill={color}
          opacity="0.9"
        />
        <rect 
          x="9" 
          y="9" 
          width="6" 
          height="6" 
          fill="white"
        />
      </svg>
    )
  };

  return icons[name] || null;
};

export default SvgIcon; 