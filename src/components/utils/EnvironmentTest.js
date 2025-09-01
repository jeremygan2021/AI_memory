import React from 'react';
import { getDeviceInfo, isWechatMiniProgram, isH5Environment } from '../../utils/environment';
import './EnvironmentTest.css';

const EnvironmentTest = () => {
  const deviceInfo = getDeviceInfo();

  return (
    <div className="environment-test">
      <h2>环境检测结果</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">环境类型:</span>
          <span className="value">{deviceInfo.environment}</span>
        </div>
        <div className="info-item">
          <span className="label">设备类型:</span>
          <span className="value">{deviceInfo.device}</span>
        </div>
        <div className="info-item">
          <span className="label">是否小程序:</span>
          <span className="value">{isWechatMiniProgram() ? '是' : '否'}</span>
        </div>
        <div className="info-item">
          <span className="label">是否H5:</span>
          <span className="value">{isH5Environment() ? '是' : '否'}</span>
        </div>
        <div className="info-item">
          <span className="label">是否移动端:</span>
          <span className="value">{deviceInfo.isMobile ? '是' : '否'}</span>
        </div>
        <div className="info-item">
          <span className="label">是否平板:</span>
          <span className="value">{deviceInfo.isTablet ? '是' : '否'}</span>
        </div>
        <div className="info-item">
          <span className="label">屏幕宽度:</span>
          <span className="value">{deviceInfo.screenWidth}px</span>
        </div>
        <div className="info-item">
          <span className="label">屏幕高度:</span>
          <span className="value">{deviceInfo.screenHeight}px</span>
        </div>
        <div className="info-item full-width">
          <span className="label">User Agent:</span>
          <span className="value">{deviceInfo.userAgent}</span>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentTest; 