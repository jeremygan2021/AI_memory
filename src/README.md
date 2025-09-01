# AI Memory 项目结构

## 项目重新组织说明

本项目已按照页面功能重新组织文件结构，将相关页面和组件放在同一个文件夹中，提高代码的可维护性和可读性。

## 目录结构

```
src/
├── pages/                    # 页面文件夹
│   ├── AIConversation/       # AI对话页面及相关组件
│   │   ├── AIConversationPage.js
│   │   ├── AIConversationPage.css
│   │   ├── AIMusicGenerator.js
│   │   ├── AIMusicGenerator.css
│   │   ├── BookMemoryModule.js
│   │   ├── BookMemoryModule.css
│   │   ├── CommentSection.js
│   │   ├── CommentSection.css
│   │   ├── MemoryTimeline.js
│   │   └── MemoryTimeline.css
│   ├── RealtimeConversation/ # 实时对话页面
│   │   ├── RealtimeConversation.js
│   │   └── RealtimeConversation.css
│   ├── AudioLibrary/         # 音频库页面
│   │   ├── AudioLibrary.js
│   │   ├── AudioLibrary.css
│   │   ├── CloudAudioSelector.js
│   │   └── CloudAudioSelector.css
│   ├── Player/               # 播放器页面
│   │   ├── PlayerPage.js
│   │   └── PlayerPage.css
│   ├── VideoPlayer/          # 视频播放器页面
│   │   ├── VideoPlayerPage.js
│   │   └── VideoPlayerPage.css
│   ├── ImageViewer/          # 图片查看器页面
│   │   └── ImageViewerPage.js
│   ├── UploadMedia/          # 上传媒体页面
│   │   ├── UploadMediaPage.js
│   │   └── UploadMediaPage.css
│   ├── Record/               # 录音页面
│   │   ├── record.js
│   │   └── record.css
│   ├── Gallery/              # 画廊页面
│   │   ├── GalleryPage.js
│   │   └── GalleryPage.css
│   ├── Family/               # 家庭页面
│   │   ├── FamilyPage.js
│   │   └── FamilyPage.css
│   └── UserProfile/          # 用户资料页面
│       ├── UserProfilePage.js
│       └── UserProfilePage.css
├── components/               # 通用组件
│   ├── common/               # 通用组件
│   │   ├── ModernSearchBox.js
│   │   ├── ModernSearchBox.css
│   │   ├── SvgIcons.js
│   │   ├── UserCodeInput.js
│   │   └── UserCodeInput.css
│   ├── theme/                # 主题相关组件
│   │   ├── ThemeSwitcher.js
│   │   ├── ThemeSwitcher.css
│   │   ├── ThemeCloudTest.js
│   │   └── ThemedIcon.js
│   ├── navigation/           # 导航相关组件
│   │   ├── MiniProgramLayout.js
│   │   ├── MiniProgramLayout.css
│   │   ├── MiniProgramTabBar.js
│   │   └── MiniProgramTabBar.css
│   ├── utils/                # 工具组件
│   │   ├── StorageDebugger.js
│   │   ├── EnvironmentTest.js
│   │   ├── EnvironmentTest.css
│   │   ├── CommentTest.js
│   │   ├── CopyTest.js
│   │   ├── NavigationTest.js
│   │   └── NavigationTest.css
│   └── demo/                 # 演示组件
│       ├── SearchBoxDemo.js
│       └── SvgDemo.js
├── services/                 # 服务层
├── hooks/                    # 自定义Hooks
├── utils/                    # 工具函数
├── themes/                   # 主题配置
├── fonts/                    # 字体文件
├── asset/                    # 静态资源
├── App.js                    # 主应用组件
├── App.css                   # 主应用样式
├── index.js                  # 应用入口
└── index.css                 # 全局样式
```

## 主要改进

1. **页面组织**: 每个页面都有独立的文件夹，包含页面主文件和相关的组件
2. **组件分类**: 通用组件按功能分类到不同子文件夹
3. **导入路径**: 已更新所有导入路径以匹配新的文件结构
4. **可维护性**: 相关文件集中管理，便于维护和扩展

## 注意事项

- 所有导入路径已更新，确保项目能正常运行
- 页面间共享的组件放在 `components/` 文件夹中
- 主题相关组件集中在 `components/theme/` 文件夹
- 导航组件集中在 `components/navigation/` 文件夹
- 工具组件集中在 `components/utils/` 文件夹
