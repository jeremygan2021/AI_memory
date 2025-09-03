// src/hooks/useMusicGeneration.js
import { useState, useCallback } from 'react';
import sunoApi from '../services/sunoApi';
import aiService from '../services/aiService';

export const useMusicGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState(null);
  const [generatedSongs, setGeneratedSongs] = useState([]);

  // 生成音乐（基于文本）
  const generateMusic = useCallback(async (demand, prompt, options = {}) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      setGenerationProgress(20);
      
      // 直接调用Suno API生成音乐
      const result = await aiService.generateMusicFromText(demand, prompt, options);
      
      setGenerationProgress(40);
      
      console.log('AI服务返回结果:', result);
      
      // 处理不同的API响应格式
      let taskIds = [];
      console.log('尝试解析任务ID，API响应:', result);
      
      if (result.data && Array.isArray(result.data)) {
        taskIds = result.data.map(item => item.id);
      } else if (result.taskIds && Array.isArray(result.taskIds)) {
        taskIds = result.taskIds;
      } else if (result.id) {
        taskIds = [result.id];
      } else if (result.taskId) {
        taskIds = [result.taskId];
      } else if (result.task_id) {
        taskIds = [result.task_id];
      } else if (result.task) {
        taskIds = [result.task];
      } else if (result.data && result.data.id) {
        taskIds = [result.data.id];
      } else if (result.data && result.data.taskId) {
        // 处理 data.taskId 的情况
        taskIds = [result.data.taskId];
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // 如果data是数组，尝试获取第一个元素的id
        taskIds = result.data.map(item => item.id || item.task_id || item.taskId).filter(Boolean);
      } else {
        console.error('无法识别的API响应格式:', result);
        console.log('可用的字段:', Object.keys(result));
        throw new Error('API响应格式错误，无法获取任务ID');
      }
      
      if (taskIds.length > 0) {
        // 开始监控生成状态
        await monitorGenerationStatus(taskIds);
        return result;
      } else {
        throw new Error(result.message || '生成失败：无法获取任务ID');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, []);

  // 自定义模式生成音乐（支持歌词）
  const generateCustomMusic = useCallback(async (demand, prompt, lyrics = '', options = {}) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      setGenerationProgress(20);
      
      // 使用自定义模式生成音乐
      const result = await aiService.generateCustomMusic(demand, prompt, lyrics, options);
      
      setGenerationProgress(40);
      
      console.log('AI服务返回结果:', result);
      
      // 处理不同的API响应格式
      let taskIds = [];
      console.log('尝试解析任务ID，API响应:', result);
      
      if (result.data && Array.isArray(result.data)) {
        taskIds = result.data.map(item => item.id);
      } else if (result.taskIds && Array.isArray(result.taskIds)) {
        taskIds = result.taskIds;
      } else if (result.id) {
        taskIds = [result.id];
      } else if (result.taskId) {
        taskIds = [result.taskId];
      } else if (result.task_id) {
        taskIds = [result.task_id];
      } else if (result.task) {
        taskIds = [result.task];
      } else if (result.data && result.data.id) {
        taskIds = [result.data.id];
      } else if (result.data && result.data.taskId) {
        // 处理 data.taskId 的情况
        taskIds = [result.data.taskId];
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // 如果data是数组，尝试获取第一个元素的id
        taskIds = result.data.map(item => item.id || item.task_id || item.taskId).filter(Boolean);
      } else {
        console.error('无法识别的API响应格式:', result);
        console.log('可用的字段:', Object.keys(result));
        throw new Error('API响应格式错误，无法获取任务ID');
      }
      
      if (taskIds.length > 0) {
        // 开始监控生成状态
        await monitorGenerationStatus(taskIds);
        return result;
      } else {
        throw new Error(result.message || '生成失败：无法获取任务ID');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, []);

  // 监控生成状态
  const monitorGenerationStatus = useCallback(async (taskIds) => {
    let completedSongs = [];
    let pollCount = 0;
    const maxPolls = 120; // 最多轮询10分钟（每30秒一次）
    
    const checkStatus = async () => {
      try {
        pollCount++;
        
        const statusResult = await aiService.queryGenerationStatus(taskIds);
        
        if (statusResult && statusResult.data) {
          for (const item of statusResult.data) {
            console.log('检查任务状态:', item);
            
            // 检查多种成功状态
            if ((item.status === 'complete' || item.status === 'TEXT_SUCCESS' || item.status === 'success') && 
                (item.audio_url || item.response?.sunoData)) {
              const existingSong = completedSongs.find(s => s.id === item.id);
              if (!existingSong) {
                console.log('发现完成的音乐:', item);
                
                // 从sunoData中获取音频URL和时长
                let audioUrl = item.audio_url;
                let duration = item.duration || 0;
                let title = item.title || '未命名音乐';
                
                if (!audioUrl && item.response?.sunoData && item.response.sunoData.length > 0) {
                  const sunoData = item.response.sunoData[0];
                  // 优先使用 streamAudioUrl，然后是 audioUrl，最后是 url
                  audioUrl = sunoData.streamAudioUrl || sunoData.audioUrl || sunoData.audio_url || sunoData.url;
                  // 从sunoData获取时长和标题
                  duration = sunoData.duration || duration;
                  title = sunoData.title || title;
                  console.log('从sunoData获取音频URL:', audioUrl);
                  console.log('从sunoData获取时长:', duration);
                  console.log('从sunoData获取标题:', title);
                }
                
                // 获取歌词prompt信息，优先使用item中的prompt，然后是sunoData中的prompt
                let prompt = item.prompt || '';
                if (!prompt && item.response?.sunoData && item.response.sunoData.length > 0) {
                  const sunoData = item.response.sunoData[0];
                  prompt = sunoData.prompt || sunoData.lyrics || '';
                }
                console.log('获取歌词prompt:', prompt);
                
                completedSongs.push({
                  id: item.id,
                  title: title,
                  audio_url: audioUrl,
                  image_url: item.image_url,
                  duration: duration,
                  prompt: prompt, // 使用获取到的prompt信息
                  tags: item.tags || '',
                  model: item.model || 'V3_5'
                });
              }
            } else if (item.status === 'error' || item.errorCode) {
              throw new Error(`音乐生成失败: ${item.errorMessage || item.error_message || '未知错误'}`);
            } else {
              console.log(`任务 ${item.id} 状态: ${item.status}，继续等待...`);
            }
          }
          
          // 更新进度
          const progressIncrement = Math.floor(50 / taskIds.length) * completedSongs.length;
          setGenerationProgress(prev => Math.min(40 + progressIncrement, 95));
          
          if (completedSongs.length === taskIds.length) {
            setGenerationProgress(100);
            setCurrentSong(completedSongs[0]); // 设置第一首为当前歌曲
            setGeneratedSongs(prev => [...completedSongs, ...prev]);
            return true;
          } else if (pollCount >= maxPolls) {
            throw new Error('生成超时，请稍后查看生成历史');
          }
        }
        
        return false;
      } catch (error) {
        setError(error.message);
        return true;
      }
    };

    // 轮询状态
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        const isComplete = await checkStatus();
        if (isComplete) {
          clearInterval(pollInterval);
          if (completedSongs.length > 0) {
            resolve(completedSongs);
          } else {
            reject(new Error('生成失败'));
          }
        }
      }, 30000); // 每30秒检查一次

      // 设置超时
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('生成超时，请稍后重试'));
      }, 180000); // 3分钟超时
    });
  }, []);

  // 下载音乐
  const downloadMusic = useCallback(async (songId) => {
    try {
      await sunoApi.downloadSong(songId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // 保存音乐到本地
  const saveMusicLocally = useCallback(async (song, shouldUploadToCloud = false, userCode, sessionId, onProgress) => {
    try {
      // 验证userCode是否有效
      if (!userCode || userCode.trim() === '') {
        throw new Error('用户代码无效，请刷新页面重试');
      }
      
      // 创建本地音乐记录
      const localMusic = {
        id: Date.now(),
        title: song.title || `AI生成音乐_${Date.now()}`,
        url: song.audio_url,
        duration: song.duration || 0,
        timestamp: new Date().toLocaleString('zh-CN'),
        isAIGenerated: true,
        originalSongId: song.id,
        uploadedToCloud: false,
        userCode,
        sessionId,
        cloudUrl: null,
        objectKey: null,
        prompt: song.prompt || '', // 添加歌词prompt信息
        promptObjectKey: null, // 歌词文件的对象键
        promptCloudUrl: null // 歌词文件的云端URL
      };

      // 保存到localStorage
      const savedMusicKey = 'ai_generated_music';
      const savedMusic = JSON.parse(localStorage.getItem(savedMusicKey) || '[]');
      console.log('保存音乐到本地存储，当前音乐数量:', savedMusic.length);
      savedMusic.unshift(localMusic);
      localStorage.setItem(savedMusicKey, JSON.stringify(savedMusic));
      console.log('本地保存成功，音乐ID:', localMusic.id);

      // 如果需要上传到云端
      let uploadRes = null;
      if (shouldUploadToCloud && song.audio_url) {
        console.log('开始上传音乐到云端...');
        try {
          uploadRes = await uploadMusicToCloud(song, userCode, sessionId, onProgress);
          console.log('云端上传返回结果:', uploadRes);
          localMusic.uploadedToCloud = true;
          localMusic.cloudUrl = uploadRes?.cloudUrl || localMusic.url;
          localMusic.objectKey = uploadRes?.objectKey || null;
          
          // 更新localStorage中的记录
          const updatedMusic = savedMusic.map(music => 
            music.id === localMusic.id 
              ? { 
                  ...music, 
                  uploadedToCloud: true, 
                  cloudUrl: localMusic.cloudUrl, 
                  objectKey: localMusic.objectKey,
                  promptObjectKey: localMusic.promptObjectKey,
                  promptCloudUrl: localMusic.promptCloudUrl
                } 
              : music
          );
          localStorage.setItem(savedMusicKey, JSON.stringify(updatedMusic));
          console.log('云端上传成功，已更新本地记录');
          
        } catch (uploadError) {
          console.error('上传到云端失败:', uploadError);
          console.log('上传失败但本地保存成功');
          // 上传失败但本地保存成功
        }
        
        // 如果上传结果中包含歌词文件信息，更新本地音乐记录
        if (uploadRes && uploadRes.promptObjectKey) {
          console.log('更新歌词文件信息到本地记录');
          localMusic.promptObjectKey = uploadRes.promptObjectKey;
          localMusic.promptCloudUrl = uploadRes.promptCloudUrl;
          
          // 更新localStorage中的记录
          const updatedMusic = savedMusic.map(music => 
            music.id === localMusic.id 
              ? { 
                  ...music, 
                  promptObjectKey: localMusic.promptObjectKey,
                  promptCloudUrl: localMusic.promptCloudUrl
                } 
              : music
          );
          localStorage.setItem(savedMusicKey, JSON.stringify(updatedMusic));
          console.log('歌词文件信息已保存到本地记录');
        }
      }

      return localMusic;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // 检查网络连接状态
  const checkNetworkConnection = useCallback(async () => {
    try {
      // 首先使用浏览器原生在线状态判断
      if (typeof navigator !== 'undefined' && navigator && 'onLine' in navigator) {
        if (!navigator.onLine) {
          console.warn('当前离线: navigator.onLine=false');
          return false;
        }
      }

      // 轻量级探测（不阻断上传）：尝试 ping 应用 API，但任何错误都视为“仍可尝试上传”
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: controller.signal, cache: 'no-store' });
      } catch (e) {
        // 忽略探测失败，返回 true 允许后续上传自行判断
        console.warn('健康检查失败或超时，继续尝试上传:', e?.name || e);
      } finally {
        clearTimeout(timeoutId);
      }

      return true;
    } catch (error) {
      // 任何异常不阻断上传
      console.warn('网络检查异常但不阻断上传:', error);
      return true;
    }
  }, []);

  // 上传音乐到云端
  const uploadMusicToCloud = useCallback(async (song, userCode, sessionId, onProgress) => {
    try {
      // 定义API基础URL、文件夹路径和结果对象
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      const audioFolderPath = `recordings/${userCode}/${sessionId || 'ai_generated'}/audio`;
      const lyricsFolderPath = `recordings/${userCode}/${sessionId || 'ai_generated'}/lyrics`;
      let result = {
        promptObjectKey: null,
        promptCloudUrl: null
      };
      
      // 验证userCode是否有效
      if (!userCode || userCode.trim() === '') {
        throw new Error('用户代码无效，无法上传到云端');
      }
      
      // 检查网络连接（非阻断）
      const isNetworkOk = await checkNetworkConnection();
      if (!isNetworkOk) {
        console.warn('网络可能不可用，仍尝试上传以由服务器判定');
      }
      
      // 首先下载音频文件
      console.log('开始下载音频文件:', song.audio_url);
      if (onProgress) onProgress(10, '下载音频文件...');
      let response;
      try {
        response = await fetch(song.audio_url);
        if (!response.ok) {
          console.error('下载音频文件失败:', response.status, response.statusText);
          throw new Error(`下载音频文件失败: ${response.status} ${response.statusText}`);
        }
        console.log('音频文件下载成功');
      } catch (fetchError) {
        console.error('下载音频文件时网络错误:', fetchError);
        console.error('错误类型:', fetchError.name);
        console.error('错误消息:', fetchError.message);
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          console.error('可能是网络连接问题或CORS策略阻止了请求');
        }
        throw new Error(`网络错误: ${fetchError.message}`);
      }
      
      const audioBlob = await response.blob();
      console.log('音频文件大小:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');
      if (onProgress) onProgress(30, '准备上传...');
      
      // 创建FormData
      const formData = new FormData();
      const safeTitle = (song.title || `AI生成音乐_${Date.now()}`).trim().replace(/[\\/:*?"<>|#%&{}$!@`~^+=,;]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'AI_音乐';
      const baseName = `${safeTitle}_${song.id || Date.now()}`;
      const fileName = `${baseName}.mp3`;
      const audioFile = new File([audioBlob], fileName, { 
        type: 'audio/mpeg' 
      });
      
      formData.append('file', audioFile);
      
      // 将歌词prompt内容附带在音频表单中（不依赖此字段生成同名）
      if (song.prompt) {
        formData.append('prompt', song.prompt);
      }
      
      // 构建上传URL
      const uploadUrl = new URL(`${API_BASE_URL}/upload`);
      uploadUrl.searchParams.append('folder', audioFolderPath);
      
      console.log('开始上传音频文件到云端:', uploadUrl.toString());
      console.log('音频文件上传路径:', audioFolderPath);
      if (onProgress) onProgress(50, '上传到云端...');
      
      // 发送上传请求
      console.log('发送音频文件上传请求...');
      let uploadResponse;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          console.error('音频文件上传失败:', uploadResponse.status, uploadResponse.statusText);
          throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        console.log('音频文件上传请求成功');
      } catch (uploadError) {
        console.error('音频文件上传网络错误:', uploadError);
        console.error('上传错误类型:', uploadError.name);
        console.error('上传错误消息:', uploadError.message);
        if (uploadError.name === 'TypeError' && uploadError.message === 'Failed to fetch') {
          console.error('可能是网络连接问题、服务器不可用或防火墙阻止了请求');
          console.error('上传URL:', uploadUrl.toString());
          console.error('请检查网络连接和服务器状态');
        }
        throw new Error(`上传网络错误: ${uploadError.message}`);
      }
      
      if (onProgress) onProgress(80, '处理上传结果...');
      
      console.log('解析上传响应...');
      const uploadResult = await uploadResponse.json();
      // 合并上传结果到result对象中
      result = {
        ...result,
        ...uploadResult
      };
      
      if (!result.success) {
        console.error('上传处理失败:', result.message);
        throw new Error(result.message || '上传失败');
      }
      console.log('音频文件上传成功:', result);
      console.log('音频文件云端URL:', result.file_url);
      
      // 基于服务器返回的音频 object_key 构造同名歌词并上传
      if (song.prompt && result.object_key) {
        try {
          const audioObjectKey = result.object_key; // recordings/{user}/{session}/audio/XXXX.ext
          const audioFileName = audioObjectKey.split('/').pop() || '';
          const audioBaseName = audioFileName.replace(/\.[^/.]+$/, '');
          const lyricsObjectKeyDir = audioObjectKey.replace(/\/audio\/.*/, '/lyrics/');
          const promptFileName = `${audioBaseName}.txt`;

          // 构建上传到 lyrics 目录的URL
          const promptUploadUrl = new URL(`${API_BASE_URL}/upload`);
          // 取目录部分（去掉文件名）并确保是 lyrics 目录
          const parts = lyricsObjectKeyDir.split('/');
          // 去掉最后一个空/文件片段，保留目录到 lyrics
          const folderPath = parts.slice(0, parts.length - 1).join('/');
          // 如果正则替换失败，降级为 recordings/{user}/{session}/lyrics
          let finalLyricsFolder = folderPath && folderPath.includes('/lyrics') ? folderPath : '';
          if (!finalLyricsFolder) {
            const p = audioObjectKey.split('/');
            if (p.length >= 3) {
              finalLyricsFolder = `recordings/${p[1]}/${p[2]}/lyrics`;
            }
          }
          promptUploadUrl.searchParams.append('folder', finalLyricsFolder);

          const promptFormData = new FormData();
          const promptFile = new File([song.prompt], promptFileName, { type: 'text/plain' });
          promptFormData.append('file', promptFile);

          // 为避免服务器因同名已存在而改名：尝试删除同名旧歌词（忽略404）
          try {
            const desiredObjectKey = `${finalLyricsFolder}/${promptFileName}`;
            const delResp = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(desiredObjectKey)}`, { method: 'DELETE' });
            if (!delResp.ok && delResp.status !== 404) {
              console.warn('删除旧歌词失败(可忽略):', delResp.status, delResp.statusText);
            }
          } catch (delErr) {
            // 忽略删除错误
          }

          console.log('开始上传同名歌词文件:', promptFileName);
          const promptResp = await fetch(promptUploadUrl, { method: 'POST', body: promptFormData });
          if (promptResp.ok) {
            const promptJson = await promptResp.json();
            if (promptJson.success) {
              result.promptObjectKey = promptJson.object_key;
              result.promptCloudUrl = promptJson.file_url;
              console.log('同名歌词上传成功:', promptJson);

              // 记录 音频objectKey -> 歌词objectKey 映射，供播放页精确匹配
              try {
                const mapKey = 'audio_lyrics_map';
                const raw = localStorage.getItem(mapKey);
                const map = raw ? JSON.parse(raw) : {};
                if (result.object_key && result.promptObjectKey) {
                  map[result.object_key] = {
                    lyricsObjectKey: result.promptObjectKey,
                    lyricsUrl: result.promptCloudUrl || '',
                    savedAt: Date.now()
                  };
                  localStorage.setItem(mapKey, JSON.stringify(map));
                  console.log('已保存音频与歌词映射:', result.object_key, '->', result.promptObjectKey);
                }
              } catch (e) {
                console.warn('保存音频-歌词映射失败(可忽略):', e);
              }
            } else {
              console.warn('同名歌词上传返回失败:', promptJson.message);
            }
          } else {
            console.warn('同名歌词上传失败:', promptResp.status, promptResp.statusText);
          }
        } catch (e) {
          console.warn('同名歌词上传过程出错:', e);
        }
      }
      
      if (onProgress) onProgress(100, '上传完成！');
      
      console.log('所有文件上传完成');
      console.log('最终上传结果:', {
        audioUrl: result.file_url,
        audioObjectKey: result.object_key,
        promptUrl: result.promptCloudUrl,
        promptObjectKey: result.promptObjectKey
      });
      
      // 将标题与对象键建立映射，供各页面显示
      try {
        const mapKey = 'customNames';
        const raw = localStorage.getItem(mapKey);
        const map = raw ? JSON.parse(raw) : {};
        if (result.object_key) {
          map[result.object_key] = song.title || safeTitle;
          localStorage.setItem(mapKey, JSON.stringify(map));
          console.log('已保存文件名映射:', result.object_key, '->', song.title || safeTitle);
        }
      } catch (mapError) {
        console.error('保存文件名映射失败:', mapError);
      }

      return {
        success: true,
        cloudUrl: result.file_url,
        objectKey: result.object_key,
        etag: result.etag,
        promptCloudUrl: result.promptCloudUrl,
        promptObjectKey: result.promptObjectKey
      };
    } catch (error) {
      console.error('上传音乐到云端失败:', error);
      throw error;
    }
  }, []);

  // 获取本地保存的AI音乐
  const getLocalAIMusic = useCallback(() => {
    try {
      const savedMusicKey = 'ai_generated_music';
      const savedMusic = JSON.parse(localStorage.getItem(savedMusicKey) || '[]');
      return savedMusic;
    } catch (error) {
      console.error('获取本地AI音乐失败:', error);
      return [];
    }
  }, []);

  // 基于参考音频生成音乐
  const generateMusicFromReference = useCallback(async (referenceAudioUrl, demand, prompt, options = {}) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      setGenerationProgress(20);
      
      // 使用参考音频生成音乐
      const result = await aiService.generateMusicFromReference(referenceAudioUrl, demand, prompt, options);
      
      setGenerationProgress(40);
      
      console.log('AI服务返回结果:', result);
      
      // 处理不同的API响应格式
      let taskIds = [];
      console.log('尝试解析任务ID，API响应:', result);
      
      if (result.data && Array.isArray(result.data)) {
        taskIds = result.data.map(item => item.id);
      } else if (result.taskIds && Array.isArray(result.taskIds)) {
        taskIds = result.taskIds;
      } else if (result.id) {
        taskIds = [result.id];
      } else if (result.taskId) {
        taskIds = [result.taskId];
      } else if (result.task_id) {
        taskIds = [result.task_id];
      } else if (result.task) {
        taskIds = [result.task];
      } else if (result.data && result.data.id) {
        taskIds = [result.data.id];
      } else if (result.data && result.data.taskId) {
        // 处理 data.taskId 的情况
        taskIds = [result.data.taskId];
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // 如果data是数组，尝试获取第一个元素的id
        taskIds = result.data.map(item => item.id || item.task_id || item.taskId).filter(Boolean);
      } else {
        console.error('无法识别的API响应格式:', result);
        console.log('可用的字段:', Object.keys(result));
        throw new Error('API响应格式错误，无法获取任务ID');
      }
      
      if (taskIds.length > 0) {
        // 开始监控生成状态
        await monitorGenerationStatus(taskIds);
        return result;
      } else {
        throw new Error(result.message || '生成失败：无法获取任务ID');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, []);

  return {
    isGenerating,
    generationProgress,
    currentSong,
    error,
    generatedSongs,
    generateMusic,
    generateCustomMusic,
    generateMusicFromReference,
    downloadMusic,
    saveMusicLocally,
    getLocalAIMusic,
    clearError: () => setError(null),
    clearCurrentSong: () => setCurrentSong(null),
    setError,
    setCurrentSong,
    setGenerationProgress
  };
};