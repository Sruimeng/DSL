# TripoScript 2.1 - 简化的 3D 场景描述语言

**TripoScript 2.1** 是经过简化优化的3D场景DSL系统，专注于**简单易用**而非过度复杂的架构设计，为 Tripo 平台提供直观、高效的3D开发体验。

## 🎯 设计哲学

### 核心原则

- **简化优于复杂** - 减少层次，合并相似概念，降低学习成本
- **直观优于灵活** - API 设计符合开发者直觉，减少记忆负担
- **性能优于功能** - 优先保证基础性能，避免过度设计
- **渐进优于革命** - 保持向后兼容，支持逐步迁移

### 解决的核心问题

- ❌ **架构层次过于复杂** → ✅ **简化为3层清晰架构**
- ❌ **Hook API 过于分散** → ✅ **统一的主Hook接口**
- ❌ **配置结构过于庞大** → ✅ **扁平化配置设计**
- ❌ **命令系统过度设计** → ✅ **简化的操作API**
- ❌ **学习成本过高** → ✅ **直观的使用体验**

## 🏗️ 简化架构

```
┌─────────────────────────────────────┐
│        Application Layer            │  // 业务逻辑 - 工作区模块
│     (Workspace Components)          │
├─────────────────────────────────────┤
│         DSL Engine Layer            │  // 核心引擎 - 场景管理/命令/资源
│    (Scene + Commands + Resources)   │
├─────────────────────────────────────┤
│       Rendering Layer               │  // 渲染层 - React Three Fiber
│     (Components + Hooks)            │
└─────────────────────────────────────┘
```

从复杂的6层架构简化为清晰的3层，每层职责明确：

- **Application Layer**: 工作区业务逻辑
- **DSL Engine Layer**: 统一的场景管理引擎
- **Rendering Layer**: React Three Fiber 渲染封装

## 📄 扁平化配置

### 简化的场景配置

```typescript
// 新的扁平化配置格式 - 更简洁直观
interface TripoScene {
  // 基础信息
  id: string;
  name: string;
  version: "2.1";

  // 场景内容 - 扁平化存储，避免深度嵌套
  objects: SceneObject[];
  materials: Material[];
  lights: Light[];
  camera: Camera;

  // 环境设置 - 合并相关配置
  environment: {
    background?: Background;
    fog?: Fog;
    shadows?: ShadowSettings;
  };

  // 工作区数据 - 独立存储，按需加载
  workspace?: WorkspaceData;
}

// 简化的对象定义 - 减少嵌套层次
interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'light';

  // 核心属性 - 支持引用和内联两种方式
  geometry?: GeometryRef | GeometryInline;
  material?: MaterialRef | MaterialInline;
  transform: Transform;

  // 可选属性 - 默认值明确
  visible?: boolean;         // 默认 true
  castShadow?: boolean;      // 默认 false
  receiveShadow?: boolean;   // 默认 false
  parent?: string;
  children?: string[];
}

// 几何体配置 - 简化参数
interface GeometryInline {
  type: 'box' | 'sphere' | 'plane' | 'cylinder';
  size?: number | [number, number, number];  // 统一的尺寸参数
  segments?: number | [number, number];      // 统一的分段参数
}

// 材质配置 - 常用属性优先
interface MaterialInline {
  type?: 'standard' | 'basic' | 'wireframe';  // 默认 standard
  color?: string;            // 默认 '#ffffff'
  metalness?: number;        // 0-1, 默认 0
  roughness?: number;        // 0-1, 默认 0.5
  opacity?: number;          // 0-1, 默认 1
  wireframe?: boolean;       // 默认 false
}
```

## �� 统一的 Hook 接口

### 主Hook - useTripo()

不再需要记住多个分散的Hook，一个主Hook包含所有功能：

```typescript
// 统一的主Hook - 减少认知负担
export function useTripo() {
  return {
    // 场景操作 - 直观的CRUD接口
    scene: {
      objects: SceneObject[];
      add: (object: Partial<SceneObject>) => void;
      update: (id: string, changes: Partial<SceneObject>) => void;
      remove: (id: string) => void;
      find: (predicate: (obj: SceneObject) => boolean) => SceneObject[];
      get: (id: string) => SceneObject | null;
    };

    // 选择系统 - 统一管理
    selection: {
      selected: string[];
      select: (ids: string[]) => void;
      add: (ids: string[]) => void;
      remove: (ids: string[]) => void;
      clear: () => void;
      toggle: (id: string) => void;
    };

    // 历史管理 - 简化操作
    history: {
      canUndo: boolean;
      canRedo: boolean;
      undo: () => void;
      redo: () => void;
      clear: () => void;
    };

    // 工作区 - 状态管理
    workspace: {
      current: WorkspaceType;
      switch: (type: WorkspaceType) => void;
      data: WorkspaceData;
      update: (data: Partial<WorkspaceData>) => void;
    };

    // 材质管理 - 常用操作
    materials: {
      list: Material[];
      create: (material: Partial<Material>) => string;
      update: (id: string, changes: Partial<Material>) => void;
      apply: (objectIds: string[], materialId: string) => void;
    };

    // 导入导出 - 便捷方法
    io: {
      export: () => TripoScene;
      import: (scene: TripoScene) => void;
      reset: () => void;
    };
  };
}

// 使用示例 - 简洁直观
function SceneEditor() {
  const { scene, selection, history, materials } = useTripo();

  const addCube = () => {
    scene.add({
      name: 'My Cube',
      type: 'mesh',
      geometry: { type: 'box', size: [1, 1, 1] },
      material: { color: '#ff0000', metalness: 0.2 },
      transform: { position: [0, 0, 0] }
    });
  };

  const applyGoldMaterial = () => {
    if (selection.selected.length > 0) {
      const goldId = materials.create({
        color: '#ffd700',
        metalness: 0.9,
        roughness: 0.1
      });
      materials.apply(selection.selected, goldId);
    }
  };

  return (
    <div className="scene-editor">
      <button onClick={addCube}>添加立方体</button>
      <button onClick={applyGoldMaterial}>应用金色材质</button>
      <button onClick={history.undo} disabled={!history.canUndo}>
        撤销
      </button>
    </div>
  );
}
```

### 工作区特化Hook

基于主Hook扩展，提供工作区特有功能：

```typescript
// Generate工作区 - 基于主Hook扩展
export function useGenerate() {
  const base = useTripo();

  return {
    ...base,
    // Generate特有功能
    generate: {
      prompt: string;
      setPrompt: (prompt: string) => void;
      isGenerating: boolean;
      progress: number;
      start: () => Promise<void>;
      cancel: () => void;

      // 便捷方法
      addResult: (model: GeneratedModel) => void;
    };
  };
}

// Texture工作区 - 专注材质编辑
export function useTexture() {
  const base = useTripo();

  return {
    ...base,
    // Texture特有功能
    texture: {
      preview: Material | null;
      setPreview: (material: Material) => void;
      applyToSelected: () => void;

      // 预设材质
      presets: Material[];
      loadPreset: (id: string) => void;
    };
  };
}

// Rigging工作区 - 骨骼绑定
export function useRigging() {
  const base = useTripo();

  return {
    ...base,
    // Rigging特有功能
    rigging: {
      bones: Bone[];
      addBone: (bone: Partial<Bone>) => void;
      selectBone: (id: string) => void;
      updateWeights: (vertexId: string, weights: BoneWeight[]) => void;
    };
  };
}
```

## 🎨 简化的操作 API

### 直观的场景操作

```typescript
// 新的简化API - 更符合直觉
export const scene = {
  // 基础CRUD - 简单明了
  add: (object: Partial<SceneObject>) => string;      // 返回ID
  update: (id: string, changes: Partial<SceneObject>) => void;
  remove: (id: string) => void;

  // 批量操作 - 性能优化
  batch: (operations: Operation[]) => void;

  // 查询方法 - 常用操作
  get: (id: string) => SceneObject | null;
  find: (predicate: (obj: SceneObject) => boolean) => SceneObject[];
  findByName: (name: string) => SceneObject[];
  findByType: (type: string) => SceneObject[];

  // 历史管理 - 简化接口
  undo: () => void;
  redo: () => void;

  // 便捷方法 - 常用场景
  addMesh: (config: MeshConfig) => string;
  addLight: (config: LightConfig) => string;
  addWireframe: (config: WireframeConfig) => string;
};

// 使用示例 - 代码更简洁
const cubeId = scene.addMesh({
  name: 'Red Cube',
  geometry: { type: 'box', size: 1 },
  material: { color: '#ff0000' },
  position: [0, 1, 0]
});

scene.update(cubeId, {
  material: { color: '#00ff00', metalness: 0.5 }
});

// 批量操作
scene.batch([
  { type: 'add', object: { name: 'Cube1', ... } },
  { type: 'add', object: { name: 'Cube2', ... } },
  { type: 'update', id: 'existing-id', changes: { ... } }
]);
```

### 模板和预设

```typescript
// 简化的模板系统
export const templates = {
  // 基础场景
  empty: () => scene.reset(),

  // 线框展示
  wireframe: (geometry: GeometryInline) => {
    scene.batch([
      { type: 'add', object: {
        name: 'Wireframe_Object',
        geometry,
        material: { type: 'wireframe', color: '#000000' }
      }},
      { type: 'addLight', config: { type: 'ambient', intensity: 0.4 }},
      { type: 'addLight', config: { type: 'directional', position: [5, 5, 5] }}
    ]);
  },

  // 产品展示
  product: (model: string) => {
    scene.batch([
      { type: 'add', object: {
        name: 'Product',
        geometry: { type: 'model', url: model },
        material: { color: '#ffffff', metalness: 0.1, roughness: 0.1 }
      }},
      { type: 'addLight', config: { type: 'environment', hdri: '/env/studio.hdr' }}
    ]);
  }
};

// 使用模板
templates.wireframe({ type: 'box', size: [2, 2, 2] });
```

## 🔧 简化的组件系统

### 声明式组件API

```typescript
// 简化的组件系统 - 易于理解和使用
export function TripoCanvas({ children }: { children?: React.ReactNode }) {
  return (
    <Canvas>
      <TripoSceneRenderer />  {/* 自动渲染所有场景对象 */}
      <TripoControls />       {/* 自动相机控制 */}
      {children}
    </Canvas>
  );
}

// 简单的对象组件
export function TripoObject({
  id,
  visible = true,
  children
}: {
  id: string;
  visible?: boolean;
  children?: React.ReactNode;
}) {
  const object = useTripoObject(id);  // 简化的对象Hook

  if (!object || !visible) return null;

  return (
    <ObjectRenderer object={object}>
      {children}
    </ObjectRenderer>
  );
}

// 材质编辑器组件
export function MaterialEditor({ objectId }: { objectId: string }) {
  const { materials } = useTripo();
  const object = scene.get(objectId);

  if (!object) return null;

  return (
    <div className="material-editor">
      <ColorPicker
        value={object.material?.color || '#ffffff'}
        onChange={(color) => scene.update(objectId, {
          material: { ...object.material, color }
        })}
      />
      <Slider
        label="金属度"
        value={object.material?.metalness || 0}
        onChange={(metalness) => scene.update(objectId, {
          material: { ...object.material, metalness }
        })}
      />
    </div>
  );
}

// 完整应用示例
function App() {
  const { scene, selection } = useTripo();

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={() => scene.addMesh({
          geometry: { type: 'box', size: 1 },
          material: { color: '#ff0000' }
        })}>
          添加立方体
        </button>
      </div>

      <div className="main-area">
        <TripoCanvas />

        <div className="sidebar">
          {selection.selected.length > 0 && (
            <MaterialEditor objectId={selection.selected[0]} />
          )}
        </div>
      </div>
    </div>
  );
}
```

## 📊 自动性能优化

### 智能批量更新

```typescript
// 简化的性能管理 - 自动优化，开发者无需关心
class AutoPerformanceManager {
  private batchUpdates = new Map<string, Partial<SceneObject>>();
  private updateScheduled = false;

  updateObject(id: string, changes: Partial<SceneObject>) {
    // 自动合并更新
    const existing = this.batchUpdates.get(id) || {};
    this.batchUpdates.set(id, { ...existing, ...changes });

    // 自动批量处理
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  private flushUpdates() {
    // 批量应用所有更新
    this.batchUpdates.forEach((changes, id) => {
      this.applyChangesToThreeJS(id, changes);
    });

    this.batchUpdates.clear();
    this.updateScheduled = false;
  }

  // 智能资源管理
  private manageResources() {
    // 自动清理未使用的资源
    // 自动优化纹理大小
    // 自动合并相似材质
  }
}
```

## 🚀 实际使用示例

### 基础使用

```typescript
import { TripoProvider, useTripo, TripoCanvas } from '~/engine/DSL';

function SceneEditor() {
  const { scene, selection, history } = useTripo();

  // 添加对象 - 简单直观
  const addCube = () => {
    const id = scene.add({
      name: 'Cube',
      type: 'mesh',
      geometry: { type: 'box', size: 1 },
      material: { color: '#ff0000' },
      transform: { position: [0, 0, 0] }
    });
    selection.select([id]);  // 自动选中新创建的对象
  };

  // 修改选中对象
  const changeColor = (color: string) => {
    selection.selected.forEach(id => {
      scene.update(id, {
        material: { color }
      });
    });
  };

  return (
    <div className="editor">
      <div className="toolbar">
        <button onClick={addCube}>添加立方体</button>
        <button onClick={() => changeColor('#00ff00')}>变绿色</button>
        <button onClick={history.undo} disabled={!history.canUndo}>
          撤销
        </button>
      </div>

      <TripoCanvas />
    </div>
  );
}

function App() {
  return (
    <TripoProvider>
      <SceneEditor />
    </TripoProvider>
  );
}
```

### 工作区使用

```typescript
// Generate工作区 - 专注核心功能
function GenerateWorkspace() {
  const { generate, scene } = useGenerate();

  const handleGenerate = async () => {
    await generate.start();
    // 生成完成后自动添加到场景，无需复杂操作
  };

  return (
    <div className="generate-workspace">
      <div className="controls">
        <input
          value={generate.prompt}
          onChange={(e) => generate.setPrompt(e.target.value)}
          placeholder="输入生成提示..."
        />
        <button
          onClick={handleGenerate}
          disabled={generate.isGenerating}
        >
          {generate.isGenerating ? `生成中... ${generate.progress}%` : '开始生成'}
        </button>
      </div>

      <TripoCanvas />
    </div>
  );
}

// Texture工作区 - 材质编辑
function TextureWorkspace() {
  const { texture, selection, scene } = useTexture();

  return (
    <div className="texture-workspace">
      <div className="material-library">
        {texture.presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => texture.loadPreset(preset.id)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="material-editor">
        {texture.preview && (
          <MaterialControls
            material={texture.preview}
            onChange={(changes) => texture.setPreview({
              ...texture.preview,
              ...changes
            })}
          />
        )}

        <button
          onClick={texture.applyToSelected}
          disabled={selection.selected.length === 0}
        >
          应用到选中对象
        </button>
      </div>

      <TripoCanvas />
    </div>
  );
}
```

## 🔄 与现有代码的集成

### 渐进式迁移

```typescript
// 步骤1: 添加Provider，现有代码继续工作
function App() {
  return (
    <TripoProvider>
      <ExistingR3FApp />  {/* 现有代码不受影响 */}
    </TripoProvider>
  );
}

// 步骤2: 在新功能中使用简化API
function NewFeature() {
  const { scene } = useTripo();

  const addObject = () => {
    scene.add({
      name: 'New Object',
      geometry: { type: 'sphere', size: 1 },
      material: { color: '#0088ff' }
    });
  };

  return <button onClick={addObject}>Add Sphere</button>;
}

// 步骤3: 逐步迁移现有组件
function MigratedComponent() {
  // 旧代码：复杂的Three.js操作
  // const mesh = new THREE.Mesh(geometry, material);
  // scene.add(mesh);

  // 新代码：简化的DSL操作
  const { scene } = useTripo();
  scene.add({
    geometry: { type: 'box', size: 1 },
    material: { color: '#ffffff' }
  });
}
```

## 🎯 核心改进总结

### 架构简化

- **层次**: 6层 → 3层架构
- **复杂度**: 大幅降低，职责更清晰
- **维护性**: 更容易理解和扩展

### API统一

- **Hook数量**: 7个分散Hook → 1个主Hook + 工作区扩展
- **学习成本**: 显著降低，API更直观
- **开发效率**: 提高，减少查文档时间

### 配置简化

- **结构**: 深度嵌套 → 扁平化设计
- **复杂度**: 大幅简化，易于理解
- **可读性**: 更好，配置即文档

### 性能优化

- **自动化**: 智能批量更新，开发者无需关心
- **内存管理**: 自动资源清理和优化
- **渲染效率**: 批量操作，减少重渲染

### 开发体验

- **直观性**: API设计符合开发者期望
- **简洁性**: 代码更少，功能更强
- **一致性**: 统一的设计模式
- **渐进性**: 支持逐步迁移，降低风险

**TripoScript 2.1** 通过简化架构、统一接口、扁平化配置，将复杂的3D开发转换为直观的声明式API，让开发者能够专注于业务逻辑而非底层实现细节。
