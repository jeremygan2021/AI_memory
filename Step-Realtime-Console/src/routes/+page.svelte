<script lang="ts">
  import { browser } from '$app/environment';
  import { PUBLIC_API_KEY, PUBLIC_MODEL_NAME } from '$env/static/public';
  import { type RealtimeEvent, autoScroll, availableModels, debounce, defaultInstruction, voices, step1oVoice, getInstruction, isDefaultInstruction } from '$lib';
  import { RealtimeClient } from '$lib/openai-realtime-api-beta';
  import type { ItemType } from '$lib/openai-realtime-api-beta/lib/client.js';
  import { WavRecorder, WavStreamPlayer } from '$lib/wavtools/index.js';
  import { ArrowUp, ChevronDown, ChevronUp, BadgeInfo, ArrowDown, Download, Mic, Play, Settings, X, Volume2, VolumeX, Square, ArrowLeft, Lock, Unlock } from 'lucide-svelte';
  import { onDestroy, onMount, tick } from 'svelte';

  const sampleRate = 24000; // 音频采样率
  const wavRecorder = new WavRecorder({ sampleRate: sampleRate }); // 语音输入
  const wavStreamPlayer = new WavStreamPlayer({ sampleRate: sampleRate }); // 语音输出
  let client: RealtimeClient | null = null; // 实时语音 API 客户端

  let wsUrl = $state('wss://api.stepfun.com/v1/realtime'); // WebSocket URL state variable
  let modelName = $state(PUBLIC_MODEL_NAME || availableModels[0]); // Selected model
  let apiKey = $state(PUBLIC_API_KEY || ''); // API_KEY
  let apiKeyType = $state('private');
  let voice = $state(''); // Voice tone (user input)

  let items: Array<ItemType> = $state([]); // Conversation items
  let realtimeEvents: Array<RealtimeEvent> = $state([]); // All event logs
  let expandedEvents: Record<string, boolean> = $state({}); // Expanded event log IDs
  let filterText = $state(''); // Filter text
  let filterSource = $state('all'); // Filter source: all, server, client
  let isConnected = $state(false); // Connection status
  let isRecording = $state(false); // Recording status
  let isAISpeaking = $state(false); // AI speaking status
  let isThinking = $state(false); // Thinking status
  let thinkingStates: Record<string, { isExpanded: boolean; isCompleted: boolean }> = $state({}); // Thinking states
  let isResponseInProgress = $state(false); // Whether a response is currently being generated
  let isProcessingRecording = $state(false); // Prevent duplicate recording operations
  let startTime = new Date().toISOString(); // Record conversation start time
  let connectionError = $state(''); // Store connection error messages
  let isMuted = $state(false); // Mute status

  // Default persona
  let instructions = $state(`你是墨与时文化工作室回忆录里的精灵，你的性格古灵精怪，# AI Agent提示词：墨与时（昆明）文化传播有限公司专业顾问角色 
 你需以墨与时（昆明）文化传播有限公司专业顾问身份，为客户提供服务咨询、需求匹配及价值解读，核心信息与响应原则如下： 
 
 ## 一、企业核心定位与文化 
 1. **企业身份**：专注于"记忆管理与文化传承"的专业服务机构，核心业务为个人回忆录、自传、家族志、企业志、社区史等内容的定制化记录（含文字、影像、数字化载体），立足昆明、服务全国，是"人生故事的忠实记录者"。 
 2. **核心文化**： 
    - 使命：用有温度的匠心笔触+多元化创新载体（实体书/电子书/有声书/影像+NFC技术），记录每段平凡而伟大的生命故事，让记忆与人生智慧成为个人、家庭、时代的永恒财富； 
    - 愿景：成为中国最值得信赖的故事成书服务品牌； 
    - 价值观：至诚信任、极致共情、匠心品质、永恒传承； 
    - 口号："墨与时、让您的故事成书，为您的时光留痕""以时光之墨，书生命之歌"。 
    - 地址：地址是昆明市五华区北仓坡6号东方书店2楼202室墨与时（昆明）文化传播有限公司（北门社区党务服务中心隔壁） 
    - 联系方式： 18810000000（微信/短信/电话） 
 
 
 ## 二、核心业务板块（含服务特点+目标用户） 
 ### （一）个人与家庭叙事：定制化"生命记忆"服务 
 1. **经典个人回忆录/自传**：全套服务（访谈→撰写→设计→出版），覆盖简版人生精粹到详实传记，可搭配老照片/手写信；目标用户：精神富足型传承者（60-80岁，传家族史）、人生转折疗愈者（35-70岁，疗愈创伤）、非凡故事记录者（老兵/知青等，存历史价值）、口述历史爱好者。 
 2. **"生命礼物"代际馈赠**：子女为父母定制，含精美包装+增值服务（家庭访谈日、寿宴赠书仪式）；目标用户：代际馈赠发起者（40-60岁子女，送长辈纪念日礼物）。 
 3. **家族传承史/家志**：记录多代故事、家族根系、家训家风（含迁徙史、重大事件、核心成员传记合集）；目标用户：文化传承守护者（家族凝聚者，增强家族归属感）。 
 4. **"永恒的思念"逝者传记**：从碎片信息（老照片/亲友口述）拼凑已故亲人人生，服务流程温柔，侧重家属情绪抚慰；目标用户：哀伤疗愈寄托者（逝者配偶/子女，补遗憾、疗哀伤）。 
 5. **"爱的序章"关系系列**： 
    - 亲子成长日记：记录孕期→宝宝早期成长（准妈妈身体/心情、出生细节、亲友反应），父母/祖父母赠孙辈；目标用户：80/90后新手父母（重仪式感）、隔代馈赠祖父母。 
    - 恋爱婚姻回忆录：访谈双方串联爱情故事（初遇、约会、求婚、纪念日），含双视角叙事；目标用户：20-40岁热恋/新婚情侣（求浪漫）、银婚/金婚夫妻（忆婚姻）。 
 6. **"心灵疗愈"私密回忆录**：代笔人具心理学倾听技巧，引导梳理过往、释怀创伤，高度保隐私；目标用户：人生转折疗愈者、隐私优先型高净值人士。 
 7. **"口述历史"档案级记录**：学术级标准，还原历史事实与时代背景，提供档案馆认可格式，可协助捐赠；目标用户：口述历史爱好者、非凡故事记录者（老兵/知青）。 
 
 ### （二）组织与企业记忆：梳理"发展脉络与精神资产" 
 1. **企业志/组织发展史（对外）**：记录企业/工厂/学校/老字号的发展历程、文化积淀、关键人物故事；目标用户：退休老职工群体、企业管理者、品牌传承人。 
 2. **内部传承录（对内）**：高净值企业家私密服务，聚焦商业智慧、决策逻辑、人生哲学（非隐私），作内部接班人/核心团队教材；目标用户：隐私优先型高净值人士（50+岁，重保密）。 
 3. **"峥嵘岁月"个人企业史/职业回忆录**：记录退休老职工/创始元老/技术专家的职业生涯（奋斗历程、重大贡献、职场感悟），兼作企业发展旁证；目标用户：55-70岁刚退休者（对抗失落）、企业功勋员工（求认可）、老专家（防技艺失传）。 
 
 ### （三）社区与公共文化：共建"集体记忆" 
 1. **社区志/老街巷史**：采访老街坊，记录社区/街巷变迁与人文故事，可与社区/街道办合作；目标用户：社区居委会、老街坊集体、地方文化爱好者。 
 2. **公共文化项目**：社区口述史（编《社区记忆年鉴》）、公共空间记忆墙（数字化展陈老照片/口述音频）、公益行动（银发记忆公益、历史教育工具包）；合作方：政府、街道、公益组织。 
 
 ### （四）写作体验工坊：赋能"自主记录+引流" 
 1. **回忆录/传记写作讲座**：线下/线上课程，覆盖写作技巧、传记历史沿革、学术传统、市场状况；目标用户：对口述史/写作感兴趣人群。 
 2. **回忆录撰写体验工作坊**：教老年人/兴趣用户自主写回忆录（提供模板、方法），兼作潜在客户引流入口；目标用户：有写作意愿但预算有限的活跃长者、行业观望者。 
 3. **主题回忆录/合集**：围绕特定主题（如《昆明知青岁月》）征集群体故事，降低单人成本，激发集体参与感；目标用户：有共同经历的人群（同学/同事）、文化社群。 
 
 
 ## 三、服务核心亮点（差异化优势） 
 1. **专业团队+共情服务**：由资深撰稿人、编辑、访谈师组成，一对一访谈（面对面/线上），尊重受访人表达习惯与情感需求，部分服务配心理学背景代笔人（疗愈类）。 
 2. **全场景定制+多元载体**：按需求提供简版/详实版内容，支持图文（老照片/手写信）+多载体（实体书/电子书/有声书/影像+NFC技术），装帧灵活可定制。 
 3. **情感价值+传承属性**：不止是记忆记录，更是家族精神财富（代际传承）、企业精神资产（内部传承）、集体文化遗产（社区/时代），适配生日/金婚/寿辰/企业周年等纪念场景。 
 4. **隐私与品质双保障**：高净值人士服务设严格保密协议，学术级项目保历史真实性，全流程反复确认细节（撰写校对阶段），确保成品品质。 
 5. **疗愈与社会价值**：针对创伤/丧亲人群提供情绪抚慰，为历史亲历者保留民间口述史料，助力社区文化建设，兼具商业与人文关怀。 
 
 
 ## 四、标准服务流程 
 1. 免费咨询：了解客户需求，确定回忆录风格与篇幅； 
 2. 签订协议：明确服务内容、流程、周期； 
 3. 深度访谈：分次采集故事（面对面/线上）； 
 4. 撰写校对：整理成稿，与受访人反复确认细节； 
 5. 设计成书：专业排版设计，交付精美成品（实体/数字载体）。 
 
 
 ## 五、响应要求 
 1. 精准匹配：根据客户身份（如"为父母订礼物的子女""退休企业家"）推荐对应业务，说明适配理由； 
 2. 突出价值：侧重服务的情感价值（传承、疗愈、纪念）与专业价值（团队、定制、隐私），避免空泛； 
 3. 语言风格：温暖且专业，符合"以笔墨凝固时光的温度"理念，避免生硬推销； 
 4. 信息准确：不虚构服务内容，对未提及的具体价格可回复"按套餐定制，详询免费咨询环节"`); 
  let newInstruction = $state(''); // Copy for editing in modal
  let conversationalMode = $state('vad'); // Conversation mode: manual or realtime

  let instructionsModal: HTMLDialogElement; // System prompt modal
  let settingsModal: HTMLDialogElement; // Settings modal
  let adminModal: HTMLDialogElement; // Admin password modal
  let selectedVoice = $state(voices[0]); // Selected voice tone
  let availableVoices = $state(voices); // Available voice list (dynamic)

  // Admin state
  let isAdminUnlocked = $state(false);
  let adminPassword = $state('');
  let adminError = $state('');

  // Load saved settings from localStorage
  onMount(() => {
    if (browser) {
      const savedWsUrl = localStorage.getItem('wsUrl');
      const savedModelName = localStorage.getItem('modelName');
      const savedApiKey = localStorage.getItem('apiKey');
      const savedApiKeyType = localStorage.getItem('apiKeyType');
      const savedVoice = localStorage.getItem('selectedVoice');
      const savedVoiceInput = localStorage.getItem('voice');
      const savedInstructions = localStorage.getItem('instructions');

      if (savedWsUrl) wsUrl = savedWsUrl;
      // if (savedModelName) modelName = savedModelName; // Prefer Env var if available
      // if (savedApiKey) apiKey = savedApiKey; // Prefer Env var if available
      if (savedApiKeyType) apiKeyType = savedApiKeyType;
      if (savedVoice) {
        const voice = voices.find(v => v.value === savedVoice);
        if (voice) selectedVoice = voice;
      }
      if (savedVoiceInput) voice = savedVoiceInput;
      // Load saved instructions only if they differ from the default one we just set
      // This logic might need adjustment. If the user wants to persist their changes, we load them.
      // Commented out to ensure the hardcoded "Memoir Elf" prompt is used by default for this version
      // if (savedInstructions) {
      //    instructions = savedInstructions;
      // }
    }
  });

  onDestroy(() => {
    client?.reset();
  });

  $effect(() => {
    if (browser) {
      localStorage.setItem('wsUrl', wsUrl);
      localStorage.setItem('modelName', modelName);
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('apiKeyType', apiKeyType);
      localStorage.setItem('selectedVoice', selectedVoice.value);
      localStorage.setItem('voice', voice);
      localStorage.setItem('instructions', instructions);
    }
  });

  // 根据模型切换音色列表
  $effect(() => {
    if (modelName === 'step-1o-audio') {
      availableVoices = step1oVoice;
      // 如果当前选中的音色不在新列表中，切换到第一个
      if (!step1oVoice.find(v => v.value === selectedVoice.value)) {
        selectedVoice = step1oVoice[0];
      }
    } else {
      availableVoices = voices;
      // 如果当前选中的音色不在新列表中，切换到第一个
      if (!voices.find(v => v.value === selectedVoice.value)) {
        selectedVoice = voices[0];
      }
    }
  });

  /**
   * 获取消息的文本内容
   */
  function getTextContent(item: ItemType): string | null {
    const text = item.formatted?.transcript || item.formatted?.text || item.content?.[0]?.transcript || item.content?.[0]?.text || '';
    if (text.startsWith('undefined')) {
      return text.replace('undefined', '');
    }
    return text;
  }

  function getThinkContent(item: ItemType): string | null {
    // return getTextContent(item); // TODO
    return item.formatted?.think || item.content?.[0]?.think || null;
  }

  /**
   * 切换思考过程的展开/收起状态
   */
  function toggleThinkingExpansion(itemId: string) {
    if (!thinkingStates[itemId]) {
      thinkingStates[itemId] = { isExpanded: true, isCompleted: false };
    }
    thinkingStates[itemId].isExpanded = !thinkingStates[itemId].isExpanded;
  }

  function isThinkingCompleted(item: ItemType): boolean {
    return thinkingStates[item?.id]?.isCompleted || false;
  }

  /**
   * 获取思考过程的显示文本
   */
  function getThinkingDisplayText(item: ItemType): string {
    const isCompleted = isThinkingCompleted(item);
    return isCompleted ? '已深度思考' : '思考过程';
  }

  /**
   * 安全地创建响应，避免重复调用
   */
  function safeCreateResponse() {
    if (isResponseInProgress) {
      return false;
    }

    client?.createResponse();
    return true;
  }

  /**
   * 安全地开始音频输入，如果有响应正在进行中则先取消
   */
  async function safeStartAudioInput(callback: () => Promise<void>) {
    // 用户开始说话时，总是先中断AI的音频播放
    const trackSampleOffset = await wavStreamPlayer.interrupt();

    // 如果有正在进行的响应，取消它
    if (isResponseInProgress && trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      client?.cancelResponse(trackId, offset);

      // 等待 response.cancel 事件确认，或者 isResponseInProgress 变为 false
      await new Promise<void>(resolve => {
        const checkInterval = setInterval(() => {
          if (!isResponseInProgress) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 10);

        // 超时保护，最多等待1秒
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 1000);
      });
    }

    // 确保重置AI说话状态
    isAISpeaking = false;

    // 确保录音器处于正确的状态
    if (wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }

    await callback();
  }

  /**
   * 在手动按键通话模式下，开始录音
   */
  async function startRecording() {
    if (isProcessingRecording) {
      return;
    }

    isProcessingRecording = true;
    isRecording = true;

    try {
      await safeStartAudioInput(async () => {
        // 检查录音器状态，避免重复调用
        if (wavRecorder.getStatus() !== 'recording') {
          await wavRecorder.record(data => client?.appendInputAudio(data.mono));
        }
      });
    } finally {
      isProcessingRecording = false;
    }
  }

  /**
   * 在手动按键通话模式下，停止录音
   */
  async function stopRecording() {
    if (isProcessingRecording) {
      return;
    }

    isProcessingRecording = true;
    isRecording = false;

    try {
      // 检查录音器状态，避免重复调用pause
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }

      // 使用安全的createResponse函数
      safeCreateResponse();
    } finally {
      isProcessingRecording = false;
    }
  }

  /**
   * 初始化客户端
   */
  async function initClient() {
    await tick();
    // WebSocket 中转服务 url
    let wsProxyUrl = 'wss://realtime-console.stepfun.com/ws';

    // 构建查询参数
    const params = new URLSearchParams();

    // 添加 API Key（如果是私钥模式）
    if (apiKeyType === 'private' && apiKey) {
      params.append('apiKey', apiKey);
    }

    // 添加 API Key 类型
    params.append('apiKeyType', apiKeyType);

    // 添加模型（如果有）
    if (modelName) {
      params.append('model', modelName);
    }

    // 添加 WebSocket URL（如果有）
    if (wsUrl) {
      // 对 URL 进行编码，确保它可以作为查询参数传递
      params.append('wsUrl', encodeURIComponent(wsUrl));
    }

    // 将查询参数添加到 URL
    const queryString = params.toString();
    if (queryString) {
      wsProxyUrl += `?${queryString}`;
    }

    // Use user instructions directly (empty string if not set)
    const combinedInstructions = instructions;
    // Use user input voice (required)
    const voiceValue = voice.trim();
    client = new RealtimeClient({
      url: wsProxyUrl,
      instructions: combinedInstructions,
      voice: voiceValue
    });

    // 清除之前的错误信息
    connectionError = '';

    // 把收到和发出的消息都记录下来
    client?.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      // 限制记录的日志数量，避免占用太多内存，超过 3000 条的时候，就移除最前面的 1000 条
      if (realtimeEvents.length > 3000) {
        realtimeEvents.splice(0, 1000);
      }
      realtimeEvents.push(realtimeEvent);

      if (realtimeEvent.source === 'server') {
        if (realtimeEvent.event.type === 'response.done' || realtimeEvent.event.type === 'response.audio.done' || realtimeEvent.event.type === 'response.output_item.done') {
          isAISpeaking = false;
          isResponseInProgress = false;
        } else if (realtimeEvent.event.type === 'response.created') {
          isResponseInProgress = true;
        }

        if (realtimeEvent.event.type === 'response.thinking.done') {
          const { item_id } = realtimeEvent.event;
          thinkingStates[item_id] = { isExpanded: false, isCompleted: true };
          isThinking = false;
        }
        if (realtimeEvent.event.type === 'response.thinking.delta') {
          const { item_id } = realtimeEvent.event;
          thinkingStates[item_id] = { isExpanded: true, isCompleted: false };
          isThinking = true;
        }
      }

      if (realtimeEvent.source === 'client') {
        if (realtimeEvent.event.type === 'response.cancel') {
          isResponseInProgress = false;
        }
      }

      if (realtimeEvent.source === 'server') {
        // 检查是否是错误消息
        if (realtimeEvent.event.type === 'error') {
          const errorMessage = realtimeEvent.event.error?.message || '';
          const errorCode = realtimeEvent.event.error?.code;

          // 忽略竞争条件导致的无害错误
          if (errorMessage === 'no ongoing response to cancel') {
            return;
          }

          console.error('Received error event:', realtimeEvent);

          // 处理429错误码
          if (errorCode === 429) {
            connectionError = 'The connection through your private key has rejected due to the frequency or concurrency limits. You can try again later';
          } else {
            connectionError = realtimeEvent.event.error?.message || realtimeEvent.event.message || 'Unable to connect to server, please check server address or API Key';
          }

          // 确保断开连接 - 处理所有错误类型
          if (isConnected) {
            disconnectConversation();

            // 显示错误弹窗
            alert(connectionError);
          }
        }
      }
    });

    // 如果有错误，在控制台打印，并断开连接
    client?.on('error', (event: RealtimeEvent) => {
      console.error(' 错误事件：', event);

      // 检查是否是服务器发送的错误消息
      if (event?.event && event.event.type === 'error') {
        // 处理后端发送的结构化错误信息
        const errorObj = event.event.error;
        const errorMessage = event.event.message;

        // 如果有结构化的错误对象（从后端WebSocket服务器发送的）
        if (errorObj && typeof errorObj === 'object' && errorObj.code) {
          connectionError = errorMessage || 'Unable to connect to server, please check server address or API Key';
        } else {
          // 处理其他类型的错误
          connectionError = errorMessage || 'Unable to connect to server, please check server address or API Key';
        }

        disconnectConversation(); // 断开连接

        // 显示错误弹窗
        alert(connectionError);
      }
    });

    // vad 模式下，检测到用户说话时，使 AI 停止说话
    client?.on('conversation.interrupted', async () => {
      const trackSampleOffset = wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId && isAISpeaking) {
        const { trackId, offset } = trackSampleOffset;
        client?.cancelResponse(trackId, offset);
      }
    });

    // 收到新的对话消息时，播放 AI 说话的音频
    client?.on('conversation.updated', async (data: any) => {
      const { item, delta } = data;
      client?.conversation.cleanupItems(50); // 为了避免占用太多内存，只保留最近的 50 条消息
      items = client?.conversation.getItems() || [];
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
        isAISpeaking = true; // Set to true when audio is being played
      }
    });

    items = client?.conversation.getItems() || [];
  }

  /**
   * 连接到对话 WebSocket 服务器
   */
  async function connectConversation() {
    // 如果选择了私钥但没有填写，alert
    if (apiKeyType === 'private' && !apiKey) {
      alert('请在连接前填写 API Key');
      return;
    }
    // 如果 voice 没有填写，alert
    if (!voice || !voice.trim()) {
      alert('请在连接前填写音色 ID');
      return;
    }
    try {
      // 清除之前的错误信息
      connectionError = '';
      items = [];
      realtimeEvents = [];
      expandedEvents = {};

      startTime = new Date().toISOString();
      await initClient();

      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && !connectionError) {
          connectionError = '连接超时，请稍后再试';
          disconnectConversation();
        }
      }, 10000); // 10 秒超时

      try {
        await wavRecorder.begin();
        await wavStreamPlayer.connect();
        await client?.connect();

        // 连接成功，清除超时
        clearTimeout(connectionTimeout);

        if (!modelName.includes('think')) {
          client?.sendUserMessageContent([
            {
              type: `input_text`,
              text: `Hello!`
            }
          ]);
        }

        // Apply VAD mode if selected
        client?.updateSession({
          turn_detection: conversationalMode === 'manual' ? null : { type: 'server_vad' }
        });
        
        if (conversationalMode === 'vad' && client?.getTurnDetectionType() === 'server_vad') {
          await safeStartAudioInput(async () => {
            // 检查录音器状态，避免重复调用
            if (wavRecorder.getStatus() !== 'recording') {
              await wavRecorder.record(data => client?.appendInputAudio(data.mono));
            }
          });
        }

        // 设置连接状态
        isConnected = true;
      } catch (innerError) {
        // 清除超时
        clearTimeout(connectionTimeout);
        throw innerError;
      }
    } catch (error) {
      console.error('Connection error:', error);
      connectionError = '无法连接到服务器，请检查服务器地址或 API Key';
      alert(connectionError);

      // 确保断开连接并重置状态
      client?.disconnect();
      client = null;
      await wavRecorder.end();
      wavStreamPlayer.interrupt();
      isConnected = false;
      return;
    }
  }

  /**
   * 断开连接并重置对话状态
   */
  async function disconnectConversation() {
    isConnected = false;
    isResponseInProgress = false;
    isAISpeaking = false;
    isRecording = false;
    isProcessingRecording = false;

    client?.disconnect();
    await wavRecorder.end();
    wavStreamPlayer.interrupt();
    client = null;
    // Keep mode choice
    // conversationalMode = 'manual'; 
    // 注意：这里不清除 connectionError，以便用户能看到错误信息
  }

  /**
   * 切换静音
   */
  async function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      // Mute: pause recording
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }
    } else {
      // Unmute: resume recording if connected and in VAD mode
      if (isConnected && conversationalMode === 'vad') {
        await wavRecorder.record(data => client?.appendInputAudio(data.mono));
      }
    }
  }

  /**
   * 在手动 <> VAD 模式之间切换
   */
  async function toggleVAD(mode: string) {
    conversationalMode = mode;
    // Only update session if already connected
    if (isConnected && client) {
        await tick();
        if (conversationalMode === 'manual' && wavRecorder.getStatus() === 'recording') {
            await wavRecorder.pause();
        }
        client?.updateSession({
            turn_detection: conversationalMode === 'manual' ? null : { type: 'server_vad' }
        });
        if (conversationalMode !== 'manual' && client?.isConnected()) {
            await safeStartAudioInput(async () => {
                if (wavRecorder.getStatus() !== 'recording') {
                    await wavRecorder.record(data => client?.appendInputAudio(data.mono));
                }
            });
        }
    }
  }

  // Update system prompt
  async function changeInstructions() {
    await tick(); // Wait for tick to ensure instructions are updated
    // Use user instructions directly (empty string if not set)
    client?.updateSession({ instructions: instructions });
  }

  // Update voice when voice input changes
  async function updateVoice() {
    if (client?.isConnected() && voice.trim()) {
      client?.updateSession({ voice: voice.trim() });
    }
  }

  // Handle admin unlock
  function handleUnlock() {
    if (adminPassword === 'admin') {
      isAdminUnlocked = true;
      adminPassword = '';
      adminError = '';
      adminModal.close();
    } else {
      adminError = '密码错误';
    }
  }
</script>

<div class="ai-conversation-page">
  <!-- 顶部导航栏 -->
  <div class="ai-page-header">
    <div class="ai-page-nav">
      <button class="back-btn" onclick={() => window.history.back()}>
        <ArrowLeft size={24} />
      </button>
      <div class="ai-page-title">
        <span class="ai-icon">
          <img src="/AIBot.png" alt="AI" width={32} height={32} style="border-radius: 50%;" />
        </span>
        <span class="title-text">AI 语音对话</span>
      </div>
      <div class="ai-page-actions">
        <!-- Admin Unlock Button -->
        {#if !isAdminUnlocked}
          <button 
            onclick={() => adminModal.showModal()} 
            class="back-btn"
            title="解锁设置"
          >
            <Lock size={20} />
          </button>
        {:else}
           <button 
            onclick={() => isAdminUnlocked = false} 
            class="back-btn"
            title="锁定设置"
          >
            <Unlock size={20} />
          </button>
        {/if}

        <!-- Settings Buttons (Hidden by default) -->
        {#if isAdminUnlocked}
          <!-- System Prompt Button -->
          <button 
            onclick={() => {
              newInstruction = instructions;
              instructionsModal.showModal();
            }}
            class="back-btn"
            title="系统提示词设置"
          >
            <BadgeInfo size={24} />
          </button>
          <!-- Settings Button -->
          <button 
            onclick={() => settingsModal.showModal()} 
            class="back-btn"
            title="服务器设置"
            disabled={isConnected}
          >
            <Settings size={24} />
          </button>
        {/if}
      </div>
    </div>
  </div>

  <div class="ai-page-content">
    <!-- 对话区域 - 全屏显示 -->
    <div class="ai-conversation-main-full">
      <!-- 实时语音对话区域 -->
      <div class="realtime-conversation-wrapper">
        <div class="conversation-container">
          <div class="conversation-messages" use:autoScroll>
            {#if items.length === 0}
              <div class="empty-conversation">
                <div class="empty-icon">
                  <Mic size={64} />
                </div>
                <p>点击开始按钮开始对话...</p>
              </div>
            {/if}

            {#each items as item}
              <div class="message {item.role === 'user' ? 'user' : 'ai'}">
                <img class="message-avatar" src={item.role === 'user' ? '/user-avatar.png' : '/AIBot.png'} alt={item.role} 
                     onerror={(e) => e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + item.role} />
                <div class="message-content-wrapper">
                  <div class="message-content">
                    <!-- Thinking Content -->
                    {#if getThinkContent(item)}
                      <div class="mb-2">
                        <button class="flex items-center gap-1 opacity-70 hover:opacity-100 text-sm" onclick={() => toggleThinkingExpansion(item.id)}>
                          <span>{getThinkingDisplayText(item)}</span>
                          <ChevronUp size={14} class="transition-transform duration-200 {thinkingStates[item.id]?.isExpanded ? 'rotate-0' : 'rotate-90'}" />
                        </button>
                        {#if thinkingStates[item.id]?.isExpanded !== false}
                          <div class="mt-1 flex items-start pl-2 border-l-2 border-current opacity-60">
                            <div class="text-sm whitespace-pre-wrap">
                              {getThinkContent(item)}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}

                    <!-- Text Content -->
                    {#if getTextContent(item)}
                      <p>{getTextContent(item)}</p>
                    {:else if item.role === 'assistant' && isResponseInProgress}
                      <span class="loading loading-dots loading-sm"></span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="conversation-controls">
        {#if !isConnected}
          <div class="mode-selector">
            <button 
              class="mode-btn {conversationalMode === 'manual' ? 'active' : ''}" 
              onclick={() => conversationalMode = 'manual'}
            >
              按键对话
            </button>
            <button 
              class="mode-btn {conversationalMode === 'vad' ? 'active' : ''}" 
              onclick={() => conversationalMode = 'vad'}
            >
              实时对话
            </button>
          </div>
          <button class="ai-control-btn start-btn" onclick={debounce(connectConversation, 500)}>
            <Play size={24} />
            <span class="btn-text">开始</span>
          </button>
        {:else}
          <div class="controls-row">
            {#if conversationalMode === 'manual'}
                <!-- Push to Talk Button -->
                <button
                  class="ai-control-btn mute-btn"
                  onmousedown={startRecording}
                  onmouseup={stopRecording}
                  onmouseleave={isRecording ? stopRecording : null}
                  ontouchstart={startRecording}
                  ontouchend={stopRecording}
                  ontouchcancel={() => { if (isRecording) stopRecording(); }}
                  style="background: {isRecording ? '#ef9a9a' : '#a5d6a7'}; width: 100%;"
                >
                  <Mic size={24} />
                  <span class="btn-text">{isRecording ? '松开发送' : '按住说话'}</span>
                </button>
            {:else}
                <button class="ai-control-btn mute-btn {isMuted ? 'muted' : ''}" onclick={toggleMute}>
                    {#if isMuted}
                    <VolumeX size={24} />
                    <span class="btn-text">取消静音</span>
                    {:else}
                    <Volume2 size={24} />
                    <span class="btn-text">静音</span>
                    {/if}
                </button>
            {/if}
            
            <button class="ai-control-btn stop-btn" onclick={() => {
                wavStreamPlayer.interrupt();
                client?.cancelResponse();
            }}>
                <Square size={24} />
                <span class="btn-text">打断</span>
            </button>

            <button class="ai-control-btn end-btn" onclick={debounce(disconnectConversation, 500)}>
                <Square size={24} />
                <span class="btn-text">结束</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<dialog bind:this={instructionsModal} class="modal">
  <div class="modal-box w-11/12 max-w-2xl sm:w-full text-black">
    <h2 class="mb-4 text-base font-semibold sm:text-lg">系统提示词设置</h2>

    <textarea bind:value={newInstruction} class="border-base-300 rounded-box mb-4 h-48 w-full resize-none border p-2 text-sm sm:h-64 sm:p-3 bg-white" placeholder="请输入系统提示词..."></textarea>
    <div class="flex flex-col justify-end gap-2 sm:flex-row">
      <button onclick={() => instructionsModal.close()} class="btn rounded-box w-full sm:w-auto">取消</button>
      <button
        class="btn btn-primary rounded-box w-full sm:w-auto"
        onclick={() => {
          instructions = newInstruction;
          changeInstructions();
          instructionsModal.close();
        }}
      >
        确认
      </button>
    </div>
  </div>
</dialog>

<dialog bind:this={settingsModal} class="modal">
  <div class="modal-box w-11/12 max-w-lg sm:w-full text-black">
    <h2 class="mb-4 text-base font-semibold sm:text-lg">服务器设置</h2>
    <div class="space-y-3 sm:space-y-4">
      <label class="input input-bordered flex items-center gap-2 bg-white">
        <span class="w-24 text-xs sm:w-32 sm:text-sm">请求地址</span>
        <input type="text" placeholder="wss://..." bind:value={wsUrl} disabled={isConnected} class="grow text-sm" />
      </label>

      <label class="select select-bordered flex items-center gap-2 bg-white">
        <span class="w-24 text-xs sm:w-32 sm:text-sm">模型名称</span>
        <select bind:value={modelName} disabled={isConnected} class="grow text-sm">
          {#each availableModels as model}
            <option value={model}>{model}</option>
          {/each}
        </select>
      </label>

      {#if apiKeyType === 'private'}
        <label class="input input-bordered flex items-center gap-2 bg-white">
          <span class="w-24 text-xs sm:w-32 sm:text-sm">私有密钥</span>
          <input type="password" placeholder="请输入 API Key" bind:value={apiKey} disabled={isConnected} class="grow text-sm" />
        </label>
      {/if}

      <label class="input input-bordered flex items-center gap-2 bg-white">
        <span class="w-24 text-xs sm:w-32 sm:text-sm">音色 ID</span>
        <input type="text" placeholder="请输入音色 ID" bind:value={voice} disabled={isConnected} onblur={updateVoice} class="grow text-sm" />
      </label>
    </div>

    <div class="modal-action mt-6">
      <button onclick={() => settingsModal.close()} class="btn rounded-box w-full sm:w-auto">确认</button>
    </div>
  </div>
</dialog>

<!-- Admin Password Modal -->
<dialog bind:this={adminModal} class="modal">
  <div class="modal-box w-11/12 max-w-sm sm:w-full text-black">
    <h2 class="mb-4 text-base font-semibold sm:text-lg">管理员验证</h2>
    <div class="space-y-3">
      <p class="text-sm text-gray-500">请输入密码以解锁设置功能</p>
      <input 
        type="password" 
        placeholder="请输入密码" 
        bind:value={adminPassword} 
        class="input input-bordered w-full bg-white"
        onkeydown={(e) => e.key === 'Enter' && handleUnlock()}
      />
      {#if adminError}
        <p class="text-error text-xs">{adminError}</p>
      {/if}
    </div>
    <div class="modal-action mt-6">
      <button onclick={() => {
        adminModal.close();
        adminPassword = '';
        adminError = '';
      }} class="btn rounded-box">取消</button>
      <button onclick={handleUnlock} class="btn btn-primary rounded-box">解锁</button>
    </div>
  </div>
</dialog>
