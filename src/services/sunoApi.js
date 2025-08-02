// src/services/sunoApi.js
const SUNO_API_URL = 'https://api.sunoapi.org/api/v1';
const SUNO_API_TOKEN = '74126cb41a9bd93283d4a2d612707483';
const CALLBACK_URL = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com';

class SunnoApiService {
  constructor() {
    this.baseUrl = SUNO_API_URL;
    this.token = SUNO_API_TOKEN;
    this.callbackUrl = CALLBACK_URL;
  }

  // 测试API连接
  async testConnection() {
    try {
      // 尝试一个简单的生成请求来测试连接
      const testRequestBody = {
        customMode: false,
        instrumental: false,
        model: 'V3_5',
        callBackUrl: this.callbackUrl,
        prompt: 'test connection',
        title: 'test',
        tags: 'test'
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API连接测试失败:', errorText);
        throw new Error(`API连接测试失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API连接测试成功:', data);
      return { success: true, data };
    } catch (error) {
      console.error('API连接测试失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 直接生成音乐
  async generateMusic(params) {
    try {
      const requestBody = {
        customMode: false,
        instrumental: false,
        model: params.model || 'V3_5',
        callBackUrl: this.callbackUrl,
        prompt: params.prompt
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // 检查API响应格式
      console.log('Suno API响应:', data);
      
      if (data.error) {
        throw new Error(`API错误: ${data.error}`);
      }
      
      // 更宽松的响应格式检查
      console.log('API响应详细内容:', JSON.stringify(data, null, 2));
      
      // 检查是否有任何可能的任务ID字段
      const hasTaskId = data.data || data.taskIds || data.id || data.task_id || data.taskId || data.task;
      if (!hasTaskId) {
        console.warn('API响应中未找到任务ID字段，但继续处理...');
      }
      
      return data;
    } catch (error) {
      console.error('生成音乐失败:', error);
      throw error;
    }
  }

  // 自定义模式生成音乐（支持自定义歌词）
  async generateCustomMusic(params) {
    try {
      const requestBody = {
        customMode: false,
        instrumental: false,
        model: params.model || 'V3_5',
        callBackUrl: this.callbackUrl,
        prompt: params.prompt
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // 检查API响应格式
      console.log('Suno API响应:', data);
      
      if (data.error) {
        throw new Error(`API错误: ${data.error}`);
      }
      
      return data;
    } catch (error) {
      console.error('自定义生成音乐失败:', error);
      throw error;
    }
  }

  // 基于参考音频生成音乐
  async generateMusicFromReference(params) {
    try {
      const requestBody = {
        customMode: false,
        instrumental: false,
        audioPath: params.referenceAudioUrl, // 参考音频URL
        prompt: params.prompt,
        model: params.model || 'V3_5',
        callBackUrl: this.callbackUrl
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // 检查API响应格式
      console.log('Suno API响应:', data);
      
      if (data.error) {
        throw new Error(`API错误: ${data.error}`);
      }
      
      return data;
    } catch (error) {
      console.error('基于参考音频生成失败:', error);
      throw error;
    }
  }

  // 查询音乐生成状态
  async queryGenerationStatus(taskIds) {
    try {
      const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
      
      // 使用正确的查询端点
      const results = [];
      
      for (const taskId of ids) {
        try {
          const endpoint = `${this.baseUrl}/generate/record-info?taskId=${taskId}`;
          console.log(`查询任务状态: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('查询状态成功:', data);
            
            // 处理API响应格式
            if (data.code === 200 && data.data) {
              results.push(data.data);
            } else {
              console.warn('API响应格式异常:', data);
            }
          } else {
            const errorText = await response.text();
            console.error(`查询任务 ${taskId} 失败: ${response.status} - ${errorText}`);
          }
        } catch (taskError) {
          console.error(`查询任务 ${taskId} 出错:`, taskError);
        }
      }
      
      return {
        data: results
      };
    } catch (error) {
      console.error('查询状态失败:', error);
      throw error;
    }
  }

  // 获取所有生成的音乐列表
  async getAllGeneratedMusic(page = 1, limit = 20) {
    try {
      // 尝试使用不同的端点名称
      const response = await fetch(`${this.baseUrl}/list?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // 如果list端点不存在，尝试其他可能的端点
        console.log('list端点不存在，尝试其他端点...');
        return { data: [], message: '列表功能暂不可用' };
      }

      return await response.json();
    } catch (error) {
      console.error('获取音乐列表失败:', error);
      return { data: [], message: '获取列表失败' };
    }
  }

  // 下载音乐文件
  async downloadSong(audioUrl, title = 'generated_music') {
    try {
      const response = await fetch(audioUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
      }
      throw new Error('下载失败');
    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  }

  // 删除生成的音乐（如果API支持）
  async deleteGeneratedMusic(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/delete?id=${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('删除音乐失败:', error);
      return false;
    }
  }
}

export default new SunnoApiService();