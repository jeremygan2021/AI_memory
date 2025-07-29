import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './MiniProgramTabBar.css';

const MiniProgramTabBar = ({ activeTab = 'home' }) => {
  const navigate = useNavigate();
  const { userid } = useParams();

  const handleTabClick = (tab) => {
    console.log('导航栏点击:', tab);
    console.log('当前useParams userid:', userid);
    console.log('当前路径:', window.location.pathname);
    
    // 从当前URL中获取用户ID，如果useParams中没有则从路径中解析
    let currentUserid = userid;
    if (!currentUserid) {
      const pathSegments = window.location.pathname.split('/');
      currentUserid = pathSegments.find(segment => /^[A-Z0-9]{4}$/.test(segment));
      console.log('从路径解析的用户ID:', currentUserid);
    }
    
    if (!currentUserid) {
      console.error('无法获取用户ID，跳转失败');
      alert('无法获取用户ID，请确保URL格式正确');
      return;
    }
    
    console.log('准备跳转到:', tab, '用户ID:', currentUserid);
    
    try {
      switch (tab) {
        case 'home':
          console.log('跳转到首页:', `/${currentUserid}`);
          navigate(`/${currentUserid}`);
          break;
        case 'record':
          // 生成唯一的会话ID（8位随机字符）
          const randomId = Math.random().toString(36).substr(2, 8);
          console.log('跳转到录音页面:', `/${currentUserid}/${randomId}`);
          navigate(`/${currentUserid}/${randomId}`);
          break;
        case 'upload':
          // 生成唯一的会话ID（6位随机字符）
          const sessionId = Math.random().toString(36).substr(2, 6);
          console.log('跳转到上传页面:', `/${currentUserid}/upload-media/${sessionId}`);
          navigate(`/${currentUserid}/upload-media/${sessionId}`);
          break;
        case 'profile':
          console.log('跳转到我的页面:', `/${currentUserid}/profile`);
          navigate(`/${currentUserid}/profile`);
          break;
        default:
          console.warn('未知的标签页:', tab);
          break;
      }
    } catch (error) {
      console.error('导航跳转失败:', error);
      alert('导航跳转失败，请重试');
    }
  };

  return (
    <div className="miniprogram-tab-bar">
      <div 
        className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => handleTabClick('home')}
      >
        <div className="tab-icon">
          <img 
            src={activeTab === 'home' ? '/asset/home-active.png' : '/asset/home.png'} 
            alt="首页"
            className="tab-icon-img"
            onError={(e) => {
              console.error('图标加载失败:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="tab-text">首页</div>
      </div>
      
      <div 
        className={`tab-item ${activeTab === 'record' ? 'active' : ''}`}
        onClick={() => handleTabClick('record')}
      >
        <div className="tab-icon">
          <img 
            src={activeTab === 'record' ? '/asset/record-active.png' : '/asset/record.png'} 
            alt="录音"
            className="tab-icon-img"
            onError={(e) => {
              console.error('图标加载失败:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="tab-text">录音</div>
      </div>
      
      <div 
        className={`tab-item ${activeTab === 'upload' ? 'active' : ''}`}
        onClick={() => handleTabClick('upload')}
      >
        <div className="tab-icon">
          <img 
            src={activeTab === 'upload' ? '/asset/upload-active.png' : '/asset/upload.png'} 
            alt="上传"
            className="tab-icon-img"
            onError={(e) => {
              console.error('图标加载失败:', e.target.src);
              // e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="tab-text">上传</div>
      </div>
      
      <div 
        className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => handleTabClick('profile')}
      >
        <div className="tab-icon">
          <div className="profile-icon">👤</div>
        </div>
        <div className="tab-text">我的</div>
      </div>
    </div>
  );
};

export default MiniProgramTabBar; 