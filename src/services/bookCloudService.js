// 回忆书籍（PDF）云端同步服务
// 复用现有上传/列出接口规范：
// - 列表：GET `${API_BASE_URL}/files?prefix=recordings/${userCode}/books/&max_keys=1000`
// - 上传：POST `${API_BASE_URL}/upload?folder=recordings/${userCode}/books`

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 上传PDF到云端（仅允许application/pdf）
 * @param {string} userCode
 * @param {File} file - 必须是PDF
 * @returns {Promise<object>}
 */
export const uploadPdfToCloud = async (userCode, file) => {
  try {
    if (!userCode) throw new Error('缺少用户代码');
    if (!file) throw new Error('未选择文件');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) throw new Error('仅支持上传PDF文件');

    // 检查用户是否已有PDF文件
    const existingPdfs = await listPdfsFromCloud(userCode);
    if (existingPdfs.success && existingPdfs.files.length > 0) {
      return {
        success: false,
        error: '每个用户只能上传一个PDF文件，请先删除现有文件再上传新文件'
      };
    }

    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/books`;
    uploadUrl.searchParams.append('folder', folderPath);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`上传失败: HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || '上传失败');

    return {
      success: true,
      cloudUrl: result.url || result.cloudUrl,
      objectKey: result.key || result.objectKey,
      message: 'PDF已上传到云端'
    };
  } catch (error) {
    console.error('上传PDF失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 删除云端PDF文件
 * @param {string} userCode
 * @param {string} objectKey - 要删除的文件的objectKey
 * @returns {Promise<object>}
 */
export const deletePdfFromCloud = async (userCode, objectKey) => {
  try {
    if (!userCode) throw new Error('缺少用户代码');
    if (!objectKey) throw new Error('缺少文件标识');

    // 使用标准REST API删除方法，与其他组件保持一致
    const deleteUrl = `${API_BASE_URL}/files/${encodeURIComponent(objectKey)}`;
    const response = await fetch(deleteUrl, { 
      method: 'DELETE'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          message: 'PDF已从云端删除'
        };
      } else {
        throw new Error(result.message || '删除操作未成功');
      }
    } else {
      throw new Error(`删除失败: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('删除PDF失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取云端PDF列表
 * @param {string} userCode
 * @returns {Promise<{success:boolean, files:Array}>}
 */
export const listPdfsFromCloud = async (userCode) => {
  try {
    if (!userCode) throw new Error('缺少用户代码');
    const prefix = `recordings/${userCode}/books/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    let response = await fetch(listUrl);
    if (!response.ok) {
      if (response.status === 422) {
        const fallbackUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=500`;
        response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error(`获取文件列表失败 (fallback): HTTP ${response.status}`);
      } else {
        throw new Error(`获取文件列表失败: HTTP ${response.status}`);
      }
    }
    const result = await response.json();
    const rawFiles = result.files || result.data || result.objects || result.items || result.results || [];

    const files = rawFiles
      .map((file) => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
        if (!objectKey) return null;
        const fileName = objectKey.split('/').pop() || '';
        const isPdf = fileName.toLowerCase().endsWith('.pdf') || (file.content_type || '').includes('pdf');
        if (!isPdf) return null;

        // 直链构造
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const directUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';

        return {
          objectKey,
          name: fileName,
          url: directUrl,
          lastModified: file.last_modified || file.lastModified || file.modified || '',
          size: file.size || 0,
          contentType: file.content_type || 'application/pdf'
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return { success: true, files };
  } catch (error) {
    console.error('获取PDF列表失败:', error);
    return { success: false, error: error.message, files: [] };
  }
};

const bookCloudService = {
  uploadPdfToCloud,
  listPdfsFromCloud,
  deletePdfFromCloud
};

export default bookCloudService;


