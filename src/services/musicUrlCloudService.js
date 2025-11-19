// 音乐URL云端同步服务
// 基于现有的babyInfoCloudService架构，实现音乐URL的云端存储和同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 保存音乐URL到云端
 * @param {string} userCode - 用户代码
 * @param {string} musicUrl - 音乐URL
 * @returns {Promise<object>} 保存结果
 */
export const saveMusicUrlToCloud = async (userCode, musicUrl) => {
  try {
    console.log('开始保存音乐URL到云端:', { userCode, musicUrl });

    // 验证参数
    if (!userCode) {
      throw new Error('缺少必要参数: userCode');
    }

    if (!musicUrl) {
      throw new Error('缺少必要参数: musicUrl');
    }

    // 验证URL格式
    try {
      new URL(musicUrl);
    } catch (e) {
      throw new Error('音乐URL格式不正确');
    }

    // 创建音乐URL数据
    const musicUrlData = {
      musicUrl: musicUrl,
      lastUpdated: new Date().toISOString(),
      userCode: userCode,
      timestamp: Date.now(),
      version: '1.0'
    };

    // 检查是否已经有相同的音乐URL存在
    const existingMusic = localStorage.getItem(`music_url_cloud_${userCode}`);
    if (existingMusic) {
      try {
        const cloudMusic = JSON.parse(existingMusic);
        // 比较内容是否相同
        if (cloudMusic.musicUrl === musicUrl) {
          console.log('音乐URL未发生变化，跳过重复保存');
          return {
            success: true,
            objectKey: cloudMusic.objectKey,
            message: '音乐URL未变化，无需重新保存'
          };
        }
      } catch (e) {
        console.log('解析本地音乐URL失败，继续保存新的音乐URL');
      }
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `music_url_${userCode}_${timestamp}.txt`;
    const objectKey = `recordings/${userCode}/music_url/${fileName}`;

    console.log('音乐URL数据:', musicUrlData);
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const musicBlob = new Blob([JSON.stringify(musicUrlData, null, 2)], {
      type: 'text/plain'
    });
    const musicFile = new File([musicBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', musicFile);

    // 构建上传URL
    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/music_url`;
    uploadUrl.searchParams.append('folder', folderPath);

    console.log('上传URL:', uploadUrl.toString());

    // 发送上传请求
    console.log('发送上传请求到:', uploadUrl.toString());
    console.log('请求数据:', formData);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('上传响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('上传失败响应内容:', errorText);
      throw new Error(`上传失败: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('音乐URL上传响应:', result);

    if (!result.success) {
      throw new Error(result.message || '音乐URL保存失败');
    }

    // 将成功信息保存到本地，用于后续查询
    const saveInfo = {
      musicUrl,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      lastSaved: new Date().toISOString(),
      userCode
    };

    localStorage.setItem(`music_url_cloud_${userCode}`, JSON.stringify(saveInfo));
    
    console.log('音乐URL保存到云端成功:', saveInfo);

    return {
      success: true,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '音乐URL已保存到云端'
    };

  } catch (error) {
    console.error('保存音乐URL到云端失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      message: '云端保存失败，继续使用本地存储'
    };
  }
};

/**
 * 从云端加载音乐URL
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 加载结果
 */
export const loadMusicUrlFromCloud = async (userCode) => {
  try {
    console.log('开始从云端加载音乐URL:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的音乐URL文件列表
    const prefix = `recordings/${userCode}/music_url/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取音乐URL文件列表URL:', listUrl);

    let response = await fetch(listUrl);
    
    if (!response.ok) {
      // 如果请求失败，且是422错误，尝试使用更小的max_keys值
      if (response.status === 422) {
        console.log('HTTP 422 错误，尝试使用更小的max_keys参数...');
        const fallbackUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=500`;
        console.log('回退URL:', fallbackUrl);
        
        response = await fetch(fallbackUrl);
        if (!response.ok) {
          throw new Error(`获取文件列表失败 (fallback): HTTP ${response.status}`);
        }
      } else {
        throw new Error(`获取文件列表失败: HTTP ${response.status}`);
      }
    }

    const result = await response.json();
    const files = result.files || result.data || result.objects || result.items || result.results || [];

    console.log('云端音乐URL文件列表:', files);

    // 查找音乐URL文件
    const musicUrlFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      
      // 检查文件是否在指定路径下并且是TXT文件
      const hasCorrectPath = objectKey.includes('/music_url/');
      const isTxtFile = fileName.endsWith('.txt');
      
      return hasCorrectPath && isTxtFile;
    });

    // 按修改时间排序（最新的在前）
    musicUrlFiles.sort((a, b) => {
      const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
      const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
      return timeB - timeA;
    });

    if (musicUrlFiles.length === 0) {
      console.log('云端未找到音乐URL文件，使用本地设置');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到音乐URL'
      };
    }

    // 获取最新的音乐URL文件
    const latestFile = musicUrlFiles[0];
    const objectKey = latestFile.object_key || latestFile.objectKey || latestFile.key || latestFile.name || '';
    const fileUrl = latestFile.url || latestFile.download_url || latestFile.downloadUrl || '';

    console.log('找到最新音乐URL文件:', { objectKey, fileUrl });

    // 下载并解析文件内容
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`下载音乐URL文件失败: HTTP ${fileResponse.status}`);
    }

    const fileContent = await fileResponse.text();
    const musicUrlData = JSON.parse(fileContent);

    console.log('音乐URL数据:', musicUrlData);

    // 验证数据格式
    if (!musicUrlData.musicUrl) {
      throw new Error('音乐URL文件格式不正确');
    }

    // 将成功信息保存到本地
    const saveInfo = {
      musicUrl: musicUrlData.musicUrl,
      objectKey,
      cloudUrl: fileUrl,
      lastLoaded: new Date().toISOString(),
      userCode
    };

    localStorage.setItem(`music_url_cloud_${userCode}`, JSON.stringify(saveInfo));
    
    console.log('音乐URL从云端加载成功:', saveInfo);

    return {
      success: true,
      musicUrl: musicUrlData.musicUrl,
      objectKey,
      cloudUrl: fileUrl,
      message: '音乐URL已从云端加载'
    };

  } catch (error) {
    console.error('从云端加载音乐URL失败:', error);
    
    // 尝试从本地缓存获取
    try {
      const cachedMusic = localStorage.getItem(`music_url_cloud_${userCode}`);
      if (cachedMusic) {
        const musicInfo = JSON.parse(cachedMusic);
        console.log('使用本地缓存的音乐URL:', musicInfo);
        
        return {
          success: true,
          musicUrl: musicInfo.musicUrl,
          objectKey: musicInfo.objectKey,
          cloudUrl: musicInfo.cloudUrl,
          fallback: 'local',
          message: '使用本地缓存的音乐URL'
        };
      }
    } catch (e) {
      console.log('本地缓存的音乐URL解析失败:', e);
    }
    
    return {
      success: false,
      error: error.message,
      fallback: 'none',
      message: '无法加载音乐URL'
    };
  }
};

/**
 * 删除云端的音乐URL
 * @param {string} userCode - 用户代码
 * @param {string} objectKey - 文件对象键
 * @returns {Promise<object>} 删除结果
 */
export const deleteMusicUrlFromCloud = async (userCode, objectKey) => {
  try {
    console.log('开始删除云端音乐URL:', { userCode, objectKey });

    if (!userCode || !objectKey) {
      throw new Error('缺少必要参数');
    }

    // 构建删除URL
    const deleteUrl = `${API_BASE_URL}/delete`;
    const formData = new FormData();
    formData.append('object_key', objectKey);

    console.log('删除URL:', deleteUrl);

    // 发送删除请求
    const response = await fetch(deleteUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`删除失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('音乐URL删除响应:', result);

    if (!result.success) {
      throw new Error(result.message || '音乐URL删除失败');
    }

    // 清除本地缓存
    localStorage.removeItem(`music_url_cloud_${userCode}`);
    
    console.log('音乐URL从云端删除成功');

    return {
      success: true,
      message: '音乐URL已从云端删除'
    };

  } catch (error) {
    console.error('删除云端音乐URL失败:', error);
    
    return {
      success: false,
      error: error.message,
      message: '删除音乐URL失败'
    };
  }
};