// 音乐URL云端同步服务
// 基于现有的babyInfoCloudService架构，实现音乐URL的云端存储和同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 保存音乐URL到云端时间轴文件
 * @param {string} userCode - 用户代码
 * @param {string} musicUrl - 音乐URL
 * @returns {Promise<object>} 保存结果
 */
export const saveMusicUrlToCloud = async (userCode, musicUrl) => {
  try {
    console.log('开始保存音乐URL到云端时间轴文件:', { userCode, musicUrl });

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

    // 首先尝试加载现有的时间轴文件
    let existingData = {};
    try {
      const loadResult = await loadMajorEventsFromCloud(userCode);
      if (loadResult.success && loadResult.events) {
        existingData = {
          events: loadResult.events,
          lastUpdated: loadResult.lastUpdated || new Date().toISOString(),
          userCode: userCode
        };
        console.log('加载到现有时间轴数据，事件数量:', loadResult.events.length);
      }
    } catch (error) {
      console.log('加载现有时间轴数据失败，将创建新文件:', error.message);
    }

    // 添加或更新音乐URL到时间轴数据中
    existingData.musicUrl = musicUrl;
    existingData.lastUpdated = new Date().toISOString();
    existingData.userCode = userCode;
    existingData.timestamp = Date.now();

    // 生成文件名（使用固定格式避免重复）
    const fileName = `baby_info_major_events_latest.txt`;
    const objectKey = `recordings/${userCode}/baby_info/${fileName}`;

    console.log('时间轴文件数据:', JSON.stringify(existingData, null, 2));
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const dataBlob = new Blob([JSON.stringify(existingData, null, 2)], {
      type: 'text/plain'
    });
    const dataFile = new File([dataBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', dataFile);

    // 构建上传URL
    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/baby_info`;
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
    
    console.log('音乐URL保存到云端时间轴文件成功:', saveInfo);

    return {
      success: true,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '音乐URL已保存到云端时间轴文件'
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
 * 从云端时间轴文件加载音乐URL
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 加载结果
 */
export const loadMusicUrlFromCloud = async (userCode) => {
  try {
    console.log('开始从云端时间轴文件加载音乐URL:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的时间轴文件列表
    const prefix = `recordings/${userCode}/baby_info/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取时间轴文件列表URL:', listUrl);

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

    console.log('云端时间轴文件列表:', files);

    // 查找时间轴文件
    const eventFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      
      // 检查文件是否在指定路径下并且是TXT文件
      const hasCorrectPath = objectKey.includes('/baby_info/');
      const isTxtFile = fileName.endsWith('.txt');
      
      return hasCorrectPath && isTxtFile;
    });

    // 按修改时间排序（最新的在前）
    eventFiles.sort((a, b) => {
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

    if (eventFiles.length === 0) {
      console.log('云端未找到时间轴文件，使用本地设置');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到时间轴文件'
      };
    }

    // 获取最新的时间轴文件
    const latestFile = eventFiles[0];
    const objectKey = latestFile.object_key || latestFile.objectKey || latestFile.key || latestFile.name || '';

    console.log('找到最新时间轴文件:', objectKey);

    // 构建OSS直链URL访问文件内容
    const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
    const directUrl = ossBase + objectKey;
    
    console.log('直接访问OSS URL:', directUrl);

    const downloadResponse = await fetch(directUrl);
    
    if (!downloadResponse.ok) {
      throw new Error(`下载时间轴文件失败: HTTP ${downloadResponse.status}`);
    }

    const fileContent = await downloadResponse.text();
    const timelineData = JSON.parse(fileContent);

    console.log('时间轴数据:', timelineData);

    // 检查是否包含音乐URL
    if (!timelineData.musicUrl) {
      console.log('时间轴文件中未找到音乐URL');
      return {
        success: false,
        fallback: 'local',
        message: '时间轴文件中未找到音乐URL'
      };
    }

    // 将成功信息保存到本地
    const saveInfo = {
      musicUrl: timelineData.musicUrl,
      objectKey,
      cloudUrl: directUrl,
      lastLoaded: new Date().toISOString(),
      userCode
    };

    localStorage.setItem(`music_url_cloud_${userCode}`, JSON.stringify(saveInfo));
    
    console.log('音乐URL从云端时间轴文件加载成功:', saveInfo);

    return {
      success: true,
      musicUrl: timelineData.musicUrl,
      objectKey,
      cloudUrl: directUrl,
      message: '音乐URL已从云端时间轴文件加载'
    };

  } catch (error) {
    console.error('从云端时间轴文件加载音乐URL失败:', error);
    
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
 * 加载时间轴数据（从majorEventsCloudService复制）
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 加载结果
 */
const loadMajorEventsFromCloud = async (userCode) => {
  try {
    console.log('开始从云端加载时间轴:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的文件列表
    const prefix = `recordings/${userCode}/baby_info/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取文件列表URL:', listUrl);

    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`获取文件列表失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('文件列表API响应:', result);
    
    // 尝试多种可能的文件列表字段
    let files = [];
    if (result.files && Array.isArray(result.files)) {
      files = result.files;
    } else if (result.data && Array.isArray(result.data)) {
      files = result.data;
    } else if (result.objects && Array.isArray(result.objects)) {
      files = result.objects;
    } else if (result.items && Array.isArray(result.items)) {
      files = result.items;
    } else if (result.results && Array.isArray(result.results)) {
      files = result.results;
    } else if (result.list && Array.isArray(result.list)) {
      files = result.list;
    } else if (result.fileList && Array.isArray(result.fileList)) {
      files = result.fileList;
    } else if (Array.isArray(result)) {
      files = result;
    } else {
      console.log('无法识别的文件列表数据结构:', Object.keys(result));
      // 尝试将整个响应作为文件列表
      files = [result];
    }
    
    console.log('提取的文件列表:', files);
    console.log('文件列表长度:', files.length);

    // 查找最新的事件文件
    const eventFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      
      // 检查文件是否在 baby_info 路径下并且是 .txt 文件
      const hasBabyInfo = objectKey.includes('/baby_info/');
      const isTxtFile = fileName.endsWith('.txt');
      
      // 更宽松的筛选条件：只要是baby_info目录下的txt文件就可能是事件文件
      const isEventsFile = hasBabyInfo && isTxtFile;
      
      // 添加调试日志
      if (hasBabyInfo && isTxtFile) {
        console.log('找到baby_info目录下的txt文件:', {
          objectKey,
          fileName,
          isEventsFile
        });
      } else if (hasBabyInfo) {
        console.log('找到baby_info目录下的非txt文件:', {
          objectKey,
          fileName,
          isTxtFile
        });
      }
      
      return isEventsFile;
    });

    // 对事件文件进行排序：latest文件优先，然后按时间排序
    eventFiles.sort((a, b) => {
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

    if (eventFiles.length === 0) {
      console.log('云端未找到时间轴文件');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到时间轴'
      };
    }

    console.log(`找到 ${eventFiles.length} 个潜在的事件文件，开始逐一检查...`);

    // 循环尝试所有文件，找到第一个有效的事件文件
    for (let i = 0; i < eventFiles.length; i++) {
      const file = eventFiles[i];
      const objectKey = file.object_key || file.objectKey || file.key || file.name;
      
      console.log(`尝试第 ${i + 1} 个文件:`, objectKey);

      try {
        // 构建OSS直链URL访问文件内容
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const directUrl = ossBase + objectKey;
        
        console.log('直接访问OSS URL:', directUrl);

        const downloadResponse = await fetch(directUrl);
        console.log('下载响应状态:', downloadResponse.status, downloadResponse.statusText);
        
        if (!downloadResponse.ok) {
          console.log(`OSS访问失败 (HTTP ${downloadResponse.status})，尝试下一个文件`);
          continue;
        }

        const eventsContent = await downloadResponse.text();
        console.log('文件内容长度:', eventsContent.length);
        console.log('文件内容前200字符:', eventsContent.substring(0, 200));

        // 增强的JSON解析逻辑，处理可能的格式问题
        let eventsData;
        try {
          // 首先尝试直接解析
          eventsData = JSON.parse(eventsContent);
        } catch (parseError) {
          console.log('直接JSON解析失败，尝试清理后解析:', parseError.message);
          try {
            // 尝试清理可能的BOM或特殊字符
            const cleanedContent = eventsContent.replace(/^\uFEFF/, '').trim();
            eventsData = JSON.parse(cleanedContent);
          } catch (cleanError) {
            console.log('清理后JSON解析仍然失败，尝试下一个文件:', cleanError.message);
            continue;
          }
        }

        // 更严格的数据验证
        if (!eventsData || typeof eventsData !== 'object') {
          console.log('数据不是有效的对象，尝试下一个文件');
          continue;
        }

        // 检查是否为事件文件，支持多种可能的字段名
        let events = eventsData.events || eventsData.majorEvents || eventsData.eventList || [];
        
        if (!Array.isArray(events)) {
          console.log('events字段不是数组，尝试下一个文件');
          continue;
        }

        // 验证事件数据的基本结构
        const validEvents = events.filter(event => {
          return event && typeof event === 'object' && event.id && event.title;
        });

        if (validEvents.length === 0) {
          console.log('未找到有效的事件数据，尝试下一个文件');
          continue;
        }

        console.log('找到有效的事件文件!', { 
          totalEvents: events.length, 
          validEvents: validEvents.length,
          sampleEvent: validEvents[0] 
        });
        
        // 更新本地云端信息记录
        const cloudInfo = {
          eventsCount: validEvents.length,
          objectKey,
          lastLoaded: new Date().toISOString(),
          userCode
        };
        localStorage.setItem(`major_events_cloud_info_${userCode}`, JSON.stringify(cloudInfo));

        return {
          success: true,
          events: validEvents,
          lastUpdated: eventsData.lastUpdated || eventsData.timestamp || new Date().toISOString(),
          source: 'cloud',
          message: `从云端加载时间轴成功 (${validEvents.length}个有效事件)`
        };
      } catch (error) {
        console.log(`处理文件失败: ${error.message}，尝试下一个文件`);
        continue;
      }
    }

    // 如果所有文件都不是有效的事件文件
    console.log('所有文件都不是有效的事件文件');
    
    return {
      success: false,
      fallback: 'local',
      message: '云端文件都不是有效的事件文件'
    };

  } catch (error) {
    console.error('从云端加载时间轴失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      source: 'local',
      message: '云端加载失败，使用本地事件'
    };
  }
};

/**
 * 从时间轴文件中删除音乐URL
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 删除结果
 */
export const deleteMusicUrlFromCloud = async (userCode) => {
  try {
    console.log('开始从时间轴文件中删除音乐URL:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 首先尝试加载现有的时间轴文件
    let existingData = {};
    try {
      const loadResult = await loadMajorEventsFromCloud(userCode);
      if (loadResult.success && loadResult.events) {
        existingData = {
          events: loadResult.events,
          lastUpdated: loadResult.lastUpdated || new Date().toISOString(),
          userCode: userCode
        };
        console.log('加载到现有时间轴数据，事件数量:', loadResult.events.length);
      } else {
        console.log('云端未找到时间轴文件，无需删除');
        return {
          success: true,
          message: '云端未找到时间轴文件，无需删除'
        };
      }
    } catch (error) {
      console.log('加载现有时间轴数据失败:', error.message);
      return {
        success: false,
        error: error.message,
        message: '加载时间轴数据失败'
      };
    }

    // 检查时间轴文件中是否包含音乐URL
    if (!existingData.musicUrl) {
      console.log('时间轴文件中未找到音乐URL，无需删除');
      return {
        success: true,
        message: '时间轴文件中未找到音乐URL，无需删除'
      };
    }

    // 从时间轴数据中删除音乐URL
    delete existingData.musicUrl;
    existingData.lastUpdated = new Date().toISOString();
    existingData.userCode = userCode;
    existingData.timestamp = Date.now();

    // 生成文件名（使用固定格式避免重复）
    const fileName = `baby_info_major_events_latest.txt`;
    const objectKey = `recordings/${userCode}/baby_info/${fileName}`;

    console.log('更新后的时间轴文件数据:', JSON.stringify(existingData, null, 2));
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const dataBlob = new Blob([JSON.stringify(existingData, null, 2)], {
      type: 'text/plain'
    });
    const dataFile = new File([dataBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', dataFile);

    // 构建上传URL
    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/baby_info`;
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
    console.log('时间轴文件更新响应:', result);

    if (!result.success) {
      throw new Error(result.message || '时间轴文件更新失败');
    }

    // 清除本地缓存
    localStorage.removeItem(`music_url_cloud_${userCode}`);
    
    console.log('音乐URL从时间轴文件中删除成功');

    return {
      success: true,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '音乐URL已从时间轴文件中删除'
    };

  } catch (error) {
    console.error('从时间轴文件中删除音乐URL失败:', error);
    
    return {
      success: false,
      error: error.message,
      message: '删除音乐URL失败'
    };
  }
};

// 导出音乐URL云服务对象
const musicUrlCloudService = {
  saveMusicUrlToCloud,
  loadMusicUrlFromCloud,
  deleteMusicUrlFromCloud
};

export default musicUrlCloudService;