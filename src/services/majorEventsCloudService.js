// 时间轴云端存储服务
// 参考主题系统的云端保存机制实现时间轴的云端同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 保存时间轴到云端
 * @param {string} userCode - 用户代码
 * @param {Array} events - 时间轴列表
 * @returns {Promise<object>} 保存结果
 */
export const saveMajorEventsToCloud = async (userCode, events) => {
  try {
    console.log('开始保存时间轴到云端:', { userCode, eventsCount: events.length });

    // 验证参数
    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    if (!events || !Array.isArray(events)) {
      throw new Error('事件列表必须是数组');
    }

    // 创建事件文件数据
    const eventsFileData = {
      events: events,
      lastUpdated: new Date().toISOString(),
      userCode: userCode,
      timestamp: Date.now()
    };

    console.log('时间轴文件数据:', JSON.stringify(eventsFileData, null, 2));

    // 生成文件名（使用固定格式避免重复）
    const fileName = `baby_info_major_events_latest.txt`;
    const objectKey = `recordings/${userCode}/baby_info/${fileName}`;

    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const eventsBlob = new Blob([JSON.stringify(eventsFileData, null, 2)], {
      type: 'text/plain'
    });
    const eventsFile = new File([eventsBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', eventsFile);

    // 构建上传URL
    const uploadUrl = new URL(`${API_BASE_URL}/upload`);
    const folderPath = `recordings/${userCode}/baby_info`;
    uploadUrl.searchParams.append('folder', folderPath);

    console.log('上传URL:', uploadUrl.toString());
    console.log('上传文件名:', fileName);
    console.log('上传文件夹:', folderPath);

    // 发送上传请求
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('时间轴上传响应:', result);

    if (!result.success) {
      throw new Error(result.message || '时间轴保存失败');
    }

    // 将成功信息保存到本地，用于后续查询
    const saveInfo = {
      eventsCount: events.length,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      lastSaved: new Date().toISOString(),
      userCode
    };

    localStorage.setItem(`major_events_cloud_info_${userCode}`, JSON.stringify(saveInfo));
    
    console.log('时间轴保存到云端成功:', saveInfo);

    return {
      success: true,
      eventsCount: events.length,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '时间轴已保存到云端'
    };

  } catch (error) {
    console.error('保存时间轴到云端失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      message: '云端保存失败，已保存到本地'
    };
  }
};

/**
 * 从云端加载时间轴
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 时间轴数据
 */
export const loadMajorEventsFromCloud = async (userCode) => {
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

    // 如果没有找到事件文件，尝试更宽松的条件
    if (eventFiles.length === 0) {
      console.log('未找到标准事件文件，尝试更宽松的条件...');
      
      // 尝试查找任何包含"events"或"major"关键词的文件
      const relaxedEventFiles = files.filter(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
        const fileName = objectKey.split('/').pop() || '';
        
        const hasBabyInfo = objectKey.includes('/baby_info/');
        const hasEventsKeyword = fileName.toLowerCase().includes('events');
        const hasMajorKeyword = fileName.toLowerCase().includes('major');
        
        return hasBabyInfo && (hasEventsKeyword || hasMajorKeyword);
      });
      
      if (relaxedEventFiles.length > 0) {
        console.log('找到符合宽松条件的文件:', relaxedEventFiles.length);
        eventFiles.push(...relaxedEventFiles);
      }
    }

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
      console.log('云端未找到时间轴文件，使用本地设置');
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
        // 修复：不需要移除 recordings/ 前缀，因为OSS的完整路径应该包含这个前缀
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
 * 强制从云端重新加载时间轴，清除所有本地缓存
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 刷新结果
 */
export const forceRefreshMajorEventsFromCloud = async (userCode) => {
  try {
    console.log('强制从云端重新加载时间轴，清除所有本地缓存...');
    
    // 清除所有本地缓存
    localStorage.removeItem(`majorEvents_${userCode}`);
    localStorage.removeItem(`major_events_cloud_info_${userCode}`);
    localStorage.removeItem(`major_events_last_sync_${userCode}`);
    
    // 直接从云端加载
    const loadResult = await loadMajorEventsFromCloud(userCode);
    
    if (loadResult.success && loadResult.events) {
      console.log('强制从云端加载时间轴成功:', loadResult.events.length);
      
      // 保存到本地
      localStorage.setItem(`majorEvents_${userCode}`, JSON.stringify(loadResult.events));
      localStorage.setItem(`major_events_cloud_info_${userCode}`, JSON.stringify({
        lastModified: new Date().toISOString(),
        source: 'force_refresh_from_cloud',
        eventCount: loadResult.events.length
      }));
      localStorage.setItem(`major_events_last_sync_${userCode}`, new Date().toISOString());
      
      return {
        success: true,
        events: loadResult.events,
        action: 'force_refresh_from_cloud',
        message: `已从云端重新加载 ${loadResult.events.length} 个时间轴`
      };
    } else {
      console.log('云端没有时间轴数据');
      return {
        success: false,
        events: [],
        action: 'no_cloud_data',
        message: '云端没有时间轴数据'
      };
    }
  } catch (error) {
    console.error('强制从云端加载失败:', error);
    return {
      success: false,
      events: [],
      action: 'force_refresh_failed',
      error: error.message,
      message: '从云端加载失败: ' + error.message
    };
  }
};

/**
 * 同步时间轴设置（智能选择本地或云端最新版本）
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 同步结果
 */
export const syncMajorEventsSettings = async (userCode) => {
  try {
    console.log('开始同步时间轴设置:', { userCode });

    // 从云端加载最新事件
    const loadResult = await loadMajorEventsFromCloud(userCode);
    
    if (loadResult.success) {
      console.log('从云端同步时间轴成功:', loadResult.events.length);
      
      // 将云端数据保存到本地作为备份
      try {
        localStorage.setItem(`majorEvents_${userCode}`, JSON.stringify(loadResult.events));
      } catch (saveError) {
        console.warn('保存云端数据到本地失败:', saveError);
      }
      
      return {
        success: true,
        action: 'loaded_from_cloud',
        events: loadResult.events,
        message: `已从云端同步 ${loadResult.events.length} 个时间轴`
      };
    }

    // 使用本地事件
    const localEvents = [];
    try {
      const storedEvents = localStorage.getItem(`majorEvents_${userCode}`);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        localEvents.push(...events);
      }
    } catch (error) {
      console.error('加载本地事件失败:', error);
    }
    
    console.log('云端无数据，使用本地事件:', localEvents.length);
    
    // 如果本地有事件数据，尝试将其上传到云端
    if (localEvents.length > 0) {
      try {
        console.log('尝试将本地事件上传到云端...');
        const uploadResult = await saveMajorEventsToCloud(userCode, localEvents);
        if (uploadResult.success) {
          console.log('本地事件已成功上传到云端');
          return {
            success: true,
            action: 'uploaded_to_cloud',
            events: localEvents,
            message: `本地 ${localEvents.length} 个时间轴已上传到云端`
          };
        } else {
          console.warn('上传本地事件到云端失败:', uploadResult.message);
        }
      } catch (uploadError) {
        console.error('上传本地事件到云端出错:', uploadError);
      }
    }

    return {
      success: true,
      action: 'used_local',
      events: localEvents,
      message: `使用本地 ${localEvents.length} 个时间轴`
    };

  } catch (error) {
    console.error('同步时间轴设置失败:', error);
    
    return {
      success: false,
      error: error.message,
      events: [],
      action: 'fallback',
      message: '同步失败，使用空事件列表'
    };
  }
};

const majorEventsCloudService = {
  saveMajorEventsToCloud,
  loadMajorEventsFromCloud,
  syncMajorEventsSettings
};

export default majorEventsCloudService;