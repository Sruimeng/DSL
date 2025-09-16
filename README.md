# Three.js USD DSL 项目文档

---

## 1. 仓库文件架构

```
DSL/
├── README.md
├── package.json
├── tsconfig.json
├── docs/
│   ├── overview.md
│   ├── usd-format.md
│   ├── dsl-specification.md
│   ├── plugin-guide.md
│   ├── action-guide.md
│   ├── mcp-integration.md
│   └── api-reference.md
├── src/
│   ├── type/
│   │   ├── index.ts                  # USD类型定义入口
│   │   ├── scene.ts                   # USD场景相关类型
│   │   ├── camera.ts                  # USD相机相关类型
│   │   ├── renderer.ts                # USD渲染器相关类型
│   │   └── ...                        # USD其他类型
│   ├── core/
│   │   ├── scene-manager.ts          # Three.js 场景管理核心
│   │   ├── USD-loader.ts             # USD JSON 加载器
│   │   ├── DSL-parser.ts             # DSL 解析器，USD JSON 转 Three.js 对象
│   │   ├── event-bus.ts              # 事件总线，模块间通信
│   │   └── DSL-engine.ts             # DSL Engine 核心驱动器
│   ├── plugins/
│   │   ├── base-plugin.ts            # 插件基类
│   │   ├── render-plugin.ts          # 渲染相关插件
│   │   ├── interaction-plugin.ts    # 交互插件
│   │   └── ...                     # 其他插件
│   ├── actions/
│   │   ├── base-action.ts            # 动作基类
│   │   ├── add-mesh-action.ts         # 添加网格动作
│   │   ├── remove-mesh-action.ts      # 删除网格动作
│   │   ├── modify-property-action.ts  # 修改属性动作
│   │   ├── undo-redo-action.ts        # 撤销重做动作
│   │   └── ...                     # 其他动作
│   ├── mcp/
│   │   └── MCP-controller.ts         # AI MCP 调用接口（不需要实现）
│   ├── utils/
│   │   ├── math-utils.ts             # 数学工具
│   │   ├── json-utils.ts             # JSON 处理工具
│   │   └── ...                     # 其他工具
│   ├── index.ts                    # 入口文件，导出核心 API
├── demo/
│   ├── index.html                   # 主演示页面
│   ├── assets/                      # 演示资源
│   │   ├── animated-scene.json      # 动画场景数据
│   │   ├── basic-scene.json         # 基础场景数据
│   │   ├── camera-setups.json       # 相机配置数据
│   │   ├── materials-and-lights.json # 材质和灯光数据
│   │   └── renderer-configs.json    # 渲染器配置数据
│   ├── html/                        # HTML 演示页面
│   │   ├── basic-dsl.html           # 基础 DSL 演示
│   │   ├── gltf-demo.html           # GLTF 模型演示
│   │   ├── material-dsl.html        # 材质演示
│   │   ├── node-tree-dsl.html       # 节点树演示
│   │   └── undo-redo-demo.html      # 撤销重做演示
│   ├── src/                         # TypeScript 演示代码
│   │   ├── basic-scene.ts           # 基础场景演示
│   │   ├── plugin-demo.ts           # 插件演示
│   │   ├── mcp-demo.ts              # MCP 调用演示
│   │   ├── material-demo.ts         # 材质演示
│   │   ├── model-demo.ts            # 模型演示
│   │   ├── undo-redo-demo.ts        # 撤销重做演示
│   │   └── index.ts                 # 演示索引
│   └── styles/                      # 样式文件
│       └── gltf-demo.css            # GLTF 演示样式
└── dist/                          # 编译输出目录
```

---

## 2. 模块主要功能及 API 设计

### 2.1 DSLEngine（核心驱动器）

- **功能**
  解析 DSL JSON，管理场景状态，调度插件和动作，提供统一接口。

- **主要接口**

```ts
interface DSLEngine {
  loadDSL(dslJson: object): Promise<void>;
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(pluginName: string): void;
  registerAction(actionName: string, actionClass: typeof Action): void;
  executeAction(actionName: string, params: any): Promise<void>;
  getSceneState(): SceneState;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

---

### 2.2 SceneManager

- **功能**
  管理 Three.js 场景、相机、渲染器，处理渲染循环和资源管理。

- **主要接口**

```ts
class SceneManager {
  init(sceneObjects: THREE.Object3D[]): void;
  addObject(object: THREE.Object3D): void;
  removeObject(object: THREE.Object3D): void;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(plugin: Plugin): void;
}
```

---

### 2.3 USDLoader

- **功能**
  异步加载 USD JSON 文件，返回 DSL JSON。

- **主要接口**

```ts
class USDLoader {
  static load(url: string): Promise<object>;
}
```

---

### 2.4 DSLParser

- **功能**
  将 USD JSON 解析为 Three.js 对象数组。

- **主要接口**

```ts
class DSLParser {
  static parse(dslJson: object): THREE.Object3D[];
}
```

---

### 2.5 Plugin（基类）

- **功能**
  封装功能模块，支持生命周期和事件通信。

- **接口**

```ts
interface Plugin {
  onRegister(engine: DSLEngine): void;
  onUnregister(): void;
  update?(deltaTime: number): void;
}
```

---

### 2.6 Action（基类）

- **功能**
  定义场景操作行为，支持异步执行。

- **接口**

```ts
interface Action {
  execute(engine: DSLEngine, params?: any): Promise<void>;
}
```

---

### 2.7 MCPController（不需要实现）

- **功能**
  AI MCP 调用接口，桥接 AI 与 DSL Engine，纯程序接口，无 UI。

- **接口**

```ts
class MCPController {
  constructor(engine: DSLEngine);
  registerAction(name: string, actionClass: typeof Action): void;
  callAction(name: string, params: any): Promise<void>;
}
```

---

## 3. 预想中的 Demo 伪代码

```ts
import { DSLEngine } from './core/DSLEngine';
import { USDLoader } from './core/USDLoader';
import { DSLParser } from './core/DSLParser';
import { MCPController } from './mcp/MCPController';
import { AddMeshAction } from './actions/AddMeshAction';
import { CustomPlugin } from './plugins/CustomPlugin';

async function main() {
  // 1. 加载 USD JSON 场景描述
  const usdJson = await USDLoader.load('path/to/scene.usd.json');

  // 2. 初始化 DSL Engine
  const engine = new DSLEngine();

  // 3. 解析 DSL JSON，生成 Three.js 对象
  const sceneObjects = DSLParser.parse(usdJson);

  // 4. 初始化场景管理器，传入对象
  engine.loadDSL(usdJson);

  // 5. 注册插件
  const plugin = new CustomPlugin();
  engine.registerPlugin(plugin);

  // 6. 注册动作
  engine.registerAction('AddMesh', AddMeshAction);

  // 7. 初始化 MCPController（不需要实现），方便 AI 调用
  const mcp = new MCPController(engine);
  mcp.registerAction('AddMesh', AddMeshAction);

  // 8. AI 通过 MCP 调用动作，添加一个红色立方体
  await mcp.callAction('AddMesh', {
    geometry: 'BoxGeometry',
    size: 1,
    color: '#ff0000',
    position: [0, 1, 0]
  });

  // 9. 启动渲染循环
  engine.getSceneManager().startRenderLoop();
}

main().catch(console.error);
```

### 4.1 主要问题

1. **导出结构不完整**：index.ts 导出错误。
2. **重复类型定义**：`geometry.ts` 和 `primitive.ts` 中存在重复。
3. **命名不一致**：类型命名缺乏统一规范。
4. **过度使用 unknown 类型**：降低类型安全性。
5. **类型定义过于复杂**：缺乏必需属性定义。
6. **缺少类型约束和验证**：可能接受无效值。
7. **循环依赖风险**：模块间潜在依赖问题。

### 4.2 解决方案

#### 修复导出结构

```typescript
export * from './common';
export * from './scene';
export * from './camera';
export * from './renderer';
export * from './geometry';
export * from './material';
export * from './light';
export * from './animation';
export * from './primitive';
export * from './engine';
```

#### 统一几何体定义

```typescript
export interface CubePrim extends USDPrim {
  type: 'Cube';
  size: number;
  center?: Vector3;
}
```

#### 改进类型安全性

```typescript
export interface EventData {
  [EventType.SCENE_LOADED]: { sceneId: string };
  [EventType.OBJECT_ADDED]: { objectId: string; object: THREE.Object3D };
}

export type EventHandler<T extends EventType> = (data: EventData[T]) => void;
```

#### 添加类型验证

```typescript
export class TypeValidator {
  static validateUSDPrim(prim: any): prim is USDPrim {
    return (
      typeof prim === 'object' &&
      typeof prim.name === 'string' &&
      typeof prim.type === 'string'
    );
  }
}
```
