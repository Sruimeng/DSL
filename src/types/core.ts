import type { Vector2, Vector3 } from 'three';

// 基础变换类型
export interface Transform {
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

// 几何体类型
export type GeometryType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus' | 'model';

export interface GeometryRef {
  id: string;
}

export interface GeometryInline {
  type: GeometryType;
  size?: number | Vector3;
  segments?: number | Vector2;
  radius?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  url?: string; // 用于model类型
}

export type Geometry = GeometryRef | GeometryInline;

// 材质类型
export type MaterialType = 'standard' | 'basic' | 'wireframe' | 'phong' | 'lambert';

export interface MaterialRef {
  id: string;
}

export interface MaterialInline {
  id?: string;
  name?: string;
  type?: MaterialType;
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  map?: string; // 纹理URL
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
}

export type Material = MaterialRef | MaterialInline;

// 灯光类型
export type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';

export interface Light {
  id: string;
  name: string;
  type: LightType;
  color?: string;
  intensity?: number;
  position?: Vector3;
  target?: Vector3;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  groundColor?: string; // 用于hemisphere光源
  castShadow?: boolean;
}

// 相机类型
export interface Camera {
  type: 'perspective' | 'orthographic';
  position: Vector3;
  target: Vector3;
  fov?: number; // 透视相机视角
  aspect?: number;
  near?: number;
  far?: number;
  left?: number; // 正交相机参数
  right?: number;
  top?: number;
  bottom?: number;
}

// 场景对象类型
export type SceneObjectType = 'mesh' | 'group' | 'light' | 'helper';

export interface SceneObject {
  id: string;
  name: string;
  type: SceneObjectType;
  geometry?: Geometry;
  material?: Material;
  transform: Transform;
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  parent?: string;
  children?: string[];
  userData?: Record<string, any>;
}

// 环境设置
export interface Background {
  type: 'color' | 'texture' | 'hdri';
  value?: string;
  color?: string;
}

export interface Fog {
  type: 'linear' | 'exponential';
  color: string;
  near?: number;
  far?: number;
  density?: number;
}

export interface ShadowSettings {
  enabled: boolean;
  type: 'basic' | 'pcf' | 'pcfsoft';
  mapSize: number;
  camera?: {
    near: number;
    far: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface Environment {
  background?: Background;
  fog?: Fog;
  shadows?: ShadowSettings;
}

// 工作区数据
export type WorkspaceType = 'generate' | 'texture' | 'rigging' | 'animation' | 'edit';

export interface WorkspaceData {
  type: WorkspaceType;
  settings: Record<string, any>;
  history: any[];
}

// 完整场景配置
export interface DSLScene {
  id: string;
  name: string;
  version?: '1.0';
  objects: SceneObject[];
  materials: Material[];
  lights: Light[];
  camera: Camera;
  environment: Environment;
  workspace?: WorkspaceData;
  selection: string[];
  metadata: {
    created: number;
    modified: number;
    version: string;
  };
}

// 操作类型
export type OperationType = 'add' | 'update' | 'remove' | 'batch';

export interface Operation {
  type: OperationType;
  id?: string;
  object?: Partial<SceneObject>;
  changes?: Partial<SceneObject>;
  operations?: Operation[];
}

export enum ActionTypes {
  /**
   * 添加对象
   */
  ADD_OBJECT = 'ADD_OBJECT',
  /**
   * 更新对象
   */
  UPDATE_OBJECT = 'UPDATE_OBJECT',
  /**
   * 删除对象
   */
  REMOVE_OBJECT = 'REMOVE_OBJECT',
  /**
   * 复制对象
   */
  DUPLICATE_OBJECT = 'DUPLICATE_OBJECT',
  /**
   * 移动对象 - 改变对象的父子关系和层级位置
   */
  MOVE_OBJECT = 'MOVE_OBJECT',
  /**
   * 重新排序子对象 - 调整同级对象的顺序
   */
  REORDER_CHILDREN = 'REORDER_CHILDREN',
  /**
   * 添加材质 - 创建新的材质定义
   */
  ADD_MATERIAL = 'ADD_MATERIAL',
  /**
   * 更新材质 - 修改现有材质的属性
   */
  UPDATE_MATERIAL = 'UPDATE_MATERIAL',
  /**
   * 应用材质 - 将材质分配给指定对象
   */
  APPLY_MATERIAL = 'APPLY_MATERIAL',
  /**
   * 选择对象 - 设置场景中的选中状态
   */
  SELECT = 'SELECT',
  /**
   * 清除选择 - 取消所有对象的选中状态
   */
  CLEAR_SELECTION = 'CLEAR_SELECTION',
  /**
   * 更新相机 - 修改相机位置、角度等参数
   */
  UPDATE_CAMERA = 'UPDATE_CAMERA',
  /**
   * 更新环境 - 修改背景、雾等环境设置
   */
  UPDATE_ENVIRONMENT = 'UPDATE_ENVIRONMENT',
  /**
   * 添加光源 - 创建新的光源对象
   */
  ADD_LIGHT = 'ADD_LIGHT',
  /**
   * 更新光源 - 修改现有光源的属性
   */
  UPDATE_LIGHT = 'UPDATE_LIGHT',
  /**
   * 删除光源 - 移除指定的光源对象
   */
  REMOVE_LIGHT = 'REMOVE_LIGHT',
  /**
   * 重置场景 - 清空场景并恢复到初始状态
   */
  RESET_SCENE = 'RESET_SCENE',
  /**
   * 加载场景 - 从外部数据加载完整场景配置
   */
  LOAD_SCENE = 'LOAD_SCENE',
}

// Action类型 - DSL引擎的状态变更操作
export type DSLAction =
  // 对象操作
  | { type: ActionTypes.ADD_OBJECT; payload: Partial<SceneObject> }
  | { type: ActionTypes.UPDATE_OBJECT; payload: { id: string; changes: Partial<SceneObject> } }
  | { type: ActionTypes.REMOVE_OBJECT; payload: { id: string } }
  | { type: ActionTypes.DUPLICATE_OBJECT; payload: { id: string } }

  // 节点树操作
  | { type: ActionTypes.MOVE_OBJECT; payload: { id: string; parentId?: string; index?: number } }
  | { type: ActionTypes.REORDER_CHILDREN; payload: { parentId: string; childIds: string[] } }

  // 材质操作
  | { type: ActionTypes.ADD_MATERIAL; payload: Partial<MaterialInline> }
  | { type: ActionTypes.UPDATE_MATERIAL; payload: { id: string; changes: Partial<MaterialInline> } }
  | { type: ActionTypes.APPLY_MATERIAL; payload: { objectIds: string[]; materialId: string } }

  // 选择操作
  | { type: ActionTypes.SELECT; payload: { ids: string[]; mode: 'set' | 'add' | 'toggle' } }
  | { type: ActionTypes.CLEAR_SELECTION }

  // 环境操作
  | { type: ActionTypes.UPDATE_CAMERA; payload: Partial<Camera> }
  | { type: ActionTypes.UPDATE_ENVIRONMENT; payload: Partial<Environment> }
  | { type: ActionTypes.ADD_LIGHT; payload: Partial<Light> }
  | { type: ActionTypes.UPDATE_LIGHT; payload: { id: string; changes: Partial<Light> } }
  | { type: ActionTypes.REMOVE_LIGHT; payload: { id: string } }

  // 场景操作
  | { type: ActionTypes.RESET_SCENE }
  | { type: ActionTypes.LOAD_SCENE; payload: DSLScene };

// Hook返回类型
export interface DSLSceneAPI {
  objects: SceneObject[];
  add: (object: Partial<SceneObject>) => string;
  update: (id: string, changes: Partial<SceneObject>) => void;
  remove: (id: string) => void;
  find: (predicate: (obj: SceneObject) => boolean) => SceneObject[];
  get: (id: string) => SceneObject | null;
  batch: (operations: Operation[]) => void;

  // 节点树操作
  moveObject: (id: string, parentId?: string, index?: number) => void;
  reorderChildren: (parentId: string, childIds: string[]) => void;
  getChildren: (parentId: string) => SceneObject[];
  getParent: (childId: string) => SceneObject | null;
}

export interface DSLSelectionAPI {
  selected: string[];
  select: (ids: string[]) => void;
  add: (ids: string[]) => void;
  remove: (ids: string[]) => void;
  clear: () => void;
  toggle: (id: string) => void;
}

export interface DSLHistoryAPI {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export interface DSLWorkspaceAPI {
  current: WorkspaceType;
  switch: (type: WorkspaceType) => void;
  data: WorkspaceData;
  update: (data: Partial<WorkspaceData>) => void;
}

export interface DSLMaterialsAPI {
  list: Material[];
  create: (material: Partial<MaterialInline>) => string;
  update: (id: string, changes: Partial<MaterialInline>) => void;
  apply: (objectIds: string[], materialId: string) => void;
}

export interface DSLIOAPI {
  export: () => DSLScene;
  import: (scene: DSLScene) => void;
  reset: () => void;
}

export interface DSLAPI {
  scene: DSLSceneAPI;
  selection: DSLSelectionAPI;
  history: DSLHistoryAPI;
  workspace: DSLWorkspaceAPI;
  materials: DSLMaterialsAPI;
  io: DSLIOAPI;
}

// 生成工作区扩展
export interface GeneratedModel {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface DSLGenerateAPI extends DSLAPI {
  generate: {
    prompt: string;
    setPrompt: (prompt: string) => void;
    isGenerating: boolean;
    progress: number;
    start: () => Promise<void>;
    cancel: () => void;
    addResult: (model: GeneratedModel) => void;
  };
}

// 材质工作区扩展
export interface TripoTextureAPI extends DSLAPI {
  texture: {
    preview: MaterialInline | null;
    setPreview: (material: MaterialInline) => void;
    applyToSelected: () => void;
    presets: MaterialInline[];
    loadPreset: (id: string) => void;
  };
}

// 骨骼绑定工作区扩展
export interface Bone {
  id: string;
  name: string;
  parent?: string;
  position: Vector3;
  rotation: Vector3;
  children?: string[];
}

export interface BoneWeight {
  boneId: string;
  weight: number;
}

export interface DSLRiggingAPI extends DSLAPI {
  rigging: {
    bones: Bone[];
    addBone: (bone: Partial<Bone>) => void;
    selectBone: (id: string) => void;
    updateWeights: (vertexId: string, weights: BoneWeight[]) => void;
  };
}

// 便捷配置类型
export interface MeshConfig {
  name?: string;
  geometry: GeometryInline;
  material?: MaterialInline;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

export interface LightConfig {
  type: LightType;
  color?: string;
  intensity?: number;
  position?: Vector3;
  target?: Vector3;
  castShadow?: boolean;
}

export interface WireframeConfig {
  name?: string;
  geometry: GeometryInline;
  color?: string;
  position?: Vector3;
}
