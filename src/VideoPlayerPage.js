import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoPlayerPage.css';

const VideoPlayerPage = () => {
  const { userid: userCode, sessionid: sessionId, videoid: videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/recordings/';
  // 注意：这里的ossUrl仅作为备用，实际URL从云端加载时动态构建

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 监听首次用户交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!userInteracted) {

        setUserInteracted(true);
      }
    };

    const events = ['touchstart', 'click', 'tap', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [userInteracted]);

  // 点击外部关闭倍速选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSpeedControl && !event.target.closest('.speed-selector')) {
        setShowSpeedControl(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSpeedControl]);

  // 移动端视口高度修正
  useEffect(() => {
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    setVhProperty();

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

  // 加载视频数据
  useEffect(() => {
    if (videoId && userCode) {
      loadVideoFromStorage();
    }
  }, [videoId, userCode]);

  // 从云端加载视频
  const loadVideoFromCloud = async () => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
    
    try {
      if (!userCode) {
        console.log('VideoPlayerPage: userCode为空，无法加载云端视频');
        return null;
      }
      
      console.log('VideoPlayerPage: 开始从云端加载视频', { userCode, sessionId, videoId });
      
      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );
      
      if (!response.ok) throw new Error('获取云端文件失败');
      
      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];
      
      console.log('VideoPlayerPage: 获取到云端文件列表', files.length, '个文件');

      // 先过滤出所有视频文件
      const videoFiles = files.filter(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
        return isVideo;
      });
      
      console.log('VideoPlayerPage: 过滤后的视频文件', videoFiles.length, '个');

      // 查找匹配的视频文件 - 使用多种匹配策略
      let foundFile = null;
      
      // 策略1: 精确文件名匹配
      if (videoId) {
        foundFile = videoFiles.find(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          return fileName.includes(videoId);
        });
        
        if (foundFile) {
          console.log('VideoPlayerPage: 策略1匹配成功 - 精确文件名匹配');
        }
      }
      
      // 策略2: 会话ID + 视频ID匹配
      if (!foundFile && sessionId && videoId) {
        foundFile = videoFiles.find(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const pathParts = objectKey ? objectKey.split('/') : [];
          const fileSessionId = pathParts.length >= 3 ? pathParts[2] : '';
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          return fileSessionId === sessionId && fileName.includes(videoId);
        });
        
        if (foundFile) {
          console.log('VideoPlayerPage: 策略2匹配成功 - 会话ID + 视频ID匹配');
        }
      }
      
      // 策略3: 生成的ID匹配（vid_开头的唯一ID）
      if (!foundFile && videoId && videoId.startsWith('vid_')) {
        foundFile = videoFiles.find(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          return nameWithoutExt === videoId || fileName.includes(videoId);
        });
        
        if (foundFile) {
          console.log('VideoPlayerPage: 策略3匹配成功 - 生成的ID匹配');
        }
      }
      
      // 策略4: 部分ID匹配（最后8位）
      if (!foundFile && videoId && videoId.length >= 8) {
        const partialId = videoId.slice(-8);
        foundFile = videoFiles.find(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          return fileName.includes(partialId);
        });
        
        if (foundFile) {
          console.log('VideoPlayerPage: 策略4匹配成功 - 部分ID匹配');
        }
      }
      
      // 备选策略：如果都没找到，使用第一个视频文件
      if (!foundFile && videoFiles.length > 0) {
        foundFile = videoFiles[0];
        console.log('VideoPlayerPage: 使用备选策略 - 第一个视频文件');
      }

      if (foundFile) {
        const objectKey = foundFile.object_key || foundFile.objectKey || foundFile.key || foundFile.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        
        console.log('VideoPlayerPage: 找到匹配的视频文件', { objectKey, fileName });
        
        // 构建OSS URL
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const videoUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        
        console.log('VideoPlayerPage: 构建的视频URL', videoUrl);
        
        // 从objectKey解析会话ID
        const pathParts = objectKey ? objectKey.split('/') : [];
        const fileSessionId = pathParts.length >= 3 ? pathParts[2] : 'unknown';
        
        const videoData = {
          id: videoId,
          name: fileName,
          url: videoUrl,
          preview: videoUrl,
          ossUrl: videoUrl,
          type: 'video',
          uploadTime: foundFile.last_modified || foundFile.lastModified || foundFile.modified || new Date().toISOString(),
          objectKey,
          sessionId: fileSessionId,
          userCode,
          isCloudFile: true
        };
        
        console.log('VideoPlayerPage: 返回视频数据', videoData);
        return videoData;
      }
      
      console.log('VideoPlayerPage: 未找到匹配的视频文件');
      return null;
    } catch (error) {
      console.error('VideoPlayerPage: 云端视频加载失败:', error);
      console.error('VideoPlayerPage: 加载参数:', { userCode, sessionId, videoId });
      return null;
    }
  };

  const loadVideoFromStorage = async () => {
    try {
      setLoading(true);
      console.log('VideoPlayerPage: 开始加载视频', { userCode, sessionId, videoId });
      
      // 优先从云端加载
      const cloudVideo = await loadVideoFromCloud();
      if (cloudVideo) {
        console.log('VideoPlayerPage: 从云端加载视频成功:', cloudVideo);
        setVideo(cloudVideo);
        setLoading(false);
        return;
      }
      
      // 云端加载失败，降级到localStorage
      console.log('VideoPlayerPage: 云端加载失败，尝试从localStorage加载');
      const saved = localStorage.getItem('uploadedFiles');
      if (saved) {
        const files = JSON.parse(saved);
        const videoFiles = files.filter(file => file.type === 'video');
        
        console.log('VideoPlayerPage: localStorage中的视频文件数量:', videoFiles.length);
        
        // 查找指定的视频文件
        let foundVideo = null;
        
        // 优先通过唯一ID查找（新系统）
        if (videoId && videoId.startsWith('vid_')) {
          foundVideo = videoFiles.find(file => file.id === videoId);
          if (foundVideo) {
            console.log('VideoPlayerPage: 通过唯一ID找到视频');
          }
        } else {
          // 兼容旧系统的查找方式
          foundVideo = videoFiles.find(file => 
            file.id.toString() === videoId || 
            videoFiles.indexOf(file).toString() === videoId
          );
          if (foundVideo) {
            console.log('VideoPlayerPage: 通过兼容性查找找到视频');
          }
        }
        
        if (foundVideo) {
          console.log('VideoPlayerPage: 从localStorage加载视频成功:', foundVideo);
          setVideo(foundVideo);
        } else {
          console.log('VideoPlayerPage: 未找到指定的视频文件，videoId:', videoId);
          console.log('VideoPlayerPage: 可用的视频文件IDs:', videoFiles.map(f => f.id));
        }
      } else {
        console.log('VideoPlayerPage: localStorage中没有上传文件记录');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('VideoPlayerPage: 加载视频数据失败:', error);
      setLoading(false);
    }
  };

  // 视频事件处理
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setVideoReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
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

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
    };

    const handleRateChange = () => {
      setPlaybackRate(videoElement.playbackRate);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleCanPlay = () => {
      // 视频可以播放时自动开始播放
      if (userInteracted) {
        videoElement.play().catch(err => {
          console.log('自动播放失败:', err);
        });
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ratechange', handleRateChange);
    videoElement.addEventListener('canplay', handleCanPlay);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ratechange', handleRateChange);
      videoElement.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [video]);

  // 控制函数
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleProgressChange = (e) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.currentTime = (value / 100) * duration;
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.volume = value;
    setVolume(value);
  };

  const handlePlaybackRateChange = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // 检测iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (!document.fullscreenElement && !video.webkitDisplayingFullscreen) {
      if (isIOS) {
        // iOS设备使用特殊的全屏API
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        }
      } else {
        // 非iOS设备使用标准全屏API
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(err => {
            console.log('全屏播放失败:', err);
          });
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        }
      }
    } else {
      if (isIOS && video.webkitExitFullscreen) {
        video.webkitExitFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const goBack = () => {
    // 检查URL参数中是否有from=player标识
    const urlParams = new URLSearchParams(window.location.search);
    const fromPlayer = urlParams.get('from');
    
    if (fromPlayer === 'player') {
      // 从播放页面进入的，返回播放页面
      const recordingId = urlParams.get('recordingId') || 'default';
      navigate(`/${userCode}/${sessionId}/play/${recordingId}`);
    } else if (sessionId && sessionId !== 'homepage') {
      // 有具体的sessionid，返回到对应的上传页面
      navigate(`/${userCode}/upload-media/${sessionId}`);
    } else {
      // 如果是从主页进入的视频或没有sessionid，返回主页
      navigate(`/${userCode}`);
    }
  };

  const deleteVideo = async () => {
    if (!video) return;
    
    if (!window.confirm('确定要删除这个视频吗？删除后无法恢复。')) {
      return;
    }

    try {
      // 如果有服务器objectKey，尝试从服务器删除
      if (video.objectKey) {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
        const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(video.objectKey)}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          console.warn('服务器删除失败，但继续删除本地记录');
        }
      }
      
      // 从localStorage删除
      const saved = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const updated = saved.filter(file => file.id !== video.id);
      localStorage.setItem('uploadedFiles', JSON.stringify(updated));
      window.dispatchEvent(new Event('filesUpdated'));
      
      // 删除成功后跳转回来源页面
      goBack();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="video-player-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载视频中...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-player-page error">
        <div className="error-content">
          <h2>视频未找到</h2>
          <p>无法找到指定的视频文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-page">
      {/* 背景装饰 */}
      <div className="background-decoration">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* 顶部导航 */}
      <div className="player-header">
        <div className="session-info">
          <span>用户: {userCode} | 视频ID: {video.id.split('_').pop()}</span>
        </div>
      </div>

      {/* 主播放区域 */}
      <div className="player-main">
        <div className="player-container">
          {/* 视频信息 */}
          {/* <div className="video-info">
            <div className="video-avatar">
              <div className="avatar-icon">🎬</div>
            </div>
          </div> */}

          {/* 视频播放器 */}
          <div className="video-container">
            <video
              ref={videoRef}
              src={video.ossUrl || video.preview || video.url}
              className="video-element"
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '80vh', background: '#000' }}
              onError={(e) => {
                console.error('视频加载失败:', video.ossUrl || video.preview || video.url);
                console.error('视频对象:', video);
              }}
            />
          </div>

          {/* 外部控制区域 */}
          <div className="external-controls">
            {/* 进度控制 */}
            <div className="progress-section">
              <div className="progress-container">
                <input
                  type="range"
                  className="progress-slider"
                  min="0"
                  max="100"
                  value={getProgressPercent()}
                  onChange={handleProgressChange}
                />
                <div className="progress-fill" style={{ width: `${getProgressPercent()}%` }}></div>
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
                  style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px', transform: 'rotate(180deg)' }}
                />
                <span className="btn-label">-10s</span>
              </button>
              
              <button 
                className={`control-btn play-box ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlayPause}
              >
                <img 
                  src={isPlaying ? "/asset/stop_button.png" : "/asset/play_button.png"} 
                  alt={isPlaying ? "暂停" : "播放"} 
                  className="btn-icon"
                  style={{ 
                    width: isMobile ? '50px' : '70px', 
                    height: isMobile ? '50px' : '70px', 
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
                  style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                />
                <span className="btn-label">+10s</span>
              </button>
            </div>

            {/* 简化的控制面板 */}
            <div className="compact-controls">
              {/* 倍速控制和全屏按钮并排 */}
              <div className="control-row">
                <div className="speed-control">
                  <label className="control-label">播放速度</label>
                  <div className="speed-selector">
                    <button 
                      className="current-speed-btn"
                      onClick={() => setShowSpeedControl(!showSpeedControl)}
                    >
                      {playbackRate}x ▼
                    </button>
                    {showSpeedControl && (
                      <div className="speed-dropdown">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                            onClick={() => {
                              handlePlaybackRateChange(rate);
                              setShowSpeedControl(false);
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 全屏按钮（移动端也显示） */}
                <div className="fullscreen-control">
                  <button className="fullscreen-btn" onClick={toggleFullscreen} style={{marginLeft: 12}}>
                    {isFullscreen ? '退出全屏' : '全屏播放'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VideoPlayerPage; 