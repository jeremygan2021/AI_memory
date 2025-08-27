import React, { useState, useEffect } from 'react';
import { 
  syncThemeOnStartup, 
  triggerThemeSync, 
  applyTheme, 
  getAllThemes 
} from '../themes/themeConfig';
import { 
  saveThemeToCloud, 
  loadThemeFromCloud, 
  checkThemeCloudUpdate 
} from '../services/themeCloudService';
import { getUserCode } from '../utils/userCode';
import ThemeSwitcher from './ThemeSwitcher';

const ThemeCloudTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [sessionId, setSessionId] = useState('test_session');

  useEffect(() => {
    setCurrentUser(getUserCode() || '未设置用户代码');
  }, []);

  const addTestResult = (test, result, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { 
      test, 
      result, 
      details, 
      timestamp,
      success: result === '✅ 成功'
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 测试1：保存主题到云端
  const testSaveTheme = async () => {
    setIsLoading(true);
    try {
      const userCode = getUserCode();
      if (!userCode) {
        addTestResult('保存主题', '❌ 失败', '用户代码不存在');
        return;
      }

      const result = await saveThemeToCloud('ocean', userCode, sessionId);
      
      if (result.success) {
        addTestResult('保存主题', '✅ 成功', `主题 ocean 已保存到云端: ${result.objectKey}`);
      } else {
        addTestResult('保存主题', '❌ 失败', result.message || result.error);
      }
    } catch (error) {
      addTestResult('保存主题', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试2：从云端加载主题
  const testLoadTheme = async () => {
    setIsLoading(true);
    try {
      const userCode = getUserCode();
      if (!userCode) {
        addTestResult('加载主题', '❌ 失败', '用户代码不存在');
        return;
      }

      const result = await loadThemeFromCloud(userCode, sessionId);
      
      if (result.success) {
        addTestResult('加载主题', '✅ 成功', `从云端加载主题: ${result.themeId}`);
        // 应用加载的主题
        await applyTheme(result.themeId, { saveToCloud: false });
      } else {
        addTestResult('加载主题', '⚠️ 降级', result.message || '使用本地主题');
      }
    } catch (error) {
      addTestResult('加载主题', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试3：检查云端更新
  const testCheckUpdate = async () => {
    setIsLoading(true);
    try {
      const userCode = getUserCode();
      if (!userCode) {
        addTestResult('检查更新', '❌ 失败', '用户代码不存在');
        return;
      }

      const result = await checkThemeCloudUpdate(userCode, sessionId);
      
      const status = result.hasUpdate ? '🔄 有更新' : '✅ 已是最新';
      addTestResult('检查更新', status, `原因: ${result.reason}, 云端: ${result.cloudTheme}, 本地: ${result.localTheme}`);
    } catch (error) {
      addTestResult('检查更新', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试4：启动时同步
  const testStartupSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncThemeOnStartup();
      
      if (result.success) {
        const source = result.source === 'cloud' ? '云端' : '本地';
        addTestResult('启动同步', '✅ 成功', `从${source}加载主题: ${result.themeId}`);
      } else {
        addTestResult('启动同步', '❌ 失败', result.error || '同步失败');
      }
    } catch (error) {
      addTestResult('启动同步', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试5：手动触发同步
  const testManualSync = async () => {
    setIsLoading(true);
    try {
      const result = await triggerThemeSync(sessionId);
      
      if (result.success) {
        const action = result.action === 'loaded_from_cloud' ? '从云端同步' : '使用本地';
        addTestResult('手动同步', '✅ 成功', `${action}: ${result.themeId}`);
        
        // 强制更新ThemeSwitcher状态
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('forceThemeUpdate'));
        }, 100);
        
      } else {
        addTestResult('手动同步', '❌ 失败', result.error || result.message);
      }
    } catch (error) {
      addTestResult('手动同步', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试5.5：强制刷新主题显示
  const testForceThemeRefresh = async () => {
    setIsLoading(true);
    try {
      const currentThemeId = localStorage.getItem('selectedTheme') || 'default';
      addTestResult('强制刷新', '🔄 开始', `当前主题: ${currentThemeId}`);
      
      // 检查当前CSS变量状态
      const root = document.documentElement;
      const primaryBg = getComputedStyle(root).getPropertyValue('--theme-primaryBg');
      addTestResult('CSS检查', '📋 信息', `当前主背景: ${primaryBg.substring(0, 50)}...`);
      
      // 强制重新应用主题
      await applyTheme(currentThemeId, { saveToCloud: false });
      
      // 验证CSS变量是否正确应用
      const newPrimaryBg = getComputedStyle(root).getPropertyValue('--theme-primaryBg');
      addTestResult('CSS验证', '📋 信息', `新主背景: ${newPrimaryBg.substring(0, 50)}...`);
      
      // 获取完整的主题对象并触发事件
      const theme = getAllThemes().find(t => t.id === currentThemeId) || { id: currentThemeId, name: currentThemeId };
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme } 
      }));
      
      addTestResult('事件触发', '📡 信息', `触发主题变化事件: ${theme.name || theme.id}`);
      
      // 强制页面重绘
      document.body.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        document.body.style.transform = '';
      });
      
      // 检查背景图片变量
      const backgroundImage = getComputedStyle(root).getPropertyValue('--theme-backgroundImage');
      if (backgroundImage) {
        addTestResult('背景检查', '🖼️ 信息', `背景图片: ${backgroundImage.substring(0, 50)}...`);
      }
      
      // 检查页面中的图标元素
      const elephantIcons = document.querySelectorAll('.elephant-icon');
      if (elephantIcons.length > 0) {
        addTestResult('图标检查', '🐘 信息', `找到 ${elephantIcons.length} 个大象图标元素`);
        elephantIcons.forEach((icon, index) => {
          addTestResult(`图标${index + 1}`, '🖼️ 信息', `当前src: ${icon.src.split('/').pop()}`);
        });
      }
      
      addTestResult('强制刷新', '✅ 完成', '主题显示已强制刷新');
      
    } catch (error) {
      addTestResult('强制刷新', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试6：清理重复文件
  const testCleanupDuplicates = async () => {
    setIsLoading(true);
    try {
      const userCode = getUserCode();
      if (!userCode) {
        addTestResult('清理重复', '❌ 失败', '用户代码不存在');
        return;
      }

      // 获取所有主题文件
      const API_BASE_URL = 'https://data.tangledup-ai.com';
      const prefix = `recordings/${userCode}/${sessionId}/`;
      const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`);
      
      if (!response.ok) {
        addTestResult('清理重复', '❌ 失败', '获取文件列表失败');
        return;
      }

      const result = await response.json();
      const files = result.files || [];
      
      // 查找所有主题文件
      const themeFiles = files.filter(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name || '';
        const fileName = objectKey.split('/').pop() || '';
        return objectKey.includes('/global/') && fileName.endsWith('.txt') && 
               (fileName.includes('theme') || /^\d{8}_\d{6}_[a-f0-9]+\.txt$/.test(fileName));
      });

      addTestResult('清理重复', '📊 信息', `找到 ${themeFiles.length} 个主题相关文件`);
      
      if (themeFiles.length <= 1) {
        addTestResult('清理重复', '✅ 成功', '没有重复文件需要清理');
        return;
      }

      // 按时间排序，保留最新的
      themeFiles.sort((a, b) => {
        const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0).getTime();
        const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0).getTime();
        return timeB - timeA;
      });

      const latestFile = themeFiles[0];
      const duplicateFiles = themeFiles.slice(1);
      
      addTestResult('清理重复', '🗑️ 清理', `保留最新文件，标记 ${duplicateFiles.length} 个重复文件`);
      
    } catch (error) {
      addTestResult('清理重复', '❌ 异常', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    clearResults();
    setIsLoading(true);
    
    addTestResult('开始测试', '🚀 启动', `用户代码: ${currentUser}, 会话: ${sessionId}`);
    
    // 按顺序执行测试
    await testSaveTheme();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    
    await testLoadTheme();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCheckUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testStartupSync();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testManualSync();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testForceThemeRefresh();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCleanupDuplicates();
    
    setIsLoading(false);
    addTestResult('测试完成', '🎉 结束', '所有测试已完成');
  };

  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.filter(r => r.result !== '🚀 启动' && r.result !== '🎉 结束').length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--theme-primaryBg, linear-gradient(135deg, #a8e6a3 0%, #88d982 50%, #a8e6a3 100%))',
      padding: '20px',
      fontFamily: 'MUYAO-SOFTBRUSH, Inter, Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'var(--theme-containerBg, #ffffe6)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: 'var(--theme-cardShadow, 0 25px 80px rgba(45, 80, 22, 0.15))'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: 'var(--theme-textPrimary, #2d5016)', 
          marginBottom: '20px'
        }}>
          🎨 主题云端同步测试
        </h1>

        {/* 主题切换器 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ThemeSwitcher />
        </div>

        {/* 用户信息 */}
        <div style={{
          background: 'var(--theme-headerBg, rgba(255, 255, 255, 0.15))',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--theme-textPrimary, #2d5016)', margin: 0 }}>
            <strong>当前用户:</strong> {currentUser}
          </p>
          <p style={{ color: 'var(--theme-textSecondary, #333)', margin: '5px 0 0 0', fontSize: '14px' }}>
            测试会话: {sessionId}
          </p>
        </div>

        {/* 控制按钮 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={testSaveTheme}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            💾 保存主题
          </button>
          
          <button
            onClick={testLoadTheme}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📥 加载主题
          </button>
          
          <button
            onClick={testCheckUpdate}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔍 检查更新
          </button>
          
          <button
            onClick={testStartupSync}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🚀 启动同步
          </button>
          
          <button
            onClick={testManualSync}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 手动同步
          </button>
          
          <button
            onClick={testForceThemeRefresh}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: '#ff9500',
              border: '2px solid #ff9500',
              borderRadius: '12px',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            💫 强制刷新
          </button>
          
          <button
            onClick={testCleanupDuplicates}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-buttonBg, #f8fae6)',
              border: '2px solid var(--theme-border, rgba(255, 255, 255, 0.3))',
              borderRadius: '12px',
              color: 'var(--theme-buttonText, #2d5016)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🗑️ 清理重复
          </button>
          
          <button
            onClick={runAllTests}
            disabled={isLoading}
            style={{
              padding: '12px',
              background: 'var(--theme-primary, #4ac967)',
              border: '2px solid var(--theme-primary, #4ac967)',
              borderRadius: '12px',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🧪 运行所有测试
          </button>
        </div>

        {/* 测试结果统计 */}
        {totalCount > 0 && (
          <div style={{
            background: 'var(--theme-headerBg, rgba(255, 255, 255, 0.15))',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--theme-textPrimary, #2d5016)', margin: 0 }}>
              <strong>测试结果:</strong> {successCount}/{totalCount} 成功
            </p>
          </div>
        )}

        {/* 清空按钮 */}
        {testResults.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={clearResults}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--theme-textSecondary, #333)',
                borderRadius: '8px',
                color: 'var(--theme-textSecondary, #333)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ 清空结果
            </button>
          </div>
        )}

        {/* 测试结果列表 */}
        <div style={{
          background: 'var(--theme-commentBg, rgba(255, 255, 255, 0.8))',
          borderRadius: '12px',
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3 style={{ 
            color: 'var(--theme-textPrimary, #2d5016)', 
            marginTop: 0,
            marginBottom: '15px'
          }}>
            测试日志
          </h3>
          
          {testResults.length === 0 ? (
            <p style={{ 
              color: 'var(--theme-textSecondary, #333)', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              还没有测试结果...
            </p>
          ) : (
            <div>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '10px',
                    padding: '10px',
                    background: result.success ? 'rgba(76, 201, 103, 0.1)' : result.result.includes('❌') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${result.success ? 'var(--theme-primary, #4ac967)' : result.result.includes('❌') ? '#ff0000' : '#ffc107'}`
                  }}
                >
                  <div style={{ minWidth: '120px', fontWeight: '600', color: 'var(--theme-textPrimary, #2d5016)' }}>
                    {result.test}
                  </div>
                  <div style={{ minWidth: '60px', fontSize: '14px' }}>
                    {result.result}
                  </div>
                  <div style={{ flex: 1, fontSize: '13px', color: 'var(--theme-textSecondary, #333)' }}>
                    {result.details}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--theme-textSecondary, #333)', opacity: 0.7 }}>
                    {result.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'var(--theme-headerBg, rgba(255, 255, 255, 0.15))',
          borderRadius: '12px',
          fontSize: '14px',
          color: 'var(--theme-textSecondary, #333)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--theme-textPrimary, #2d5016)' }}>使用说明:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>💾 保存主题：将指定主题保存到云端（自动去重）</li>
            <li>📥 加载主题：从云端加载最新主题设置</li>
            <li>🔍 检查更新：检查是否有云端主题更新</li>
            <li>🚀 启动同步：模拟应用启动时的主题同步</li>
            <li>🔄 手动同步：手动触发主题同步</li>
            <li>💫 强制刷新：强制刷新主题显示（解决同步后不生效问题）</li>
            <li>🗑️ 清理重复：检查并标记重复的主题文件</li>
            <li>🧪 运行所有测试：按顺序执行所有测试项目</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThemeCloudTest;
