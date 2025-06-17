import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AudioLibrary.css';
import { getUserCode, validateUserCode } from './utils/userCode';
import SvgIcon from './components/SvgIcons';
import ModernSearchBox from './components/ModernSearchBox';

// API配置


const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';


const AudioLibrary = () => {
  const navigate = useNavigate();
  const { userid } = useParams(); // 从URL获取用户ID
  const [audioSessions, setAudioSessions] = useState([]);
  const [cloudFiles, setCloudFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, count
  const [apiError, setApiError] = useState(null);
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

  // 加载云端音频文件
  useEffect(() => {
    if (userCode) {
      loadCloudAudioFiles();
    }
  }, [userCode]);

  const loadCloudAudioFiles = async () => {
    try {
      setLoading(true);
      setApiError(null);

      // 调用API获取云端文件列表，使用用户代码作为路径前缀
      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );

      if (!response.ok) {
        throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('API返回结果:', result); // 调试信息
      console.log('结果类型:', typeof result);
      console.log('结果键名:', Object.keys(result));
      
      // 检查不同的成功标识
      const isSuccess = result.success === true || result.status === 'success' || response.ok;
      
      if (isSuccess) {
        // 尝试不同的字段名来获取文件列表
        const files = result.files || result.data || result.objects || result.items || result.results || [];
        console.log('文件列表:', files); // 调试信息
        console.log('文件列表类型:', typeof files);
        console.log('文件列表长度:', Array.isArray(files) ? files.length : '不是数组');
        
        setCloudFiles(Array.isArray(files) ? files : []);
        processCloudFiles(Array.isArray(files) ? files : []);
      } else {
        throw new Error(result.message || result.error || result.detail || '获取文件列表失败');
      }
    } catch (error) {
      console.error('加载云端音频文件失败:', error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理云端文件，按会话分组
  const processCloudFiles = (files) => {
    const sessionsMap = new Map();
    
    // 安全检查文件数组
    if (!Array.isArray(files)) {
      console.warn('文件列表不是数组:', files);
      setAudioSessions([]);
      return;
    }
    
    if (files.length === 0) {
      console.log('没有找到文件');
      setAudioSessions([]);
      return;
    }

    files.forEach((file, index) => {
      console.log(`处理文件 ${index}:`, file); // 调试信息
      
      // 安全检查文件对象
      if (!file || typeof file !== 'object') {
        console.warn('无效的文件对象:', file);
        return;
      }
      
      // 检查不同可能的字段名
      const objectKey = file.object_key || file.objectKey || file.key || file.name;
      
      if (!objectKey) {
        console.warn('文件缺少object_key字段:', file);
        return;
      }
      
      // 解析文件路径: recordings/{userCode}/{sessionId}/{filename}
      const pathParts = objectKey.split('/');
      if (pathParts.length >= 4 && pathParts[0] === 'recordings' && pathParts[1] === userCode) {
        const sessionId = pathParts[2];
        const fileName = pathParts[3];
        
        // 从文件名提取录音信息
        // 假设文件名格式: recording_{id}_{timestamp}.{extension}
        // 或者: {timestamp}_{uniqueId}.{extension}
        const recordingInfo = parseFileName(fileName, file);
        
        if (!sessionsMap.has(sessionId)) {
          const fileModified = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
          sessionsMap.set(sessionId, {
            sessionId,
            recordings: [],
            count: 0,
            totalDuration: 0,
            createdAt: fileModified,
            updatedAt: fileModified
          });
        }

        const session = sessionsMap.get(sessionId);
        session.recordings.push({
          id: recordingInfo.id,
          fileName: fileName,
          objectKey: objectKey,
          fileUrl: file.file_url || file.fileUrl || file.url,
          size: file.size || 0,
          lastModified: file.last_modified || file.lastModified || file.modified || new Date().toISOString(),
          contentType: file.content_type || file.contentType || 'audio/webm',
          etag: file.etag || file.hash || '',
          duration: recordingInfo.duration || 0, // 如果无法从文件名获取，默认0
          timestamp: formatDateFromString(file.last_modified || file.lastModified || file.modified || new Date().toISOString()),
          uploaded: true,
          cloudUrl: file.file_url || file.fileUrl || file.url
        });

        session.count = session.recordings.length;
        
        const fileModified = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
        
        // 更新时间为最新文件的时间
        if (new Date(fileModified) > new Date(session.updatedAt)) {
          session.updatedAt = fileModified;
        }
        // 创建时间为最早文件的时间
        if (new Date(fileModified) < new Date(session.createdAt)) {
          session.createdAt = fileModified;
        }
      }
    });

    // 排序每个会话的录音（按时间倒序）
    const sessions = Array.from(sessionsMap.values()).map(session => {
      session.recordings.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      session.latestRecording = session.recordings[0];
      session.oldestRecording = session.recordings[session.recordings.length - 1];
      return session;
    });

    setAudioSessions(sessions);
  };

  // 解析文件名获取录音信息
  const parseFileName = (fileName, fileInfo) => {
    // 移除扩展名
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // 尝试从文件名提取ID
    let id = Date.now(); // 默认使用当前时间戳
    
    // 如果文件名包含recording_前缀
    if (nameWithoutExt.includes('recording_')) {
      const parts = nameWithoutExt.split('_');
      if (parts.length >= 2) {
        id = parts[1] || Date.now();
      }
    } else {
      // 使用文件的etag或其他唯一标识
      id = fileInfo.etag.slice(-8) || Date.now();
    }

    return {
      id: id,
      duration: 0 // 目前无法从文件信息获取音频时长，需要播放器加载后获取
    };
  };

  // 格式化日期字符串
  const formatDateFromString = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
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
    if (isNaN(seconds) || seconds === 0) return '未知';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化总时长
  const formatTotalDuration = (totalSeconds) => {
    if (totalSeconds === 0) return '未知时长';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 过滤和排序
  const getFilteredAndSortedSessions = () => {
    let filtered = audioSessions;
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 排序
    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'count':
        return filtered.sort((a, b) => b.count - a.count);
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  };

  // 创建新录音会话
  const createNewSession = () => {
    if (userCode) {
      const randomId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userCode}/${randomId}`);
    }
  };

  // 进入会话
  const enterSession = (session) => {
    if (!userCode) return;
    
    // 如果有录音，跳转到播放页面；否则跳转到录音页面
    if (session.recordings.length > 0) {
      const latestRecording = session.recordings[0];
      navigate(`/${userCode}/${session.sessionId}/play/${latestRecording.id}`);
    } else {
      navigate(`/${userCode}/${session.sessionId}`);
    }
  };

  // 删除整个会话
  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`确定要删除会话 ${userCode}/${sessionId} 及其所有录音吗？这将删除云端的所有文件！`)) {
      return;
    }

    try {
      const session = audioSessions.find(s => s.sessionId === sessionId);
      if (!session) return;

      // 删除会话中的所有录音文件
      const deletePromises = session.recordings.map(async (recording) => {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(recording.objectKey)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            console.warn(`删除文件失败: ${recording.objectKey}`);
          }
        } catch (error) {
          console.error(`删除文件时出错: ${recording.objectKey}`, error);
        }
      });

      await Promise.all(deletePromises);
      
      // 重新加载文件列表
      await loadCloudAudioFiles();
      
    } catch (error) {
      console.error('删除会话失败:', error);
      alert(`删除会话失败: ${error.message}`);
    }
  };

  // 刷新文件列表
  const refreshFiles = () => {
    loadCloudAudioFiles();
  };

  if (loading) {
    return (
      <div className="audio-library loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载云端音频库...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="audio-library error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>连接云端失败</h3>
          <p>{apiError}</p>
          <div className="error-actions">
            <button onClick={refreshFiles} className="retry-btn">
            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/refresh.svg" className="icon-img" width={32} height={32} color='#ffffff'/>重试
            </button>
            <button onClick={() => navigate('/')} className="back-btn">
              ← 返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-library">
      {/* 背景装饰 */}
      <div className="library-background">
        <div className="bg-circle circle1"></div>
        <div className="bg-circle circle2"></div>
        <div className="bg-circle circle3"></div>
      </div>

      {/* 顶部导航 */}
      <header className="library-header">
        <button onClick={() => navigate(`/${userCode}`)} className="back-btn">
          <span className="back-icon">←</span>
          <span>返回主页</span>
        </button>
        
        <div className="header-content">
          <h1 className="library-title">
            <span className="title-icon">
            <SvgIcon name="cloud" className="icon-img" width={32} height={32} color="#3bb6a6" />
            </span>
            云端音频库
            
          </h1>
          <p className="library-subtitle">管理您在云端的所有录音会话</p>
        </div>
        
        <div className="header-actions">
          <button onClick={refreshFiles} className="refresh-btn" title="刷新">
            <span className="btn-icon">
              <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/sx.svg" className="icon-img" width={32} height={32}/>
            </span>
            <span>刷新</span>
          </button>
          <button onClick={createNewSession} className="new-session-btn">
            <span className="btn-icon">
            <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/add.svg" className="btn-icon" width={30} height={30}/>
            </span>
            <span>新建录音</span>
          </button>
        </div>
      </header>

      {/* 控制栏 */}
      <div className="library-controls">
        <ModernSearchBox
          placeholder="搜索会话ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="medium"
          width="400px"
          theme="gradient"
        />
        
        <div className="sort-container">
          <label className="sort-label">排序:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">最新更新</option>
            <option value="oldest">最早创建</option>
            <option value="count">录音数量</option>
          </select>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="library-stats">
        <div className="stat-item">
          <span className="stat-icon">
          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/files.svg" className="stat-icon" width={50} height={50}/>
          </span>
          <div className="stat-content">
            <span className="stat-number">{audioSessions.length}</span>
            <span className="stat-label">会话</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">
          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/huatong.svg" className="stat-icon" width={50} height={50}/>
          </span>
          <div className="stat-content">
            <span className="stat-number">
              {audioSessions.reduce((total, session) => total + session.count, 0)}
            </span>
            <span className="stat-label">录音</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">
          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/save.svg" className="stat-icon" width={50} height={50}/>
          </span>
          <div className="stat-content">
            <span className="stat-number">
              {formatFileSize(
                cloudFiles.reduce((total, file) => total + (file.size || 0), 0)
              )}
            </span>
            <span className="stat-label">总大小</span>
          </div>
        </div>
        <div className="stat-item cloud-indicator">
          <span className="stat-icon">
          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/scyd.svg" className="stat-icon" width={50} height={50}/>
          </span>
          <div className="stat-content">
            <span className="stat-number">云端</span>
            <span className="stat-label">存储</span>
          </div>
        </div>
      </div>

      {/* 会话列表 */}
      <main className="sessions-container">
        {getFilteredAndSortedSessions().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">☁️</div>
            <h3>云端暂无录音会话</h3>
            <p>点击"新建录音"开始您的第一次录音并自动上传到云端</p>
            <button onClick={createNewSession} className="create-first-btn">
              🎤 开始录音
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {getFilteredAndSortedSessions().map((session) => (
              <div
                key={session.sessionId}
                className="session-card cloud-session"
                onClick={() => enterSession(session)}
              >
                <div className="session-header">
                  <div className="session-info">
                    <h3 className="session-id">
                      <span className="id-icon">🆔</span>
                      {userCode}/{session.sessionId}
                      <span className="cloud-badge" title="云端存储">
                      <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/scyd.svg" className="cloud-badge" width={20} height={20}/>
                      </span>
                    </h3>
                    <div className="session-meta">
                      <span className="session-count">
                      <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/huatong.svg" className="session-count" width={15} height={15}/> {session.count} 个录音
                      </span>
                      <span className="session-size">
                      <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/save.svg" className="session-count" width={15} height={15}/> {formatFileSize(
                          session.recordings.reduce((total, r) => total + (r.size || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => deleteSession(session.sessionId, e)}
                    className="delete-session-btn"
                    title="删除会话及云端文件"
                  >
                    <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/delete.svg" className="delete-session-btn" width={50} height={50}/>
                  </button>
                </div>

                <div className="session-content">
                  <div className="latest-recording">
                    <h4 className="latest-title">最新录音</h4>
                    <div className="recording-preview">
                      <span className="recording-name">
                        {session.latestRecording.fileName}
                      </span>
                      <span className="recording-size">
                        {formatFileSize(session.latestRecording.size)}
                      </span>
                    </div>
                    <div className="recording-date">
                      {session.latestRecording.timestamp}
                    </div>
                  </div>

                  <div className="session-actions">
                    <div className="action-icon">
                    <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/bf.svg" className="action-icon" width={50} height={50}/>
                      {session.recordings.length > 0 ? '' : ''}
                    </div>
                    <span className="action-text">
                      {session.recordings.length > 0 ? '播放' : '录音'}
                    </span>
                  </div>
                </div>

                <div className="session-footer">
                  <span className="created-date">
                    创建: {formatDateFromString(session.createdAt)}
                  </span>
                  <span className="updated-date">
                    更新: {formatDateFromString(session.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* 移动端底部大按钮
      <button className="add-device-btn" onClick={createNewSession} style={{display: 'block'}}>
        新建录音
      </button> */}
    </div>
  );
};

export default AudioLibrary; 