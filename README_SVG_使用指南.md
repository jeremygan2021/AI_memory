# SVG图标使用指南

## 快速开始

本项目已集成了SVG图标系统，您可以通过以下几种方式使用SVG图标：

## 方法1: 图标组件（推荐）

```jsx
import SvgIcon from './components/SvgIcons';

// 基本使用
<SvgIcon name="baby" />

// 自定义大小和颜色
<SvgIcon name="cloud" width={32} height={32} color="#3bb6a6" />

// 添加CSS类名
<SvgIcon name="microphone" className="my-icon" width={24} height={24} />
```

## 方法2: IMG标签加载SVG文件

```jsx
// 直接替换PNG为SVG文件
<img src="/images/baby2.svg" width="100" height="100" alt="宝宝图标" />
```

## 方法3: 内联SVG

```jsx
// 直接在JSX中写SVG代码
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" fill="#3bb6a6"/>
  <circle cx="9" cy="9" r="1.5" fill="white"/>
  <circle cx="15" cy="9" r="1.5" fill="white"/>
</svg>
```

## 可用图标

当前支持的图标名称：
- `baby` - 宝宝图标
- `cloud` - 云朵图标
- `microphone` - 麦克风图标
- `album` - 相册图标
- `time` - 时间图标
- `growth` - 成长图标

## 添加新图标

在 `src/components/SvgIcons.js` 文件中的 `icons` 对象里添加新图标：

```jsx
const icons = {
  // 现有图标...
  
  // 新图标
  newIcon: (
    <svg {...iconProps}>
      {/* SVG 路径和形状 */}
    </svg>
  )
};
```

## 优势

- ✅ 文件体积小
- ✅ 可动态改变颜色
- ✅ 可动态调整大小
- ✅ 高清显示（矢量图形）
- ✅ 统一管理
- ✅ 支持CSS样式

## 现代化搜索框

项目还包含一个现代化的搜索框组件：

```jsx
import ModernSearchBox from './components/ModernSearchBox';

// 默认主题
<ModernSearchBox
  placeholder="搜索..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onSearch={handleSearch}
  size="medium"
  width="400px"
/>

// 渐变主题（适合渐变背景）
<ModernSearchBox
  placeholder="搜索云端音频..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onSearch={handleSearch}
  size="medium"
  width="400px"
  theme="gradient"
/>
```

### 搜索框属性

- `placeholder` - 占位符文本
- `value` - 输入值
- `onChange` - 输入变化回调
- `onSearch` - 搜索按钮点击回调
- `onKeyPress` - 键盘事件回调
- `size` - 尺寸：'small' | 'medium' | 'large'
- `width` - 宽度，支持任何CSS宽度值
- `theme` - 主题：'default' | 'gradient'
- `className` - 自定义CSS类名

### 主题说明

- **default**: 适合纯色或浅色背景
- **gradient**: 适合渐变背景，使用网页主题色 #3bb6a6

## 示例

- 查看 `src/SvgDemo.js` 文件获取SVG图标的完整使用示例
- 查看 `src/SearchBoxDemo.js` 文件获取搜索框的完整使用示例 