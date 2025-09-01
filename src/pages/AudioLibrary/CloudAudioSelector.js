// src/components/CloudAudioSelector.js
import React, { useState, useEffect } from 'react';
import './CloudAudioSelector.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

const CloudAudioSelector = ({ userCode, sessionId, recordings = [], boundRecordings = [], onAudioSelect, onClose }) => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioSource, setAudioSource] = useState('local'); // 'local' 或 'cloud'

  useEffect(() => {
    if (audioSource === 'local') {
      loadLocalAudioFiles();
    } else {
      loadCloudAudioFiles();
    }
  }, [userCode, sessionId, recordings, boundRecordings, audioSource]);

  const loadLocalAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // 合并当前录音和已绑定录音
      const allRecordings = [...recordings, ...boundRecordings];
      
      // 筛选出音频文件
      const audioRecordings = allRecordings.filter(recording => {
        // 检查是否为音频文件
        const isAudio = recording.fileType?.startsWith('audio/') || 
                       !recording.isVideo || 
                       recording.audioOnly ||
                       /\.(mp3|wav|m4a|ogg|aac|flac|wma)$/i.test(recording.fileName || '');
        return isAudio && (recording.url || recording.cloudUrl);
      });

      // 转换为统一格式
      const processedAudioFiles = audioRecordings.map((recording, index) => ({
        id: `local_${recording.id}`,
        name: recording.fileName || `录音_${index + 1}`,
        objectKey: recording.cloudUrl || recording.url,
        ossUrl: recording.cloudUrl || recording.url,
        preview: recording.url || recording.cloudUrl,
        size: recording.audioBlob?.size || 0,
        duration: recording.duration || 0,
        uploadTime: recording.timestamp || new Date().toLocaleString('zh-CN'),
        contentType: recording.fileType || 'audio/mpeg',
        source: 'local',
        isUploaded: !!recording.cloudUrl,
        recordingData: recording,
        sessionId: recording.sessionId || sessionId
      }));

      // 按时间倒序排序
      const sortedFiles = processedAudioFiles.sort((a, b) => {
        return new Date(b.uploadTime) - new Date(a.uploadTime);
      });

      setAudioFiles(sortedFiles);
    } catch (error) {
      console.error('加载本地音频文件失败:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCloudAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // 调用API获取云端文件列表
      const prefix = `recordings/${userCode}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );

      if (!response.ok) {
        throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];

      // 过滤音频文件
      const audioFiles = files.filter(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        
        // 检查是否为音频文件
        const isAudio = contentType.startsWith('audio/') || 
                       /\.(mp3|wav|m4a|aac|ogg|webm|caf|amr|3gp)$/i.test(fileName);
        
        return isAudio;
      });

      // 转换为统一格式
      const processedFiles = audioFiles.map(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const timestamp = file.last_modified || file.lastModified || file.modified || new Date().toISOString();
        
        // 生成OSS直链
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
        const ossUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';

        // 解析会话ID
        const pathParts = objectKey ? objectKey.split('/') : [];
        const sessionId = pathParts.length >= 3 ? pathParts[2] : 'unknown';

        return {
          id: `audio_${Date.parse(timestamp)}_${Math.random().toString(36).substr(2, 8)}`,
          name: fileName,
          ossUrl,
          objectKey,
          sessionId,
          uploadTime: timestamp,
          size: file.size || 0,
          isCloudFile: true
        };
      });

      // 按上传时间倒序排序
      const sortedFiles = processedFiles.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setAudioFiles(sortedFiles);
    } catch (error) {
      console.error('加载云端音频文件失败:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 过滤音频文件
  const filteredAudioFiles = audioFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAudioSelect = (audio) => {
    setSelectedAudio(audio);
  };

  const handleConfirmSelect = () => {
    if (selectedAudio && onAudioSelect) {
      onAudioSelect({
        ...selectedAudio,
        preview: selectedAudio.ossUrl
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="cloud-audio-selector-overlay" onClick={onClose}>
      <div className="cloud-audio-selector" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <h3>🎵 选择参考音频</h3>
          <p>{audioSource === 'local' ? '从本地录音中选择音频作为AI生成的参考' : '从云端音频库中选择音频作为AI生成的参考'}</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="selector-content">
          {/* 音频源选择 */}
          <div className="source-selector">
            <button
              className={`source-btn ${audioSource === 'local' ? 'active' : ''}`}
              onClick={() => setAudioSource('local')}
            >
              📱 本地录音
            </button>
            <button
              className={`source-btn ${audioSource === 'cloud' ? 'active' : ''}`}
              onClick={() => setAudioSource('cloud')}
            >
              ☁️ 云端音频
            </button>
          </div>

          {/* 搜索栏 */}
          <div className="search-section">
            <input
              type="text"
              placeholder={audioSource === 'local' ? '搜索录音文件名...' : '搜索音频文件名或会话ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>正在加载云端音频文件...</p>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={loadCloudAudioFiles} className="retry-btn">
                重试
              </button>
            </div>
          )}

          {/* 音频文件列表 */}
          {!loading && !error && (
            <div className="audio-files-list">
              {filteredAudioFiles.length === 0 ? (
                <div className="empty-state">
                  <p>🎵 没有找到音频文件</p>
                  <span>请确认您的云端音频库中有音频文件</span>
                </div>
              ) : (
                <div className="audio-grid">
                  {filteredAudioFiles.map(audio => (
                    <div 
                      key={audio.id}
                      className={`audio-item ${selectedAudio?.id === audio.id ? 'selected' : ''}`}
                      onClick={() => handleAudioSelect(audio)}
                    >
                      {/* 来源标识 */}
                      <div className={`source-badge ${audio.source || 'cloud'}`}>
                        {audio.source === 'local' ? '本地' : '云端'}
                      </div>

                      {/* 时长标识 */}
                      {audio.duration > 0 && (
                        <div className="duration-badge">
                          {formatDuration(audio.duration)}
                        </div>
                      )}

                      <div className="audio-info">
                        <div className="audio-name">{audio.name}</div>
                        <div className="audio-meta">
                          <span className="session-id">会话: {audio.sessionId}</span>
                          <span className="file-size">{formatFileSize(audio.size)}</span>
                          {audio.isUploaded && (
                            <span className="upload-status">✓ 已上传</span>
                          )}
                        </div>
                        <div className="upload-time">
                          {formatDate(audio.uploadTime)}
                        </div>
                      </div>
                      
                      <div className="audio-controls">
                        <audio 
                          controls 
                          src={audio.ossUrl || audio.preview}
                          preload="none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          您的浏览器不支持音频播放
                        </audio>
                      </div>

                      {selectedAudio?.id === audio.id && (
                        <div className="selected-indicator">
                          ✓ 已选择
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="selector-footer">
          <div className="selected-info">
            {selectedAudio ? (
              <span>已选择: {selectedAudio.name}</span>
            ) : (
              <span>请选择一个音频文件</span>
            )}
          </div>
          <div className="footer-actions">
            <button 
              onClick={onClose}
              className="cancel-btn"
            >
              取消
            </button>
            <button 
              onClick={handleConfirmSelect}
              disabled={!selectedAudio}
              className="confirm-btn"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudAudioSelector;