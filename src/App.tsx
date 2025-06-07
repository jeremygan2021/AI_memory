/**
 * Memoir：岁月手记 - 个人博客网站
 * 主要功能：
 * 1. 展示个人博客内容
 * 2. 提供导航和社交媒体链接
 * 3. 包含订阅功能
 * 4. 展示分类内容（旅行、生活方式、家居）
 */

import React from 'react';
import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import Audio from './Audio';

function HomePage() {
  return (
    <div className="app">
      <header className="header">
        <nav className="navbar">
          <div className="brand-block">
            <div className="logo">Memor：岁月手记——时光里的成长与远行</div>
            <div className="subtitle">Beauty, Travel, Lifestyle</div>
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
          </div>
          <div className="social-links">
            <a href="#instagram" aria-label="Instagram">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="5" stroke="#b89b7b" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="#b89b7b" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="#b89b7b"/></svg>
            </a>
            <a href="#pinterest" aria-label="Pinterest">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#b89b7b" strokeWidth="1.5"/><path d="M12 16v-2.5m0 0c-1.5 0-2.5-1-2.5-2.5s1-2.5 2.5-2.5 2.5 1 2.5 2.5c0 1.5-1 2.5-2.5 2.5Z" stroke="#b89b7b" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </a>
            <a href="#email" aria-label="Email">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4" stroke="#b89b7b" strokeWidth="1.5"/><path d="M5 8l7 5 7-5" stroke="#b89b7b" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </a>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1>这里藏着我人生的吉光片羽 —— 关于成长的阵痛、旅途的意外，和生活里的细碎闪光</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <Link to="/audio" className="read-more">翻开时光笔记本</Link>
        </div>
      </section>

      <section className="categories">
        <div className="category-card">
          <img src="/images/medium_left.jpg" alt="Travel" />
          <h2>此刻</h2>
        </div>
        <div className="category-card">
          <img src="/images/medium_medium.jpg" alt="Lifestyle" />
          <h2>回忆</h2>
        </div>
        <div className="category-card">
          <img src="/images/medium_right.png" alt="Home" />
          <h2>未来</h2>
        </div>
      </section>

      <section className="newsletter">
        <h2>欢迎来到我们的小屋</h2>
        <p>welcome to here</p>
        <div className="envelope-block">
          {/* <img src="/images/envelope.png" alt="信封" style={{ width: '120px', float: 'right', marginRight: '40px' }} /> */}
          <div className="envelope-text" style={{ textAlign: 'right', marginRight: '40px', marginTop: '12px', color: '#b89b7b', fontSize: '1.1em' }}>
            <p>感谢你的关注，祝你每一天都被温柔以待！<br/>欢迎常来看看我的新故事。</p>
          </div>
        </div>
      </section>

      <section className="featured">
        <div className="featured-content">
          <h2>Lorem ipsum dolor sit amet</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <button>EXPLORE</button>
        </div>
        <div className="featured-image">
          <img src="/images/featured.jpg" alt="Featured" />
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/audio" element={<Audio />} />
    </Routes>
  );
}

export default App;
