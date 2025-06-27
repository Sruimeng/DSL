// DSL引擎核心状态管理 - 使用Zustand
import { Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  MaterialInline,
  Operation,
  SceneObject,
  TripoScene,
  WorkspaceData,
  WorkspaceType,
} from '../types/core';

// 历史记录状态
interface HistoryState {
  past: TripoScene[];
  present: TripoScene;
  future: TripoScene[];
}

// 主状态接口
interface TripoStore {
  // 场景状态
  scene: TripoScene;

  // 选择状态
  selectedIds: string[];

  // 历史状态
  history: HistoryState;

  // 工作区状态
  currentWorkspace: WorkspaceType;

  // 材质预设
  materialPresets: MaterialInline[];

  // 操作方法 - 场景管理
  setScene: (scene: TripoScene) => void;
  addObject: (object: Partial<SceneObject>) => string;
  updateObject: (id: string, changes: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  batchOperations: (operations: Operation[]) => void;

  // 操作方法 - 选择管理
  setSelection: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  removeFromSelection: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;

  // 操作方法 - 历史管理
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  pushHistory: (scene: TripoScene) => void;

  // 操作方法 - 工作区管理
  switchWorkspace: (type: WorkspaceType) => void;
  updateWorkspaceData: (data: Partial<WorkspaceData>) => void;

  // 操作方法 - 材质管理
  createMaterial: (material: Partial<MaterialInline>) => string;
  updateMaterial: (id: string, changes: Partial<MaterialInline>) => void;
  applyMaterial: (objectIds: string[], materialId: string) => void;

  // 操作方法 - 导入导出
  exportScene: () => TripoScene;
  importScene: (scene: TripoScene) => void;
  resetScene: () => void;
}

// 默认场景配置
const createDefaultScene = (): TripoScene => ({
  id: uuidv4(),
  name: '新场景',
  version: '2.1',
  objects: [],
  materials: [],
  lights: [
    {
      id: uuidv4(),
      name: '环境光',
      type: 'ambient',
      color: '#ffffff',
      intensity: 0.4,
    },
    {
      id: uuidv4(),
      name: '方向光',
      type: 'directional',
      color: '#ffffff',
      intensity: 1,
      position: new Vector3(5, 5, 5),
      castShadow: true,
    },
  ],
  camera: {
    type: 'perspective',
    position: new Vector3(5, 5, 5),
    target: new Vector3(0, 0, 0),
    fov: 50,
    near: 0.1,
    far: 1000,
  },
  environment: {
    background: {
      type: 'color',
      value: '#f0f0f0',
    },
    shadows: {
      enabled: true,
      type: 'pcf',
      mapSize: 1024,
    },
  },
});

// 默认材质预设
const createDefaultMaterialPresets = (): MaterialInline[] => [
  {
    type: 'standard',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
  },
  {
    type: 'standard',
    color: '#ff0000',
    metalness: 0.1,
    roughness: 0.1,
  },
  {
    type: 'standard',
    color: '#00ff00',
    metalness: 0.1,
    roughness: 0.1,
  },
  {
    type: 'standard',
    color: '#0000ff',
    metalness: 0.1,
    roughness: 0.1,
  },
  {
    type: 'standard',
    color: '#ffd700',
    metalness: 0.9,
    roughness: 0.1,
  },
  {
    type: 'standard',
    color: '#c0c0c0',
    metalness: 0.8,
    roughness: 0.2,
  },
  {
    type: 'wireframe',
    color: '#000000',
    wireframe: true,
  },
];

// 创建store
export const useTripoStore = create<TripoStore>()(
  subscribeWithSelector((set, get) => {
    const defaultScene = createDefaultScene();

    return {
      // 初始状态
      scene: defaultScene,
      selectedIds: [],
      history: {
        past: [],
        present: defaultScene,
        future: [],
      },
      currentWorkspace: 'edit',
      materialPresets: createDefaultMaterialPresets(),

      // 场景管理方法
      setScene: (scene: TripoScene) => {
        set((state) => {
          const newState = { ...state, scene };
          return {
            ...newState,
            history: {
              ...state.history,
              present: scene,
            },
          };
        });
      },

      addObject: (object: Partial<SceneObject>) => {
        const id = uuidv4();
        const newObject: SceneObject = {
          id,
          name: object.name || `对象_${id.slice(0, 8)}`,
          type: object.type || 'mesh',
          transform: object.transform || { position: new Vector3(0, 0, 0) },
          visible: object.visible ?? true,
          castShadow: object.castShadow ?? false,
          receiveShadow: object.receiveShadow ?? false,
          ...object,
        };

        set((state) => {
          const newScene = {
            ...state.scene,
            objects: [...state.scene.objects, newObject],
          };

          return {
            ...state,
            scene: newScene,
            history: {
              past: [...state.history.past, state.history.present],
              present: newScene,
              future: [],
            },
          };
        });

        return id;
      },

      updateObject: (id: string, changes: Partial<SceneObject>) => {
        set((state) => {
          const newObjects = state.scene.objects.map((obj) =>
            obj.id === id ? { ...obj, ...changes } : obj,
          );

          const newScene = {
            ...state.scene,
            objects: newObjects,
          };

          return {
            ...state,
            scene: newScene,
            history: {
              past: [...state.history.past, state.history.present],
              present: newScene,
              future: [],
            },
          };
        });
      },

      removeObject: (id: string) => {
        set((state) => {
          const newObjects = state.scene.objects.filter((obj) => obj.id !== id);
          const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);

          const newScene = {
            ...state.scene,
            objects: newObjects,
          };

          return {
            ...state,
            scene: newScene,
            selectedIds: newSelectedIds,
            history: {
              past: [...state.history.past, state.history.present],
              present: newScene,
              future: [],
            },
          };
        });
      },

      batchOperations: (operations: Operation[]) => {
        set((state) => {
          let newObjects = [...state.scene.objects];
          let newSelectedIds = [...state.selectedIds];

          operations.forEach((op) => {
            switch (op.type) {
              case 'add':
                if (op.object) {
                  const id = uuidv4();
                  const newObject: SceneObject = {
                    id,
                    name: op.object.name || `对象_${id.slice(0, 8)}`,
                    type: op.object.type || 'mesh',
                    transform: op.object.transform || { position: new Vector3(0, 0, 0) },
                    visible: op.object.visible ?? true,
                    castShadow: op.object.castShadow ?? false,
                    receiveShadow: op.object.receiveShadow ?? false,
                    ...op.object,
                  };
                  newObjects.push(newObject);
                }
                break;
              case 'update':
                if (op.id && op.changes) {
                  newObjects = newObjects.map((obj) =>
                    obj.id === op.id ? { ...obj, ...op.changes } : obj,
                  );
                }
                break;
              case 'remove':
                if (op.id) {
                  newObjects = newObjects.filter((obj) => obj.id !== op.id);
                  newSelectedIds = newSelectedIds.filter((selectedId) => selectedId !== op.id);
                }
                break;
            }
          });

          const newScene = {
            ...state.scene,
            objects: newObjects,
          };

          return {
            ...state,
            scene: newScene,
            selectedIds: newSelectedIds,
            history: {
              past: [...state.history.past, state.history.present],
              present: newScene,
              future: [],
            },
          };
        });
      },

      // 选择管理方法
      setSelection: (ids: string[]) => {
        set((state) => ({ ...state, selectedIds: ids }));
      },

      addToSelection: (ids: string[]) => {
        set((state) => ({
          ...state,
          selectedIds: [...new Set([...state.selectedIds, ...ids])],
        }));
      },

      removeFromSelection: (ids: string[]) => {
        set((state) => ({
          ...state,
          selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        }));
      },

      clearSelection: () => {
        set((state) => ({ ...state, selectedIds: [] }));
      },

      toggleSelection: (id: string) => {
        set((state) => {
          const isSelected = state.selectedIds.includes(id);
          const newSelectedIds = isSelected
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id];

          return { ...state, selectedIds: newSelectedIds };
        });
      },

      // 历史管理方法
      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return state;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          return {
            ...state,
            scene: previous,
            history: {
              past: newPast,
              present: previous,
              future: [state.history.present, ...state.history.future],
            },
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return state;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          return {
            ...state,
            scene: next,
            history: {
              past: [...state.history.past, state.history.present],
              present: next,
              future: newFuture,
            },
          };
        });
      },

      clearHistory: () => {
        set((state) => ({
          ...state,
          history: {
            past: [],
            present: state.scene,
            future: [],
          },
        }));
      },

      pushHistory: (scene: TripoScene) => {
        set((state) => ({
          ...state,
          history: {
            past: [...state.history.past, state.history.present],
            present: scene,
            future: [],
          },
        }));
      },

      // 工作区管理方法
      switchWorkspace: (type: WorkspaceType) => {
        set((state) => ({ ...state, currentWorkspace: type }));
      },

      updateWorkspaceData: (data: Partial<WorkspaceData>) => {
        set((state) => ({
          ...state,
          scene: {
            ...state.scene,
            workspace: {
              ...state.scene.workspace,
              ...data,
            } as WorkspaceData,
          },
        }));
      },

      // 材质管理方法
      createMaterial: (material: Partial<MaterialInline>) => {
        const id = uuidv4();
        const newMaterial: MaterialInline = {
          type: 'standard',
          color: '#ffffff',
          metalness: 0,
          roughness: 0.5,
          opacity: 1,
          ...material,
        };

        set((state) => ({
          ...state,
          scene: {
            ...state.scene,
            materials: [...state.scene.materials, { id, ...newMaterial }],
          },
        }));

        return id;
      },

      updateMaterial: (id: string, changes: Partial<MaterialInline>) => {
        set((state) => ({
          ...state,
          scene: {
            ...state.scene,
            materials: state.scene.materials.map((material) =>
              'id' in material && material.id === id ? { ...material, ...changes } : material,
            ),
          },
        }));
      },

      applyMaterial: (objectIds: string[], materialId: string) => {
        set((state) => {
          const material = state.scene.materials.find((m) => 'id' in m && m.id === materialId);
          if (!material) return state;

          const newObjects = state.scene.objects.map((obj) =>
            objectIds.includes(obj.id) ? { ...obj, material: { id: materialId } } : obj,
          );

          const newScene = {
            ...state.scene,
            objects: newObjects,
          };

          return {
            ...state,
            scene: newScene,
            history: {
              past: [...state.history.past, state.history.present],
              present: newScene,
              future: [],
            },
          };
        });
      },

      // 导入导出方法
      exportScene: () => {
        return get().scene;
      },

      importScene: (scene: TripoScene) => {
        set((state) => ({
          ...state,
          scene,
          selectedIds: [],
          history: {
            past: [],
            present: scene,
            future: [],
          },
        }));
      },

      resetScene: () => {
        const newScene = createDefaultScene();
        set((state) => ({
          ...state,
          scene: newScene,
          selectedIds: [],
          history: {
            past: [],
            present: newScene,
            future: [],
          },
        }));
      },
    };
  }),
);

// 导出便捷选择器
export const useScene = () => useTripoStore((state) => state.scene);
export const useSelectedIds = () => useTripoStore((state) => state.selectedIds);
export const useHistory = () => useTripoStore((state) => state.history);
export const useCurrentWorkspace = () => useTripoStore((state) => state.currentWorkspace);
