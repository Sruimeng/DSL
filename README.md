# TripoScript 2.1 - 极简3D场景DSL引擎

**TripoScript 2.1** 是一个框架无关的3D场景DSL引擎，采用状态+动作的纯函数式设计，支持React、Vue等任意前端框架。

## 🎯 设计哲学

### 核心原则

- **状态驱动** - 场景即数据，渲染即状态同步
- **框架无关** - 不依赖React/Vue，可在任意环境使用  
- **Action模式** - 通过Action修改场景，保证状态一致性
- **自动同步** - ThreeJS自动监听状态变化并更新渲染

### 解决的核心问题

- ❌ **框架耦合严重** → ✅ **完全框架无关**
- ❌ **Hook API 过于分散** → ✅ **统一的Action接口**
- ❌ **状态管理复杂** → ✅ **纯状态+监听模式**
- ❌ **渲染层混乱** → ✅ **自动状态同步渲染**

## 🏗️ 三层极简架构

```
┌─────────────────────────────────────┐
│        Business Layer               │  // React/Vue/原生JS 业务层
│     (UI Framework Components)       │
├─────────────────────────────────────┤
│         DSL Engine Core             │  // 纯JS - 场景状态 + Actions
│    (Scene State + Actions)          │
├─────────────────────────────────────┤
│       ThreeJS Renderer              │  // 纯ThreeJS - 监听状态变化
│     (Auto Scene Sync)               │
└─────────────────────────────────────┘
```

## 🔧 DSL引擎核心

### 场景状态结构

```typescript
// 极简场景状态 - 纯数据结构
interface TripoScene {
  // 基础信息
  id: string;
  name: string;
  
  // 场景对象 - 扁平存储
  objects: Record<string, SceneObject>;
  materials: Record<string, Material>;
  
  // 环境配置
  environment: {
    background?: string;
    lights: Record<string, Light>;
    camera: Camera;
  };
  
  // 选择状态
  selection: string[];
  
  // 元数据
  metadata: {
    created: number;
    modified: number;
    version: string;
  };
}

// 简化对象定义
interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'light';
  
  // 几何体 - 支持内联定义
  geometry?: {
    type: 'box' | 'sphere' | 'plane' | 'cylinder' | 'model';
    params: Record<string, any>;
  };
  
  // 材质引用
  materialId?: string;
  
  // 变换
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  
  // 层级关系
  parent?: string;
  children: string[];
  
  // 渲染属性
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
}
```

### Action系统

```typescript
// 所有场景修改都通过Action进行
type TripoAction =
  // 对象操作
  | { type: 'ADD_OBJECT'; payload: Partial<SceneObject> }
  | { type: 'UPDATE_OBJECT'; payload: { id: string; changes: Partial<SceneObject> } }
  | { type: 'REMOVE_OBJECT'; payload: { id: string } }
  | { type: 'DUPLICATE_OBJECT'; payload: { id: string } }
  
  // 材质操作
  | { type: 'ADD_MATERIAL'; payload: Partial<Material> }
  | { type: 'UPDATE_MATERIAL'; payload: { id: string; changes: Partial<Material> } }
  | { type: 'APPLY_MATERIAL'; payload: { objectIds: string[]; materialId: string } }
  
  // 选择操作
  | { type: 'SELECT'; payload: { ids: string[]; mode: 'set' | 'add' | 'toggle' } }
  | { type: 'CLEAR_SELECTION' }
  
  // 环境操作
  | { type: 'UPDATE_CAMERA'; payload: Partial<Camera> }
  | { type: 'UPDATE_ENVIRONMENT'; payload: Partial<Environment> }
  
  // 场景操作
  | { type: 'RESET_SCENE' }
  | { type: 'LOAD_SCENE'; payload: TripoScene };

// DSL引擎核心类
class TripoEngine {
  private scene: TripoScene;
  private listeners: Set<(scene: TripoScene) => void> = new Set();
  private history: TripoScene[] = [];
  private historyIndex = -1;

  constructor(initialScene?: Partial<TripoScene>) {
    this.scene = this.createDefaultScene(initialScene);
  }

  // 执行Action - 唯一修改状态的方式
  dispatch(action: TripoAction): void {
    const newScene = this.reduce(this.scene, action);
    
    if (newScene !== this.scene) {
      // 保存历史
      this.saveToHistory();
      this.scene = newScene;
      
      // 通知所有监听器
      this.listeners.forEach(listener => listener(this.scene));
    }
  }

  // 获取当前状态
  getScene(): TripoScene {
    return this.scene;
  }

  // 监听状态变化
  subscribe(listener: (scene: TripoScene) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Action处理器
  private reduce(scene: TripoScene, action: TripoAction): TripoScene {
    switch (action.type) {
      case 'ADD_OBJECT': {
        const id = generateId();
        const object: SceneObject = {
          id,
          name: action.payload.name || `Object_${id}`,
          type: action.payload.type || 'mesh',
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            ...action.payload.transform
          },
          children: [],
          visible: true,
          castShadow: false,
          receiveShadow: false,
          ...action.payload,
          id // 确保ID不被覆盖
        };
        
        return {
          ...scene,
          objects: { ...scene.objects, [id]: object },
          metadata: { ...scene.metadata, modified: Date.now() }
        };
      }

      case 'UPDATE_OBJECT': {
        const { id, changes } = action.payload;
        const existing = scene.objects[id];
        if (!existing) return scene;

        return {
          ...scene,
          objects: {
            ...scene.objects,
            [id]: { ...existing, ...changes }
          },
          metadata: { ...scene.metadata, modified: Date.now() }
        };
      }

      case 'SELECT': {
        const { ids, mode } = action.payload;
        let newSelection: string[];

        switch (mode) {
          case 'set':
            newSelection = ids;
            break;
          case 'add':
            newSelection = [...new Set([...scene.selection, ...ids])];
            break;
          case 'toggle':
            newSelection = scene.selection.includes(ids[0])
              ? scene.selection.filter(id => id !== ids[0])
              : [...scene.selection, ids[0]];
            break;
        }

        return { ...scene, selection: newSelection };
      }

      // ... 其他Action处理
      default:
        return scene;
    }
  }

  // 历史管理
  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.scene = this.history[this.historyIndex];
      this.listeners.forEach(listener => listener(this.scene));
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.scene = this.history[this.historyIndex];
      this.listeners.forEach(listener => listener(this.scene));
    }
  }
}
```

## 🎨 ThreeJS自动渲染器

```typescript
// ThreeJS渲染器 - 监听DSL状态变化并自动同步
class TripoRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private engine: TripoEngine;
  
  // 对象映射表 - DSL对象ID到ThreeJS对象
  private objectMap = new Map<string, THREE.Object3D>();
  private materialMap = new Map<string, THREE.Material>();

  constructor(canvas: HTMLCanvasElement, engine: TripoEngine) {
    this.engine = engine;
    this.setupThreeJS(canvas);
    this.setupSceneSync();
  }

  private setupThreeJS(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas });
    
    // 基础设置
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.shadowMap.enabled = true;
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  private setupSceneSync() {
    // 监听DSL状态变化
    this.engine.subscribe((dslScene) => {
      this.syncScene(dslScene);
      this.render();
    });

    // 初始同步
    this.syncScene(this.engine.getScene());
  }

  // 同步DSL场景到ThreeJS场景
  private syncScene(dslScene: TripoScene) {
    // 同步对象
    this.syncObjects(dslScene.objects);
    
    // 同步材质
    this.syncMaterials(dslScene.materials);
    
    // 同步环境
    this.syncEnvironment(dslScene.environment);
  }

  private syncObjects(objects: Record<string, SceneObject>) {
    const currentIds = new Set(Object.keys(objects));
    const existingIds = new Set(this.objectMap.keys());

    // 删除不存在的对象
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        const obj = this.objectMap.get(id);
        if (obj) {
          this.scene.remove(obj);
          this.objectMap.delete(id);
        }
      }
    });

    // 添加或更新对象
    Object.values(objects).forEach(dslObject => {
      let threeObject = this.objectMap.get(dslObject.id);

      if (!threeObject) {
        // 创建新对象
        threeObject = this.createThreeObject(dslObject);
        this.scene.add(threeObject);
        this.objectMap.set(dslObject.id, threeObject);
      } else {
        // 更新现有对象
        this.updateThreeObject(threeObject, dslObject);
      }
    });
  }

  private createThreeObject(dslObject: SceneObject): THREE.Object3D {
    let object: THREE.Object3D;

    switch (dslObject.type) {
      case 'mesh': {
        const geometry = this.createGeometry(dslObject.geometry);
        const material = this.getMaterial(dslObject.materialId);
        object = new THREE.Mesh(geometry, material);
        break;
      }
      case 'group': {
        object = new THREE.Group();
        break;
      }
      default:
        object = new THREE.Object3D();
    }

    // 设置属性
    this.updateThreeObject(object, dslObject);
    return object;
  }

  private updateThreeObject(threeObject: THREE.Object3D, dslObject: SceneObject) {
    // 更新变换
    const { position, rotation, scale } = dslObject.transform;
    threeObject.position.set(...position);
    threeObject.rotation.set(...rotation);
    threeObject.scale.set(...scale);

    // 更新属性
    threeObject.visible = dslObject.visible;
    threeObject.castShadow = dslObject.castShadow;
    threeObject.receiveShadow = dslObject.receiveShadow;

    // 更新材质
    if (threeObject instanceof THREE.Mesh && dslObject.materialId) {
      threeObject.material = this.getMaterial(dslObject.materialId);
    }
  }

  private createGeometry(geomDef?: SceneObject['geometry']): THREE.BufferGeometry {
    if (!geomDef) return new THREE.BoxGeometry();

    switch (geomDef.type) {
      case 'box':
        return new THREE.BoxGeometry(
          geomDef.params.width || 1,
          geomDef.params.height || 1,  
          geomDef.params.depth || 1
        );
      case 'sphere':
        return new THREE.SphereGeometry(
          geomDef.params.radius || 1,
          geomDef.params.widthSegments || 16,
          geomDef.params.heightSegments || 12
        );
      // ... 其他几何体类型
      default:
        return new THREE.BoxGeometry();
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // 公共方法
  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.render();
  }

  dispose() {
    this.renderer.dispose();
    // 清理资源...
  }
}
```

## 🚀 框架适配层

### React适配

```typescript
// React Hook封装
function useTripo(engine?: TripoEngine) {
  const [scene, setScene] = useState<TripoScene | null>(null);
  
  const engineRef = useRef(engine || new TripoEngine());
  
  useEffect(() => {
    const unsubscribe = engineRef.current.subscribe(setScene);
    setScene(engineRef.current.getScene());
    return unsubscribe;
  }, []);

  // 返回Action派发器和状态
  return {
    scene,
    dispatch: engineRef.current.dispatch.bind(engineRef.current),
    
    // 便捷方法
    addObject: (obj: Partial<SceneObject>) => 
      engineRef.current.dispatch({ type: 'ADD_OBJECT', payload: obj }),
    
    updateObject: (id: string, changes: Partial<SceneObject>) =>
      engineRef.current.dispatch({ type: 'UPDATE_OBJECT', payload: { id, changes } }),
    
    select: (ids: string[], mode: 'set' | 'add' | 'toggle' = 'set') =>
      engineRef.current.dispatch({ type: 'SELECT', payload: { ids, mode } }),
    
    undo: () => engineRef.current.undo(),
    redo: () => engineRef.current.redo(),
  };
}

// React组件
function TripoCanvas({ 
  engine, 
  onReady 
}: { 
  engine: TripoEngine;
  onReady?: (renderer: TripoRenderer) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TripoRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new TripoRenderer(canvasRef.current, engine);
      onReady?.(rendererRef.current);
    }

    return () => {
      rendererRef.current?.dispose();
    };
  }, [engine]);

  return <canvas ref={canvasRef} />;
}

// 使用示例
function App() {
  const engine = useMemo(() => new TripoEngine(), []);
  const { addObject, select, scene } = useTripo(engine);

  const addCube = () => {
    addObject({
      name: 'Cube',
      type: 'mesh',
      geometry: { type: 'box', params: { width: 1, height: 1, depth: 1 } },
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
    });
  };

  return (
    <div>
      <button onClick={addCube}>添加立方体</button>
      <TripoCanvas engine={engine} />
      
      {/* 对象列表 */}
      <div>
        {scene && Object.values(scene.objects).map(obj => (
          <div key={obj.id} onClick={() => select([obj.id])}>
            {obj.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue适配

```typescript
// Vue Composable
function useTripo(engine?: TripoEngine) {
  const engineInstance = engine || new TripoEngine();
  const scene = ref<TripoScene | null>(null);

  onMounted(() => {
    const unsubscribe = engineInstance.subscribe((newScene) => {
      scene.value = newScene;
    });
    scene.value = engineInstance.getScene();

    onUnmounted(() => {
      unsubscribe();
    });
  });

  return {
    scene: readonly(scene),
    dispatch: engineInstance.dispatch.bind(engineInstance),
    
    // 便捷方法
    addObject: (obj: Partial<SceneObject>) => 
      engineInstance.dispatch({ type: 'ADD_OBJECT', payload: obj }),
    
    updateObject: (id: string, changes: Partial<SceneObject>) =>
      engineInstance.dispatch({ type: 'UPDATE_OBJECT', payload: { id, changes } }),
    
    select: (ids: string[], mode: 'set' | 'add' | 'toggle' = 'set') =>
      engineInstance.dispatch({ type: 'SELECT', payload: { ids, mode } }),
  };
}

// Vue组件使用
const App = defineComponent({
  setup() {
    const engine = new TripoEngine();
    const { addObject, scene } = useTripo(engine);

    const addCube = () => {
      addObject({
        name: 'Cube',
        type: 'mesh',
        geometry: { type: 'box', params: { width: 1, height: 1, depth: 1 } }
      });
    };

    return {
      scene,
      addCube
    };
  },

  template: `
    <div>
      <button @click="addCube">添加立方体</button>
      <canvas ref="canvas"></canvas>
    </div>
  `
});
```

### 原生JS使用

```javascript
// 纯JS环境使用
const engine = new TripoEngine();
const canvas = document.getElementById('canvas');
const renderer = new TripoRenderer(canvas, engine);

// 添加对象
document.getElementById('addCube').addEventListener('click', () => {
  engine.dispatch({
    type: 'ADD_OBJECT',
    payload: {
      name: 'Cube',
      type: 'mesh',
      geometry: { type: 'box', params: { width: 1, height: 1, depth: 1 } }
    }
  });
});

// 监听场景变化
engine.subscribe((scene) => {
  console.log('场景已更新:', scene);
  updateUI(scene);
});
```

## 🎯 核心优势

### 完全解耦
- **框架无关**: 核心引擎不依赖任何UI框架
- **纯函数式**: 状态不可变，操作可预测
- **自动同步**: ThreeJS自动跟随DSL状态变化

### 极简API
- **单一数据源**: 场景状态就是唯一真相来源
- **Action模式**: 所有修改通过Action进行，保证一致性
- **自动渲染**: 状态变化自动触发重渲染

### 高性能
- **批量更新**: 自动合并多个状态变化
- **智能同步**: 只更新变化的部分
- **内存安全**: 自动资源管理和清理

### 易于扩展
- **插件系统**: 通过Action扩展功能
- **中间件**: 支持Action拦截和转换
- **多渲染器**: 可同时支持WebGL、WebGPU等

这种设计让DSL引擎成为纯粹的状态管理核心，ThreeJS负责渲染呈现，业务层可以使用任意框架进行UI交互，三者完全解耦且职责清晰。
