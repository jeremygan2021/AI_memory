import React from 'react';
import CommentSection from './CommentSection';

const CommentTest = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #a8e6a3 0%, #88d982 50%, #a8e6a3 100%)',
      padding: '20px',
      fontFamily: 'MUYAO-SOFTBRUSH, Inter, Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2d5016', marginBottom: '30px' }}>
        评论功能测试
      </h1>
      
      <CommentSection 
        recordingId="test-recording-123"
        userCode="TEST"
        sessionId="test-session-456"
      />
    </div>
  );
};

export default CommentTest; 