/**
 * Basic Scene Demo - 基础场景演示
 *
 * 完整的基础场景演示，包含对象创建、材质控制、灯光控制、场景管理、撤销重做等功能
 */

import { DSLEngine } from '../../dist/index.mjs';

// 全局变量
let engine: any = null;
let sceneManager: any = null;
let history: any[] = [];
let historyIndex = -1;
let ambientLight: any = null;
let directionalLight: any = null;
let pointLights: any[] = [];
let sceneObjects: any[] = [];

// 历史记录项
interface HistoryItem {
  action: string;
  data: any;
  timestamp: number;
}

// 初始化基础场景
async function initBasicScene() {
  console.log('=== 初始化基础场景 ===');

  const baseScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'BasicDemoScene',
      children: [
        {
          type: 'mesh',
          name: 'Ground',
          geometry: {
            type: 'PlaneGeometry',
            width: 20,
            height: 20,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#808080',
            roughness: 0.8,
            metalness: 0.2,
          },
          transform: {
            position: { x: 0, y: -2, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
        },
        {
          type: 'light',
          name: 'AmbientLight',
          lightType: 'ambient',
          intensity: 0.4,
          color: '#ffffff',
        },
        {
          type: 'light',
          name: 'DirectionalLight',
          lightType: 'directional',
          intensity: 0.8,
          color: '#ffffff',
          transform: {
            position: { x: 5, y: 5, z: 5 },
          },
        },
        {
          type: 'camera',
          name: 'MainCamera',
          cameraType: 'perspective',
          fov: 75,
          aspect: window.innerWidth / window.innerHeight,
          near: 0.1,
          far: 1000,
          transform: {
            position: { x: 5, y: 5, z: 10 },
            rotation: { x: -0.3, y: 0.5, z: 0 },
          },
        },
      ],
    },
  };

  try {
    engine = new DSLEngine();
    await engine.initialize();
    await engine.loadDSL(baseScene);

    sceneManager = engine.getSceneManager();
    if (sceneManager) {
      sceneManager.startRenderLoop();

      // 获取灯光引用
      const scene = sceneManager.getScene();
      ambientLight = scene.getObjectByName('AmbientLight');
      directionalLight = scene.getObjectByName('DirectionalLight');

      console.log('基础场景初始化成功');
      updateStats();
      log('场景初始化完成', 'success');
    }
  } catch (error) {
    console.error('初始化失败:', error);
    log('初始化失败: ' + error.message, 'error');
  }
}

// 保存到历史记录
function saveHistory(action: string, data: any) {
  // 删除当前位置之后的历史
  history.splice(historyIndex + 1);

  // 添加新记录
  history.push({
    action,
    data,
    timestamp: Date.now(),
  });

  historyIndex = history.length - 1;

  // 限制历史记录数量
  if (history.length > 50) {
    history.shift();
    historyIndex--;
  }

  updateHistoryUI();
  updateUndoRedoButtons();
}

// 撤销
function undo() {
  if (historyIndex >= 0) {
    const current = history[historyIndex];

    try {
      if (current.action === 'addObject') {
        // 删除对象
        removeObjectFromScene(current.data.name);
      } else if (current.action === 'removeObject') {
        // 恢复对象
        addObjectToScene(current.data);
      } else if (current.action === 'modifyMaterial') {
        // 恢复材质
        restoreMaterial(current.data);
      } else if (current.action === 'modifyLight') {
        // 恢复灯光
        restoreLight(current.data);
      }

      historyIndex--;
      log(`撤销: ${current.action}`, 'info');
      updateStats();
      updateHistoryUI();
      updateUndoRedoButtons();
    } catch (error) {
      log('撤销失败: ' + error.message, 'error');
    }
  }
}

// 重做
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const current = history[historyIndex];

    try {
      if (current.action === 'addObject') {
        // 重新添加对象
        addObjectToScene(current.data);
      } else if (current.action === 'removeObject') {
        // 删除对象
        removeObjectFromScene(current.data.name);
      } else if (current.action === 'modifyMaterial') {
        // 重新应用材质
        applyMaterial(current.data);
      } else if (current.action === 'modifyLight') {
        // 重新应用灯光设置
        applyLightSettings(current.data);
      }

      log(`重做: ${current.action}`, 'info');
      updateStats();
      updateHistoryUI();
      updateUndoRedoButtons();
    } catch (error) {
      log('重做失败: ' + error.message, 'error');
    }
  }
}

// 添加立方体
function addCube() {
  const name = `Cube_${Date.now()}`;
  const cubeData = {
    type: 'mesh',
    name,
    geometry: {
      type: 'BoxGeometry',
      width: 1,
      height: 1,
      depth: 1,
    },
    material: {
      type: 'MeshStandardMaterial',
      color: '#00ff00',
      roughness: 0.5,
      metalness: 0.5,
    },
    transform: {
      position: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 6,
      },
    },
  };

  addObjectToScene(cubeData);
  saveHistory('addObject', cubeData);
  log(`添加立方体: ${name}`, 'success');
}

// 添加球体
function addSphere() {
  const name = `Sphere_${Date.now()}`;
  const sphereData = {
    type: 'mesh',
    name,
    geometry: {
      type: 'SphereGeometry',
      radius: 0.5,
      widthSegments: 32,
      heightSegments: 16,
    },
    material: {
      type: 'MeshStandardMaterial',
      color: '#ff0000',
      roughness: 0.3,
      metalness: 0.7,
    },
    transform: {
      position: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 6,
      },
    },
  };

  addObjectToScene(sphereData);
  saveHistory('addObject', sphereData);
  log(`添加球体: ${name}`, 'success');
}

// 添加平面
function addPlane() {
  const name = `Plane_${Date.now()}`;
  const planeData = {
    type: 'mesh',
    name,
    geometry: {
      type: 'PlaneGeometry',
      width: 2,
      height: 2,
    },
    material: {
      type: 'MeshStandardMaterial',
      color: '#0000ff',
      roughness: 0.8,
      metalness: 0.2,
    },
    transform: {
      position: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 6,
      },
      rotation: { x: Math.random() * Math.PI, y: 0, z: 0 },
    },
  };

  addObjectToScene(planeData);
  saveHistory('addObject', planeData);
  log(`添加平面: ${name}`, 'success');
}

// 添加圆柱
function addCylinder() {
  const name = `Cylinder_${Date.now()}`;
  const cylinderData = {
    type: 'mesh',
    name,
    geometry: {
      type: 'CylinderGeometry',
      radiusTop: 0.5,
      radiusBottom: 0.5,
      height: 1,
    },
    material: {
      type: 'MeshStandardMaterial',
      color: '#ffff00',
      roughness: 0.4,
      metalness: 0.6,
    },
    transform: {
      position: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 6,
      },
    },
  };

  addObjectToScene(cylinderData);
  saveHistory('addObject', cylinderData);
  log(`添加圆柱: ${name}`, 'success');
}

// 添加对象到场景
function addObjectToScene(objectData: any) {
  if (!sceneManager) return;

  // 使用DSL解析器创建对象
  const parser = engine['dslParser'];
  const object = parser.parseObject(objectData);

  if (object) {
    sceneManager.addObject(object);
    sceneObjects.push(objectData);
    updateStats();
  }
}

// 从场景删除对象
function removeObjectFromScene(name: string) {
  if (!sceneManager) return;

  const scene = sceneManager.getScene();
  const object = scene.getObjectByName(name);

  if (object) {
    sceneManager.removeObject(object);
    sceneObjects = sceneObjects.filter((obj) => obj.name !== name);
    updateStats();
  }
}

// 应用标准材质
function changeToStandard() {
  applyMaterialToAllObjects({
    type: 'MeshStandardMaterial',
    roughness: 0.5,
    metalness: 0.5,
  });
  log('应用标准材质', 'info');
}

// 应用线框模式
function changeToWireframe() {
  sceneObjects.forEach((objData) => {
    const scene = sceneManager.getScene();
    const object = scene.getObjectByName(objData.name);

    if (object && object.material) {
      const oldMaterial = {
        name: objData.name,
        material: { ...object.material },
      };

      object.material.wireframe = true;

      saveHistory('modifyMaterial', {
        name: objData.name,
        oldMaterial,
        newMaterial: { wireframe: true },
      });
    }
  });
  log('应用线框模式', 'info');
}

// 随机颜色
function randomColors() {
  sceneObjects.forEach((objData) => {
    const scene = sceneManager.getScene();
    const object = scene.getObjectByName(objData.name);

    if (object && object.material) {
      const oldColor = object.material.color.getHex();
      const newColor = Math.random() * 0xffffff;

      const oldMaterial = {
        name: objData.name,
        material: { color: '#' + oldColor.toString(16).padStart(6, '0') },
      };

      object.material.color.setHex(newColor);

      saveHistory('modifyMaterial', {
        name: objData.name,
        oldMaterial,
        newMaterial: { color: '#' + newColor.toString(16).padStart(6, '0') },
      });
    }
  });
  log('应用随机颜色', 'info');
}

// 应用黄金材质
function applyGolden() {
  applyMaterialToAllObjects({
    type: 'MeshStandardMaterial',
    color: '#FFD700',
    metalness: 1.0,
    roughness: 0.3,
  });
  log('应用黄金材质', 'info');
}

// 切换环境光
function toggleAmbient() {
  if (ambientLight) {
    const oldIntensity = ambientLight.intensity;
    const newIntensity = oldIntensity > 0 ? 0 : 0.4;

    saveHistory('modifyLight', {
      type: 'ambient',
      oldIntensity,
      newIntensity,
    });

    ambientLight.intensity = newIntensity;
    log(`环境光: ${newIntensity > 0 ? '开启' : '关闭'}`, 'info');
  }
}

// 切换平行光
function toggleDirectional() {
  if (directionalLight) {
    const oldIntensity = directionalLight.intensity;
    const newIntensity = oldIntensity > 0 ? 0 : 0.8;

    saveHistory('modifyLight', {
      type: 'directional',
      oldIntensity,
      newIntensity,
    });

    directionalLight.intensity = newIntensity;
    log(`平行光: ${newIntensity > 0 ? '开启' : '关闭'}`, 'info');
  }
}

// 添加点光源
function addPointLight() {
  const name = `PointLight_${Date.now()}`;
  const lightData = {
    type: 'light',
    name,
    lightType: 'point',
    intensity: 1,
    color: '#ffffff',
    distance: 10,
    transform: {
      position: {
        x: (Math.random() - 0.5) * 8,
        y: Math.random() * 4 + 1,
        z: (Math.random() - 0.5) * 8,
      },
    },
  };

  addObjectToScene(lightData);
  saveHistory('addObject', lightData);

  const scene = sceneManager.getScene();
  const light = scene.getObjectByName(name);
  if (light) pointLights.push(light);

  log(`添加点光源: ${name}`, 'success');
}

// 改变背景色
function changeBackground() {
  const colors = ['#87CEEB', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  if (sceneManager && sceneManager.renderer) {
    const oldColor = sceneManager.renderer.getClearColor().getHex();
    sceneManager.renderer.setClearColor(randomColor);

    saveHistory('modifyBackground', {
      oldColor: '#' + oldColor.toString(16).padStart(6, '0'),
      newColor: randomColor,
    });

    log(`背景色改为: ${randomColor}`, 'info');
  }
}

// 重置相机
function resetCamera() {
  if (sceneManager) {
    const camera = sceneManager.getCamera();
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
    log('相机位置已重置', 'info');
  }
}

// 清空场景
function clearScene() {
  if (!sceneManager) return;

  const scene = sceneManager.getScene();
  const toRemove = [];

  scene.traverse((child: any) => {
    if (child.isMesh && child.name !== 'Ground') {
      toRemove.push({
        name: child.name,
        data: child.userData.sourceData || {
          type: 'mesh',
          name: child.name,
          geometry: child.geometry.type,
          material: child.material,
          transform: {
            position: child.position,
            rotation: child.rotation,
            scale: child.scale,
          },
        },
      });
    }
  });

  toRemove.forEach((item) => {
    sceneManager.removeObject(scene.getObjectByName(item.name));
    sceneObjects = sceneObjects.filter((obj) => obj.name !== item.name);
  });

  // 清空点光源
  pointLights.forEach((light) => {
    sceneManager.removeObject(light);
  });
  pointLights = [];

  saveHistory('clearScene', { objects: toRemove });
  updateStats();
  log('清空场景', 'info');
}

// 清空历史记录
function clearHistory() {
  history = [];
  historyIndex = -1;
  updateHistoryUI();
  updateUndoRedoButtons();
  log('历史记录已清空', 'info');
}

// 更新统计信息
function updateStats() {
  if (!sceneManager) return;

  const scene = sceneManager.getScene();
  const meshes = scene.children.filter((child: any) => child.isMesh && child.name !== 'Ground');
  const lights = scene.children.filter((child: any) => child.isLight);

  // 更新顶部统计面板
  const statsGrid = document.getElementById('topStats');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-item">
        <span class="label">对象数量:</span>
        <span class="value">${meshes.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">灯光数量:</span>
        <span class="value">${lights.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">历史记录:</span>
        <span class="value">${historyIndex + 1}/${history.length}</span>
      </div>
    `;
  }
}

// 更新历史记录UI
function updateHistoryUI() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  historyList.innerHTML = '';

  history.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `history-item ${index === historyIndex ? 'active' : 'inactive'}`;

    const actionText =
      {
        addObject: '添加对象',
        removeObject: '删除对象',
        modifyMaterial: '修改材质',
        modifyLight: '修改灯光',
        clearScene: '清空场景',
        modifyBackground: '修改背景',
      }[item.action] || item.action;

    div.innerHTML = `
      <span class="action-type">${actionText}</span>
      <span class="action-time">${new Date(item.timestamp).toLocaleTimeString()}</span>
    `;

    historyList.appendChild(div);
  });

  // 滚动到当前位置
  const activeItem = historyList.querySelector('.active');
  if (activeItem) {
    activeItem.scrollIntoView({ block: 'nearest' });
  }
}

// 更新撤销重做按钮状态
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) undoBtn.disabled = historyIndex < 0;
  if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

// 记录日志
function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const logs = document.getElementById('logs');
  if (!logs) return;

  const div = document.createElement('div');
  const time = new Date().toLocaleTimeString();

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
  };

  div.innerHTML = `${typeIcons[type]} [${time}] ${message}`;

  // 添加类型样式
  if (type === 'error') div.style.color = '#ef4444';
  else if (type === 'success') div.style.color = '#10b981';

  logs.appendChild(div);
  logs.scrollTop = logs.scrollHeight;

  // 限制日志数量
  while (logs.children.length > 100) {
    logs.removeChild(logs.firstChild);
  }
}

// 辅助函数
function applyMaterialToAllObjects(materialConfig: any) {
  sceneObjects.forEach((objData) => {
    const scene = sceneManager.getScene();
    const object = scene.getObjectByName(objData.name);

    if (object && object.material) {
      const oldMaterial = {
        name: objData.name,
        material: { ...object.material },
      };

      Object.assign(object.material, materialConfig);

      saveHistory('modifyMaterial', {
        name: objData.name,
        oldMaterial,
        newMaterial: materialConfig,
      });
    }
  });
}

function restoreMaterial(data: any) {
  const scene = sceneManager.getScene();
  const object = scene.getObjectByName(data.name);

  if (object && object.material) {
    Object.assign(object.material, data.oldMaterial.material);
  }
}

function applyMaterial(data: any) {
  const scene = sceneManager.getScene();
  const object = scene.getObjectByName(data.name);

  if (object && object.material) {
    Object.assign(object.material, data.newMaterial);
  }
}

function restoreLight(data: any) {
  if (data.type === 'ambient' && ambientLight) {
    ambientLight.intensity = data.oldIntensity;
  } else if (data.type === 'directional' && directionalLight) {
    directionalLight.intensity = data.oldIntensity;
  }
}

function applyLightSettings(data: any) {
  if (data.type === 'ambient' && ambientLight) {
    ambientLight.intensity = data.newIntensity;
  } else if (data.type === 'directional' && directionalLight) {
    directionalLight.intensity = data.newIntensity;
  }
}

// 导出函数
export {
  addCube,
  addCylinder,
  addPlane,
  addPointLight,
  addSphere,
  applyGolden,
  changeBackground,
  changeToStandard,
  changeToWireframe,
  clearHistory,
  clearScene,
  initBasicScene,
  randomColors,
  redo,
  resetCamera,
  toggleAmbient,
  toggleDirectional,
  undo,
};

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 挂载到全局对象
  (window as any).initBasicScene = initBasicScene;
  (window as any).addCube = addCube;
  (window as any).addSphere = addSphere;
  (window as any).addPlane = addPlane;
  (window as any).addCylinder = addCylinder;
  (window as any).changeToStandard = changeToStandard;
  (window as any).changeToWireframe = changeToWireframe;
  (window as any).randomColors = randomColors;
  (window as any).applyGolden = applyGolden;
  (window as any).toggleAmbient = toggleAmbient;
  (window as any).toggleDirectional = toggleDirectional;
  (window as any).addPointLight = addPointLight;
  (window as any).changeBackground = changeBackground;
  (window as any).resetCamera = resetCamera;
  (window as any).clearScene = clearScene;
  (window as any).undo = undo;
  (window as any).redo = redo;
  (window as any).clearHistory = clearHistory;
}
