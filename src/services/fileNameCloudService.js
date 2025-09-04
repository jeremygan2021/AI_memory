// 文件名云端同步服务
// 基于现有的themeCloudService架构，实现用户自定义文件名的云端存储和同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 上传用户自定义文件名映射到云端
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID (可选，默认为'global')
 * @param {object} customNames - 自定义文件名映射对象 {objectKey: customName}
 * @returns {Promise<object>} 上传结果
 */
export const saveCustomNamesToCloud = async (userCode, sessionId = 'global', customNames = {}) => {
  try {
    console.log('开始保存自定义文件名到云端:', { userCode, sessionId, customNames });

    // 验证参数
    if (!userCode) {
      throw new Error('缺少必要参数: userCode');
    }

    if (!customNames || typeof customNames !== 'object') {
      throw new Error('customNames 必须是一个对象');
    }

    // 创建文件名映射数据
    const fileNameData = {
      customNames: customNames,
      lastUpdated: new Date().toISOString(),
      userCode: userCode,
      sessionId: sessionId,
      timestamp: Date.now(),
      version: '1.0'
    };

    // 检查是否已经有相同的文件名映射存在
    const existingInfo = localStorage.getItem(`filename_cloud_info_${userCode}_${sessionId}`);
    if (existingInfo) {
      try {
        const cloudInfo = JSON.parse(existingInfo);
        // 比较内容是否相同
        if (JSON.stringify(cloudInfo.customNames) === JSON.stringify(customNames)) {
          console.log('文件名映射未发生变化，跳过重复保存');
          return {
            success: true,
            objectKey: cloudInfo.objectKey,
            message: '文件名映射未变化，无需重新保存'
          };
        }
      } catch (e) {
        console.log('解析本地云端信息失败，继续保存新的文件名映射');
      }
    }

    // 生成文件名（添加时间戳避免重复，同时保持识别性）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `custom_names_${userCode}_${sessionId}_${timestamp}.txt`;
    const objectKey = `recordings/${userCode}/${sessionId}/${fileName}`;

    console.log('文件名映射数据:', fileNameData);
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const nameBlob = new Blob([JSON.stringify(fileNameData, null, 2)], {
      type: 'text/plain'
    });
    const nameFile = new File([nameBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', nameFile);

    // 构建上传URL
    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/${sessionId}`;
    uploadUrl.searchParams.append('folder', folderPath);

    console.log('上传URL:', uploadUrl.toString());

    // 发送上传请求
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('文件名映射上传响应:', result);

    if (!result.success) {
      throw new Error(result.message || '文件名映射保存失败');
    }

    // 将成功信息保存到本地，用于后续查询
    const saveInfo = {
      customNames,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      lastSaved: new Date().toISOString(),
      userCode,
      sessionId
    };

    localStorage.setItem(`filename_cloud_info_${userCode}_${sessionId}`, JSON.stringify(saveInfo));
    
    console.log('文件名映射保存到云端成功:', saveInfo);

    return {
      success: true,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '文件名映射已保存到云端'
    };

  } catch (error) {
    console.error('保存文件名映射到云端失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      message: '云端保存失败，继续使用本地存储'
    };
  }
};

/**
 * 从云端加载用户自定义文件名映射
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 文件名映射结果
 */
export const loadCustomNamesFromCloud = async (userCode, sessionId = 'global') => {
  try {
    console.log('开始从云端加载文件名映射:', { userCode, sessionId });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的文件列表
    const prefix = `recordings/${userCode}/${sessionId}/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取文件列表URL:', listUrl);

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

    console.log('云端文件列表:', files);

    // 查找文件名映射文件
    const nameFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      console.log('检查文件:', fileName, 'objectKey:', objectKey);
      
      // 检查文件是否在指定路径下并且是TXT文件
      const hasCorrectPath = objectKey.includes(`/${sessionId}/`);
      const isTxtFile = fileName.endsWith('.txt');
      
      // 查找固定名称的文件名映射文件，或包含custom_names关键字的文件，或者任何时间戳格式的TXT文件
      const isLatestFile = fileName === `custom_names_${userCode}_${sessionId}_latest.txt`;
      const hasNameKeyword = fileName.toLowerCase().includes('custom_names');
      const isTimestampFile = /^\d{8}_\d{6}_[a-f0-9]+\.txt$/.test(fileName); // 匹配时间戳格式
      
      const isNameFile = hasCorrectPath && isTxtFile && (isLatestFile || hasNameKeyword || isTimestampFile);
      
      console.log('文件检查详情:', {
        fileName,
        hasCorrectPath,
        isTxtFile,
        isLatestFile,
        hasNameKeyword,
        isTimestampFile,
        isNameFile
      });
      
      return isNameFile;
    });

    // 对文件名映射文件进行排序：latest文件优先，然后按时间排序
    nameFiles.sort((a, b) => {
      const aKey = a.object_key || a.objectKey || a.key || a.name || '';
      const bKey = b.object_key || b.objectKey || b.key || b.name || '';
      const aFileName = aKey.split('/').pop() || '';
      const bFileName = bKey.split('/').pop() || '';
      
      // latest文件优先
      if (aFileName.includes('_latest.txt')) return -1;
      if (bFileName.includes('_latest.txt')) return 1;
      
      // custom_names文件次优先
      if (aFileName.includes('custom_names') && !bFileName.includes('custom_names')) return -1;
      if (bFileName.includes('custom_names') && !aFileName.includes('custom_names')) return 1;
      
      // 然后按修改时间排序（最新的在前）
      const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
      const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
      return timeB - timeA;
    });

    if (nameFiles.length === 0) {
      console.log('云端未找到文件名映射文件，使用本地设置');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到文件名映射'
      };
    }

    console.log(`找到 ${nameFiles.length} 个潜在的文件名映射文件，开始逐一检查...`);
    console.log('找到的文件列表:', nameFiles.map(f => {
      const key = f.object_key || f.objectKey || f.key || f.name;
      return {
        fileName: key ? key.split('/').pop() : '',
        objectKey: key,
        lastModified: f.last_modified || f.lastModified || f.modified
      };
    }));

    // 循环尝试所有文件，找到第一个有效的文件名映射文件
    for (let i = 0; i < nameFiles.length; i++) {
      const file = nameFiles[i];
      const objectKey = file.object_key || file.objectKey || file.key || file.name;
      
      console.log(`尝试第 ${i + 1} 个文件:`, objectKey);

      try {
        // 构建OSS直链URL访问文件内容
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const directUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        
        console.log('直接访问OSS URL:', directUrl);

        const downloadResponse = await fetch(directUrl);
        if (!downloadResponse.ok) {
          console.log(`OSS访问失败 (HTTP ${downloadResponse.status})，尝试下一个文件`);
          continue;
        }

        const nameContent = await downloadResponse.text();
        console.log('文件内容:', nameContent.substring(0, 200) + '...');

        // 尝试解析为JSON
        let nameData;
        try {
          nameData = JSON.parse(nameContent);
        } catch (parseError) {
          console.log('不是有效的JSON，尝试下一个文件');
          continue;
        }

        // 检查是否为文件名映射文件
        if (nameData && nameData.customNames && typeof nameData.customNames === 'object') {
          console.log('找到有效的文件名映射文件!', nameData);
          
          // 更新本地云端信息记录
          const cloudInfo = {
            customNames: nameData.customNames,
            objectKey,
            lastLoaded: new Date().toISOString(),
            userCode,
            sessionId
          };
          localStorage.setItem(`filename_cloud_info_${userCode}_${sessionId}`, JSON.stringify(cloudInfo));

          return {
            success: true,
            customNames: nameData.customNames,
            lastUpdated: nameData.lastUpdated,
            source: 'cloud',
            message: '从云端加载文件名映射成功'
          };
        } else {
          console.log('文件不包含customNames，尝试下一个文件');
          continue;
        }
      } catch (error) {
        console.log(`处理文件失败: ${error.message}，尝试下一个文件`);
        continue;
      }
    }

    // 如果所有文件都不是有效的文件名映射文件
    console.log('所有文件都不是有效的文件名映射文件');
    
    return {
      success: false,
      fallback: 'local',
      message: '云端文件都不是有效的文件名映射文件'
    };

  } catch (error) {
    console.error('从云端加载文件名映射失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      source: 'local',
      message: '云端加载失败，使用本地文件名映射'
    };
  }
};

/**
 * 同步文件名映射（从本地上传到云端，或从云端下载到本地）
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @param {boolean} forceUpload - 是否强制上传本地数据到云端
 * @returns {Promise<object>} 同步结果
 */
export const syncCustomNames = async (userCode, sessionId = 'global', forceUpload = false) => {
  try {
    console.log('开始同步文件名映射:', { userCode, sessionId, forceUpload });

    // 获取本地文件名映射
    const localCustomNames = JSON.parse(localStorage.getItem('customNames') || '{}');
    
    if (forceUpload || Object.keys(localCustomNames).length > 0) {
      // 上传本地文件名映射到云端
      const uploadResult = await saveCustomNamesToCloud(userCode, sessionId, localCustomNames);
      
      if (uploadResult.success) {
        console.log('文件名映射上传到云端成功');
        return {
          success: true,
          action: 'uploaded_to_cloud',
          customNames: localCustomNames,
          message: '本地文件名映射已上传到云端'
        };
      } else {
        console.log('文件名映射上传失败，继续使用本地版本');
      }
    }

    // 从云端加载文件名映射
    const loadResult = await loadCustomNamesFromCloud(userCode, sessionId);
    
    if (loadResult.success && loadResult.customNames) {
      // 合并云端和本地的文件名映射
      const mergedNames = { ...loadResult.customNames, ...localCustomNames };
      
      // 更新本地存储
      localStorage.setItem('customNames', JSON.stringify(mergedNames));
      
      // 触发自定义名称更新事件，通知其他组件刷新
      window.dispatchEvent(new CustomEvent('customNamesUpdated', { 
        detail: { customNames: mergedNames }
      }));
      
      console.log('从云端同步文件名映射成功并合并到本地');
      return {
        success: true,
        action: 'loaded_from_cloud_and_merged',
        customNames: mergedNames,
        message: '已从云端同步文件名映射并合并到本地'
      };
    }

    // 使用本地文件名映射
    console.log('使用本地文件名映射');
    return {
      success: true,
      action: 'used_local',
      customNames: localCustomNames,
      message: '使用本地文件名映射'
    };

  } catch (error) {
    console.error('同步文件名映射失败:', error);
    
    const fallbackNames = JSON.parse(localStorage.getItem('customNames') || '{}');
    return {
      success: false,
      error: error.message,
      customNames: fallbackNames,
      action: 'fallback',
      message: '同步失败，使用本地文件名映射'
    };
  }
};

/**
 * 检查是否有云端文件名映射更新
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 检查结果
 */
export const checkCustomNamesCloudUpdate = async (userCode, sessionId = 'global') => {
  try {
    // 获取本地云端信息
    const localCloudInfo = JSON.parse(
      localStorage.getItem(`filename_cloud_info_${userCode}_${sessionId}`) || '{}'
    );

    if (!localCloudInfo.lastLoaded) {
      return { hasUpdate: true, reason: 'never_loaded' };
    }

    // 从云端重新获取最新信息
    const cloudResult = await loadCustomNamesFromCloud(userCode, sessionId);
    
    if (!cloudResult.success) {
      return { hasUpdate: false, reason: 'cloud_error' };
    }

    // 比较更新时间
    const localTime = new Date(localCloudInfo.lastLoaded).getTime();
    const cloudTime = new Date(cloudResult.lastUpdated || 0).getTime();

    return {
      hasUpdate: cloudTime > localTime,
      reason: cloudTime > localTime ? 'cloud_newer' : 'local_current',
      cloudNames: cloudResult.customNames,
      localNames: JSON.parse(localStorage.getItem('customNames') || '{}')
    };

  } catch (error) {
    console.error('检查文件名映射云端更新失败:', error);
    return { hasUpdate: false, reason: 'check_error', error: error.message };
  }
};

/**
 * 在文件上传后自动保存文件名映射到云端
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @param {string} objectKey - 文件的objectKey
 * @param {string} customName - 自定义文件名
 * @returns {Promise<object>} 保存结果
 */
export const saveFileNameAfterUpload = async (userCode, sessionId, objectKey, customName) => {
  try {
    if (!userCode || !objectKey || !customName) {
      return { success: false, message: '参数不完整' };
    }

    // 更新本地存储中的文件名映射
    const localCustomNames = JSON.parse(localStorage.getItem('customNames') || '{}');
    localCustomNames[objectKey] = customName;
    localStorage.setItem('customNames', JSON.stringify(localCustomNames));

    // 上传到云端
    const result = await saveCustomNamesToCloud(userCode, sessionId, localCustomNames);
    
    // 如果成功保存到云端，触发自定义名称更新事件
    if (result.success) {
      window.dispatchEvent(new CustomEvent('customNamesUpdated', { 
        detail: { customNames: localCustomNames }
      }));
    }
    
    return {
      success: result.success,
      message: result.success ? '文件名已保存到云端' : '文件名保存失败，但已保存到本地'
    };

  } catch (error) {
    console.error('文件上传后保存文件名失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 从用户所有会话中加载自定义文件名映射
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 加载结果
 */
export const loadAllCustomNamesFromAllSessions = async (userCode) => {
  try {
    console.log('开始从所有会话加载文件名映射:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的所有文件（降低max_keys避免422错误）
    const prefix = `recordings/${userCode}/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取所有文件列表URL:', listUrl);

    let response;
    let result;
    
    try {
      response = await fetch(listUrl);
      
      if (!response.ok) {
        // 如果请求失败，且是422错误，尝试使用更小的max_keys值
        if (response.status === 422) {
          console.log('HTTP 422 错误，尝试使用更小的max_keys参数...');
          const fallbackUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=500`;
          console.log('回退URL:', fallbackUrl);
          
          const fallbackResponse = await fetch(fallbackUrl);
          if (!fallbackResponse.ok) {
            throw new Error(`获取文件列表失败 (fallback): HTTP ${fallbackResponse.status}`);
          }
          response = fallbackResponse;
        } else {
          throw new Error(`获取文件列表失败: HTTP ${response.status}`);
        }
      }
      
      result = await response.json();
    } catch (error) {
      console.error('获取文件列表时发生错误:', error);
      throw error;
    }

    const files = result.files || result.data || result.objects || result.items || result.results || [];
    console.log('用户所有云端文件数量:', files.length);

    return await processAllSessionsFileNameMappings(files, userCode);
  } catch (error) {
    console.error('从所有会话加载文件名映射失败:', error);
    
    return {
      success: false,
      error: error.message,
      allCustomNames: {},
      sessionsCount: 0,
      message: '加载失败，返回空映射'
    };
  }
};

/**
 * 处理所有会话的文件名映射
 * @param {Array} files - 文件列表
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 处理结果
 */
const processAllSessionsFileNameMappings = async (files, userCode) => {
  // 查找所有的文件名映射文件
  const nameFiles = files.filter(file => {
    const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
    const fileName = objectKey.split('/').pop() || '';
    
    // 检查文件是否是TXT文件
    const isTxtFile = fileName.endsWith('.txt');
    
    // 查找所有可能的文件名映射文件
    const isLatestFile = fileName.includes('custom_names_') && fileName.includes('_latest.txt');
    const hasNameKeyword = fileName.toLowerCase().includes('custom_names');
    const isTimestampFile = /^\d{8}_\d{6}_[a-f0-9]+\.txt$/.test(fileName); // 时间戳格式
    
    const isNameFile = isTxtFile && (isLatestFile || hasNameKeyword || isTimestampFile);
    
    return isNameFile;
  });

  console.log(`找到 ${nameFiles.length} 个潜在的文件名映射文件`);

  // 按会话分组
  const sessionFiles = {};
  nameFiles.forEach(file => {
    const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
    const pathParts = objectKey.split('/');
    
    if (pathParts.length >= 3) {
      const sessionId = pathParts[2]; // recordings/userCode/sessionId/file.txt
      
      if (!sessionFiles[sessionId]) {
        sessionFiles[sessionId] = [];
      }
      sessionFiles[sessionId].push(file);
    }
  });

  console.log('按会话分组的文件:', Object.keys(sessionFiles));

  // 从每个会话加载文件名映射
  const allCustomNames = {};
  let loadedSessionsCount = 0;

  for (const [sessionId, sessionFilesList] of Object.entries(sessionFiles)) {
    console.log(`加载会话 ${sessionId} 的文件名映射...`);
    
    // 按时间排序，选择最新的文件
    sessionFilesList.sort((a, b) => {
      const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
      const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
      return timeB - timeA;
    });

    // 尝试加载每个文件，直到找到有效的文件名映射
    for (const file of sessionFilesList) {
      const objectKey = file.object_key || file.objectKey || file.key || file.name;
      
      try {
        // 构建OSS直链URL访问文件内容
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const directUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        
        const downloadResponse = await fetch(directUrl);
        if (!downloadResponse.ok) {
          continue;
        }

        const nameContent = await downloadResponse.text();
        
        // 尝试解析为JSON
        let nameData;
        try {
          nameData = JSON.parse(nameContent);
        } catch (parseError) {
          continue;
        }

        // 检查是否为文件名映射文件
        if (nameData && nameData.customNames && typeof nameData.customNames === 'object') {
          console.log(`会话 ${sessionId} 加载了 ${Object.keys(nameData.customNames).length} 个文件名映射`);
          
          // 合并到总的映射中
          Object.assign(allCustomNames, nameData.customNames);
          loadedSessionsCount++;
          break; // 找到有效文件后跳出循环
        }
      } catch (error) {
        console.log(`处理会话 ${sessionId} 的文件失败:`, error.message);
        continue;
      }
    }
  }

  console.log(`成功从 ${loadedSessionsCount} 个会话加载了 ${Object.keys(allCustomNames).length} 个文件名映射`);

  // 触发自定义名称更新事件，通知其他组件刷新
  window.dispatchEvent(new CustomEvent('customNamesUpdated', { 
    detail: { customNames: allCustomNames }
  }));

  return {
    success: true,
    allCustomNames,
    sessionsCount: loadedSessionsCount,
    totalMappings: Object.keys(allCustomNames).length,
    message: `成功从 ${loadedSessionsCount} 个会话加载文件名映射`
  };
};

export default {
  saveCustomNamesToCloud,
  loadCustomNamesFromCloud,
  syncCustomNames,
  checkCustomNamesCloudUpdate,
  saveFileNameAfterUpload,
  loadAllCustomNamesFromAllSessions
};
