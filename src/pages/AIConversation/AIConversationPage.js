import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import RealtimeConversation from './RealtimeConversation';
import VoiceChat from './components/VoiceChat';
import './AIConversationPage.css';

const AIConversationPage = () => {
  const navigate = useNavigate();
  const { userid, bookId } = useParams();
  
  // 书籍数据状态
  const [books, setBooks] = useState([
    { 
      id: 1, 
      title: '小王子', 
      author: '圣埃克苏佩里',
      content: '这是一个关于小王子的故事，他来自一个很小的星球...',
      importedAt: new Date('2024-01-15'),
      aiInteractions: []
    }
  ]);
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 对话状态
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationStartTime, setConversationStartTime] = useState(null);
  const [conversationDuration, setConversationDuration] = useState(0);

  // 根据URL参数选择书籍
  useEffect(() => {
    if (bookId) {
      const book = books.find(b => b.id.toString() === bookId);
      if (book) {
        setSelectedBook(book);
      }
    }
  }, [bookId, books]);

  // 对话计时器
  useEffect(() => {
    let interval;
    if (isConversationActive && conversationStartTime) {
      interval = setInterval(() => {
        setConversationDuration(Math.floor((Date.now() - conversationStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConversationActive, conversationStartTime]);

  // 处理书籍文件上传
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      alert('请上传 .txt 或 .pdf 格式的文件');
      return;
    }

    setIsUploading(true);

    try {
      const content = await readFileContent(file);
      
      const newBook = {
        id: Math.max(...books.map(b => b.id), 0) + 1,
        title: file.name.replace(/\.[^/.]+$/, ''),
        author: '未知作者',
        content: content.substring(0, 500) + '...',
        fullContent: content,
        importedAt: new Date(),
        aiInteractions: []
      };

      setBooks(prev => [newBook, ...prev]);
      setIsUploading(false);
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
      setIsUploading(false);
    }
  }, [books]);

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const selectBook = useCallback((book) => {
    setSelectedBook(book);
    setSearchQuery('');
    setSearchResults([]);
    // 重置对话状态
    setIsConversationActive(false);
    setIsMuted(false);
    setConversationMessages([]);
    setConversationDuration(0);
    setConversationStartTime(null);

    // 更新URL，但不刷新页面
    navigate(`/${userid}/ai-conversation/${book.id}`, { replace: true });
  }, [userid, navigate]);

  const searchBookContent = useCallback(async () => {
    if (!searchQuery.trim() || !selectedBook) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const query = searchQuery.toLowerCase();
      const content = selectedBook.fullContent || selectedBook.content;
      const sentences = content.split(/[。！？.!?]/);
      
      const results = sentences
        .filter(sentence => sentence.toLowerCase().includes(query))
        .slice(0, 5)
        .map((sentence, index) => ({
          id: index + 1,
          content: sentence.trim(),
          relevance: Math.random() * 0.3 + 0.7
        }));

      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedBook]);

  const deleteBook = useCallback((bookId) => {
    if (window.confirm('确定要删除这本书吗？')) {
      setBooks(prev => prev.filter(book => book.id !== bookId));
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(null);
        setSearchResults([]);
        navigate(`/${userid}/ai-conversation`, { replace: true });
      }
    }
  }, [selectedBook, userid, navigate]);

  const goBack = useCallback(() => {
    navigate(`/${userid}`);
  }, [userid, navigate]);

  // 开始对话
  const startConversation = useCallback(() => {
    setIsConversationActive(true);
    setConversationStartTime(Date.now());
    setConversationDuration(0);
    setConversationMessages([
      {
        id: 1,
        type: 'system',
        content: '对话已开始',
        timestamp: new Date()
      }
    ]);
  }, []);

  // 结束对话
  const endConversation = useCallback(() => {
    setIsConversationActive(false);
    setConversationMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        type: 'system',
        content: '对话已结束',
        timestamp: new Date()
      }
    ]);
  }, []);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // 格式化时间
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ai-conversation-page">
      {/* 顶部导航栏 */}
      <div className="ai-page-header">
        <div className="ai-page-nav">
          <button className="back-btn" onClick={goBack}>
            <span className="back-icon">←</span>
            返回主页
          </button>
          <div className="ai-page-title">
            <span className="ai-icon">
              <img src='/images/AIBot.png' alt="AI" width={64} height={64} />
            </span>
            实时语音对话
          </div>
          <div className="user-code-display">{userid}</div>
        </div>
      </div>

      <div className="ai-page-content">
        {/* 左侧：书籍列表 */}
        <div className="ai-books-sidebar">
          <div className="books-header">
            <h3>我的书籍</h3>
            <label className="upload-book-btn">
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              {isUploading ? '上传中...' : '📖 导入'}
            </label>
          </div>

          <div className="books-list">
            {books.map(book => (
              <div
                key={book.id}
                className={`book-item ${selectedBook?.id === book.id ? 'selected' : ''}`}
                onClick={() => selectBook(book)}
              >
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{book.author}</div>
                  <div className="book-meta">
                    <span className="book-date">
                      {book.importedAt.toLocaleDateString()}
                    </span>
                    <span className="book-interactions">
                      {book.aiInteractions.length} 次对话
                    </span>
                  </div>
                </div>
                <button
                  className="delete-book-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBook(book.id);
                  }}
                  title="删除书籍"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：对话区域 */}
        <div className="ai-conversation-main">
          {selectedBook ? (
            <>
              {/* 书籍信息 */}
              <div className="book-info-header">
                <div className="book-detail">
                  <h2>{selectedBook.title}</h2>
                  <p className="book-author">作者：{selectedBook.author}</p>
                  <p className="book-import-date">
                    导入时间：{selectedBook.importedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 对话信息面板 */}
              <div className="conversation-info-panel">
                <div className="conversation-status">
                  <div className={`status-indicator ${isConversationActive ? 'active' : 'inactive'}`}>
                    {isConversationActive ? '对话中' : '未开始'}
                  </div>
                  <div className="conversation-timer">
                    {formatDuration(conversationDuration)}
                  </div>
                </div>
                
                <div className="conversation-controls">
                  {/* 使用VoiceChat组件替换原有的按钮 */}
                  <VoiceChat />
                  
                  <button 
                    className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
                    onClick={toggleMute}
                    disabled={!isConversationActive}
                  >
                    <span className="btn-icon">{isMuted ? '🔇' : '🔊'}</span>
                    <span className="btn-text">{isMuted ? '取消静音' : '静音'}</span>
                  </button>
                </div>
              </div>

              {/* 实时语音对话区域 */}
              <div className="realtime-conversation-wrapper">
                <div className="conversation-container">
                  <div className="conversation-messages">
                    {conversationMessages.length === 0 ? (
                      <div className="empty-conversation">
                        <div className="empty-icon">💬</div>
                        <p>暂无对话记录</p>
                        <div className="conversation-tips">
                          <p>对话提示：</p>
                          <ul>
                            <li>点击"开始对话"按钮开始语音对话</li>
                            <li>对话过程中可以随时静音或结束</li>
                            <li>对话内容将实时显示在这里</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      conversationMessages.map(message => (
                        <div 
                          key={message.id} 
                          className={`message ${message.type}`}
                        >
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-book-selected">
              <div className="empty-icon">📚</div>
              <h3>请选择一本书籍开始AI互动体验</h3>
              <p>从左侧列表中选择一本书，或者导入新的书籍文件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIConversationPage;
