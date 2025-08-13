// src/components/AIMusicGenerator.js
import React, { useState } from 'react';
import { useMusicGeneration } from '../hooks/useMusicGeneration';
import CloudAudioSelector from './CloudAudioSelector';
import sunoApi from '../services/sunoApi';
import './AIMusicGenerator.css';

const AIMusicGenerator = ({ userCode, sessionId, recordings = [], boundRecordings = [], onMusicGenerated }) => {
  const [formData, setFormData] = useState({
    demand: '',
    prompt: '',
    lyrics: '',
    generationType: 'text', // 'text', 'custom', 或 'reference'
    instrumental: false,
    model: 'V3_5'
  });
  const [selectedReferenceAudio, setSelectedReferenceAudio] = useState(null);
  const [showCloudSelector, setShowCloudSelector] = useState(false);
  const [shouldUploadToCloud, setShouldUploadToCloud] = useState(true);

  // 新增上传进度相关状态
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const {
    isGenerating,
    generationProgress,
    currentSong,
    error,
    generateMusic,
    generateCustomMusic,
    generateMusicFromReference,
    saveMusicLocally,
    clearError,
    setError,
    setCurrentSong,
    setGenerationProgress
  } = useMusicGeneration();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.demand || !formData.prompt) {
      alert('请填写音乐需求和创作提示');
      return;
    }

    if (formData.generationType === 'reference' && !selectedReferenceAudio) {
      alert('请选择参考音频');
      return;
    }

    try {
      // 首先测试API连接
      console.log('测试API连接...');
      const testResult = await sunoApi.testConnection();
      if (!testResult.success) {
        throw new Error(`API连接失败: ${testResult.error}`);
      }
      console.log('API连接正常');

      let result;
      
      const options = {
        model: formData.model,
        instrumental: formData.instrumental
      };
      
      if (formData.generationType === 'text') {
        result = await generateMusic(formData.demand, formData.prompt, options);
      } else if (formData.generationType === 'custom') {
        // 自定义模式，支持歌词
        result = await generateCustomMusic(
          formData.demand, 
          formData.prompt, 
          formData.lyrics,
          options
        );
      } else if (formData.generationType === 'reference') {
        // 参考音频模式
        const referenceUrl = selectedReferenceAudio.ossUrl || selectedReferenceAudio.preview;
        result = await generateMusicFromReference(
          referenceUrl,
          formData.demand,
          formData.prompt,
          options
        );
      }

      if (result && currentSong) {
        // 保存到本地
        const localMusic = await saveMusicLocally(currentSong, shouldUploadToCloud, userCode, sessionId);
        
        // 通知父组件
        if (onMusicGenerated) {
          onMusicGenerated(localMusic);
        }

        const uploadText = shouldUploadToCloud ? '并已上传到云端' : '';
        alert(`音乐生成成功并已保存到本地${uploadText}！`);
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert(`生成失败: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerationTypeChange = (type) => {
    setFormData(prev => ({ ...prev, generationType: type }));
    
    // 切换到非参考模式时，清除选择的参考音频
    if (type !== 'reference') {
      setSelectedReferenceAudio(null);
    }
  };

  const handleReferenceAudioSelect = (audio) => {
    setSelectedReferenceAudio(audio);
    setShowCloudSelector(false);
  };

  const handleTestConnection = async () => {
    try {
      console.log('测试API连接...');
      const result = await sunoApi.testConnection();
      if (result.success) {
        alert('API连接正常！');
        console.log('API连接测试结果:', result);
      } else {
        alert(`API连接失败: ${result.error}`);
        console.error('API连接测试失败:', result);
      }
    } catch (error) {
      alert(`测试连接时出错: ${error.message}`);
      console.error('测试连接错误:', error);
    }
  };



  return (
    <div className="ai-music-generator">
      <div className="ai-generator-header">
        <h3>🎵 AI音乐生成器</h3>
        <p>使用AI技术生成独特的音乐作品</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ai-generator-form">
        {/* 生成类型选择 */}
        <div className="generation-type-selector">
          <label>生成方式：</label>
          <div className="type-buttons">
            <button
              type="button"
              className={`type-btn ${formData.generationType === 'text' ? 'active' : ''}`}
              onClick={() => handleGenerationTypeChange('text')}
            >
              📝 简单生成
            </button>
            <button
              type="button"
              className={`type-btn ${formData.generationType === 'custom' ? 'active' : ''}`}
              onClick={() => handleGenerationTypeChange('custom')}
            >
              ✏️ 自定义歌词
            </button>
            <button
              type="button"
              className={`type-btn ${formData.generationType === 'reference' ? 'active' : ''}`}
              onClick={() => handleGenerationTypeChange('reference')}
            >
              🎵 参考音频
            </button>
          </div>
        </div>

        {/* 参考音频选择（仅在reference模式下显示） */}
        {formData.generationType === 'reference' && (
          <div className="reference-audio-section">
            <label>参考音频：</label>
            {selectedReferenceAudio ? (
              <div className="selected-reference">
                <div className="reference-info">
                  <span className="reference-name">{selectedReferenceAudio.name}</span>
                  <span className="reference-source">
                    {selectedReferenceAudio.source === 'local' ? '📱 本地录音' : '☁️ 云端音频'}
                  </span>
                  <audio controls src={selectedReferenceAudio.ossUrl || selectedReferenceAudio.preview} />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReferenceAudio(null)}
                  className="remove-reference"
                >
                  移除
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCloudSelector(true)}
                className="select-reference-btn"
              >
                📁 选择参考音频
              </button>
            )}
          </div>
        )}

        {/* 自定义歌词输入（仅在custom模式下显示） */}
        {formData.generationType === 'custom' && (
          <div className="lyrics-section">
            <label htmlFor="lyrics">自定义歌词：</label>
            <textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => setFormData(prev => ({ ...prev, lyrics: e.target.value }))}
              placeholder="输入您的歌词内容...（可选）"
              className="lyrics-input"
              rows="4"
            />
            <div className="lyrics-help">
              💡 提示：留空将由AI自动生成歌词
            </div>
          </div>
        )}

        {/* 音乐需求 */}
        <div className="form-group">
          <label htmlFor="ai-demand">音乐需求：</label>
          <textarea
            id="ai-demand"
            name="demand"
            value={formData.demand}
            onChange={handleInputChange}
            placeholder="描述您想要的音乐风格、情感、节奏等...&#10;例如：轻快的流行音乐，带有温暖的情感"
            rows="3"
            required
          />
        </div>

        {/* 创作提示 */}
        <div className="form-group">
          <label htmlFor="ai-prompt">创作提示：</label>
          <textarea
            id="ai-prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            placeholder="提供更详细的创作指导...&#10;例如：适合在咖啡厅播放，包含钢琴和吉他，时长约3分钟"
            rows="4"
            required
          />
        </div>

        {/* 高级选项 */}
        {/* <div className="advanced-options">
          <h4>🔧 高级选项</h4> */}
          
          {/* 模型选择 */}
          {/* <div className="form-group">
            <label htmlFor="model">音乐模型：</label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              className="model-select"
            >
              <option value="V3_5">V3.5 (推荐)</option>
              <option value="V3">V3</option>
              <option value="V2">V2</option>
            </select>
          </div> */}

          {/* 器乐选项 */}
          {/* <div className="option-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.instrumental}
                onChange={(e) => setFormData(prev => ({ ...prev, instrumental: e.target.checked }))}
              />
              <span className="checkmark"></span>
              纯器乐（无人声）
            </label>
          </div> */}

          {/* 云端上传选项 */}
          {/* <div className="option-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={shouldUploadToCloud}
                onChange={(e) => setShouldUploadToCloud(e.target.checked)}
              />
              <span className="checkmark"></span>
              生成后自动上传到云端
            </label>
          </div> */}
        {/* </div> */}

        <div className="button-group">
          <button 
            type="submit" 
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner"></span>
                生成中... {generationProgress}%
              </>
            ) : (
              <>
                🎵 开始生成音乐
              </>
            )}
          </button>
          
          {/* <button 
            type="button"
            onClick={async () => {
              try {
                console.log('测试API连接...');
                const result = await sunoApi.testConnection();
                if (result.success) {
                  alert('✅ API连接正常！');
                } else {
                  alert(`❌ API连接失败: ${result.error}`);
                }
              } catch (error) {
                alert(`❌ 测试失败: ${error.message}`);
              }
            }}
            className="test-btn"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              marginLeft: '12px'
            }}
          >
            🔧 测试连接
          </button> */}
        </div>
      </form>

      {/* 生成进度 */}
      {/* {isGenerating && (
        <div className="generation-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="progress-text">
            {generationProgress < 30 && '🧠 AI正在分析您的需求...'}
            {generationProgress >= 30 && generationProgress < 60 && '🎵 正在生成音乐...'}
            {generationProgress >= 60 && generationProgress < 100 && '🎶 正在处理音频...'}
            {generationProgress === 100 && '✅ 生成完成！'}
          </p>
        </div>
      )} */}

      {/* 生成结果 */}
      {currentSong && !isGenerating && (
        <div className="generated-music">
          <h4>🎉 生成成功！</h4>
          <div className="music-info">
            <label htmlFor="ai-music-title" style={{ display: 'block', marginBottom: '8px' }}>
              <strong>标题:</strong>
            </label>
            <input
              id="ai-music-title"
              type="text"
              value={currentSong.title || ''}
              onChange={(e) => setCurrentSong(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入音乐标题"
              className="title-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {/* <p><strong>时长:</strong> {currentSong.duration}秒</p> */}
          </div>
          <audio controls src={currentSong.audio_url} className="music-player">
            您的浏览器不支持音频播放
          </audio>
          <div className="music-actions">
            <button
              onClick={() => {
                // 清空当前音乐并重新生成
                setCurrentSong(null);
                setGenerationProgress(0);
                setError(null);
                // 重新提交表单
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
              className="save-btn"
              style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)' }}
            >
              重新生成
            </button>
            <button
              onClick={async () => {
                try {
                  // 开始上传
                  setIsUploading(true);
                  setUploadProgress(0);
                  setUploadStatus('准备上传...');
                  
                  // 创建进度回调函数
                  const onProgress = (progress, status) => {
                    setUploadProgress(progress);
                    setUploadStatus(status);
                  };
                  
                  // 保存并上传到云端
                  await saveMusicLocally(currentSong, true, userCode, sessionId, onProgress);
                  
                  // 添加到已绑定录音列表
                  if (onMusicGenerated) {
                    const newRecording = {
                      id: Date.now(),
                      url: currentSong.audio_url,
                      audioBlob: null,
                      duration: currentSong.duration,
                      timestamp: new Date().toLocaleString('zh-CN'),
                      sessionId: sessionId || 'default',
                      cloudUrl: currentSong.audio_url,
                      uploaded: true,
                      fileName: currentSong.title,
                      isAIGenerated: true,
                      originalSongId: currentSong.id,
                      isBound: true,
                      userCode: userCode,
                      sessionId: sessionId
                    };
                    onMusicGenerated(newRecording);
                  }
                  
                  // 延迟重置状态
                  setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    setUploadStatus('');
                  }, 1500);
                  
                  alert('✅ 音乐已保存并上传到云端！');
                } catch (error) {
                  setIsUploading(false);
                  setUploadProgress(0);
                  setUploadStatus('');
                  alert(`❌ 上传失败: ${error.message}`);
                }
              }}
              className="save-btn upload-btn"
              style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)' }}
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '保存并上传到云端'}
            </button>
          </div>
        </div>
      )}

      {/* 音频选择器 */}
      {showCloudSelector && (
        <CloudAudioSelector
          userCode={userCode}
          sessionId={sessionId}
          recordings={recordings}
          boundRecordings={boundRecordings}
          onAudioSelect={handleReferenceAudioSelect}
          onClose={() => setShowCloudSelector(false)}
        />
      )}
    </div>
  );
};

export default AIMusicGenerator;