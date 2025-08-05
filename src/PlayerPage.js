import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlayerPage.css';
import './themes/theme-overrides.css';
import { getUserCode, validateUserCode } from './utils/userCode';
import CommentSection from './components/CommentSection';
import ThemeSwitcher from './components/ThemeSwitcher';
import ThemedIcon from './components/ThemedIcon';
import { getCurrentTheme, applyTheme } from './themes/themeConfig';
// Swiper相关引入
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// API配置


const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

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
  const [userInteracted, setUserInteracted] = useState(false); // 用户交互状态
  const [isIOS, setIsIOS] = useState(false); // iOS设备检测
  const [mediaFiles, setMediaFiles] = useState([]); // 关联的照片和视频文件
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // 当前轮播索引
  const [previewFile, setPreviewFile] = useState(null); // 预览文件
  const [isMobile, setIsMobile] = useState(false); // 是否移动设备
  const [videoPlaying, setVideoPlaying] = useState(false); // 视频播放状态
  const [videoAutoFullscreenTried, setVideoAutoFullscreenTried] = useState(false); // 是否已尝试自动全屏
  const videoPreviewRef = useRef(null); // 视频预览引用
  const [videoThumbnails, setVideoThumbnails] = useState({}); // 视频缩略图缓存
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme()); // 当前主题

  // 新增音频列表相关状态
  const [audioFiles, setAudioFiles] = useState([]); // 会话下的所有音频文件
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0); // 当前播放的音频索引
  const [showAudioModal, setShowAudioModal] = useState(false); // 是否显示音频列表弹窗

  // 检测iOS设备
  useEffect(() => {
    const checkIsIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    setIsIOS(checkIsIOS());
  }, []);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) ||
                    ('ontouchstart' in window) || // 支持触摸的设备
                    (navigator.maxTouchPoints > 0); // 支持触摸点的设备
      setIsMobile(mobile);
      console.log('移动设备检测结果:', mobile);
      console.log('UserAgent:', navigator.userAgent);
      console.log('窗口宽度:', window.innerWidth);
      console.log('支持触摸:', 'ontouchstart' in window);
      console.log('最大触摸点:', navigator.maxTouchPoints);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 监听首次用户交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!userInteracted) {
        console.log('检测到首次用户交互');
        setUserInteracted(true);
        
        // 为iOS设备初始化音频上下文
        if (isIOS && audioRef.current) {
          const audio = audioRef.current;
          
          // 检查音频元素是否有效
          if (!audio || typeof audio.play !== 'function') {
            console.warn('音频元素无效，跳过iOS权限解锁');
            return;
          }
          
          // 预加载音频以准备播放
          try {
            audio.load();
          } catch (error) {
            console.warn('音频加载失败:', error);
            return;
          }
          
          // 尝试创建一个静音的播放来"解锁"音频播放权限
          try {
            const originalVolume = audio.volume;
            audio.volume = 0;
            audio.play().then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = originalVolume;
              console.log('iOS音频权限已解锁');
            }).catch((error) => {
              console.warn('iOS音频权限解锁失败:', error);
            });
          } catch (error) {
            console.warn('iOS音频权限解锁过程中发生错误:', error);
          }
        }
      }
    };

    // 监听多种用户交互事件
    const events = ['touchstart', 'click', 'tap', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [userInteracted, isIOS]);

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && validateUserCode(userid)) {
      setUserCode(userid.toUpperCase());
    } else {
      // 如果用户代码无效，跳转到首页
      navigate('/');
    }
  }, [userid, navigate]);

  // 主题切换处理
  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    applyTheme(newTheme.id);
    // 可以添加主题切换时的其他逻辑，比如通知子组件等
    console.log('主题已切换至:', newTheme.name);
  };

  // 移动端视口高度修正
  useEffect(() => {
    const setVhProperty = () => {
      // 获取真实的视口高度
      const vh = window.innerHeight * 0.01;
      // 设置CSS自定义属性
      if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
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
      setLoading(true);
      Promise.all([
        loadRecordingFromCloud(),
        loadMediaFiles()
      ]).finally(() => setLoading(false));
    }
  }, [id, recordingId, userCode, navigate]);

  // 加载与当前会话相关的照片和视频（云端+本地）
  const loadMediaFiles = async () => {
    try {
      let localFiles = [];
      try {
        const saved = localStorage.getItem('uploadedFiles');
        if (saved) {
          const allFiles = JSON.parse(saved);
          localFiles = allFiles.filter(file => 
            file.sessionId === id && (file.type === 'image' || file.type === 'video')
          );
        }
      } catch (error) {
        // 本地异常忽略
      }
      setMediaFiles(localFiles);
      // 异步加载云端数据，加载后刷新
      let cloudFiles = [];
      if (userCode && id) {
        const prefix = `recordings/${userCode}/${id}/`;
        const response = await fetch(
          `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
        );
        if (response.ok) {
          const result = await response.json();
          const files = result.files || result.data || result.objects || result.items || result.results || [];
          cloudFiles = files.map(file => {
            const objectKey = file.object_key || file.objectKey || file.key || file.name;
            const fileName = objectKey ? objectKey.split('/').pop() : '';
            const contentType = file.content_type || '';
            const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
            const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
            if (!isImage && !isVideo) return null;
            const timestamp = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            const uniqueId = nameWithoutExt.slice(-8) || Math.random().toString(36).substr(2, 8);
            const prefix = isImage ? 'img' : 'vid';
            const generatedId = `${prefix}_${id}_${Date.parse(timestamp)}_${uniqueId}`;
            let ossKey = objectKey;
            if (ossKey && ossKey.startsWith('recordings/')) {
              ossKey = ossKey.substring('recordings/'.length);
            }
            const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
            const ossUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
            return {
              id: generatedId,
              name: fileName,
              preview: ossUrl,
              url: ossUrl,
              type: isImage ? 'image' : 'video',
              uploadTime: timestamp,
              objectKey,
              sessionId: id,
              userCode,
              isCloudFile: true
            };
          }).filter(Boolean);
        }
      }
      // 合并去重（以云端为主，ID为唯一标识）
      const allFiles = [...cloudFiles, ...localFiles.filter(lf => !cloudFiles.some(cf => cf.id === lf.id))];
      setMediaFiles(allFiles);
      // 只为当前轮播页及前后各1页生成缩略图
      if (allFiles.length > 0) {
        processVideoThumbnailsLazy(allFiles, currentMediaIndex);
      }
    } catch (error) {
      console.error('加载媒体文件失败:', error);
      setMediaFiles([]);
    }
  };

  // 监听localStorage变化，实时更新媒体文件（异步）
  useEffect(() => {
    const handleFilesUpdated = () => {
      loadMediaFiles();
    };
    window.addEventListener('filesUpdated', handleFilesUpdated);
    return () => window.removeEventListener('filesUpdated', handleFilesUpdated);
  }, [id, userCode]);

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

        // 先过滤出音频文件（排除图片和视频文件）
        const audioFiles = files.filter(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          if (!objectKey) return false;
          const fileName = objectKey.split('/').pop();
          const contentType = file.content_type || '';

          // 判断是否为图片
          const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
          // 判断是否为视频
          const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(fileName);
          // 判断是否为音频
          const isAudio = contentType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma|amr|3gp|opus)$/i.test(fileName);

          // 只保留音频，排除图片和视频
          return isAudio && !isImage && !isVideo;
        });

        console.log('过滤后的音频文件列表:', audioFiles);

        // 处理所有音频文件，构建音频列表
        const processedAudioFiles = audioFiles.map(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey.split('/').pop();
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
          const parts = nameWithoutExt.split('_');
          const realUniqueId = parts[parts.length - 1];
          
          let signedUrl = file.file_url || file.fileUrl || file.url;
          
          // 如果没有直接的URL，构建OSS URL
          if (!signedUrl) {
            signedUrl = `${OSS_BASE_URL}/${objectKey}`;
          }
          
          // 检查是否为视频文件
          const isVideo = fileName.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) || 
                         (file.content_type && file.content_type.startsWith('video/'));

          return {
            id: realUniqueId,
            objectKey: objectKey,
            signedUrl: signedUrl,
            fileName: fileName,
            size: file.size || 0,
            timestamp: formatDateFromString(file.last_modified || file.lastModified || file.modified || new Date().toISOString()),
            boundAt: formatDateFromString(file.last_modified || file.lastModified || file.modified || new Date().toISOString()),
            duration: 0,
            uploaded: true,
            cloudUrl: signedUrl,
            isVideo: isVideo,
            fileType: file.content_type || ''
          };
        });

        // 按时间排序，最新的在前
        const sortedAudioFiles = processedAudioFiles.sort((a, b) => {
          const timeA = new Date(a.timestamp);
          const timeB = new Date(b.timestamp);
          return timeB - timeA;
        });

        setAudioFiles(sortedAudioFiles);

        // 查找指定的录音文件
        let targetIndex = 0; // 默认播放第一个
        if (recordingId) {
          const foundIndex = sortedAudioFiles.findIndex(audio => {
            const nameWithoutExt = audio.fileName.replace(/\.[^/.]+$/, "");
            
            // 多种匹配策略
            const strategies = [
              () => nameWithoutExt === `recording_${recordingId}`,
              () => nameWithoutExt.includes(recordingId.toString()),
              () => {
                const parts = nameWithoutExt.split('_');
                return parts.includes(recordingId.toString()) || parts.includes(recordingId);
              },
              () => {
                const fileNumber = nameWithoutExt.replace(/\D/g, '');
                return fileNumber === recordingId.toString();
              },
              () => {
                const fileParts = nameWithoutExt.split('_');
                const lastPart = fileParts[fileParts.length - 1];
                const recordingIdStr = recordingId.toString();
                return (
                  lastPart === recordingIdStr ||
                  (recordingIdStr.length > 8 && lastPart === recordingIdStr.slice(-8)) ||
                  (recordingIdStr.length > 8 && lastPart === recordingIdStr.slice(0, 8))
                );
              }
            ];
            
            for (let i = 0; i < strategies.length; i++) {
              try {
                if (strategies[i]()) {
                  console.log(`找到匹配的音频文件，索引: ${sortedAudioFiles.indexOf(audio)}`);
                  return true;
                }
              } catch (e) {
                console.warn(`策略 ${i + 1} 执行失败:`, e);
              }
            }
            return false;
          });
          
          if (foundIndex !== -1) {
            targetIndex = foundIndex;
          }
        }

        setCurrentAudioIndex(targetIndex);
        
        if (sortedAudioFiles.length > 0) {
          const targetRecording = sortedAudioFiles[targetIndex];
          console.log('设置当前录音:', targetRecording);
          setRecording(targetRecording);
        } else {
          console.log('未找到任何音频文件');
          navigate(`/${userCode}/${id}?recordingNotFound=true`);
        }
      } else {
        throw new Error(result.message || result.error || result.detail || '获取录音文件失败');
      }
    } catch (error) {
      console.error('加载云端录音失败:', error);
      navigate(`/${userCode}/${id}?loadError=true`);
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
      
              // iOS特殊错误处理
        if (isIOS && audio.error) {
          console.error('iOS音频播放错误:', audio.error);
        }
      
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

    // iOS特殊事件处理
    const handleSuspend = () => {
      if (isIOS) {
        console.log('iOS音频挂起');
      }
    };

    const handleStalled = () => {
      if (isIOS) {
        console.log('iOS音频停滞，尝试重新加载');
        // 在iOS上，如果音频停滞，尝试重新加载
        setTimeout(() => {
          if (audio.readyState < 2) {
            audio.load();
          }
        }, 1000);
      }
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
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('stalled', handleStalled);

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
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [recording, isIOS]);

  // 自动播放音频
  // useEffect(() =>{
  //   if(audioReady && audioRef.current && typeof audioRef.current.play === 'function'){
  //     audioRef.current.play().catch((err) =>{
  //       // 处理自动播放被浏览器拦截的情况
  //       console.warn('自动播放失败，可能被浏览器拦截：',err);
  //     });
  //   }
  // },[audioReady]);

  // 播放/暂停控制
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 移动设备必须在用户交互后才能播放音频
    if (isMobile && !userInteracted) {
      alert('请先点击页面任意位置以启用音频播放');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // 移动设备特殊处理
        if (isMobile) {
          // 设置适合移动设备的音频属性
          audio.preload = 'auto';
          audio.defaultMuted = false;
          // 确保音频文件已经加载
          if (!audio.src) {
            const audioUrl = recording?.signedUrl || recording?.cloudUrl || recording?.url;
            if (audioUrl) {
              audio.src = audioUrl;
              console.log('重新设置音频源:', audioUrl);
            }
          }
        }

        // 确保音频已经准备好播放
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          await audio.play();
        } else {
          console.log('音频还未准备好，等待加载完成...');
          
          // 创建一个Promise来等待音频准备好
          const playPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('音频加载超时'));
            }, 10000); // 10秒超时

            const handleCanPlay = async () => {
              clearTimeout(timeout);
              try {
                await audio.play();
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('error', handleError);
                resolve();
              } catch (error) {
                reject(error);
              }
            };

            const handleError = (error) => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', handleCanPlay);
              audio.removeEventListener('error', handleError);
              reject(error);
            };

            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('error', handleError);
            

          });

          try {
            await playPromise;
          } catch (error) {
            console.error('延迟播放失败:', error);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('播放控制错误:', error);
      
      // iOS特殊错误处理
      if (isIOS) {
        console.error('iOS播放错误:', error);
      }
      
      // 重置播放状态
      setIsPlaying(false);
    }
  };

  // 进度条控制
  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 检查 duration 是否有效
    if (!isFinite(duration) || duration <= 0) {
      console.warn('音频时长无效，无法设置进度');
      return;
    }

    const percent = e.target.value / 100;
    const newTime = percent * duration;
    
    // 确保 newTime 是有效的有限数值
    if (!isFinite(newTime) || newTime < 0) {
      console.warn('计算出的新时间无效:', newTime);
      return;
    }

    // 限制时间范围在 [0, duration] 之间
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    
    try {
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    } catch (error) {
      console.error('设置音频时间失败:', error);
    }
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

    // 检查 duration 和 currentTime 是否有效
    if (!isFinite(duration) || duration <= 0) {
      console.warn('音频时长无效，无法快进/快退');
      return;
    }
    
    if (!isFinite(currentTime)) {
      console.warn('当前时间无效，无法快进/快退');
      return;
    }

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    
    // 确保 newTime 是有效的有限数值
    if (!isFinite(newTime)) {
      console.warn('计算出的新时间无效:', newTime);
      return;
    }

    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.error('快进/快退失败:', error);
    }
  };

  // 切换音频文件
  const switchAudio = (index) => {
    if (index >= 0 && index < audioFiles.length) {
      setCurrentAudioIndex(index);
      setRecording(audioFiles[index]);
      setCurrentTime(0);
      setDuration(0);
      setAudioReady(false);
      setIsPlaying(false);
      
      // 重置音频元素
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = audioFiles[index].signedUrl || audioFiles[index].cloudUrl || audioFiles[index].url;
        audioRef.current.load();
      }
    }
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
        
        // 通知录音页面清理已删除的录音
        const recordingIdToDelete = extractUniqueId(recording.objectKey) || recording.id || recordingId;
        localStorage.setItem('recordingDeleted', recordingIdToDelete);
        
        // 触发storage事件通知其他页面（同一页面的不同标签页）
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'recordingDeleted',
          newValue: recordingIdToDelete
        }));
        
        console.log('已通知录音页面清理录音:', recordingIdToDelete);
        
      } catch (error) {
        console.error('删除云端录音失败:', error);
        alert('删除录音失败，请稍后重试');
        return;
      }

      // 返回会话页面，添加删除标记防止无限循环跳转
      navigate(`/${userCode}/${id}?deleted=true`);
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

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    if (!isFinite(duration) || duration <= 0) return 0;
    if (!isFinite(currentTime) || currentTime < 0) return 0;
    
    const percent = (currentTime / duration) * 100;
    
    // 确保返回的百分比是有效的有限数值
    if (!isFinite(percent)) return 0;
    
    // 限制在 0-100 之间
    return Math.max(0, Math.min(100, percent));
  };

  // 生成视频缩略图
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.currentTime = 1; // 截取第1秒的画面
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1); // 取视频10%位置或1秒
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        } catch (error) {
          console.warn('生成视频缩略图失败:', error);
          reject(error);
        } finally {
          video.remove();
        }
      };
      
      video.onerror = (error) => {
        console.warn('视频加载失败:', error);
        video.remove();
        reject(error);
      };
      
      // 设置超时
      setTimeout(() => {
        video.remove();
        reject(new Error('生成缩略图超时'));
      }, 10000);
      
      video.src = videoFile.preview || videoFile.url;
      video.load();
    });
  };

  // 懒加载缩略图，仅为当前轮播页及前后各1页生成
  const processVideoThumbnailsLazy = async (files, currentIndex) => {
    const videoFiles = files.filter(file => file.type === 'video');
    const thumbnails = { ...videoThumbnails };
    const indices = [currentIndex - 1, currentIndex, currentIndex + 1]
      .filter(i => i >= 0 && i < videoFiles.length);
    for (const i of indices) {
      const file = videoFiles[i];
      if (file && !thumbnails[file.id]) {
        try {
          const thumbnail = await generateVideoThumbnail(file);
          thumbnails[file.id] = thumbnail;
        } catch {
          thumbnails[file.id] = '/asset/video.svg';
        }
      }
    }
    setVideoThumbnails(thumbnails);
  };

  // 监听轮播索引变化时懒加载缩略图
  useEffect(() => {
    if (mediaFiles.length > 0) {
      processVideoThumbnailsLazy(mediaFiles, currentMediaIndex);
    }
    // eslint-disable-next-line
  }, [currentMediaIndex, mediaFiles]);

  const handleMediaClick = (file) => {
    if (isMobile) {
      // 移动端：图片和视频都弹窗全屏预览
      setPreviewFile(file);
      // 延迟添加CSS类，确保组件状态更新完成
      setTimeout(() => {
        document.body.classList.add('fullscreen-preview-open');
        document.documentElement.classList.add('fullscreen-preview-open');
      }, 10);
    } else {
      // PC端：图片弹窗，视频跳转
      if (file.type === 'video') {
        const videoId = file.id || file.uniqueId;
        if (videoId) {
          navigate(`/${userCode}/video-player/${id}/${videoId}?from=player&recordingId=${recordingId}`);
        }
      } else {
        setPreviewFile(file);
      }
    }
  };

  // 关闭预览
  const closePreview = () => {
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
    
    if (videoPreviewRef.current) {
      videoPreviewRef.current.pause();
      videoPreviewRef.current.currentTime = 0;
      // 退出全屏（兼容各平台）
      if (videoPreviewRef.current._fullscreenCleanup) {
        videoPreviewRef.current._fullscreenCleanup();
        videoPreviewRef.current._fullscreenCleanup = null;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      if (videoPreviewRef.current.webkitExitFullscreen) {
        videoPreviewRef.current.webkitExitFullscreen();
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
    if (isMobile && previewFile && previewFile.type === 'video' && videoPreviewRef.current && !videoAutoFullscreenTried) {
      setVideoAutoFullscreenTried(true);
      const video = videoPreviewRef.current;
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
    if (isMobile && previewFile && previewFile.type === 'video' && videoPreviewRef.current) {
      const video = videoPreviewRef.current;
      
      // 检测iOS设备
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      try {
        if (isIOSDevice) {
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
      if (isIOSDevice) {
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
        if (isIOSDevice) {
          video.removeEventListener('webkitendfullscreen', handleFullscreenChange);
        } else {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        }
      };
    }
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
      <div className="background-decoration1">
        
      </div>

      {/* 顶部导航 */}
      <header className="player-header">
        <button onClick={() => navigate(`/${userCode}/${id}?fromPlayer=true`)} className="nav-back-btn">
          <span className="back-icon">←</span>
          <span>返回录音页面</span>
        </button>
        
        {/* 主题切换器和操作按钮 */}
          <ThemeSwitcher onThemeChange={handleThemeChange} />
          <button onClick={deleteRecording} className="delete-recording-btn">
            <span>🗑️</span>
            <span>删除</span>
          </button>
      </header>
      
      <div className="session-info">
        <span className="session-label">会话ID:{userCode ? `${userCode}/${id}` : id}</span>
      </div>

      {/* 主播放器区域 */}
      <main className="player-main">
        <div className="player-container">
          {/* 大象图标 - 右上角溢出一半 */}
          <img src={currentTheme.assets.elephantIcon} alt="背景" className="elephant-icon" />
          
          {/* 头像图标 - 上边缘居中溢出一半 */}
          <div className="avatar-icon">
            <ThemedIcon 
              name="music"
              width={60}
              height={60}
              colorType="primary"
              style={{ 
                opacity: 0.95,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
              }}
            />
          </div>
          


          {/* 轮播图区域 - 只有上传了照片或视频才显示 */}
          {mediaFiles.length > 0 && (
            <div className="media-carousel-section">
              {/* 右滑切换提示，仅移动端显示 */}
              {isMobile && mediaFiles.length > 1 && (
                <div className="swiper-swipe-tip">
                  <span className="swipe-icon"></span>
                  右滑切换
                </div>
              )}
              <Swiper
                key={mediaFiles.length}
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={10}
                slidesPerView={1}
                loop={mediaFiles.length > 1}
                autoplay={mediaFiles.length > 1 ? {
                  delay: 3000,
                  disableOnInteraction: false,
                } : false}
                pagination={mediaFiles.length > 1 ? { clickable: true } : false}
                navigation={mediaFiles.length > 1}
                onSlideChange={swiper => setCurrentMediaIndex(swiper.realIndex)}
                style={{
                  width: '100%',
                  height: isMobile ? '220px' : '360px',
                  borderRadius: '12px'
                }}
              >
                {mediaFiles.map((file, index) => (
                  <SwiperSlide key={file.id || index}>
                    <div
                      className="carousel-item"
                      onClick={() => handleMediaClick(file)}
                      style={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {file.type === 'image' ? (
                        <img
                          src={file.preview || file.url}
                          alt={file.name || `图片${index + 1}`}
                          className="carousel-media"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '12px'
                          }}
                          onError={e => {
                            console.warn(`图片加载失败: ${file.name}`, e);
                            e.target.src = '/asset/image-placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="carousel-video" style={{ width: '100%', height: '100%' }}>
                          {videoThumbnails[file.id] ? (
                            <img
                              src={videoThumbnails[file.id]}
                              alt={file.name || `视频${index + 1}`}
                              className="carousel-media video-thumbnail"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '12px'
                              }}
                              onError={e => {
                                console.warn(`视频缩略图加载失败: ${file.name}`, e);
                                e.target.src = '/asset/video.svg';
                              }}
                            />
                          ) : (
                            <video
                              src={file.preview || file.url}
                              poster={file.preview || '/asset/video.svg'}
                              className="carousel-media"
                              muted
                              preload="metadata"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '12px'
                              }}
                              onError={e => {
                                console.warn(`视频加载失败: ${file.name}`, e);
                              }}
                            />
                          )}
                          <div className="video-play-overlay" style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px'
                          }}>
                            ▶
                          </div>
                        </div>
                      )}
                      <div className="media-type-badge" style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: 'white'
                      }}>
                        {file.type === 'image' ? '图片' : '视频'}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

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
            {/* 音频切换按钮 - 只在有多个音频时显示 */}
            {/* {audioFiles.length > 1 && (
              <button 
                onClick={() => switchAudio(currentAudioIndex - 1)} 
                className="control-btn audio-nav-btn"
                disabled={currentAudioIndex <= 0}
                title="上一个音频"
              >
                <span style={{ fontSize: '20px' }}>⏮</span>
                <span className="btn-label">上一个</span>
              </button>
            )} */}
            
            <button 
              onClick={() => switchAudio(currentAudioIndex - 1)}
              disabled={currentAudioIndex <= 0}
              className="control-btn skip-btn"
              title="上一首"
            >
              <ThemedIcon 
                name="fastBack"
                width={50}
                height={50}
                colorType="primary"
                className="btn-icon"
              />
              <span className="btn-label">上一首</span>
            </button>
            
            <button 
              onClick={togglePlayPause} 
              className={`control-btn play-box ${isPlaying ? 'playing' : ''} ${!audioReady ? 'disabled' : ''}`}
              disabled={!audioReady}
              title={
                !audioReady ? '音频加载中...' : 
                isMobile && !userInteracted ? '需要用户交互才能播放' :
                isPlaying ? '暂停' : '播放'
              }
            >
              {!audioReady ? (
                <img 
                  src="/asset/loading.png"
                  alt="加载中" 
                  className="btn-icon"
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    opacity: 0.5
                  }}
                />
              ) : (
                <ThemedIcon 
                  name={isPlaying ? "stop" : "play"}
                  width={90}
                  height={90}
                  colorType="primary"
                  className="btn-icon"
                  style={{ 
                    transform: isPlaying ? 'translateY(-2px)' : 'translateY(+2px)',
                    opacity: (isMobile && !userInteracted) ? 0.5 : 1
                  }}
                />
              )}
            </button>
            
            <button 
              onClick={() => switchAudio(currentAudioIndex + 1)}  
              className="control-btn skip-btn"
              title="下一首"
            >
              <ThemedIcon 
                name="fast"
                width={50}
                height={50}
                colorType="primary"
                className="btn-icon"
              />
              <span className="btn-label">下一首</span>
            </button>
            
            {/* 音频切换按钮 - 只在有多个音频时显示 */}
            {/* {audioFiles.length > 1 && (
              <button 
                onClick={() => switchAudio(currentAudioIndex + 1)} 
                className="control-btn audio-nav-btn"
                disabled={currentAudioIndex >= audioFiles.length - 1}
                title="下一个音频"
              >
                <span style={{ fontSize: '20px' }}>⏭</span>
                <span className="btn-label">下一个</span>
              </button>
            )} */}
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
            
            {/* 音频列表控制 */}
            {audioFiles.length > 1 && (
              <div className="audio-list-control">
                <div className="audio-list-header">
                  <label className="control-label">音频列表</label>
                  <button 
                    onClick={() => setShowAudioModal(true)} 
                    className="audio-list-toggle"
                  >
                    <span>🎵</span>
                    <span>选择音频 ({audioFiles.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 评论区域 */}
      {recording && (
        <CommentSection 
          recordingId={recordingId}
          userCode={userCode}
          sessionId={id}
        />
      )}

      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={recording ? (recording.signedUrl || recording.cloudUrl || recording.url) : ''} // 直接设置src属性，确保移动端兼容性
        preload="auto"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
        playsInline={true} // 所有移动设备都启用内联播放
        webkit-playsinline="true" // iOS兼容
        controls={false}
        muted={false}
        autoPlay={false} // 禁用自动播放，遵循移动端政策
        onLoadedMetadata={() => console.log('音频URL:', recording?.signedUrl || recording?.cloudUrl || recording?.url)}
        onError={(e) => {
          console.error('音频元素错误:', e);
          console.error('当前src:', e.target.src);
          console.error('错误代码:', e.target.error?.code);
          console.error('错误信息:', e.target.error?.message);
          // 移动端错误处理
          if (isMobile) {
            console.error('移动端音频播放错误，可能的原因：');
            console.error('1. CORS跨域问题');
            console.error('2. 音频格式不支持');
            console.error('3. 网络连接问题');
            console.error('4. 用户交互权限问题');
          }
        }}
      >
        {/* 为移动端提供多种音频格式作为备选 */}
        {recording && (recording.signedUrl || recording.cloudUrl || recording.url) && (
          <>
            <source src={recording.signedUrl || recording.cloudUrl || recording.url} type="audio/mp4" />
            <source src={recording.signedUrl || recording.cloudUrl || recording.url} type="audio/mpeg" />
            <source src={recording.signedUrl || recording.cloudUrl || recording.url} type="audio/wav" />
            <source src={recording.signedUrl || recording.cloudUrl || recording.url} type="audio/webm" />
            <source src={recording.signedUrl || recording.cloudUrl || recording.url} type="audio/ogg" />
          </>
        )}
        您的浏览器不支持音频播放
      </audio>

      {/* 预览弹窗 - 支持图片和视频 */}
      {previewFile && (
        <div className={`preview-modal ${isMobile ? 'fullscreen' : ''} ${previewFile.type === 'video' ? 'video-preview' : 'image-preview'}`} onClick={closePreview}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>×</button>
            {previewFile.type === 'image' ? (
              <img 
                src={previewFile.preview || previewFile.url} 
                alt={previewFile.name} 
                className="upload-modal-preview-media" 
              />
            ) : (
              <video 
                ref={videoPreviewRef}
                src={previewFile.preview || previewFile.url}
                poster={previewFile.preview || '/asset/video.svg'}
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

      {/* 音频列表弹窗 */}
      {showAudioModal && (
        <div className="audio-modal-overlay" onClick={() => setShowAudioModal(false)}>
          <div className="audio-modal-content" onClick={e => e.stopPropagation()}>
            <div className="audio-modal-header">
              <h3>音频列表</h3>
              <button 
                className="audio-modal-close"
                onClick={() => setShowAudioModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="audio-modal-body">
              <div className="audio-modal-list">
                {audioFiles.map((audio, index) => (
                  <div
                    key={audio.id}
                    className={`audio-modal-item ${index === currentAudioIndex ? 'active' : ''}`}
                    onClick={() => {
                      switchAudio(index);
                      setShowAudioModal(false);
                    }}
                  >
                    <div className="audio-modal-icon">
                      {index === currentAudioIndex ? '🎵' : '🎶'}
                    </div>
                    <div className="audio-modal-info">
                      <div className="audio-modal-name">
                        {audio.fileName}
                      </div>
                      <div className="audio-modal-meta">
                        <span>{audio.timestamp}</span>
                        {audio.size > 0 && (
                          <span>{formatFileSize(audio.size)}</span>
                        )}
                      </div>
                    </div>
                    <div className="audio-modal-status">
                      {index === currentAudioIndex ? '播放中' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="audio-modal-footer">
              <button 
                className="audio-modal-cancel"
                onClick={() => setShowAudioModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移动端用户交互提示 */}
      {isMobile && !userInteracted && (
        <div className="mobile-interaction-prompt" style={{
          position: 'fixed',
          top: -1000,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>
            <h3>音频播放需要用户交互</h3>
            <p>移动设备需要用户操作才能播放音频</p>
            <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '16px' }}>请点击下方按钮启用音频播放功能</p>
            <button 
              onClick={() => {
                setUserInteracted(true);
                // 立即尝试初始化音频
                const audio = audioRef.current;
                if (audio && recording) {
                  const audioUrl = recording.signedUrl || recording.cloudUrl || recording.url;
                  if (audioUrl && !audio.src) {
                    audio.src = audioUrl;
                    audio.load();
                  }
                }
              }}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                marginTop: '100px',
                minWidth: '120px',
                cursor: 'pointer'
              }}
            >
              启用音频播放
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default PlayerPage; 