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
  
  // 引用
  const mediaRecorderRef = useRef(null); // MediaRecorder实例
  const audioChunksRef = useRef([]); // 音频数据块
  const timerRef = useRef(null); // 计时器引用
  const streamRef = useRef(null); // 媒体流引用

  // 检查浏览器支持
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      console.error('浏览器不支持录音功能');
    }
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
      
      // 创建MediaRecorder实例
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // 音频格式
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
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // 保存录音到列表
        const newRecording = {
          id: Date.now(),
          url: url,
          duration: recordingTime,
          timestamp: new Date().toLocaleString('zh-CN')
        };
        
        setRecordings(prev => [newRecording, ...prev]);
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
        <div className={`record-indicator ${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}>
          <div className="indicator-dot"></div>
          <span className="status-text">
            {isRecording ? (isPaused ? '已暂停' : '录音中...') : '准备录音'}
          </span>
        </div>
        
        {/* 控制按钮 */}
        <div className="control-buttons">
          {!isRecording ? (
            <button className="btn btn-start" onClick={startRecording}>
              <span className="btn-icon">🎤</span>
              开始录音
            </button>
          ) : (
            <>
              <button className="btn btn-pause" onClick={pauseRecording}>
                <span className="btn-icon">{isPaused ? '▶️' : '⏸️'}</span>
                {isPaused ? '继续' : '暂停'}
              </button>
              <button className="btn btn-stop" onClick={stopRecording}>
                <span className="btn-icon">⏹️</span>
                停止
              </button>
            </>
          )}
          
          {recordingTime > 0 && !isRecording && (
            <button className="btn btn-reset" onClick={resetRecording}>
              <span className="btn-icon">🔄</span>
              重置
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
                
                <audio controls src={recording.url} className="recording-audio">
                  您的浏览器不支持音频播放
                </audio>
                
                <button 
                  className="delete-btn" 
                  onClick={() => deleteRecording(recording.id)}
                  title="删除录音"
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