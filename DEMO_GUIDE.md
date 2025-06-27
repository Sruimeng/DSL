# TripoScript 2.1 Demo 使用指南

TripoScript 2.1 是一个简化的3D场景描述语言DSL系统，基于React Three Fiber构建。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问演示

打开浏览器访问 `http://localhost:3000/demo` 查看所有演示。

## 📋 演示列表

### 基础几何体演示 (DSL Objects)
- **文件**: `demo/src/DSL-Objects.tsx`
- **访问**: `demo/html/dsl-objects.html`
- **功能**: 
  - 添加各种基础几何体（立方体、球体、圆柱体）
  - 实时修改材质颜色
  - 撤销/重做操作
  - 场景清空

### 模型生成工作区 (Generate Workspace)
- **文件**: `demo/src/DSL-Generate.tsx`
- **访问**: `demo/html/dsl-generate.html`
- **功能**:
  - 基于文本提示生成3D模型（模拟）
  - 生成进度显示
  - 快速预设提示词
  - 自动添加生成结果到场景

### 材质编辑工作区 (Texture Workspace)
- **文件**: `demo/src/DSL-Texture.tsx`
- **访问**: `demo/html/dsl-texture.html`
- **功能**:
  - 实时材质编辑器
  - 颜色、金属度、粗糙度、透明度调节
  - 材质预设库
  - 选中对象批量应用材质

## 🏗️ 核心架构

### 3层简化架构

```
┌─────────────────────────────────────┐
│        Application Layer            │  // 工作区组件
│     (Workspace Components)          │
├─────────────────────────────────────┤
│         DSL Engine Layer            │  // 核心引擎
│    (Scene + Commands + Resources)   │
├─────────────────────────────────────┤
│       Rendering Layer               │  // 渲染层
│     (React Three Fiber)             │
└─────────────────────────────────────┘
```

### 统一的Hook接口

```typescript
const { scene, selection, history, workspace, materials, io } = useTripo();
```

### 核心特性

- **简化的API**: 一个主Hook包含所有功能
- **扁平化配置**: 减少深度嵌套，易于理解
- **自动性能优化**: 智能批量更新
- **渐进式集成**: 支持与现有代码逐步迁移

## 📚 API 示例

### 基础场景操作

```typescript
// 添加几何体
const cubeId = scene.add({
  name: '立方体',
  type: 'mesh',
  geometry: { type: 'box', size: [1, 1, 1] },
  material: { color: '#ff0000', metalness: 0.1 },
  transform: { position: [0, 0.5, 0] }
});

// 更新对象
scene.update(cubeId, {
  material: { color: '#00ff00' }
});

// 删除对象
scene.remove(cubeId);
```

### 选择和历史操作

```typescript
// 选择对象
selection.select([cubeId]);

// 撤销/重做
history.undo();
history.redo();
```

### 工作区扩展

```typescript
// Generate工作区
const { generate } = useGenerate();

await generate.start(); // 开始生成

// Texture工作区
const { texture } = useTexture();

texture.setPreview(material);
texture.applyToSelected();
```

## 🎨 自定义开发

### 创建新的几何体

```typescript
scene.add({
  geometry: { 
    type: 'cylinder', 
    radius: 0.5, 
    height: 2, 
    radialSegments: 16 
  },
  material: { 
    type: 'standard',
    color: '#4a90e2',
    metalness: 0.8,
    roughness: 0.2
  }
});
```

### 批量操作

```typescript
scene.batch([
  { type: 'add', object: { name: 'Cube1', ... } },
  { type: 'add', object: { name: 'Cube2', ... } },
  { type: 'update', id: 'existing-id', changes: { ... } }
]);
```

### 材质预设

```typescript
const goldMaterial = {
  color: '#ffd700',
  metalness: 0.9,
  roughness: 0.1
};

materials.create(goldMaterial);
```

## 🔧 技术栈

- **React 19** - 现代React特性
- **React Three Fiber** - React的Three.js渲染器
- **React Three Drei** - 有用的Three.js组件库
- **Zustand** - 轻量级状态管理
- **TypeScript** - 类型安全
- **Three.js** - 3D图形库

## 📖 更多资源

- [README.md](./README.md) - 完整的设计文档
- [src/types/core.ts](./src/types/core.ts) - 类型定义
- [src/hooks/useTripo.ts](./src/hooks/useTripo.ts) - 主Hook实现
- [src/engine/store.ts](./src/engine/store.ts) - 状态管理

---

**TripoScript 2.1** - 让3D开发变得简单直观 🚀 