// TripoScript DSL 材质管理演示 - 真正的DSL声明式语法
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ActionTypes, DSLEngine, DSLRenderer } from '../../src/index.ts';
import { animate, log, setupResize, updateStats } from './utils.ts';

// 全局变量
let engine: DSLEngine;
let renderer: DSLRenderer;
let controls: OrbitControls;
let objectCount = 0;

// ========== DSL 材质预设定义 ==========

// 真正的DSL材质定义 - 声明式数据结构
const dslMaterialPresets = {
  gold: {
    id: 'material_gold',
    name: '黄金材质',
    type: 'standard',
    color: '#FFD700',
    metalness: 1.0,
    roughness: 0.1,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  silver: {
    id: 'material_silver',
    name: '银色材质',
    type: 'standard',
    color: '#C0C0C0',
    metalness: 1.0,
    roughness: 0.05,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  copper: {
    id: 'material_copper',
    name: '铜质材质',
    type: 'standard',
    color: '#B87333',
    metalness: 1.0,
    roughness: 0.2,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  plastic: {
    id: 'material_plastic',
    name: '塑料材质',
    type: 'standard',
    color: '#FF6B6B',
    metalness: 0.0,
    roughness: 0.7,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  glass: {
    id: 'material_glass',
    name: '玻璃材质',
    type: 'standard',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 0.1,
    transparent: true,
  },

  rubber: {
    id: 'material_rubber',
    name: '橡胶材质',
    type: 'standard',
    color: '#2C2C2C',
    metalness: 0.0,
    roughness: 1.0,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  ceramic: {
    id: 'material_ceramic',
    name: '陶瓷材质',
    type: 'standard',
    color: '#F5F5DC',
    metalness: 0.0,
    roughness: 0.2,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
  },

  neon: {
    id: 'material_neon',
    name: '霓虹材质',
    type: 'standard',
    color: '#00FF00',
    metalness: 0.0,
    roughness: 0.1,
    emissive: '#00FF00',
    emissiveIntensity: 0.5,
    opacity: 1.0,
  },
};

// 当前编辑材质状态
let currentMaterialState = {
  id: 'material_current',
  name: '当前材质',
  type: 'standard',
  color: '#ffffff',
  metalness: 0.0,
  roughness: 0.5,
  emissive: '#000000',
  emissiveIntensity: 0.0,
  opacity: 1.0,
  transparent: false,
};

// ========== DSL 几何体定义 ==========

// DSL几何体预设 - 声明式数据结构
const dslGeometryPresets = {
  sphere: {
    type: 'sphere',
    radius: 1,
    radialSegments: 32,
    heightSegments: 16,
  },

  cube: {
    type: 'box',
    size: new Vector3(1, 1, 1),
  },

  plane: {
    type: 'plane',
    size: new Vector3(2, 2, 1),
  },

  cylinder: {
    type: 'cylinder',
    radius: 0.5,
    height: 2,
    radialSegments: 16,
  },
};

// ========== DSL 场景对象定义 ==========

// DSL对象创建函数 - 返回声明式数据结构
function createDSLObject(geometryType: string, materialId: string) {
  const position = new Vector3(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 6,
  );

  const rotation =
    geometryType === 'plane'
      ? new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      : new Vector3(0, 0, 0);

  return {
    name: `${geometryType}_${++objectCount}`,
    type: 'mesh',
    geometry: dslGeometryPresets[geometryType],
    transform: {
      position,
      rotation,
      scale: new Vector3(1, 1, 1),
    },
    material: { id: materialId },
    visible: true,
    castShadow: true,
    receiveShadow: true,
  };
}

// ========== 工具函数 ==========

// 更新历史统计显示
function updateHistoryDisplay(stats: any): void {
  const statsDisplay = document.getElementById('topStats');
  if (!statsDisplay) return;

  statsDisplay.innerHTML = `
    <div class="stat-item">
      <span class="label">Actions:</span>
      <span class="value">${stats.totalActions}</span>
    </div>
    <div class="stat-item">
      <span class="label">当前索引:</span>
      <span class="value">${stats.currentIndex}</span>
    </div>
    <div class="stat-item">
      <span class="label">内存占用:</span>
      <span class="value">~${stats.memoryUsageKB}KB</span>
    </div>
    <div class="stat-item">
      <span class="label">可撤销:</span>
      <span class="value">${stats.canUndo ? '✅' : '❌'}</span>
    </div>
    <div class="stat-item">
      <span class="label">可重做:</span>
      <span class="value">${stats.canRedo ? '✅' : '❌'}</span>
    </div>
    ${
      stats.recentActions.length > 0
        ? `
    <div class="stat-item" style="margin-top: 8px;">
      <span class="label">最近Actions:</span>
      <span class="value"></span>
    </div>
    ${stats.recentActions
      .map(
        (action: any) => `
    <div class="stat-item">
      <span class="label">•</span>
      <span class="value">${action.type}</span>
    </div>
    `,
      )
      .join('')}
    `
        : ''
    }
  `;
}

// 更新UI状态
function updateUIState(): void {
  const canUndo = engine.canUndo();
  const canRedo = engine.canRedo();

  // 更新按钮可用性
  const undoBtn = document.querySelector('[onclick="undo()"]') as HTMLButtonElement;
  const redoBtn = document.querySelector('[onclick="redo()"]') as HTMLButtonElement;

  if (undoBtn) {
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
    undoBtn.title = `撤销${canUndo ? ' (可用)' : ' (不可用)'}`;
  }

  if (redoBtn) {
    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
    redoBtn.title = `重做${canRedo ? ' (可用)' : ' (不可用)'}`;
  }

  // 显示历史统计信息
  const historyStats = engine.getHistoryStats();
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

// 更新参数显示值
function updateParameterDisplay(paramName: string, value: string | number): void {
  const displayElement = document.getElementById(`${paramName}Value`);
  if (displayElement) {
    if (typeof value === 'number') {
      displayElement.textContent = value.toFixed(2);
    } else {
      displayElement.textContent = value;
    }
  }
}

// 更新输入控件值
function updateInputControl(paramName: string, value: string | number): void {
  const inputElement = document.getElementById(`${paramName}Input`) as HTMLInputElement;
  if (inputElement) {
    inputElement.value = value.toString();
  }
}

// 更新所有控件
function updateAllControls(): void {
  updateInputControl('baseColor', currentMaterialState.color);
  updateInputControl('metalness', currentMaterialState.metalness);
  updateInputControl('roughness', currentMaterialState.roughness);
  updateInputControl('emissive', currentMaterialState.emissive);
  updateInputControl('emissiveIntensity', currentMaterialState.emissiveIntensity);
  updateInputControl('opacity', currentMaterialState.opacity);

  updateParameterDisplay('baseColor', currentMaterialState.color);
  updateParameterDisplay('metalness', currentMaterialState.metalness);
  updateParameterDisplay('roughness', currentMaterialState.roughness);
  updateParameterDisplay('emissive', currentMaterialState.emissive);
  updateParameterDisplay('emissiveIntensity', currentMaterialState.emissiveIntensity);
  updateParameterDisplay('opacity', currentMaterialState.opacity);
}

// 初始化材质预设显示
function initializeMaterialPresets(): void {
  const presetsContainer = document.getElementById('materialPresets');
  if (!presetsContainer) return;

  presetsContainer.innerHTML = '';

  Object.entries(dslMaterialPresets).forEach(([key, preset]) => {
    const presetCard = document.createElement('div');
    presetCard.className = 'preset-card';
    presetCard.onclick = () => loadMaterialPreset(key);

    // 创建预览色块
    const previewDiv = document.createElement('div');
    previewDiv.className = 'preset-preview';
    previewDiv.style.backgroundColor = preset.color;

    // 添加金属质感效果
    if (preset.metalness > 0.5) {
      previewDiv.style.background = `linear-gradient(45deg, ${preset.color}, #ffffff20)`;
    }

    const nameDiv = document.createElement('div');
    nameDiv.className = 'preset-name';
    nameDiv.textContent = preset.name;

    presetCard.appendChild(previewDiv);
    presetCard.appendChild(nameDiv);
    presetsContainer.appendChild(presetCard);
  });
}

// ========== DSL Action 操作 ==========

// 从引擎同步当前材质参数
function syncCurrentMaterialFromEngine(): void {
  const scene = engine.getScene();
  const material = scene.materials.find((m) => m.id === currentMaterialState.id);

  if (material) {
    // ✅ 修复：保持当前材质ID和名称不变，只同步属性值
    const originalId = currentMaterialState.id;
    const originalName = currentMaterialState.name;
    currentMaterialState = {
      ...material,
      id: originalId, // 保持原有ID
      name: originalName, // 保持原有名称
    };
    updateAllControls();
    log('🔄 材质参数已同步');
  }
}

// 撤销操作 - 使用DSL Action
function undoOperation(): void {
  const success = engine.undo();
  if (success) {
    log('↶ 撤销操作成功');
    syncCurrentMaterialFromEngine();
  } else {
    log('⚠️ 没有可撤销的操作');
  }
  updateUIState();
}

// 重做操作 - 使用DSL Action
function redoOperation(): void {
  const success = engine.redo();
  if (success) {
    log('↷ 重做操作成功');
    syncCurrentMaterialFromEngine();
  } else {
    log('⚠️ 没有可重做的操作');
  }
  updateUIState();
}

// ========== DSL 对象创建 Actions ==========

// 添加球体 - 使用DSL声明式Action
function addSphereOperation(): void {
  const sphereObject = createDSLObject('sphere', currentMaterialState.id);

  // 通过DSL Action派发对象创建
  engine.dispatch({
    type: ActionTypes.ADD_OBJECT,
    payload: sphereObject,
  });

  log(`🔮 添加材质球: ${sphereObject.name}`);
}

// 添加立方体 - 使用DSL声明式Action
function addCubeOperation(): void {
  const cubeObject = createDSLObject('cube', currentMaterialState.id);

  // 通过DSL Action派发对象创建
  engine.dispatch({
    type: ActionTypes.ADD_OBJECT,
    payload: cubeObject,
  });

  log(`📦 添加立方体: ${cubeObject.name}`);
}

// 添加平面 - 使用DSL声明式Action
function addPlaneOperation(): void {
  const planeObject = createDSLObject('plane', currentMaterialState.id);

  // 通过DSL Action派发对象创建
  engine.dispatch({
    type: ActionTypes.ADD_OBJECT,
    payload: planeObject,
  });

  log(`📄 添加平面: ${planeObject.name}`);
}

// 添加圆柱 - 使用DSL声明式Action
function addCylinderOperation(): void {
  const cylinderObject = createDSLObject('cylinder', currentMaterialState.id);

  // 通过DSL Action派发对象创建
  engine.dispatch({
    type: ActionTypes.ADD_OBJECT,
    payload: cylinderObject,
  });

  log(`🏛️ 添加圆柱: ${cylinderObject.name}`);
}

// ========== DSL 材质操作 Actions ==========

// 更新基础颜色 - 使用DSL Action
function updateBaseColorOperation(color: string): void {
  currentMaterialState.color = color;
  updateParameterDisplay('baseColor', color);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: { color: color },
    },
  });

  log(`🎨 基础颜色更新为: ${color}`);
}

// 更新金属度 - 使用DSL Action
function updateMetalnessOperation(value: string): void {
  const metalness = parseFloat(value);
  currentMaterialState.metalness = metalness;
  updateParameterDisplay('metalness', metalness);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: { metalness: metalness },
    },
  });

  log(`⚡ 金属度更新为: ${metalness.toFixed(2)}`);
}

// 更新粗糙度 - 使用DSL Action
function updateRoughnessOperation(value: string): void {
  const roughness = parseFloat(value);
  currentMaterialState.roughness = roughness;
  updateParameterDisplay('roughness', roughness);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: { roughness: roughness },
    },
  });

  log(`🪨 粗糙度更新为: ${roughness.toFixed(2)}`);
}

// 更新发光颜色 - 使用DSL Action
function updateEmissiveOperation(color: string): void {
  currentMaterialState.emissive = color;
  updateParameterDisplay('emissive', color);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: { emissive: color },
    },
  });

  log(`💡 发光颜色更新为: ${color}`);
}

// 更新发光强度 - 使用DSL Action
function updateEmissiveIntensityOperation(value: string): void {
  const intensity = parseFloat(value);
  currentMaterialState.emissiveIntensity = intensity;
  updateParameterDisplay('emissiveIntensity', intensity);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: { emissiveIntensity: intensity },
    },
  });

  log(`🌟 发光强度更新为: ${intensity.toFixed(2)}`);
}

// 更新透明度 - 使用DSL Action
function updateOpacityOperation(value: string): void {
  const opacity = parseFloat(value);
  currentMaterialState.opacity = opacity;
  currentMaterialState.transparent = opacity < 1.0;
  updateParameterDisplay('opacity', opacity);

  // 通过DSL Action更新材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: currentMaterialState.id,
      changes: {
        opacity: opacity,
        transparent: opacity < 1.0,
      },
    },
  });

  log(`👻 透明度更新为: ${opacity.toFixed(2)}`);
}

// 更新清漆 - 使用DSL Action
function updateClearcoatOperation(value: string): void {
  const clearcoat = parseFloat(value);
  updateParameterDisplay('clearcoat', clearcoat);
  log(`✨ 清漆更新为: ${clearcoat.toFixed(2)} (注意: Three.js标准材质暂不支持)`);
}

// 更新清漆粗糙度 - 使用DSL Action
function updateClearcoatRoughnessOperation(value: string): void {
  const clearcoatRoughness = parseFloat(value);
  updateParameterDisplay('clearcoatRoughness', clearcoatRoughness);
  log(`🔧 清漆粗糙度更新为: ${clearcoatRoughness.toFixed(2)} (注意: Three.js标准材质暂不支持)`);
}

// 更新透射 - 使用DSL Action
function updateTransmissionOperation(value: string): void {
  const transmission = parseFloat(value);
  updateParameterDisplay('transmission', transmission);
  log(`🌊 透射更新为: ${transmission.toFixed(2)} (注意: Three.js标准材质暂不支持)`);
}

// 更新折射率 - 使用DSL Action
function updateIOROperation(value: string): void {
  const ior = parseFloat(value);
  updateParameterDisplay('ior', ior);
  log(`💎 折射率更新为: ${ior.toFixed(2)} (注意: Three.js标准材质暂不支持)`);
}

// ========== DSL 材质预设操作 ==========

// 加载材质预设 - 使用DSL Action
function loadMaterialPresetOperation(presetKey: string): void {
  const preset = dslMaterialPresets[presetKey];
  if (!preset) {
    log('❌ 找不到指定的材质预设');
    return;
  }

  // ✅ 修复：保持当前材质ID不变，只复制预设的属性值
  const originalId = currentMaterialState.id;
  currentMaterialState = {
    ...preset,
    id: originalId, // 保持原有ID
    name: '当前材质', // 保持当前材质名称
  };

  // 通过DSL Action更新材质（使用固定的当前材质ID）
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: originalId, // 使用固定的当前材质ID
      changes: {
        ...preset,
        id: originalId, // 确保changes中的ID也是正确的
        name: '当前材质',
      },
    },
  });

  // 更新UI控件
  updateAllControls();

  // 更新预设卡片状态
  const presetCards = document.querySelectorAll('.preset-card');
  const presetKeys = Object.keys(dslMaterialPresets);
  presetCards.forEach((card, index) => {
    if (presetKeys[index] === presetKey) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  log(`✨ 加载材质预设: ${preset.name} -> 当前材质`);
}

// 应用材质到选中对象 - 使用DSL Action
function applyToSelectedOperation(): void {
  const scene = engine.getScene();
  const selectedIds = scene.selection;

  if (selectedIds.length === 0) {
    log('⚠️ 没有选中的对象');
    return;
  }

  // 通过DSL Action应用材质
  engine.dispatch({
    type: ActionTypes.APPLY_MATERIAL,
    payload: {
      objectIds: selectedIds,
      materialId: currentMaterialState.id,
    },
  });

  log(`🎯 材质已应用到 ${selectedIds.length} 个选中对象`);
}

// 应用材质到所有对象 - 使用DSL Action
function applyToAllOperation(): void {
  const scene = engine.getScene();
  const objectIds = scene.objects.map((obj) => obj.id);

  if (objectIds.length === 0) {
    log('⚠️ 场景中没有对象');
    return;
  }

  // 通过DSL Action应用材质
  engine.dispatch({
    type: ActionTypes.APPLY_MATERIAL,
    payload: {
      objectIds: objectIds,
      materialId: currentMaterialState.id,
    },
  });

  log(`🌐 材质已应用到所有 ${objectIds.length} 个对象`);
}

// 保存当前材质 - 使用DSL Action
function saveMaterialOperation(): void {
  const materialName = `自定义材质_${Date.now()}`;
  const materialData = {
    ...currentMaterialState,
    id: `material_custom_${Date.now()}`,
    name: materialName,
  };

  // 通过DSL Action添加新材质
  engine.dispatch({
    type: ActionTypes.ADD_MATERIAL,
    payload: materialData,
  });

  log(`💾 材质已保存: ${materialName} (ID: ${materialData.id})`);
}

// 重置材质参数 - 使用DSL Action
function resetMaterialOperation(): void {
  // ✅ 明确保存原有ID，确保一致性
  const originalId = currentMaterialState.id;
  const defaultMaterial = {
    id: originalId,
    name: '当前材质',
    type: 'standard',
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0.0,
    opacity: 1.0,
    transparent: false,
  };

  currentMaterialState = defaultMaterial;

  // 通过DSL Action重置材质
  engine.dispatch({
    type: ActionTypes.UPDATE_MATERIAL,
    payload: {
      id: originalId, // 使用明确保存的ID
      changes: defaultMaterial,
    },
  });

  updateAllControls();

  // 清除预设选择
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach((card) => card.classList.remove('active'));

  log('🔄 材质参数已重置为默认值');
}

// ========== DSL 场景管理 Actions ==========

// 清空场景 - 使用DSL Action
function clearSceneOperation(): void {
  const scene = engine.getScene();

  // 通过DSL Action删除所有对象
  scene.objects.forEach((obj) => {
    engine.dispatch({
      type: ActionTypes.REMOVE_OBJECT,
      payload: { id: obj.id },
    });
  });

  objectCount = 0;
  log('🗑️ 场景已清空');
}

// 重置相机 - 使用DSL Action
function resetCameraOperation(): void {
  const cameraData = {
    position: new Vector3(5, 5, 5),
    target: new Vector3(0, 0, 0),
  };

  // 通过DSL Action更新相机
  engine.dispatch({
    type: ActionTypes.UPDATE_CAMERA,
    payload: cameraData,
  });

  // 同时重置轨道控制器
  controls.reset();

  log('📷 相机已重置');
}

// 清空历史
function clearHistoryOperation(): void {
  log('⚠️ 历史清空功能需要引擎支持，当前版本暂不支持');
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
    engine.subscribe((scene) => {
      updateStats(scene);
      updateUIState();
    });

    // 启动渲染循环
    animate(controls);

    // 设置窗口大小调整
    setupResize(renderer);

    // 初始化当前材质 - 通过DSL Action
    engine.dispatch({
      type: ActionTypes.ADD_MATERIAL,
      payload: currentMaterialState,
    });

    // 初始化UI状态
    updateUIState();

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    // 初始化材质预设
    initializeMaterialPresets();

    log('✅ DSL材质管理引擎初始化完成');
    log('🎨 渲染器创建成功');
    log('🎮 轨道控制器已启用');
    log('⌨️ 快捷键: Ctrl+Z(撤销) / Ctrl+Y(重做)');
    log('🎛️ DSL声明式材质参数系统已启动');
    log('📜 使用Action模式进行状态管理');
  } catch (error) {
    console.error('初始化失败:', error);
    log('❌ 初始化失败: ' + error);
  }
}

// ========== 全局函数暴露 ==========

// 暴露到全局作用域供HTML调用
function exposeGlobalFunctions(): void {
  (window as any).undo = undoOperation;
  (window as any).redo = redoOperation;
  (window as any).clearHistory = clearHistoryOperation;

  // 对象创建
  (window as any).addSphere = addSphereOperation;
  (window as any).addCube = addCubeOperation;
  (window as any).addPlane = addPlaneOperation;
  (window as any).addCylinder = addCylinderOperation;

  // PBR参数调整
  (window as any).updateBaseColor = updateBaseColorOperation;
  (window as any).updateMetalness = updateMetalnessOperation;
  (window as any).updateRoughness = updateRoughnessOperation;
  (window as any).updateEmissive = updateEmissiveOperation;
  (window as any).updateEmissiveIntensity = updateEmissiveIntensityOperation;
  (window as any).updateOpacity = updateOpacityOperation;
  (window as any).updateClearcoat = updateClearcoatOperation;
  (window as any).updateClearcoatRoughness = updateClearcoatRoughnessOperation;
  (window as any).updateTransmission = updateTransmissionOperation;
  (window as any).updateIOR = updateIOROperation;

  // 材质预设和快速操作
  (window as any).loadMaterialPreset = loadMaterialPresetOperation;
  (window as any).applyToSelected = applyToSelectedOperation;
  (window as any).applyToAll = applyToAllOperation;
  (window as any).saveMaterial = saveMaterialOperation;
  (window as any).resetMaterial = resetMaterialOperation;

  // 场景管理
  (window as any).clearScene = clearSceneOperation;
  (window as any).resetCamera = resetCameraOperation;

  console.log('🔧 DSL材质管理全局函数已暴露到 window 对象');
}

// 立即执行函数暴露
exposeGlobalFunctions();

// 启动应用
document.addEventListener('DOMContentLoaded', init);
