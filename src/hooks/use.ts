// 增强版 TripoScript Hook - 集成所有新能力
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  TripoInteractionManager,
  defaultInteractionConfig,
  type InteractionMode,
} from '../engine/interaction';
import { TripoModelLoader, type LoadOptions } from '../engine/loader';
import { useTripoStore } from '../engine/store';
import { WorkspaceExtensionManager } from '../engine/workspace-extensions';
import type {
  DSLAPI,
  DSLGenerateAPI,
  DSLRiggingAPI,
  DSLWorkspaceAPI,
  SceneObject,
  TripoTextureAPI,
  WorkspaceType,
} from '../types/core';

// Hook配置选项
export interface UseTripoEnhancedOptions {
  // 场景配置
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  canvas?: HTMLCanvasElement;

  // 交互配置
  enableInteraction?: boolean;
  interactionMode?: InteractionMode;

  // 加载器配置
  enableModelLoading?: boolean;
  modelLoadOptions?: LoadOptions;

  // 工作区配置
  workspace?: WorkspaceType;
  enableWorkspaceExtensions?: boolean;
}

// 增强版Hook返回值
export interface TripoEnhancedAPI extends DSLAPI {
  // 模型加载能力
  loader: {
    load: (url: string, options?: LoadOptions) => Promise<void>;
    isLoading: boolean;
    progress: number;
    error: string | null;
  };

  // 交互能力
  interaction: {
    mode: InteractionMode;
    setMode: (mode: InteractionMode) => void;
    selectedObjects: string[];
    hoveredObject: string | null;
    enableGizmo: boolean;
    setEnableGizmo: (enabled: boolean) => void;
  };

  // 工作区扩展
  workspace: DSLWorkspaceAPI & {
    extensions: WorkspaceExtensionManager;
    switchTo: (type: WorkspaceType) => void;
  };

  // 性能监控
  performance: {
    frameRate: number;
    renderTime: number;
    polyCount: number;
    drawCalls: number;
  };
}

export function useTripoEnhanced(options: UseTripoEnhancedOptions = {}): TripoEnhancedAPI {
  const {
    scene: externalScene,
    camera: externalCamera,
    canvas: externalCanvas,
    enableInteraction = true,
    interactionMode = 'select',
    enableModelLoading = true,
    modelLoadOptions = {},
    workspace = 'edit',
    enableWorkspaceExtensions = true,
  } = options;

  // 基础store
  const store = useTripoStore();

  // 引用管理
  const interactionManagerRef = useRef<TripoInteractionManager | null>(null);
  const modelLoaderRef = useRef<TripoModelLoader | null>(null);
  const extensionManagerRef = useRef<WorkspaceExtensionManager | null>(null);
  const performanceRef = useRef({
    frameRate: 60,
    renderTime: 0,
    polyCount: 0,
    drawCalls: 0,
  });

  // 加载状态
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    error: null as string | null,
  });

  // 交互状态
  const [interactionState, setInteractionState] = useState({
    mode: interactionMode,
    selectedObjects: [] as string[],
    hoveredObject: null as string | null,
    enableGizmo: true,
  });

  // 初始化模型加载器
  useEffect(() => {
    if (enableModelLoading && !modelLoaderRef.current) {
      modelLoaderRef.current = new TripoModelLoader();
    }
  }, [enableModelLoading]);

  // 初始化交互管理器
  useEffect(() => {
    if (
      enableInteraction &&
      externalScene &&
      externalCamera &&
      externalCanvas &&
      !interactionManagerRef.current
    ) {
      const config = {
        ...defaultInteractionConfig,
        mode: interactionState.mode,
      };

      interactionManagerRef.current = new TripoInteractionManager(
        externalScene,
        externalCamera,
        externalCanvas,
        config,
      );

      // 监听交互事件
      const removeEventListener = interactionManagerRef.current.addEventListener((event) => {
        if (event.type === 'click' && event.target) {
          setInteractionState((prev) => ({
            ...prev,
            selectedObjects: [event.target!.id],
          }));
        }
      });

      return () => {
        removeEventListener();
        interactionManagerRef.current?.destroy();
        interactionManagerRef.current = null;
      };
    }
  }, [enableInteraction, externalScene, externalCamera, externalCanvas, interactionState.mode]);

  // 初始化工作区扩展
  useEffect(() => {
    if (enableWorkspaceExtensions && !extensionManagerRef.current) {
      extensionManagerRef.current = new WorkspaceExtensionManager(api);
    }
  }, [enableWorkspaceExtensions]);

  // 基础API实现
  const api: DSLAPI = useMemo(
    () => ({
      scene: {
        objects: store.scene.objects,
        add: store.addObject,
        update: store.updateObject,
        remove: store.removeObject,
        find: (predicate) => store.scene.objects.filter(predicate),
        get: (id) => store.scene.objects.find((obj) => obj.id === id) || null,
        batch: store.batchOperations,

        // 节点树操作
        moveObject: store.moveObject,
        reorderChildren: store.reorderChildren,
        getChildren: store.getChildren,
        getParent: store.getParent,
      },
      selection: {
        selected: store.selectedIds,
        select: store.setSelection,
        add: store.addToSelection,
        remove: store.removeFromSelection,
        clear: store.clearSelection,
        toggle: store.toggleSelection,
      },
      history: {
        canUndo: store.history.past.length > 0,
        canRedo: store.history.future.length > 0,
        undo: store.undo,
        redo: store.redo,
        clear: store.clearHistory,
      },
      workspace: {
        current: store.currentWorkspace,
        switch: store.switchWorkspace,
        data: store.scene.workspace || { type: 'edit', settings: {}, history: [] },
        update: store.updateWorkspaceData,
      },
      materials: {
        list: store.scene.materials,
        create: store.createMaterial,
        update: store.updateMaterial,
        apply: store.applyMaterial,
      },
      io: {
        export: store.exportScene,
        import: store.importScene,
        reset: store.resetScene,
      },
    }),
    [store],
  );

  // 模型加载功能
  const loadModel = useCallback(
    async (url: string, options: LoadOptions = {}) => {
      if (!modelLoaderRef.current) return;

      setLoadingState({ isLoading: true, progress: 0, error: null });

      try {
        const loadResult = await modelLoaderRef.current.load(url, {
          ...modelLoadOptions,
          ...options,
        });

        // 集成到场景
        const { integrateLoadResult } = await import('../engine/loader');
        const currentScene = store.exportScene();
        const newScene = integrateLoadResult(currentScene, loadResult, {
          prefix: 'loaded_',
          replaceExisting: false,
        });

        store.importScene(newScene);
        setLoadingState({ isLoading: false, progress: 100, error: null });

        // 选择新加载的对象
        const newObjectIds = loadResult.objects.map((obj) => `loaded_${obj.id}`);
        store.setSelection(newObjectIds);
      } catch (error) {
        setLoadingState({
          isLoading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [modelLoadOptions, store],
  );

  // 设置交互模式
  const setInteractionMode = useCallback((mode: InteractionMode) => {
    setInteractionState((prev) => ({ ...prev, mode }));
    interactionManagerRef.current?.setMode(mode);
  }, []);

  // 设置Gizmo启用状态
  const setEnableGizmo = useCallback((enabled: boolean) => {
    setInteractionState((prev) => ({ ...prev, enableGizmo: enabled }));
    // 这里应该更新交互管理器的Gizmo配置
  }, []);

  // 切换工作区
  const switchWorkspace = useCallback(
    (type: WorkspaceType) => {
      store.switchWorkspace(type);

      // 根据工作区类型调整交互模式
      switch (type) {
        case 'generate':
          setInteractionMode('select');
          break;
        case 'texture':
          setInteractionMode('brush');
          break;
        case 'rigging':
          setInteractionMode('select');
          break;
        default:
          setInteractionMode('select');
      }
    },
    [store, setInteractionMode],
  );

  // 性能监控
  useEffect(() => {
    const updatePerformance = () => {
      if (externalScene) {
        // 计算多边形数量
        let polyCount = 0;
        externalScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const geometry = child.geometry;
            if (geometry.index) {
              polyCount += geometry.index.count / 3;
            } else {
              polyCount += geometry.attributes.position.count / 3;
            }
          }
        });

        performanceRef.current.polyCount = Math.floor(polyCount);
      }
    };

    const interval = setInterval(updatePerformance, 1000);
    return () => clearInterval(interval);
  }, [externalScene]);

  // 返回增强版API
  return {
    ...api,

    loader: {
      load: loadModel,
      isLoading: loadingState.isLoading,
      progress: loadingState.progress,
      error: loadingState.error,
    },

    interaction: {
      mode: interactionState.mode,
      setMode: setInteractionMode,
      selectedObjects: interactionState.selectedObjects,
      hoveredObject: interactionState.hoveredObject,
      enableGizmo: interactionState.enableGizmo,
      setEnableGizmo,
    },

    workspace: {
      current: store.currentWorkspace,
      switch: store.switchWorkspace,
      data: store.scene.workspace || { type: 'edit', settings: {}, history: [] },
      update: store.updateWorkspaceData,
      extensions: extensionManagerRef.current!,
      switchTo: switchWorkspace,
    },

    performance: performanceRef.current,
  };
}

// 工作区特化Hook
export function useTripoGenerate(options: UseTripoEnhancedOptions = {}): DSLGenerateAPI {
  const enhanced = useTripoEnhanced({ ...options, workspace: 'generate' });
  const generateExtension = enhanced.workspace.extensions.getGenerateExtension();

  return {
    ...enhanced,
    generate: {
      prompt: '',
      setPrompt: () => {},
      isGenerating: false,
      progress: 0,
      start: async () => {},
      cancel: () => {},
      addResult: (model) => {
        generateExtension?.loadGeneratedModel(model);
      },
    },
  };
}

export function useTripoTexture(options: UseTripoEnhancedOptions = {}): TripoTextureAPI {
  const enhanced = useTripoEnhanced({ ...options, workspace: 'texture' });
  const textureExtension = enhanced.workspace.extensions.getTextureExtension();

  return {
    ...enhanced,
    texture: {
      preview: null,
      setPreview: () => {},
      applyToSelected: () => {
        const selectedIds = enhanced.selection.selected;
        if (selectedIds.length > 0 && textureExtension) {
          textureExtension.applyProceduralTexture(selectedIds, 'noise');
        }
      },
      presets: [],
      loadPreset: () => {},
    },
  };
}

export function useTripoRigging(options: UseTripoEnhancedOptions = {}): DSLRiggingAPI {
  const enhanced = useTripoEnhanced({ ...options, workspace: 'rigging' });
  const riggingExtension = enhanced.workspace.extensions.getRiggingExtension();

  return {
    ...enhanced,
    rigging: {
      bones: [],
      addBone: (bone) => {
        // Implementation for adding bones
      },
      selectBone: (id) => {
        enhanced.selection.select([id]);
      },
      updateWeights: (vertexId, weights) => {
        // Implementation for updating bone weights
      },
    },
  };
}

// 专门用于节点树操作的Hook
export function useNodeTree() {
  const { scene } = useTripoEnhanced();

  // 获取节点的所有后代节点
  const getDescendants = (nodeId: string): SceneObject[] => {
    const descendants: SceneObject[] = [];
    const node = scene.get(nodeId);

    if (node?.children) {
      for (const childId of node.children) {
        const child = scene.get(childId);
        if (child) {
          descendants.push(child);
          descendants.push(...getDescendants(childId));
        }
      }
    }

    return descendants;
  };

  // 获取节点的所有祖先节点
  const getAncestors = (nodeId: string): SceneObject[] => {
    const ancestors: SceneObject[] = [];
    let current = scene.get(nodeId);

    while (current?.parent) {
      const parent = scene.get(current.parent);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  };

  return {
    // 移动节点到新的父节点下
    moveNode: scene.moveObject,

    // 重新排序子节点
    reorderChildren: scene.reorderChildren,

    // 获取子节点列表
    getChildren: scene.getChildren,

    // 获取父节点
    getParent: scene.getParent,

    // 构建节点树结构
    buildTree: (rootId?: string): SceneObject[] => {
      const objects = scene.objects;
      const buildNode = (parentId?: string): SceneObject[] => {
        return objects
          .filter((obj) => obj.parent === parentId)
          .sort((a, b) => {
            if (!parentId) return 0;
            const parent = objects.find((p) => p.id === parentId);
            if (!parent?.children) return 0;
            return parent.children.indexOf(a.id) - parent.children.indexOf(b.id);
          });
      };

      return buildNode(rootId);
    },

    // 获取节点的所有祖先节点
    getAncestors,

    // 获取节点的所有后代节点
    getDescendants,

    // 检查节点A是否是节点B的祖先
    isAncestorOf: (ancestorId: string, nodeId: string): boolean => {
      const ancestors = getAncestors(nodeId);
      return ancestors.some((ancestor: SceneObject) => ancestor.id === ancestorId);
    },
  };
}

// 默认导出
export default useTripoEnhanced;
