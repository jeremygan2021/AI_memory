// 自定义名称与显示名称工具

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


