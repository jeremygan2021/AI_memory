import React, { useState, useCallback, useMemo } from 'react';
import './BookMemoryModule.css';

const BookMemoryModule = () => {
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
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    setAiConversation([]);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleAiQuestion = useCallback(async () => {
    if (!aiQuestion.trim() || !selectedBook) return;

    const question = aiQuestion.trim();
    setAiQuestion('');
    setIsAiLoading(true);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    setAiConversation(prev => [...prev, userMessage]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiAnswer = `根据《${selectedBook.title}》的内容，${question}的答案是... 这是一个基于书籍内容的智能回答，帮助您更好地理解和回忆书中的内容。`;
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiAnswer,
        timestamp: new Date()
      };
      
      setAiConversation(prev => [...prev, aiMessage]);

      const newInteraction = {
        id: Date.now(),
        question: question,
        answer: aiAnswer,
        timestamp: new Date()
      };

      setBooks(prev => prev.map(book => 
        book.id === selectedBook.id 
          ? { ...book, aiInteractions: [...book.aiInteractions, newInteraction] }
          : book
      ));

    } catch (error) {
      console.error('AI对话失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: '抱歉，AI暂时无法回答您的问题，请稍后重试。',
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiQuestion, selectedBook, books]);

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
        setAiConversation([]);
        setSearchResults([]);
      }
    }
  }, [selectedBook]);

  const bookStats = useMemo(() => {
    const totalBooks = books.length;
    const totalInteractions = books.reduce((sum, book) => sum + book.aiInteractions.length, 0);
    const recentBooks = books.filter(book => 
      new Date() - book.importedAt < 7 * 24 * 60 * 60 * 1000
    ).length;

    return { totalBooks, totalInteractions, recentBooks };
  }, [books]);

  return (
    <div className="book-memory-module">
      <div className="book-module-header">
        <div className="book-module-title">
          <span className="book-icon">📚</span>
          回忆书籍
        </div>
        <div className="book-stats">
          <span className="stat-item">
            <span className="stat-number">{bookStats.totalBooks}</span>
            <span className="stat-label">书籍</span>
          </span>
          <span className="stat-item">
            <span className="stat-number">{bookStats.totalInteractions}</span>
            <span className="stat-label">对话</span>
          </span>
          <span className="stat-item">
            <span className="stat-number">{bookStats.recentBooks}</span>
            <span className="stat-label">新增</span>
          </span>
        </div>
      </div>

      <div className="book-module-content">
        <div className="book-list-section">
          <div className="book-list-header">
            <h3>我的书籍</h3>
            <label className="upload-book-btn">
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              {isUploading ? '上传中...' : '📖 导入书籍'}
            </label>
          </div>

          <div className="book-list">
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

        <div className="book-detail-section">
          {selectedBook ? (
            <>
              <div className="book-detail-header">
                <h2>{selectedBook.title}</h2>
                <p className="book-author-detail">作者：{selectedBook.author}</p>
                <p className="book-import-date">
                  导入时间：{selectedBook.importedAt.toLocaleDateString()}
                </p>
              </div>

              <div className="ai-conversation-area">
                <div className="conversation-messages">
                  {aiConversation.length === 0 ? (
                    <div className="empty-conversation">
                      <div className="empty-icon">💬</div>
                      <p>开始与AI对话，探索《{selectedBook.title}》的内容</p>
                    </div>
                  ) : (
                    aiConversation.map(message => (
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
                  {isAiLoading && (
                    <div className="message ai loading">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="conversation-input">
                  <input
                    type="text"
                    placeholder="向AI提问关于这本书的问题..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiQuestion()}
                    disabled={isAiLoading}
                  />
                  <button
                    onClick={handleAiQuestion}
                    disabled={!aiQuestion.trim() || isAiLoading}
                    className="send-btn"
                  >
                    发送
                  </button>
                </div>
              </div>

              <div className="search-area">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="搜索书籍内容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBookContent()}
                  />
                  <button
                    onClick={searchBookContent}
                    disabled={!searchQuery.trim() || isSearching}
                    className="search-btn"
                  >
                    {isSearching ? '搜索中...' : '搜索'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    <h4>搜索结果：</h4>
                    {searchResults.map(result => (
                      <div key={result.id} className="search-result-item">
                        <div className="result-content">{result.content}</div>
                        <div className="result-relevance">
                          相关度：{(result.relevance * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-book-selected">
              <div className="empty-icon">📚</div>
              <p>请选择一本书籍开始AI互动体验</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookMemoryModule;
