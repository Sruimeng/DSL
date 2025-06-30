// TripoScript DSL 基础演示 - 带 Undo/Redo 功能
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DSLEngine, DSLRenderer, type DSLAction, type DSLScene } from '../../src/index.js';
import { animate, log, setupResize, updateStats, updateUndoRedoButtons } from './utils.ts';

// 全局变量
let engine: DSLEngine;
let renderer: DSLRenderer;
let controls: OrbitControls;
let objectCount = 0;
let backgroundIndex = 0;

// Undo/Redo 系统
const undoStack: DSLAction[] = [];
const redoStack: DSLAction[] = [];
let isUndoRedoOperation = false;

// 预定义背景色
const backgrounds = [
  '#f0f0f0', // 浅灰
  '#87CEEB', // 天蓝
  '#FFB6C1', // 浅粉
  '#98FB98', // 浅绿
  '#DDA0DD', // 紫色
  '#F0E68C', // 卡其色
];

// ========== 工具函数 ==========

// 恢复场景状态
function restoreSceneState(sceneState: DSLScene): void {
  // 清空当前场景
  const currentScene = engine.getScene();
  currentScene.objects.forEach((obj) => {
    engine.removeObject(obj.id);
  });

  // 重建对象
  sceneState.objects.forEach((obj) => {
    engine.addObject(obj);
  });

  // 重建材质
  sceneState.materials.forEach((material) => {
    engine.addMaterial(material);
  });

  // 重建光源
  sceneState.lights.forEach((light) => {
    engine.dispatch({
      type: 'ADD_LIGHT',
      payload: light,
    });
  });

  // 更新计数器
  objectCount = sceneState.objects.length;
}

// 设置键盘快捷键
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          (window as any).undo();
          break;
        case 'y':
          event.preventDefault();
          (window as any).redo();
          break;
      }
    }
  });
}

// ========== Undo/Redo 系统 ==========

// 保存场景状态快照
function saveState(actionType: string, actionData: any): void {
  if (isUndoRedoOperation) return;

  const action: DSLAction = {
    type: actionType,
    payload: actionData,
    timestamp: new Date().toLocaleTimeString(),
    previousState: JSON.parse(JSON.stringify(engine.getScene())),
  };

  undoStack.push(action);
  redoStack.length = 0; // 清空重做栈

  // 限制历史记录数量
  if (undoStack.length > 50) {
    undoStack.shift();
  }

  updateUndoRedoButtons(undoStack, redoStack);
  log(`🔄 操作已记录: ${actionType}`);
}

// 撤销操作
function undoOperation(): void {
  if (undoStack.length === 0) {
    log('⚠️ 没有可撤销的操作');
    return;
  }

  isUndoRedoOperation = true;

  const action = undoStack.pop()!;
  redoStack.push({
    ...action,
    currentState: JSON.parse(JSON.stringify(engine.getScene())),
  });

  // 恢复到上一个状态
  restoreSceneState(action.previousState);

  isUndoRedoOperation = false;
  updateUndoRedoButtons(undoStack, redoStack);
  log(`↶ 撤销操作: ${action.type}`);
}

// 重做操作
function redoOperation(): void {
  if (redoStack.length === 0) {
    log('⚠️ 没有可重做的操作');
    return;
  }

  isUndoRedoOperation = true;

  const action = redoStack.pop()!;
  undoStack.push(action);

  // 恢复到重做状态
  restoreSceneState(action.currentState);

  isUndoRedoOperation = false;
  updateUndoRedoButtons(undoStack, redoStack);
  log(`↷ 重做操作: ${action.type}`);
}

// 清空历史记录
function clearHistoryOperation(): void {
  undoStack.length = 0;
  redoStack.length = 0;
  updateUndoRedoButtons(undoStack, redoStack);
  log('🗑️ 历史记录已清空');
}

// ========== 初始化系统 ==========

// 初始化DSL引擎
function init(): void {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // 创建DSL引擎实例
    engine = new DSLEngine();

    // 创建渲染器
    renderer = new DSLRenderer(canvas, engine);

    // 添加轨道控制器
    const camera = renderer.getThreeCamera();
    const domElement = renderer.getThreeRenderer().domElement;
    controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 100;

    // 监听场景变化
    engine.subscribe(updateStats);

    // 启动渲染循环
    animate(controls);

    // 设置窗口大小调整
    setupResize(renderer);

    // 初始化 undo/redo 按钮状态
    updateUndoRedoButtons(undoStack, redoStack);

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    log('✅ DSL引擎初始化完成');
    log('🎨 渲染器创建成功');
    log('🎮 轨道控制器已启用');
    log('⌨️ 快捷键: Ctrl+Z(撤销) / Ctrl+Y(重做)');
  } catch (error) {
    console.error('初始化失败:', error);
    log('❌ 初始化失败: ' + error);
  }
}

// ========== 对象创建方法 ==========

// 添加立方体
function addCubeOperation(): void {
  const objectData = {
    name: `立方体_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'box',
      size: new Vector3(1, 1, 1),
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
    },
    material: { id: 'default' },
  };

  saveState('ADD_OBJECT', objectData);
  const id = engine.addObject(objectData);
  log(`📦 添加立方体: ${id}`);
}

// 添加球体
function addSphereOperation(): void {
  const objectData = {
    name: `球体_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'sphere',
      radius: 1,
      radialSegments: 16,
      heightSegments: 12,
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
    },
    material: { id: 'default' },
  };

  saveState('ADD_OBJECT', objectData);
  const id = engine.addObject(objectData);
  log(`🔮 添加球体: ${id}`);
}

// 添加平面
function addPlaneOperation(): void {
  const objectData = {
    name: `平面_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'plane',
      size: new Vector3(2, 2, 1),
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
      rotation: new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    },
    material: { id: 'default' },
  };

  saveState('ADD_OBJECT', objectData);
  const id = engine.addObject(objectData);
  log(`📄 添加平面: ${id}`);
}

// 添加圆柱
function addCylinderOperation(): void {
  const objectData = {
    name: `圆柱_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'cylinder',
      radius: 0.5,
      height: 2,
      radialSegments: 16,
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ),
    },
    material: { id: 'default' },
  };

  saveState('ADD_OBJECT', objectData);
  const id = engine.addObject(objectData);
  log(`🏛️ 添加圆柱: ${id}`);
}

// ========== 材质控制方法 ==========

// 切换到标准材质
function changeToStandardOperation(): void {
  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);

  saveState('APPLY_MATERIAL', { objectIds, materialId: 'default' });
  engine.applyMaterial(objectIds, 'default');
  log('🎨 应用标准材质');
}

// 切换到线框模式
function changeToWireframeOperation(): void {
  const wireframeMaterial = {
    name: '线框材质',
    type: 'wireframe',
    color: '#00ff00',
  };

  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);

  saveState('APPLY_MATERIAL', { objectIds, material: wireframeMaterial });
  const materialId = engine.addMaterial(wireframeMaterial);
  engine.applyMaterial(objectIds, materialId);
  log('🔗 应用线框材质');
}

// 随机颜色
function randomColorsOperation(): void {
  const scene = engine.getScene();
  const materials: any[] = [];

  scene.objects.forEach((obj) => {
    const color = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
    const material = {
      type: 'standard',
      color: color,
      metalness: Math.random() * 0.3,
      roughness: Math.random() * 0.5 + 0.2,
    };
    materials.push({ objectId: obj.id, material });
  });

  saveState('APPLY_MATERIAL', { type: 'random', materials });

  materials.forEach(({ objectId, material }) => {
    const materialId = engine.addMaterial(material);
    engine.applyMaterial([objectId], materialId);
  });

  log('🌈 应用随机颜色材质');
}

// 黄金材质
function applyGoldenOperation(): void {
  const goldenMaterial = {
    name: '黄金材质',
    type: 'standard',
    color: '#FFD700',
    metalness: 1.0,
    roughness: 0.1,
    emissive: '#332200',
    emissiveIntensity: 0.1,
  };

  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);

  saveState('APPLY_MATERIAL', { objectIds, material: goldenMaterial });
  const materialId = engine.addMaterial(goldenMaterial);
  engine.applyMaterial(objectIds, materialId);
  log('✨ 应用黄金材质');
}

// ========== 光照控制方法 ==========

// 切换环境光
function toggleAmbientOperation(): void {
  const scene = engine.getScene();
  const ambientLight = scene.lights.find((light) => light.type === 'ambient');
  if (ambientLight) {
    const newIntensity = (ambientLight.intensity || 0) > 0 ? 0 : 0.4;
    const lightData = { id: ambientLight.id, changes: { intensity: newIntensity } };

    saveState('UPDATE_LIGHT', lightData);
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: lightData,
    });
    log(`💡 环境光${newIntensity > 0 ? '开启' : '关闭'}`);
  }
}

// 切换平行光
function toggleDirectionalOperation(): void {
  const scene = engine.getScene();
  const directionalLight = scene.lights.find((light) => light.type === 'directional');
  if (directionalLight) {
    const newIntensity = (directionalLight.intensity || 0) > 0 ? 0 : 0.8;
    const lightData = { id: directionalLight.id, changes: { intensity: newIntensity } };

    saveState('UPDATE_LIGHT', lightData);
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: lightData,
    });
    log(`☀️ 平行光${newIntensity > 0 ? '开启' : '关闭'}`);
  }
}

// 添加点光源
function addPointLightOperation(): void {
  const lightData = {
    name: '点光源',
    type: 'point',
    color: '#ffffff',
    intensity: 1.0,
    position: new Vector3(
      (Math.random() - 0.5) * 10,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 10,
    ),
    distance: 10,
    decay: 2,
  };

  saveState('ADD_LIGHT', lightData);
  engine.dispatch({
    type: 'ADD_LIGHT',
    payload: lightData,
  });
  log('💡 添加点光源');
}

// 切换背景
function changeBackgroundOperation(): void {
  const oldBackground = backgrounds[backgroundIndex];
  backgroundIndex = (backgroundIndex + 1) % backgrounds.length;

  saveState('CHANGE_BACKGROUND', {
    oldColor: oldBackground,
    newColor: backgrounds[backgroundIndex],
  });

  // 通过渲染器直接设置背景色
  const threeScene = renderer.getThreeScene();
  threeScene.background = new Color(backgrounds[backgroundIndex]);

  log(`🎨 背景色切换为: ${backgrounds[backgroundIndex]}`);
}

// ========== 场景管理方法 ==========

// 清空场景
function clearSceneOperation(): void {
  const scene = engine.getScene();
  const objectsToRemove = [...scene.objects];

  saveState('CLEAR_SCENE', { objects: objectsToRemove });

  objectsToRemove.forEach((obj) => {
    engine.removeObject(obj.id);
  });
  objectCount = 0;
  log('🗑️ 场景已清空');
}

// 重置相机
function resetCameraOperation(): void {
  const cameraData = {
    position: new Vector3(5, 5, 5),
    target: new Vector3(0, 0, 0),
  };

  saveState('UPDATE_CAMERA', cameraData);
  controls.reset();
  engine.dispatch({
    type: 'UPDATE_CAMERA',
    payload: cameraData,
  });
  log('📷 相机已重置');
}

// ========== 全局函数暴露 ==========

// 暴露到全局作用域供HTML调用
(window as any).undo = undoOperation;
(window as any).redo = redoOperation;
(window as any).clearHistory = clearHistoryOperation;
(window as any).addCube = addCubeOperation;
(window as any).addSphere = addSphereOperation;
(window as any).addPlane = addPlaneOperation;
(window as any).addCylinder = addCylinderOperation;
(window as any).changeToStandard = changeToStandardOperation;
(window as any).changeToWireframe = changeToWireframeOperation;
(window as any).randomColors = randomColorsOperation;
(window as any).applyGolden = applyGoldenOperation;
(window as any).toggleAmbient = toggleAmbientOperation;
(window as any).toggleDirectional = toggleDirectionalOperation;
(window as any).addPointLight = addPointLightOperation;
(window as any).changeBackground = changeBackgroundOperation;
(window as any).clearScene = clearSceneOperation;
(window as any).resetCamera = resetCameraOperation;

// 启动应用
document.addEventListener('DOMContentLoaded', init);
