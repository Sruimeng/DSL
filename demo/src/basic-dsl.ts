// TripoScript DSL 基础演示 - 使用引擎内置 Undo/Redo 功能
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DSLEngine, DSLRenderer } from '../../src/index.js';
import { animate, log, setupResize, updateStats, updateUndoRedoButtons } from './utils.ts';

// 全局变量
let engine: DSLEngine;
let renderer: DSLRenderer;
let controls: OrbitControls;
let objectCount = 0;
let backgroundIndex = 0;

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

// 更新历史统计显示
function updateHistoryDisplay(stats: any): void {
  // 找到或创建统计信息显示元素
  let statsDisplay = document.getElementById('history-stats');
  if (!statsDisplay) {
    statsDisplay = document.createElement('div');
    statsDisplay.id = 'history-stats';
    statsDisplay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      min-width: 200px;
    `;
    document.body.appendChild(statsDisplay);
  }

  // 更新显示内容
  statsDisplay.innerHTML = `
    <div><strong>📚 历史统计</strong></div>
    <div>Actions: ${stats.totalActions}</div>
    <div>当前索引: ${stats.currentIndex}</div>
    <div>内存占用: ~${stats.memoryUsageKB}KB</div>
    <div>可撤销: ${stats.canUndo ? '✅' : '❌'}</div>
    <div>可重做: ${stats.canRedo ? '✅' : '❌'}</div>
    ${
      stats.recentActions.length > 0
        ? `
    <div style="margin-top: 5px;"><strong>最近Actions:</strong></div>
    ${stats.recentActions.map((action: any) => `<div>• ${action.type}</div>`).join('')}
    `
        : ''
    }
  `;
}

// 更新UI状态
function updateUIState(): void {
  const canUndo = engine.canUndo();
  const canRedo = engine.canRedo();

  // 更新按钮状态（传入空数组，因为我们使用引擎的状态）
  updateUndoRedoButtons([], []);

  // 更新按钮可用性
  const undoBtn = document.querySelector('[onclick="undo()"]') as HTMLButtonElement;
  const redoBtn = document.querySelector('[onclick="redo()"]') as HTMLButtonElement;

  if (undoBtn) {
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
  }

  if (redoBtn) {
    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
  }

  // 显示历史统计信息
  const historyStats = engine.getHistoryStats();
  console.log('📊 历史统计:', historyStats);

  // 更新页面上的统计信息显示
  updateHistoryDisplay(historyStats);

  console.log('🔄 UI状态更新:', {
    可撤销: canUndo,
    可重做: canRedo,
    Action历史长度: historyStats.totalActions,
    内存占用: `${historyStats.memoryUsageKB}KB`,
  });
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

// ========== Undo/Redo 系统（使用引擎功能）==========

// 撤销操作
function undoOperation(): void {
  const success = engine.undo();

  if (success) {
    log('↶ 撤销操作成功');
    console.log('🔄 撤销操作:', {
      当前场景状态: {
        对象数量: engine.getScene().objects.length,
        材质数量: engine.getScene().materials.length,
        光源数量: engine.getScene().lights.length,
      },
      可撤销: engine.canUndo(),
      可重做: engine.canRedo(),
    });
  } else {
    log('⚠️ 没有可撤销的操作');
  }

  updateUIState();
}

// 重做操作
function redoOperation(): void {
  const success = engine.redo();

  if (success) {
    log('↷ 重做操作成功');
    console.log('🔄 重做操作:', {
      当前场景状态: {
        对象数量: engine.getScene().objects.length,
        材质数量: engine.getScene().materials.length,
        光源数量: engine.getScene().lights.length,
      },
      可撤销: engine.canUndo(),
      可重做: engine.canRedo(),
    });
  } else {
    log('⚠️ 没有可重做的操作');
  }

  updateUIState();
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

    // 监听场景变化 - 包括更新UI状态
    engine.subscribe((scene) => {
      updateStats(scene);
      updateUIState();
    });

    // 启动渲染循环
    animate(controls);

    // 设置窗口大小调整
    setupResize(renderer);

    // 初始化UI状态
    updateUIState();

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    log('✅ DSL引擎初始化完成');
    log('🎨 渲染器创建成功');
    log('🎮 轨道控制器已启用');
    log('⌨️ 快捷键: Ctrl+Z(撤销) / Ctrl+Y(重做)');
    log('📊 场景统计信息将实时更新');
    log('🔍 使用引擎内置的undo/redo功能');
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

  const id = engine.addObject(objectData);
  log(`🏛️ 添加圆柱: ${id}`);
}

// ========== 材质控制方法 ==========

// 切换到标准材质
function changeToStandardOperation(): void {
  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);

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

  const materialId = engine.addMaterial(wireframeMaterial);
  engine.applyMaterial(objectIds, materialId);
  log('🔗 应用线框材质');
}

// 随机颜色
function randomColorsOperation(): void {
  const scene = engine.getScene();

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

    const materialId = engine.addMaterial(material);
    engine.applyMaterial([obj.id], materialId);
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
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: { id: ambientLight.id, changes: { intensity: newIntensity } },
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
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: { id: directionalLight.id, changes: { intensity: newIntensity } },
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

  engine.dispatch({
    type: 'ADD_LIGHT',
    payload: lightData,
  });
  log('💡 添加点光源');
}

// 切换背景
function changeBackgroundOperation(): void {
  backgroundIndex = (backgroundIndex + 1) % backgrounds.length;
  const newColor = backgrounds[backgroundIndex];

  // 通过引擎的dispatch系统更新背景，这样可以被undo/redo追踪
  engine.updateEnvironment({
    background: { type: 'color', color: newColor },
  });

  // 同时更新Three.js场景的背景色（用于渲染）
  const threeScene = renderer.getThreeScene();
  threeScene.background = new Color(newColor);

  log(`🎨 背景色切换为: ${newColor}`);
}

// ========== 场景管理方法 ==========

// 清空场景
function clearSceneOperation(): void {
  const scene = engine.getScene();
  const objectsToRemove = [...scene.objects];

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

  controls.reset();
  engine.dispatch({
    type: 'UPDATE_CAMERA',
    payload: cameraData,
  });
  log('📷 相机已重置');
}

// ========== 全局函数暴露 ==========

// 立即暴露到全局作用域供HTML调用
function exposeGlobalFunctions(): void {
  (window as any).undo = undoOperation;
  (window as any).redo = redoOperation;
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

  console.log('🔧 全局函数已暴露到 window 对象');
}

// 立即执行函数暴露
exposeGlobalFunctions();

// 启动应用
document.addEventListener('DOMContentLoaded', init);
