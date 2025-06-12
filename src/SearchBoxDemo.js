import React, { useState } from 'react';
import ModernSearchBox from './components/ModernSearchBox';

const SearchBoxDemo = () => {
  const [searchValue1, setSearchValue1] = useState('');
  const [searchValue2, setSearchValue2] = useState('');
  const [searchValue3, setSearchValue3] = useState('');

  const handleSearch = (value) => {
    console.log('搜索内容:', value);
    // 这里可以添加搜索逻辑
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f7fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#2d3748', marginBottom: '40px', textAlign: 'center' }}>现代化搜索框演示</h1>
      
      {/* 不同尺寸演示 */}
      <section style={{ marginBottom: '60px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <h2 style={{ color: '#4a5568', marginBottom: '30px' }}>尺寸变体</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#718096' }}>小型 (32px)</label>
            <ModernSearchBox
              placeholder="搜索..."
              size="small"
              width="300px"
              value={searchValue1}
              onChange={(e) => setSearchValue1(e.target.value)}
              onSearch={() => handleSearch(searchValue1)}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#718096' }}>中型 (40px) - 默认</label>
            <ModernSearchBox
              placeholder="搜索内容..."
              size="medium"
              width="400px"
              value={searchValue2}
              onChange={(e) => setSearchValue2(e.target.value)}
              onSearch={() => handleSearch(searchValue2)}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#718096' }}>大型 (48px)</label>
            <ModernSearchBox
              placeholder="输入搜索关键词..."
              size="large"
              width="500px"
              value={searchValue3}
              onChange={(e) => setSearchValue3(e.target.value)}
              onSearch={() => handleSearch(searchValue3)}
            />
          </div>
        </div>
      </section>

      {/* 实际使用场景 */}
      <section style={{ marginBottom: '60px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <h2 style={{ color: '#4a5568', marginBottom: '30px' }}>使用场景示例</h2>
        
        <div style={{ display: 'grid', gap: '40px' }}>
          {/* 导航栏搜索 */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '15px', fontSize: '16px' }}>导航栏搜索</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: '#4a5568', fontWeight: '600' }}>Logo</span>
              <ModernSearchBox
                placeholder="Search"
                size="medium"
                width="350px"
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '6px' }}></div>
                <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '6px' }}></div>
              </div>
            </div>
          </div>

          {/* 侧边栏搜索 */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '15px', fontSize: '16px' }}>侧边栏搜索</h3>
            <ModernSearchBox
              placeholder="搜索文件..."
              size="small"
              width="250px"
            />
          </div>

          {/* 页面标题搜索 */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '15px', fontSize: '16px' }}>页面主搜索</h3>
            <div style={{ textAlign: 'center' }}>
              <ModernSearchBox
                placeholder="搜索你想要的内容..."
                size="large"
                width="600px"
              />
            </div>
          </div>

          {/* 渐变背景搜索 */}
          <div style={{ 
            background: 'linear-gradient(135deg, #e8f5e8 0%, #a8d8a8 30%, #78c6b6 70%, #4ecdc4 100%)', 
            padding: '20px', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ color: '#2d3748', marginBottom: '15px', fontSize: '16px' }}>渐变背景搜索</h3>
            <div style={{ textAlign: 'center' }}>
              <ModernSearchBox
                placeholder="搜索云端音频..."
                size="medium"
                width="400px"
                theme="gradient"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 特性说明 */}
      <section style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
        <h2 style={{ color: '#4a5568', marginBottom: '30px' }}>特性说明</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
            <h4 style={{ color: '#2f855a', marginBottom: '10px' }}>🎨 现代设计</h4>
            <p style={{ color: '#38a169', fontSize: '14px', margin: 0 }}>简洁的圆角设计，浅色背景，符合现代UI趋势</p>
          </div>
          
          <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ color: '#1d4ed8', marginBottom: '10px' }}>⚡ 流畅交互</h4>
            <p style={{ color: '#2563eb', fontSize: '14px', margin: 0 }}>悬停和聚焦时的平滑过渡动效</p>
          </div>
          
          <div style={{ padding: '20px', background: '#fef7e0', borderRadius: '8px', border: '1px solid #fed7aa' }}>
            <h4 style={{ color: '#92400e', marginBottom: '10px' }}>📱 响应式</h4>
            <p style={{ color: '#b45309', fontSize: '14px', margin: 0 }}>自适应不同屏幕尺寸</p>
          </div>
          
          <div style={{ padding: '20px', background: '#fdf2f8', borderRadius: '8px', border: '1px solid #f9a8d4' }}>
            <h4 style={{ color: '#be185d', marginBottom: '10px' }}>🔧 易于定制</h4>
            <p style={{ color: '#db2777', fontSize: '14px', margin: 0 }}>支持多种尺寸和自定义样式</p>
          </div>
        </div>
      </section>

      {/* 代码示例 */}
      <section style={{ background: '#1a202c', color: '#e2e8f0', padding: '30px', borderRadius: '12px', marginTop: '40px' }}>
        <h2 style={{ color: '#f7fafc', marginBottom: '20px' }}>使用方法</h2>
        
        <pre style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', overflow: 'auto', fontSize: '14px' }}>
{`import ModernSearchBox from './components/ModernSearchBox';

// 基本使用
<ModernSearchBox
  placeholder="搜索..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onSearch={handleSearch}
  size="medium"
  width="400px"
/>

// 属性说明
placeholder   // 占位符文本
value        // 输入值
onChange     // 输入变化回调
onSearch     // 搜索按钮点击回调
onKeyPress   // 键盘事件回调
size         // 尺寸: 'small' | 'medium' | 'large'
width        // 宽度，支持任何CSS宽度值
className    // 自定义CSS类名`}
        </pre>
      </section>
    </div>
  );
};

export default SearchBoxDemo; 