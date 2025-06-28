// 用户代码管理工具函数

// 从URL参数中获取用户代码
export const getUserCodeFromUrl = () => {
  const path = window.location.pathname;
  const segments = path.split('/');
  
  // 检查路径格式：/{userid} 或 /{userid}/...
  if (segments.length >= 2 && segments[1]) {
    const userid = segments[1].toUpperCase();
    // 验证格式：4个字符，包含大写字母和数字
    if (userid.length === 4 && /^[A-Z0-9]{4}$/.test(userid)) {
      return userid;
    }
  }
  
  return null;
};

// 验证用户代码格式
export const validateUserCode = (code) => {
  if (!code) return false;
  const upperCode = code.toUpperCase();
  return upperCode.length === 4 && /^[A-Z0-9]{4}$/.test(upperCode);
};

// 获取用户代码（向后兼容）
export const getUserCode = () => {
  // 优先从URL获取
  const urlCode = getUserCodeFromUrl();
  if (urlCode) {
    return urlCode;
  }
  
  // 如果URL中没有，从localStorage获取作为备份
  const storedCode = localStorage.getItem('currentUserCode');
  if (storedCode && validateUserCode(storedCode)) {
    return storedCode.toUpperCase();
  }
  
  return null;
};

// 构建API路径前缀
export const buildRecordingPath = (sessionId, userCode = null) => {
  const code = userCode || getUserCodeFromUrl();
  if (!code) {
    throw new Error('无法获取用户代码，请检查URL格式');
  }
  return `recordings/${code}/${sessionId}`;
};

// 构建会话存储键
export const buildSessionStorageKey = (sessionId, userCode = null) => {
  const code = userCode || getUserCodeFromUrl();
  if (!code) {
    throw new Error('无法获取用户代码，请检查URL格式');
  }
  return `bound_recordings_${code}_${sessionId}`;
};

// 生成示例用户代码（仅用于演示）
export const generateUserCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 检查当前URL是否包含有效的用户代码
export const hasValidUserCode = () => {
  return getUserCodeFromUrl() !== null;
}; 