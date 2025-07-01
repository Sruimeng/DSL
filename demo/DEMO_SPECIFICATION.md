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

### 标准二栏布局 + 左上角统计面板

```
┌─📊──────────────────┬─────────────┐
│ 统计面板            │   操作栏    │
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
  - **左上角悬浮统计面板** (新增)

### 左上角统计面板 (Top Stats Panel) - **必需**
- **位置**: 固定在左上角 (top: 10px, left: 10px)
- **样式**: 
  - 半透明黑色背景 rgba(0,0,0,0.8)
  - 毛玻璃效果 backdrop-filter: blur(10px)
  - 圆角边框 border-radius: 8px
  - 等宽字体 monospace
- **内容**:
  - 历史统计信息 (Actions数量、当前索引等)
  - Undo/Redo 状态显示
  - 内存使用情况
  - 最近操作列表

### 右侧操作栏 (Control Panel)
- **固定宽度**: 320px
- **组件顺序**:
  1. 标题区域 (Panel Header)
  2. **Undo/Redo 控制区** (必需)
  3. **操作历史显示** (必需)
  4. 功能控制区域
  5. 日志区域 (统计信息已移至左上角)

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

#### 1. 左上角统计面板 (新增 - 必需)
```html
<!-- 左上角统计面板 -->
<div class="top-stats-panel" id="topStatsPanel">
    <div class="stats-title">📚 历史统计</div>
    <div class="stats-grid" id="topStats">
        <!-- 统计信息将在这里动态更新 -->
    </div>
</div>
```

**CSS样式:**
```css
.top-stats-panel {
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    min-width: 200px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### 2. Undo/Redo 控制区
```html
<div class="undo-redo-section">
  <div class="undo-redo-controls">
    <button id="undoBtn" class="undo-btn" onclick="undo()">↶ 撤销</button>
    <button id="redoBtn" class="redo-btn" onclick="redo()">↷ 重做</button>
  </div>
  <button class="clear-history-btn" onclick="clearHistory()">🗑️ 清空历史</button>
</div>
```

#### 3. 操作历史显示
```html
<div class="history-section">
  <div class="history-title">📜 操作历史</div>
  <div id="historyList" class="history-list"></div>
</div>
```

#### 4. 控制区域模板
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

### 1. Undo/Redo 实现 (使用引擎内置系统)

**重要更新**: 现在使用引擎内置的状态快照式undo/redo系统，无需手动管理历史栈。

```typescript
// 更新UI状态 - 新版本实现
function updateUIState(): void {
  const canUndo = engine.canUndo();
  const canRedo = engine.canRedo();

  // 更新按钮可用性 - 直接操作DOM元素
  const undoBtn = document.querySelector('[onclick="undo()"]') as HTMLButtonElement;
  const redoBtn = document.querySelector('[onclick="redo()"]') as HTMLButtonElement;

  if (undoBtn) {
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
    undoBtn.title = `撤销${canUndo ? ' (可用)' : ' (不可用)'}`;
  }

  if (redoBtn) {
    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
    redoBtn.title = `重做${canRedo ? ' (可用)' : ' (不可用)'}`;
  }

  // 显示历史统计信息
  const historyStats = engine.getHistoryStats();
  updateHistoryDisplay(historyStats);
}

// 撤销和重做操作 - 简化实现
function undoOperation(): void {
  const success = engine.undo();
  if (success) {
    log('↶ 撤销操作成功');
  } else {
    log('⚠️ 没有可撤销的操作');
  }
  updateUIState();
}

function redoOperation(): void {
  const success = engine.redo();
  if (success) {
    log('↷ 重做操作成功');
  } else {
    log('⚠️ 没有可重做的操作');
  }
  updateUIState();
}
```

**关键变化**:
- ❌ 不再使用 `updateUndoRedoButtons([], [])` (会导致按钮被错误禁用)
- ✅ 直接使用引擎的 `canUndo()` 和 `canRedo()` 方法
- ✅ 引擎自动管理状态快照，无需手动保存状态
- ✅ 所有操作类型都支持正确的撤销/重做

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

### 3. 操作方法模板 (新版本 - 简化)

```typescript
// 新的操作方法模板 - 无需手动保存状态
function addCubeOperation(): void {
  const objectData = {
    name: `立方体_${++objectCount}`,
    type: 'mesh',
    geometry: { type: 'box', size: new Vector3(1, 1, 1) },
    transform: { position: new Vector3(0, 0, 0) },
    material: { id: 'default' },
  };

  // 引擎自动处理undo/redo历史记录
  const id = engine.addObject(objectData);
  log(`📦 添加立方体: ${id}`);
}

// 全局函数暴露 - 确保HTML按钮可以调用
(window as any).addCube = addCubeOperation;
```

**关键简化**:
- ❌ 不再需要手动调用 `saveState()`
- ❌ 不再需要管理 `isUndoRedoOperation` 标志
- ✅ 引擎的 `dispatch()` 系统自动处理历史记录
- ✅ 所有通过引擎API的操作都自动支持undo/redo

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
- [ ] **左上角统计面板正确显示** (新增)
- [ ] 统计信息实时更新 (Actions、索引、内存等)
- [ ] 按钮状态正确更新 (不被错误禁用)
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
- `demo/html/basic-dsl.html` - **最新HTML结构** (包含左上角统计面板)
- `demo/src/basic-dsl.ts` - **最新TypeScript逻辑** (使用引擎内置undo/redo)
- `demo/src/utils.ts` - 工具函数

**最新更新内容**:
- ✅ 引擎内置状态快照式undo/redo系统
- ✅ 左上角悬浮统计面板
- ✅ 简化的操作方法实现
- ✅ 修复重做按钮被错误禁用的问题

---

**📌 重要提醒 (2024更新):** 
- **左上角统计面板是必需的**，用于显示历史统计
- Undo/Redo 功能使用引擎内置系统，无需手动管理
- ❌ 不要使用 `updateUndoRedoButtons([], [])` (会导致按钮被禁用)
- ✅ 使用 `engine.canUndo()` 和 `engine.canRedo()` 检查状态
- 左右布局 + 左上角统计面板是新的标准规范
- 操作栏宽度固定为 320px
- 所有 Demo 都必须包含完整的状态监控和日志记录 