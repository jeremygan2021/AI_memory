import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserCodeInput.css';

const UserCodeInput = () => {
  const [userCode, setUserCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setUserCode(value);
    setError('');
  };

  const handleSubmit = () => {
    // 验证用户代码格式
    if (!userCode || userCode.length !== 4) {
      setError('请输入4位用户代码');
      return;
    }

    if (!/^[A-Z0-9]{4}$/.test(userCode)) {
      setError('用户代码只能包含大写字母和数字');
      return;
    }

    // 验证通过，跳转到用户页面
    navigate(`/${userCode}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="user-code-input-container">
      <div className="user-code-input-card">
        <div className="input-header">
          <h2>🤖 AI智能录音管家</h2>
        </div>
        
        <div className="input-form">
          <div className="input-group">
            <input
              type="text"
              value={userCode}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="请输入4位用户代码"
              maxLength={4}
              className={`user-code-input ${error ? 'error' : ''}`}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <button 
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!userCode || userCode.length !== 4}
          >
            进入应用
          </button>
        </div>
        
        <div className="input-footer">
          <p className="code-format">格式：4位大写字母和数字组合</p>
          <p className="code-example">示例：A1B2、1234、ABCD</p>
        </div>
      </div>
    </div>
  );
};

export default UserCodeInput; 