// ThreeJS渲染器 - 监听DSL状态变化并自动同步到ThreeJS场景
import type { BufferGeometry, Camera, Light, Material, Scene, WebGLRenderer } from 'three';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  SphereGeometry,
  SpotLight,
} from 'three';
import type { DSLEngine } from './engine';
import {
  type DSLCamera,
  type DSLLight,
  type DSLMaterial,
  type DSLScene,
  type MaterialInline,
  type SceneObject,
} from './types';

export class DSLRenderer {
  private scene!: Scene;
  private camera!: Camera;
  private renderer!: WebGLRenderer;
  private engine: DSLEngine;

  // 对象映射表 - DSL对象ID到ThreeJS对象
  private objectMap = new Map<string, Object3D>();
  private materialMap = new Map<string, Material>();
  private lightMap = new Map<string, Light>();

  // 控制器
  private controls?: unknown;

  constructor(r3fContext: any, engine: DSLEngine) {
    this.engine = engine;
    this.setupThreeJS(r3fContext);
    this.setupSceneSync();
  }

  private setupThreeJS(r3fContext: any) {
    // 从r3f获取ThreeJS对象
    this.scene = r3fContext.scene;
    this.camera = r3fContext.camera;
    this.renderer = r3fContext.gl;

    // 基础设置
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // 设置初始相机位置（如果还没有设置）
    if (this.camera.position.length() === 0) {
      this.camera.position.set(5, 5, 5);
      this.camera.lookAt(0, 0, 0);
    }
  }

  private setupSceneSync() {
    // 监听DSL状态变化
    this.engine.subscribe((dslScene: DSLScene) => {
      this.syncScene(dslScene);
    });

    // 初始同步
    this.syncScene(this.engine.getScene());
  }

  // 同步DSL场景到ThreeJS场景
  private syncScene(dslScene: DSLScene) {
    // 同步材质（优先级最高，对象可能依赖材质）
    this.syncMaterials(dslScene.materials);

    // 同步对象
    this.syncObjects(dslScene.objects);

    // 同步光源
    this.syncLights(dslScene.lights);

    // 同步相机
    this.syncCamera(dslScene.camera);

    // 同步环境
    this.syncEnvironment(dslScene.environment);
  }

  // 同步材质
  private syncMaterials(materials: DSLMaterial[]) {
    const currentIds = new Set(materials.map((mat) => (mat as any).id).filter(Boolean));
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
    materials.forEach((dslMaterial) => {
      const matId = (dslMaterial as any).id;
      if (!matId) return;

      let threeMaterial = this.materialMap.get(matId);

      if (!threeMaterial) {
        // 创建新材质
        threeMaterial = this.createThreeMaterial(dslMaterial as MaterialInline);
        this.materialMap.set(matId, threeMaterial);
      } else {
        // 更新现有材质
        this.updateThreeMaterial(threeMaterial, dslMaterial as MaterialInline);
      }
    });
  }

  // 同步对象
  private syncObjects(objects: SceneObject[]) {
    const currentIds = new Set(objects.map((obj) => obj.id));
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
    objects.forEach((dslObject) => {
      const threeObject = this.objectMap.get(dslObject.id);

      if (!threeObject) {
        // 创建新对象
        const newObject = this.createThreeObject(dslObject);
        if (newObject) {
          this.scene.add(newObject);
          this.objectMap.set(dslObject.id, newObject);
        }
      } else {
        // 更新现有对象
        this.updateThreeObject(threeObject, dslObject);
      }
    });
  }

  // 同步光源
  private syncLights(lights: DSLLight[]) {
    const currentIds = new Set(lights.map((light) => light.id));
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
    lights.forEach((dslLight) => {
      const threeLight = this.lightMap.get(dslLight.id);

      if (!threeLight) {
        // 创建新光源
        const newLight = this.createThreeLight(dslLight);
        if (newLight) {
          this.scene.add(newLight);
          this.lightMap.set(dslLight.id, newLight);
        }
      } else {
        // 更新现有光源
        this.updateThreeLight(threeLight, dslLight);
      }
    });
  }

  // 创建ThreeJS材质
  private createThreeMaterial(dslMaterial: MaterialInline): Material {
    let material: Material;

    switch (dslMaterial.type) {
      case 'wireframe':
        material = new MeshBasicMaterial({
          color: dslMaterial.color || '#ffffff',
          wireframe: true,
          transparent: (dslMaterial.opacity || 1) < 1,
          opacity: dslMaterial.opacity || 1,
        });
        break;
      case 'basic':
        material = new MeshBasicMaterial({
          color: dslMaterial.color || '#ffffff',
          transparent: (dslMaterial.opacity || 1) < 1,
          opacity: dslMaterial.opacity || 1,
        });
        break;
      case 'standard':
      default:
        material = new MeshStandardMaterial({
          color: dslMaterial.color || '#ffffff',
          metalness: dslMaterial.metalness || 0,
          roughness: dslMaterial.roughness || 0.5,
          transparent: (dslMaterial.opacity || 1) < 1,
          opacity: dslMaterial.opacity || 1,
        });
        break;
    }

    return material;
  }

  // 更新ThreeJS材质
  private updateThreeMaterial(threeMaterial: Material, dslMaterial: MaterialInline) {
    if (threeMaterial instanceof MeshStandardMaterial) {
      threeMaterial.color.set(dslMaterial.color || '#ffffff');
      threeMaterial.metalness = dslMaterial.metalness || 0;
      threeMaterial.roughness = dslMaterial.roughness || 0.5;
      threeMaterial.opacity = dslMaterial.opacity || 1;
      threeMaterial.transparent = (dslMaterial.opacity || 1) < 1;
    } else if (threeMaterial instanceof MeshBasicMaterial) {
      threeMaterial.color.set(dslMaterial.color || '#ffffff');
      threeMaterial.opacity = dslMaterial.opacity || 1;
      threeMaterial.transparent = (dslMaterial.opacity || 1) < 1;
    }

    threeMaterial.needsUpdate = true;
  }

  // 创建ThreeJS对象
  private createThreeObject(dslObject: SceneObject): Object3D | undefined {
    let object: Object3D;

    switch (dslObject.type) {
      case 'mesh': {
        const geometry = this.createGeometry(dslObject.geometry);
        const material = this.getMaterial(dslObject.material) || new MeshStandardMaterial();
        object = new Mesh(geometry, material);
        break;
      }
      case 'group': {
        object = new Group();
        break;
      }
      default: {
        object = new Object3D();
        break;
      }
    }

    // 设置基础属性
    object.name = dslObject.name;
    this.updateThreeObject(object, dslObject);

    return object;
  }

  // 更新ThreeJS对象
  private updateThreeObject(threeObject: Object3D, dslObject: SceneObject) {
    // 更新变换
    const { position, rotation, scale } = dslObject.transform;
    if (position) {
      if (Array.isArray(position)) {
        threeObject.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
      } else {
        threeObject.position.copy(position);
      }
    }
    if (rotation) {
      if (Array.isArray(rotation)) {
        threeObject.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
      } else {
        threeObject.rotation.setFromVector3(rotation);
      }
    }
    if (scale) {
      if (Array.isArray(scale)) {
        threeObject.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1);
      } else {
        threeObject.scale.copy(scale);
      }
    }

    // 更新属性
    threeObject.visible = dslObject.visible ?? true;
    threeObject.castShadow = dslObject.castShadow ?? false;
    threeObject.receiveShadow = dslObject.receiveShadow ?? false;
    threeObject.name = dslObject.name;

    // 更新材质
    if (threeObject instanceof Mesh && dslObject.material) {
      const material = this.getMaterial(dslObject.material);
      if (material) {
        threeObject.material = material;
      }
    }
  }

  // 创建几何体
  private createGeometry(geomDef?: SceneObject['geometry']): BufferGeometry {
    if (!geomDef) return new BoxGeometry(1, 1, 1);

    // 处理几何体引用
    if ('id' in geomDef) {
      // 这里应该从某个几何体库中获取，暂时返回默认
      return new BoxGeometry(1, 1, 1);
    }

    // 处理内联几何体定义
    const geom = geomDef as any;
    switch (geom.type) {
      case 'box':
        return new BoxGeometry(
          geom.size?.[0] || 1,
          geom.size?.[1] || 1,
          geom.size?.[2] || 1,
          geom.segments?.[0] || 1,
          geom.segments?.[1] || 1,
          1,
        );
      case 'sphere':
        return new SphereGeometry(
          geom.radius || 1,
          geom.radialSegments || 16,
          geom.heightSegments || 12,
          0,
          Math.PI * 2,
          0,
          Math.PI,
        );
      case 'plane':
        return new PlaneGeometry(
          geom.size?.[0] || 1,
          geom.size?.[1] || 1,
          geom.segments?.[0] || 1,
          geom.segments?.[1] || 1,
        );
      case 'cylinder':
        return new CylinderGeometry(
          geom.radius || 1,
          geom.radius || 1,
          geom.height || 1,
          geom.radialSegments || 8,
          geom.heightSegments || 1,
        );
      default:
        return new BoxGeometry(1, 1, 1);
    }
  }

  // 创建光源
  private createThreeLight(
    dslLight: DSLLight,
  ): Light | AmbientLight | DirectionalLight | PointLight | SpotLight {
    let light: Light | AmbientLight | DirectionalLight | PointLight | SpotLight;

    switch (dslLight.type) {
      case 'ambient':
        light = new AmbientLight(dslLight.color || '#ffffff', dslLight.intensity || 1);
        break;
      case 'directional': {
        light = new DirectionalLight(dslLight.color || '#ffffff', dslLight.intensity || 1);
        if (dslLight.position) {
          if (Array.isArray(dslLight.position)) {
            light.position.set(
              dslLight.position[0] || 0,
              dslLight.position[1] || 0,
              dslLight.position[2] || 0,
            );
          } else {
            light.position.copy(dslLight.position);
          }
        }
        if (dslLight.target) {
          if (Array.isArray(dslLight.target)) {
            light.lookAt(dslLight.target[0] || 0, dslLight.target[1] || 0, dslLight.target[2] || 0);
          } else {
            light.lookAt(dslLight.target);
          }
        }
        // 启用阴影
        light.castShadow = true;
        if (light.shadow) {
          light.shadow.mapSize.width = 2048;
          light.shadow.mapSize.height = 2048;
        }
        break;
      }
      case 'point': {
        const pointLight = new PointLight(dslLight.color || '#ffffff', dslLight.intensity || 1);
        if (dslLight.position) {
          if (Array.isArray(dslLight.position)) {
            pointLight.position.set(
              dslLight.position[0] || 0,
              dslLight.position[1] || 0,
              dslLight.position[2] || 0,
            );
          } else {
            pointLight.position.copy(dslLight.position);
          }
        }
        if (dslLight.distance !== undefined) {
          pointLight.distance = dslLight.distance;
        }
        if (dslLight.decay !== undefined) {
          pointLight.decay = dslLight.decay;
        }
        pointLight.castShadow = true;
        light = pointLight;
        break;
      }
      case 'spot': {
        const spotLight = new SpotLight(dslLight.color || '#ffffff', dslLight.intensity || 1);
        if (dslLight.position) {
          if (Array.isArray(dslLight.position)) {
            spotLight.position.set(
              dslLight.position[0] || 0,
              dslLight.position[1] || 0,
              dslLight.position[2] || 0,
            );
          } else {
            spotLight.position.copy(dslLight.position);
          }
        }
        if (dslLight.target) {
          if (Array.isArray(dslLight.target)) {
            spotLight.lookAt(
              dslLight.target[0] || 0,
              dslLight.target[1] || 0,
              dslLight.target[2] || 0,
            );
          } else {
            spotLight.lookAt(dslLight.target);
          }
        }
        if (dslLight.distance !== undefined) {
          spotLight.distance = dslLight.distance;
        }
        if (dslLight.angle !== undefined) {
          spotLight.angle = dslLight.angle;
        }
        if (dslLight.penumbra !== undefined) {
          spotLight.penumbra = dslLight.penumbra;
        }
        if (dslLight.decay !== undefined) {
          spotLight.decay = dslLight.decay;
        }
        spotLight.castShadow = true;
        light = spotLight;
        break;
      }
      default:
        return new AmbientLight(dslLight.color || '#ffffff', dslLight.intensity || 1);
    }

    return light;
  }

  // 更新光源
  private updateThreeLight(threeLight: Light, dslLight: DSLLight) {
    threeLight.color.set(dslLight.color || '#ffffff');
    threeLight.intensity = dslLight.intensity || 1;

    if (dslLight.position && 'position' in threeLight) {
      if (Array.isArray(dslLight.position)) {
        threeLight.position.set(
          dslLight.position[0] || 0,
          dslLight.position[1] || 0,
          dslLight.position[2] || 0,
        );
      } else {
        threeLight.position.copy(dslLight.position);
      }
    }

    if (dslLight.target && 'lookAt' in threeLight) {
      if (Array.isArray(dslLight.target)) {
        (threeLight as any).lookAt(
          dslLight.target[0] || 0,
          dslLight.target[1] || 0,
          dslLight.target[2] || 0,
        );
      } else {
        (threeLight as any).lookAt(dslLight.target);
      }
    }

    // 更新特定光源属性
    if (threeLight instanceof PointLight || threeLight instanceof SpotLight) {
      if (dslLight.distance !== undefined) {
        threeLight.distance = dslLight.distance;
      }
      if (dslLight.decay !== undefined) {
        threeLight.decay = dslLight.decay;
      }
    }

    if (threeLight instanceof SpotLight) {
      if (dslLight.angle !== undefined) {
        threeLight.angle = dslLight.angle;
      }
      if (dslLight.penumbra !== undefined) {
        threeLight.penumbra = dslLight.penumbra;
      }
    }
  }

  // 同步相机
  private syncCamera(dslCamera: DSLCamera) {
    if (dslCamera.type === 'perspective' && this.camera instanceof PerspectiveCamera) {
      this.camera.fov = dslCamera.fov || 75;
      this.camera.aspect = dslCamera.aspect || 1;
      this.camera.near = dslCamera.near || 0.1;
      this.camera.far = dslCamera.far || 1000;
    } else if (dslCamera.type === 'orthographic' && this.camera instanceof OrthographicCamera) {
      this.camera.left = dslCamera.left || -10;
      this.camera.right = dslCamera.right || 10;
      this.camera.top = dslCamera.top || 10;
      this.camera.bottom = dslCamera.bottom || -10;
      this.camera.near = dslCamera.near || 0.1;
      this.camera.far = dslCamera.far || 1000;
    }

    if (Array.isArray(dslCamera.position)) {
      this.camera.position.set(
        dslCamera.position[0] || 0,
        dslCamera.position[1] || 0,
        dslCamera.position[2] || 0,
      );
    } else {
      this.camera.position.copy(dslCamera.position);
    }

    if (Array.isArray(dslCamera.target)) {
      this.camera.lookAt(
        dslCamera.target[0] || 0,
        dslCamera.target[1] || 0,
        dslCamera.target[2] || 0,
      );
    } else {
      this.camera.lookAt(dslCamera.target);
    }

    if ('updateProjectionMatrix' in this.camera) {
      (this.camera as any).updateProjectionMatrix();
    }
  }

  // 同步环境
  private syncEnvironment(environment: DSLScene['environment']) {
    if (environment?.background?.color) {
      this.scene.background = new Color(environment.background.color);
    }
  }

  // 获取材质
  private getMaterial(material?: DSLMaterial): Material | null {
    if (!material) return null;

    if ('id' in material) {
      const id = material.id;
      if (!id) return null;
      return this.materialMap.get(id) || null;
    }

    // 为内联材质创建临时材质
    return this.createThreeMaterial(material as MaterialInline);
  }

  // 公共方法
  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof OrthographicCamera) {
      const aspect = width / height;
      this.camera.left = -10 * aspect;
      this.camera.right = 10 * aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  // 获取ThreeJS场景（用于添加控制器等）
  getThreeScene(): Scene {
    return this.scene;
  }

  getThreeCamera(): Camera {
    return this.camera;
  }

  getThreeRenderer(): WebGLRenderer {
    return this.renderer;
  }

  // 设置控制器
  setControls(controls: any) {
    this.controls = controls;
  }

  // 清理资源
  private disposeObject(object: Object3D) {
    if (object instanceof Mesh) {
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
