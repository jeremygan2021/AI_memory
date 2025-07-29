// 环境检测工具

// 检测是否为微信小程序环境
export const isWechatMiniProgram = () => {
  // 检查微信小程序特有的全局对象
  // eslint-disable-next-line no-undef
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    return true;
  }
  
  // 检查Taro环境
  // eslint-disable-next-line no-undef
  if (typeof Taro !== 'undefined' && Taro.getSystemInfoSync) {
    return true;
  }
  
  // 检查小程序特有的userAgent
  if (navigator.userAgent.includes('miniprogram')) {
    return true;
  }
  
  return false;
};

// 检测是否为H5环境
export const isH5Environment = () => {
  return !isWechatMiniProgram();
};

// 获取当前环境类型
export const getEnvironmentType = () => {
  if (isWechatMiniProgram()) {
    return 'miniprogram';
  }
  return 'h5';
};

// 检测是否为移动端
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 检测是否为平板设备
export const isTabletDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad|android(?!.*mobile)/i.test(userAgent) || 
         (window.innerWidth >= 768 && window.innerWidth <= 1366);
};

// 获取设备类型
export const getDeviceType = () => {
  if (isTabletDevice()) {
    return 'tablet';
  }
  if (isMobileDevice()) {
    return 'mobile';
  }
  return 'desktop';
};

// 获取完整的设备信息
export const getDeviceInfo = () => {
  return {
    environment: getEnvironmentType(),
    device: getDeviceType(),
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isMiniProgram: isWechatMiniProgram(),
    isH5: isH5Environment(),
    userAgent: navigator.userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  };
}; 