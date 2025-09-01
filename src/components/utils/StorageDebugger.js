import React, { useState, useEffect } from 'react';

const StorageDebugger = () => {
  const [localStorageData, setLocalStorageData] = useState({});
  const [sessionStorageData, setSessionStorageData] = useState({});
  const [selectedStorage, setSelectedStorage] = useState('localStorage');

  const refreshStorageData = () => {
    // 获取localStorage数据
    const localData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      localData[key] = value;
    }
    setLocalStorageData(localData);

    // 获取sessionStorage数据
    const sessionData = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      sessionData[key] = value;
    }
    setSessionStorageData(sessionData);
  };

  useEffect(() => {
    refreshStorageData();
  }, []);

  const clearStorage = (storageType) => {
    if (storageType === 'localStorage') {
      localStorage.clear();
    } else {
      sessionStorage.clear();
    }
    refreshStorageData();
  };

  const deleteItem = (key, storageType) => {
    if (storageType === 'localStorage') {
      localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
    refreshStorageData();
  };

  const currentData = selectedStorage === 'localStorage' ? localStorageData : sessionStorageData;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h3>Storage Debugger</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="radio"
            value="localStorage"
            checked={selectedStorage === 'localStorage'}
            onChange={(e) => setSelectedStorage(e.target.value)}
          />
          localStorage
        </label>
        <label style={{ marginLeft: '15px' }}>
          <input
            type="radio"
            value="sessionStorage"
            checked={selectedStorage === 'sessionStorage'}
            onChange={(e) => setSelectedStorage(e.target.value)}
          />
          sessionStorage
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={refreshStorageData} style={{ marginRight: '10px' }}>
          刷新数据
        </button>
        <button onClick={() => clearStorage(selectedStorage)}>
          清空 {selectedStorage}
        </button>
      </div>

      <div>
        <h4>{selectedStorage} 内容:</h4>
        {Object.keys(currentData).length === 0 ? (
          <p>暂无数据</p>
        ) : (
          <div>
            {Object.entries(currentData).map(([key, value]) => (
              <div key={key} style={{ 
                border: '1px solid #ccc', 
                margin: '5px 0', 
                padding: '10px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ fontWeight: 'bold', color: '#0066cc' }}>
                  Key: {key}
                  <button 
                    onClick={() => deleteItem(key, selectedStorage)}
                    style={{ 
                      marginLeft: '10px', 
                      fontSize: '10px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
                <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                  Value: {typeof value === 'string' ? value : JSON.stringify(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageDebugger; 