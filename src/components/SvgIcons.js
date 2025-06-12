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
    )
  };

  return icons[name] || null;
};

export default SvgIcon; 