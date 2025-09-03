import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WelcomeScreen from '../../components/common/WelcomeScreen';

const ImageViewerPage = () => {
  const { userid: userCode, sessionid: sessionId, imageid: imageId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true); // 控制欢迎屏幕显示
  const longPressTimerRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (!userCode) return;
        // 优先读取URL中的objectKey
        const urlParams = new URLSearchParams(window.location.search);
        const okParam = urlParams.get('ok');
        if (okParam) {
          let ossKey = okParam;
          if (ossKey && ossKey.startsWith('recordings/')) {
            ossKey = ossKey.substring('recordings/'.length);
          }
          const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
          const url = ossKey ? ossBase + 'recordings/' + ossKey : '';
          const fileName = okParam.split('/').pop();
          setImage({ id: imageId, url, name: fileName, ossUrl: url, objectKey: okParam, type: 'image' });
          return;
        }

        // 兜底：扫描云端列表匹配
        const prefix = `recordings/${userCode}/`;
        const resp = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`);
        if (!resp.ok) throw new Error('获取云端文件失败');
        const result = await resp.json();
        const files = result.files || result.data || result.objects || result.items || result.results || [];
        const imageFiles = files.filter(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          const contentType = file.content_type || '';
          const isImage = contentType.startsWith('image/') || /(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
          return isImage;
        });
        let found = null;
        if (imageId && imageId.startsWith('img_')) {
          found = imageFiles.find(file => {
            const objectKey = file.object_key || file.objectKey || file.key || file.name;
            const fileName = objectKey ? objectKey.split('/').pop() : '';
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            return nameWithoutExt === imageId || fileName.includes(imageId);
          });
        }
        if (!found && imageId) {
          found = imageFiles.find(file => {
            const objectKey = file.object_key || file.objectKey || file.key || file.name;
            const fileName = objectKey ? objectKey.split('/').pop() : '';
            return fileName.includes(imageId);
          });
        }
        if (found) {
          let ossKey = found.object_key || found.objectKey || found.key || found.name;
          if (ossKey && ossKey.startsWith('recordings/')) {
            ossKey = ossKey.substring('recordings/'.length);
          }
          const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
          const url = ossKey ? ossBase + 'recordings/' + ossKey : '';
          const objectKey = found.object_key || found.objectKey || found.key || found.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          setImage({ id: imageId, url, name: fileName, ossUrl: url, objectKey, type: 'image' });
        }
      } catch (err) {
        console.error('ImageViewerPage: 加载图片失败', err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [userCode, sessionId, imageId]);



  const buildViewLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${userCode}/image-viewer/${sessionId}/${imageId}?from=upload`;
  };

  const fallbackCopyTextToClipboard = (text) => {
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
      // ignore
    }
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      success = false;
    }
    document.body.removeChild(textArea);
    if (success) {
      alert('✅ 图片查看链接已复制到剪贴板！');
    } else {
      const copyPrompt = window.prompt('请手动复制以下链接：', text);
      if (copyPrompt !== null) {
        alert('✅ 感谢您的操作！');
      }
    }
  };

  const copyCurrentImageLink = async () => {
    const viewLink = buildViewLink();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(viewLink);
        alert('✅ 图片查看链接已复制到剪贴板！');
        return;
      } catch (err) {
        fallbackCopyTextToClipboard(viewLink);
      }
    } else {
      fallbackCopyTextToClipboard(viewLink);
    }
  };

  const handleLongPressStart = (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      copyCurrentImageLink();
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        加载中...
      </div>
    );
  }

  if (!image) {
    return (
      <div style={{ padding: 20 }}>
        <div>未找到图片</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* 欢迎屏幕 */}
      <WelcomeScreen 
        visible={showWelcome} 
        onWelcomeComplete={() => setShowWelcome(false)} 
      />
      
      <div style={{ padding: 12 }}>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <img
          src={image.ossUrl || image.url}
          alt={image.name}
          style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); handleLongPressStart(e); }}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
        />
      </div>
    </div>
  );
};

export default ImageViewerPage;


