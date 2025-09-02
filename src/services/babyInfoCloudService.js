// 宝宝信息云端同步服务
// 基于现有的fileNameCloudService架构，实现宝宝出生日期的云端存储和同步

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

/**
 * 保存宝宝出生日期到云端
 * @param {string} userCode - 用户代码
 * @param {string} birthDate - 宝宝出生日期 (YYYY-MM-DD格式)
 * @returns {Promise<object>} 保存结果
 */
export const saveBabyBirthDateToCloud = async (userCode, birthDate) => {
  try {
    console.log('开始保存宝宝出生日期到云端:', { userCode, birthDate });

    // 验证参数
    if (!userCode) {
      throw new Error('缺少必要参数: userCode');
    }

    if (!birthDate) {
      throw new Error('缺少必要参数: birthDate');
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      throw new Error('出生日期格式不正确，应为YYYY-MM-DD');
    }

    // 创建宝宝信息数据
    const babyInfoData = {
      birthDate: birthDate,
      lastUpdated: new Date().toISOString(),
      userCode: userCode,
      timestamp: Date.now(),
      version: '1.0'
    };

    // 检查是否已经有相同的出生日期存在
    const existingInfo = localStorage.getItem(`baby_info_cloud_${userCode}`);
    if (existingInfo) {
      try {
        const cloudInfo = JSON.parse(existingInfo);
        // 比较内容是否相同
        if (cloudInfo.birthDate === birthDate) {
          console.log('宝宝出生日期未发生变化，跳过重复保存');
          return {
            success: true,
            objectKey: cloudInfo.objectKey,
            message: '宝宝出生日期未变化，无需重新保存'
          };
        }
      } catch (e) {
        console.log('解析本地宝宝信息失败，继续保存新的出生日期');
      }
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `baby_info_${userCode}_${timestamp}.txt`;
    const objectKey = `recordings/${userCode}/baby_info/${fileName}`;

    console.log('宝宝信息数据:', babyInfoData);
    console.log('上传路径:', objectKey);

    // 创建FormData
    const formData = new FormData();
    const infoBlob = new Blob([JSON.stringify(babyInfoData, null, 2)], {
      type: 'text/plain'
    });
    const infoFile = new File([infoBlob], fileName, {
      type: 'text/plain'
    });

    formData.append('file', infoFile);

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
    console.log('宝宝信息上传响应:', result);

    if (!result.success) {
      throw new Error(result.message || '宝宝信息保存失败');
    }

    // 将成功信息保存到本地，用于后续查询
    const saveInfo = {
      birthDate,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      lastSaved: new Date().toISOString(),
      userCode
    };

    localStorage.setItem(`baby_info_cloud_${userCode}`, JSON.stringify(saveInfo));
    
    console.log('宝宝出生日期保存到云端成功:', saveInfo);

    return {
      success: true,
      objectKey,
      cloudUrl: result.url || result.cloudUrl,
      message: '宝宝出生日期已保存到云端'
    };

  } catch (error) {
    console.error('保存宝宝出生日期到云端失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      message: '云端保存失败，继续使用本地存储'
    };
  }
};

/**
 * 从云端加载宝宝出生日期
 * @param {string} userCode - 用户代码
 * @returns {Promise<object>} 加载结果
 */
export const loadBabyBirthDateFromCloud = async (userCode) => {
  try {
    console.log('开始从云端加载宝宝出生日期:', { userCode });

    if (!userCode) {
      throw new Error('缺少用户代码');
    }

    // 获取用户的宝宝信息文件列表
    const prefix = `recordings/${userCode}/baby_info/`;
    const listUrl = `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`;
    
    console.log('获取宝宝信息文件列表URL:', listUrl);

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

    console.log('云端宝宝信息文件列表:', files);

    // 查找宝宝信息文件
    const babyInfoFiles = files.filter(file => {
      const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
      const fileName = objectKey.split('/').pop() || '';
      
      // 检查文件是否在指定路径下并且是TXT文件
      const hasCorrectPath = objectKey.includes('/baby_info/');
      const isTxtFile = fileName.endsWith('.txt');
      
      return hasCorrectPath && isTxtFile;
    });

    // 按修改时间排序（最新的在前）
    babyInfoFiles.sort((a, b) => {
      const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
      const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
      return timeB - timeA;
    });

    if (babyInfoFiles.length === 0) {
      console.log('云端未找到宝宝信息文件，使用本地设置');
      return {
        success: false,
        fallback: 'local',
        message: '云端未找到宝宝信息'
      };
    }

    console.log(`找到 ${babyInfoFiles.length} 个宝宝信息文件，开始逐一检查...`);

    // 循环尝试所有文件，找到第一个有效的宝宝信息文件
    for (let i = 0; i < babyInfoFiles.length; i++) {
      const file = babyInfoFiles[i];
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

        const infoContent = await downloadResponse.text();
        console.log('文件内容:', infoContent.substring(0, 200) + '...');

        // 尝试解析为JSON
        let babyData;
        try {
          babyData = JSON.parse(infoContent);
        } catch (parseError) {
          console.log('不是有效的JSON，尝试下一个文件');
          continue;
        }

        // 检查是否为宝宝信息文件
        if (babyData && babyData.birthDate) {
          console.log('找到有效的宝宝信息文件!', babyData);
          
          // 更新本地云端信息记录
          const cloudInfo = {
            birthDate: babyData.birthDate,
            objectKey,
            lastLoaded: new Date().toISOString(),
            userCode
          };
          localStorage.setItem(`baby_info_cloud_${userCode}`, JSON.stringify(cloudInfo));

          return {
            success: true,
            birthDate: babyData.birthDate,
            lastUpdated: babyData.lastUpdated,
            source: 'cloud',
            message: '从云端加载宝宝出生日期成功'
          };
        } else {
          console.log('文件不包含birthDate，尝试下一个文件');
          continue;
        }
      } catch (error) {
        console.log(`处理文件失败: ${error.message}，尝试下一个文件`);
        continue;
      }
    }

    // 如果所有文件都不是有效的宝宝信息文件
    console.log('所有文件都不是有效的宝宝信息文件');
    
    return {
      success: false,
      fallback: 'local',
      message: '云端文件都不是有效的宝宝信息文件'
    };

  } catch (error) {
    console.error('从云端加载宝宝出生日期失败:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: 'local',
      source: 'local',
      message: '云端加载失败，使用本地宝宝信息'
    };
  }
};

/**
 * 计算宝宝年龄（月数）
 * @param {string} birthDate - 宝宝出生日期 (YYYY-MM-DD格式)
 * @returns {number} 宝宝的月龄
 */
export const calculateBabyAgeInMonths = (birthDate) => {
  if (!birthDate) return 0;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    
    // 计算完整年数和月数
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();
    
    // 如果今天的日期小于出生日期，减去一个月
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    
    return Math.max(0, months);
  } catch (error) {
    console.error('计算宝宝年龄失败:', error);
    return 0;
  }
};

/**
 * 格式化宝宝年龄显示
 * @param {number} months - 宝宝的月龄
 * @returns {string} 格式化的年龄字符串
 */
export const formatBabyAge = (months) => {
  if (months < 12) {
    return `${months}月`;
  } else if (months === 12) {
    return '1岁';
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years}岁`;
    } else {
      return `${years}岁${remainingMonths}月`;
    }
  }
};

export default {
  saveBabyBirthDateToCloud,
  loadBabyBirthDateFromCloud,
  calculateBabyAgeInMonths,
  formatBabyAge
};