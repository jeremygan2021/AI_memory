import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './record.css';
import UploadMediaPage from './UploadMediaPage';
import AIMusicGenerator from './components/AIMusicGenerator';
import { getUserCode, buildRecordingPath, buildSessionStorageKey, validateUserCode } from './utils/userCode';
import recordButtonImg from './asset/record_button.png';
import mic_icon from './asset/icon/mic.png'


// API配置

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';



// 录音组件
const RecordComponent = () => {
  const { userid, id } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [isRecording, setIsRecording] = useState(false); // 是否正在录音
  const [isPaused, setIsPaused] = useState(false); // 是否暂停
  const [recordingTime, setRecordingTime] = useState(0); // 录音时长
  const [audioURL, setAudioURL] = useState(''); // 录音文件URL
  const [recordings, setRecordings] = useState([]); // 录音列表
  const [isSupported, setIsSupported] = useState(true); // 浏览器是否支持录音
  const [isLongPress, setIsLongPress] = useState(false); // 是否长按模式
  const [touchFeedback, setTouchFeedback] = useState(false); // 触摸反馈状态
  const [userCode, setUserCode] = useState(''); // 4字符用户代码

  const [boundRecordings, setBoundRecordings] = useState([]); // 绑定的录音列表
  
  // 新增：上传相关状态
  const [uploadStatus, setUploadStatus] = useState({}); // 上传状态 {recordingId: 'uploading'|'success'|'error'}
  const [uploadProgress, setUploadProgress] = useState({}); // 上传进度
  
  // 新增：防止无限跳转的状态
  const [justReturnedFromPlayer, setJustReturnedFromPlayer] = useState(false); // 是否刚从播放页面返回
  const [isCheckingFiles, setIsCheckingFiles] = useState(false); // 是否正在检查文件存在性
  

  
  // 新增：上传媒体弹窗相关状态
  const [showUploadModal, setShowUploadModal] = useState(false); // 是否显示上传弹窗
  const [wasRecordingBeforeModal, setWasRecordingBeforeModal] = useState(false); // 弹窗前是否在录音
  const [wasRecordingPausedBeforeModal, setWasRecordingPausedBeforeModal] = useState(false); // 弹窗前录音是否暂停
  const [uploadedMediaFiles, setUploadedMediaFiles] = useState([]); // 弹窗内上传的媒体文件
  const [mediaUploadingFiles, setMediaUploadingFiles] = useState(new Map()); // 媒体文件上传进度
  const [isDragOver, setIsDragOver] = useState(false); // 拖拽状态
  const [activeTab, setActiveTab] = useState('all'); // 媒体文件标签页
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [previewFile, setPreviewFile] = useState(null); // 预览文件
  const [isMobile, setIsMobile] = useState(false); // 是否移动设备
  const [videoPlaying, setVideoPlaying] = useState(false); // 视频播放状态
  const [videoAutoFullscreenTried, setVideoAutoFullscreenTried] = useState(false); // 是否已尝试自动全屏
  const videoRef = useRef(null); // 视频引用
  
  // 移动端录音相关状态
  const [isMobileRecording, setIsMobileRecording] = useState(false); // 是否正在移动端录音
  const [isMobileRecordingPaused, setIsMobileRecordingPaused] = useState(false); // 移动端录音是否暂停
  const [mobileRecordingTime, setMobileRecordingTime] = useState(0); // 移动端录音时长
  
  // AI音乐生成相关状态
  const [showAIMusicGenerator, setShowAIMusicGenerator] = useState(false); // 是否显示AI音乐生成器
  
  // 引用
  const mediaRecorderRef = useRef(null); // MediaRecorder实例
  const audioChunksRef = useRef([]); // 音频数据块
  const timerRef = useRef(null); // 计时器引用
  const streamRef = useRef(null); // 媒体流引用
  const longPressTimerRef = useRef(null); // 长按计时器
  const startBtnRef = useRef(null); // 开始按钮引用
  const mediaFileInputRef = useRef(null); // 媒体文件输入引用
  const mobileAudioFileInputRef = useRef(null); // 移动端音频文件输入引用
  const mobileMediaRecorderRef = useRef(null); // 移动端录音器引用
  const mobileAudioChunksRef = useRef([]); // 移动端音频数据块
  const mobileStreamRef = useRef(null); // 移动端媒体流引用
  const mobileTimerRef = useRef(null); // 移动端录音计时器

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
    
    // 检查是否是从播放页面返回的或播放页面加载失败
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('deleted') === 'true') {
      setJustReturnedFromPlayer(true);
      // 清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // 3秒后重置标记，允许正常跳转
      setTimeout(() => {
        setJustReturnedFromPlayer(false);
      }, 3000);
    } else if (urlParams.get('fromPlayer') === 'true') {
      // 从播放页面正常返回，永久停止智能跳转
      setJustReturnedFromPlayer(true);
      // 清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // 不再重置标记，永久停止智能跳转功能
    } else if (urlParams.get('recordingNotFound') === 'true' || urlParams.get('loadError') === 'true') {
      // 播放页面加载失败返回，暂停智能跳转5分钟防止循环
      console.log('检测到播放页面加载失败，暂停智能跳转5分钟');
      setJustReturnedFromPlayer(true);
      // 清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // 5分钟后重置标记
      setTimeout(() => {
        console.log('播放页面加载失败保护期结束，恢复智能跳转');
        setJustReturnedFromPlayer(false);
      }, 5 * 60 * 1000); // 5分钟
    }
  }, [userid, navigate]);

  // 新增：检查录音文件是否存在于云端
  const checkRecordingExists = async (recording) => {
    try {
      // 特殊处理：AI生成的音乐，如果有cloudUrl就认为存在
      if (recording.isAIGenerated && recording.cloudUrl) {
        console.log('AI生成的音乐，跳过存在性检查:', recording.fileName);
        return true;
      }

      if (!recording.objectKey && !recording.cloudUrl) {
        return false; // 没有云端信息，认为不存在
      }

      // 方法1: 通过API检查文件是否存在
      if (recording.objectKey) {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(recording.objectKey)}`, {
            method: 'HEAD'
          });
          if (response.ok) {
            return true;
          }
        } catch (error) {
          console.warn('API检查文件失败:', error);
        }
      }

      // 方法2: 通过cloudUrl直接检查
      if (recording.cloudUrl) {
        try {
          const response = await fetch(recording.cloudUrl, {
            method: 'HEAD'
          });
          if (response.ok) {
            return true;
          }
        } catch (error) {
          console.warn('cloudUrl检查失败:', error);
          // 对于AI生成的音乐，即使HEAD请求失败也认为存在
          if (recording.isAIGenerated) {
            console.log('AI生成的音乐，HEAD请求失败但认为存在:', recording.fileName);
            return true;
          }
        }
      }

      // 方法3: 尝试通过文件列表API查找
      if (recording.objectKey) {
        try {
          const prefix = recording.objectKey.substring(0, recording.objectKey.lastIndexOf('/') + 1);
          const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=100`);
          
          if (response.ok) {
            const result = await response.json();
            const files = result.files || result.data || result.objects || result.items || result.results || [];
            
            // 查找是否存在匹配的文件
            const fileExists = files.some(file => {
              const objectKey = file.object_key || file.objectKey || file.key || file.name;
              return objectKey === recording.objectKey;
            });
            
            if (fileExists) {
              return true;
            }
          }
        } catch (error) {
          console.warn('通过文件列表检查失败:', error);
        }
      }

      return false;
    } catch (error) {
      console.warn('检查录音文件存在性失败:', error);
      // 对于AI生成的音乐，即使检查失败也认为存在
      if (recording.isAIGenerated) {
        console.log('AI生成的音乐，检查失败但认为存在:', recording.fileName);
        return true;
      }
      return false; // 检查失败时认为文件不存在，避免跳转到空页面
    }
  };

  // 新增：清理已删除的录音文件
  const cleanupDeletedRecordings = async () => {
    if (boundRecordings.length === 0) return;
    
    setIsCheckingFiles(true);
    
    try {
      // 检查所有绑定录音的存在性
      const existenceChecks = await Promise.all(
        boundRecordings.map(async (recording) => {
          const exists = await checkRecordingExists(recording);
          return { recording, exists };
        })
      );

      // 过滤出仍存在的录音
      const stillExistingRecordings = existenceChecks
        .filter(({ exists }) => exists)
        .map(({ recording }) => recording);

      // 找出已删除的录音
      const deletedRecordings = existenceChecks
        .filter(({ exists }) => !exists)
        .map(({ recording }) => recording);

      if (deletedRecordings.length > 0) {
        console.log('发现已删除的录音文件:', deletedRecordings);
        
        // 更新绑定录音列表，移除已删除的文件
        setBoundRecordings(stillExistingRecordings);
        
        // 显示清理提示
        const deletedCount = deletedRecordings.length;
        console.log(`已清理 ${deletedCount} 个已删除的录音文件`);
      }

      return stillExistingRecordings;
    } catch (error) {
      console.error('清理已删除录音时出错:', error);
      // 出错时保留AI生成的音乐
      const aiGeneratedRecordings = boundRecordings.filter(recording => recording.isAIGenerated);
      const otherRecordings = boundRecordings.filter(recording => !recording.isAIGenerated);
      console.log('出错时保留AI生成的音乐:', aiGeneratedRecordings.length, '个');
      return [...aiGeneratedRecordings, ...otherRecordings];
    } finally {
      setIsCheckingFiles(false);
    }
  };

  // 新增：监听来自其他页面的删除通知
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'recordingDeleted' && e.newValue) {
        const deletedRecordingId = e.newValue;
        console.log('收到录音删除通知:', deletedRecordingId);
        
        // 从绑定列表中移除被删除的录音
        setBoundRecordings(prev => 
          prev.filter(recording => 
            recording.id !== deletedRecordingId && 
            recording.originalRecordingId !== deletedRecordingId
          )
        );
        
        // 清理通知
        localStorage.removeItem('recordingDeleted');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 也检查是否有未处理的删除通知
    const pendingDeletion = localStorage.getItem('recordingDeleted');
    if (pendingDeletion) {
      handleStorageChange({
        key: 'recordingDeleted',
        newValue: pendingDeletion
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 新增：上传音频文件到服务器
  const uploadAudioFile = async (audioBlob, recordingId, fileName) => {
    try {
      console.log('开始上传音频文件:', { fileName, recordingId, blobSize: audioBlob.size });
      
      // 设置上传状态为进行中
      setUploadStatus(prev => ({
        ...prev,
        [recordingId]: 'uploading'
      }));
      
      // 创建FormData
      const formData = new FormData();
      
      // 创建文件对象，统一使用MP3 MIME类型
      const audioFile = new File([audioBlob], fileName, { 
        type: 'audio/mpeg' // 使用MP3的标准MIME类型
      });
      
      formData.append('file', audioFile);
      
      // 构建URL，将folder作为查询参数，格式为 userCode/sessionId
      const uploadUrl = new URL(`${API_BASE_URL}/upload`);
      const folderPath = buildRecordingPath(id || 'default', userCode);
      uploadUrl.searchParams.append('folder', folderPath);
      
      console.log('上传URL:', uploadUrl.toString());
      console.log('文件信息:', { name: audioFile.name, type: audioFile.type, size: audioFile.size });
      console.log('文件夹路径:', folderPath);
      
      // 发送上传请求
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // 尝试获取错误详情
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || response.statusText;
        } catch {
          errorDetail = response.statusText;
        }
        throw new Error(`上传失败: ${response.status} - ${errorDetail}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 上传成功
        setUploadStatus(prev => ({
          ...prev,
          [recordingId]: 'success'
        }));
        
        console.log('音频上传成功:', result);
        
        // 返回上传结果
        return {
          success: true,
          cloudUrl: result.file_url,
          objectKey: result.object_key,
          etag: result.etag,
          requestId: result.request_id
        };
      } else {
        throw new Error(result.message || '上传失败');
      }
      
    } catch (error) {
      console.error('上传音频失败:', error);
      
      // 设置上传状态为失败
      setUploadStatus(prev => ({
        ...prev,
        [recordingId]: 'error'
      }));
      
      // 显示错误提示
      alert(`音频上传失败: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  // 重试上传
  const retryUpload = async (recording) => {
    if (recording.audioBlob) {
      // 统一使用mp3扩展名以提高兼容性
      const fileName = `recording_${recording.id}.mp3`;
      await uploadAudioFile(recording.audioBlob, recording.id, fileName);
    }
  };

  // 从localStorage加载绑定的录音
  useEffect(() => {
    console.log('record.js: 尝试从localStorage加载boundRecordings', { id, userCode });
    if (id && userCode) {
      const storageKey = buildSessionStorageKey(id, userCode);
      const stored = localStorage.getItem(storageKey);
      console.log('record.js: localStorage中的存储键', storageKey, '存储的内容', stored);
      if (stored) {
        try {
          const recordings = JSON.parse(stored);
          console.log('record.js: 解析后的recordings', recordings);
          setBoundRecordings(recordings);
        } catch (error) {
          console.error('record.js: 解析localStorage数据失败', error);
        }
      } else {
        console.log('record.js: localStorage中没有找到数据');
      }
    }
  }, [id, userCode]);

  // 保存绑定的录音到localStorage
  useEffect(() => {
    console.log('record.js: boundRecordings状态变化', boundRecordings);
    if (id && userCode) {
      const storageKey = buildSessionStorageKey(id, userCode);
      localStorage.setItem(storageKey, JSON.stringify(boundRecordings));
      console.log('record.js: 已保存到localStorage', storageKey, boundRecordings);
    }
  }, [boundRecordings, id, userCode]);

  // 检查浏览器支持
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      console.error('浏览器不支持录音功能');
    }
  }, []);

  // 检查API服务状态
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          console.log('API服务连接正常');
        } else {
          console.warn('API服务响应异常:', response.status);
        }
      } catch (error) {
        console.warn('无法连接到API服务:', error.message);
      }
    };
    
    checkApiHealth();
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true, // 回声消除
          noiseSuppression: true, // 噪音抑制
          sampleRate: 44100 // 采样率
        } 
      });
      
      streamRef.current = stream;
      
      // 创建MediaRecorder实例，优先使用MP3兼容格式
      let mimeType = '';
      let extension = 'mp3';
      
      // 尝试使用音频格式，优先选择MP3兼容的格式
      const supportedTypes = [
        'audio/mp4',
        'audio/mpeg', 
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          // 根据MIME类型设置扩展名
          if (type.includes('mp4')) {
            extension = 'mp3'; // 使用mp3扩展名以便更好的兼容性
          } else if (type.includes('mpeg')) {
            extension = 'mp3';
          } else if (type.includes('webm')) {
            extension = 'mp3'; // 统一使用mp3扩展名
          } else if (type.includes('wav')) {
            extension = 'mp3'; // 统一使用mp3扩展名
          }
          break;
        }
      }
      
      console.log('使用的音频格式:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 监听录音停止事件
      mediaRecorder.onstop = async () => {
        // 确保计时器已停止
        stopTimer();
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // 获取当前录音时长（在停止时的最终时长）
        const finalDuration = recordingTime;
        
        // 创建录音记录
        const newRecording = {
          id: Date.now(),
          url: url,
          audioBlob: audioBlob, // 保存Blob用于上传
          duration: finalDuration,
          timestamp: new Date().toLocaleString('zh-CN'),
          sessionId: id || 'default',
          cloudUrl: null, // 云端URL
          uploaded: false // 是否已上传
        };
        
        setRecordings(prev => [newRecording, ...prev]);
        
        // 自动上传到云端
        // 统一使用mp3扩展名以提高兼容性
        const fileName = `recording_${newRecording.id}.mp3`;
        const uploadResult = await uploadAudioFile(audioBlob, newRecording.id, fileName);
        
        if (uploadResult.success) {
          // 更新录音记录，添加云端信息
          setRecordings(prev => prev.map(recording => 
            recording.id === newRecording.id 
              ? {
                  ...recording,
                  cloudUrl: uploadResult.cloudUrl,
                  objectKey: uploadResult.objectKey,
                  etag: uploadResult.etag,
                  uploaded: true
                }
              : recording
          ));
        }
      };
      
      // 开始录音
      mediaRecorder.start(1000); // 每秒收集一次数据
      setIsRecording(true);
      setIsPaused(false);
      
      // 开始计时
      startTimer();
      
    } catch (error) {
      console.error('录音启动失败:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 开始计时
  const startTimer = () => {
    // 确保之前的计时器被清除
    stopTimer();
    console.log('启动计时器');
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        console.log('计时器更新:', prev + 1);
        return prev + 1;
      });
    }, 1000);
  };

  // 停止计时
  const stopTimer = () => {
    if (timerRef.current) {
      console.log('停止计时器');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 停止录音
  const stopRecording = () => {
    console.log('停止录音被调用');
    // 立即停止计时器和更新状态
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // 停止媒体流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 暂停录音
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
        setIsPaused(true);
      }
    }
  };

  // 重置录音
  const resetRecording = () => {
    console.log('重置录音被调用');
    // 立即停止计时器和更新状态
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioURL('');
    
    // 如果正在录音，先停止
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // 停止媒体流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 绑定录音
  const bindRecording = (recording) => {
    const boundRecording = {
      ...recording,
      boundAt: new Date().toLocaleString('zh-CN'),
      sessionId: id,
      userCode: userCode,
      // 保存原始录音ID以便播放页面能够匹配
      originalRecordingId: recording.id,
      // 如果有objectKey，也保存下来
      objectKey: recording.objectKey || null,
      // 保存云端URL
      cloudUrl: recording.cloudUrl || null,
      // 保存视频标识和文件信息
      isVideo: recording.isVideo || false,
      fileName: recording.fileName || null,
      fileType: recording.fileType || null
    };
    
    setBoundRecordings(prev => [boundRecording, ...prev]);
    
    // 从临时录音列表中移除
    setRecordings(prev => prev.filter(r => r.id !== recording.id));
    
    // 显示成功提示
    const uploadStatusText = recording.uploaded ? '(已上传到云端)' : '(本地存储)';
    alert(`录音已绑定到会话 ${userCode}/${id} ${uploadStatusText}`);
  };

  // 进入播放页面
  const enterPlayerMode = (recording) => {
    let uniqueId = recording.id;
    // 优先用objectKey里的唯一识别码（只取最后一段下划线后的部分）
    if (recording.objectKey) {
      // 取文件名（不含扩展名）
      const matches = recording.objectKey.match(/([^/]+)\.[a-zA-Z0-9]+$/);
      if (matches && matches[1]) {
        // 只取最后一个下划线后的部分
        const parts = matches[1].split('_');
        uniqueId = parts[parts.length - 1];
      }
    }
    navigate(`/${userCode}/${id}/play/${uniqueId}`);
  };

  // 删除录音
  const deleteRecording = async (recordingId, isBound = false) => {
    const targetRecordings = isBound ? boundRecordings : recordings;
    const recording = targetRecordings.find(r => r.id === recordingId);
    
    if (recording && recording.objectKey) {
      // 如果有云端文件，询问是否同时删除
      const deleteCloud = window.confirm('是否同时删除云端文件？');
      
      if (deleteCloud) {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(recording.objectKey)}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log('云端文件删除成功');
          } else {
            console.warn('云端文件删除失败');
          }
        } catch (error) {
          console.error('删除云端文件时出错:', error);
        }
      }
    }
    
    // 删除本地记录
    if (isBound) {
      setBoundRecordings(prev => prev.filter(recording => recording.id !== recordingId));
    } else {
      setRecordings(prev => prev.filter(recording => recording.id !== recordingId));
    }
  };

  // 长按录音处理函数
  const handleLongPressStart = (e) => {
    e.preventDefault();
    setTouchFeedback(true);
    
    // 触觉反馈（如果支持）
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      if (!isRecording) {
        startRecording();
      }
      // 长按开始的触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }, 500);
  };

  const handleLongPressEnd = (e) => {
    e.preventDefault();
    setTouchFeedback(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isLongPress && isRecording) {
      stopRecording();
      setIsLongPress(false);
      // 长按结束的触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  // 按钮触摸事件处理
  const handleTouchStart = (callback) => (e) => {
    if (window.innerWidth <= 768) { // 仅在移动设备上启用
      handleLongPressStart(e);
    } else {
      callback();
    }
  };

  const handleTouchEnd = (e) => {
    if (window.innerWidth <= 768) { // 仅在移动设备上启用
      if (!isLongPress) {
        // 短按处理
        if (!isRecording) {
          startRecording();
        }
      }
      handleLongPressEnd(e);
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // 清理长按计时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      
      // 停止媒体流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 停止录音
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // 清理移动端录音相关资源
      if (mobileTimerRef.current) {
        clearInterval(mobileTimerRef.current);
      }
      
      if (mobileStreamRef.current) {
        mobileStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (mobileMediaRecorderRef.current && mobileMediaRecorderRef.current.state !== 'inactive') {
        mobileMediaRecorderRef.current.stop();
      }
    };
  }, []);

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取上传状态图标
  const getUploadStatusIcon = (recordingId) => {
    const status = uploadStatus[recordingId];
    switch (status) {
      case 'uploading':
        return '⏳'; // 上传中
      case 'success':
        return '☁️'; // 上传成功
      case 'error':
        return '❌'; // 上传失败
      default:
        return '📱'; // 本地文件
    }
  };

  // 获取上传状态文本
  const getUploadStatusText = (recordingId) => {
    const status = uploadStatus[recordingId];
    switch (status) {
      case 'uploading':
        return '上传中...';
      case 'success':
        return '已上传';
      case 'error':
        return '上传失败';
      default:
        return '本地存储';
    }
  };

  // 弹出上传照片和视频弹窗
  const goToUploadMediaPage = async () => {
    console.log('点击上传照片和视频按钮，userCode:', userCode);
    if (!userCode || !id) {
      console.error('userCode 或 sessionId 为空，无法弹出弹窗');
      return;
    }



    // 加载已上传的媒体文件
    await loadUploadedMediaFiles();
    
    // 弹出弹窗
    setShowUploadModal(true);
  };

  // 关闭上传弹窗
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setPreviewFile(null);
    
    // 如果弹窗前正在录音且未暂停，恢复录音
    if (wasRecordingBeforeModal && !wasRecordingPausedBeforeModal) {
      console.log('关闭弹窗，恢复录音');
      if (mediaRecorderRef.current && isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
        setIsPaused(false);
      }
    }
    
    // 重置状态
    // setWasRecordingBeforeModal(false);
    // setWasRecordingPausedBeforeModal(false);
  };

  // 加载已上传的媒体文件
  const loadUploadedMediaFiles = async () => {
    try {
      // 从会话专用存储获取已上传的媒体文件
      const sessionStorageKey = `uploadedMedia_${userCode}_${id}`;
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored) {
        const files = JSON.parse(stored);
        setUploadedMediaFiles(files);
      } else {
        setUploadedMediaFiles([]);
      }
    } catch (error) {
      console.error('加载媒体文件失败:', error);
      setUploadedMediaFiles([]);
    }
  };

  // 保存媒体文件到localStorage（统一存储）
  const saveMediaFileToStorage = (fileInfo) => {
    // 保存到录音会话专用的存储中
    const sessionStorageKey = `uploadedMedia_${userCode}_${id}`;
    const sessionFiles = JSON.parse(localStorage.getItem(sessionStorageKey) || '[]');
    const updatedSessionFiles = [fileInfo, ...sessionFiles];
    localStorage.setItem(sessionStorageKey, JSON.stringify(updatedSessionFiles));
    setUploadedMediaFiles(updatedSessionFiles);

    // 同时保存到全局存储中（供主页和媒体页面使用）
    const globalFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const updatedGlobalFiles = [fileInfo, ...globalFiles];
    localStorage.setItem('uploadedFiles', JSON.stringify(updatedGlobalFiles));
    
    // 触发全局文件更新事件
    window.dispatchEvent(new Event('filesUpdated'));
  };

  // 生成唯一的媒体文件ID（包含会话信息用于区分来源）
  const generateUniqueMediaId = (isVideoOrAudio = false) => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    const uniqueId = Math.random().toString(36).substr(2, 8);
    const sessionId = id || 'default';
    const prefix = isVideoOrAudio ? 'vid' : 'img';
    return `${prefix}_${sessionId}_${timestamp}_${random}_${uniqueId}`;
  };

  // 上传媒体文件到服务器
  const uploadMediaFile = async (file, tempId) => {
    try {
      console.log('开始上传媒体文件:', { 
        fileName: file.name, 
        tempId, 
        blobSize: file.size,
        fileType: file.type,
        isMobile: isMobile,
        isTablet: isMobile && (window.innerWidth >= 768 && window.innerWidth <= 1366),
        userAgent: navigator.userAgent
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 设置上传进度监听
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            // console.log(`上传进度: ${percentComplete.toFixed(1)}% (${e.loaded}/${e.total})`);
            setMediaUploadingFiles(prev => new Map(prev.set(tempId, {
              ...prev.get(tempId),
              progress: percentComplete
            })));
          }
        });
        
        xhr.addEventListener('loadstart', () => {
          console.log('开始上传文件到服务器');
          setMediaUploadingFiles(prev => new Map(prev.set(tempId, {
            fileName: file.name,
            progress: 0,
            uploading: true
          })));
        });
        
        xhr.addEventListener('load', () => {
          console.log('服务器响应状态:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log('服务器响应结果:', result);
              if (result.success) {
                // 上传成功，立即移除进度显示
                setMediaUploadingFiles(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(tempId);
                  return newMap;
                });
                
                resolve({
                  success: true,
                  cloudUrl: result.file_url,
                  objectKey: result.object_key,
                  etag: result.etag,
                  requestId: result.request_id
                });
              } else {
                console.error('服务器返回错误:', result);
                throw new Error(result.message || '上传失败');
              }
            } catch (parseError) {
              console.error('响应解析失败:', parseError, '原始响应:', xhr.responseText);
              reject(new Error('响应解析失败'));
            }
          } else {
            console.error('HTTP错误:', xhr.status, xhr.statusText, '响应:', xhr.responseText);
            reject(new Error(`上传失败: ${xhr.status} - ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          console.error('网络错误或请求失败');
          setMediaUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('网络错误'));
        });
        
        xhr.addEventListener('abort', () => {
          console.log('上传被取消');
          setMediaUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
          reject(new Error('上传被取消'));
        });
        
        // 构建URL，将folder作为查询参数，格式为 userCode/sessionId
        const uploadUrl = new URL(`${API_BASE_URL}/upload`);
        const folderPath = buildRecordingPath(id || 'default', userCode);
        uploadUrl.searchParams.append('folder', folderPath);
        
        console.log('媒体文件上传URL:', uploadUrl.toString());
        console.log('文件夹路径:', folderPath);
        console.log('请求详情:', {
          method: 'POST',
          url: uploadUrl.toString(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
      
    } catch (error) {
      console.error('上传媒体文件失败:', error);
      setMediaUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  // 处理媒体文件选择
  const handleMediaFileSelect = async (files, options = {}) => {
    const fileArray = Array.from(files);
    const { audioOnly: forceAudioOnly = false } = options; // 是否强制仅音频模式
    
    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 检测平板设备（包括Android平板）
    const isTablet = isMobile && (
      /iPad|Tablet|PlayBook|Kindle|Silk|Android.*(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
      (window.innerWidth >= 768 && window.innerWidth <= 1366)
    );
    
    for (const file of fileArray) {
      // 检查文件类型 - 增强iOS格式支持
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/') || 
                     file.name.match(/\.(mp3|wav|m4a|aac|ogg|webm|caf|amr|3gp)$/i) ||
                     file.type === 'audio/x-m4a' || 
                     file.type === 'audio/mp4' ||
                     file.type === '' && file.name.match(/\.(m4a|aac|caf)$/i); // 处理MIME类型为空的情况
      
      if (!isImage && !isVideo && !isAudio) {
        alert(`不支持的文件类型: ${file.name}. 支持的格式：图片、视频、音频`);
        continue;
      }
      
      // 检查文件大小（限制为100MB）
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 大小超过100MB限制`);
        continue;
      }
      
      // 移动设备（包括平板）视频格式转换处理
      let processedFile = file;
      let originalFormat = '';
      let convertedFormat = '';
      
      if (isVideo && (isMobile || isTablet)) {
        // 扩展格式检测，不仅仅是mov格式
        const needsConversion = 
          file.type === 'video/quicktime' || 
          file.name.toLowerCase().endsWith('.mov') ||
          file.type === 'video/3gpp' ||
          file.name.toLowerCase().endsWith('.3gp') ||
          file.type === 'video/x-msvideo' ||
          file.name.toLowerCase().endsWith('.avi') ||
          // 某些Android设备可能产生的格式
          file.type === '' && /\.(mov|3gp|avi|wmv|flv)$/i.test(file.name);
        
        if (needsConversion) {
          console.log('检测到移动设备的非标准视频格式，准备转换为mp4格式');
          originalFormat = file.name.split('.').pop().toLowerCase() || file.type;
          
          // 创建新的文件名（统一改为.mp4）
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${nameWithoutExt}.mp4`;
          
          // 创建新的File对象，修改MIME类型为video/mp4
          processedFile = new File([file], newFileName, {
            type: 'video/mp4',
            lastModified: file.lastModified
          });
          
          convertedFormat = 'mp4';
          console.log(`移动端视频格式转换: ${originalFormat} -> ${convertedFormat}`);
          console.log(`文件名转换: ${file.name} -> ${newFileName}`);
          console.log(`MIME类型转换: ${file.type} -> video/mp4`);
        }
      }
      
      // 增强的视频格式兼容性检查
      if (isVideo) {
        const supportedVideoFormats = ['mp4', 'webm', 'mov', '3gp', 'avi']; // 扩展支持的格式，会被转换为mp4
        const fileExtension = processedFile.name.split('.').pop().toLowerCase();
        
        if (!supportedVideoFormats.includes(fileExtension) && !processedFile.type.startsWith('video/')) {
          alert(`不支持的视频格式: ${processedFile.name}. 支持的格式：MP4, WebM, MOV, 3GP, AVI（移动端自动转换）`);
          continue;
        }
        
        // 显示转换信息
        if (originalFormat && convertedFormat) {
          console.log(`✅ 移动端视频格式自动转换成功: ${originalFormat} → ${convertedFormat}`);
        }
      }
      
      // 询问视频播放模式（仅对视频文件）
      let audioOnly = false;
      if (isVideo) {
        if (forceAudioOnly) {
          // 如果是从"上传本地录音"按钮进入，默认仅播放音频
          audioOnly = true;
          console.log('从上传本地录音按钮选择视频文件，默认仅播放音频');
        } else {
          // 从其他入口进入，询问用户
          audioOnly = window.confirm('是否只播放声音？点击"确定"仅播放声音，点击"取消"播放视频+声音。');
        }
      }
      
      // 生成唯一ID（包含会话ID）
      const uniqueId = generateUniqueMediaId(isVideo || isAudio);
      const tempId = Date.now() + Math.random();
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(processedFile);
      
      // 如果是音频文件或仅播放声音的视频，创建录音记录；否则创建媒体文件记录
      if (isAudio || audioOnly) {
        // 创建录音记录对象
        const recordingId = Date.now() + Math.random();
        
        // 确定上传文件名
        let uploadFileName;
        if (isAudio) {
          // 音频文件统一使用mp3扩展名
          uploadFileName = `recording_${recordingId}.mp3`;
        } else if (audioOnly) {
          // 仅音频的视频文件，保持原扩展名但标记为音频
          const fileExtension = processedFile.name.split('.').pop().toLowerCase();
          uploadFileName = `recording_${recordingId}.mp3`;
        }

        // 创建录音记录
        const newRecording = {
          id: recordingId,
          url: previewUrl,
          audioBlob: processedFile,
          duration: 0, // 将在音频加载后获取
          timestamp: new Date().toLocaleString('zh-CN'),
          sessionId: id || 'default',
          cloudUrl: null,
          uploaded: false,
          fileName: processedFile.name,
          isVideo: isVideo && !audioOnly, // 只有视频且不是仅音频模式时为true
          fileType: processedFile.type,
          audioOnly: audioOnly // 标记是否为仅音频模式
        };

        // 添加到录音列表
        setRecordings(prev => [newRecording, ...prev]);

        // 获取时长
        try {
          const duration = await getMediaDuration(previewUrl, isVideo);
          setRecordings(prev => prev.map(rec => 
            rec.id === recordingId ? { ...rec, duration: Math.floor(duration) } : rec
          ));
        } catch (error) {
          console.warn('无法获取媒体时长:', error);
        }

        // 上传到云端
        try {
          const uploadResult = await uploadAudioFile(processedFile, recordingId, uploadFileName);

          if (uploadResult && uploadResult.success) {
            // 更新录音记录，添加云端信息
            setRecordings(prev => prev.map(recording => 
              recording.id === recordingId 
                ? {
                    ...recording,
                    cloudUrl: uploadResult.cloudUrl,
                    objectKey: uploadResult.objectKey,
                    etag: uploadResult.etag,
                    uploaded: true
                  }
                : recording
            ));

            // 显示上传成功提示
            const successMessage = audioOnly ? 
              `视频(仅音频)上传成功！` : 
              `录音上传成功！`;
            alert(successMessage);

            console.log('录音文件上传成功:', uploadResult);
          } else {
            const errorMsg = uploadResult?.error || '未知错误';
            console.error('录音文件上传失败:', errorMsg);
            alert(`录音上传失败: ${errorMsg}`);
            
            // 从录音列表中移除失败的文件
            setRecordings(prev => prev.filter(r => r.id !== recordingId));
          }
        } catch (error) {
          console.error('录音文件处理失败:', error);
          alert(`录音处理失败: ${error.message}`);
          
          // 从录音列表中移除失败的文件
          setRecordings(prev => prev.filter(r => r.id !== recordingId));
        }
        
        // 关闭弹窗
        closeUploadModal();
        continue; // 继续处理下一个文件
      }
      
      // 创建媒体文件信息对象（图片和完整视频）
      const fileInfo = {
        id: uniqueId,
        name: processedFile.name,
        type: isVideo ? 'video' : 'image',
        size: processedFile.size,
        preview: previewUrl,
        url: previewUrl,
        timestamp: new Date().toLocaleString('zh-CN'),
        sessionId: id, // 录音会话ID
        userCode: userCode,
        uploaded: false,
        cloudUrl: null,
        objectKey: null,
        fromRecordPage: true, // 标记来源于录音页面
        originalFormat: originalFormat, // 记录原始格式
        convertedFormat: convertedFormat, // 记录转换后格式
        isConverted: !!(originalFormat && convertedFormat) // 是否经过转换
      };
      
      // 先添加到本地列表
      const updatedFiles = [fileInfo, ...uploadedMediaFiles];
      setUploadedMediaFiles(updatedFiles);
      
      // 上传到云端
      try {
        console.log('开始上传媒体文件到云端...', { fileName: processedFile.name, fileSize: processedFile.size });
        const uploadResult = await uploadMediaFile(processedFile, tempId);
        
        console.log('媒体文件上传结果:', uploadResult);
        
        if (uploadResult && uploadResult.success) {
          // 更新文件信息
          const finalFileInfo = {
            ...fileInfo,
            uploaded: true,
            cloudUrl: uploadResult.cloudUrl,
            objectKey: uploadResult.objectKey,
            etag: uploadResult.etag,
            preview: uploadResult.cloudUrl, // 使用云端URL作为预览
            url: uploadResult.cloudUrl // 使用云端URL作为访问地址
          };
          
          // 释放本地blob URL以节省内存
          if (fileInfo.preview && fileInfo.preview.startsWith('blob:')) {
            URL.revokeObjectURL(fileInfo.preview);
          }
          
          // 更新文件列表
          setUploadedMediaFiles(prev => 
            prev.map(f => f.id === uniqueId ? finalFileInfo : f)
          );
          
          // 保存到localStorage
          saveMediaFileToStorage(finalFileInfo);
          
          // 显示上传成功提示，包含转换信息
          const successMessage = convertedFormat ? 
            `${isVideo ? '视频' : '图片'}上传成功！(${originalFormat} → ${convertedFormat} 格式转换)` : 
            `${isVideo ? '视频' : '图片'}上传成功！`;
          alert(successMessage);
          
          console.log('媒体文件上传成功:', finalFileInfo);
        } else {
          const errorMsg = uploadResult?.error || '未知错误';
          console.error('媒体文件上传失败:', errorMsg);
          alert(`${isVideo ? '视频' : '图片'}上传失败: ${errorMsg}`);
          
          // 释放本地blob URL
          if (fileInfo.preview && fileInfo.preview.startsWith('blob:')) {
            URL.revokeObjectURL(fileInfo.preview);
          }
          
          // 从本地列表中移除失败的文件
          setUploadedMediaFiles(prev => prev.filter(f => f.id !== uniqueId));
        }
      } catch (error) {
        console.error('媒体文件处理失败:', error);
        alert(`${isVideo ? '视频' : '图片'}处理失败: ${error.message}`);
        
        // 释放本地blob URL
        if (fileInfo.preview && fileInfo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(fileInfo.preview);
        }
        
        // 从本地列表中移除失败的文件
        setUploadedMediaFiles(prev => prev.filter(f => f.id !== uniqueId));
      }
    }
  };

  // 手动刷新录音列表
  const refreshRecordings = async () => {
    if (isCheckingFiles) return; // 避免重复检查
    
    await cleanupDeletedRecordings();
  };

  // 媒体弹窗相关处理函数
  const handleMediaUploadAreaClick = () => {
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.click();
    }
  };

  const handleMediaFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMediaFileSelect(files);
    }
  };

  const handleMediaDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleMediaDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleMediaDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMediaFileSelect(files);
    }
  };

  const handleMediaPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/')) {
        const file = item.getAsFile();
        if (file) {
          handleMediaFileSelect([file]);
        }
      }
    }
  };

  const handleDeleteMediaFile = async (fileId) => {
    const file = uploadedMediaFiles.find(f => f.id === fileId);
    
    if (file && file.objectKey) {
      // 如果有云端文件，询问是否同时删除
      const deleteCloud = window.confirm('是否同时删除云端文件？');
      
      if (deleteCloud) {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(file.objectKey)}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log('云端媒体文件删除成功');
          } else {
            console.warn('云端媒体文件删除失败');
          }
        } catch (error) {
          console.error('删除云端媒体文件时出错:', error);
        }
      }
    }
    
    // 从会话存储中删除
    const updatedSessionFiles = uploadedMediaFiles.filter(f => f.id !== fileId);
    setUploadedMediaFiles(updatedSessionFiles);
    
    const sessionStorageKey = `uploadedMedia_${userCode}_${id}`;
    localStorage.setItem(sessionStorageKey, JSON.stringify(updatedSessionFiles));

    // 从全局存储中删除
    const globalFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const updatedGlobalFiles = globalFiles.filter(f => f.id !== fileId);
    localStorage.setItem('uploadedFiles', JSON.stringify(updatedGlobalFiles));
    
    // 触发全局文件更新事件
    window.dispatchEvent(new Event('filesUpdated'));
  };

  const handlePreviewMediaFile = (file) => {
    // 统一使用弹窗预览，不再跳转播放页面
    setPreviewFile(file);
    if (isMobile) {
      // 延迟添加CSS类，确保组件状态更新完成
      setTimeout(() => {
        document.body.classList.add('fullscreen-preview-open');
        document.documentElement.classList.add('fullscreen-preview-open');
      }, 10);
    }
  };

  const closeMediaPreview = () => {
    setPreviewFile(null);
    setVideoPlaying(false);
    setVideoAutoFullscreenTried(false);
    
    // 立即移除CSS类恢复页面滚动
    document.body.classList.remove('fullscreen-preview-open');
    document.documentElement.classList.remove('fullscreen-preview-open');
    
    // 确保滚动恢复正常（添加小延迟让CSS变化生效）
    setTimeout(() => {
      // 强制重置滚动相关样式
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    }, 50);
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      // 退出全屏（兼容各平台）
      if (videoRef.current._fullscreenCleanup) {
        videoRef.current._fullscreenCleanup();
        videoRef.current._fullscreenCleanup = null;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      if (videoRef.current.webkitExitFullscreen) {
        videoRef.current.webkitExitFullscreen();
      }
    }
  };

  // 自动全屏播放（仅移动端视频弹窗，且只尝试一次）
  useEffect(() => {
    if (!(isMobile && previewFile && previewFile.type === 'video')) {
      setVideoAutoFullscreenTried(false); // 关闭弹窗时重置
    }
  }, [isMobile, previewFile]);

  // 视频 loadedmetadata 后自动播放（不自动全屏）
  const handleVideoLoadedMetadata = () => {
    if (isMobile && previewFile && previewFile.type === 'video' && videoRef.current && !videoAutoFullscreenTried) {
      setVideoAutoFullscreenTried(true);
      const video = videoRef.current;
      // 只自动播放，不自动全屏
      video.play().catch(() => {});
      // 清理全屏监听
      if (video._fullscreenCleanup) {
        video._fullscreenCleanup();
        video._fullscreenCleanup = null;
      }
    }
  };

  // 用户点击播放时再自动全屏
  const handleVideoPlay = () => {
    if (isMobile && previewFile && previewFile.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      // 检测iOS设备
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      try {
        if (isIOS) {
          // iOS设备使用特殊的全屏API
          if (video.webkitEnterFullscreen) {
            // 确保视频已开始播放再进入全屏
            setTimeout(() => {
              video.webkitEnterFullscreen();
            }, 100);
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        } else {
          // 非iOS设备使用标准全屏API
          if (video.requestFullscreen) {
            video.requestFullscreen().catch(() => {});
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          }
        }
      } catch (e) {
        console.log('全屏播放失败:', e);
      }
      
      // 监听全屏变化，退出全屏时自动关闭弹窗
      const handleFullscreenChange = () => {
        const isFull = document.fullscreenElement === video || 
                      video.webkitDisplayingFullscreen || 
                      document.webkitFullscreenElement === video;
        if (!isFull) {
          setTimeout(() => {
            setPreviewFile(null);
            setVideoPlaying(false);
          }, 200);
        }
      };
      
      // iOS需要监听不同的全屏事件
      if (isIOS) {
        video.addEventListener('webkitbeginfullscreen', () => {
          console.log('iOS视频进入全屏');
        });
        video.addEventListener('webkitendfullscreen', handleFullscreenChange);
      } else {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      }
      
      // 清理函数
      video._fullscreenCleanup = () => {
        if (isIOS) {
          video.removeEventListener('webkitendfullscreen', handleFullscreenChange);
        } else {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        }
      };
    }
  };

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      // 新增：平板端（宽度在768-1366之间且支持触摸）也视为移动端
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (isTouchDevice && window.innerWidth > 768 && window.innerWidth <= 1366);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 计算分页数据
  const filesPerPage = 12;
  const filteredFiles = uploadedMediaFiles.filter(file => {
    if (activeTab === 'all') return true;
    if (activeTab === 'photos') return file.type === 'image';
    if (activeTab === 'videos') return file.type === 'video';
    return false;
  });
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const currentFiles = filteredFiles.slice((currentPage - 1) * filesPerPage, currentPage * filesPerPage);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };





  // 移动端录音功能
  const handleMobileRecordingStart = async () => {
    try {
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mobileStreamRef.current = stream;
      
      // 创建MediaRecorder实例
      let mimeType = '';
      const supportedTypes = [
        'audio/mp4',
        'audio/mpeg', 
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mobileMediaRecorderRef.current = mediaRecorder;
      mobileAudioChunksRef.current = [];
      
      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mobileAudioChunksRef.current.push(event.data);
        }
      };
      
      // 监听录音停止事件
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(mobileAudioChunksRef.current, { type: mimeType || 'audio/webm' });
        
        // 创建录音记录
        const recordingId = Date.now() + Math.random();
        const fileName = `mobile_recording_${recordingId}.mp3`;
        const previewUrl = URL.createObjectURL(audioBlob);
        
        const newRecording = {
          id: recordingId,
          url: previewUrl,
          audioBlob: audioBlob,
          duration: mobileRecordingTime,
          timestamp: new Date().toLocaleString('zh-CN'),
          sessionId: id || 'default',
          cloudUrl: null,
          uploaded: false,
          fileName: fileName,
          isVideo: false,
          fileType: mimeType
        };
        
        // 添加到录音列表
        setRecordings(prev => [newRecording, ...prev]);
        
        // 上传到云端
        const uploadResult = await uploadAudioFile(audioBlob, recordingId, fileName);
        
        if (uploadResult && uploadResult.success) {
          setRecordings(prev => prev.map(recording => 
            recording.id === recordingId 
              ? {
                  ...recording,
                  cloudUrl: uploadResult.cloudUrl,
                  objectKey: uploadResult.objectKey,
                  etag: uploadResult.etag,
                  uploaded: true
                }
              : recording
          ));
          
          alert('移动端录音上传成功！');
        }
        
        // 重置状态
        setIsMobileRecording(false);
        setIsMobileRecordingPaused(false);
        setMobileRecordingTime(0);
        
        // 关闭弹窗
        closeUploadModal();
      };
      
      // 开始录音
      mediaRecorder.start(1000);
      setIsMobileRecording(true);
      setIsMobileRecordingPaused(false);
      
      // 开始计时
      startMobileTimer();
      
    } catch (error) {
      console.error('移动端录音启动失败:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const handleMobileRecordingPause = () => {
    if (mobileMediaRecorderRef.current && isMobileRecording) {
      if (isMobileRecordingPaused) {
        mobileMediaRecorderRef.current.resume();
        startMobileTimer();
        setIsMobileRecordingPaused(false);
      } else {
        mobileMediaRecorderRef.current.pause();
        stopMobileTimer();
        setIsMobileRecordingPaused(true);
      }
    }
  };

  const handleMobileRecordingStop = () => {
    stopMobileTimer();
    
    if (mobileMediaRecorderRef.current && mobileMediaRecorderRef.current.state !== 'inactive') {
      mobileMediaRecorderRef.current.stop();
    }
    
    // 停止媒体流
    if (mobileStreamRef.current) {
      mobileStreamRef.current.getTracks().forEach(track => track.stop());
      mobileStreamRef.current = null;
    }
  };

  const startMobileTimer = () => {
    stopMobileTimer();
    mobileTimerRef.current = setInterval(() => {
      setMobileRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopMobileTimer = () => {
    if (mobileTimerRef.current) {
      clearInterval(mobileTimerRef.current);
      mobileTimerRef.current = null;
    }
  };

  const handleMobileAudioFileSelect = () => {
    if (mobileAudioFileInputRef.current) {
      mobileAudioFileInputRef.current.click();
    }
  };

  const handleMobileAudioFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMediaFileSelect(files, { audioOnly: true }); // 标记为仅音频模式
      // 清空输入
      e.target.value = '';
    }
  };

  // 获取媒体文件时长
  const getMediaDuration = (url, isVideo = false) => {
    return new Promise((resolve, reject) => {
      const media = document.createElement(isVideo ? 'video' : 'audio');
      
      media.onloadedmetadata = () => {
        resolve(media.duration);
        media.remove();
      };
      
      media.onerror = (error) => {
        reject(error);
        media.remove();
      };
      
      media.src = url;
    });
  };

  // AI音乐生成完成处理
  const handleAIMusicGenerated = (localMusic) => {
    // 将AI生成的音乐添加到已绑定录音列表中
    // localMusic已经包含了正确的数据结构，直接使用
    const newRecording = {
      ...localMusic,
      id: localMusic.id || Date.now(),
      sessionId: localMusic.sessionId || id || 'default',
      userCode: localMusic.userCode || userCode
    };
    
    // 添加到已绑定录音列表
    setBoundRecordings(prev => [newRecording, ...prev]);
    
    // 显示成功提示
    alert(`AI音乐《${localMusic.fileName || localMusic.title}》已保存并上传到云端，已添加到已绑定录音列表！`);
  };

  // 检测已绑定录音，智能跳转到播放页面（用户从播放页面返回后永久停止此功能）
  useEffect(() => {
    // 防止无限循环跳转：如果用户曾从播放页面返回或正在检查文件，则永久停止自动跳转
    if (justReturnedFromPlayer || isCheckingFiles) {
      return;
    }

    if (boundRecordings && boundRecordings.length > 0 && userCode && id) {
      // 先清理已删除的录音，然后决定是否跳转
      cleanupDeletedRecordings().then((existingRecordings) => {
        // 如果清理后还有录音存在，且没有刚从播放页面返回，则跳转
        if (existingRecordings.length > 0 && !justReturnedFromPlayer) {
          // 跳转到第一个已绑定录音的播放页面
          const firstRecording = existingRecordings[0];
          const recordingId = firstRecording.originalRecordingId || firstRecording.id;
          navigate(`/${userCode}/${id}/play/${recordingId}`);
        }
      });
    }
  }, [boundRecordings, userCode, id, navigate, justReturnedFromPlayer, isCheckingFiles]);

  // 如果浏览器不支持录音
  if (!isSupported) {
    return (
      <div className="record-container">
        <div className="error-message">
          <h3>⚠️ 录音功能不可用</h3>
          <p>您的浏览器不支持录音功能，请使用现代浏览器（Chrome、Firefox、Safari等）</p>
        </div>
      </div>
    );
  }

  // 上传媒体弹窗组件
  const renderUploadMediaModal = () => {
    if (!showUploadModal) return null;

    return (
      <div className="upload-modal-overlay" onClick={closeUploadModal} onPaste={handleMediaPaste}>
        <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* 弹窗头部 */}
          <div className="upload-modal-header">
            <h2>上传照片、视频和本地录音</h2>
            <div className="upload-modal-session-info">
              <span>用户: {userCode} | 会话: {id}</span>
            </div>
            <button className="upload-modal-close" onClick={closeUploadModal}>×</button>
          </div>

          {/* 上传区域 */}
          <div 
            className={`upload-modal-area ${isDragOver ? 'drag-over' : ''}`}
            onClick={handleMediaUploadAreaClick}
            onDragOver={handleMediaDragOver}
            onDragLeave={handleMediaDragLeave}
            onDrop={handleMediaDrop}
          >
            <span className="upload-modal-text">
              {isMobile ? '点击、粘贴照片、视频或录音到此处开始上传' : '点击、粘贴或拖放照片、视频和录音到此处开始上传'}
            </span>
            <input
              ref={mediaFileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleMediaFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* 文件展示区域 */}
          <div className="upload-modal-files-container">
            {/* 文件类型标签 */}
            <div className="upload-modal-file-tabs">
              <button 
                className={`upload-modal-file-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
              >
                📁 全部 ({uploadedMediaFiles.length})
              </button>
              <button 
                className={`upload-modal-file-tab ${activeTab === 'photos' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('photos');
                  setCurrentPage(1);
                }}
              >
                📷 照片 ({uploadedMediaFiles.filter(f => f.type === 'image').length})
              </button>
              <button 
                className={`upload-modal-file-tab ${activeTab === 'videos' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('videos');
                  setCurrentPage(1);
                }}
              >
                🎬 视频 ({uploadedMediaFiles.filter(f => f.type === 'video').length})
              </button>
            </div>

            {totalPages > 1 && (
              <div className="upload-modal-pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            )}

            {filteredFiles.length > 0 ? (
              <>
                <div className="upload-modal-files-grid">
                  {currentFiles.map(file => (
                    <div key={file.id} className="upload-modal-media-item">
                      <div className="upload-modal-media-content" onClick={() => handlePreviewMediaFile(file)}>
                                            {file.type === 'image' ? (
                      <div className="upload-modal-image-preview">
                        <img src={file.preview || file.url} alt={file.name} className="upload-modal-media-preview" />
                        {file.id && file.id.includes('img_') && (
                          <div className="upload-modal-image-id-display">
                            {/* 检查ID格式：img_sessionId_timestamp_random_uniqueId */}
                            {(() => {
                              const idParts = file.id.split('_');
                              if (idParts.length >= 5) {
                                // 新格式：包含会话ID
                                const sessionId = idParts[1];
                                const uniqueId = idParts.slice(-1)[0];
                                if (file.fromRecordPage || (file.sessionId && sessionId && file.sessionId === sessionId)) {
                                  return <>录音会话: {sessionId} | 图片ID: {uniqueId}</>;
                                } else {
                                  return <>会话: {sessionId} | 图片ID: {uniqueId}</>;
                                }
                              } else if (idParts.length >= 4) {
                                // 4段格式：img_sessionId_timestamp_uniqueId
                                const sessionId = idParts[1];
                                const uniqueId = idParts.slice(-1)[0];
                                if (file.fromRecordPage || (file.sessionId && sessionId && file.sessionId === sessionId)) {
                                  return <>录音会话: {sessionId} | 图片ID: {uniqueId}</>;
                                } else {
                                  return <>会话: {sessionId} | 图片ID: {uniqueId}</>;
                                }
                              } else {
                                // 其他格式
                                return <>图片ID: {file.id}</>;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="upload-modal-video-preview">
                        <video 
                          src={file.preview || file.url} 
                          className="upload-modal-media-preview"
                          muted
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            e.target.currentTime = 1;
                          }}
                        />
                        <div className="upload-modal-video-overlay">
                          <div className="upload-modal-video-play-icon">▶</div>
                        </div>
                        {file.id && file.id.includes('vid_') && (
                          <div className="upload-modal-video-id-display">
                            {/* 检查ID格式：vid_sessionId_timestamp_random_uniqueId */}
                            {(() => {
                              const idParts = file.id.split('_');
                              if (idParts.length >= 5) {
                                // 新格式：包含会话ID
                                const sessionId = idParts[1];
                                const uniqueId = idParts.slice(-1)[0];
                                if (file.fromRecordPage || (file.sessionId && sessionId && file.sessionId === sessionId)) {
                                  return <>录音会话: {sessionId} | 视频ID: {uniqueId}</>;
                                } else {
                                  return <>会话: {sessionId} | 视频ID: {uniqueId}</>;
                                }
                              } else if (idParts.length >= 4) {
                                // 4段格式：vid_sessionId_timestamp_uniqueId
                                const sessionId = idParts[1];
                                const uniqueId = idParts.slice(-1)[0];
                                if (file.fromRecordPage || (file.sessionId && sessionId && file.sessionId === sessionId)) {
                                  return <>录音会话: {sessionId} | 视频ID: {uniqueId}</>;
                                } else {
                                  return <>会话: {sessionId} | 视频ID: {uniqueId}</>;
                                }
                              } else {
                                // 其他格式
                                return <>视频ID: {file.id}</>;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                        <div className="upload-modal-media-overlay">
                          <button 
                            className="upload-modal-delete-media-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMediaFile(file.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="upload-modal-pagination">
                    <button 
                      className="upload-modal-pagination-btn"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </button>
                    <span className="upload-modal-pagination-current-page">{currentPage}</span>
                    <span className="upload-modal-pagination-total-page">/ {totalPages} 页</span>
                    <button 
                      className="upload-modal-pagination-btn"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="upload-modal-empty-state">
                <div className="upload-modal-empty-icon">
                  {activeTab === 'all' ? '📁' : activeTab === 'photos' ? '📷' : '🎬'}
                </div>
                <p className="upload-modal-empty-text">
                  还没有上传任何{activeTab === 'all' ? '媒体文件' : activeTab === 'photos' ? '照片' : '视频'}
                </p>
                <p className="upload-modal-empty-subtext">点击上方区域上传照片、视频或录音</p>
              </div>
            )}
          </div>
        </div>

        {/* 预览弹窗 - 支持图片和视频 */}
        {previewFile && (
          <div className={`upload-modal-preview-modal ${isMobile ? 'fullscreen' : ''} ${previewFile.type === 'video' ? 'video-preview' : 'image-preview'}`} onClick={closeMediaPreview}>
            <div className="upload-modal-preview-content" onClick={e => e.stopPropagation()}>
              <button className="upload-modal-preview-close" onClick={closeMediaPreview}>×</button>
              {previewFile.type === 'image' ? (
                <img 
                  src={previewFile.preview || previewFile.url} 
                  alt={previewFile.name} 
                  className="upload-modal-preview-media" 
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={previewFile.preview || previewFile.url}
                  className="upload-modal-preview-media fullscreen-media"
                  controls
                  playsInline={!isMobile}
                  webkit-playsinline={!isMobile}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onPlay={handleVideoPlay}
                  crossOrigin="anonymous"
                  style={{
                    backgroundColor: '#000',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error('视频播放错误:', e);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* 背景装饰 */}
      <div className="background-decoration">
        <style jsx global>{`
          .background-decoration {
            background-image: url('https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/background2.png') !important;
            background-size: 100% 100% !important;
            height: 100% !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: scroll !important; /* iOS优化 */
          }
        `}</style>
      </div>
      
      {/* 顶部导航栏 */}
      <div className="top-navigation-bar">
          
       
      </div>
       
       
      {/* 主内容区：居中布局 */}
      <div className="record-main-layout">
        {/* 录音控制区 */}
          <div className="record-control-card">
            {/* 录音控制区标题 */}
            <div className="record-control-header">
              <h2>语音录制</h2>
            </div>
            {/* 时间显示 */}
            <div className="record-time-display">
              <div className="record-time-large">{formatTime(recordingTime)}</div>
            </div>
            {/* 录音状态指示 */}
            <div className={`record-status-indicator ${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}>
              <div className="status-dot"></div>
              <span className="status-text">
                {isRecording ? (isPaused ? '已暂停' : '录音中...') : '准备录音'}
              </span>
            </div>
            {/* 录音控制按钮 */}
            <div className="record-control-buttons">
              {!isRecording ? (
                <>
                <button className="record-start-btn" onClick={startRecording}>
                  <span className="btn-icon">
                  <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/huatong.svg" className="btn-icon" width={32} height={32}/>
                  </span>
                  <span className="btn-text">开始录音</span>
                </button>
                
                {/* 移动端显示两个分开的按钮，PC端显示合并的按钮 */}
                {isMobile ? (
                  <>
                    <button className="record-start-btn mobile-upload-audio-btn" onClick={handleMobileAudioFileSelect}>
                      <span className="btn-icon">🎵</span>
                      <span className="btn-text">上传本地录音</span>
                    </button>
                    <button className="record-start-btn mobile-upload-media-btn" onClick={goToUploadMediaPage}> 
                      <span className="btn-icon">📷</span>
                      <span className="btn-text">上传照片视频</span>
                    </button>
                    
                    {/* iOS用户提示 */}
                    {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                      <div className="ios-recording-tip">
                        <div className="tip-content">
                          <span className="tip-icon">💡</span>
                          <span className="tip-text">
                            iOS用户：如需上传语音备忘录，请先在语音备忘录app中选择录音→分享→存储到文件，然后再选择上传！
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button className="record-start-btn" onClick={goToUploadMediaPage}> 
                    <span className="btn-text">上传照片、视频和本地录音</span>
                  </button>
                )}

                {/* AI音乐生成按钮 */}
                <button 
                  className="record-start-btn ai-music-btn" 
                  onClick={() => setShowAIMusicGenerator(!showAIMusicGenerator)}
                  style={{
                    background: showAIMusicGenerator 
                      ? 'linear-gradient(135deg, #9c88ff, #7c4dff)' 
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    marginTop: '12px'
                  }}
                >
                  <span className="btn-icon">🎵</span>
                  <span className="btn-text">
                    {showAIMusicGenerator ? '关闭AI音乐生成器' : 'AI音乐生成器'}
                  </span>
                </button>

                </>
              ) : (
                <div className="record-action-buttons">
                  <button className="record-pause-btn" onClick={pauseRecording}>
                    
                    <span className="btn-icon">{isPaused ? '▶' : '⏸'}</span>
                    <span className="btn-text">{isPaused ? '继续' : '暂停'}</span>
                  </button>
                  <button className="record-stop-btn" onClick={stopRecording}>
                    <span className="btn-icon">
                    <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/中止.svg" className="btn-icon" width={32} height={32}/>
                    </span>
                    <span className="btn-text">停止</span>
                  </button>
                </div>
              )}
              {recordingTime > 0 && !isRecording && (
                <button className="record-reset-btn" onClick={resetRecording}>
                  <span className="btn-icon">
                  <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/refresh.svg" className="btn-icon" width={32} height={32}/>
                  </span>
                  <span className="btn-text">重置</span>
                </button>
              )}
            </div>
            
            {/* 当前录音播放器 */}
            {audioURL && (
              <div className="current-recording-player">
                <div className="current-recording-player-header">
                  <span className="player-icon">
                  <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/video.svg" width={30} height={30}/>
                  </span>
                  <span className="player-title">当前录音</span>
                </div>
                <audio controls src={audioURL} className="audio-player-control">
                  您的浏览器不支持音频播放
                </audio>
              </div>
            )}
            
            {/* AI音乐生成器 */}
            {showAIMusicGenerator && (
              <AIMusicGenerator
                userCode={userCode}
                sessionId={id}
                recordings={recordings}
                boundRecordings={boundRecordings}
                onMusicGenerated={handleAIMusicGenerated}
              />
            )}
            

          </div>

        {/* 录音列表区域 */}
        <div className="record-right-panel">
          {/* 待绑定录音区域 - 仅在有录音时显示 */}
          {recordings.length > 0 && (
            <div className="recordings-section">
              <div className="section-header">
                <h3>待绑定的录音</h3>
                <span className="section-count">({recordings.length})</span>
              </div>
              <div className="recordings-list-container">
                {recordings.map((recording) => (
                  <div key={recording.id} className="recording-list-item unbound-item">
                    {/* PC端：单行布局，左侧信息+右侧播放器+操作按钮 */}
                    <div className="recording-first-row">
                      <div className="recording-item-info">
                        <div className="recording-timestamp">
                          {recording.timestamp}
                          {recording.isVideo && <span className="video-badge">🎬</span>}
                        </div>
                        <div className="recording-size">
                          {formatTime(recording.duration)} · {getUploadStatusText(recording.id)}
                          {recording.isVideo && <span className="audio-only-hint"> (仅音频)</span>}
                        </div>
                      </div>
                      
                      {/* PC端播放器位置（红色方框区域） */}
                      <div className="recording-player-pc">
                        <audio controls src={recording.url} className="mini-audio-player">
                          您的浏览器不支持音频播放
                        </audio>
                      </div>
                      
                      <div className="recording-actions">
                        <button className="action-btn link-btn" onClick={() => bindRecording(recording)} title="绑定录音">
                          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/link2.svg" width={25} height={25}/>
                        </button>
                        {uploadStatus[recording.id] === 'error' && (
                          <button className="action-btn retry-box" onClick={() => retryUpload(recording)} title="重试上传">
                            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/refresh.svg" width={25} height={25}/>
                          </button>
                        )}
                        <button className="action-btn delete-btn" onClick={() => deleteRecording(recording.id)} title="删除录音">
                          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/delete2.svg"  width={25} height={25}/>
                        </button>
                      </div>
                    </div>
                    
                    {/* 移动端播放器位置（保持原来的下方居中） */}
                    <div className="recording-player-row recording-player-mobile">
                      <audio controls src={recording.url} className="mini-audio-player">
                        您的浏览器不支持音频播放
                      </audio>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* 已绑定录音区域 - 始终显示 */}
            <div className="recordings-section bound-section">
              <div className="section-header">
                <h3>已绑定的录音</h3>
                <span className="section-count">({boundRecordings.length})</span>
                {userCode && id && <span className="session-info">会议: {userCode}/{id}</span>}
                {isCheckingFiles && <span className="checking-status">🔍 检查中...</span>}
                {boundRecordings.length > 0 && (
                  <button 
                    className="refresh-btn" 
                    onClick={refreshRecordings}
                    disabled={isCheckingFiles}
                    title="检查录音文件状态"
                  >
                    <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/refresh.svg" width={16} height={16}/>
                  </button>
                )}
              </div>
              <div className="recordings-list-container">
                {boundRecordings.length > 0 ? (
                  boundRecordings.map((recording) => (
                    <div key={recording.id} className="recording-list-item bound-item">
                      {/* 只有一行：录制时间（左）+ 操作按钮（右） */}
                      <div className="recording-first-row">
                        <div className="recording-item-info">
                          <div className="recording-timestamp">
                            {recording.isAIGenerated ? recording.fileName : recording.timestamp}
                            {recording.isAIGenerated && <span className="ai-badge">🤖</span>}
                            {recording.isVideo && <span className="video-badge">🎬</span>}
                          </div>
                          <div className="recording-size">
                            {formatTime(recording.duration)} · {recording.uploaded ? '已上传' : '本地存储'}
                            {recording.uploaded && <span className="cloud-icon"> ☁️</span>}
                            {recording.isAIGenerated && <span className="ai-hint"> (AI生成)</span>}
                            {recording.isVideo && <span className="audio-only-hint"> (仅音频)</span>}
                          </div>
                        </div>
                        <div className="recording-actions">
                          <button className="action-btn play-icon" onClick={() => enterPlayerMode(recording)} title="播放录音">
                            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/bf2.svg"  width={20} height={30}/>
                          </button>
                          <button className="action-btn delete-btn" onClick={() => deleteRecording(recording.id, true)} title="删除录音">
                            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/delete2.svg"  width={25} height={25}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section-state bound-empty">
                    <div className="empty-section-icon">🎤</div>
                    <p>暂无已绑定的录音</p>
                    <span className="empty-section-hint">点击待绑定录音按钮进行绑定</span>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* 上传媒体弹窗 */}
      {renderUploadMediaModal()}

      {/* 移动端专用的本地录音文件输入 */}
      <input
        ref={mobileAudioFileInputRef}
        type="file"
        accept="audio/*,.m4a,.aac,.mp3,.wav,.ogg,.webm,.caf"
        onChange={handleMobileAudioFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default RecordComponent;