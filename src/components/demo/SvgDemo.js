import React from 'react';
import SvgIcon from '../common/SvgIcons';

const SvgDemo = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>SVG图标使用方法演示</h1>
      
      {/* 方法1: 直接使用img标签加载SVG文件 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>方法1: img标签 + SVG文件</h2>
        <p>最简单的方法，直接替换PNG文件路径为SVG文件路径：</p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src="/images/baby2.svg" width="100" height="100" alt="Baby SVG" />
          <code>{`<img src="/images/baby2.svg" width="100" height="100" />`}</code>
        </div>
      </section>

      {/* 方法2: 使用通用SVG组件 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>方法2: 通用SVG图标组件</h2>
        <p>使用预定义的图标库，可以动态改变颜色和大小：</p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="baby" width={60} height={60} color="#3bb6a6" />
            <br />
            <code>baby</code>
          </div>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="cloud" width={60} height={60} color="#4ecdc4" />
            <br />
            <code>cloud</code>
          </div>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="microphone" width={60} height={60} color="#ff7875" />
            <br />
            <code>microphone</code>
          </div>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="album" width={60} height={60} color="#52c41a" />
            <br />
            <code>album</code>
          </div>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="time" width={60} height={60} color="#722ed1" />
            <br />
            <code>time</code>
          </div>
          <div style={{ textAlign: 'center' }}>
            <SvgIcon name="growth" width={60} height={60} color="#fa8c16" />
            <br />
            <code>growth</code>
          </div>
        </div>
        <br />
        <code>{`<SvgIcon name="baby" width={60} height={60} color="#3bb6a6" />`}</code>
      </section>

      {/* 方法3: 独立的SVG组件 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>方法3: 独立SVG组件</h2>
        <p>为复杂的图标创建独立组件，提供更多自定义选项：</p>
                 <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           <SvgIcon name="baby" width={80} height={80} color="#3bb6a6" />
           <SvgIcon name="baby" width={120} height={120} color="#ff7875" />
           <SvgIcon name="baby" width={60} height={60} color="#52c41a" />
         </div>
         <br />
         <code>{`<SvgIcon name="baby" width={80} height={80} color="#3bb6a6" />`}</code>
      </section>

      {/* 方法4: 内联SVG */}
      <section style={{ marginBottom: '40px' }}>
        <h2>方法4: 内联SVG代码</h2>
        <p>直接在JSX中写SVG代码，最灵活的方式：</p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#3bb6a6" opacity="0.8"/>
            <circle cx="9" cy="9" r="1.5" fill="white"/>
            <circle cx="15" cy="9" r="1.5" fill="white"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px' }}>
{`<svg width="80" height="80" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#3bb6a6"/>
  <circle cx="9" cy="9" r="1.5" fill="white"/>
  <circle cx="15" cy="9" r="1.5" fill="white"/>
  <path d="M8 14s1.5 2 4 2 4-2 4-2" 
        stroke="white" strokeWidth="2"/>
</svg>`}
            </pre>
          </div>
        </div>
      </section>

      {/* 使用建议 */}
      <section style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px' }}>
        <h2>使用建议</h2>
        <ul>
          <li><strong>方法1 (img + SVG文件)</strong>: 适合静态图标，最简单的迁移方式</li>
          <li><strong>方法2 (通用组件)</strong>: 适合标准图标库，统一管理，支持动态颜色</li>
          <li><strong>方法3 (独立组件)</strong>: 适合复杂或特殊的图标，可重用性高</li>
          <li><strong>方法4 (内联SVG)</strong>: 适合简单图标或需要特殊动画效果的场景</li>
        </ul>
        
        <h3>优势对比：</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e6f7ff' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>方法</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>文件大小</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>动态颜色</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>可重用性</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>维护性</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>img + SVG</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>较大</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>❌</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>通用组件</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>小</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>✅</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐⭐⭐</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>独立组件</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>小</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>✅</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐⭐</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>内联SVG</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>最小</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>✅</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>⭐⭐⭐</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default SvgDemo; 