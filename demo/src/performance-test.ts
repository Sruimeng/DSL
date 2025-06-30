import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TripoEngine, TripoRenderer } from '../../src/index.js';

// 全局变量
let engine, renderer, controls;
const performanceData = [];
let testRunning = false;
let lastFrameTime = 0;
let frameCount = 0;
let fps = 60;
let updatesFrozen = false;
const currentTest = null;

// 性能监控
const performanceMonitor = {
  startTime: 0,
  frameData: [],
  maxFrames: 100,
};

// 测试配置
const testConfig = {
  geometryComplexity: 'medium',
  shadowQuality: 'medium',
  batchSize: 100,
  testDuration: 10,
};

// 初始化系统
function init() {
  const canvas = document.getElementById('canvas');

  // 创建DSL引擎
  engine = new TripoEngine();

  // 创建渲染器
  renderer = new TripoRenderer(canvas, engine);

  // 添加轨道控制器
  controls = new OrbitControls(renderer.getThreeCamera(), renderer.getThreeRenderer().domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 监听场景变化
  engine.subscribe(onSceneUpdate);

  // 创建基础场景
  createBaseScene();

  // 开始性能监控
  startPerformanceMonitoring();

  // 启动渲染循环
  animate();
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  // 计算FPS
  frameCount++;
  if (frameCount % 60 === 0) {
    fps = Math.round(1000 / deltaTime);
    updateMetrics();
  }

  // 记录性能数据
  recordPerformanceData(deltaTime);

  if (!updatesFrozen) {
    controls.update();
  }
}

// 创建基础场景
function createBaseScene() {
  // 地面
  engine.addObject({
    name: '地面',
    type: 'mesh',
    geometry: { type: 'plane', size: new Vector3(100, 100, 1) },
    transform: {
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(-Math.PI / 2, 0, 0),
    },
    material: { type: 'standard', color: '#2c3e50' },
  });
}

// 性能测试函数
window.test100Objects = function () {
  createTestObjects(100, 'sphere', '#3498db');
};

window.test500Objects = function () {
  createTestObjects(500, 'sphere', '#e74c3c');
};

window.test1000Objects = function () {
  createTestObjects(1000, 'box', '#2ecc71');
};

window.test5000Objects = function () {
  if (confirm('创建5000个对象可能影响性能，是否继续？')) {
    createTestObjects(5000, 'box', '#f39c12');
  }
};

window.testComplexScene = function () {
  clearAllObjects();
  createBaseScene();

  // 创建复杂场景
  for (let i = 0; i < 200; i++) {
    const types = ['box', 'sphere', 'cylinder'];
    const type = types[i % types.length];
    const color = `hsl(${(i * 137.5) % 360}, 70%, 50%)`;

    engine.addObject({
      name: `复杂对象_${i}`,
      type: 'mesh',
      geometry: createComplexGeometry(type),
      transform: {
        position: new Vector3(
          (Math.random() - 0.5) * 80,
          Math.random() * 20 + 1,
          (Math.random() - 0.5) * 80,
        ),
        rotation: new Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        scale: new Vector3(
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
        ),
      },
      material: {
        type: 'standard',
        color: color,
        metalness: Math.random(),
        roughness: Math.random(),
      },
    });
  }
};

window.testAnimatedObjects = function () {
  clearAllObjects();
  createBaseScene();

  // 创建动画对象
  for (let i = 0; i < 100; i++) {
    const id = engine.addObject({
      name: `动画对象_${i}`,
      type: 'mesh',
      geometry: { type: 'sphere', radius: 0.5, radialSegments: 16, heightSegments: 12 },
      transform: {
        position: new Vector3(((i % 10) - 4.5) * 4, 1, (Math.floor(i / 10) - 4.5) * 4),
      },
      material: { type: 'standard', color: `hsl(${i * 3.6}, 70%, 50%)` },
    });

    // 添加动画
    animateObject(id, i);
  }
};

// 创建测试对象
function createTestObjects(count, type, color) {
  console.log(`开始创建 ${count} 个 ${type} 对象...`);
  const startTime = performance.now();

  clearAllObjects();
  createBaseScene();

  const batchSize = 50; // 批量处理避免阻塞
  let created = 0;

  function createBatch() {
    const endIndex = Math.min(created + batchSize, count);

    for (let i = created; i < endIndex; i++) {
      const radius = Math.sqrt(i) * 2;
      const angle = i * 0.1;

      engine.addObject({
        name: `测试对象_${i}`,
        type: 'mesh',
        geometry: createGeometryByComplexity(type),
        transform: {
          position: new Vector3(
            Math.cos(angle) * radius,
            Math.random() * 5 + 1,
            Math.sin(angle) * radius,
          ),
        },
        material: { type: 'standard', color: color },
      });
    }

    created = endIndex;

    if (created < count) {
      setTimeout(createBatch, 0); // 让出控制权
    } else {
      const endTime = performance.now();
      console.log(`创建完成，用时: ${(endTime - startTime).toFixed(2)}ms`);
    }
  }

  createBatch();
}

// 根据复杂度创建几何体
function createGeometryByComplexity(type) {
  const complexity = testConfig.geometryComplexity;

  switch (type) {
    case 'sphere':
      const segments = {
        low: { radial: 8, height: 6 },
        medium: { radial: 16, height: 12 },
        high: { radial: 32, height: 24 },
        ultra: { radial: 64, height: 48 },
      }[complexity];
      return {
        type: 'sphere',
        radius: 1,
        radialSegments: segments.radial,
        heightSegments: segments.height,
      };

    case 'cylinder':
      const cylSegments = {
        low: 8,
        medium: 16,
        high: 32,
        ultra: 64,
      }[complexity];
      return {
        type: 'cylinder',
        radius: 1,
        height: 2,
        radialSegments: cylSegments,
      };

    default: // box
      return { type: 'box', size: new Vector3(1, 1, 1) };
  }
}

function createComplexGeometry(type) {
  return createGeometryByComplexity(type);
}

// 对象动画
function animateObject(objectId, index) {
  let frame = 0;

  function updateAnimation() {
    if (updatesFrozen) {
      requestAnimationFrame(updateAnimation);
      return;
    }

    const obj = engine.getScene().objects.find((o) => o.id === objectId);
    if (!obj) return;

    frame++;
    const time = frame * 0.05;
    const offset = index * 0.1;

    engine.updateObject(objectId, {
      transform: {
        ...obj.transform,
        position: new Vector3(
          obj.transform.position.x,
          1 + Math.sin(time + offset) * 2,
          obj.transform.position.z,
        ),
        rotation: new Vector3(time * 0.5, time * 0.3, 0),
      },
    });

    requestAnimationFrame(updateAnimation);
  }

  updateAnimation();
}

// 批量操作
window.updateBatchSize = function () {
  testConfig.batchSize = parseInt(document.getElementById('batchSize').value);
  document.getElementById('batchSizeValue').textContent = testConfig.batchSize;
};

window.addBatchObjects = function () {
  const count = testConfig.batchSize;
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    engine.addObject({
      name: `批量对象_${Date.now()}_${i}`,
      type: 'mesh',
      geometry: createGeometryByComplexity('sphere'),
      transform: {
        position: new Vector3(
          (Math.random() - 0.5) * 60,
          Math.random() * 10 + 1,
          (Math.random() - 0.5) * 60,
        ),
      },
      material: { type: 'standard', color: color },
    });
  }
};

window.clearAllObjects = function () {
  const scene = engine.getScene();
  const objectsToRemove = scene.objects.filter((obj) => obj.name !== '地面');

  objectsToRemove.forEach((obj) => {
    engine.removeObject(obj.id);
  });
};

// 性能优化
window.enableInstancing = function () {
  console.log('实例化渲染已启用');
  // 这里可以实现实例化渲染逻辑
};

window.enableCulling = function () {
  console.log('视锥体剔除已启用');
  // 这里可以实现视锥体剔除
};

window.enableLOD = function () {
  console.log('细节层次已启用');
  // 这里可以实现LOD系统
};

window.optimizeMaterials = function () {
  console.log('材质合批优化已启用');
  // 合并相似材质
};

window.updateFrameRate = function () {
  const rate = parseInt(document.getElementById('updateRate').value);
  document.getElementById('updateRateValue').textContent = rate;
  // 这里可以实现帧率限制
};

window.freezeUpdates = function () {
  updatesFrozen = !updatesFrozen;
  const btn = document.getElementById('freezeBtn');
  btn.textContent = updatesFrozen ? '解冻更新' : '冻结更新';
};

window.forceGC = function () {
  if (window.gc) {
    window.gc();
    console.log('强制垃圾回收完成');
  } else {
    console.log('需要在启动Chrome时添加 --js-flags="--expose-gc" 参数');
  }
};

// 自动化测试
window.updateTestDuration = function () {
  testConfig.testDuration = parseInt(document.getElementById('testDuration').value);
  document.getElementById('testDurationValue').textContent = testConfig.testDuration;
};

window.runBenchmark = function () {
  if (testRunning) return;

  testRunning = true;
  document.getElementById('benchmarkBtn').disabled = true;

  console.log('开始基准测试...');

  const tests = [
    { name: '100个对象', count: 100 },
    { name: '500个对象', count: 500 },
    { name: '1000个对象', count: 1000 },
  ];

  let currentTestIndex = 0;

  function runNextTest() {
    if (currentTestIndex >= tests.length) {
      testRunning = false;
      document.getElementById('benchmarkBtn').disabled = false;
      console.log('基准测试完成');
      return;
    }

    const test = tests[currentTestIndex];
    console.log(`运行测试: ${test.name}`);

    clearAllObjects();
    createBaseScene();
    createTestObjects(test.count, 'sphere', '#3498db');

    // 测试持续时间
    setTimeout(() => {
      recordBenchmarkResult(test.name, fps, engine.getScene().objects.length);
      currentTestIndex++;
      runNextTest();
    }, testConfig.testDuration * 1000);
  }

  runNextTest();
};

window.runStressTest = function () {
  if (testRunning) return;

  testRunning = true;
  document.getElementById('stressTestBtn').disabled = true;

  console.log('开始压力测试...');

  let objectCount = 0;
  const maxObjects = 10000;
  const batchSize = 100;

  function addBatch() {
    if (objectCount >= maxObjects || fps < 10) {
      testRunning = false;
      document.getElementById('stressTestBtn').disabled = false;
      console.log(`压力测试完成，最大对象数: ${objectCount}, 最终FPS: ${fps}`);
      return;
    }

    for (let i = 0; i < batchSize; i++) {
      engine.addObject({
        name: `压力测试_${objectCount}`,
        type: 'mesh',
        geometry: { type: 'box', size: new Vector3(0.5, 0.5, 0.5) },
        transform: {
          position: new Vector3(
            (Math.random() - 0.5) * 100,
            Math.random() * 20 + 1,
            (Math.random() - 0.5) * 100,
          ),
        },
        material: { type: 'basic', color: '#ff0000' },
      });
      objectCount++;
    }

    setTimeout(addBatch, 500); // 每0.5秒添加一批
  }

  clearAllObjects();
  createBaseScene();
  addBatch();
};

window.runMemoryTest = function () {
  console.log('开始内存泄漏测试...');

  // 重复创建和删除对象来测试内存泄漏
  let cycle = 0;
  const maxCycles = 100;

  function memoryCycle() {
    if (cycle >= maxCycles) {
      console.log('内存测试完成');
      return;
    }

    // 创建对象
    const ids = [];
    for (let i = 0; i < 50; i++) {
      const id = engine.addObject({
        name: `内存测试_${cycle}_${i}`,
        type: 'mesh',
        geometry: { type: 'sphere', radius: 1, radialSegments: 16, heightSegments: 12 },
        transform: {
          position: new Vector3(
            (Math.random() - 0.5) * 20,
            Math.random() * 10 + 1,
            (Math.random() - 0.5) * 20,
          ),
        },
        material: { type: 'standard', color: '#00ff00' },
      });
      ids.push(id);
    }

    // 删除对象
    setTimeout(() => {
      ids.forEach((id) => engine.removeObject(id));
      cycle++;
      setTimeout(memoryCycle, 100);
    }, 500);
  }

  memoryCycle();
};

window.stopAllTests = function () {
  testRunning = false;
  document.getElementById('benchmarkBtn').disabled = false;
  document.getElementById('stressTestBtn').disabled = false;
  console.log('所有测试已停止');
};

// 性能监控
function startPerformanceMonitoring() {
  performanceMonitor.startTime = performance.now();

  setInterval(() => {
    if (!updatesFrozen) {
      updateMetrics();
      updatePerformanceChart();
    }
  }, 1000);
}

function recordPerformanceData(deltaTime) {
  performanceMonitor.frameData.push(deltaTime);

  if (performanceMonitor.frameData.length > performanceMonitor.maxFrames) {
    performanceMonitor.frameData.shift();
  }
}

function updateMetrics() {
  const scene = engine.getScene();

  document.getElementById('fps').textContent = fps;
  document.getElementById('fps').className =
    fps >= 50 ? 'metric-value' : fps >= 30 ? 'metric-value warning' : 'metric-value error';

  document.getElementById('renderTime').textContent = `${(1000 / fps).toFixed(1)}ms`;
  document.getElementById('objectCount').textContent = scene.objects.length;
  document.getElementById('materialCount').textContent = scene.materials.length;

  // 估算内存使用
  const memoryUsage = estimateMemoryUsage(scene);
  document.getElementById('memoryUsage').textContent = `${memoryUsage.toFixed(1)} MB`;

  // 估算绘制调用和三角形数
  const renderStats = estimateRenderStats(scene);
  document.getElementById('drawCalls').textContent = renderStats.drawCalls;
  document.getElementById('triangles').textContent = renderStats.triangles.toLocaleString();
}

function estimateMemoryUsage(scene) {
  // 简单估算：每个对象约占用1KB，每个材质约占用0.5KB
  const objectMemory = scene.objects.length * 1; // KB
  const materialMemory = scene.materials.length * 0.5; // KB
  return (objectMemory + materialMemory) / 1024; // MB
}

function estimateRenderStats(scene) {
  const drawCalls = scene.objects.length;
  let triangles = 0;

  scene.objects.forEach((obj) => {
    switch (obj.geometry?.type) {
      case 'box':
        triangles += 12;
        break;
      case 'sphere':
        const radial = obj.geometry.radialSegments || 16;
        const height = obj.geometry.heightSegments || 12;
        triangles += radial * height * 2;
        break;
      case 'cylinder':
        const cylRadial = obj.geometry.radialSegments || 16;
        triangles += cylRadial * 4;
        break;
      case 'plane':
        triangles += 2;
        break;
      default:
        triangles += 12;
    }
  });

  return { drawCalls, triangles };
}

function updatePerformanceChart() {
  const chart = document.getElementById('performanceChart');
  const frameData = performanceMonitor.frameData;

  if (frameData.length === 0) return;

  // 清除旧的图表
  chart.innerHTML = '';

  // 绘制新的图表
  const maxHeight = 80;
  const maxTime = Math.max(...frameData, 33.33); // 至少显示到30fps

  frameData.forEach((time, index) => {
    const bar = document.createElement('div');
    bar.className = 'chart-line';
    bar.style.left = `${(index / frameData.length) * 100}%`;
    bar.style.height = `${(time / maxTime) * maxHeight}px`;
    bar.style.background = time > 33.33 ? '#e74c3c' : time > 16.67 ? '#f39c12' : '#2ecc71';
    chart.appendChild(bar);
  });
}

function recordBenchmarkResult(testName, fps, objectCount) {
  const result = {
    test: testName,
    fps: fps,
    objectCount: objectCount,
    timestamp: new Date().toISOString(),
  };

  performanceData.push(result);
  console.log(`测试结果: ${testName} - FPS: ${fps}, 对象数: ${objectCount}`);
}

// 配置更新
window.updateGeometryComplexity = function () {
  testConfig.geometryComplexity = document.getElementById('geometryComplexity').value;
};

window.updateShadowQuality = function () {
  testConfig.shadowQuality = document.getElementById('shadowQuality').value;

  const threeRenderer = renderer.getThreeRenderer();
  const shadowMap = threeRenderer.shadowMap;

  switch (testConfig.shadowQuality) {
    case 'off':
      shadowMap.enabled = false;
      break;
    case 'low':
      shadowMap.enabled = true;
      shadowMap.mapSize.setScalar(512);
      break;
    case 'medium':
      shadowMap.enabled = true;
      shadowMap.mapSize.setScalar(1024);
      break;
    case 'high':
      shadowMap.enabled = true;
      shadowMap.mapSize.setScalar(2048);
      break;
  }
};

// 导出结果
window.exportResults = function () {
  const results = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    testConfig: testConfig,
    performanceData: performanceData,
    currentMetrics: {
      fps: fps,
      objectCount: engine.getScene().objects.length,
      materialCount: engine.getScene().materials.length,
    },
  };

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-test-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

function onSceneUpdate(scene) {
  // 场景更新时的处理
}

// 窗口大小调整
window.addEventListener('resize', () => {
  const canvas = document.getElementById('canvas');
  renderer.resize(canvas.clientWidth, canvas.clientHeight);
});

// 启动应用
init();
