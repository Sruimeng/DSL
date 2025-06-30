# TripoScript 2.1 DSL Demo 开发规范

> 这是一个标准化的 Demo 开发指南，确保所有 Demo 都具有一致性、可用性和专业性。

## 📋 目录

- [设计原则](#设计原则)
- [布局规范](#布局规范)
- [功能要求](#功能要求)
- [代码结构](#代码结构)
- [UI 组件](#ui-组件)
- [样式规范](#样式规范)
- [最佳实践](#最佳实践)
- [质量检查](#质量检查)

## 🎯 设计原则

### 1. 用户体验优先
- **直观性**: 界面布局清晰，功能一目了然
- **响应性**: 操作反馈及时，状态变化明显
- **一致性**: 所有 Demo 保持统一的交互模式

### 2. 框架无关性
- DSL 引擎完全独立于前端框架
- 展示纯 JavaScript 的能力
- 避免框架特定的语法和概念

### 3. 教育价值
- 每个 Demo 突出特定功能点
- 提供清晰的操作日志
- 包含完整的状态监控

## 🎨 布局规范

### 标准二栏布局

```
┌─────────────────────┬─────────────┐
│                     │   操作栏    │
│     展示区域        │  (320px)    │
│   (Canvas 3D)       │             │
│                     │             │
│                     │             │
│                     │             │
└─────────────────────┴─────────────┘
```

### 左侧展示区 (Viewer Section)
- **用途**: 3D 场景展示
- **特点**: 
  - flex: 1 (自适应宽度)
  - 最小宽度保护
  - Canvas 全屏显示

### 右侧操作栏 (Control Panel)
- **固定宽度**: 320px
- **组件顺序**:
  1. 标题区域 (Panel Header)
  2. **Undo/Redo 控制区** (必需)
  3. **操作历史显示** (必需)
  4. 功能控制区域
  5. 统计信息区域
  6. 日志区域

## ⚡ 功能要求

### 🔄 Undo/Redo 系统 (必需)

**必须包含以下功能:**

1. **撤销/重做按钮**
   ```html
   <button id="undoBtn" onclick="undo()">↶ 撤销</button>
   <button id="redoBtn" onclick="redo()">↷ 重做</button>
   ```

2. **清空历史按钮**
   ```html
   <button onclick="clearHistory()">🗑️ 清空历史</button>
   ```

3. **操作历史显示**
   ```html
   <div id="historyList" class="history-list">
     <!-- 动态生成历史记录 -->
   </div>
   ```

4. **键盘快捷键**
   - `Ctrl+Z` / `Cmd+Z`: 撤销
   - `Ctrl+Y` / `Cmd+Y`: 重做

### 📊 状态监控 (必需)

**实时显示:**
- 对象数量
- 材质数量  
- 光源数量
- 选中对象
- 场景版本

### 📝 操作日志 (必需)

**功能特点:**
- 带时间戳的操作记录
- 自动滚动到最新日志
- Monospace 字体显示
- 操作分类图标

## 🏗️ 代码结构

### 文件组织

```
demo/
├── html/
│   └── [demo-name].html          # HTML 页面
├── src/
│   ├── [demo-name].ts            # TypeScript 逻辑
│   └── utils.ts                  # 通用工具函数
└── js/
    └── [demo-name].js            # 编译后的 JavaScript
```

### TypeScript 文件结构

```typescript
// 1. 文件头注释
// TripoScript DSL [Demo Name] - 带 Undo/Redo 功能

// 2. 导入声明
import { DSLEngine, DSLRenderer, type DSLScene, type DSLAction } from '../../src/index.js';
import { animate, log, setupResize, updateStats, updateUndoRedoButtons } from './utils.js';

// 3. 全局变量
let engine: DSLEngine;
let renderer: DSLRenderer;
let controls: OrbitControls;

// 4. Undo/Redo 系统
let undoStack: DSLAction[] = [];
let redoStack: DSLAction[] = [];
let isUndoRedoOperation = false;

// 5. 工具函数
function saveState(actionType: string, actionData: any): void { }
function restoreSceneState(sceneState: DSLScene): void { }

// 6. 核心功能实现
(window as any).undo = function(): void { }
(window as any).redo = function(): void { }

// 7. 初始化系统
function init(): void { }

// 8. 功能方法分组
// ========== 对象创建方法 ==========
// ========== 材质控制方法 ==========
// ========== 光照控制方法 ==========
// ========== 场景管理方法 ==========

// 9. 启动入口
document.addEventListener('DOMContentLoaded', init);
```

## 🎮 UI 组件

### 必需组件

#### 1. Undo/Redo 控制区
```html
<div class="undo-redo-section">
  <div class="undo-redo-controls">
    <button id="undoBtn" class="undo-btn" onclick="undo()">↶ 撤销</button>
    <button id="redoBtn" class="redo-btn" onclick="redo()">↷ 重做</button>
  </div>
  <button class="clear-history-btn" onclick="clearHistory()">🗑️ 清空历史</button>
</div>
```

#### 2. 操作历史显示
```html
<div class="history-section">
  <div class="history-title">📜 操作历史</div>
  <div id="historyList" class="history-list"></div>
</div>
```

#### 3. 控制区域模板
```html
<div class="control-section">
  <div class="section-title">🏗️ [功能名称]</div>
  <div class="button-grid">
    <button class="btn btn-primary" onclick="[功能方法]">
      📦 [按钮文本]
    </button>
  </div>
</div>
```

### 按钮样式类型

- `btn-primary`: 主要功能 (蓝紫渐变)
- `btn-secondary`: 次要功能 (灰色)
- `btn-accent`: 特殊功能 (粉色渐变)
- `btn-warning`: 危险操作 (橙色渐变)

## 🎨 样式规范

### 颜色系统

```css
/* 主色调 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--warning-gradient: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);

/* 中性色 */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;

/* 状态色 */
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;
--info: #3b82f6;
```

### 间距系统

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
```

### 圆角规范

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

## ✨ 最佳实践

### 1. Undo/Redo 实现

```typescript
// 保存状态前检查是否为 undo/redo 操作
function saveState(actionType: string, actionData: any): void {
  if (isUndoRedoOperation) return;
  
  const action: DSLAction = {
    type: actionType,
    payload: actionData,
    timestamp: new Date().toLocaleTimeString(),
    previousState: JSON.parse(JSON.stringify(engine.getScene()))
  };
  
  undoStack.push(action);
  redoStack.length = 0; // 清空重做栈
  
  // 限制历史记录数量
  if (undoStack.length > 50) {
    undoStack.shift();
  }
  
  updateUndoRedoButtons(undoStack, redoStack);
}
```

### 2. 状态恢复

```typescript
function restoreSceneState(sceneState: DSLScene): void {
  // 清空当前场景
  const currentScene = engine.getScene();
  currentScene.objects.forEach(obj => {
    engine.removeObject(obj.id);
  });
  
  // 重建场景状态
  sceneState.objects.forEach(obj => {
    engine.addObject(obj);
  });
  
  // 更新UI状态
  updateStats(sceneState);
}
```

### 3. 操作方法模板

```typescript
(window as any).addObject = function(): void {
  const objectData = {
    // 对象定义...
  };
  
  // 1. 保存状态
  saveState('ADD_OBJECT', objectData);
  
  // 2. 执行操作
  const id = engine.addObject(objectData);
  
  // 3. 记录日志
  log(`📦 添加对象: ${id}`);
};
```

### 4. 错误处理

```typescript
try {
  // 操作代码...
} catch (error) {
  console.error('操作失败:', error);
  log(`❌ 操作失败: ${error.message}`);
}
```

## 🔍 质量检查

### 上线前检查清单

#### 功能检查
- [ ] Undo/Redo 功能正常工作
- [ ] 键盘快捷键响应正确
- [ ] 操作历史显示准确
- [ ] 统计信息实时更新
- [ ] 日志记录完整

#### UI 检查
- [ ] 左右布局响应式
- [ ] 按钮状态正确更新
- [ ] 滚动区域工作正常
- [ ] 移动端适配良好

#### 代码检查
- [ ] 无 TypeScript 错误
- [ ] 无控制台警告
- [ ] 代码结构清晰
- [ ] 注释充分

#### 性能检查
- [ ] 3D 渲染流畅
- [ ] 内存使用合理
- [ ] 无明显卡顿

### 测试场景

1. **基础操作测试**
   - 添加/删除对象
   - 撤销/重做操作
   - 清空场景

2. **边界情况测试**
   - 连续快速操作
   - 大量对象场景
   - 空场景状态

3. **兼容性测试**
   - Chrome、Firefox、Safari
   - 不同屏幕尺寸
   - 移动设备

## 📚 参考示例

完整参考实现请查看:
- `demo/html/basic-dsl.html` - HTML 结构
- `demo/src/basic-dsl.ts` - TypeScript 逻辑  
- `demo/src/utils.ts` - 工具函数

这些文件提供了完整的 Undo/Redo 实现和标准化的 Demo 结构，可以作为新 Demo 开发的模板。

---

**📌 重要提醒:** 
- Undo/Redo 功能是必需的，不是可选的
- 左右布局是标准规范，不要更改
- 操作栏宽度固定为 320px
- 所有 Demo 都必须包含完整的状态监控和日志记录 