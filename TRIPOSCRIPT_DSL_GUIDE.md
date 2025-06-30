# TripoScript DSL 引擎使用指南

## 概述

TripoScript DSL 是一个独立的 ThreeJS 场景描述语言引擎，采用状态驱动的架构设计，提供强大的 3D 场景管理和渲染能力。

## 🎯 核心特性

### 1. 框架无关设计
- **纯 TypeScript 实现**：不依赖任何 UI 框架
- **状态驱动**：场景即数据，所有变化通过状态管理
- **Action 模式**：统一的操作接口，保证状态一致性
- **自动同步**：ThreeJS 自动监听状态变化并更新渲染

### 2. 灵活的扩展能力
- **插件系统**：支持自定义扩展
- **中间件**：Action 拦截和转换
- **多渲染器**：可扩展支持 WebGL、WebGPU 等

### 3. 完整的 DSL 语法
- **声明式语法**：直观的场景描述
- **类型安全**：完整的 TypeScript 类型定义
- **实时预览**：即时的视觉反馈

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│         应用层 (HTML/JS/TS)         │  ← 业务逻辑和UI交互
├─────────────────────────────────────┤
│       TripoScript DSL 引擎          │  ← 状态管理和Action处理
│    • TripoEngine (状态管理)         │
│    • TripoAction (操作定义)         │
│    • TripoScene (场景数据)          │
├─────────────────────────────────────┤
│       TripoRenderer (渲染器)        │  ← ThreeJS渲染层
│    • 自动状态同步                   │
│    • 几何体/材质管理                │
│    • 光照/相机控制                  │
└─────────────────────────────────────┘
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Three.js
npm install three
npm install @types/three

# 项目已包含 TripoScript DSL 引擎源码
```

### 2. 基础使用

```typescript
import { TripoEngine, TripoRenderer } from './src/index.js';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 创建引擎实例
const engine = new TripoEngine();

// 创建渲染器
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new TripoRenderer(canvas, engine);

// 添加轨道控制器
const controls = new OrbitControls(
  renderer.getThreeCamera(), 
  renderer.getThreeRenderer().domElement
);

// 添加对象
const cubeId = engine.addObject({
  name: '我的立方体',
  type: 'mesh',
  geometry: {
    type: 'box',
    size: new Vector3(1, 1, 1)
  },
  transform: {
    position: new Vector3(0, 0, 0)
  },
  material: { id: 'default' }
});

// 监听场景变化
engine.subscribe((scene) => {
  console.log('场景已更新:', scene);
});
```

### 3. HTML 集成

```html
<!DOCTYPE html>
<html>
<head>
    <title>TripoScript DSL Demo</title>
</head>
<body>
    <canvas id="canvas"></canvas>
    <button onclick="addCube()">添加立方体</button>
    
    <script type="module">
        import { TripoEngine, TripoRenderer } from './src/index.js';
        // ... 引擎代码
        
        // 全局方法
        window.addCube = function() {
            engine.addObject({
                name: '立方体',
                type: 'mesh',
                geometry: { type: 'box', size: new Vector3(1, 1, 1) }
            });
        };
    </script>
</body>
</html>
```

## 📚 核心 API

### TripoEngine (引擎核心)

```typescript
class TripoEngine {
  // 构造函数
  constructor(initialScene?: Partial<TripoScene>)
  
  // 状态管理
  getScene(): TripoScene
  subscribe(listener: (scene: TripoScene) => void): () => void
  
  // Action 派发
  dispatch(action: TripoAction): void
  
  // 便捷方法
  addObject(object: Partial<SceneObject>): string
  updateObject(id: string, changes: Partial<SceneObject>): void
  removeObject(id: string): void
  
  addMaterial(material: Partial<Material>): string
  applyMaterial(objectIds: string[], materialId: string): void
  
  selectObjects(ids: string[], mode?: 'set' | 'add' | 'toggle'): void
  clearSelection(): void
  
  // 历史管理
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
  
  // 场景管理
  exportScene(): TripoScene
  importScene(scene: TripoScene): void
}
```

### TripoRenderer (渲染器)

```typescript
class TripoRenderer {
  constructor(canvas: HTMLCanvasElement, engine: TripoEngine)
  
  // 渲染控制
  resize(width: number, height: number): void
  dispose(): void
  
  // Three.js 访问
  getThreeScene(): THREE.Scene
  getThreeCamera(): THREE.Camera
  getThreeRenderer(): THREE.WebGLRenderer
}
```

### TripoScene (场景数据)

```typescript
interface TripoScene {
  id: string
  name: string
  objects: SceneObject[]
  materials: Material[]
  lights: Light[]
  camera: Camera
  environment: Environment
  selection: string[]
  metadata: {
    created: number
    modified: number
    version: string
  }
}
```

## 🎨 DSL 语法

### 1. 对象定义

```typescript
// 基础几何体
const cube = {
  name: '立方体',
  type: 'mesh',
  geometry: {
    type: 'box',
    size: new Vector3(1, 1, 1)
  },
  transform: {
    position: new Vector3(0, 0, 0),
    rotation: new Vector3(0, 0, 0),
    scale: new Vector3(1, 1, 1)
  },
  material: { id: 'default' }
};

// 球体
const sphere = {
  name: '球体',
  type: 'mesh',
  geometry: {
    type: 'sphere',
    radius: 1,
    radialSegments: 16,
    heightSegments: 12
  }
};

// 平面
const plane = {
  name: '平面',
  type: 'mesh',
  geometry: {
    type: 'plane',
    size: new Vector3(2, 2, 1)
  }
};

// 圆柱
const cylinder = {
  name: '圆柱',
  type: 'mesh',
  geometry: {
    type: 'cylinder',
    radius: 0.5,
    height: 2,
    radialSegments: 16
  }
};
```

### 2. 材质定义

```typescript
// 标准材质
const standardMaterial = {
  name: '标准材质',
  type: 'standard',
  color: '#ffffff',
  metalness: 0.5,
  roughness: 0.5,
  opacity: 1.0
};

// 发光材质
const emissiveMaterial = {
  name: '发光材质',
  type: 'standard',
  color: '#ff0000',
  emissive: '#ff0000',
  emissiveIntensity: 0.5
};

// 透明材质
const glassMaterial = {
  name: '玻璃材质',
  type: 'standard',
  color: '#74B9FF',
  metalness: 0.0,
  roughness: 0.0,
  opacity: 0.3,
  transparent: true
};

// 线框材质
const wireframeMaterial = {
  name: '线框材质',
  type: 'wireframe',
  color: '#00ff00'
};
```

### 3. 光照定义

```typescript
// 环境光
const ambientLight = {
  name: '环境光',
  type: 'ambient',
  color: '#ffffff',
  intensity: 0.4
};

// 平行光
const directionalLight = {
  name: '平行光',
  type: 'directional',
  color: '#ffffff',
  intensity: 0.8,
  position: new Vector3(5, 5, 5),
  target: new Vector3(0, 0, 0),
  castShadow: true
};

// 点光源
const pointLight = {
  name: '点光源',
  type: 'point',
  color: '#ffffff',
  intensity: 1.0,
  position: new Vector3(0, 5, 0),
  distance: 10,
  decay: 2
};

// 聚光灯
const spotLight = {
  name: '聚光灯',
  type: 'spot',
  color: '#ffffff',
  intensity: 1.0,
  position: new Vector3(0, 10, 0),
  target: new Vector3(0, 0, 0),
  angle: Math.PI / 6,
  penumbra: 0.1,
  castShadow: true
};
```

### 4. 相机配置

```typescript
// 透视相机
const perspectiveCamera = {
  type: 'perspective',
  position: new Vector3(5, 5, 5),
  target: new Vector3(0, 0, 0),
  fov: 75,
  aspect: 1,
  near: 0.1,
  far: 1000
};

// 正交相机
const orthographicCamera = {
  type: 'orthographic',
  position: new Vector3(5, 5, 5),
  target: new Vector3(0, 0, 0),
  left: -5,
  right: 5,
  top: 5,
  bottom: -5,
  near: 0.1,
  far: 1000
};
```

## 🔧 Action 系统

### 1. 对象操作

```typescript
// 添加对象
engine.dispatch({
  type: 'ADD_OBJECT',
  payload: {
    name: '新对象',
    type: 'mesh',
    geometry: { type: 'box', size: new Vector3(1, 1, 1) }
  }
});

// 更新对象
engine.dispatch({
  type: 'UPDATE_OBJECT',
  payload: {
    id: 'object-id',
    changes: {
      transform: {
        position: new Vector3(1, 1, 1)
      }
    }
  }
});

// 删除对象
engine.dispatch({
  type: 'REMOVE_OBJECT',
  payload: { id: 'object-id' }
});

// 复制对象
engine.dispatch({
  type: 'DUPLICATE_OBJECT',
  payload: { id: 'object-id' }
});
```

### 2. 材质操作

```typescript
// 添加材质
engine.dispatch({
  type: 'ADD_MATERIAL',
  payload: {
    name: '新材质',
    type: 'standard',
    color: '#ff0000'
  }
});

// 应用材质
engine.dispatch({
  type: 'APPLY_MATERIAL',
  payload: {
    objectIds: ['obj1', 'obj2'],
    materialId: 'material-id'
  }
});
```

### 3. 选择操作

```typescript
// 选择对象
engine.dispatch({
  type: 'SELECT',
  payload: {
    ids: ['obj1', 'obj2'],
    mode: 'set' // 'set' | 'add' | 'toggle'
  }
});

// 清除选择
engine.dispatch({
  type: 'CLEAR_SELECTION'
});
```

### 4. 光照操作

```typescript
// 添加光源
engine.dispatch({
  type: 'ADD_LIGHT',
  payload: {
    name: '新光源',
    type: 'point',
    color: '#ffffff',
    intensity: 1.0,
    position: new Vector3(0, 5, 0)
  }
});

// 更新光源
engine.dispatch({
  type: 'UPDATE_LIGHT',
  payload: {
    id: 'light-id',
    changes: { intensity: 0.5 }
  }
});
```

## 🎯 Demo 示例

### 1. 基础演示 (demo/html/basic-dsl.html)

展示核心功能：
- 添加基础几何体（立方体、球体、平面、圆柱）
- 材质控制（标准、线框、随机颜色、黄金材质）
- 光照控制（环境光、平行光、点光源、背景色）
- 场景管理（清空、重置相机）

### 2. 材质管理 (demo/html/material-dsl.html)

高级材质功能：
- 8种材质预设（黄金、银色、铜色、塑料、橡胶、玻璃、木材、大理石）
- 实时材质属性调节（颜色、金属度、粗糙度、透明度、发光强度）
- 材质预览球
- 批量材质应用

### 3. 运行 Demo

```bash
# 启动本地服务器（必需，因为使用ES模块）
npx serve demo
# 或使用 Python
python -m http.server 8000

# 访问演示
http://localhost:8000/html/basic-dsl.html
http://localhost:8000/html/material-dsl.html
```

## 🔌 扩展开发

### 1. 自定义几何体

```typescript
// 扩展几何体类型
interface CustomGeometry extends GeometryInline {
  type: 'custom';
  customParam: number;
}

// 在渲染器中处理
class CustomRenderer extends TripoRenderer {
  protected createGeometry(geomDef: CustomGeometry): THREE.BufferGeometry {
    if (geomDef.type === 'custom') {
      return new CustomThreeGeometry(geomDef.customParam);
    }
    return super.createGeometry(geomDef);
  }
}
```

### 2. 自定义材质

```typescript
// 扩展材质类型
interface CustomMaterial extends MaterialInline {
  type: 'custom';
  customProperty: string;
}

// 在渲染器中处理
class CustomRenderer extends TripoRenderer {
  protected createMaterial(matDef: CustomMaterial): THREE.Material {
    if (matDef.type === 'custom') {
      return new CustomThreeMaterial({
        customProperty: matDef.customProperty
      });
    }
    return super.createMaterial(matDef);
  }
}
```

### 3. 自定义 Action

```typescript
// 扩展 Action 类型
interface CustomAction {
  type: 'CUSTOM_ACTION';
  payload: { customData: any };
}

// 在引擎中处理
class CustomEngine extends TripoEngine {
  protected reduce(scene: TripoScene, action: CustomAction): TripoScene {
    if (action.type === 'CUSTOM_ACTION') {
      // 处理自定义逻辑
      return { ...scene, /* 自定义变化 */ };
    }
    return super.reduce(scene, action);
  }
}
```

## 🎨 最佳实践

### 1. 性能优化

```typescript
// 批量操作
const objects = [obj1, obj2, obj3];
objects.forEach(obj => {
  engine.addObject(obj);
});

// 使用对象池
const objectPool = new Map();
function getObject(type: string) {
  if (!objectPool.has(type)) {
    objectPool.set(type, createObject(type));
  }
  return objectPool.get(type);
}

// 材质复用
const sharedMaterial = engine.addMaterial({
  type: 'standard',
  color: '#ff0000'
});
engine.applyMaterial(objectIds, sharedMaterial);
```

### 2. 状态管理

```typescript
// 监听特定变化
engine.subscribe((scene) => {
  // 只处理对象变化
  if (scene.objects.length !== previousObjectCount) {
    updateObjectList(scene.objects);
    previousObjectCount = scene.objects.length;
  }
});

// 批量更新
engine.dispatch({
  type: 'BATCH_UPDATE',
  payload: {
    operations: [
      { type: 'ADD_OBJECT', payload: obj1 },
      { type: 'ADD_OBJECT', payload: obj2 },
      { type: 'UPDATE_OBJECT', payload: { id: 'obj3', changes: {...} } }
    ]
  }
});
```

### 3. 错误处理

```typescript
try {
  engine.addObject(objectData);
} catch (error) {
  console.error('添加对象失败:', error);
  // 回滚或显示错误信息
}

// 验证数据
function validateObject(obj: Partial<SceneObject>): boolean {
  return obj.name && obj.type && obj.geometry;
}
```

## 🚀 部署指南

### 1. 构建项目

```bash
# 安装依赖
npm install

# 构建
npm run build

# 生成类型定义
npm run build:types
```

### 2. 集成到项目

```typescript
// 作为 ES 模块使用
import { TripoEngine, TripoRenderer } from '@your-org/triposcript-dsl';

// 作为 UMD 使用
<script src="./dist/triposcript-dsl.umd.js"></script>
<script>
  const { TripoEngine, TripoRenderer } = TripoScriptDSL;
</script>
```

### 3. CDN 使用

```html
<script type="module">
  import { TripoEngine, TripoRenderer } from 'https://unpkg.com/@your-org/triposcript-dsl/dist/index.js';
</script>
```

## 📖 类型定义

项目包含完整的 TypeScript 类型定义，支持：

- **智能补全**：IDE 自动完成
- **类型检查**：编译时错误检测
- **接口文档**：内联文档注释
- **重构支持**：安全的代码重构

## 🤝 社区与支持

- **GitHub Issues**：报告问题和功能请求
- **文档**：详细的 API 文档和示例
- **示例项目**：完整的演示应用
- **社区论坛**：技术讨论和经验分享

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**TripoScript DSL** - 让 3D 场景开发更简单、更高效！ 