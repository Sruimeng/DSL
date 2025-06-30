# TripoScript DSL Demo 问题解决记录

> 记录开发过程中遇到的问题和解决方案，避免重复踩坑

## 📋 目录

- [函数未定义错误](#函数未定义错误)
- [模块导入问题](#模块导入问题)
- [UI布局问题](#ui布局问题)
- [TypeScript编译问题](#typescript编译问题)

## 🚫 函数未定义错误

### 问题描述
```
Uncaught ReferenceError: addCube is not defined
    at HTMLButtonElement.onclick (basic-dsl.html:415:73)
```

### 根本原因
在 ES 模块中，函数需要显式地暴露到全局作用域才能被 HTML 的 `onclick` 事件访问。

### 常见触发场景
1. **重构代码时移动了函数位置**
2. **修改了函数名但忘记更新全局暴露**
3. **函数暴露代码在错误的时机执行**

### ❌ 错误的做法

#### 1. 直接在模块顶层暴露（时机问题）
```typescript
// 错误：可能在函数定义前执行
(window as any).addCube = addCubeOperation; // 此时函数可能未定义

function addCubeOperation(): void {
  // 函数实现
}
```

#### 2. 在 DOMContentLoaded 内暴露（太晚了）
```typescript
document.addEventListener('DOMContentLoaded', () => {
  // 错误：HTML的onclick在DOM加载时就需要函数
  (window as any).addCube = addCubeOperation;
});
```

### ✅ 正确的解决方案

#### 1. 函数定义后立即暴露
```typescript
// 1. 先定义所有函数
function addCubeOperation(): void {
  // 函数实现
}

function addSphereOperation(): void {
  // 函数实现
}

// 2. 立即暴露到全局作用域
function exposeGlobalFunctions(): void {
  (window as any).addCube = addCubeOperation;
  (window as any).addSphere = addSphereOperation;
  // ... 其他函数
  
  console.log('🔧 全局函数已暴露到 window 对象');
}

// 3. 立即执行暴露
exposeGlobalFunctions();

// 4. 然后才是DOM事件监听
document.addEventListener('DOMContentLoaded', init);
```

#### 2. 验证函数暴露成功
```typescript
// 在浏览器控制台检查
console.log('addCube 函数:', typeof window.addCube); // 应该是 'function'
```

### 🔍 调试技巧

#### 1. 检查函数是否在 window 对象上
```javascript
// 在浏览器控制台运行
Object.keys(window).filter(key => key.startsWith('add'))
// 应该看到: ['addCube', 'addSphere', 'addPlane', 'addCylinder']
```

#### 2. 检查函数执行时机
```typescript
function exposeGlobalFunctions(): void {
  console.log('🔧 开始暴露全局函数');
  console.log('函数是否存在:', {
    addCubeOperation: typeof addCubeOperation,
    addSphereOperation: typeof addSphereOperation
  });
  
  (window as any).addCube = addCubeOperation;
  // ...
  
  console.log('🔧 全局函数暴露完成');
}
```

### 🛡️ 预防措施

#### 1. 使用一致的命名规范
```typescript
// 内部函数名
function addCubeOperation(): void { }

// 全局暴露名（去掉Operation后缀）
(window as any).addCube = addCubeOperation;
```

#### 2. 集中管理全局函数暴露
```typescript
// 统一的暴露函数，便于维护
function exposeGlobalFunctions(): void {
  const globalFunctions = {
    // Undo/Redo
    undo: undoOperation,
    redo: redoOperation,
    clearHistory: clearHistoryOperation,
    
    // 对象创建
    addCube: addCubeOperation,
    addSphere: addSphereOperation,
    addPlane: addPlaneOperation,
    addCylinder: addCylinderOperation,
    
    // 材质控制
    changeToStandard: changeToStandardOperation,
    changeToWireframe: changeToWireframeOperation,
    randomColors: randomColorsOperation,
    applyGolden: applyGoldenOperation,
    
    // 光照控制
    toggleAmbient: toggleAmbientOperation,
    toggleDirectional: toggleDirectionalOperation,
    addPointLight: addPointLightOperation,
    changeBackground: changeBackgroundOperation,
    
    // 场景管理
    clearScene: clearSceneOperation,
    resetCamera: resetCameraOperation
  };
  
  // 批量暴露
  Object.entries(globalFunctions).forEach(([name, func]) => {
    (window as any)[name] = func;
  });
  
  console.log('🔧 已暴露全局函数:', Object.keys(globalFunctions));
}
```

#### 3. 添加运行时检查
```typescript
// 在HTML按钮点击时添加检查
function safeExecute(funcName: string, ...args: any[]): void {
  const func = (window as any)[funcName];
  if (typeof func === 'function') {
    func(...args);
  } else {
    console.error(`❌ 函数 ${funcName} 未定义或不是函数`);
  }
}

// HTML中使用
// <button onclick="safeExecute('addCube')">添加立方体</button>
```

## 🔧 模块导入问题

### 问题描述
```
Cannot find module './utils.js' or its corresponding type declarations
```

### 解决方案
确保导入路径正确，特别是文件扩展名：

```typescript
// ❌ 错误
import { animate } from './utils.js';

// ✅ 正确（在TypeScript环境）
import { animate } from './utils.ts';

// ✅ 或者（如果已编译为JS）
import { animate } from './utils.js';
```

## 🎨 UI布局问题

### 问题描述
操作日志区域被遮挡或不可见

### 解决方案
```css
/* 确保日志区域有足够的空间 */
.logs-section {
  flex: 1;
  min-height: 200px; /* 最小高度保证 */
  display: flex;
  flex-direction: column;
}

.logs-container {
  flex: 1;
  min-height: 150px; /* 内容容器最小高度 */
  overflow-y: auto; /* 允许滚动 */
}
```

## 📝 TypeScript编译问题

### 问题描述
TypeScript 编译时出现模块解析错误

### 解决方案
使用正确的编译参数：

```bash
npx tsc src/basic-dsl.ts --outDir js --target es2020 --module es2020 --moduleResolution node --esModuleInterop true --allowSyntheticDefaultImports true --strict false --skipLibCheck true
```

## 📚 最佳实践总结

### 1. 代码组织顺序
```typescript
// 1. 导入声明
import { ... } from '...';

// 2. 全局变量
let engine: DSLEngine;

// 3. 工具函数（被其他函数依赖的）
function restoreSceneState() { }

// 4. 核心功能函数
function saveState() { }
function undoOperation() { }

// 5. 业务功能函数
function addCubeOperation() { }

// 6. 全局函数暴露（关键！）
exposeGlobalFunctions();

// 7. 应用启动
document.addEventListener('DOMContentLoaded', init);
```

### 2. 调试检查清单
- [ ] 函数是否在使用前定义
- [ ] 全局函数是否正确暴露
- [ ] 控制台是否有错误信息
- [ ] 模块导入路径是否正确
- [ ] CSS样式是否影响元素显示

### 3. 常用调试命令
```javascript
// 检查全局函数
console.log(Object.keys(window).filter(k => k.startsWith('add')));

// 检查函数类型
console.log('addCube:', typeof window.addCube);

// 手动调用测试
window.addCube();
```

---

**💡 记住**: 在 ES 模块中，函数默认不是全局的。必须显式地将需要在 HTML 中使用的函数暴露到 `window` 对象上。 