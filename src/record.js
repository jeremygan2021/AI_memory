import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './record.css';
import { getUserCode, buildRecordingPath, buildSessionStorageKey, validateUserCode } from './utils/userCode';

// API配置
const API_BASE_URL = 'http://localhost:8000';

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
  
  // 引用
  const mediaRecorderRef = useRef(null); // MediaRecorder实例
  const audioChunksRef = useRef([]); // 音频数据块
  const timerRef = useRef(null); // 计时器引用
  const streamRef = useRef(null); // 媒体流引用
  const longPressTimerRef = useRef(null); // 长按计时器
  const startBtnRef = useRef(null); // 开始按钮引用

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
  }, [userid, navigate]);

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
      
      const fileName = `recording_${recording.id}_${Date.now()}.${extension}`;
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
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // 创建录音记录
        const newRecording = {
          id: Date.now(),
          url: url,
          audioBlob: audioBlob, // 保存Blob用于上传
          duration: recordingTime,
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
        
        const fileName = `recording_${newRecording.id}_${Date.now()}.${extension}`;
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

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // 停止计时
      stopTimer();
      
      // 停止媒体流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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

  // 开始计时
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // 停止计时
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 重置录音
  const resetRecording = () => {
    setRecordingTime(0);
    setAudioURL('');
  };

  // 绑定录音
  const bindRecording = (recording) => {
    const boundRecording = {
      ...recording,
      boundAt: new Date().toLocaleString('zh-CN'),
      sessionId: id,
      userCode: userCode
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
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
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
    <div className="record-container">
      {/* 录音控制面板 */}
      <div className="record-panel">
        <div className="record-header">
          <h2>🎙️ 语音录制</h2>
          <div className="record-time">
            {formatTime(recordingTime)}
          </div>
        </div>
        
        {/* 录音状态指示器 */}
        <div className={`record-indicator ${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''} ${touchFeedback ? 'touch-feedback' : ''}`}>
          <div className="indicator-dot"></div>
          <span className="status-text">
            {touchFeedback && !isRecording ? '松开结束录音' : 
             isRecording ? (isPaused ? '已暂停' : (isLongPress ? '长按录音中...' : '录音中...')) : 
             '准备录音'}
          </span>
          {touchFeedback && (
            <div className="touch-hint">
              <span>📱 长按录音模式</span>
            </div>
          )}
        </div>
        
        {/* 控制按钮 */}
        <div className="control-buttons">
          {!isRecording ? (
            <button 
              ref={startBtnRef}
              className={`btn btn-start ${touchFeedback ? 'touch-active' : ''}`} 
              onClick={startRecording}
              onTouchStart={handleTouchStart(startRecording)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleLongPressEnd}
              onMouseDown={() => window.innerWidth > 768 && setTouchFeedback(true)}
              onMouseUp={() => window.innerWidth > 768 && setTouchFeedback(false)}
              onMouseLeave={() => window.innerWidth > 768 && setTouchFeedback(false)}
            >
              <span className="btn-icon">🎤</span>
              <span className="btn-text">
                {window.innerWidth <= 768 ? '点击或长按录音' : '开始录音'}
              </span>
            </button>
          ) : (
            <>
              <button className="btn btn-pause" onClick={pauseRecording}>
                <span className="btn-icon">{isPaused ? '▶️' : '⏸️'}</span>
                <span className="btn-text">{isPaused ? '继续' : '暂停'}</span>
              </button>
              <button className="btn btn-stop" onClick={stopRecording}>
                <span className="btn-icon">⏹️</span>
                <span className="btn-text">停止</span>
              </button>
            </>
          )}
          
          {recordingTime > 0 && !isRecording && (
            <button className="btn btn-reset" onClick={resetRecording}>
              <span className="btn-icon">🔄</span>
              <span className="btn-text">重置</span>
            </button>
          )}
        </div>
        
        {/* 当前录音播放 */}
        {audioURL && (
          <div className="current-audio">
            <h4>📻 当前录音</h4>
            <audio controls src={audioURL} className="audio-player">
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
      </div>
      
      {/* 临时录音列表 */}
      {recordings.length > 0 && (
        <div className="recordings-list">
          <h3>🎵 待绑定录音</h3>
          <div className="recordings-grid">
            {recordings.map((recording) => (
              <div key={recording.id} className="recording-item">
                <div className="recording-info">
                  <div className="recording-title">
                    🎵 录音 #{recording.id.toString().slice(-4)}
                    <span className="upload-status-badge">
                      {getUploadStatusIcon(recording.id)}
                    </span>
                  </div>
                  <div className="recording-meta">
                    <span className="duration">{formatTime(recording.duration)}</span>
                    <span className="timestamp">{recording.timestamp}</span>
                    <span className={`upload-status ${uploadStatus[recording.id] || 'local'}`}>
                      {getUploadStatusText(recording.id)}
                    </span>
                  </div>
                </div>
                
                <audio controls src={recording.url} className="recording-audio">
                  您的浏览器不支持音频播放
                </audio>
                
                <div className="recording-actions">
                  <button 
                    className="bind-btn" 
                    onClick={() => bindRecording(recording)}
                    title="绑定录音"
                  >
                    🔗 绑定
                  </button>
                  {uploadStatus[recording.id] === 'error' && (
                    <button 
                      className="retry-btn" 
                      onClick={() => retryUpload(recording)}
                      title="重试上传"
                    >
                      🔄 重试
                    </button>
                  )}
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteRecording(recording.id)}
                    title="删除录音"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 绑定录音列表 */}
      <div className="recordings-list bound-recordings">
        <h3>🔗 已绑定录音 {userCode && id && `(会话: ${userCode}/${id})`}</h3>
        {boundRecordings.length === 0 ? (
          <div className="empty-state">
            <p>暂无绑定录音</p>
            <span>录制并绑定您的第一个录音</span>
          </div>
        ) : (
          <div className="recordings-grid">
            {boundRecordings.map((recording) => (
              <div key={recording.id} className="recording-item bound-item">
                <div className="recording-info">
                  <div className="recording-title">
                    🎵 录音 #{recording.id.toString().slice(-4)}
                    {recording.uploaded && (
                      <span className="cloud-badge" title="已上传到云端">
                        ☁️
                      </span>
                    )}
                  </div>
                  <div className="recording-meta">
                    <span className="duration">{formatTime(recording.duration)}</span>
                    <span className="timestamp">{recording.timestamp}</span>
                    {recording.boundAt && (
                      <span className="bound-time">绑定: {recording.boundAt}</span>
                    )}
                    {recording.cloudUrl && (
                      <span className="cloud-url" title={recording.cloudUrl}>
                        🌐 云端文件
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="recording-actions">
                  <button 
                    className="play-btn" 
                    onClick={() => enterPlayerMode(recording)}
                    title="播放录音"
                  >
                    ▶️ 播放
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteRecording(recording.id, true)}
                    title="删除录音"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordComponent;