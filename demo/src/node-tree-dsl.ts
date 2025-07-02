import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LoadResult } from '../../src/engine/loader';
import { modelLoader } from '../../src/engine/loader';

// 节点树状态接口
interface TreeNode {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'light' | 'camera';
  object3D: THREE.Object3D;
  parent?: TreeNode;
  children: TreeNode[];
  expanded: boolean;
  visible: boolean;
  selected: boolean;
}

// 历史记录接口
interface HistoryState {
  timestamp: number;
  description: string;
  objects: Array<{
    id: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    visible: boolean;
    parent?: string;
  }>;
}

// 全局状态
class NodeTreeManager {
  // Three.js 核心组件
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;

  // 节点树管理
  rootNode!: TreeNode;
  selectedNode: TreeNode | null = null;
  nodeMap: Map<string, TreeNode> = new Map();

  // 拖拽状态
  draggedNode: TreeNode | null = null;
  dropTarget: TreeNode | null = null;
  dragPlaceholder: HTMLElement | null = null;

  // 历史记录
  history: HistoryState[] = [];
  historyIndex: number = -1;
  maxHistorySize: number = 50;

  // UI元素
  canvas!: HTMLCanvasElement;
  nodeTreeElement!: HTMLElement;
  logElement!: HTMLElement;
  statsElement!: HTMLElement;

  // 预设模型列表
  presetModels = [
    { name: '玩具车 (推荐)', path: './assets/glb/ToyCar.glb' },
    { name: '猴头雕塑', path: './assets/glb/Suzanne.glb' },
    { name: '太空人', path: './assets/glb/CesiumMan.glb' },
    { name: '音响设备', path: './assets/glb/BoomBox.glb' },
  ];

  constructor() {
    this.initializeUI();
    this.initializeScene();
    this.initializeControls();
    this.initializePresetModels();
    this.createDefaultScene();
    this.bindEvents();
    this.setupDragStyles();
    this.startRenderLoop();

    this.log('节点树管理器初始化完成');
    this.updateStats();
  }

  private initializeUI() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.nodeTreeElement = document.getElementById('nodeTree') as HTMLElement;
    this.logElement = document.getElementById('logContent') as HTMLElement;
    this.statsElement = document.getElementById('topStats') as HTMLElement;

    if (!this.canvas || !this.nodeTreeElement || !this.logElement || !this.statsElement) {
      throw new Error('无法找到必需的UI元素');
    }
  }

  private initializeScene() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(5, 5, 5);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 添加地面
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    plane.name = '地面';
    this.scene.add(plane);
  }

  private initializeControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);
  }

  private initializePresetModels() {
    const selectElement = document.getElementById('presetModelSelect') as HTMLSelectElement;
    if (selectElement) {
      this.presetModels.forEach((model, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = model.name;
        selectElement.appendChild(option);
      });
    }
  }

  private createDefaultScene() {
    // 初始化根节点
    this.rootNode = {
      id: 'root',
      name: '场景根节点',
      type: 'group',
      object3D: this.scene,
      children: [],
      expanded: true,
      visible: true,
      selected: false,
    };

    this.nodeMap.set('root', this.rootNode);
    this.buildNodeTree();
    this.saveState('初始化场景');
  }

  private buildNodeTree() {
    // 清空现有节点映射
    this.nodeMap.clear();
    this.nodeMap.set('root', this.rootNode);

    // 重新构建节点树
    this.rootNode.children = [];
    this.buildNodeTreeRecursive(this.scene, this.rootNode);
    this.renderNodeTree();
  }

  private buildNodeTreeRecursive(object3D: THREE.Object3D, parentNode: TreeNode) {
    object3D.children.forEach((child) => {
      const nodeType = this.getNodeType(child);
      const node: TreeNode = {
        id: child.uuid,
        name: child.name || `未命名${nodeType}`,
        type: nodeType,
        object3D: child,
        parent: parentNode,
        children: [],
        expanded: false,
        visible: child.visible,
        selected: false,
      };

      parentNode.children.push(node);
      this.nodeMap.set(child.uuid, node);

      // 递归构建子节点
      if (child.children.length > 0) {
        this.buildNodeTreeRecursive(child, node);
      }
    });
  }

  private getNodeType(object3D: THREE.Object3D): 'mesh' | 'group' | 'light' | 'camera' {
    if (object3D instanceof THREE.Mesh) return 'mesh';
    if (object3D instanceof THREE.Light) return 'light';
    if (object3D instanceof THREE.Camera) return 'camera';
    return 'group';
  }

  private renderNodeTree() {
    this.nodeTreeElement.innerHTML = '';
    this.renderNodeTreeRecursive(this.rootNode, 0);
    this.updateStats();
  }

  private renderNodeTreeRecursive(node: TreeNode, depth: number) {
    const nodeElement = document.createElement('div');
    nodeElement.className = `tree-node ${node.selected ? 'selected' : ''}`;
    nodeElement.style.paddingLeft = `${depth * 16 + 8}px`;
    nodeElement.setAttribute('data-node-id', node.id);

    // 只有非根节点才能被拖拽
    if (node.id !== 'root') {
      nodeElement.draggable = true;
      nodeElement.style.cursor = 'move';
    }

    const icon = this.getNodeIcon(node);
    const visibilityIcon = node.visible ? '👁️' : '🙈';
    const expandIcon = node.children.length > 0 ? (node.expanded ? '📂' : '📁') : '📄';
    const dragHandle = node.id !== 'root' ? '⋮⋮' : '';

    nodeElement.innerHTML = `
      <span class="drag-handle" style="cursor: grab; margin-right: 4px; color: #999; user-select: none;">${dragHandle}</span>
      <span class="expand-icon" style="cursor: pointer; margin-right: 4px;">${expandIcon}</span>
      <span class="node-icon" style="margin-right: 4px;">${icon}</span>
      <span class="node-name" style="flex: 1; user-select: none;">${node.name}</span>
      <span class="visibility-icon" style="cursor: pointer; margin-left: 4px;">${visibilityIcon}</span>
    `;

    // 节点点击事件
    nodeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectNode(node);
    });

    // 展开/折叠事件
    const expandElement = nodeElement.querySelector('.expand-icon');
    expandElement?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNodeExpansion(node);
    });

    // 显隐切换事件
    const visibilityElement = nodeElement.querySelector('.visibility-icon');
    visibilityElement?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNodeVisibility(node);
    });

    // 拖拽事件
    if (node.id !== 'root') {
      this.setupDragEvents(nodeElement, node);
    }

    // 为所有节点设置拖拽目标事件（可以接收拖拽）
    this.setupDropEvents(nodeElement, node);

    this.nodeTreeElement.appendChild(nodeElement);

    // 递归渲染子节点
    if (node.expanded && node.children.length > 0) {
      node.children.forEach((child) => {
        this.renderNodeTreeRecursive(child, depth + 1);
      });
    }
  }

  private getNodeIcon(node: TreeNode): string {
    switch (node.type) {
      case 'mesh':
        return '🔷';
      case 'group':
        return '📦';
      case 'light':
        return '💡';
      case 'camera':
        return '📷';
      default:
        return '❓';
    }
  }

  private selectNode(node: TreeNode) {
    // 取消之前的选择
    if (this.selectedNode) {
      this.selectedNode.selected = false;
    }

    // 选择新节点
    this.selectedNode = node;
    node.selected = true;

    this.renderNodeTree();
    this.updateTransformInputs();
    this.log(`选择节点: ${node.name}`);
  }

  private toggleNodeExpansion(node: TreeNode) {
    node.expanded = !node.expanded;
    this.renderNodeTree();
  }

  toggleNodeVisibility(node: TreeNode) {
    node.visible = !node.visible;
    node.object3D.visible = node.visible;
    this.renderNodeTree();
    this.saveState(`切换节点显隐: ${node.name}`);
    this.log(`${node.visible ? '显示' : '隐藏'}节点: ${node.name}`);
  }

  private updateTransformInputs() {
    if (!this.selectedNode) return;

    const obj = this.selectedNode.object3D;

    // 更新位置输入框
    (document.getElementById('posX') as HTMLInputElement).value = obj.position.x.toFixed(2);
    (document.getElementById('posY') as HTMLInputElement).value = obj.position.y.toFixed(2);
    (document.getElementById('posZ') as HTMLInputElement).value = obj.position.z.toFixed(2);

    // 更新旋转输入框（转换为度数）
    (document.getElementById('rotX') as HTMLInputElement).value = THREE.MathUtils.radToDeg(
      obj.rotation.x,
    ).toFixed(2);
    (document.getElementById('rotY') as HTMLInputElement).value = THREE.MathUtils.radToDeg(
      obj.rotation.y,
    ).toFixed(2);
    (document.getElementById('rotZ') as HTMLInputElement).value = THREE.MathUtils.radToDeg(
      obj.rotation.z,
    ).toFixed(2);

    // 更新缩放输入框
    (document.getElementById('scaleX') as HTMLInputElement).value = obj.scale.x.toFixed(2);
    (document.getElementById('scaleY') as HTMLInputElement).value = obj.scale.y.toFixed(2);
    (document.getElementById('scaleZ') as HTMLInputElement).value = obj.scale.z.toFixed(2);
  }

  // 历史记录管理
  private saveState(description: string) {
    // 删除当前位置之后的历史记录
    this.history = this.history.slice(0, this.historyIndex + 1);

    const state: HistoryState = {
      timestamp: Date.now(),
      description,
      objects: Array.from(this.nodeMap.values()).map((node) => ({
        id: node.id,
        position: node.object3D.position.clone(),
        rotation: node.object3D.rotation.clone(),
        scale: node.object3D.scale.clone(),
        visible: node.object3D.visible,
        parent: node.parent?.id,
      })),
    };

    this.history.push(state);
    this.historyIndex = this.history.length - 1;

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }

    this.updateUndoRedoButtons();
  }

  private updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

    if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }

  private updateStats() {
    const meshCount = Array.from(this.nodeMap.values()).filter(
      (node) => node.type === 'mesh',
    ).length;
    const lightCount = Array.from(this.nodeMap.values()).filter(
      (node) => node.type === 'light',
    ).length;
    const totalNodes = this.nodeMap.size;

    this.statsElement.innerHTML = `
      <div class="stat-item">
        <span class="label">总节点数:</span>
        <span class="value">${totalNodes}</span>
      </div>
      <div class="stat-item">
        <span class="label">网格节点:</span>
        <span class="value">${meshCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">光源节点:</span>
        <span class="value">${lightCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">历史记录:</span>
        <span class="value">${this.history.length}</span>
      </div>
    `;
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timestamp}] ${message}`;

    this.logElement.appendChild(logEntry);
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  private bindEvents() {
    // 窗口调整大小
    window.addEventListener('resize', () => {
      this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // ESC键取消拖拽
      if (e.key === 'Escape' && this.draggedNode) {
        this.cancelDrag();
      }
    });
  }

  private cancelDrag() {
    if (this.draggedNode) {
      this.clearDropHighlights();
      this.removeDragPlaceholder();
      this.draggedNode = null;
      this.dropTarget = null;
      this.log('拖拽操作已取消');
    }
  }

  private setupDragStyles() {
    // 添加拖拽相关的CSS样式
    const style = document.createElement('style');
    style.textContent = `
      .tree-node[draggable="true"]:hover {
        background-color: rgba(0, 123, 255, 0.05) !important;
      }
      
      .tree-node.dragging {
        opacity: 0.5 !important;
        background: rgba(0, 123, 255, 0.1) !important;
      }
      
      .tree-node.drop-target {
        background: rgba(0, 123, 255, 0.2) !important;
        border-left: 3px solid #007bff !important;
      }
      
      .tree-node.drop-invalid {
        background: rgba(220, 53, 69, 0.1) !important;
        border-left: 3px solid #dc3545 !important;
      }
      
      .drag-placeholder {
        height: 2px;
        background: #007bff;
        border-radius: 1px;
        margin: 2px 0;
        opacity: 0.8;
      }
      
      .drag-handle:hover {
        color: #007bff !important;
        cursor: grab !important;
      }
      
      .drag-handle:active {
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(style);

    this.log('拖拽样式已设置');
  }

  private startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // 公共API方法
  async loadSelectedPresetModel() {
    const selectElement = document.getElementById('presetModelSelect') as HTMLSelectElement;
    const selectedIndex = parseInt(selectElement.value);

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= this.presetModels.length) {
      this.log('请选择一个预设模型');
      return;
    }

    const model = this.presetModels[selectedIndex];
    this.log(`正在加载模型: ${model.name}...`);

    try {
      const loadResult = await modelLoader.load(model.path, {
        scale: 1,
        center: true,
        extractMaterials: true,
        extractLights: true,
      });

      this.addLoadedModel(loadResult, model.name);
      this.log(`模型加载成功: ${model.name}`);
    } catch (error) {
      this.log(`模型加载失败: ${error}`);
    }
  }

  async loadModelFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.log(`正在加载文件: ${file.name}...`);

    try {
      const url = URL.createObjectURL(file);
      const loadResult = await modelLoader.load(url, {
        scale: 1,
        center: true,
        extractMaterials: true,
        extractLights: true,
      });

      this.addLoadedModel(loadResult, file.name);
      this.log(`文件加载成功: ${file.name}`);
      URL.revokeObjectURL(url);
    } catch (error) {
      this.log(`文件加载失败: ${error}`);
    }
  }

  loadSampleModel(type: 'cube' | 'sphere') {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        material = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `示例${type === 'cube' ? '立方体' : '球体'}`;
    mesh.position.set(Math.random() * 4 - 2, 1, Math.random() * 4 - 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);
    this.buildNodeTree();
    this.saveState(`添加${mesh.name}`);
    this.log(`添加${mesh.name}`);
  }

  private addLoadedModel(loadResult: LoadResult, modelName: string) {
    // 创建一个组来包含加载的模型
    const group = new THREE.Group();
    group.name = modelName;

    // 从加载结果重建对象
    loadResult.objects.forEach((obj) => {
      if (obj.type === 'mesh' && obj.geometry) {
        let geometry: THREE.BufferGeometry;

        // 根据几何体类型创建对应的几何体
        const geometryType = (obj.geometry as any).type || 'box';
        switch (geometryType) {
          case 'box': {
            const boxSize =
              ((obj.geometry as any).size as THREE.Vector3) || new THREE.Vector3(1, 1, 1);
            geometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
            break;
          }
          case 'sphere': {
            const sphereSize = ((obj.geometry as any).size as number) || 1;
            geometry = new THREE.SphereGeometry(sphereSize, 32, 32);
            break;
          }
          case 'plane': {
            const planeSize =
              ((obj.geometry as any).size as THREE.Vector3) || new THREE.Vector3(1, 1, 1);
            geometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y);
            break;
          }
          default: {
            // 对于复杂几何体，创建一个占位符
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
          }
        }

        // 创建材质
        const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.2,
          roughness: 0.8,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = obj.name;
        const position = obj.transform?.position
          ? new THREE.Vector3(
              obj.transform.position.x,
              obj.transform.position.y,
              obj.transform.position.z,
            )
          : new THREE.Vector3(0, 0, 0);
        const rotation = obj.transform?.rotation
          ? new THREE.Vector3(
              obj.transform.rotation.x,
              obj.transform.rotation.y,
              obj.transform.rotation.z,
            )
          : new THREE.Vector3(0, 0, 0);
        const scale = obj.transform?.scale
          ? new THREE.Vector3(obj.transform.scale.x, obj.transform.scale.y, obj.transform.scale.z)
          : new THREE.Vector3(1, 1, 1);

        mesh.position.copy(position);
        mesh.rotation.setFromVector3(rotation);
        mesh.scale.copy(scale);
        mesh.visible = obj.visible !== false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        group.add(mesh);
      }
    });

    this.scene.add(group);
    this.buildNodeTree();
    this.saveState(`加载模型: ${modelName}`);
  }

  updateTransform(type: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: string) {
    if (!this.selectedNode) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const obj = this.selectedNode.object3D;

    switch (type) {
      case 'position':
        obj.position[axis] = numValue;
        break;
      case 'rotation':
        obj.rotation[axis] = THREE.MathUtils.degToRad(numValue);
        break;
      case 'scale':
        obj.scale[axis] = numValue;
        break;
    }

    this.saveState(`修改${this.selectedNode.name}的${type}`);
    this.log(`修改${this.selectedNode.name}的${type}.${axis} = ${numValue}`);
  }

  duplicateSelectedNode() {
    if (!this.selectedNode || this.selectedNode.id === 'root') {
      this.log('请选择一个有效的节点进行复制');
      return;
    }

    const original = this.selectedNode.object3D;
    const cloned = original.clone();
    cloned.name = `${original.name}_副本`;
    cloned.position.x += 2; // 偏移复制的对象

    if (this.selectedNode.parent) {
      this.selectedNode.parent.object3D.add(cloned);
    } else {
      this.scene.add(cloned);
    }

    this.buildNodeTree();
    this.saveState(`复制节点: ${original.name}`);
    this.log(`复制节点: ${original.name}`);
  }

  deleteSelectedNode() {
    if (!this.selectedNode || this.selectedNode.id === 'root') {
      this.log('无法删除根节点或未选择节点');
      return;
    }

    const nodeName = this.selectedNode.name;
    this.selectedNode.object3D.parent?.remove(this.selectedNode.object3D);

    this.selectedNode = null;
    this.buildNodeTree();
    this.saveState(`删除节点: ${nodeName}`);
    this.log(`删除节点: ${nodeName}`);
  }

  resetNodeTransform() {
    if (!this.selectedNode || this.selectedNode.id === 'root') return;

    const obj = this.selectedNode.object3D;
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);

    this.updateTransformInputs();
    this.saveState(`重置${this.selectedNode.name}的Transform`);
    this.log(`重置${this.selectedNode.name}的Transform`);
  }

  expandAll() {
    this.setAllExpanded(true);
    this.renderNodeTree();
    this.log('展开所有节点');
  }

  collapseAll() {
    this.setAllExpanded(false);
    this.renderNodeTree();
    this.log('折叠所有节点');
  }

  private setAllExpanded(expanded: boolean) {
    const setExpanded = (node: TreeNode) => {
      node.expanded = expanded;
      node.children.forEach(setExpanded);
    };
    setExpanded(this.rootNode);
  }

  // ========== 拖拽功能实现 ==========

  private setupDragEvents(element: HTMLElement, node: TreeNode) {
    element.addEventListener('dragstart', (e) => {
      this.onDragStart(e, node);
    });

    element.addEventListener('dragend', (e) => {
      this.onDragEnd(e);
    });
  }

  private setupDropEvents(element: HTMLElement, node: TreeNode) {
    element.addEventListener('dragover', (e) => {
      this.onDragOver(e, node);
    });

    element.addEventListener('dragenter', (e) => {
      this.onDragEnter(e, node);
    });

    element.addEventListener('dragleave', (e) => {
      this.onDragLeave(e);
    });

    element.addEventListener('drop', (e) => {
      this.onDrop(e, node);
    });
  }

  private onDragStart(e: DragEvent, node: TreeNode) {
    this.draggedNode = node;

    // 设置拖拽数据
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    }

    // 添加拖拽样式
    const element = e.target as HTMLElement;
    element.classList.add('dragging');

    // 创建拖拽占位符
    this.createDragPlaceholder();

    this.log(`开始拖拽节点: ${node.name}`);
  }

  private onDragEnd(e: DragEvent) {
    // 恢复样式
    const element = e.target as HTMLElement;
    element.classList.remove('dragging');

    // 清理状态
    this.draggedNode = null;
    this.dropTarget = null;
    this.removeDragPlaceholder();
    this.clearDropHighlights();

    this.log('拖拽操作结束');
  }

  private onDragOver(e: DragEvent, node: TreeNode) {
    e.preventDefault();

    if (!this.draggedNode || this.draggedNode === node) return;

    // 检查是否可以放置
    if (this.canDropOn(this.draggedNode, node)) {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    } else {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }

  private onDragEnter(e: DragEvent, node: TreeNode) {
    e.preventDefault();

    if (!this.draggedNode || this.draggedNode === node) return;

    // 清除之前的高亮
    this.clearDropHighlights();

    const element = e.target as HTMLElement;

    // 检查是否可以放置
    if (this.canDropOn(this.draggedNode, node)) {
      this.dropTarget = node;
      this.highlightDropTarget(element);
    } else {
      // 显示无效放置的反馈
      element.classList.add('drop-invalid');
    }
  }

  private onDragLeave(e: DragEvent /* , node: TreeNode */) {
    // 检查是否真的离开了目标区域
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.clearDropHighlights();
      this.dropTarget = null;
    }
  }

  private onDrop(e: DragEvent, targetNode: TreeNode) {
    e.preventDefault();

    if (!this.draggedNode || !this.dropTarget || this.draggedNode === targetNode) {
      return;
    }

    // 检查是否可以放置
    if (!this.canDropOn(this.draggedNode, targetNode)) {
      this.log(`无法将 ${this.draggedNode.name} 移动到 ${targetNode.name}`);
      return;
    }

    // 执行节点移动
    this.moveNodeTo(this.draggedNode, targetNode);

    // 清理状态
    this.clearDropHighlights();
    this.removeDragPlaceholder();
  }

  private canDropOn(sourceNode: TreeNode, targetNode: TreeNode): boolean {
    // 不能拖拽到自己
    if (sourceNode === targetNode) return false;

    // 不能拖拽到自己的子节点（避免循环）
    if (this.isChildOf(targetNode, sourceNode)) return false;

    // 根节点不能被移动
    if (sourceNode.id === 'root') return false;

    return true;
  }

  private isChildOf(node: TreeNode, potentialParent: TreeNode): boolean {
    let current = node.parent;
    while (current) {
      if (current === potentialParent) return true;
      current = current.parent;
    }
    return false;
  }

  private moveNodeTo(sourceNode: TreeNode, targetNode: TreeNode) {
    const oldParentName = sourceNode.parent?.name || '根节点';

    // 从原父节点移除
    if (sourceNode.parent) {
      const index = sourceNode.parent.children.indexOf(sourceNode);
      if (index > -1) {
        sourceNode.parent.children.splice(index, 1);
      }
    }

    // 从Three.js场景图中移除
    sourceNode.object3D.parent?.remove(sourceNode.object3D);

    // 添加到新父节点
    targetNode.children.push(sourceNode);
    sourceNode.parent = targetNode;

    // 添加到Three.js场景图
    targetNode.object3D.add(sourceNode.object3D);

    // 自动展开目标节点以显示新添加的子节点
    targetNode.expanded = true;

    // 重新构建节点树
    this.buildNodeTree();

    // 保存状态
    this.saveState(`移动节点: ${sourceNode.name} 从 ${oldParentName} 到 ${targetNode.name}`);

    this.log(`节点移动成功: ${sourceNode.name} -> ${targetNode.name}`);
  }

  private createDragPlaceholder() {
    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.className = 'drag-placeholder';
    this.dragPlaceholder.style.cssText = `
      height: 2px;
      background: #007bff;
      border-radius: 1px;
      margin: 2px 0;
      opacity: 0.8;
      display: none;
    `;
  }

  private removeDragPlaceholder() {
    if (this.dragPlaceholder && this.dragPlaceholder.parentNode) {
      this.dragPlaceholder.parentNode.removeChild(this.dragPlaceholder);
    }
    this.dragPlaceholder = null;
  }

  private highlightDropTarget(element: HTMLElement) {
    element.classList.add('drop-target');
  }

  private clearDropHighlights() {
    const allNodes = this.nodeTreeElement.querySelectorAll('.tree-node');
    allNodes.forEach((node) => {
      const nodeElement = node as HTMLElement;
      nodeElement.classList.remove('drop-target', 'drop-invalid');
    });
  }

  undo() {
    if (this.historyIndex <= 0) return;

    this.historyIndex--;
    this.restoreState(this.history[this.historyIndex]);
    this.updateUndoRedoButtons();
    this.log(`撤销: ${this.history[this.historyIndex + 1]?.description || '未知操作'}`);
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;

    this.historyIndex++;
    this.restoreState(this.history[this.historyIndex]);
    this.updateUndoRedoButtons();
    this.log(`重做: ${this.history[this.historyIndex].description}`);
  }

  private restoreState(state: HistoryState) {
    // 恢复所有对象的状态
    state.objects.forEach((objState) => {
      const node = this.nodeMap.get(objState.id);
      if (node) {
        node.object3D.position.copy(objState.position);
        node.object3D.rotation.copy(objState.rotation);
        node.object3D.scale.copy(objState.scale);
        node.object3D.visible = objState.visible;
        node.visible = objState.visible;
      }
    });

    this.renderNodeTree();
    this.updateTransformInputs();
  }

  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.updateUndoRedoButtons();
    this.saveState('清空历史记录');
    this.log('历史记录已清空');
  }

  exportScene() {
    const sceneData = {
      timestamp: Date.now(),
      objects: Array.from(this.nodeMap.values()).map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        position: node.object3D.position.toArray(),
        rotation: node.object3D.rotation.toArray(),
        scale: node.object3D.scale.toArray(),
        visible: node.object3D.visible,
      })),
    };

    const dataStr = JSON.stringify(sceneData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `scene_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.log('场景已导出');
  }

  clearScene() {
    // 保留基础对象（灯光、地面等）
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (
        child !== this.scene &&
        !child.name.includes('Light') &&
        !child.name.includes('地面') &&
        child.parent === this.scene
      ) {
        objectsToRemove.push(child);
      }
    });

    objectsToRemove.forEach((obj) => this.scene.remove(obj));

    this.buildNodeTree();
    this.saveState('清空场景');
    this.log('场景已清空');
  }

  resetCamera() {
    this.camera.position.set(5, 5, 5);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.log('相机已重置');
  }
}

// 全局实例
let nodeTreeManager: NodeTreeManager;

// 全局函数（供HTML调用）
declare global {
  interface Window {
    loadSelectedPresetModel: () => void;
    loadModelFile: (event: Event) => void;
    loadSampleModel: (type: 'cube' | 'sphere') => void;
    updateTransform: (
      type: 'position' | 'rotation' | 'scale',
      axis: 'x' | 'y' | 'z',
      value: string,
    ) => void;
    duplicateSelectedNode: () => void;
    toggleNodeVisibility: () => void;
    deleteSelectedNode: () => void;
    resetNodeTransform: () => void;
    expandAll: () => void;
    collapseAll: () => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
    exportScene: () => void;
    clearScene: () => void;
    resetCamera: () => void;
  }
}

// 绑定全局函数
window.loadSelectedPresetModel = () => nodeTreeManager.loadSelectedPresetModel();
window.loadModelFile = (event: Event) => nodeTreeManager.loadModelFile(event);
window.loadSampleModel = (type: 'cube' | 'sphere') => nodeTreeManager.loadSampleModel(type);
window.updateTransform = (
  type: 'position' | 'rotation' | 'scale',
  axis: 'x' | 'y' | 'z',
  value: string,
) => nodeTreeManager.updateTransform(type, axis, value);
window.duplicateSelectedNode = () => nodeTreeManager.duplicateSelectedNode();
window.toggleNodeVisibility = () => {
  if (nodeTreeManager.selectedNode) {
    nodeTreeManager.toggleNodeVisibility(nodeTreeManager.selectedNode);
  }
};
window.deleteSelectedNode = () => nodeTreeManager.deleteSelectedNode();
window.resetNodeTransform = () => nodeTreeManager.resetNodeTransform();
window.expandAll = () => nodeTreeManager.expandAll();
window.collapseAll = () => nodeTreeManager.collapseAll();
window.undo = () => nodeTreeManager.undo();
window.redo = () => nodeTreeManager.redo();
window.clearHistory = () => nodeTreeManager.clearHistory();
window.exportScene = () => nodeTreeManager.exportScene();
window.clearScene = () => nodeTreeManager.clearScene();
window.resetCamera = () => nodeTreeManager.resetCamera();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  nodeTreeManager = new NodeTreeManager();
});
