import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TripoEngine, TripoRenderer } from '../../src/index.js';

// 全局变量
let engine, renderer, controls;
let currentMode = 'select';
let selectedObject = null;
let isAnimationPaused = false;
let animationSpeed = 1.0;
let drawnObjects = [];
let lastSpawnTime = 0;
let spawnRate = 100;
let brushSize = 1.0;

// 鼠标和交互状态
const mouse = new Vector2();
const raycaster = new Raycaster();
let isDragging = false;
const dragOffset = new Vector3();

// 动画系统
const animatedObjects = new Map();
let animationFrame = 0;

// 物理系统
let physicsEnabled = false;
let gravity = 9.8;
const objects = new Map();

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

  // 设置事件监听器
  setupEventListeners();

  // 创建初始场景
  createInitialScene();

  // 启动渲染循环
  animate();
}

// 设置事件监听器
function setupEventListeners() {
  const canvas = document.getElementById('canvas');

  // 鼠标事件
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('click', onClick);

  // 键盘事件
  document.addEventListener('keydown', onKeyDown);

  // 场景变化监听
  engine.subscribe(onSceneUpdate);
}

// 鼠标移动事件
function onMouseMove(event) {
  const canvas = document.getElementById('canvas');
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  updateStatus();

  // 绘制模式
  if (currentMode === 'paint' && isDragging) {
    const now = Date.now();
    if (now - lastSpawnTime > spawnRate) {
      spawnObjectAtMouse();
      lastSpawnTime = now;
    }
  }

  // 移动模式
  if (currentMode === 'move' && isDragging && selectedObject) {
    moveSelectedObject();
  }
}

// 鼠标按下事件
function onMouseDown(event) {
  if (currentMode === 'paint') {
    isDragging = true;
    spawnObjectAtMouse();
    lastSpawnTime = Date.now();
  } else if (currentMode === 'move' && selectedObject) {
    isDragging = true;
    controls.enabled = false;
  }
}

// 鼠标释放事件
function onMouseUp(event) {
  isDragging = false;
  controls.enabled = true;
}

// 点击事件
function onClick(event) {
  if (isDragging) return;

  const intersectedObject = getIntersectedObject();

  switch (currentMode) {
    case 'select':
      selectObject(intersectedObject);
      break;
    case 'delete':
      if (intersectedObject) {
        deleteObject(intersectedObject);
      }
      break;
    case 'rotate':
      if (intersectedObject) {
        rotateObject(intersectedObject);
      }
      break;
    case 'scale':
      if (intersectedObject) {
        scaleObject(intersectedObject);
      }
      break;
  }
}

// 键盘事件
function onKeyDown(event) {
  switch (event.key.toLowerCase()) {
    case 'q':
      setInteractionMode('select');
      break;
    case 'w':
      setInteractionMode('move');
      break;
    case 'e':
      setInteractionMode('rotate');
      break;
    case 'r':
      setInteractionMode('scale');
      break;
    case ' ':
      event.preventDefault();
      pauseAllAnimations();
      break;
    case 'delete':
      if (selectedObject) {
        deleteObject(selectedObject);
      }
      break;
    case 'z':
      if (event.ctrlKey) {
        engine.undo();
      }
      break;
    case 'y':
      if (event.ctrlKey) {
        engine.redo();
      }
      break;
  }
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (!isAnimationPaused) {
    animationFrame++;
    updateAnimations();
    updatePhysics();
  }
}

// 创建初始场景
function createInitialScene() {
  // 地面
  engine.addObject({
    name: '地面',
    type: 'mesh',
    geometry: { type: 'plane', size: new Vector3(20, 20, 1) },
    transform: {
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(-Math.PI / 2, 0, 0),
    },
    material: { type: 'standard', color: '#ecf0f1' },
  });

  // 几个测试对象
  const testObjects = [
    { name: '立方体1', pos: [-3, 1, 0], geom: 'box', color: '#3498db' },
    { name: '球体1', pos: [0, 1, 0], geom: 'sphere', color: '#e74c3c' },
    { name: '圆柱体1', pos: [3, 1, 0], geom: 'cylinder', color: '#2ecc71' },
  ];

  testObjects.forEach((obj) => {
    const id = engine.addObject({
      name: obj.name,
      type: 'mesh',
      geometry:
        obj.geom === 'sphere'
          ? { type: 'sphere', radius: 1, radialSegments: 16, heightSegments: 12 }
          : obj.geom === 'cylinder'
            ? { type: 'cylinder', radius: 1, height: 2, radialSegments: 16 }
            : { type: 'box', size: new Vector3(2, 2, 2) },
      transform: {
        position: new Vector3(...obj.pos),
      },
      material: { type: 'standard', color: obj.color },
    });

    // 初始化物理属性
    objects.set(id, {
      velocity: new Vector3(0, 0, 0),
      acceleration: new Vector3(0, 0, 0),
      mass: 1,
    });
  });
}

// 设置交互模式
window.setInteractionMode = function (mode) {
  currentMode = mode;

  // 更新UI
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // 更新鼠标样式
  const canvas = document.getElementById('canvas');
  canvas.className = mode;

  // 更新帮助文本
  const helpTexts = {
    select: '点击对象选择，拖拽相机视角',
    move: '选中对象后拖拽移动',
    rotate: '点击对象旋转',
    scale: '点击对象缩放',
    paint: '拖拽鼠标绘制对象',
    delete: '点击对象删除',
  };

  document.getElementById('modeHelp').textContent = helpTexts[mode];
  updateStatus();
};

// 获取鼠标射线交叉的对象
function getIntersectedObject() {
  raycaster.setFromCamera(mouse, renderer.getThreeCamera());
  const threeScene = renderer.getThreeScene();
  const intersects = raycaster.intersectObjects(threeScene.children, true);

  if (intersects.length > 0) {
    // 找到对应的DSL对象
    const threeObject = intersects[0].object;
    const scene = engine.getScene();
    return scene.objects.find((obj) => {
      const mapped = renderer.objectMap?.get(obj.id);
      return mapped === threeObject || mapped === threeObject.parent;
    });
  }
  return null;
}

// 选择对象
function selectObject(obj) {
  if (selectedObject) {
    // 取消之前选中对象的高亮
    engine.updateObject(selectedObject.id, {
      material: { type: 'standard', color: selectedObject.originalColor || '#ffffff' },
    });
  }

  if (obj) {
    selectedObject = obj;
    if (!obj.originalColor) {
      obj.originalColor = obj.material?.color || '#ffffff';
    }
    // 高亮选中对象
    engine.updateObject(obj.id, {
      material: { type: 'standard', color: '#ffff00', emissive: '#444400' },
    });
    engine.selectObjects([obj.id], 'set');
  } else {
    selectedObject = null;
    engine.selectObjects([], 'set');
  }

  updateStatus();
}

// 移动选中对象
function moveSelectedObject() {
  if (!selectedObject) return;

  raycaster.setFromCamera(mouse, renderer.getThreeCamera());
  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const intersection = new Vector3();

  if (raycaster.ray.intersectPlane(plane, intersection)) {
    engine.updateObject(selectedObject.id, {
      transform: {
        ...selectedObject.transform,
        position: new Vector3(intersection.x, selectedObject.transform.position.y, intersection.z),
      },
    });
  }
}

// 在鼠标位置生成对象
function spawnObjectAtMouse() {
  raycaster.setFromCamera(mouse, renderer.getThreeCamera());
  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const intersection = new Vector3();

  if (raycaster.ray.intersectPlane(plane, intersection)) {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    const types = ['box', 'sphere', 'cylinder'];

    const id = engine.addObject({
      name: `绘制对象_${drawnObjects.length + 1}`,
      type: 'mesh',
      geometry: {
        type: types[Math.floor(Math.random() * types.length)],
        size: new Vector3(brushSize, brushSize, brushSize),
        radius: brushSize / 2,
        height: brushSize,
      },
      transform: {
        position: new Vector3(intersection.x, brushSize / 2, intersection.z),
      },
      material: {
        type: 'standard',
        color: colors[Math.floor(Math.random() * colors.length)],
      },
    });

    drawnObjects.push(id);

    // 添加物理属性
    objects.set(id, {
      velocity: new Vector3(0, 0, 0),
      acceleration: new Vector3(0, 0, 0),
      mass: 0.5,
    });
  }
}

// 动画控制
window.startRotationAnimation = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj) => {
    if (obj.name !== '地面') {
      animatedObjects.set(obj.id, {
        type: 'rotation',
        startTime: animationFrame,
        speed: (Math.random() - 0.5) * 0.02,
      });
    }
  });
};

window.startBounceAnimation = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj) => {
    if (obj.name !== '地面') {
      animatedObjects.set(obj.id, {
        type: 'bounce',
        startTime: animationFrame,
        amplitude: Math.random() * 2 + 1,
        frequency: Math.random() * 0.05 + 0.02,
        baseY: obj.transform.position.y,
      });
    }
  });
};

window.startWaveAnimation = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj, index) => {
    if (obj.name !== '地面') {
      animatedObjects.set(obj.id, {
        type: 'wave',
        startTime: animationFrame,
        offset: index * 0.5,
        amplitude: 2,
        frequency: 0.03,
        baseY: obj.transform.position.y,
      });
    }
  });
};

window.startOrbitAnimation = function () {
  const scene = engine.getScene();
  scene.objects.forEach((obj, index) => {
    if (obj.name !== '地面') {
      const radius = Math.sqrt(obj.transform.position.x ** 2 + obj.transform.position.z ** 2);
      animatedObjects.set(obj.id, {
        type: 'orbit',
        startTime: animationFrame,
        radius: Math.max(radius, 3),
        speed: 0.02 + index * 0.005,
        centerY: obj.transform.position.y,
      });
    }
  });
};

window.pauseAllAnimations = function () {
  isAnimationPaused = !isAnimationPaused;
  const btn = document.getElementById('pauseBtn');
  btn.textContent = isAnimationPaused ? '恢复所有动画' : '暂停所有动画';
};

window.stopAllAnimations = function () {
  animatedObjects.clear();
  isAnimationPaused = false;
  document.getElementById('pauseBtn').textContent = '暂停所有动画';
};

window.updateAnimationSpeed = function () {
  animationSpeed = parseFloat(document.getElementById('animSpeed').value);
  document.getElementById('animSpeedValue').textContent = animationSpeed.toFixed(1);
};

// 更新动画
function updateAnimations() {
  animatedObjects.forEach((anim, objectId) => {
    const obj = engine.getScene().objects.find((o) => o.id === objectId);
    if (!obj) {
      animatedObjects.delete(objectId);
      return;
    }

    const time = (animationFrame - anim.startTime) * animationSpeed;

    switch (anim.type) {
      case 'rotation':
        engine.updateObject(objectId, {
          transform: {
            ...obj.transform,
            rotation: new Vector3(
              obj.transform.rotation.x + anim.speed,
              obj.transform.rotation.y + anim.speed,
              obj.transform.rotation.z,
            ),
          },
        });
        break;

      case 'bounce':
        const bounceY = anim.baseY + Math.abs(Math.sin(time * anim.frequency)) * anim.amplitude;
        engine.updateObject(objectId, {
          transform: {
            ...obj.transform,
            position: new Vector3(obj.transform.position.x, bounceY, obj.transform.position.z),
          },
        });
        break;

      case 'wave':
        const waveY = anim.baseY + Math.sin(time * anim.frequency + anim.offset) * anim.amplitude;
        engine.updateObject(objectId, {
          transform: {
            ...obj.transform,
            position: new Vector3(obj.transform.position.x, waveY, obj.transform.position.z),
          },
        });
        break;

      case 'orbit':
        const angle = time * anim.speed;
        const orbitX = Math.cos(angle) * anim.radius;
        const orbitZ = Math.sin(angle) * anim.radius;
        engine.updateObject(objectId, {
          transform: {
            ...obj.transform,
            position: new Vector3(orbitX, anim.centerY, orbitZ),
          },
        });
        break;
    }
  });
}

// 物理系统
window.enableGravity = function () {
  physicsEnabled = true;
};

window.disableGravity = function () {
  physicsEnabled = false;
  // 重置所有速度
  objects.forEach((obj) => {
    obj.velocity.set(0, 0, 0);
    obj.acceleration.set(0, 0, 0);
  });
};

window.updateGravity = function () {
  gravity = parseFloat(document.getElementById('gravity').value);
  document.getElementById('gravityValue').textContent = gravity.toFixed(1);
};

window.addForceField = function () {
  // 添加径向力场效果
  objects.forEach((physObj, objectId) => {
    const obj = engine.getScene().objects.find((o) => o.id === objectId);
    if (obj && obj.name !== '地面') {
      const force = new Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 5,
        (Math.random() - 0.5) * 10,
      );
      physObj.velocity.add(force);
    }
  });
};

window.resetPositions = function () {
  // 重置所有对象位置
  const scene = engine.getScene();
  scene.objects.forEach((obj, index) => {
    if (obj.name !== '地面') {
      const newPos = new Vector3((index - 2) * 3, 1, 0);
      engine.updateObject(obj.id, {
        transform: {
          ...obj.transform,
          position: newPos,
        },
      });

      const physObj = objects.get(obj.id);
      if (physObj) {
        physObj.velocity.set(0, 0, 0);
        physObj.acceleration.set(0, 0, 0);
      }
    }
  });
};

// 更新物理
function updatePhysics() {
  if (!physicsEnabled) return;

  objects.forEach((physObj, objectId) => {
    const obj = engine.getScene().objects.find((o) => o.id === objectId);
    if (!obj || obj.name === '地面') return;

    // 应用重力
    physObj.acceleration.set(0, -gravity * 0.001, 0);

    // 更新速度
    physObj.velocity.add(physObj.acceleration);

    // 空气阻力
    physObj.velocity.multiplyScalar(0.99);

    // 更新位置
    const newPos = obj.transform.position.clone().add(physObj.velocity);

    // 地面碰撞检测
    if (newPos.y <= 0.5) {
      newPos.y = 0.5;
      physObj.velocity.y = -physObj.velocity.y * 0.8; // 弹性碰撞
    }

    engine.updateObject(objectId, {
      transform: {
        ...obj.transform,
        position: newPos,
      },
    });
  });
}

// 其他控制函数
window.updateBrushSize = function () {
  brushSize = parseFloat(document.getElementById('brushSize').value);
  document.getElementById('brushSizeValue').textContent = brushSize.toFixed(1);
};

window.updateSpawnRate = function () {
  spawnRate = parseInt(document.getElementById('spawnRate').value);
  document.getElementById('spawnRateValue').textContent = spawnRate;
};

window.clearDrawnObjects = function () {
  drawnObjects.forEach((id) => {
    engine.removeObject(id);
    objects.delete(id);
    animatedObjects.delete(id);
  });
  drawnObjects = [];
};

function rotateObject(obj) {
  engine.updateObject(obj.id, {
    transform: {
      ...obj.transform,
      rotation: new Vector3(
        obj.transform.rotation.x + Math.PI / 4,
        obj.transform.rotation.y + Math.PI / 4,
        obj.transform.rotation.z,
      ),
    },
  });
}

function scaleObject(obj) {
  const currentScale = obj.transform.scale || new Vector3(1, 1, 1);
  const newScale = currentScale.x < 2 ? 1.5 : 0.5;
  engine.updateObject(obj.id, {
    transform: {
      ...obj.transform,
      scale: new Vector3(newScale, newScale, newScale),
    },
  });
}

function deleteObject(obj) {
  if (obj === selectedObject) {
    selectedObject = null;
  }
  engine.removeObject(obj.id);
  objects.delete(obj.id);
  animatedObjects.delete(obj.id);

  const index = drawnObjects.indexOf(obj.id);
  if (index > -1) {
    drawnObjects.splice(index, 1);
  }
}

function onSceneUpdate(scene) {
  // 清理已删除对象的动画和物理数据
  animatedObjects.forEach((_, id) => {
    if (!scene.objects.find((obj) => obj.id === id)) {
      animatedObjects.delete(id);
    }
  });

  objects.forEach((_, id) => {
    if (!scene.objects.find((obj) => obj.id === id)) {
      objects.delete(id);
    }
  });
}

function updateStatus() {
  const status = document.getElementById('status');
  status.innerHTML = `
        交互模式: ${currentMode}<br>
        选中对象: ${selectedObject ? selectedObject.name : '无'}<br>
        动画对象: ${animatedObjects.size}<br>
        鼠标位置: (${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)})
    `;
}

// 窗口大小调整
window.addEventListener('resize', () => {
  const canvas = document.getElementById('canvas');
  renderer.resize(canvas.clientWidth, canvas.clientHeight);
});

// 启动应用
init();
