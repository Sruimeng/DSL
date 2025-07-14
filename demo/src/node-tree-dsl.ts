// 节点树DSL演示 - 基于DSL框架的正确实现
import { modelLoader } from '../../src/engine/loader';
import { DSLRenderer } from '../../src/engine/renderer';
import { DSLEngine } from '../../src/index.ts';
import { ActionTypes } from '../../src/types/core';
import { LogPanelUI } from './utils/log-panel';
import { NodeTreeUI } from './utils/node-tree-ui';
import { StatsPanelUI } from './utils/stats-panel';
import { TransformEditorUI } from './utils/transform-editor';

// 全局实例
let dslEngine: DSLEngine;
let dslRenderer: DSLRenderer;
let nodeTreeUI: NodeTreeUI;
let transformEditorUI: TransformEditorUI;
let statsPanelUI: StatsPanelUI;
let logPanelUI: LogPanelUI;

// 预设模型列表
const PRESET_MODELS = [
  {
    id: 'toycar',
    name: '🚗 玩具汽车',
    path: './assets/glb/ToyCar.glb',
  },
  {
    id: 'suzanne',
    name: '🐵 猴头雕塑',
    path: './assets/glb/2.0/Suzanne/glTF-Binary/Suzanne.glb',
  },
  {
    id: 'cesiumman',
    name: '🚀 太空人',
    path: './assets/glb/CesiumMan.glb',
  },
  {
    id: 'boombox',
    name: '🔊 音响设备',
    path: './assets/glb/BoomBox.glb',
  },
  {
    id: 'avocado',
    name: '🥑 牛油果',
    path: './assets/glb/2.0/Avocado/glTF-Binary/Avocado.glb',
  },
];

// 初始化应用
async function initializeApp(): Promise<void> {
  try {
    // 获取画布元素
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('找不到canvas元素');
    }

    // 初始化DSL引擎
    dslEngine = new DSLEngine();

    // 初始化DSL渲染器
    dslRenderer = new DSLRenderer(canvas);

    // 监听DSL场景变化，自动渲染
    dslEngine.subscribe((scene) => {
      dslRenderer.render(scene);
    });

    // 初始化UI组件
    initializeUIComponents();

    // 初始化预设模型选择器
    initializePresetSelector();

    // 初始化一些默认对象用于演示
    await loadDefaultScene();

    console.log('📱 节点树DSL演示初始化完成');
    logPanelUI?.addLog('system', '应用初始化完成');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    alert(`初始化失败: ${error}`);
  }
}

// 初始化UI组件
function initializeUIComponents(): void {
  // 节点树UI
  const nodeTreeContainer = document.getElementById('nodeTree');
  if (nodeTreeContainer) {
    nodeTreeUI = new NodeTreeUI(dslEngine, nodeTreeContainer);
  }

  // Transform编辑器UI（注意：可能有类型问题，但UI层面可以继续工作）
  const transformContainer = document.querySelector('.transform-editor')?.parentElement;
  if (transformContainer) {
    // 清空原有内容，让TransformEditorUI重新创建
    transformContainer.innerHTML = '';
    try {
      transformEditorUI = new TransformEditorUI(dslEngine, transformContainer);
    } catch (error) {
      console.warn('⚠️ Transform编辑器初始化失败（类型问题）:', error);
      logPanelUI?.addLog('warning', 'Transform编辑器初始化失败，但其他功能正常');
    }
  }

  // 统计面板UI
  const statsContainer = document.getElementById('topStatsPanel');
  if (statsContainer) {
    statsPanelUI = new StatsPanelUI(dslEngine, statsContainer);
  }

  // 日志面板UI
  const logContainer = document.getElementById('logContent');
  if (logContainer) {
    logPanelUI = new LogPanelUI(logContainer);
  }

  // 撤销/重做按钮状态更新
  dslEngine.subscribe(() => {
    updateUndoRedoButtons();
  });
}

// 初始化预设模型选择器
function initializePresetSelector(): void {
  const selector = document.getElementById('presetModelSelect') as HTMLSelectElement;
  if (!selector) return;

  // 清空现有选项
  selector.innerHTML = '<option value="">选择预设模型...</option>';

  // 添加预设模型选项
  PRESET_MODELS.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    selector.appendChild(option);
  });
}

// 加载默认场景
async function loadDefaultScene(): Promise<void> {
  // 添加一些基础几何体用于演示
  const cubeId = dslEngine.addObject({
    name: '示例立方体',
    type: 'mesh',
    geometry: {
      type: 'box',
      size: 1,
    },
    material: {
      type: 'standard',
      color: '#4CAF50',
    },
    transform: {
      position: { x: -2, y: 0, z: 0 } as any,
    },
  });

  const sphereId = dslEngine.addObject({
    name: '示例球体',
    type: 'mesh',
    geometry: {
      type: 'sphere',
      radius: 0.8,
    },
    material: {
      type: 'standard',
      color: '#2196F3',
    },
    transform: {
      position: { x: 2, y: 0, z: 0 } as any,
    },
  });

  // 添加光源
  dslEngine.dispatch({
    type: ActionTypes.ADD_LIGHT,
    payload: {
      name: '主光源',
      type: 'directional',
      color: '#ffffff',
      intensity: 1,
      position: { x: 5, y: 5, z: 5 } as any,
      castShadow: true,
    },
  });

  logPanelUI?.addLog('success', '默认场景加载完成');
}

// 全局函数：加载选中的预设模型
(window as any).loadSelectedPresetModel = async function (): Promise<void> {
  const selector = document.getElementById('presetModelSelect') as HTMLSelectElement;
  if (!selector || !selector.value) {
    alert('请先选择一个预设模型');
    return;
  }

  const selectedModel = PRESET_MODELS.find((model) => model.id === selector.value);
  if (!selectedModel) return;

  try {
    logPanelUI?.addLog('info', `开始加载模型: ${selectedModel.name}`);

    const result = await modelLoader.loadModel(selectedModel.path);

    if (result.success && result.data) {
      // 通过DSL引擎添加模型对象
      const objectId = dslEngine.addObject({
        name: selectedModel.name,
        type: 'mesh',
        geometry: {
          type: 'model',
          url: selectedModel.path,
        },
        transform: {
          position: { x: 0, y: 0, z: 0 } as any,
          rotation: { x: 0, y: 0, z: 0 } as any,
          scale: { x: 1, y: 1, z: 1 } as any,
        },
      });

      logPanelUI?.addLog('success', `模型加载成功: ${selectedModel.name}`);
      dslEngine.selectObjects([objectId]);
    } else {
      throw new Error(result.error || '模型加载失败');
    }
  } catch (error) {
    console.error('模型加载失败:', error);
    logPanelUI?.addLog('error', `模型加载失败: ${error}`);
    alert(`模型加载失败: ${error}`);
  }
};

// 全局函数：加载文件
(window as any).loadModelFile = async function (event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    logPanelUI?.addLog('info', `开始加载文件: ${file.name}`);

    const result = await modelLoader.loadModelFromFile(file);

    if (result.success && result.data) {
      const objectId = dslEngine.addObject({
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'mesh',
        geometry: {
          type: 'model',
          url: URL.createObjectURL(file),
        },
      });

      logPanelUI?.addLog('success', `文件加载成功: ${file.name}`);
      dslEngine.selectObjects([objectId]);
    } else {
      throw new Error(result.error || '文件加载失败');
    }
  } catch (error) {
    console.error('文件加载失败:', error);
    logPanelUI?.addLog('error', `文件加载失败: ${error}`);
    alert(`文件加载失败: ${error}`);
  }
};

// 全局函数：加载示例模型
(window as any).loadSampleModel = function (type: 'cube' | 'sphere'): void {
  const models = {
    cube: {
      name: '示例立方体',
      geometry: { type: 'box' as const, size: 1 },
      material: { type: 'standard' as const, color: '#4CAF50' },
    },
    sphere: {
      name: '示例球体',
      geometry: { type: 'sphere' as const, radius: 1 },
      material: { type: 'standard' as const, color: '#2196F3' },
    },
  };

  const model = models[type];
  const objectId = dslEngine.addObject({
    name: model.name,
    type: 'mesh',
    geometry: model.geometry,
    material: model.material,
  });

  logPanelUI?.addLog('info', `创建了${model.name}`);
  dslEngine.selectObjects([objectId]);
};

// 全局函数：展开/折叠所有节点
(window as any).expandAll = function (): void {
  nodeTreeUI?.expandAll();
};

(window as any).collapseAll = function (): void {
  nodeTreeUI?.collapseAll();
};

// 全局函数：撤销/重做操作
(window as any).undo = function (): void {
  if (dslEngine.undo()) {
    logPanelUI?.addLog('info', '撤销操作');
  }
};

(window as any).redo = function (): void {
  if (dslEngine.redo()) {
    logPanelUI?.addLog('info', '重做操作');
  }
};

(window as any).clearHistory = function (): void {
  // DSL引擎没有直接的清空历史方法，这里我们可以实现一个变通方案
  logPanelUI?.addLog('warning', '历史记录清空功能需要DSL框架支持');
};

// 更新撤销/重做按钮状态
function updateUndoRedoButtons(): void {
  const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
  const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

  if (undoBtn) {
    undoBtn.disabled = !dslEngine.canUndo();
  }

  if (redoBtn) {
    redoBtn.disabled = !dslEngine.canRedo();
  }
}

// 全局函数：节点操作
(window as any).duplicateSelectedNode = function (): void {
  const selected = dslEngine.getScene().selection;
  if (selected.length === 1) {
    dslEngine.dispatch({
      type: ActionTypes.DUPLICATE_OBJECT,
      payload: { id: selected[0] },
    });
    logPanelUI?.addLog('info', '节点已复制');
  } else {
    alert('请选择一个节点进行复制');
  }
};

(window as any).toggleNodeVisibility = function (): void {
  const selected = dslEngine.getScene().selection;
  if (selected.length === 1) {
    const object = dslEngine.getObject(selected[0]);
    if (object) {
      dslEngine.updateObject(selected[0], {
        visible: !object.visible,
      });
      logPanelUI?.addLog('info', `节点可见性已${object.visible ? '隐藏' : '显示'}`);
    }
  } else {
    alert('请选择一个节点');
  }
};

(window as any).deleteSelectedNode = function (): void {
  const selected = dslEngine.getScene().selection;
  if (selected.length === 1) {
    dslEngine.removeObject(selected[0]);
    logPanelUI?.addLog('info', '节点已删除');
  } else if (selected.length > 1) {
    selected.forEach((id) => dslEngine.removeObject(id));
    logPanelUI?.addLog('info', `已删除${selected.length}个节点`);
  } else {
    alert('请选择要删除的节点');
  }
};

(window as any).resetNodeTransform = function (): void {
  const selected = dslEngine.getScene().selection;
  if (selected.length === 1) {
    dslEngine.updateObject(selected[0], {
      transform: {
        position: { x: 0, y: 0, z: 0 } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
      },
    });
    logPanelUI?.addLog('info', 'Transform已重置');
  } else {
    alert('请选择一个节点');
  }
};

// 全局函数：场景管理
(window as any).exportScene = function (): void {
  const scene = dslEngine.exportScene();
  const dataStr = JSON.stringify(scene, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `scene_${Date.now()}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  logPanelUI?.addLog('success', '场景已导出');
};

(window as any).clearScene = function (): void {
  if (confirm('确定要清空整个场景吗？此操作不可撤销。')) {
    dslEngine.dispatch({ type: ActionTypes.RESET_SCENE });
    logPanelUI?.addLog('warning', '场景已清空');
  }
};

(window as any).resetCamera = function (): void {
  dslEngine.dispatch({
    type: ActionTypes.UPDATE_CAMERA,
    payload: {
      position: { x: 5, y: 5, z: 5 } as any,
      target: { x: 0, y: 0, z: 0 } as any,
    },
  });
  logPanelUI?.addLog('info', '相机已重置');
};

// 全局函数：更新Transform（为HTML模板中的onchange事件提供）
(window as any).updateTransform = function (type: string, axis: string, value: string): void {
  // 这个函数由TransformEditorUI内部处理，这里提供一个回退实现
  console.log('updateTransform called:', type, axis, value);
};

// 当DOM加载完成时初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
