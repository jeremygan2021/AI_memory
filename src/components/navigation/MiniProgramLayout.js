import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MiniProgramTabBar from './MiniProgramTabBar';
import { isWechatMiniProgram } from '../../utils/environment';
import './MiniProgramLayout.css';

const MiniProgramLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路径确定激活的标签页
  const getActiveTab = () => {
    const pathname = location.pathname;
    
    // 首页路径
    if (pathname === '/' || /^\/[A-Z0-9]{4}$/.test(pathname)) {
      return 'home';
    }
    
    // 录音页面路径
    if (/^\/[A-Z0-9]{4}\/[a-zA-Z0-9]{8}$/.test(pathname)) {
      return 'record';
    }
    
    // 上传页面路径
    if (/^\/[A-Z0-9]{4}\/upload-media\/[a-zA-Z0-9]+$/.test(pathname)) {
      return 'upload';
    }
    
    // 我的页面路径
    if (/^\/[A-Z0-9]{4}\/profile$/.test(pathname)) {
      return 'profile';
    }
    
    // 默认返回首页
    return 'home';
  };

  // 检查是否为登录页面（没有用户代码的页面）
  const isLoginPage = () => {
    const pathname = location.pathname;
    // 根路径或没有用户代码的路径
    return pathname === '/' || !/^\/[A-Z0-9]{4}/.test(pathname);
  };

  // 如果不是小程序环境，直接返回子组件
  if (!isWechatMiniProgram()) {
    return children;
  }

  // 如果是登录页面，不显示底部导航栏
  if (isLoginPage()) {
    return (
      <div className="miniprogram-layout">
        <div className="miniprogram-content no-tabbar">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="miniprogram-layout">
      {/* 主内容区域 */}
      <div className="miniprogram-content">
        {children}
      </div>
      
      {/* 底部导航栏 */}
      <MiniProgramTabBar activeTab={getActiveTab()} />
    </div>
  );
};

export default MiniProgramLayout; 