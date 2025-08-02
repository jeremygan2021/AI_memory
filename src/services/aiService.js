// src/services/aiService.js
import sunoApi from './sunoApi';

class AIService {
  // 直接生成音乐（基于文本提示）
  async generateMusicFromText(demand, prompt, options = {}) {
    try {
      // 构建生成参数
      const params = {
        prompt: `${demand} ${prompt}`.trim(),
        title: options.title || `AI生成音乐_${Date.now()}`,
        tags: options.tags || this.extractTagsFromPrompt(demand, prompt),
        model: options.model || 'V3_5',
        instrumental: options.instrumental || false,
        customMode: options.customMode || false
      };

      const result = await sunoApi.generateMusic(params);
      return result;
    } catch (error) {
      console.error('文本生成音乐失败:', error);
      throw error;
    }
  }

  // 自定义模式生成音乐（支持自定义歌词）
  async generateCustomMusic(demand, prompt, lyrics = '', options = {}) {
    try {
      const params = {
        prompt: `${demand} ${prompt}`.trim(),
        title: options.title || `AI自定义音乐_${Date.now()}`,
        tags: options.tags || this.extractTagsFromPrompt(demand, prompt),
        lyrics: lyrics,
        model: options.model || 'V3_5',
        instrumental: options.instrumental || false
      };

      const result = await sunoApi.generateCustomMusic(params);
      return result;
    } catch (error) {
      console.error('自定义生成音乐失败:', error);
      throw error;
    }
  }

  // 基于参考音频生成音乐
  async generateMusicFromReference(referenceAudioUrl, demand, prompt, options = {}) {
    try {
      const params = {
        referenceAudioUrl: referenceAudioUrl,
        prompt: `${demand} ${prompt}`.trim(),
        title: options.title || `AI参考音乐_${Date.now()}`,
        tags: options.tags || this.extractTagsFromPrompt(demand, prompt),
        model: options.model || 'V3_5'
      };

      const result = await sunoApi.generateMusicFromReference(params);
      return result;
    } catch (error) {
      console.error('基于参考音频生成失败:', error);
      throw error;
    }
  }

  // 从提示中提取标签
  extractTagsFromPrompt(demand, prompt) {
    // 简单的标签提取逻辑，基于常见的音乐风格关键词
    const keywords = {
      'jazz': ['爵士', 'jazz', '即兴'],
      'classical': ['古典', 'classical', '交响'],
      'pop': ['流行', 'pop', '现代'],
      'rock': ['摇滚', 'rock', '节奏'],
      'electronic': ['电子', 'electronic', '合成'],
      'ambient': ['环境', 'ambient', '氛围'],
      'folk': ['民谣', 'folk', '传统'],
      'blues': ['蓝调', 'blues', '忧郁'],
      'acoustic': ['原声', 'acoustic', '木吉他'],
      'instrumental': ['器乐', 'instrumental', '无人声']
    };

    const text = `${demand} ${prompt}`.toLowerCase();
    const tags = [];

    for (const [tag, words] of Object.entries(keywords)) {
      if (words.some(word => text.includes(word))) {
        tags.push(tag);
      }
    }

    return tags.join(', ') || 'ambient, instrumental';
  }

  // 查询生成状态
  async queryGenerationStatus(taskIds) {
    try {
      return await sunoApi.queryGenerationStatus(taskIds);
    } catch (error) {
      console.error('查询生成状态失败:', error);
      throw error;
    }
  }

  // 获取用户生成的音乐历史
  async getUserMusicHistory(page = 1, limit = 20) {
    try {
      return await sunoApi.getAllGeneratedMusic(page, limit);
    } catch (error) {
      console.error('获取音乐历史失败:', error);
      throw error;
    }
  }

  // 下载生成的音乐
  async downloadMusic(audioUrl, title) {
    try {
      return await sunoApi.downloadSong(audioUrl, title);
    } catch (error) {
      console.error('下载音乐失败:', error);
      throw error;
    }
  }

  // 删除生成的音乐
  async deleteGeneratedMusic(taskId) {
    try {
      return await sunoApi.deleteGeneratedMusic(taskId);
    } catch (error) {
      console.error('删除音乐失败:', error);
      return false;
    }
  }

  getCurrentUserId() {
    // 从localStorage或context中获取用户ID
    return localStorage.getItem('userId') || 'anonymous';
  }
}

export default new AIService();