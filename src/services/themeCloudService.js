// 主题云端存储服务
// 参考评论系统的云端保存机制实现主题的云端同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 保存主题设置到云端
 * @param {string} userCode - 用户代码
 * @param {string} themeId - 主题ID
 * @param {string} sessionId - 会话ID (可选，用于会话级别的主题设置)
 * @returns {Promise<object>} 保存结果
 */
export const saveThemeToCloud = async (userCode, themeId, sessionId = 'global') => {
  try {
    console.log('开始保存主题到云端:', { themeId, userCode, sessionId });

    // 验证参数
    if (!themeId || !userCode) {
      throw new Error('缺少必要参数: themeId, userCode');
    }

    // 创建主题文件数据
    const themeFileData = {
      themeId: themeId,
      lastUpdated: new Date().toISOString(),
      userCode: userCode,
      sessionId: sessionId,
      timestamp: Date.now()
    };

    // 检查是否已经有相同主题的文件存在
    const existingThemeInfo = localStorage.getItem(`theme_cloud_info_${userCode}_${sessionId}`);
    if (existingThemeInfo) {
      try {
        const cloudInfo = JSON.parse(existingThemeInfo);
        if (cloudInfo.themeId === themeId) {
          console.log('主题未发生变化，跳过重复保存');
          return {
            success: true,
            themeId,
            objectKey: cloudInfo.objectKey,
            message: '主题未变化，无需重新保存'
          };
        }
      } catch (e) {
        console.log('解析本地云端信息失败，继续保存新主题');
      }
    }

    // 生成文件名（使用固定格式避免重复）
    const fileName = `theme_${userCode}_${sessionId}_latest.txt`;
    const objectKey = `recordings/${userCode}/${sessionId}/${fileName}`;

    console.log('主题文件数据:', themeFileData);
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const themeBlob = new Blob([JSON.stringify(themeFileData, null, 2)], {
      type: 'text/plain'
    });
    const themeFile = new File([themeBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', themeFile);

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
    console.log('主题上传响应:', result);

    if (!result.success) {
      throw new Error(result.message || '主题保存失败');
    }

    // 将成功信息保存到本地，用于后续查询
    const saveInfo = {
      themeId,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      lastSaved: new Date().toISOString(),
      userCode,
      sessionId
    };

    localStorage.setItem(`theme_cloud_info_${userCode}_${sessionId}`, JSON.stringify(saveInfo));
    
    console.log('主题保存到云端成功:', saveInfo);

    return {
      success: true,
      themeId,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '主题已保存到云端'
    };

  } catch (error) {
    console.error('保存主题到云端失败:', error);
    
    // 降级到本地存储
    localStorage.setItem('selectedTheme', themeId);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      message: '云端保存失败，已保存到本地'
    };
  }
};

/**
 * 从云端加载主题设置
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 主题设置
 */
export const loadThemeFromCloud = async (userCode, sessionId = 'global') => {
  try {
    console.log('开始从云端加载主题:', { userCode, sessionId });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的文件列表
    const prefix = `recordings/${userCode}/${sessionId}/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取文件列表URL:', listUrl);

    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`获取文件列表失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    const files = result.files || result.data || result.objects || result.items || result.results || [];

    console.log('云端文件列表:', files);

    // 查找最新的主题文件
    const themeFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      console.log('检查文件:', fileName, 'objectKey:', objectKey);
      
      // 检查文件是否在 global 路径下并且是 .txt 文件
      const hasGlobal = objectKey.includes('/global/');
      const isTxtFile = fileName.endsWith('.txt');
      
      // 优先查找固定名称的主题文件，然后查找包含theme关键字或时间戳格式的文件
      const isLatestFile = fileName === `theme_${userCode}_${sessionId}_latest.txt`;
      const hasThemeKeyword = fileName.toLowerCase().includes('theme');
      const isTimestampFile = /^\d{8}_\d{6}_[a-f0-9]+\.txt$/.test(fileName); // 匹配时间戳格式
      
      const isThemeFile = hasGlobal && isTxtFile && (isLatestFile || hasThemeKeyword || isTimestampFile);
      
      console.log('文件检查详情:', {
        fileName,
        hasGlobal,
        isTxtFile,
        isLatestFile,
        hasThemeKeyword,
        isTimestampFile,
        isThemeFile
      });
      
      return isThemeFile;
    });

    // 对主题文件进行排序：latest文件优先，然后按时间排序
    themeFiles.sort((a, b) => {
      const aKey = a.object_key || a.objectKey || a.key || a.name || '';
      const bKey = b.object_key || b.objectKey || b.key || b.name || '';
      const aFileName = aKey.split('/').pop() || '';
      const bFileName = bKey.split('/').pop() || '';
      
      // latest文件优先
      if (aFileName.includes('_latest.txt')) return -1;
      if (bFileName.includes('_latest.txt')) return 1;
      
      // 然后按修改时间排序
      const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
      const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
      return timeB - timeA;
    });

    if (themeFiles.length === 0) {
      console.log('云端未找到主题文件，使用本地设置');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到主题设置'
      };
    }

    console.log(`找到 ${themeFiles.length} 个潜在的主题文件，开始逐一检查...`);

    // 循环尝试所有文件，找到第一个有效的主题文件
    for (let i = 0; i < themeFiles.length; i++) {
      const file = themeFiles[i];
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

        const themeContent = await downloadResponse.text();
        console.log('文件内容:', themeContent.substring(0, 200) + '...');

        // 尝试解析为JSON
        let themeData;
        try {
          themeData = JSON.parse(themeContent);
        } catch (parseError) {
          console.log('不是有效的JSON，尝试下一个文件');
          continue;
        }

        // 检查是否为主题文件
        if (themeData && themeData.themeId) {
          console.log('找到有效的主题文件!', themeData);
          
          // 更新本地云端信息记录
          const cloudInfo = {
            themeId: themeData.themeId,
            objectKey,
            lastLoaded: new Date().toISOString(),
            userCode,
            sessionId
          };
          localStorage.setItem(`theme_cloud_info_${userCode}_${sessionId}`, JSON.stringify(cloudInfo));

          return {
            success: true,
            themeId: themeData.themeId,
            lastUpdated: themeData.lastUpdated,
            source: 'cloud',
            message: '从云端加载主题成功'
          };
        } else {
          console.log('文件不包含themeId，尝试下一个文件');
          continue;
        }
      } catch (error) {
        console.log(`处理文件失败: ${error.message}，尝试下一个文件`);
        continue;
      }
    }

    // 如果所有文件都不是有效的主题文件
    console.log('所有文件都不是有效的主题文件');
    
    return {
      success: false,
      fallback: 'local',
      message: '云端文件都不是有效的主题文件'
    };

  } catch (error) {
    console.error('从云端加载主题失败:', error);
    
    // 降级到本地存储
    const localTheme = localStorage.getItem('selectedTheme') || 'default';
    
    return {
      success: false,
      themeId: localTheme,
      error: error.message,
      fallback: 'local',
      source: 'local',
      message: '云端加载失败，使用本地主题'
    };
  }
};

/**
 * 检查是否有云端主题更新
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 检查结果
 */
export const checkThemeCloudUpdate = async (userCode, sessionId = 'global') => {
  try {
    // 获取本地云端信息
    const localCloudInfo = JSON.parse(
      localStorage.getItem(`theme_cloud_info_${userCode}_${sessionId}`) || '{}'
    );

    if (!localCloudInfo.lastLoaded) {
      return { hasUpdate: true, reason: 'never_loaded' };
    }

    // 从云端重新获取最新信息
    const cloudResult = await loadThemeFromCloud(userCode, sessionId);
    
    if (!cloudResult.success) {
      return { hasUpdate: false, reason: 'cloud_error' };
    }

    // 比较更新时间
    const localTime = new Date(localCloudInfo.lastLoaded).getTime();
    const cloudTime = new Date(cloudResult.lastUpdated || 0).getTime();

    return {
      hasUpdate: cloudTime > localTime,
      reason: cloudTime > localTime ? 'cloud_newer' : 'local_current',
      cloudTheme: cloudResult.themeId,
      localTheme: localStorage.getItem('selectedTheme')
    };

  } catch (error) {
    console.error('检查主题云端更新失败:', error);
    return { hasUpdate: false, reason: 'check_error', error: error.message };
  }
};

/**
 * 同步主题设置（智能选择本地或云端最新版本）
 * @param {string} userCode - 用户代码
 * @param {string} sessionId - 会话ID
 * @returns {Promise<object>} 同步结果
 */
export const syncThemeSettings = async (userCode, sessionId = 'global') => {
  try {
    console.log('开始同步主题设置:', { userCode, sessionId });

    // 检查更新
    const updateCheck = await checkThemeCloudUpdate(userCode, sessionId);
    console.log('更新检查结果:', updateCheck);

    if (updateCheck.hasUpdate) {
      // 从云端加载最新主题
      const loadResult = await loadThemeFromCloud(userCode, sessionId);
      
      if (loadResult.success) {
        console.log('从云端同步主题成功:', loadResult.themeId);
        return {
          success: true,
          action: 'loaded_from_cloud',
          themeId: loadResult.themeId,
          message: `已从云端同步主题: ${loadResult.themeId}`
        };
      }
    }

    // 使用本地主题
    const localTheme = localStorage.getItem('selectedTheme') || 'default';
    console.log('使用本地主题:', localTheme);

    return {
      success: true,
      action: 'used_local',
      themeId: localTheme,
      message: `使用本地主题: ${localTheme}`
    };

  } catch (error) {
    console.error('同步主题设置失败:', error);
    
    const fallbackTheme = localStorage.getItem('selectedTheme') || 'default';
    return {
      success: false,
      error: error.message,
      themeId: fallbackTheme,
      action: 'fallback',
      message: '同步失败，使用本地主题'
    };
  }
};

export default {
  saveThemeToCloud,
  loadThemeFromCloud,
  checkThemeCloudUpdate,
  syncThemeSettings
};
