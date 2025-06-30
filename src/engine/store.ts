// DSL引擎核心状态管理 - 使用Zustand
import { Vector3 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  DSLScene,
  MaterialInline,
  Operation,
  SceneObject,
  WorkspaceData,
  WorkspaceType,
} from '../types/core';

// 历史记录状态
interface HistoryState {
  past: DSLScene[];
  present: DSLScene;
  future: DSLScene[];
}

// 主状态接口
interface TripoStore {
  // 场景状态
  scene: DSLScene;

  // 选择状态
  selectedIds: string[];

  // 历史状态
  history: HistoryState;

  // 工作区状态
  currentWorkspace: WorkspaceType;

  // 材质预设
  materialPresets: MaterialInline[];

  // 操作方法 - 场景管理
  setScene: (scene: DSLScene) => void;
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
  pushHistory: (scene: DSLScene) => void;

  // 操作方法 - 工作区管理
  switchWorkspace: (type: WorkspaceType) => void;
  updateWorkspaceData: (data: Partial<WorkspaceData>) => void;

  // 操作方法 - 材质管理
  createMaterial: (material: Partial<MaterialInline>) => string;
  updateMaterial: (id: string, changes: Partial<MaterialInline>) => void;
  applyMaterial: (objectIds: string[], materialId: string) => void;

  // 操作方法 - 导入导出
  exportScene: () => DSLScene;
  importScene: (scene: DSLScene) => void;
  resetScene: () => void;

  // 操作方法 - 节点树管理
  moveObject: (id: string, parentId?: string, index?: number) => void;
  reorderChildren: (parentId: string, childIds: string[]) => void;
  getChildren: (parentId: string) => SceneObject[];
  getParent: (childId: string) => SceneObject | null;
}

// 默认场景配置
const createDefaultScene = (): DSLScene => ({
  id: generateUUID(),
  name: '新场景',
  version: '1.0',
  objects: [],
  materials: [],
  lights: [
    {
      id: generateUUID(),
      name: '环境光',
      type: 'ambient',
      color: '#ffffff',
      intensity: 0.4,
    },
    {
      id: generateUUID(),
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
  selection: [],
  metadata: {
    created: 0,
    modified: 0,
    version: '',
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
      setScene: (scene: DSLScene) => {
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
        const id = generateUUID();
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
                  const id = generateUUID();
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

      pushHistory: (scene: DSLScene) => {
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
        const id = generateUUID();
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

      importScene: (scene: DSLScene) => {
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

      // 节点树管理方法
      moveObject: (id: string, parentId?: string, index?: number) => {
        set((state) => {
          const objects = [...state.scene.objects];
          const targetObj = objects.find((obj) => obj.id === id);
          if (!targetObj) return state;

          // 移除目标对象从旧的父节点的children中
          if (targetObj.parent) {
            const oldParent = objects.find((obj) => obj.id === targetObj.parent);
            if (oldParent && oldParent.children) {
              oldParent.children = oldParent.children.filter((childId) => childId !== id);
            }
          }

          // 更新目标对象的parent
          targetObj.parent = parentId;

          // 将目标对象添加到新的父节点的children中
          if (parentId) {
            const newParent = objects.find((obj) => obj.id === parentId);
            if (newParent) {
              if (!newParent.children) {
                newParent.children = [];
              }

              // 如果指定了index，插入到指定位置，否则添加到末尾
              if (index !== undefined && index >= 0 && index <= newParent.children.length) {
                newParent.children.splice(index, 0, id);
              } else {
                newParent.children.push(id);
              }
            }
          }

          const newScene = {
            ...state.scene,
            objects,
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

      reorderChildren: (parentId: string, childIds: string[]) => {
        set((state) => {
          const objects = [...state.scene.objects];
          const parent = objects.find((obj) => obj.id === parentId);

          if (!parent) return state;

          // 验证所有childIds都是当前parent的子节点
          const currentChildren = parent.children || [];
          const validChildIds = childIds.filter((id) => currentChildren.includes(id));

          // 更新parent的children顺序
          parent.children = validChildIds;

          const newScene = {
            ...state.scene,
            objects,
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

      getChildren: (parentId: string) => {
        const state = get();
        return state.scene.objects.filter((obj) => obj.parent === parentId);
      },

      getParent: (childId: string) => {
        const state = get();
        const child = state.scene.objects.find((obj) => obj.id === childId);
        if (!child?.parent) return null;
        return state.scene.objects.find((obj) => obj.id === child.parent) || null;
      },
    };
  }),
);

// 导出便捷选择器
export const useScene = () => useTripoStore((state) => state.scene);
export const useSelectedIds = () => useTripoStore((state) => state.selectedIds);
export const useHistory = () => useTripoStore((state) => state.history);
export const useCurrentWorkspace = () => useTripoStore((state) => state.currentWorkspace);
