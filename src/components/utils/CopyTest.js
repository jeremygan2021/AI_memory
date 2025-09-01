import React, { useState } from 'react';

const CopyTest = () => {
  const [testText, setTestText] = useState('http://localhost:3000/A1B2/video-player/catkfp/vid_rfuwsw_1754509079000_8c0b0fd3');
  const [copyStatus, setCopyStatus] = useState('');
  
  // 从视频ID中提取session信息的辅助函数（复制自UploadMediaPage.js）
  const extractSessionFromVideoId = (videoId) => {
    if (videoId && videoId.startsWith('vid_')) {
      const idParts = videoId.split('_');
      if (idParts.length >= 3) {
        // 视频ID格式: vid_sessionId_timestamp_...
        const extractedSessionId = idParts[1];
        if (extractedSessionId && (extractedSessionId.length === 6 || extractedSessionId.length === 8)) {
          return extractedSessionId;
        }
      }
    }
    return 'default'; // 默认返回
  };
  
  // 测试视频ID解析
  const testVideoIdParsing = () => {
    const testVideoIds = [
      'vid_rfuwsw_1754509079000_8c0b0fd3',
      'vid_123456_1754509079000_abcd_efgh1234',
      'vid_12345678_1754509079000_abcd_efgh1234',
      'invalid_id',
      'vid_invalid_1754509079000_abcd_efgh1234'
    ];
    
    console.log('=== 视频ID解析测试 ===');
    testVideoIds.forEach(videoId => {
      const sessionId = extractSessionFromVideoId(videoId);
      console.log(`视频ID: ${videoId} -> SessionID: ${sessionId}`);
    });
    
    setCopyStatus('视频ID解析测试完成，请查看控制台');
  };

  // 现代Clipboard API方法
  const copyWithClipboardAPI = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.log('Clipboard API失败:', err);
      return false;
    }
  };

  // 降级复制方法
  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    try {
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
    } catch (err) {
      console.log('选择文本失败:', err);
    }
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.log('execCommand复制失败:', err);
    }
    
    document.body.removeChild(textArea);
    return success;
  };

  // 复制文本
  const copyText = async () => {
    setCopyStatus('复制中...');
    
    // 优先使用现代Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const success = await copyWithClipboardAPI(testText);
      if (success) {
        setCopyStatus('✅ 复制成功 (Clipboard API)');
        return;
      }
    }
    
    // 降级方法
    const success = fallbackCopy(testText);
    if (success) {
      setCopyStatus('✅ 复制成功 (降级方法)');
    } else {
      setCopyStatus('❌ 复制失败，请手动复制');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>复制功能测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          测试文本:
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{ width: '100%', marginTop: '5px', padding: '8px' }}
          />
        </label>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={copyText}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          复制到剪贴板
        </button>
        
        <button 
          onClick={testVideoIdParsing}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          测试视频ID解析
        </button>
      </div>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        minHeight: '20px'
      }}>
        {copyStatus}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>测试说明:</h3>
        <ul>
          <li>点击"复制到剪贴板"按钮测试自动复制功能</li>
          <li>点击"测试视频ID解析"按钮测试视频ID解析逻辑</li>
          <li>支持现代浏览器的Clipboard API</li>
          <li>支持旧浏览器的execCommand降级方法</li>
          <li>可以在不同设备上测试（桌面、移动端）</li>
          <li>视频ID格式: vid_sessionId_timestamp_random_uniqueId</li>
        </ul>
      </div>
    </div>
  );
};

export default CopyTest; 