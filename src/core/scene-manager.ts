/**
 * SceneManager - Three.js 场景管理核心
 *
 * 管理 Three.js 场景、相机、渲染器，处理渲染循环和资源管理。
 */

import * as THREE from 'three';
import type { IPlugin } from '../type';
import type { IVector3 } from '../type/common';

/**
 * SceneManager 类负责管理 Three.js 的核心渲染功能
 */
export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private plugins: Set<IPlugin> = new Set();
  private isRendering: boolean = false;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  /**
   * 创建 SceneManager 实例
   * @param canvas Canvas 元素或选择器，如果未提供则创建新的 canvas
   */
  constructor(canvas?: HTMLCanvasElement | string) {
    // 初始化场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 初始化相机（默认透视相机）
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 5);

    // 处理 canvas 参数
    let canvasElement: HTMLCanvasElement | undefined;
    if (typeof canvas === 'string') {
      const element = document.querySelector(canvas);
      if (element instanceof HTMLCanvasElement) {
        canvasElement = element;
      }
    } else if (canvas instanceof HTMLCanvasElement) {
      canvasElement = canvas;
    }

    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 添加默认光源
    this.addDefaultLights();

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * 初始化场景，添加场景对象
   * @param sceneObjects Three.js 对象数组
   */
  public init(sceneObjects: THREE.Object3D[]): void {
    // 清空现有场景
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // 添加新对象到场景
    sceneObjects.forEach((obj) => {
      this.scene.add(obj);
    });

    // 触发插件的初始化回调
    this.plugins.forEach((plugin) => {
      if (plugin.onSceneInit) {
        plugin.onSceneInit(this.scene);
      }
    });
  }

  /**
   * 向场景添加对象
   * @param object Three.js 对象
   */
  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);

    // 触发插件的对象添加回调
    this.plugins.forEach((plugin) => {
      if (plugin.onObjectAdded) {
        plugin.onObjectAdded(object);
      }
    });
  }

  /**
   * 从场景移除对象
   * @param object Three.js 对象
   */
  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);

    // 触发插件的对象移除回调
    this.plugins.forEach((plugin) => {
      if (plugin.onObjectRemoved) {
        plugin.onObjectRemoved(object);
      }
    });

    // 释放资源
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material?.dispose();
      }
    }
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   */
  public registerPlugin(plugin: IPlugin): void {
    this.plugins.add(plugin);

    // 如果插件有 onRegister 方法，调用它
    if (plugin.onRegister) {
      plugin.onRegister({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
      });
    }
  }

  /**
   * 注销插件
   * @param plugin 插件实例
   */
  public unregisterPlugin(plugin: IPlugin): void {
    // 调用插件的注销方法
    if (plugin.onUnregister) {
      plugin.onUnregister();
    }

    this.plugins.delete(plugin);
  }

  /**
   * 启动渲染循环
   */
  public startRenderLoop(): void {
    if (this.isRendering) {
      return;
    }

    this.isRendering = true;
    this.clock.start();
    this.render();
  }

  /**
   * 停止渲染循环
   */
  public stopRenderLoop(): void {
    this.isRendering = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 渲染一帧
   */
  private render(): void {
    if (!this.isRendering) {
      return;
    }

    // 计算增量时间
    const deltaTime = this.clock.getDelta();

    // 更新插件
    this.plugins.forEach((plugin) => {
      if (plugin.update) {
        plugin.update(deltaTime);
      }
    });

    // 渲染场景
    this.renderer.render(this.scene, this.camera);

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(this.render.bind(this));
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize(): void {
    // 更新相机宽高比
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = window.innerWidth / window.innerHeight;
      const frustumSize = 10;
      this.camera.left = (-frustumSize * aspect) / 2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
    }

    // 更新渲染器大小
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * 添加默认光源
   */
  private addDefaultLights(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
  }

  /**
   * 设置相机位置
   * @param position 相机位置
   * @param target 观察目标
   */
  public setCameraPosition(position: IVector3, target?: IVector3): void {
    this.camera.position.set(position.x, position.y, position.z);

    if (target) {
      this.camera.lookAt(target.x, target.y, target.z);
    }
  }

  /**
   * 获取场景
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * 获取相机
   */
  public getCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * 获取渲染器
   */
  public getRenderer(): unknown {
    return this.renderer;
  }

  /**
   * 销毁场景管理器，释放资源
   */
  public dispose(): void {
    this.stopRenderLoop();

    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize.bind(this));

    // 注销所有插件
    this.plugins.forEach((plugin) => this.unregisterPlugin(plugin));

    // 释放渲染器资源
    this.renderer.dispose();

    // 清空场景
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.removeObject(child);
    }
  }
}
