import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './record.css';
import UploadPhotoPage from './UploadPhotoPage';
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
  
  // 新增：上传本地录音相关状态
  const [isUploading, setIsUploading] = useState(false); // 是否正在上传文件
  const [uploadProgressState, setUploadProgressState] = useState(0); // 上传进度
  
  // 引用
  const mediaRecorderRef = useRef(null); // MediaRecorder实例
  const audioChunksRef = useRef([]); // 音频数据块
  const timerRef = useRef(null); // 计时器引用
  const streamRef = useRef(null); // 媒体流引用
  const longPressTimerRef = useRef(null); // 长按计时器
  const startBtnRef = useRef(null); // 开始按钮引用
  const fileInputRef = useRef(null); // 文件输入引用

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
    
    // 检查是否是从播放页面删除后返回的
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
    }
  }, [userid, navigate]);

  // 新增：检查录音文件是否存在于云端
  const checkRecordingExists = async (recording) => {
    try {
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
      return boundRecordings; // 出错时返回原始列表
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
      
      // 创建文件对象，使用Blob的实际MIME类型
      const audioFile = new File([audioBlob], fileName, { 
        type: audioBlob.type || 'audio/webm'
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
      // 根据MIME类型确定文件扩展名
      let extension = 'webm';
      if (recording.audioBlob.type.includes('mp4')) {
        extension = 'mp4';
      } else if (recording.audioBlob.type.includes('wav')) {
        extension = 'wav';
      } else if (recording.audioBlob.type.includes('ogg')) {
        extension = 'ogg';
      }
      
      const fileName = `recording_${recording.id}.${extension}`;
      await uploadAudioFile(recording.audioBlob, recording.id, fileName);
    }
  };

  // 从localStorage加载绑定的录音
  useEffect(() => {
    if (id && userCode) {
      const storageKey = buildSessionStorageKey(id, userCode);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const recordings = JSON.parse(stored);
        setBoundRecordings(recordings);
      }
    }
  }, [id, userCode]);

  // 保存绑定的录音到localStorage
  useEffect(() => {
    if (id && userCode && boundRecordings.length > 0) {
      const storageKey = buildSessionStorageKey(id, userCode);
      localStorage.setItem(storageKey, JSON.stringify(boundRecordings));
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
      
      // 创建MediaRecorder实例，优先使用WebM，如果不支持则使用其他格式
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // 使用默认格式
          }
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
        // 根据MIME类型确定文件扩展名
        let extension = 'webm';
        if (audioBlob.type.includes('mp4')) {
          extension = 'mp4';
        } else if (audioBlob.type.includes('wav')) {
          extension = 'wav';
        } else if (audioBlob.type.includes('ogg')) {
          extension = 'ogg';
        }
        
        // 使用recordingId作为文件名的一部分，确保能够匹配
        const fileName = `recording_${newRecording.id}.${extension}`;
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
    navigate(`/${userCode}/${id}/play/${recording.id}`);
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

  // 跳转到上传照片
  const goToUploadPhotoPage = () => {
    console.log('点击上传照片按钮，userCode:', userCode);
    if (userCode) {
      const targetPath = `/${userCode}/upload-photos`;
      console.log('准备跳转到:', targetPath);
      navigate(targetPath);
    } else {
      console.error('userCode 为空，无法跳转');
    }
  };

  // 手动刷新录音列表
  const refreshRecordings = async () => {
    if (isCheckingFiles) return; // 避免重复检查
    
    await cleanupDeletedRecordings();
  };

  // 新增：处理本地文件上传
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
    ];
    
    const isValidType = allowedTypes.some(type => file.type.includes(type.split('/')[1])) || 
                       file.name.match(/\.(mp3|wav|m4a|aac|ogg|webm|mp4|avi|mov|wmv|flv|mkv)$/i);

    if (!isValidType) {
      alert('请选择有效的音频或视频文件（支持格式：MP3, WAV, M4A, AAC, OGG, WebM, MP4, AVI, MOV, WMV, FLV, MKV）');
      return;
    }

    // 检查文件大小（限制为100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('文件大小不能超过 100MB');
      return;
    }

    uploadLocalFile(file);
  };

  // 新增：上传本地文件
  const uploadLocalFile = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgressState(0);

      console.log('开始上传本地文件:', { fileName: file.name, fileSize: file.size, fileType: file.type });

      // 创建录音记录对象
      const recordingId = Date.now();
      const fileUrl = URL.createObjectURL(file);
      
      // 确定文件类型和扩展名
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // 生成上传文件名，保持原始扩展名
      const uploadFileName = `recording_${recordingId}.${fileExtension}`;

      // 先创建本地录音记录
      const newRecording = {
        id: recordingId,
        url: fileUrl,
        audioBlob: file, // 保存原始文件用于上传
        duration: 0, // 将在音频加载后获取
        timestamp: new Date().toLocaleString('zh-CN'),
        sessionId: id || 'default',
        cloudUrl: null,
        uploaded: false,
        fileName: file.name,
        isVideo: isVideo, // 标记是否为视频文件
        fileType: file.type
      };

      setRecordings(prev => [newRecording, ...prev]);

      // 如果是音频/视频文件，尝试获取时长
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        try {
          const duration = await getMediaDuration(fileUrl);
          setRecordings(prev => prev.map(rec => 
            rec.id === recordingId ? { ...rec, duration: Math.floor(duration) } : rec
          ));
        } catch (error) {
          console.warn('无法获取媒体时长:', error);
        }
      }

      // 上传到云端
      const uploadResult = await uploadAudioFile(file, recordingId, uploadFileName);

      if (uploadResult.success) {
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

        console.log('本地文件上传成功:', uploadResult);
      }

    } catch (error) {
      console.error('上传本地文件失败:', error);
      alert(`文件上传失败: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgressState(0);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 新增：获取媒体文件时长
  const getMediaDuration = (url) => {
    return new Promise((resolve, reject) => {
      const media = document.createElement('audio');
      
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

  // 新增：触发文件选择
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 检测已绑定录音，智能跳转到播放页面
  useEffect(() => {
    // 防止无限循环跳转
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

  return (
    <div>
      {/* 背景装饰 */}
      <div className="background-decoration">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      
      {/* 顶部导航栏 */}
      <div className="top-navigation-bar">
          
        {/* <div className="nav-left">
          
        </div>
        <div className="nav-right">
          <span className="user-info">会议{userCode}/{id}</span>
        </div> */}
      </div>
       
      {/* 主内容区：动态布局 */}
      <div className={`record-main-layout ${recordings.length === 0 && boundRecordings.length === 0 && !isRecording && recordingTime === 0 ? 'centered-layout' : 'side-layout'}`}>
        {/* 全部为空时的状态提示 - 只在居中布局时显示 */}
        <div className="empty-recordings-state" style={{
          display: (recordings.length === 0 && boundRecordings.length === 0 && !isRecording && recordingTime === 0) ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          
          <div className="empty-icon">🎤</div>
          <h3>还没有录音</h3>
          <p>点击"开始录音"按钮开始录制您的第一个录音；或点击"上传照片"按钮上传图片视频</p>
        </div>
        
        {/* 左侧录音控制区 */}
        <div className="record-left-panel">
          {/* 上传照片按钮始终显示在左侧栏顶部 */}
          <div className="upload-box upload-box-recording">
            <button className="upload-button" onClick={goToUploadPhotoPage}> 
              <span>上传照片</span>
            </button>
          </div>
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
                  
                  {/* 上传本地录音按钮 */}
                  <button 
                    className="upload-local-btn" 
                    onClick={triggerFileSelect}
                    disabled={isUploading}
                  >
                    <span className="btn-icon">
                      {isUploading ? (
                        <div className="upload-spinner"></div>
                      ) : (
                        <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/files.svg" className="btn-icon" width={28} height={28}/>
                      )}
                    </span>
                    <span className="btn-text">
                      {isUploading ? `上传中 ${uploadProgressState}%` : '上传本地录音'}
                    </span>
                  </button>
                  
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.mp4,.avi,.mov,.wmv,.flv,.mkv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
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
          </div>
        </div>

        {/* 右侧录音列表区 - 只在侧边布局时显示 */}
        <div className={`record-right-panel ${recordings.length === 0 && boundRecordings.length === 0 && !isRecording && recordingTime === 0 ? 'hidden' : 'visible'}`}>
          {/* 待绑定录音区域 - 始终显示 */}
          <div className="recordings-section">
            <div className="section-header">
              <h3>待绑定的录音</h3>
              <span className="section-count">({recordings.length})</span>
            </div>
            <div className="recordings-list-container">
              {recordings.length > 0 ? (
                recordings.map((recording) => (
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
                ))
              ) : (
                <div className="empty-section-state">
                  <div className="empty-section-icon">🎤</div>
                  <p>暂无待绑定的录音</p>
                  <span className="empty-section-hint">录制完成后的录音将出现在这里</span>
                </div>
              )}
            </div>
          </div>

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
                          {recording.timestamp}
                          {recording.isVideo && <span className="video-badge">🎬</span>}
                        </div>
                        <div className="recording-size">
                          {formatTime(recording.duration)} · {recording.uploaded ? '已上传' : '本地存储'}
                          {recording.uploaded && <span className="cloud-icon"> ☁️</span>}
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



          {/* 全部为空时的状态提示 */}
          {recordings.length === 0 && boundRecordings.length === 0 && (
            <div className="empty-recordings-state">
              <div className="empty-icon">🎤</div>
              <h3>还没有录音</h3>
              <p>点击"开始录音"按钮开始录制您的第一个录音；或点击"上传照片"按钮上传图片视频</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordComponent;
