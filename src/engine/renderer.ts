// ThreeJS渲染器 - 监听DSL状态变化并自动同步到ThreeJS场景
import * as THREE from 'three';
import type { TripoEngine } from './core';
import { type Camera, type Light, type Material, type SceneObject, type TripoScene } from './core';

export class TripoRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private engine: TripoEngine;

  // 对象映射表 - DSL对象ID到ThreeJS对象
  private objectMap = new Map<string, THREE.Object3D>();
  private materialMap = new Map<string, THREE.Material>();
  private lightMap = new Map<string, THREE.Light>();

  // 控制器
  private controls?: any;
  private animationId?: number;

  constructor(canvas: HTMLCanvasElement, engine: TripoEngine) {
    this.engine = engine;
    this.setupThreeJS(canvas);
    this.setupSceneSync();
    this.startRenderLoop();
  }

  private setupThreeJS(canvas: HTMLCanvasElement) {
    // 创建基础对象
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    // 基础设置
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // 设置初始相机位置
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  private setupSceneSync() {
    // 监听DSL状态变化
    this.engine.subscribe((dslScene) => {
      this.syncScene(dslScene);
    });

    // 初始同步
    this.syncScene(this.engine.getScene());
  }

  // 同步DSL场景到ThreeJS场景
  private syncScene(dslScene: TripoScene) {
    // 同步材质（优先级最高，对象可能依赖材质）
    this.syncMaterials(dslScene.materials);

    // 同步对象
    this.syncObjects(dslScene.objects);

    // 同步光源
    this.syncLights(dslScene.environment.lights);

    // 同步相机
    this.syncCamera(dslScene.environment.camera);

    // 同步环境
    this.syncEnvironment(dslScene.environment);
  }

  // 同步材质
  private syncMaterials(materials: Record<string, Material>) {
    const currentIds = new Set(Object.keys(materials));
    const existingIds = new Set(this.materialMap.keys());

    // 删除不存在的材质
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const material = this.materialMap.get(id);
        if (material) {
          material.dispose();
          this.materialMap.delete(id);
        }
      }
    });

    // 添加或更新材质
    Object.values(materials).forEach((dslMaterial) => {
      let threeMaterial = this.materialMap.get(dslMaterial.id);

      if (!threeMaterial) {
        // 创建新材质
        threeMaterial = this.createThreeMaterial(dslMaterial);
        this.materialMap.set(dslMaterial.id, threeMaterial);
      } else {
        // 更新现有材质
        this.updateThreeMaterial(threeMaterial, dslMaterial);
      }
    });
  }

  // 同步对象
  private syncObjects(objects: Record<string, SceneObject>) {
    const currentIds = new Set(Object.keys(objects));
    const existingIds = new Set(this.objectMap.keys());

    // 删除不存在的对象
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const obj = this.objectMap.get(id);
        if (obj) {
          this.scene.remove(obj);
          this.disposeObject(obj);
          this.objectMap.delete(id);
        }
      }
    });

    // 添加或更新对象
    Object.values(objects).forEach((dslObject) => {
      let threeObject = this.objectMap.get(dslObject.id);

      if (!threeObject) {
        // 创建新对象
        threeObject = this.createThreeObject(dslObject);
        if (threeObject) {
          this.scene.add(threeObject);
          this.objectMap.set(dslObject.id, threeObject);
        }
      } else {
        // 更新现有对象
        this.updateThreeObject(threeObject, dslObject);
      }
    });
  }

  // 同步光源
  private syncLights(lights: Record<string, Light>) {
    const currentIds = new Set(Object.keys(lights));
    const existingIds = new Set(this.lightMap.keys());

    // 删除不存在的光源
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const light = this.lightMap.get(id);
        if (light) {
          this.scene.remove(light);
          this.lightMap.delete(id);
        }
      }
    });

    // 添加或更新光源
    Object.values(lights).forEach((dslLight) => {
      let threeLight = this.lightMap.get(dslLight.id);

      if (!threeLight) {
        // 创建新光源
        threeLight = this.createThreeLight(dslLight);
        if (threeLight) {
          this.scene.add(threeLight);
          this.lightMap.set(dslLight.id, threeLight);
        }
      } else {
        // 更新现有光源
        this.updateThreeLight(threeLight, dslLight);
      }
    });
  }

  // 创建ThreeJS材质
  private createThreeMaterial(dslMaterial: Material): THREE.Material {
    let material: THREE.Material;

    switch (dslMaterial.type) {
      case 'wireframe':
        material = new THREE.MeshBasicMaterial({
          color: dslMaterial.color,
          wireframe: true,
          transparent: dslMaterial.opacity < 1,
          opacity: dslMaterial.opacity,
        });
        break;
      case 'basic':
        material = new THREE.MeshBasicMaterial({
          color: dslMaterial.color,
          transparent: dslMaterial.opacity < 1,
          opacity: dslMaterial.opacity,
        });
        break;
      case 'standard':
      default:
        material = new THREE.MeshStandardMaterial({
          color: dslMaterial.color,
          metalness: dslMaterial.metalness,
          roughness: dslMaterial.roughness,
          transparent: dslMaterial.opacity < 1,
          opacity: dslMaterial.opacity,
        });
        break;
    }

    return material;
  }

  // 更新ThreeJS材质
  private updateThreeMaterial(threeMaterial: THREE.Material, dslMaterial: Material) {
    if (threeMaterial instanceof THREE.MeshStandardMaterial) {
      threeMaterial.color.set(dslMaterial.color);
      threeMaterial.metalness = dslMaterial.metalness;
      threeMaterial.roughness = dslMaterial.roughness;
      threeMaterial.opacity = dslMaterial.opacity;
      threeMaterial.transparent = dslMaterial.opacity < 1;
    } else if (threeMaterial instanceof THREE.MeshBasicMaterial) {
      threeMaterial.color.set(dslMaterial.color);
      threeMaterial.opacity = dslMaterial.opacity;
      threeMaterial.transparent = dslMaterial.opacity < 1;
    }

    threeMaterial.needsUpdate = true;
  }

  // 创建ThreeJS对象
  private createThreeObject(dslObject: SceneObject): THREE.Object3D | null {
    let object: THREE.Object3D;

    switch (dslObject.type) {
      case 'mesh': {
        const geometry = this.createGeometry(dslObject.geometry);
        const material = this.getMaterial(dslObject.materialId) || new THREE.MeshStandardMaterial();
        object = new THREE.Mesh(geometry, material);
        break;
      }
      case 'group': {
        object = new THREE.Group();
        break;
      }
      default: {
        object = new THREE.Object3D();
        break;
      }
    }

    // 设置基础属性
    object.name = dslObject.name;
    this.updateThreeObject(object, dslObject);

    return object;
  }

  // 更新ThreeJS对象
  private updateThreeObject(threeObject: THREE.Object3D, dslObject: SceneObject) {
    // 更新变换
    const { position, rotation, scale } = dslObject.transform;
    threeObject.position.set(...position);
    threeObject.rotation.set(...rotation);
    threeObject.scale.set(...scale);

    // 更新属性
    threeObject.visible = dslObject.visible;
    threeObject.castShadow = dslObject.castShadow;
    threeObject.receiveShadow = dslObject.receiveShadow;
    threeObject.name = dslObject.name;

    // 更新材质
    if (threeObject instanceof THREE.Mesh && dslObject.materialId) {
      const material = this.getMaterial(dslObject.materialId);
      if (material) {
        threeObject.material = material;
      }
    }
  }

  // 创建几何体
  private createGeometry(geomDef?: SceneObject['geometry']): THREE.BufferGeometry {
    if (!geomDef) return new THREE.BoxGeometry(1, 1, 1);

    switch (geomDef.type) {
      case 'box':
        return new THREE.BoxGeometry(
          geomDef.params.width || 1,
          geomDef.params.height || 1,
          geomDef.params.depth || 1,
          geomDef.params.widthSegments || 1,
          geomDef.params.heightSegments || 1,
          geomDef.params.depthSegments || 1,
        );
      case 'sphere':
        return new THREE.SphereGeometry(
          geomDef.params.radius || 1,
          geomDef.params.widthSegments || 16,
          geomDef.params.heightSegments || 12,
          geomDef.params.phiStart || 0,
          geomDef.params.phiLength || Math.PI * 2,
          geomDef.params.thetaStart || 0,
          geomDef.params.thetaLength || Math.PI,
        );
      case 'plane':
        return new THREE.PlaneGeometry(
          geomDef.params.width || 1,
          geomDef.params.height || 1,
          geomDef.params.widthSegments || 1,
          geomDef.params.heightSegments || 1,
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          geomDef.params.radiusTop || 1,
          geomDef.params.radiusBottom || 1,
          geomDef.params.height || 1,
          geomDef.params.radialSegments || 8,
          geomDef.params.heightSegments || 1,
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  // 创建光源
  private createThreeLight(dslLight: Light): THREE.Light | null {
    let light: THREE.Light;

    switch (dslLight.type) {
      case 'ambient':
        light = new THREE.AmbientLight(dslLight.color, dslLight.intensity);
        break;
      case 'directional': {
        light = new THREE.DirectionalLight(dslLight.color, dslLight.intensity);
        if (dslLight.position) {
          light.position.set(...dslLight.position);
        }
        if (dslLight.target) {
          light.lookAt(...dslLight.target);
        }
        // 启用阴影
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        break;
      }
      case 'point': {
        light = new THREE.PointLight(dslLight.color, dslLight.intensity);
        if (dslLight.position) {
          light.position.set(...dslLight.position);
        }
        if (dslLight.distance) {
          light.distance = dslLight.distance;
        }
        if (dslLight.decay) {
          light.decay = dslLight.decay;
        }
        light.castShadow = true;
        break;
      }
      case 'spot': {
        light = new THREE.SpotLight(dslLight.color, dslLight.intensity);
        if (dslLight.position) {
          light.position.set(...dslLight.position);
        }
        if (dslLight.target) {
          light.lookAt(...dslLight.target);
        }
        if (dslLight.distance) {
          light.distance = dslLight.distance;
        }
        if (dslLight.angle) {
          light.angle = dslLight.angle;
        }
        if (dslLight.penumbra) {
          light.penumbra = dslLight.penumbra;
        }
        if (dslLight.decay) {
          light.decay = dslLight.decay;
        }
        light.castShadow = true;
        break;
      }
      default:
        return null;
    }

    return light;
  }

  // 更新光源
  private updateThreeLight(threeLight: THREE.Light, dslLight: Light) {
    threeLight.color.set(dslLight.color);
    threeLight.intensity = dslLight.intensity;

    if (dslLight.position && 'position' in threeLight) {
      threeLight.position.set(...dslLight.position);
    }

    if (dslLight.target && 'lookAt' in threeLight) {
      (threeLight as any).lookAt(...dslLight.target);
    }

    // 更新特定光源属性
    if (threeLight instanceof THREE.PointLight || threeLight instanceof THREE.SpotLight) {
      if (dslLight.distance !== undefined) {
        threeLight.distance = dslLight.distance;
      }
      if (dslLight.decay !== undefined) {
        threeLight.decay = dslLight.decay;
      }
    }

    if (threeLight instanceof THREE.SpotLight) {
      if (dslLight.angle !== undefined) {
        threeLight.angle = dslLight.angle;
      }
      if (dslLight.penumbra !== undefined) {
        threeLight.penumbra = dslLight.penumbra;
      }
    }
  }

  // 同步相机
  private syncCamera(dslCamera: Camera) {
    if (dslCamera.type === 'perspective' && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = dslCamera.fov || 75;
      this.camera.aspect = dslCamera.aspect || 1;
      this.camera.near = dslCamera.near || 0.1;
      this.camera.far = dslCamera.far || 1000;
    } else if (
      dslCamera.type === 'orthographic' &&
      this.camera instanceof THREE.OrthographicCamera
    ) {
      this.camera.left = dslCamera.left || -10;
      this.camera.right = dslCamera.right || 10;
      this.camera.top = dslCamera.top || 10;
      this.camera.bottom = dslCamera.bottom || -10;
      this.camera.near = dslCamera.near || 0.1;
      this.camera.far = dslCamera.far || 1000;
    }

    this.camera.position.set(...dslCamera.position);
    this.camera.lookAt(...dslCamera.target);
    this.camera.updateProjectionMatrix();
  }

  // 同步环境
  private syncEnvironment(environment: TripoScene['environment']) {
    if (environment.background) {
      this.scene.background = new THREE.Color(environment.background);
    }
  }

  // 获取材质
  private getMaterial(materialId?: string): THREE.Material | null {
    if (!materialId) return null;
    return this.materialMap.get(materialId) || null;
  }

  // 开始渲染循环
  private startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  // 渲染
  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // 公共方法
  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = width / height;
      this.camera.left = -10 * aspect;
      this.camera.right = 10 * aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  // 获取ThreeJS场景（用于添加控制器等）
  getThreeScene(): THREE.Scene {
    return this.scene;
  }

  getThreeCamera(): THREE.Camera {
    return this.camera;
  }

  getThreeRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  // 设置控制器
  setControls(controls: any) {
    this.controls = controls;
  }

  // 清理资源
  private disposeObject(object: THREE.Object3D) {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else if (object.material) {
        object.material.dispose();
      }
    }

    object.children.forEach((child) => this.disposeObject(child));
  }

  // 销毁渲染器
  dispose() {
    // 停止渲染循环
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // 清理所有对象
    this.objectMap.forEach((obj) => this.disposeObject(obj));
    this.objectMap.clear();

    // 清理材质
    this.materialMap.forEach((material) => material.dispose());
    this.materialMap.clear();

    // 清理光源
    this.lightMap.clear();

    // 清理渲染器
    this.renderer.dispose();

    // 清理控制器
    if (this.controls && this.controls.dispose) {
      this.controls.dispose();
    }
  }
}
