import React from 'react';
import SvgIcon from './SvgIcons';
import './ModernSearchBox.css';

const ModernSearchBox = ({ 
  placeholder = "Search", 
  value = "", 
  onChange, 
  onSearch,
  onKeyPress,
  className = "",
  width = "100%",
  size = "medium", // small, medium, large
  theme = "default" // default, gradient
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  const sizeClasses = {
    small: "search-box-small",
    medium: "search-box-medium", 
    large: "search-box-large"
  };

  const themeClasses = {
    default: "",
    gradient: "theme-gradient"
  };

  return (
    <div className={`modern-search-box ${sizeClasses[size]} ${themeClasses[theme]} ${className}`} style={{ width }}>
      <input
        type="text"
        className="modern-search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
      />
      <button 
        className="modern-search-button"
        onClick={onSearch}
        type="button"
      >
        <SvgIcon 
          name="search" 
          width={size === 'large' ? 20 : size === 'small' ? 14 : 16} 
          height={size === 'large' ? 20 : size === 'small' ? 14 : 16} 
          color="rgba(59, 182, 166, 0.7)" 
        />
      </button>
    </div>
  );
};

export default ModernSearchBox; 