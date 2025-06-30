// DSL 3D交互系统
import * as THREE from 'three';
import type { SceneObject } from '../types/core';

// 交互模式
export type InteractionMode =
  | 'select' // 选择模式
  | 'translate' // 移动模式
  | 'rotate' // 旋转模式
  | 'scale' // 缩放模式
  | 'brush' // 刷子模式（用于纹理绘制）
  | 'sculpt'; // 雕刻模式

// 交互事件类型
export interface InteractionEvent {
  type: 'click' | 'drag' | 'hover' | 'key';
  target?: SceneObject;
  position: THREE.Vector3;
  normal?: THREE.Vector3;
  uv?: THREE.Vector2;
  distance: number;
  button?: number;
  key?: string;
  delta?: THREE.Vector3;
}

// 射线投射结果
export interface RaycastResult {
  object: SceneObject;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  uv?: THREE.Vector2;
  distance: number;
  face?: THREE.Face;
  faceIndex?: number;
}

// 选择框配置
export interface SelectionBoxConfig {
  enabled: boolean;
  color: string;
  lineWidth: number;
  opacity: number;
}

// Transform Gizmo配置
export interface GizmoConfig {
  enabled: boolean;
  size: number;
  space: 'local' | 'world';
  showX: boolean;
  showY: boolean;
  showZ: boolean;
  colors: {
    x: string;
    y: string;
    z: string;
    selected: string;
  };
}

// 相机控制配置
export interface CameraControlConfig {
  enabled: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  enableZoom: boolean;
  enableRotate: boolean;
  enablePan: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
}

// 交互系统配置
export interface InteractionConfig {
  mode: InteractionMode;
  multiSelect: boolean;
  selectionBox: SelectionBoxConfig;
  gizmo: GizmoConfig;
  camera: CameraControlConfig;
  raycast: {
    recursive: boolean;
    threshold: number;
    layers: number;
  };
}

// 默认交互配置
export const defaultInteractionConfig: InteractionConfig = {
  mode: 'select',
  multiSelect: true,
  selectionBox: {
    enabled: true,
    color: '#00aaff',
    lineWidth: 2,
    opacity: 0.8,
  },
  gizmo: {
    enabled: true,
    size: 1,
    space: 'local',
    showX: true,
    showY: true,
    showZ: true,
    colors: {
      x: '#ff0000',
      y: '#00ff00',
      z: '#0000ff',
      selected: '#ffff00',
    },
  },
  camera: {
    enabled: true,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    autoRotate: false,
    autoRotateSpeed: 2.0,
    minDistance: 0.1,
    maxDistance: 1000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  },
  raycast: {
    recursive: true,
    threshold: 0.1,
    layers: 0,
  },
};

// 射线投射器
export class TripoRaycaster {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(private config: InteractionConfig['raycast']) {
    this.raycaster.params.Line.threshold = config.threshold;
    this.raycaster.layers.set(config.layers);
  }

  // 从鼠标位置创建射线
  setFromMouse(mouse: THREE.Vector2, camera: THREE.Camera): void {
    this.mouse.copy(mouse);
    this.raycaster.setFromCamera(mouse, camera);
  }

  // 从3D点创建射线
  setFromPoints(origin: THREE.Vector3, direction: THREE.Vector3): void {
    this.raycaster.set(origin, direction.normalize());
  }

  // 执行射线投射
  intersectObjects(objects: THREE.Object3D[]): RaycastResult[] {
    const intersects = this.raycaster.intersectObjects(objects, this.config.recursive);

    return intersects
      .map((intersect) => ({
        object: this.findSceneObject(intersect.object),
        point: intersect.point,
        normal: intersect.face?.normal || new THREE.Vector3(0, 0, 1),
        uv: intersect.uv,
        distance: intersect.distance,
        face: intersect.face,
        faceIndex: intersect.faceIndex,
      }))
      .filter((result) => result.object !== null) as RaycastResult[];
  }

  // 查找对应的场景对象
  private findSceneObject(object3d: THREE.Object3D): SceneObject | null {
    // 向上遍历查找包含 dslId 的对象
    let current = object3d;
    while (current) {
      if (current.userData.dslId) {
        return current.userData.dslConfig as SceneObject;
      }
      current = current.parent!;
      if (!current) break;
    }
    return null;
  }
}

// 选择框管理器
export class SelectionBox {
  private box: THREE.Box3Helper | null = null;
  private startPoint = new THREE.Vector2();
  private endPoint = new THREE.Vector2();
  private isSelecting = false;

  constructor(
    private scene: THREE.Scene,
    private config: SelectionBoxConfig,
  ) {}

  // 开始选择
  startSelection(point: THREE.Vector2): void {
    if (!this.config.enabled) return;

    this.isSelecting = true;
    this.startPoint.copy(point);
    this.endPoint.copy(point);

    this.updateBox();
  }

  // 更新选择框
  updateSelection(point: THREE.Vector2): void {
    if (!this.isSelecting) return;

    this.endPoint.copy(point);
    this.updateBox();
  }

  // 结束选择
  endSelection(): THREE.Box2 {
    if (!this.isSelecting) return new THREE.Box2();

    this.isSelecting = false;

    if (this.box) {
      this.scene.remove(this.box);
      this.box = null;
    }

    return new THREE.Box2(this.startPoint, this.endPoint);
  }

  // 更新选择框显示
  private updateBox(): void {
    if (this.box) {
      this.scene.remove(this.box);
    }

    const width = Math.abs(this.endPoint.x - this.startPoint.x);
    const height = Math.abs(this.endPoint.y - this.startPoint.y);

    if (width > 5 && height > 5) {
      // 最小选择框尺寸
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        color: this.config.color,
        transparent: true,
        opacity: this.config.opacity * 0.3,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // 创建边框
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: this.config.color,
        linewidth: this.config.lineWidth,
      });
      const line = new THREE.LineSegments(edges, lineMaterial);

      const group = new THREE.Group();
      group.add(mesh);
      group.add(line);

      // 定位选择框
      const centerX = (this.startPoint.x + this.endPoint.x) / 2;
      const centerY = (this.startPoint.y + this.endPoint.y) / 2;
      group.position.set(centerX, centerY, 0);

      this.scene.add(group);
      this.box = group as any;
    }
  }
}

// Transform Gizmo 控制器
export class TransformGizmo {
  private gizmo: THREE.Group | null = null;
  private isDragging = false;
  private activeAxis: 'x' | 'y' | 'z' | null = null;
  private dragStart = new THREE.Vector3();
  private dragCurrent = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private config: GizmoConfig,
  ) {}

  // 为选中对象显示Gizmo
  attachToObject(object: THREE.Object3D): void {
    if (!this.config.enabled) return;

    this.detach();
    this.createGizmo();

    if (this.gizmo) {
      // 定位到对象位置
      this.gizmo.position.copy(object.position);
      this.gizmo.rotation.copy(object.rotation);
      this.scene.add(this.gizmo);
    }
  }

  // 移除Gizmo
  detach(): void {
    if (this.gizmo) {
      this.scene.remove(this.gizmo);
      this.gizmo = null;
    }
  }

  // 处理鼠标交互
  handleMouseDown(point: THREE.Vector3, axis: 'x' | 'y' | 'z'): void {
    this.isDragging = true;
    this.activeAxis = axis;
    this.dragStart.copy(point);
    this.dragCurrent.copy(point);
  }

  handleMouseMove(point: THREE.Vector3): THREE.Vector3 | null {
    if (!this.isDragging || !this.activeAxis) return null;

    this.dragCurrent.copy(point);
    const delta = this.dragCurrent.clone().sub(this.dragStart);

    // 限制到特定轴
    switch (this.activeAxis) {
      case 'x':
        delta.y = 0;
        delta.z = 0;
        break;
      case 'y':
        delta.x = 0;
        delta.z = 0;
        break;
      case 'z':
        delta.x = 0;
        delta.y = 0;
        break;
    }

    return delta;
  }

  handleMouseUp(): void {
    this.isDragging = false;
    this.activeAxis = null;
  }

  // 创建Gizmo几何体
  private createGizmo(): void {
    this.gizmo = new THREE.Group();

    const size = this.config.size;

    // X轴箭头（红色）
    if (this.config.showX) {
      const xAxis = this.createArrow(this.config.colors.x, new THREE.Vector3(1, 0, 0));
      xAxis.scale.setScalar(size);
      xAxis.userData.axis = 'x';
      this.gizmo.add(xAxis);
    }

    // Y轴箭头（绿色）
    if (this.config.showY) {
      const yAxis = this.createArrow(this.config.colors.y, new THREE.Vector3(0, 1, 0));
      yAxis.scale.setScalar(size);
      yAxis.userData.axis = 'y';
      this.gizmo.add(yAxis);
    }

    // Z轴箭头（蓝色）
    if (this.config.showZ) {
      const zAxis = this.createArrow(this.config.colors.z, new THREE.Vector3(0, 0, 1));
      zAxis.scale.setScalar(size);
      zAxis.userData.axis = 'z';
      this.gizmo.add(zAxis);
    }
  }

  private createArrow(color: string, direction: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();

    // 箭头线
    const geometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const cylinder = new THREE.Mesh(geometry, material);

    // 箭头头部
    const coneGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const cone = new THREE.Mesh(coneGeometry, material);
    cone.position.y = 0.6;

    group.add(cylinder);
    group.add(cone);

    // 旋转到正确方向
    if (direction.x === 1) {
      group.rotation.z = -Math.PI / 2;
    } else if (direction.z === 1) {
      group.rotation.x = Math.PI / 2;
    }

    return group;
  }
}

// 主交互管理器
export class TripoInteractionManager {
  private raycaster: TripoRaycaster;
  private selectionBox: SelectionBox;
  private gizmo: TransformGizmo;
  private selectedObjects: SceneObject[] = [];
  private hoveredObject: SceneObject | null = null;
  private listeners: Set<(event: InteractionEvent) => void> = new Set();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private canvas: HTMLCanvasElement,
    private config: InteractionConfig = defaultInteractionConfig,
  ) {
    this.raycaster = new TripoRaycaster(config.raycast);
    this.selectionBox = new SelectionBox(scene, config.selectionBox);
    this.gizmo = new TransformGizmo(scene, config.gizmo);

    this.setupEventListeners();
  }

  // 设置DOM事件监听
  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 鼠标点击处理
  private handleClick(event: MouseEvent): void {
    const mouse = this.getMousePosition(event);
    this.raycaster.setFromMouse(mouse, this.camera);

    const objects = this.getInteractableObjects();
    const intersects = this.raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      this.handleObjectClick(target, intersects[0], event);
    } else {
      this.clearSelection();
    }
  }

  // 对象点击处理
  private handleObjectClick(object: SceneObject, result: RaycastResult, event: MouseEvent): void {
    if (this.config.multiSelect && (event.ctrlKey || event.metaKey)) {
      // 多选模式
      const index = this.selectedObjects.indexOf(object);
      if (index >= 0) {
        this.selectedObjects.splice(index, 1);
      } else {
        this.selectedObjects.push(object);
      }
    } else {
      // 单选模式
      this.selectedObjects = [object];
    }

    this.updateGizmoPosition();
    this.notifyListeners({
      type: 'click',
      target: object,
      position: result.point,
      normal: result.normal,
      uv: result.uv,
      distance: result.distance,
    });
  }

  // 清除选择
  clearSelection(): void {
    this.selectedObjects = [];
    this.gizmo.detach();
    this.notifyListeners({
      type: 'click',
      position: new THREE.Vector3(),
      distance: 0,
    });
  }

  // 更新Gizmo位置
  private updateGizmoPosition(): void {
    if (this.selectedObjects.length === 1) {
      // 单个对象选中，显示Gizmo
      const object = this.getThreeObject(this.selectedObjects[0]);
      if (object) {
        this.gizmo.attachToObject(object);
      }
    } else {
      // 多选或无选择，隐藏Gizmo
      this.gizmo.detach();
    }
  }

  // 获取可交互的Three.js对象
  private getInteractableObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child.userData.dslId && child.visible) {
        objects.push(child);
      }
    });
    return objects;
  }

  // 通过场景对象获取Three.js对象
  private getThreeObject(sceneObject: SceneObject): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    this.scene.traverse((child) => {
      if (child.userData.dslId === sceneObject.id) {
        found = child;
      }
    });
    return found;
  }

  // 获取鼠标在标准化设备坐标中的位置
  private getMousePosition(event: MouseEvent): THREE.Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    return mouse;
  }

  // 鼠标按下处理
  private handleMouseDown(_event: MouseEvent): void {
    // 实现拖拽和选择框逻辑
  }

  // 鼠标移动处理
  private handleMouseMove(_event: MouseEvent): void {
    // 实现悬停和拖拽逻辑
  }

  // 鼠标抬起处理
  private handleMouseUp(_event: MouseEvent): void {
    // 实现拖拽结束逻辑
  }

  // 键盘处理
  private handleKeyDown(event: KeyboardEvent): void {
    this.notifyListeners({
      type: 'key',
      position: new THREE.Vector3(),
      distance: 0,
      key: event.key,
    });
  }

  // 添加事件监听器
  addEventListener(listener: (event: InteractionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 通知监听器
  private notifyListeners(event: InteractionEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // 设置交互模式
  setMode(mode: InteractionMode): void {
    this.config.mode = mode;
  }

  // 获取选中对象
  getSelectedObjects(): SceneObject[] {
    return [...this.selectedObjects];
  }

  // 销毁交互管理器
  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('keydown', this.handleKeyDown.bind(this));

    this.gizmo.detach();
    this.listeners.clear();
  }
}
