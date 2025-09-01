import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './NavigationTest.css';

const NavigationTest = () => {
  const location = useLocation();
  const params = useParams();

  const testNavigation = () => {
    console.log('当前路径:', location.pathname);
    console.log('URL参数:', params);
    console.log('完整URL:', window.location.href);
    
    // 测试从路径中解析用户ID
    const pathSegments = location.pathname.split('/');
    const useridFromPath = pathSegments.find(segment => /^[A-Z0-9]{4}$/.test(segment));
    console.log('从路径解析的用户ID:', useridFromPath);
    
    // 测试跳转
    if (useridFromPath) {
      const randomId = Math.random().toString(36).substr(2, 8);
      console.log('测试跳转到录音页面:', `/${useridFromPath}/${randomId}`);
      // 这里可以添加实际的跳转逻辑
    }
  };

  return (
    <div className="navigation-test">
      <h3>导航测试</h3>
      <div className="test-info">
        <p><strong>当前路径:</strong> {location.pathname}</p>
        <p><strong>URL参数:</strong> {JSON.stringify(params)}</p>
        <p><strong>完整URL:</strong> {window.location.href}</p>
        <button onClick={testNavigation} className="test-btn">
          测试导航
        </button>
      </div>
    </div>
  );
};

export default NavigationTest; 