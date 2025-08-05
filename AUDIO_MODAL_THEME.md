# 音频列表弹窗主题跟随功能

## 功能概述

音频列表弹窗现在支持主题跟随功能，能够根据用户选择的主题自动调整颜色和样式。

## 实现特性

### 1. 主题变量支持
- 使用CSS变量 (`--theme-*`) 实现主题颜色动态切换
- 支持所有已定义的主题：清新绿意、温馨深邃、宇宙黑洞、深海蓝调、温暖黄昏、紫色梦境、粉色甜心

### 2. 弹窗样式主题化
- **弹窗背景**: 使用 `--theme-containerBg` 变量
- **弹窗阴影**: 使用 `--theme-cardShadow` 变量
- **弹窗边框**: 使用 `--theme-border` 变量
- **弹窗头部**: 使用 `--theme-primary` 和 `--theme-primaryHover` 渐变
- **文本颜色**: 使用 `--theme-textPrimary`、`--theme-textSecondary`、`--theme-textLight` 变量
- **按钮样式**: 使用 `--theme-buttonBg`、`--theme-buttonText`、`--theme-buttonHover` 变量

### 3. 音频项样式
- **普通状态**: 使用主题的次要文本颜色
- **激活状态**: 使用主题的主色调渐变背景
- **悬停效果**: 使用主题的主色调透明度变化
- **图标背景**: 跟随主题主色调变化

### 4. 响应式设计
- 移动端适配 (768px以下)
- 小屏幕适配 (480px以下)
- 横屏模式优化
- 保持所有主题下的良好显示效果

## 使用方法

1. **打开音频列表**: 当会话中有多个音频文件时，点击"选择音频"按钮
2. **切换主题**: 使用页面右上角的主题切换器选择不同主题
3. **查看效果**: 音频列表弹窗会自动跟随主题变化

## 主题效果示例

### 清新绿意主题 (默认)
- 绿色渐变背景
- 浅绿色容器背景
- 深绿色文本

### 温馨深邃主题
- 深蓝色渐变背景
- 米色容器背景
- 金色主色调

### 宇宙黑洞主题
- 深灰色渐变背景
- 深色容器背景
- 蓝色主色调

### 深海蓝调主题
- 蓝色渐变背景
- 浅蓝色容器背景
- 深蓝色主色调

### 温暖黄昏主题
- 橙色渐变背景
- 浅橙色容器背景
- 橙红色主色调

### 紫色梦境主题
- 紫色渐变背景
- 浅紫色容器背景
- 深紫色主色调

### 粉色甜心主题
- 粉色渐变背景
- 浅粉色容器背景
- 深粉色主色调

## 技术实现

### CSS变量映射
```css
.audio-modal-content {
  background: var(--theme-containerBg, #ffffe6);
  box-shadow: var(--theme-cardShadow, ...);
  border: 1px solid var(--theme-border, ...);
}

.audio-modal-header {
  background: linear-gradient(135deg, var(--theme-primary, #4ac967), var(--theme-primaryHover, #88d982));
  color: var(--theme-textLight, white);
}

.audio-modal-item.active {
  background: linear-gradient(135deg, var(--theme-primary, #4ac967), var(--theme-primaryHover, #88d982));
  color: var(--theme-textLight, white);
}
```

### 主题切换机制
- 通过 `applyTheme()` 函数设置CSS变量
- 使用 `window.dispatchEvent()` 触发主题变化事件
- 组件自动响应主题变化，无需重新渲染

## 兼容性

- ✅ 现代浏览器 (Chrome, Firefox, Safari, Edge)
- ✅ 移动端浏览器
- ✅ 支持CSS变量的所有设备
- ✅ 响应式设计适配各种屏幕尺寸

## 注意事项

1. 主题切换是即时的，无需刷新页面
2. 主题选择会保存到localStorage，下次访问时自动应用
3. 如果浏览器不支持CSS变量，会使用默认的绿色主题
4. 所有主题都经过测试，确保良好的对比度和可读性 