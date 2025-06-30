// 导入DSL引擎和渲染器

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Color, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TripoEngine, TripoRenderer } from '../../src/index.js';

// 全局变量
let engine: TripoEngine, renderer: TripoRenderer, controls: OrbitControls;
let objectCount = 0;
let backgroundIndex = 0;
const backgrounds = ['#f0f0f0', '#87CEEB', '#FFB6C1', '#98FB98', '#DDA0DD'];

// 初始化系统
function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // 创建DSL引擎
  engine = new TripoEngine();

  // 创建渲染器
  renderer = new TripoRenderer(canvas, engine);

  // 添加轨道控制器
  controls = new OrbitControls(renderer.getThreeCamera(), renderer.getThreeRenderer().domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 监听场景变化
  engine.subscribe(updateStats);

  // 启动渲染循环
  animate();

  log('DSL引擎初始化完成');
  log('渲染器创建完成');
  log('轨道控制器已启用');
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
}

// 日志功能
function log(message: string) {
  const logs = document.getElementById('logs');
  const time = new Date().toLocaleTimeString();
  logs.innerHTML += `[${time}] ${message}<br>`;
  logs.scrollTop = logs.scrollHeight;
}

// 更新统计信息
function updateStats(scene: {
  objects: string | any[];
  materials: string | any[];
  lights: string | any[];
  selection: any[];
}) {
  const stats = document.getElementById('stats');
  stats.innerHTML = `
                对象数量: ${scene.objects.length}<br>
                材质数量: ${scene.materials.length}<br>
                光源数量: ${scene.lights.length}<br>
                选中对象: ${scene.selection.length > 0 ? scene.selection.join(', ') : '无'}
            `;
}

// 添加立方体
window.addCube = function () {
  const id = engine.addObject({
    name: `立方体_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'box',
      size: new Vector3(1, 1, 1),
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ),
    },
    material: { id: 'default' },
  });
  log(`添加立方体: ${id}`);
};

// 添加球体
window.addSphere = function () {
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
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ),
    },
    material: { id: 'default' },
  });
  log(`添加球体: ${id}`);
};

// 添加平面
window.addPlane = function () {
  const id = engine.addObject({
    name: `平面_${++objectCount}`,
    type: 'mesh',
    geometry: {
      type: 'plane',
      size: new Vector3(2, 2, 1),
    },
    transform: {
      position: new Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ),
      rotation: new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    },
    material: { id: 'default' },
  });
  log(`添加平面: ${id}`);
};

// 清空场景
window.clearScene = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj: { id: any }) => {
    engine.removeObject(obj.id);
  });
  objectCount = 0;
  log('场景已清空');
};

// 切换到线框模式
window.changeToWireframe = function () {
  const wireframeMaterial = engine.addMaterial({
    name: '线框材质',
    type: 'wireframe',
    color: '#00ff00',
  });

  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj: { id: any }) => obj.id);
  engine.applyMaterial(objectIds, wireframeMaterial);
  log('已应用线框材质');
};

// 切换到标准材质
window.changeToStandard = function () {
  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj: { id: any }) => obj.id);
  engine.applyMaterial(objectIds, 'default');
  log('已应用标准材质');
};

// 随机颜色
window.randomColors = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj: { id: any }) => {
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    const materialId = engine.addMaterial({
      type: 'standard',
      color: color,
      metalness: Math.random() * 0.5,
      roughness: Math.random() * 0.5 + 0.2,
    });
    engine.applyMaterial([obj.id], materialId);
  });
  log('已应用随机颜色材质');
};

// 切换环境光
window.toggleAmbient = function () {
  const scene = engine.getScene();
  const ambientLight = scene.lights.find((light: { type: string }) => light.type === 'ambient');
  if (ambientLight) {
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: {
        id: ambientLight.id,
        changes: {
          intensity: ambientLight.intensity > 0 ? 0 : 0.4,
        },
      },
    });
    log(`环境光${ambientLight.intensity > 0 ? '关闭' : '开启'}`);
  }
};

// 切换平行光
window.toggleDirectional = function () {
  const scene = engine.getScene();
  const directionalLight = scene.lights.find(
    (light: { type: string }) => light.type === 'directional',
  );
  if (directionalLight) {
    engine.dispatch({
      type: 'UPDATE_LIGHT',
      payload: {
        id: directionalLight.id,
        changes: {
          intensity: directionalLight.intensity > 0 ? 0 : 0.8,
        },
      },
    });
    log(`平行光${directionalLight.intensity > 0 ? '关闭' : '开启'}`);
  }
};

// 切换背景
window.changeBackground = function () {
  backgroundIndex = (backgroundIndex + 1) % backgrounds.length;
  engine.dispatch({
    type: 'UPDATE_CAMERA',
    payload: {},
  });

  // 通过渲染器直接设置背景色
  const scene = renderer.getThreeScene();
  scene.background = new Color(backgrounds[backgroundIndex]);

  log(`背景色切换为: ${backgrounds[backgroundIndex]}`);
};

// 窗口大小调整
window.addEventListener('resize', () => {
  const canvas = document.getElementById('canvas');
  if (canvas) {
    renderer.resize(canvas.clientWidth, canvas.clientHeight);
  }
});

// 启动应用
init();
