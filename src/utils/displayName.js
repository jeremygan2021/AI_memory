// 自定义名称与显示名称工具
import { saveFileNameAfterUpload, syncCustomNames } from '../services/fileNameCloudService.js';

// 存取 localStorage 中的自定义名称映射
const STORAGE_KEY = 'customNames';

export function sanitizeCustomName(name) {
  if (!name || typeof name !== 'string') return '未命名';
  let v = name.trim();
  if (!v) v = '未命名';
  // 移除路径非法字符，保留中英文、数字、空格、- _ () []
  v = v.replace(/[\\/:*?"<>|#%&{}$!@`~^+=,;]/g, '');
  // 将连续空白压缩为单个空格
  v = v.replace(/\s+/g, ' ');
  // 限制长度
  if (v.length > 60) v = v.slice(0, 60);
  return v || '未命名';
}

export function buildUploadFileName(customName, uniqueSuffix, extension) {
  const safeName = sanitizeCustomName(customName).replace(/\s+/g, '_');
  const ext = (extension || '').replace(/^\./, '').toLowerCase();
  const suffix = String(uniqueSuffix);
  // 重要：最后一个下划线后保留唯一ID，便于现有解析逻辑
  return ext ? `${safeName}_${suffix}.${ext}` : `${safeName}_${suffix}`;
}

export function getCustomName(objectKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map && typeof map === 'object' ? (map[objectKey] || null) : null;
  } catch {
    return null;
  }
}

export function setCustomName(objectKey, customName) {
  try {
    const safe = sanitizeCustomName(customName);
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[objectKey] = safe;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 忽略存储失败
  }
}

/**
 * 设置自定义文件名并同步到云端
 * @param {string} objectKey - 文件的objectKey
 * @param {string} customName - 自定义名称
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<boolean>} 是否成功
 */
export async function setCustomNameWithCloudSync(objectKey, customName, userCode, sessionId = 'global') {
  try {
    // 先保存到本地
    setCustomName(objectKey, customName);
    
    // 如果有用户代码，则同步到云端
    if (userCode) {
      const result = await saveFileNameAfterUpload(userCode, sessionId, objectKey, customName);
      console.log('文件名云端同步结果:', result);
      return result.success;
    }
    
    return true;
  } catch (error) {
    console.error('设置自定义文件名并同步到云端失败:', error);
    return false;
  }
}

/**
 * 从云端同步文件名映射到本地
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 同步结果
 */
export async function syncCustomNamesFromCloud(userCode, sessionId = 'global') {
  try {
    if (!userCode) {
      return { success: false, message: '缺少用户代码' };
    }
    
    const result = await syncCustomNames(userCode, sessionId);
    console.log('文件名云端同步结果:', result);
    
    // 触发自定义名称更新事件，通知其他组件刷新
    window.dispatchEvent(new CustomEvent('customNamesUpdated', { 
      detail: { customNames: result.customNames || {} }
    }));
    
    return result;
  } catch (error) {
    console.error('从云端同步文件名映射失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 从所有会话的云端同步文件名映射到本地
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 同步结果
 */
export async function syncAllCustomNamesFromCloud(userCode) {
  try {
    if (!userCode) {
      return { success: false, message: '缺少用户代码' };
    }
    
    console.log('开始从所有会话同步文件名映射...');
    
    // 导入云端服务（动态导入避免循环依赖）
    const { loadAllCustomNamesFromAllSessions } = await import('../services/fileNameCloudService.js');
    
    // 从所有会话加载文件名映射
    const result = await loadAllCustomNamesFromAllSessions(userCode);
    console.log('全量文件名云端同步结果:', result);
    
    if (result.success && result.allCustomNames) {
      // 将所有文件名映射合并到本地存储
      const localCustomNames = JSON.parse(localStorage.getItem('customNames') || '{}');
      const mergedNames = { ...localCustomNames, ...result.allCustomNames };
      localStorage.setItem('customNames', JSON.stringify(mergedNames));
      
      // 触发自定义名称更新事件，通知其他组件刷新
      window.dispatchEvent(new CustomEvent('customNamesUpdated', { 
        detail: { customNames: mergedNames }
      }));
      
      return {
        success: true,
        action: 'loaded_all_sessions',
        customNames: mergedNames,
        sessionsCount: result.sessionsCount || 0,
        message: `已从 ${result.sessionsCount || 0} 个会话同步文件名映射`
      };
    }
    
    return result;
  } catch (error) {
    console.error('从所有会话同步文件名映射失败:', error);
    return { success: false, error: error.message };
  }
}

export function deriveDisplayNameFromFileName(fileName) {
  if (!fileName) return '';
  const nameWithoutExt = String(fileName).replace(/\.[^/.]+$/, '');
  // 如果包含下划线，移除最后一个下划线及其后的ID片段
  if (nameWithoutExt.includes('_')) {
    const parts = nameWithoutExt.split('_');
    if (parts.length > 1) {
      const base = parts.slice(0, -1).join('_');
      return base || nameWithoutExt;
    }
  }
  return nameWithoutExt;
}


