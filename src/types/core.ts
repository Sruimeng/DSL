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
export interface TripoScene {
  id: string;
  name: string;
  version?: '2.1';
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

// Action类型 - DSL引擎的状态变更操作
export type TripoAction =
  // 对象操作
  | { type: 'ADD_OBJECT'; payload: Partial<SceneObject> }
  | { type: 'UPDATE_OBJECT'; payload: { id: string; changes: Partial<SceneObject> } }
  | { type: 'REMOVE_OBJECT'; payload: { id: string } }
  | { type: 'DUPLICATE_OBJECT'; payload: { id: string } }

  // 材质操作
  | { type: 'ADD_MATERIAL'; payload: Partial<MaterialInline> }
  | { type: 'UPDATE_MATERIAL'; payload: { id: string; changes: Partial<MaterialInline> } }
  | { type: 'APPLY_MATERIAL'; payload: { objectIds: string[]; materialId: string } }

  // 选择操作
  | { type: 'SELECT'; payload: { ids: string[]; mode: 'set' | 'add' | 'toggle' } }
  | { type: 'CLEAR_SELECTION' }

  // 环境操作
  | { type: 'UPDATE_CAMERA'; payload: Partial<Camera> }
  | { type: 'ADD_LIGHT'; payload: Partial<Light> }
  | { type: 'UPDATE_LIGHT'; payload: { id: string; changes: Partial<Light> } }
  | { type: 'REMOVE_LIGHT'; payload: { id: string } }

  // 场景操作
  | { type: 'RESET_SCENE' }
  | { type: 'LOAD_SCENE'; payload: TripoScene };

// Hook返回类型
export interface TripoSceneAPI {
  objects: SceneObject[];
  add: (object: Partial<SceneObject>) => string;
  update: (id: string, changes: Partial<SceneObject>) => void;
  remove: (id: string) => void;
  find: (predicate: (obj: SceneObject) => boolean) => SceneObject[];
  get: (id: string) => SceneObject | null;
  batch: (operations: Operation[]) => void;
}

export interface TripoSelectionAPI {
  selected: string[];
  select: (ids: string[]) => void;
  add: (ids: string[]) => void;
  remove: (ids: string[]) => void;
  clear: () => void;
  toggle: (id: string) => void;
}

export interface TripoHistoryAPI {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export interface TripoWorkspaceAPI {
  current: WorkspaceType;
  switch: (type: WorkspaceType) => void;
  data: WorkspaceData;
  update: (data: Partial<WorkspaceData>) => void;
}

export interface TripoMaterialsAPI {
  list: Material[];
  create: (material: Partial<MaterialInline>) => string;
  update: (id: string, changes: Partial<MaterialInline>) => void;
  apply: (objectIds: string[], materialId: string) => void;
}

export interface TripoIOAPI {
  export: () => TripoScene;
  import: (scene: TripoScene) => void;
  reset: () => void;
}

export interface TripoAPI {
  scene: TripoSceneAPI;
  selection: TripoSelectionAPI;
  history: TripoHistoryAPI;
  workspace: TripoWorkspaceAPI;
  materials: TripoMaterialsAPI;
  io: TripoIOAPI;
}

// 生成工作区扩展
export interface GeneratedModel {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface TripoGenerateAPI extends TripoAPI {
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
export interface TripoTextureAPI extends TripoAPI {
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
  position: [number, number, number];
  rotation: [number, number, number];
  children?: string[];
}

export interface BoneWeight {
  boneId: string;
  weight: number;
}

export interface TripoRiggingAPI extends TripoAPI {
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
