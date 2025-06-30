// 工作区专属DSL扩展系统
import * as THREE from 'three';
import type {
  Bone,
  BoneWeight,
  DSLAPI,
  GeneratedModel,
  MaterialInline,
  SceneObject,
  WorkspaceType,
} from '../types/core';
import type { LoadResult } from './loader';

// Generate工作区扩展
export class GenerateWorkspaceExtension {
  constructor(private api: DSLAPI) {}

  // 加载生成的模型到场景
  async loadGeneratedModel(
    model: GeneratedModel,
    options?: {
      position?: THREE.Vector3;
      autoCenter?: boolean;
      autoScale?: boolean;
      replaceExisting?: boolean;
    },
  ): Promise<string> {
    const {
      // position = new THREE.Vector3(0, 0, 0),
      autoCenter = true,
      autoScale = true,
      replaceExisting = false,
    } = options || {};

    try {
      // 动态导入模型加载器
      const { loadModelToScene, integrateLoadResult } = await import('./loader');

      // 加载模型
      const loadResult = await loadModelToScene(model.url, {
        center: autoCenter,
        scale: autoScale ? this.calculateOptimalScale(loadResult) : 1,
        extractMaterials: true,
        extractLights: false, // Generate工作区通常不需要导入光源
      });

      // 集成到场景
      const currentScene = this.api.io.export();
      const newScene = integrateLoadResult(currentScene, loadResult, {
        prefix: `gen_${model.id}_`,
        replaceExisting,
      });

      // 应用场景
      this.api.io.import(newScene);

      // 选择新加载的对象
      const newObjectIds = loadResult.objects.map((obj) => `gen_${model.id}_${obj.id}`);
      this.api.selection.select(newObjectIds);

      return newObjectIds[0]; // 返回主对象ID
    } catch (error) {
      console.error('加载生成模型失败:', error);
      throw error;
    }
  }

  // 计算最佳缩放比例
  private calculateOptimalScale(loadResult: LoadResult): number {
    if (!loadResult.metadata) return 1;

    // 基于多边形数量判断合适的缩放
    const polyCount = loadResult.metadata.polyCount;
    if (polyCount > 100000) return 0.5;
    if (polyCount > 50000) return 0.7;
    return 1;
  }

  // 设置生成展示环境
  setupShowcaseEnvironment(): void {
    const scene = this.api.io.export();

    // 优化的生成展示环境
    scene.environment = {
      background: { type: 'color', color: '#f8f9fa' },
      shadows: {
        enabled: true,
        type: 'pcfsoft',
        mapSize: 2048,
      },
    };

    // 专用灯光设置
    scene.lights = [
      {
        id: 'generate_ambient',
        name: '环境光',
        type: 'ambient',
        color: '#ffffff',
        intensity: 0.3,
      },
      {
        id: 'generate_key',
        name: '主光源',
        type: 'directional',
        color: '#ffffff',
        intensity: 1.2,
        position: new THREE.Vector3(5, 8, 3),
        target: new THREE.Vector3(0, 0, 0),
        castShadow: true,
      },
      {
        id: 'generate_fill',
        name: '补光',
        type: 'point',
        color: '#fff8e1',
        intensity: 0.6,
        position: new THREE.Vector3(-3, 4, 2),
        distance: 20,
      },
    ];

    this.api.io.import(scene);
  }

  // 创建预览网格
  createPreviewGrid(size: number = 10, divisions: number = 20): string {
    const gridObject: SceneObject = {
      id: `generate_grid_${Date.now()}`,
      name: '预览网格',
      type: 'helper',
      transform: {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(-Math.PI / 2, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
      },
      userData: {
        isGrid: true,
        size,
        divisions,
      },
    };

    return this.api.scene.add(gridObject);
  }

  // 批量处理生成结果
  batchProcessModels(
    models: GeneratedModel[],
    processor: (model: GeneratedModel, index: number) => Promise<void>,
  ): Promise<void[]> {
    return Promise.all(models.map(processor));
  }
}

// Texture工作区扩展
export class TextureWorkspaceExtension {
  constructor(private api: DSLAPI) {}

  // 创建纹理绘制表面
  createPaintingSurface(objectId: string): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    applyToObject: () => void;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;

    // 填充白色背景
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    return {
      canvas,
      context,
      applyToObject: () => {
        // 将画布转换为纹理并应用到对象
        const dataURL = canvas.toDataURL();
        const material: MaterialInline = {
          type: 'standard',
          map: dataURL,
          color: '#ffffff',
        };

        const materialId = this.api.materials.create(material);
        this.api.materials.apply([objectId], materialId);
      },
    };
  }

  // 应用程序化纹理
  applyProceduralTexture(
    objectIds: string[],
    type: 'noise' | 'gradient' | 'checker' | 'wood',
    params: Record<string, any> = {},
  ): void {
    const material = this.generateProceduralMaterial(type, params);
    const materialId = this.api.materials.create(material);
    this.api.materials.apply(objectIds, materialId);
  }

  // 生成程序化材质
  private generateProceduralMaterial(type: string, params: Record<string, any>): MaterialInline {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    switch (type) {
      case 'noise':
        this.generateNoiseTexture(ctx, canvas.width, canvas.height, params);
        break;
      case 'gradient':
        this.generateGradientTexture(ctx, canvas.width, canvas.height, params);
        break;
      case 'checker':
        this.generateCheckerTexture(ctx, canvas.width, canvas.height, params);
        break;
      case 'wood':
        this.generateWoodTexture(ctx, canvas.width, canvas.height, params);
        break;
      default:
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return {
      type: 'standard',
      map: canvas.toDataURL(),
      roughness: params.roughness || 0.5,
      metalness: params.metalness || 0,
    };
  }

  private generateNoiseTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    // params: any,
  ): void {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    // const scale = params.scale || 0.1;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      const value = Math.floor(noise * 255);
      data[i] = value; // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private generateGradientTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: any,
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, params.colorStart || '#000000');
    gradient.addColorStop(1, params.colorEnd || '#ffffff');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private generateCheckerTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: any,
  ): void {
    const size = params.size || 32;
    const colorA = params.colorA || '#ffffff';
    const colorB = params.colorB || '#000000';

    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        const isEven = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
        ctx.fillStyle = isEven ? colorA : colorB;
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  private generateWoodTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: any,
  ): void {
    // 简化的木纹纹理生成
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width / 2,
    );
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.5, '#A0522D');
    gradient.addColorStop(1, '#654321');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 材质混合
  blendMaterials(
    materialIds: string[],
    blendMode: 'multiply' | 'add' | 'overlay' = 'multiply',
  ): string {
    // 实现材质混合逻辑
    const blendedMaterial: MaterialInline = {
      type: 'standard',
      color: '#ffffff',
      // 这里应该实现真正的材质混合算法
    };

    return this.api.materials.create(blendedMaterial);
  }
}

// Rigging工作区扩展
export class RiggingWorkspaceExtension {
  constructor(private api: DSLAPI) {}

  // 创建骨骼系统
  createBoneSystem(
    rootObjectId: string,
    boneConfig: {
      type: 'biped' | 'quadruped' | 'custom';
      bones: Partial<Bone>[];
    },
  ): string[] {
    const boneIds: string[] = [];

    boneConfig.bones.forEach((boneData, index) => {
      const bone: SceneObject = {
        id: `bone_${rootObjectId}_${index}`,
        name: boneData.name || `Bone_${index}`,
        type: 'helper',
        transform: {
          position: new THREE.Vector3().fromArray(boneData.position || [0, 0, 0]),
          rotation: new THREE.Vector3().fromArray(boneData.rotation || [0, 0, 0]),
          scale: new THREE.Vector3(1, 1, 1),
        },
        parent: boneData.parent,
        userData: {
          isBone: true,
          boneIndex: index,
        },
      };

      const boneId = this.api.scene.add(bone);
      boneIds.push(boneId);
    });

    return boneIds;
  }

  // 绑定骨骼权重
  bindBoneWeights(meshId: string, weights: { vertexId: string; weights: BoneWeight[] }[]): void {
    const mesh = this.api.scene.get(meshId);
    if (!mesh) return;

    // 存储权重信息到userData
    mesh.userData.boneWeights = weights;
    this.api.scene.update(meshId, { userData: mesh.userData });
  }

  // 创建IK约束
  createIKConstraint(
    targetBoneId: string,
    effectorBoneId: string,
    chainLength: number = 2,
  ): string {
    const constraint: SceneObject = {
      id: `ik_${targetBoneId}_${effectorBoneId}`,
      name: `IK约束`,
      type: 'helper',
      transform: {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
      },
      userData: {
        isIKConstraint: true,
        targetBone: targetBoneId,
        effectorBone: effectorBoneId,
        chainLength,
      },
    };

    return this.api.scene.add(constraint);
  }

  // 应用预设骨骼配置
  applyBonePreset(objectId: string, presetType: 'humanoid' | 'quadruped' | 'bird'): void {
    const presets = this.getBonePresets();
    const preset = presets[presetType];

    if (preset) {
      this.createBoneSystem(objectId, preset);
    }
  }

  private getBonePresets(): Record<string, any> {
    return {
      humanoid: {
        type: 'biped',
        bones: [
          { name: 'Root', position: [0, 0, 0] },
          { name: 'Spine', position: [0, 1, 0], parent: 'Root' },
          { name: 'Chest', position: [0, 1.5, 0], parent: 'Spine' },
          { name: 'Head', position: [0, 2, 0], parent: 'Chest' },
          { name: 'LeftArm', position: [-0.5, 1.8, 0], parent: 'Chest' },
          { name: 'RightArm', position: [0.5, 1.8, 0], parent: 'Chest' },
          { name: 'LeftLeg', position: [-0.3, 0, 0], parent: 'Root' },
          { name: 'RightLeg', position: [0.3, 0, 0], parent: 'Root' },
        ],
      },
      quadruped: {
        type: 'quadruped',
        bones: [
          { name: 'Root', position: [0, 1, 0] },
          { name: 'Spine1', position: [0, 1, 0.5], parent: 'Root' },
          { name: 'Spine2', position: [0, 1, 1], parent: 'Spine1' },
          { name: 'Head', position: [0, 1.2, 1.5], parent: 'Spine2' },
          { name: 'FrontLeftLeg', position: [-0.3, 1, 1], parent: 'Spine2' },
          { name: 'FrontRightLeg', position: [0.3, 1, 1], parent: 'Spine2' },
          { name: 'BackLeftLeg', position: [-0.3, 1, 0], parent: 'Root' },
          { name: 'BackRightLeg', position: [0.3, 1, 0], parent: 'Root' },
        ],
      },
    };
  }
}

// Segmentation工作区扩展
export class SegmentationWorkspaceExtension {
  constructor(private api: DSLAPI) {}

  // 分割网格
  segmentMesh(
    meshId: string,
    segmentations: {
      name: string;
      vertices: number[];
      faces: number[];
    }[],
  ): string[] {
    const segmentIds: string[] = [];
    const originalMesh = this.api.scene.get(meshId);

    if (!originalMesh) return segmentIds;

    segmentations.forEach((segment, index) => {
      const segmentObject: SceneObject = {
        id: `${meshId}_segment_${index}`,
        name: segment.name,
        type: 'mesh',
        geometry: {
          type: 'model', // 自定义几何体
          // 这里应该包含分割后的几何体数据
        },
        material: originalMesh.material,
        transform: { ...originalMesh.transform },
        parent: meshId,
        userData: {
          isSegment: true,
          originalMesh: meshId,
          vertices: segment.vertices,
          faces: segment.faces,
        },
      };

      const segmentId = this.api.scene.add(segmentObject);
      segmentIds.push(segmentId);
    });

    // 隐藏原始网格
    this.api.scene.update(meshId, { visible: false });

    return segmentIds;
  }

  // 合并分割
  mergeSegments(segmentIds: string[]): string | null {
    if (segmentIds.length === 0) return null;

    const segments = segmentIds.map((id) => this.api.scene.get(id)).filter(Boolean);
    if (segments.length === 0) return null;

    const firstSegment = segments[0];
    const originalMeshId = firstSegment.userData?.originalMesh;

    if (originalMeshId) {
      // 显示原始网格
      this.api.scene.update(originalMeshId, { visible: true });

      // 删除分割
      segmentIds.forEach((id) => this.api.scene.remove(id));

      return originalMeshId;
    }

    return null;
  }

  // 应用颜色编码
  applyColorCoding(segmentIds: string[], colors?: string[]): void {
    const defaultColors = [
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#ffeaa7',
      '#dda0dd',
      '#98d8c8',
      '#f7dc6f',
    ];

    segmentIds.forEach((id, index) => {
      const color = colors?.[index] || defaultColors[index % defaultColors.length];

      const material: MaterialInline = {
        type: 'standard',
        color,
        opacity: 0.8,
        transparent: true,
      };

      const materialId = this.api.materials.create(material);
      this.api.materials.apply([id], materialId);
    });
  }

  // 分析网格复杂度
  analyzeMeshComplexity(meshId: string): {
    vertexCount: number;
    faceCount: number;
    complexity: 'low' | 'medium' | 'high';
    recommendedSegments: number;
  } {
    const mesh = this.api.scene.get(meshId);

    // 这里应该分析实际的几何体数据
    // 现在返回模拟数据
    const vertexCount = 10000; // 应该从实际几何体获取
    const faceCount = 20000; // 应该从实际几何体获取

    let complexity: 'low' | 'medium' | 'high' = 'low';
    let recommendedSegments = 1;

    if (faceCount > 50000) {
      complexity = 'high';
      recommendedSegments = 8;
    } else if (faceCount > 10000) {
      complexity = 'medium';
      recommendedSegments = 4;
    } else {
      complexity = 'low';
      recommendedSegments = 2;
    }

    return {
      vertexCount,
      faceCount,
      complexity,
      recommendedSegments,
    };
  }
}

// 工作区扩展管理器
export class WorkspaceExtensionManager {
  private extensions: Map<WorkspaceType, any> = new Map();

  constructor(private api: DSLAPI) {
    this.initializeExtensions();
  }

  private initializeExtensions(): void {
    this.extensions.set('generate', new GenerateWorkspaceExtension(this.api));
    this.extensions.set('texture', new TextureWorkspaceExtension(this.api));
    this.extensions.set('rigging', new RiggingWorkspaceExtension(this.api));

    // 为Segmentation创建特殊的API扩展
    const segmentationAPI = {
      ...this.api,
      segmentation: new SegmentationWorkspaceExtension(this.api),
    };
  }

  getExtension<T>(workspaceType: WorkspaceType): T | null {
    return this.extensions.get(workspaceType) || null;
  }

  // 获取类型安全的扩展
  getGenerateExtension(): GenerateWorkspaceExtension | null {
    return this.getExtension<GenerateWorkspaceExtension>('generate');
  }

  getTextureExtension(): TextureWorkspaceExtension | null {
    return this.getExtension<TextureWorkspaceExtension>('texture');
  }

  getRiggingExtension(): RiggingWorkspaceExtension | null {
    return this.getExtension<RiggingWorkspaceExtension>('rigging');
  }
}
