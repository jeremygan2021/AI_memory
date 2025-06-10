import React, { useState, useRef, useEffect } from 'react';
import './record.css';

// 录音组件
const RecordComponent = () => {
  // 状态管理
  const [isRecording, setIsRecording] = useState(false); // 是否正在录音
  const [isPaused, setIsPaused] = useState(false); // 是否暂停
  const [recordingTime, setRecordingTime] = useState(0); // 录音时长
  const [audioURL, setAudioURL] = useState(''); // 录音文件URL
  const [recordings, setRecordings] = useState([]); // 录音列表
  const [isSupported, setIsSupported] = useState(true); // 浏览器是否支持录音
  const [isMobile, setIsMobile] = useState(false); // 是否为移动设备
  const [audioFormat, setAudioFormat] = useState('audio/webm'); // 音频格式
  
  // 引用
  const mediaRecorderRef = useRef(null); // MediaRecorder实例
  const audioChunksRef = useRef([]); // 音频数据块
  const timerRef = useRef(null); // 计时器引用
  const streamRef = useRef(null); // 媒体流引用

  // 检测设备类型和浏览器支持
  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      return isMobileDevice;
    };

    // 检测浏览器支持
    const checkBrowserSupport = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSupported(false);
        console.error('浏览器不支持录音功能');
        return false;
      }
      return true;
    };

    // 检测最佳音频格式
    const detectAudioFormat = () => {
      const isMobileDevice = checkMobile();
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
      
      // 检测MediaRecorder支持的MIME类型
      let preferredFormat = 'audio/webm;codecs=opus';
      
      // 如果是iOS设备，使用audio/mp4格式
      if (isIOS) {
        preferredFormat = 'audio/mp4';
      }
      
      // 检查浏览器是否支持该格式
      if (MediaRecorder && MediaRecorder.isTypeSupported) {
        // 按优先级尝试不同的音频格式
        const formats = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/ogg'
        ];
        
        for (const format of formats) {
          if (MediaRecorder.isTypeSupported(format)) {
            preferredFormat = format;
            console.log(`使用音频格式: ${format}`);
            break;
          }
        }
      }
      
      setAudioFormat(preferredFormat);
    };

    // 执行检测
    const isSupported = checkBrowserSupport();
    if (isSupported) {
      detectAudioFormat();
    }
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      // 获取麦克风权限，针对移动设备优化设置
      const audioConstraints = {
        echoCancellation: true, // 回声消除
        noiseSuppression: true, // 噪音抑制
        autoGainControl: true   // 自动增益控制
      };
      
      // 针对移动设备优化采样率
      if (isMobile) {
        // 移动设备使用较低采样率以减少处理负担
        audioConstraints.sampleRate = 22050;
      } else {
        audioConstraints.sampleRate = 44100; // 桌面设备使用标准采样率
      }
      
      // 获取媒体流
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;
      
      // 创建MediaRecorder实例，使用检测到的最佳音频格式
      let mediaRecorderOptions = {};
      
      // 如果浏览器支持设置MIME类型
      if (MediaRecorder.isTypeSupported && audioFormat) {
        mediaRecorderOptions.mimeType = audioFormat;
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 监听录音停止事件
      mediaRecorder.onstop = () => {
        // 根据使用的音频格式创建Blob
        const blobOptions = { type: audioFormat };
        const audioBlob = new Blob(audioChunksRef.current, blobOptions);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // 保存录音到列表
        const newRecording = {
          id: Date.now(),
          url: url,
          duration: recordingTime,
          timestamp: new Date().toLocaleString('zh-CN'),
          format: audioFormat // 保存使用的音频格式信息
        };
        
        setRecordings(prev => [newRecording, ...prev]);
      };
      
      // 针对移动设备调整数据收集间隔
      const timeslice = isMobile ? 500 : 1000; // 移动设备更频繁地收集数据
      
      // 开始录音
      mediaRecorder.start(timeslice);
      setIsRecording(true);
      setIsPaused(false);
      
      // 开始计时
      startTimer();
      
    } catch (error) {
      console.error('录音启动失败:', error);
      // 提供更详细的错误信息
      let errorMessage = '无法访问麦克风，请检查权限设置';
      
      // 针对不同错误类型提供具体提示
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '麦克风访问被拒绝，请在浏览器设置中允许访问麦克风';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = '未检测到麦克风设备，请确认设备已连接';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = '麦克风设备无法使用，可能被其他应用占用';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '无法满足录音要求，请尝试使用其他浏览器';
      }
      
      alert(errorMessage);
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

  // 删除录音
  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  
  // 移动设备提示信息
  const MobileInfoTip = () => {
    if (!isMobile) return null;
    
    return (
      <div className="mobile-info-tip">
        <div className="tip-icon">📱</div>
        <div className="tip-content">
          <h4>移动设备提示</h4>
          <ul>
            <li>请保持页面处于前台状态，避免切换应用</li>
            <li>录音过程中请勿锁屏</li>
            <li>iOS设备需要使用Safari浏览器获得最佳体验</li>
            <li>Android设备推荐使用Chrome浏览器</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className={`record-container ${isMobile ? 'mobile-view' : ''}`}>
      {/* 移动设备提示信息 */}
      {isMobile && <MobileInfoTip />}
      
      {/* 录音控制面板 */}
      <div className="record-panel">
        <div className="record-header">
          <h2>🎙️ 语音录制</h2>
          <div className="record-time">
            {formatTime(recordingTime)}
          </div>
        </div>
        
        {/* 录音状态指示器 */}
        <div className={`record-indicator ${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}>
          <div className="indicator-dot"></div>
          <span className="status-text">
            {isRecording ? (isPaused ? '已暂停' : '录音中...') : '准备录音'}
          </span>
          {isMobile && isRecording && (
            <span className="mobile-recording-tip">
              {isPaused ? '点击继续录音' : '录音中，请勿切换应用'}
            </span>
          )}
        </div>
        
        {/* 控制按钮 */}
        <div className="control-buttons">
          {!isRecording ? (
            <button 
              className="btn btn-start" 
              onClick={startRecording}
              aria-label="开始录音"
            >
              <span className="btn-icon">🎤</span>
              开始录音
            </button>
          ) : (
            <>
              <button 
                className="btn btn-pause" 
                onClick={pauseRecording}
                aria-label={isPaused ? '继续录音' : '暂停录音'}
              >
                <span className="btn-icon">{isPaused ? '▶️' : '⏸️'}</span>
                {isPaused ? '继续' : '暂停'}
              </button>
              <button 
                className="btn btn-stop" 
                onClick={stopRecording}
                aria-label="停止录音"
              >
                <span className="btn-icon">⏹️</span>
                停止
              </button>
            </>
          )}
          
          {recordingTime > 0 && !isRecording && (
            <button 
              className="btn btn-reset" 
              onClick={resetRecording}
              aria-label="重置录音"
            >
              <span className="btn-icon">🔄</span>
              重置
            </button>
          )}
        </div>
        
        {/* 当前录音播放 */}
        {audioURL && (
          <div className="current-audio">
            <h4>📻 当前录音</h4>
            <audio 
              controls 
              src={audioURL} 
              className="audio-player"
              preload="metadata"
            >
              您的浏览器不支持音频播放
            </audio>
            {isMobile && (
              <div className="mobile-audio-tip">
                <span>提示：点击播放按钮收听录音</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 录音历史列表 */}
      <div className="recordings-list">
        <h3>📚 录音历史</h3>
        {recordings.length === 0 ? (
          <div className="empty-state">
            <p>暂无录音记录</p>
            <span>点击上方按钮开始您的第一次录音</span>
          </div>
        ) : (
          <div className="recordings-grid">
            {recordings.map((recording) => (
              <div key={recording.id} className="recording-item">
                <div className="recording-info">
                  <div className="recording-title">
                    🎵 录音 #{recording.id.toString().slice(-4)}
                  </div>
                  <div className="recording-meta">
                    <span className="duration">{formatTime(recording.duration)}</span>
                    <span className="timestamp">{recording.timestamp}</span>
                  </div>
                </div>
                
                <audio 
                  controls 
                  src={recording.url} 
                  className="recording-audio"
                  preload="metadata"
                >
                  您的浏览器不支持音频播放
                </audio>
                
                <button 
                  className="delete-btn" 
                  onClick={() => deleteRecording(recording.id)}
                  title="删除录音"
                  aria-label="删除录音"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordComponent;