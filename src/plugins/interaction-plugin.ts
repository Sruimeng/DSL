/**
 * Interaction Plugin - 交互插件
 *
 * 提供用户交互功能，如鼠标控制、触摸操作、选择等。
 */

import * as THREE from 'three';
import { BasePlugin } from './base-plugin';

/**
 * InteractionPlugin 提供了场景交互功能
 * 包括对象选择、变换控制、相机控制等
 */
export class InteractionPlugin extends BasePlugin {
  name = 'InteractionPlugin';
  version = '1.0.0';
  description = 'Provides user interaction capabilities for the 3D scene';

  /** Raycaster for object selection */
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  /** Mouse position */
  private mouse: THREE.Vector2 = new THREE.Vector2();
  /** Selected objects */
  private selectedObjects: Set<THREE.Object3D> = new Set();
  /** Interactive objects */
  private interactiveObjects: Set<THREE.Object3D> = new Set();
  /** Event listeners */
  private eventListeners: Map<string, EventListener> = new Map();
  /** Interaction settings */
  private settings: {
    enableSelection: boolean;
    enableTransformation: boolean;
    enableCameraControls: boolean;
    selectionMode: 'single' | 'multiple';
    highlightOnHover: boolean;
  } = {
    enableSelection: true,
    enableTransformation: false,
    enableCameraControls: false,
    selectionMode: 'single',
    highlightOnHover: true,
  };

  /** Transform controls */
  private transformControls?: any;
  /** Camera controls */
  private cameraControls?: any;

  /**
   * Initialize interaction plugin
   */
  onRegister(engine: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  }): void {
    super.onRegister(engine);

    // Setup event listeners
    this.setupEventListeners(engine.renderer.domElement);

    // Initialize controls if enabled
    if (this.settings.enableTransformation) {
      this.initializeTransformControls(engine.scene, engine.camera, engine.renderer);
    }

    if (this.settings.enableCameraControls) {
      this.initializeCameraControls(engine.camera, engine.renderer.domElement);
    }

    this.info('Interaction plugin initialized');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(canvas: HTMLCanvasElement): void {
    const onMouseDown = this.onMouseDown.bind(this);
    const onMouseMove = this.onMouseMove.bind(this);
    const onMouseUp = this.onMouseUp.bind(this);
    const onClick = this.onClick.bind(this);
    const onContextMenu = this.onContextMenu.bind(this);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('contextmenu', onContextMenu);

    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Store listeners for cleanup
    this.eventListeners.set('mousedown', onMouseDown as EventListener);
    this.eventListeners.set('mousemove', onMouseMove as EventListener);
    this.eventListeners.set('mouseup', onMouseUp as EventListener);
    this.eventListeners.set('click', onClick as EventListener);
    this.eventListeners.set('contextmenu', onContextMenu as EventListener);
  }

  /**
   * Initialize transform controls
   */
  private initializeTransformControls(
    _scene: THREE.Scene,
    _camera: THREE.Camera,
    _renderer: THREE.WebGLRenderer,
  ): void {
    // Note: This would require TransformControls from three-stdlib
    // For now, we'll just create a placeholder

    try {
      // this.transformControls = new TransformControls(camera, renderer.domElement);
      // scene.add(this.transformControls);
      // this.transformControls.addEventListener('change', () => {});
      // this.transformControls.addEventListener('dragging-changed', (event) => {
      //   if (this.cameraControls) {
      //     this.cameraControls.enabled = !event.value;
      //   }
      // });

      this.warn('Transform controls require additional dependencies');
    } catch (error) {
      this.error('Failed to initialize transform controls:', error);
    }
  }

  /**
   * Initialize camera controls
   */
  private initializeCameraControls(_camera: THREE.Camera, _canvas: HTMLCanvasElement): void {
    // Note: This would require OrbitControls from three-stdlib
    // For now, we'll just create a placeholder

    try {
      // this.cameraControls = new OrbitControls(camera, canvas);
      // this.cameraControls.enableDamping = true;
      // this.cameraControls.dampingFactor = 0.05;

      this.warn('Camera controls require additional dependencies');
    } catch (error) {
      this.error('Failed to initialize camera controls:', error);
    }
  }

  /**
   * Mouse down handler
   */
  private onMouseDown(event: MouseEvent): void {
    if (!this.settings.enableSelection) return;

    this.updateMousePosition(event);
    this.performSelection();

    event.preventDefault();
  }

  /**
   * Mouse move handler
   */
  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);

    if (this.settings.highlightOnHover) {
      this.performHover();
    }

    event.preventDefault();
  }

  /**
   * Mouse up handler
   */
  private onMouseUp(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Click handler
   */
  private onClick(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Context menu handler
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Touch start handler
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePosition(touch as unknown as MouseEvent);
      this.performSelection();
    }
    event.preventDefault();
  }

  /**
   * Touch move handler
   */
  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePosition(touch as unknown as MouseEvent);
    }
    event.preventDefault();
  }

  /**
   * Touch end handler
   */
  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
  }

  /**
   * Update mouse position
   */
  private updateMousePosition(event: MouseEvent): void {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Perform object selection
   */
  private performSelection(): void {
    if (!this.engine?.getSceneManager) return;

    const sceneManager = this.engine.getSceneManager() as any;
    const scene = sceneManager?.getScene?.();
    const camera = sceneManager?.getCamera?.();

    if (!scene || !camera) return;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, camera as THREE.Camera);

    // Get intersectable objects
    const objects = Array.from(this.interactiveObjects);
    if (objects.length === 0) {
      // If no interactive objects, use all objects in scene
      scene.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) {
          objects.push(obj);
        }
      });
    }

    // Perform raycast
    const intersects = this.raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.selectObject(object);
    } else {
      if (this.settings.selectionMode === 'single') {
        this.clearSelection();
      }
    }
  }

  /**
   * Perform hover effect
   */
  private performHover(): void {
    if (!this.engine?.getSceneManager) return;

    const sceneManager = this.engine.getSceneManager() as any;
    const scene = sceneManager?.getScene?.();
    const camera = sceneManager?.getCamera?.();

    if (!scene || !camera) return;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, camera as THREE.Camera);

    // Get intersectable objects
    const objects = Array.from(this.interactiveObjects);
    if (objects.length === 0) {
      scene.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) {
          objects.push(obj);
        }
      });
    }

    // Perform raycast
    const intersects = this.raycaster.intersectObjects(objects);

    // Reset previous hover state
    objects.forEach((obj) => {
      if ((obj as any).material?.emissive) {
        (obj as any).material.emissive.setHex(0x000000);
      }
    });

    // Set hover state
    if (intersects.length > 0) {
      const object = intersects[0].object;
      if ((object as any).material?.emissive) {
        (object as any).material.emissive.setHex(0x444444);
      }
    }
  }

  /**
   * Select an object
   */
  private selectObject(object: THREE.Object3D): void {
    if (this.settings.selectionMode === 'single') {
      this.clearSelection();
    }

    this.selectedObjects.add(object);
    this.emit('objectSelected', { object });

    // Update transform controls
    if (this.transformControls && this.settings.enableTransformation) {
      (this.transformControls as any).attach(object);
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedObjects.forEach((obj) => {
      this.emit('objectDeselected', { object: obj });
    });
    this.selectedObjects.clear();

    // Detach transform controls
    if (this.transformControls) {
      (this.transformControls as any).detach();
    }
  }

  /**
   * Add object to interactive list
   */
  addInteractiveObject(object: THREE.Object3D): void {
    this.interactiveObjects.add(object);
  }

  /**
   * Remove object from interactive list
   */
  removeInteractiveObject(object: THREE.Object3D): void {
    this.interactiveObjects.delete(object);
    this.selectedObjects.delete(object);
  }

  /**
   * Get selected objects
   */
  getSelectedObjects(): THREE.Object3D[] {
    return Array.from(this.selectedObjects);
  }

  /**
   * Update interaction settings
   */
  updateSettings(settings: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...settings };
    this.info('Interaction settings updated');
  }

  /**
   * Get current settings
   */
  getSettings(): typeof this.settings {
    return { ...this.settings };
  }

  /**
   * Emit custom event
   */
  private emit(event: string, data: any): void {
    if (this.engine?.getEventBus) {
      this.engine.getEventBus().emit(event, data);
    }
  }

  /**
   * Clean up resources
   */
  onUnregister(): void {
    // Remove event listeners
    if (this.engine?.getRenderer) {
      const renderer = this.engine.getRenderer() as THREE.WebGLRenderer;
      const canvas = renderer.domElement;

      this.eventListeners.forEach((listener, event) => {
        canvas.removeEventListener(event, listener);
      });
      this.eventListeners.clear();
    }

    // Clear selections
    this.clearSelection();
    this.interactiveObjects.clear();

    // Dispose controls
    if (this.transformControls) {
      this.transformControls.dispose();
      this.transformControls = undefined;
    }

    if (this.cameraControls) {
      this.cameraControls.dispose();
      this.cameraControls = undefined;
    }

    super.onUnregister?.();
  }
}
