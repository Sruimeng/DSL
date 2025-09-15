import type { Scene, Object3D, Material, Geometry } from 'three';
import type { USDScene } from '../USD/types/core';

export interface DSLScene {
  id: string;
  name: string;
  objects: Map<string, DSLObject>;
  root: DSLObject;
  metadata: Record<string, any>;
}

export interface DSLObject {
  id: string;
  name: string;
  type: DSLObjectType;
  transform: DSLTransform;
  visible: boolean;
  parent?: string;
  children: string[];
  components: Map<string, DSLComponent>;
  metadata: Record<string, any>;
}

export type DSLObjectType =
  | 'group'
  | 'mesh'
  | 'light'
  | 'camera'
  | 'usd-prim'
  | 'gltf-model';

export interface DSLTransform {
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  scale: [number, number, number];
  matrix?: number[]; // 4x4 matrix
}

export interface DSLComponent {
  id: string;
  type: string;
  data: any;
  enabled: boolean;
}

export interface DSLMeshComponent extends DSLComponent {
  type: 'mesh';
  data: {
    geometry: string;
    material: string;
    castShadow: boolean;
    receiveShadow: boolean;
  };
}

export interface DSLMaterialComponent extends DSLComponent {
  type: 'material';
  data: {
    type: 'pbr' | 'basic' | 'phong';
    color?: [number, number, number];
    roughness?: number;
    metalness?: number;
    opacity?: number;
    map?: string;
    normalMap?: string;
  };
}

export interface DSLLightComponent extends DSLComponent {
  type: 'light';
  data: {
    lightType: 'directional' | 'point' | 'spot' | 'ambient';
    color: [number, number, number];
    intensity: number;
    distance?: number;
    angle?: number;
    penumbra?: number;
  };
}

export interface DSLCameraComponent extends DSLComponent {
  type: 'camera';
  data: {
    cameraType: 'perspective' | 'orthographic';
    fov?: number;
    aspect?: number;
    near: number;
    far: number;
    zoom?: number;
  };
}

export interface DSLState {
  scene: DSLScene;
  selectedObjects: string[];
  hoveredObjects: string[];
  commandHistory: CommandHistory;
  resources: ResourceManager;
}

export interface CommandHistory {
  commands: Command[];
  currentIndex: number;
  maxSize: number;
}

export interface Command {
  id: string;
  name: string;
  execute(): void;
  undo(): void;
  redo(): void;
  timestamp: number;
}

export interface ResourceManager {
  geometries: Map<string, any>;
  materials: Map<string, any>;
  textures: Map<string, any>;
}

export interface DSLEngineOptions {
  enableUndoRedo?: boolean;
  maxUndoStackSize?: number;
  enableUSDIntegration?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export type SceneUpdateCallback = (scene: DSLScene) => void;
export type ObjectUpdateCallback = (object: DSLObject) => void;
export type SelectionCallback = (selectedIds: string[]) => void;

export interface DSLPlugin {
  name: string;
  version: string;
  initialize(engine: DSLEngine): void;
  destroy(): void;
}

export interface DSLEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface DSLEventBus {
  emit(event: DSLEvent): void;
  on(type: string, callback: (event: DSLEvent) => void): () => void;
  off(type: string, callback: (event: DSLEvent) => void): void;
}

export interface USDExportOptions {
  includeMetadata?: boolean;
  embedTextures?: boolean;
  compressGeometry?: boolean;
}

export interface USDImportOptions {
  preservePrimPaths?: boolean;
  convertMaterials?: boolean;
  mergeTransforms?: boolean;
}

export interface DSLEngine {
  readonly scene: DSLScene;
  readonly state: DSLState;
  readonly version: string;

  // Scene Management
  createObject(type: DSLObjectType, parentId?: string): string;
  getObject(id: string): DSLObject | undefined;
  updateObject(id: string, changes: Partial<DSLObject>): void;
  deleteObject(id: string): void;
  duplicateObject(id: string): string;
  reparentObject(id: string, newParentId?: string): void;

  // Component Management
  addComponent(objectId: string, component: DSLComponent): void;
  updateComponent(objectId: string, componentId: string, data: any): void;
  removeComponent(objectId: string, componentId: string): void;
  getComponent(objectId: string, componentId: string): DSLComponent | undefined;

  // Selection
  selectObject(id: string | string[], append?: boolean): void;
  deselectObject(id: string | string[]): void;
  clearSelection(): void;
  getSelectedObjects(): DSLObject[];

  // Command System
  executeCommand(command: Command): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;

  // Events
  subscribe(callback: SceneUpdateCallback): () => void;
  subscribeToObject(id: string, callback: ObjectUpdateCallback): () => void;
  subscribeToSelection(callback: SelectionCallback): () => void;

  // USD Integration
  exportToUSD(options?: USDExportOptions): Promise<USDScene>;
  importFromUSD(usdScene: USDScene, options?: USDImportOptions): Promise<void>;
  syncWithUSD(usdScene: USDScene): void;

  // Resources
  loadGeometry(id: string, geometry: any): void;
  loadMaterial(id: string, material: any): void;
  loadTexture(id: string, texture: any): void;

  // Plugins
  registerPlugin(plugin: DSLPlugin): void;
  unregisterPlugin(name: string): void;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;
}