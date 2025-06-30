// TripoScript DSL 基础演示
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DSLEngine, DSLRenderer } from '../../src/index.js';
import { animate, log, setupResize, updateStats } from './utils.js';

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

    log('✅ DSL引擎初始化完成');
    log('🎨 渲染器创建成功');
    log('🎮 轨道控制器已启用');
  } catch (error) {
    console.error('初始化失败:', error);
    log('❌ 初始化失败: ' + error);
  }
}

// ========== 对象创建方法 ==========

// 添加立方体
(window as any).addCube = function (): void {
  const id = engine.addObject({
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
  });
  log(`📦 添加立方体: ${id}`);
};

// 添加球体
(window as any).addSphere = function (): void {
  const id = engine.addObject({
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
  });
  log(`🔮 添加球体: ${id}`);
};

// 添加平面
(window as any).addPlane = function (): void {
  const id = engine.addObject({
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
  });
  log(`📄 添加平面: ${id}`);
};

// 添加圆柱
(window as any).addCylinder = function (): void {
  const id = engine.addObject({
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
  });
  log(`🏛️ 添加圆柱: ${id}`);
};

// ========== 材质控制方法 ==========

// 切换到标准材质
(window as any).changeToStandard = function (): void {
  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);
  engine.applyMaterial(objectIds, 'default');
  log('🎨 应用标准材质');
};

// 切换到线框模式
(window as any).changeToWireframe = function (): void {
  const wireframeMaterial = engine.addMaterial({
    name: '线框材质',
    type: 'wireframe',
    color: '#00ff00',
  });

  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);
  engine.applyMaterial(objectIds, wireframeMaterial);
  log('🔗 应用线框材质');
};

// 随机颜色
(window as any).randomColors = function (): void {
  const scene = engine.getScene();
  scene.objects.forEach((obj) => {
    const color = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
    const materialId = engine.addMaterial({
      type: 'standard',
      color: color,
      metalness: Math.random() * 0.3,
      roughness: Math.random() * 0.5 + 0.2,
    });
    engine.applyMaterial([obj.id], materialId);
  });
  log('🌈 应用随机颜色材质');
};

// 黄金材质
(window as any).applyGolden = function (): void {
  const goldenMaterial = engine.addMaterial({
    name: '黄金材质',
    type: 'standard',
    color: '#FFD700',
    metalness: 1.0,
    roughness: 0.1,
    emissive: '#332200',
    emissiveIntensity: 0.1,
  });

  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);
  engine.applyMaterial(objectIds, goldenMaterial);
  log('✨ 应用黄金材质');
};

// ========== 光照控制方法 ==========

// 切换环境光
(window as any).toggleAmbient = function (): void {
  const scene = engine.getScene();
  const ambientLight = scene.lights.find((light) => light.type === 'ambient');
  if (ambientLight) {
    const newIntensity = (ambientLight.intensity || 0) > 0 ? 0 : 0.4;
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: {
        id: ambientLight.id,
        changes: { intensity: newIntensity },
      },
    });
    log(`💡 环境光${newIntensity > 0 ? '开启' : '关闭'}`);
  }
};

// 切换平行光
(window as any).toggleDirectional = function (): void {
  const scene = engine.getScene();
  const directionalLight = scene.lights.find((light) => light.type === 'directional');
  if (directionalLight) {
    const newIntensity = (directionalLight.intensity || 0) > 0 ? 0 : 0.8;
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: {
        id: directionalLight.id,
        changes: { intensity: newIntensity },
      },
    });
    log(`☀️ 平行光${newIntensity > 0 ? '开启' : '关闭'}`);
  }
};

// 添加点光源
(window as any).addPointLight = function (): void {
  engine.dispatch({
    type: 'ADD_LIGHT',
    payload: {
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
    },
  });
  log('💡 添加点光源');
};

// 切换背景
(window as any).changeBackground = function (): void {
  backgroundIndex = (backgroundIndex + 1) % backgrounds.length;

  // 通过渲染器直接设置背景色
  const threeScene = renderer.getThreeScene();
  threeScene.background = new Color(backgrounds[backgroundIndex]);

  log(`🎨 背景色切换为: ${backgrounds[backgroundIndex]}`);
};

// ========== 场景管理方法 ==========

// 清空场景
(window as any).clearScene = function (): void {
  const scene = engine.getScene();
  scene.objects.forEach((obj) => {
    engine.removeObject(obj.id);
  });
  objectCount = 0;
  log('🗑️ 场景已清空');
};

// 重置相机
(window as any).resetCamera = function (): void {
  controls.reset();
  engine.dispatch({
    type: 'UPDATE_CAMERA',
    payload: {
      position: new Vector3(5, 5, 5),
      target: new Vector3(0, 0, 0),
    },
  });
  log('📷 相机已重置');
};

// 启动应用
document.addEventListener('DOMContentLoaded', init);
