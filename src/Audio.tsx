import React, { useRef, useState } from 'react';
import './Audio.css';

const guanjia = "/images/image.png";
const TAGS = [
  { text: '温柔家长', color: '#ffb366' },
  // { text: '亲子沟通', color: '#ffd699' },
  // { text: '成长陪伴', color: '#ffcc99' },
  // { text: '故事达人', color: '#ffb3b3' },
];

const Audio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showRecording, setShowRecording] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<{name: string, url: string}[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  // 录制音频
  const startRecording = async () => {
    setMessage('');
    setRecordedChunks([]);
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        setMessage('录制完成，请试听并确认上传');
        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setRecording(true);
      setMessage('正在录制...');
    } catch (err) {
      setMessage('无法访问麦克风');
    }
  };

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setTimeout(() => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        setMessage('录制完成，请试听并确认上传');
      }, 100);
    }
  };

  // 确认上传录音
  const confirmUpload = async () => {
    if (!recordedChunks.length) return;
    setMessage('正在上传...');
    setUploading(true);
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const audioFile = new File([blob], 'recorded_audio.webm', { type: 'audio/webm' });
    setFile(audioFile);
    const formData = new FormData();
    formData.append('file', audioFile);
    try {
      const res = await fetch('http://6.6.6.86:8000/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setMessage('录音上传成功！');
      } else {
        setMessage('录音上传失败');
      }
    } catch (err) {
      setMessage('录音上传出错');
    } finally {
      setUploading(false);
    }
  };

  // 读取云文件
  const fetchCloudFiles = async () => {
    setLoadingCloud(true);
    setMessage('正在获取云端文件...');
    try {
      const res = await fetch('http://6.6.6.86:8000/files'); // 假设接口返回json数组
      if (res.ok) {
        const data = await res.json();
        // data应为[{name: string, url: string}]
        setCloudFiles(data);
        setMessage('云端文件获取成功');
      } else {
        setMessage('云端文件获取失败');
      }
    } catch (err) {
      setMessage('云端文件获取出错');
    } finally {
      setLoadingCloud(false);
    }
  };

  return (
    <div className="audio-page warm-bg">
      <div className="audio-bg" />
      {!showRecording ? (
        <div className="call-card">
          <div className="tag-list">
            {TAGS.map(tag => (
              <span className="call-tag" style={{ background: tag.color }} key={tag.text}>{tag.text}</span>
            ))}
          </div>
          <div className="avatar-block">
            <img className="avatar-img" src="guanjia" alt="亲子头像" />
            <span className="avatar-call-icon">📞</span>
          </div>
          <div className="call-nickname">你好，我是你的AI回忆管家</div>
          <div className="call-desc">AI亲子通话助手,我是您的亲子沟通小帮手，陪伴成长，倾听心声，记录美好亲子时光。让我们开始亲子对话吧！</div>
          <button className="call-btn" onClick={() => setShowRecording(true)}>
            📞 开始通话
          </button>
        </div>
      ) : (
        <div className="audio-upload-block recording">
          <h2>亲子通话录音</h2>
          <div style={{marginBottom: '18px', width: '100%', textAlign: 'center'}}>
            <button type="button" onClick={startRecording} disabled={recording || uploading} style={{marginRight: '12px'}}>
              {recording ? '录制中...' : '开始录音'}
            </button>
            <button type="button" onClick={stopRecording} disabled={!recording || uploading}>
              停止录音
            </button>
          </div>
          {audioUrl && !uploading && (
            <div style={{marginBottom: '12px', textAlign: 'center'}}>
              <audio src={audioUrl} controls style={{width: '100%', maxWidth: 320, marginBottom: 8}} />
              <div>
                <button type="button" onClick={confirmUpload} style={{marginTop: 4}}>确认上传录音</button>
              </div>
            </div>
          )}
          <div style={{margin: '18px 0 0 0', width: '100%', textAlign: 'center'}}>
            <button type="button" onClick={fetchCloudFiles} disabled={loadingCloud} style={{background: '#ffd699', color: '#b88b5a', fontWeight: 600, marginBottom: 8}}>
              {loadingCloud ? '正在读取云文件...' : '读取云端音频'}
            </button>
            {cloudFiles.length > 0 && (
              <div style={{marginTop: 8}}>
                <div style={{fontWeight: 600, color: '#b88b5a', marginBottom: 4}}>云端音频列表：</div>
                {cloudFiles.map(f => (
                  <div key={f.url} style={{margin: '6px 0'}}>
                    <span style={{marginRight: 8}}>{f.name}</span>
                    <audio src={f.url} controls style={{verticalAlign: 'middle', width: 180}} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {message && <div style={{marginTop: '12px', color: uploading ? '#888' : (message.includes('成功') ? 'green' : 'red')}}>{message}</div>}
        </div>
      )}
    </div>
  );
};

export default Audio; 
