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
                
                completedSongs.push({
                  id: item.id,
                  title: title,
                  audio_url: audioUrl,
                  image_url: item.image_url,
                  duration: duration,
                  prompt: item.prompt || '',
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
        sessionId
      };

      // 保存到localStorage
      const savedMusicKey = 'ai_generated_music';
      const savedMusic = JSON.parse(localStorage.getItem(savedMusicKey) || '[]');
      savedMusic.unshift(localMusic);
      localStorage.setItem(savedMusicKey, JSON.stringify(savedMusic));

      // 如果需要上传到云端
      if (shouldUploadToCloud && song.audio_url) {
        try {
          await uploadMusicToCloud(song, userCode, sessionId, onProgress);
          localMusic.uploadedToCloud = true;
          
          // 更新localStorage中的记录
          const updatedMusic = savedMusic.map(music => 
            music.id === localMusic.id ? { ...music, uploadedToCloud: true } : music
          );
          localStorage.setItem(savedMusicKey, JSON.stringify(updatedMusic));
          
        } catch (uploadError) {
          console.error('上传到云端失败:', uploadError);
          // 上传失败但本地保存成功
        }
      }

      return localMusic;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // 上传音乐到云端
  const uploadMusicToCloud = useCallback(async (song, userCode, sessionId, onProgress) => {
    try {
      // 首先下载音频文件
      if (onProgress) onProgress(10, '下载音频文件...');
      const response = await fetch(song.audio_url);
      if (!response.ok) {
        throw new Error('下载音频文件失败');
      }
      
      const audioBlob = await response.blob();
      if (onProgress) onProgress(30, '准备上传...');
      
      // 创建FormData
      const formData = new FormData();
      const fileName = `ai_music_${song.id || Date.now()}.mp3`;
      const audioFile = new File([audioBlob], fileName, { 
        type: 'audio/mpeg' 
      });
      
      formData.append('file', audioFile);
      
      // 构建上传URL
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      const uploadUrl = new URL(`${API_BASE_URL}/upload`);
      const folderPath = `recordings/${userCode}/${sessionId || 'ai_generated'}`;
      uploadUrl.searchParams.append('folder', folderPath);
      
      if (onProgress) onProgress(50, '上传到云端...');
      
      // 发送上传请求
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.status}`);
      }
      
      if (onProgress) onProgress(80, '处理上传结果...');
      
      const result = await uploadResponse.json();
      
      if (!result.success) {
        throw new Error(result.message || '上传失败');
      }
      
      if (onProgress) onProgress(100, '上传完成！');
      
      return {
        success: true,
        cloudUrl: result.file_url,
        objectKey: result.object_key,
        etag: result.etag
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