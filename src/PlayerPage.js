import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlayerPage.css';
import { getUserCode, validateUserCode } from './utils/userCode';

// API配置
const API_BASE_URL = 'http://6.6.6.65:8000';
const OSS_BASE_URL = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com';

const PlayerPage = () => {
  const { userid, id, recordingId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  
  const [recording, setRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [userCode, setUserCode] = useState(''); // 4字符用户代码

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
  }, [userid, navigate]);

  // 移动端视口高度修正
  useEffect(() => {
    const setVhProperty = () => {
      // 获取真实的视口高度
      const vh = window.innerHeight * 0.01;
      // 设置CSS自定义属性
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 初始设置
    setVhProperty();

    // 监听窗口大小变化（包括移动端地址栏显示/隐藏）
    const handleResize = () => {
      setVhProperty();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // 从云端API加载录音数据
  useEffect(() => {
    if (id && recordingId && userCode) {
      loadRecordingFromCloud();
    }
  }, [id, recordingId, userCode, navigate]);

  const loadRecordingFromCloud = async () => {
    try {
      setLoading(true);

      // 获取指定会话的所有录音文件，使用用户代码作为路径前缀
      const prefix = `recordings/${userCode}/${id}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );

      if (!response.ok) {
        throw new Error(`获取录音文件失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('云端录音API返回结果:', result);

      const isSuccess = result.success === true || result.status === 'success' || response.ok;
      
      if (isSuccess) {
        const files = result.files || result.data || result.objects || result.items || result.results || [];
        console.log('会话录音文件列表:', files);

        // 查找指定的录音文件
        const foundFile = files.find(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          if (!objectKey) return false;

          // 从object_key提取文件名
          const fileName = objectKey.split('/').pop();
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
          
          console.log(`检查文件 ${fileName}:`);
          console.log(`  文件名（无扩展名）: ${nameWithoutExt}`);
          console.log(`  查找的recordingId: ${recordingId}`);
          
          // 多种匹配策略
          const strategies = [
            // 策略1: 精确的recording_ID格式匹配
            () => nameWithoutExt === `recording_${recordingId}`,
            
            // 策略2: 文件名包含recordingId
            () => nameWithoutExt.includes(recordingId.toString()),
            
            // 策略3: 下划线分割后的任意部分匹配
            () => {
              const parts = nameWithoutExt.split('_');
              return parts.includes(recordingId.toString()) || parts.includes(recordingId);
            },
            
            // 策略4: 如果文件名是纯数字，直接比较
            () => {
              const fileNumber = nameWithoutExt.replace(/\D/g, '');
              return fileNumber === recordingId.toString();
            },
            
            // 策略5: 检查文件名最后的数字部分是否匹配recordingId的后几位
            () => {
              const fileParts = nameWithoutExt.split('_');
              const lastPart = fileParts[fileParts.length - 1];
              const recordingIdStr = recordingId.toString();
              
              // 检查最后部分是否是recordingId的后8位或前8位
              return (
                lastPart === recordingIdStr ||
                (recordingIdStr.length > 8 && lastPart === recordingIdStr.slice(-8)) ||
                (recordingIdStr.length > 8 && lastPart === recordingIdStr.slice(0, 8))
              );
            }
          ];
          
          // 逐一尝试每种策略
          for (let i = 0; i < strategies.length; i++) {
            try {
              const result = strategies[i]();
              if (result) {
                console.log(`  匹配成功！使用策略 ${i + 1}`);
                return true;
              }
            } catch (e) {
              console.warn(`  策略 ${i + 1} 执行失败:`, e);
            }
          }
          
          console.log(`  所有策略都未匹配成功`);
          return false;
        });

        // 如果找到匹配的文件，或者会话中只有一个文件就使用它
        let targetFile = foundFile || (files.length === 1 ? files[0] : null);
        
        // 如果还是没找到，尝试按时间排序找最新的文件作为备选
        if (!targetFile && files.length > 0) {
          console.log('未找到精确匹配，尝试使用最新的录音文件');
          const sortedFiles = [...files].sort((a, b) => {
            const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0);
            const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0);
            return timeB - timeA; // 降序排列，最新的在前
          });
          targetFile = sortedFiles[0];
          console.log('使用最新文件作为备选:', targetFile);
        }

        if (targetFile) {
          console.log('使用录音文件:', targetFile);
          
          // 从文件名提取真实的唯一标识符
          const objectKey = targetFile.object_key || targetFile.objectKey || targetFile.key || targetFile.name;
          const fileName = objectKey.split('/').pop();
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
          const parts = nameWithoutExt.split('_');
          const realUniqueId = parts[parts.length - 1];
          
          let signedUrl = targetFile.file_url || targetFile.fileUrl || targetFile.url;
          
          // 如果没有直接的URL，构建OSS URL
          if (!signedUrl) {
            // 构建阿里云OSS URL
            signedUrl = `${OSS_BASE_URL}/${objectKey}`;
            console.log('构建的OSS URL:', signedUrl);
          } else {
            console.log('使用API返回的URL:', signedUrl);
          }
          
          // 如果signedUrl还是空，尝试获取签名URL
          if (!signedUrl) {
            try {
              console.log('获取签名URL中...');
              const urlResponse = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(objectKey)}/url`);
              if (urlResponse.ok) {
                const urlResult = await urlResponse.json();
                signedUrl = urlResult.signed_url || urlResult.signedUrl || urlResult.url;
                console.log('获取到签名URL:', signedUrl);
              } else {
                console.warn('获取签名URL失败:', urlResponse.status);
              }
            } catch (urlError) {
              console.error('获取签名URL出错:', urlError);
            }
          }
          
          // 构建录音对象
          const recording = {
            id: realUniqueId, // 使用真实的唯一标识符
            objectKey: objectKey,
            signedUrl: signedUrl,
            fileName: fileName,
            size: targetFile.size || 0,
            timestamp: formatDateFromString(targetFile.last_modified || targetFile.lastModified || targetFile.modified || new Date().toISOString()),
            boundAt: formatDateFromString(targetFile.last_modified || targetFile.lastModified || targetFile.modified || new Date().toISOString()),
            duration: 0, // 将在音频加载后获取
            uploaded: true,
            cloudUrl: signedUrl
          };

          console.log('构建的录音对象:', recording);
          console.log('objectKey:', objectKey);
          console.log('完整OSS URL:', signedUrl);
          console.log('音频URL:', recording.signedUrl);
          setRecording(recording);
        } else {
          console.log('未找到指定的录音文件，recordingId:', recordingId);
          console.log('会话中的所有文件:', files);
          navigate(`/${userCode}/${id}`);
        }
      } else {
        throw new Error(result.message || result.error || result.detail || '获取录音文件失败');
      }
    } catch (error) {
      console.error('加载云端录音失败:', error);
      navigate(`/${userCode}/${id}`);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期字符串
  const formatDateFromString = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('音频元数据加载完成:', audio.duration);
      console.log('音频准备状态:', audio.readyState);
      setDuration(audio.duration);
    };

    const handleLoadStart = () => {
      console.log('开始加载音频文件');
      console.log('音频URL:', audio.src);
      console.log('objectKey:', recording?.objectKey);
    };

    const handleCanPlay = () => {
      console.log('音频可以播放');
      console.log('音频准备状态:', audio.readyState);
      setAudioReady(true);
    };

    const handleCanPlayThrough = () => {
      console.log('音频完全加载，可以无中断播放');
      setAudioReady(true);
    };

    const handleLoadedData = () => {
      console.log('音频帧数据加载完成');
    };

    const handleError = (e) => {
      console.error('音频加载错误:', e);
      console.error('音频URL:', audio.src);
      console.error('错误代码:', audio.error?.code);
      console.error('错误信息:', audio.error?.message);
      // 重置播放状态
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recording]);

  // 播放/暂停控制
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // 确保音频已经准备好播放
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          await audio.play();
        } else {
          console.log('音频还未准备好，等待加载完成...');
          // 等待音频准备好后再播放
          const handleCanPlay = async () => {
            try {
              await audio.play();
              audio.removeEventListener('canplay', handleCanPlay);
            } catch (error) {
              console.error('延迟播放失败:', error);
            }
          };
          audio.addEventListener('canplay', handleCanPlay);
        }
      }
    } catch (error) {
      console.error('播放控制错误:', error);
      // 重置播放状态
      setIsPlaying(false);
    }
  };

  // 进度条控制
  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const percent = e.target.value / 100;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 音量控制
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 播放速度控制
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // 快进/快退
  const skipTime = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 删除录音
  const deleteRecording = async () => {
    if (window.confirm('确定要删除这个录音吗？')) {
      try {
        if (recording?.objectKey) {
          // 调用云端API删除文件
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(recording.objectKey)}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`删除文件失败: ${response.status} ${response.statusText}`);
          }

          console.log('云端录音文件删除成功');
        }
      } catch (error) {
        console.error('删除云端录音失败:', error);
        alert('删除录音失败，请稍后重试');
        return;
      }

      // 返回会话页面
      navigate(`/${userCode}/${id}`);
    }
  };

  // 从object_key中提取唯一标识符
  const extractUniqueId = (objectKey) => {
    if (!objectKey) return 'unknown';
    
    try {
      // 从路径中获取文件名: recordings/vmu3wwah/20250611_000019_b2c5932f.webm
      const fileName = objectKey.split('/').pop(); // 20250611_000019_b2c5932f.webm
      
      // 移除扩展名: 20250611_000019_b2c5932f
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      
      // 提取最后一个下划线后的部分: b2c5932f
      const parts = nameWithoutExt.split('_');
      return parts[parts.length - 1] || 'unknown';
    } catch (error) {
      console.warn('提取唯一标识符失败:', error);
      return 'unknown';
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取进度百分比
  const getProgressPercent = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  if (loading) {
    return (
      <div className="player-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="player-page error">
        <div className="error-content">
          <h2>❌ 录音不存在</h2>
          <p>找不到指定的录音文件</p>
          <button onClick={() => navigate(`/${userCode}/${id}`)} className="back-btn">
            返回录音页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* 背景装饰 */}
      <div className="background-decoration">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* 顶部导航 */}
      <header className="player-header">
        <button onClick={() => navigate(`/${userCode}`)} className="nav-back-btn">
          <span className="back-icon">←</span>
          <span>返回</span>
        </button>
        
        <div className="session-info">
          <span className="session-label">会话ID</span>
          <span className="session-id">{userCode ? `${userCode}/${id}` : id}</span>
        </div>
        
        <button onClick={deleteRecording} className="delete-recording-btn">
          <span>🗑️</span>
          <span>删除</span>
        </button>
      </header>

      {/* 主播放器区域 */}
      <main className="player-main">
        <div className="player-container">
          <img src="/asset/elephant.png" alt="背景" className="elephant-icon" />
          {/* 录音信息 */}
          <div className="recording-info">
            <div className="recording-avatar">
              <div className="avatar-icon">
                <img src="/asset/music.png" alt="音乐图标" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
              </div>
              <div className="sound-waves">
                <div className={`wave-bar ${isPlaying ? 'active' : ''}`}></div>
                <div className={`wave-bar ${isPlaying ? 'active' : ''}`}></div>
                <div className={`wave-bar ${isPlaying ? 'active' : ''}`}></div>
                <div className={`wave-bar ${isPlaying ? 'active' : ''}`}></div>
              </div>
            </div>
            
            <div className="recording-details">
              <h1 className="recording-title">
                录音 #{extractUniqueId(recording.objectKey || recording.object_key)}
              </h1>
              <div className="recording-metadata">
                <div className="metadata-item">
                  <span className="label">录制时间</span>
                  <span className="value">{recording.timestamp}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">绑定时间</span>
                  <span className="value">{recording.boundAt}</span>
                </div>

              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="progress-section">
            <div className="time-display">
              <span className="current-time">{formatTime(currentTime)}</span>
            </div>
            <div className="progress-container">
              <input
                type="range"
                min="0"
                max="100"
                value={getProgressPercent()}
                onChange={handleProgressChange}
                className="progress-slider"
              />
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercent()}%` }}
              ></div>
            </div>
          </div>

          {/* 主控制按钮 */}
          <div className="main-controls">
            <button 
              onClick={() => skipTime(-10)} 
              className="control-btn skip-btn"
              title="后退10秒"
            >
              <img 
                src="/asset/fast.png" 
                alt="后退10秒"
                className="btn-icon"
                style={{ width: '50px', height: '50px', transform: 'rotate(180deg)' }}
              />
              <span className="btn-label">-10s</span>
            </button>
            
            <button 
              onClick={togglePlayPause} 
              className={`control-btn play-btn ${isPlaying ? 'playing' : ''} ${!audioReady ? 'disabled' : ''}`}
              disabled={!audioReady}
              title={!audioReady ? '音频加载中...' : isPlaying ? '暂停' : '播放'}
            >
              <img 
                src={!audioReady ? "/asset/loading.png" : isPlaying ? "/asset/stop_button.png" : "/asset/play_button.png"} 
                alt={!audioReady ? "加载中" : isPlaying ? "暂停" : "播放"} 
                className="btn-icon"
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  transform: isPlaying ? 'translateY(-2px)' : 'translateY(+2px)' 
                }}
              />
            </button>
            
            <button 
              onClick={() => skipTime(10)} 
              className="control-btn skip-btn"
              title="前进10秒"
            >
              <img 
                src="/asset/fast.png" 
                alt="前进10秒"
                className="btn-icon"
                style={{ width: '50px', height: '50px' }}
              />
              <span className="btn-label">+10s</span>
            </button>
          </div>

          {/* 高级控制 */}
          <div className="advanced-controls">
            {/* 播放速度 */}
            <div className="control-group">
              <label className="control-label">播放速度</label>
              <div className="speed-buttons">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`speed-btn ${playbackRate === rate ? 'active' : ''}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* 音量控制 */}
            <div className="control-group">
              <label className="control-label">
                <span>🔊</span>
                <span>音量</span>
              </label>
              <div className="volume-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={recording.signedUrl || recording.cloudUrl || recording.url}
        preload="auto"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
        onLoadedMetadata={() => console.log('音频URL:', recording.signedUrl || recording.cloudUrl || recording.url)}
        onError={(e) => {
          console.error('音频元素错误:', e);
          console.error('当前src:', e.target.src);
        }}
      />
    </div>
  );
};

export default PlayerPage; 