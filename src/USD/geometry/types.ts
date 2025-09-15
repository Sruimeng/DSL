import type { SdfPath } from '../types';

// 几何体Prim类型
export type GeomPrimType =
  | 'Mesh'
  | 'Sphere'
  | 'Cube'
  | 'Cylinder'
  | 'Cone'
  | 'Capsule'
  | 'Plane'
  | 'Points'
  | 'Curves'
  | 'NurbsCurves'
  | 'BasisCurves';

// 网格属性
export interface MeshAttributes {
  points: number[]; // 顶点位置 [x,y,z, x,y,z, ...]
  faceVertexCounts: number[]; // 每个面的顶点数
  faceVertexIndices: number[]; // 面的顶点索引
  normals?: number[]; // 法线
  uvs?: number[]; // UV坐标
  colors?: number[]; // 顶点颜色
  velocities?: number[]; // 速度（用于运动模糊）
  accelerations?: number[]; // 加速度
  orientations?: number[]; // 朝向（四元数）
  scales?: number[]; // 缩放
  widths?: number[]; // 宽度（用于曲线、点云）
}

// 细分曲面设置
export interface SubdivisionScheme {
  scheme: 'none' | 'catmullClark' | 'loop' | 'bilinear';
  interpolateBoundary: 'none' | 'edgeAndCorner' | 'edgeOnly';
  faceVaryingLinearInterpolation: 'none' | 'cornersOnly' | 'cornersPlus1' | 'cornersPlus2' | 'boundaries' | 'all';
  creaseIndices?: number[];
  creaseLengths?: number[];
  creaseWeights?: number[];
  cornerIndices?: number[];
  cornerWeights?: number[];
  holeIndices?: number[];
}

// 网格Prim
export interface MeshPrim {
  path: SdfPath;
  typeName: 'Mesh';
  attributes: MeshAttributes;
  subdivision?: SubdivisionScheme;
  doubleSided: boolean;
  orientation: 'rightHanded' | 'leftHanded';
}

// 球体参数
export interface SphereParams {
  radius: number;
}

// 立方体参数
export interface CubeParams {
  size: number;
}

// 圆柱体参数
export interface CylinderParams {
  radius: number;
  height: number;
  axis: 'X' | 'Y' | 'Z';
}

// 圆锥体参数
export interface ConeParams {
  radius: number;
  height: number;
  axis: 'X' | 'Y' | 'Z';
}

// 胶囊体参数
export interface CapsuleParams {
  radius: number;
  height: number;
  axis: 'X' | 'Y' | 'Z';
}

// 平面参数
export interface PlaneParams {
  width: number;
  height: number;
  axis: 'X' | 'Y' | 'Z';
}

// 点云参数
export interface PointsParams {
  points: number[];
  widths?: number[];
  colors?: number[];
  normals?: number[];
  velocities?: number[];
}

// 曲线类型
export type CurveType = 'linear' | 'bezier' | 'bspline' | 'catmullRom';

// 曲线参数
export interface CurvesParams {
  type: CurveType;
  points: number[];
  curveVertexCounts: number[]; // 每条曲线的顶点数
  widths?: number[];
  normals?: number[];
  wrap: 'nonperiodic' | 'periodic' | 'pinned';
}

// 几何体工具函数
export interface GeometryUtils {
  // 计算边界框
  computeBoundingBox(attributes: MeshAttributes): {
    min: [number, number, number];
    max: [number, number, number];
  };
  
  // 计算法线
  computeNormals(attributes: MeshAttributes): number[];
  
  // 三角化
  triangulate(faceVertexCounts: number[], faceVertexIndices: number[]): number[];
  
  // 反转法线
  reverseNormals(normals: number[]): number[];
  
  // 变换顶点
  transformPoints(points: number[], matrix: number[]): number[];
  
  // 合并网格
  mergeMeshes(meshes: MeshAttributes[]): MeshAttributes;
  
  // 细分网格
  subdivideMesh(attributes: MeshAttributes, scheme: SubdivisionScheme): MeshAttributes;
  
  // 生成UV
  generateUVs(attributes: MeshAttributes, projection: 'spherical' | 'cylindrical' | 'planar' | 'cubic'): number[];
  
  // 优化网格
  optimizeMesh(attributes: MeshAttributes): MeshAttributes;
  
  // 检查网格有效性
  validateMesh(attributes: MeshAttributes): {
    isValid: boolean;
    errors: string[];
  };
}

// 几何体缓存键
export interface GeometryCacheKey {
  path: SdfPath;
  frame: number;
  lod: number;
}

// 几何体缓存值
export interface GeometryCacheValue {
  attributes: MeshAttributes;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  timestamp: number;
}

// 几何体导入/导出选项
export interface GeometryIOOptions {
  format: 'obj' | 'ply' | 'stl' | 'fbx' | 'gltf' | 'usd';
  includeNormals: boolean;
  includeUVs: boolean;
  includeColors: boolean;
  flipY: boolean;
  scale: number;
  axis: 'Y' | 'Z';
}

// 几何体统计信息
export interface GeometryStats {
  vertexCount: number;
  faceCount: number;
  triangleCount: number;
  edgeCount: number;
  componentCount: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  surfaceArea: number;
  volume: number;
}

// 网格拓扑信息
export interface MeshTopology {
  isManifold: boolean;
  isOrientable: boolean;
  isClosed: boolean;
  genus: number;
  boundaryCount: number;
  holeCount: number;
  componentCount: number;
}

// 几何体LOD级别
export interface LODLevel {
  level: number;
  vertexCount: number;
  faceCount: number;
  error: number;
  screenSize: number;
}

// 几何体简化选项
export interface SimplificationOptions {
  targetReduction: number; // 0-1，目标减少比例
  preserveTopology: boolean;
  preserveUVs: boolean;
  preserveNormals: boolean;
  preserveColors: boolean;
  preserveBoundaries: boolean;
  maxError: number;
}

// 几何体修复选项
export interface RepairOptions {
  removeDegenerateFaces: boolean;
  removeDuplicateVertices: boolean;
  fixOrientation: boolean;
  fillHoles: boolean;
  stitchBoundaries: boolean;
  makeManifold: boolean;
  maxHoleSize: number;
  mergeDistance: number;
}

// 几何体创建工厂
export interface GeometryFactory {
  createSphere(params: SphereParams): MeshAttributes;
  createCube(params: CubeParams): MeshAttributes;
  createCylinder(params: CylinderParams): MeshAttributes;
  createCone(params: ConeParams): MeshAttributes;
  createCapsule(params: CapsuleParams): MeshAttributes;
  createPlane(params: PlaneParams): MeshAttributes;
  createTorus(majorRadius: number, minorRadius: number): MeshAttributes;
  createIcoSphere(radius: number, subdivisions: number): MeshAttributes;
  createUVSphere(radius: number, segments: number): MeshAttributes;
  createGrid(size: number, divisions: number): MeshAttributes;
}

// 体素化选项
export interface VoxelizationOptions {
  resolution: number;
  fillInterior: boolean;
  conservative: boolean;
  generateShell: boolean;
  shellThickness: number;
}

// 体素化结果
export interface VoxelizationResult {
  voxels: boolean[];
  resolution: [number, number, number];
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  volume: number;
  surfaceVoxels: number;
  interiorVoxels: number;
}

// 网格变形器
export interface MeshDeformer {
  bend(mesh: MeshAttributes, angle: number, axis: 'X' | 'Y' | 'Z'): MeshAttributes;
  twist(mesh: MeshAttributes, angle: number, axis: 'X' | 'Y' | 'Z'): MeshAttributes;
  taper(mesh: MeshAttributes, factor: number, axis: 'X' | 'Y' | 'Z'): MeshAttributes;
  skew(mesh: MeshAttributes, angle: number, axis: 'X' | 'Y' | 'Z'): MeshAttributes;
  noise(mesh: MeshAttributes, amplitude: number, frequency: number): MeshAttributes;
}

// 网格选择集
export interface SelectionSet {
  name: string;
  vertices: Set<number>;
  edges: Set<number>;
  faces: Set<number>;
}

// 网格选择模式
export type SelectionMode = 'vertex' | 'edge' | 'face' | 'object';

// 选择工具
export interface SelectionTool {
  mode: SelectionMode;
  sets: SelectionSet[];
  activeSet: string | null;
  
  selectVertices(indices: number[]): void;
  selectEdges(indices: number[]): void;
  selectFaces(indices: number[]): void;
  growSelection(): void;
  shrinkSelection(): void;
  invertSelection(): void;
  loopSelect(): void;
  ringSelect(): void;
  boundarySelect(): void;
  floodSelect(): void;
  saveSelection(name: string): void;
  loadSelection(name: string): void;
  clearSelection(): void;
  getSelectedVertices(): number[];
  getSelectedEdges(): number[];
  getSelectedFaces(): number[];
}

// 几何体动画数据
export interface GeometryAnimation {
  times: number[];
  points: number[][]; // 每帧的点数据
  normals?: number[][][];
  colors?: number[][][];
  velocities?: number[][][];
  widths?: number[][][];
}

// 几何体缓存管理
export interface GeometryCache {
  set(key: GeometryCacheKey, value: GeometryCacheValue): void;
  get(key: GeometryCacheKey): GeometryCacheValue | null;
  has(key: GeometryCacheKey): boolean;
  delete(key: GeometryCacheKey): boolean;
  clear(): void;
  getStats(): {
    size: number;
    memoryUsage: number;
    hitRate: number;
    missRate: number;
  };
  setMaxSize(size: number): void;
  setMaxAge(age: number): void;
  prune(): void;
}

// 几何体导入器
export interface GeometryImporter {
  canImport(filePath: string): boolean;
  import(filePath: string, options?: Partial<GeometryIOOptions>): Promise<MeshAttributes>;
  getSupportedFormats(): string[];
  getImportOptions(): Record<string, any>;
}

// 几何体导出器
export interface GeometryExporter {
  canExport(filePath: string): boolean;
  export(attributes: MeshAttributes, filePath: string, options?: Partial<GeometryIOOptions>): Promise<void>;
  getSupportedFormats(): string[];
  getExportOptions(): Record<string, any>;
}

// 几何体处理管道
export interface GeometryPipeline {
  steps: GeometryPipelineStep[];
  
  addStep(step: GeometryPipelineStep): void;
  removeStep(index: number): void;
  moveStep(from: number, to: number): void;
  clear(): void;
  process(attributes: MeshAttributes): MeshAttributes;
  validate(): boolean;
}

// 几何体处理步骤
export interface GeometryPipelineStep {
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  
  process(attributes: MeshAttributes): MeshAttributes;
  validateParameters(): boolean;
  getRequiredAttributes(): string[];
  getOutputAttributes(): string[];
}

// 几何体查询
export interface GeometryQuery {
  findBoundaryEdges(attributes: MeshAttributes): number[];
  findBoundaryVertices(attributes: MeshAttributes): number[];
  findConnectedComponents(attributes: MeshAttributes): number[][];
  findDegenerateFaces(attributes: MeshAttributes): number[];
  findDuplicateVertices(attributes: MeshAttributes, tolerance: number): number[][];
  findNonManifoldEdges(attributes: MeshAttributes): number[];
  findHoles(attributes: MeshAttributes): number[][];
  findSharpEdges(attributes: MeshAttributes, angle: number): number[];
  findUVSeams(attributes: MeshAttributes): number[];
  findOverlappingUVs(attributes: MeshAttributes): number[];
}

// 几何体工具类默认实现
export class DefaultGeometryUtils implements GeometryUtils {
  computeBoundingBox(attributes: MeshAttributes): {
    min: [number, number, number];
    max: [number, number, number];
  } {
    const points = attributes.points;
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    
    for (let i = 0; i < points.length; i += 3) {
      const x = points[i];
      const y = points[i + 1];
      const z = points[i + 2];
      
      min[0] = Math.min(min[0], x);
      min[1] = Math.min(min[1], y);
      min[2] = Math.min(min[2], z);
      
      max[0] = Math.max(max[0], x);
      max[1] = Math.max(max[1], y);
      max[2] = Math.max(max[2], z);
    }
    
    return { min, max };
  }
  
  computeNormals(attributes: MeshAttributes): number[] {
    const points = attributes.points;
    const faceVertexCounts = attributes.faceVertexCounts;
    const faceVertexIndices = attributes.faceVertexIndices;
    const normals = new Array(points.length).fill(0);
    
    let vertexIndex = 0;
    for (let faceIndex = 0; faceIndex < faceVertexCounts.length; faceIndex++) {
      const count = faceVertexCounts[faceIndex];
      
      if (count >= 3) {
        // 获取面的前三个顶点
        const i0 = faceVertexIndices[vertexIndex] * 3;
        const i1 = faceVertexIndices[vertexIndex + 1] * 3;
        const i2 = faceVertexIndices[vertexIndex + 2] * 3;
        
        const v0 = [points[i0], points[i0 + 1], points[i0 + 2]];
        const v1 = [points[i1], points[i1 + 1], points[i1 + 2]];
        const v2 = [points[i2], points[i2 + 1], points[i2 + 2]];
        
        // 计算法线
        const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        
        const normal = [
          edge1[1] * edge2[2] - edge1[2] * edge2[1],
          edge1[2] * edge2[0] - edge1[0] * edge2[2],
          edge1[0] * edge2[1] - edge1[1] * edge2[0],
        ];
        
        // 归一化
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        if (length > 0) {
          normal[0] /= length;
          normal[1] /= length;
          normal[2] /= length;
        }
        
        // 累加到所有顶点
        for (let i = 0; i < count; i++) {
          const vi = faceVertexIndices[vertexIndex + i] * 3;
          normals[vi] += normal[0];
          normals[vi + 1] += normal[1];
          normals[vi + 2] += normal[2];
        }
      }
      
      vertexIndex += count;
    }
    
    // 归一化所有法线
    for (let i = 0; i < normals.length; i += 3) {
      const x = normals[i];
      const y = normals[i + 1];
      const z = normals[i + 2];
      
      const length = Math.sqrt(x * x + y * y + z * z);
      if (length > 0) {
        normals[i] /= length;
        normals[i + 1] /= length;
        normals[i + 2] /= length;
      }
    }
    
    return normals;
  }
  
  triangulate(faceVertexCounts: number[], faceVertexIndices: number[]): number[] {
    const triangles: number[] = [];
    let vertexIndex = 0;
    
    for (const count of faceVertexCounts) {
      if (count >= 3) {
        // 简单的扇形三角化
        for (let i = 1; i < count - 1; i++) {
          triangles.push(
            faceVertexIndices[vertexIndex],
            faceVertexIndices[vertexIndex + i],
            faceVertexIndices[vertexIndex + i + 1]
          );
        }
      }
      vertexIndex += count;
    }
    
    return triangles;
  }
  
  reverseNormals(normals: number[]): number[] {
    return normals.map(n => -n);
  }
  
  transformPoints(points: number[], matrix: number[]): number[] {
    const transformed: number[] = new Array(points.length);
    
    for (let i = 0; i < points.length; i += 3) {
      const x = points[i];
      const y = points[i + 1];
      const z = points[i + 2];
      
      // 简化的矩阵变换（假设是4x4变换矩阵）
      transformed[i] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
      transformed[i + 1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
      transformed[i + 2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
    }
    
    return transformed;
  }
  
  mergeMeshes(meshes: MeshAttributes[]): MeshAttributes {
    const merged: MeshAttributes = {
      points: [],
      faceVertexCounts: [],
      faceVertexIndices: [],
    };
    
    let vertexOffset = 0;
    
    for (const mesh of meshes) {
      // 合并顶点
      merged.points.push(...mesh.points);
      
      // 合并面（需要重新索引）
      merged.faceVertexCounts.push(...mesh.faceVertexCounts);
      
      for (const index of mesh.faceVertexIndices) {
        merged.faceVertexIndices.push(index + vertexOffset);
      }
      
      vertexOffset += mesh.points.length / 3;
    }
    
    return merged;
  }
  
  subdivideMesh(attributes: MeshAttributes, scheme: SubdivisionScheme): MeshAttributes {
    // 简化的网格细分（这里只是一个占位符）
    // 实际实现需要复杂的算法
    console.warn('Subdivision not implemented');
    return attributes;
  }
  
  generateUVs(attributes: MeshAttributes, projection: 'spherical' | 'cylindrical' | 'planar' | 'cubic'): number[] {
    const points = attributes.points;
    const uvs: number[] = new Array(points.length / 3 * 2);
    
    switch (projection) {
      case 'spherical':
        for (let i = 0, j = 0; i < points.length; i += 3, j += 2) {
          const x = points[i];
          const y = points[i + 1];
          const z = points[i + 2];
          
          const length = Math.sqrt(x * x + y * y + z * z);
          if (length > 0) {
            uvs[j] = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
            uvs[j + 1] = 0.5 - Math.asin(y / length) / Math.PI;
          }
        }
        break;
        
      case 'planar':
        // 简单的平面投影
        const bbox = this.computeBoundingBox(attributes);
        const size = [
          bbox.max[0] - bbox.min[0],
          bbox.max[1] - bbox.min[1],
          bbox.max[2] - bbox.min[2],
        ];
        
        const dominantAxis = size.indexOf(Math.max(...size));
        
        for (let i = 0, j = 0; i < points.length; i += 3, j += 2) {
          const u = (points[i] - bbox.min[0]) / size[0];
          const v = (points[i + 1] - bbox.min[1]) / size[1];
          
          uvs[j] = u;
          uvs[j + 1] = v;
        }
        break;
        
      default:
        // 默认球形投影
        return this.generateUVs(attributes, 'spherical');
    }
    
    return uvs;
  }
  
  optimizeMesh(attributes: MeshAttributes): MeshAttributes {
    // 简化的网格优化
    // 移除未使用的顶点
    const usedVertices = new Set(attributes.faceVertexIndices);
    const vertexMap: number[] = new Array(attributes.points.length / 3);
    let newVertexIndex = 0;
    
    for (let i = 0; i < vertexMap.length; i++) {
      if (usedVertices.has(i)) {
        vertexMap[i] = newVertexIndex++;
      } else {
        vertexMap[i] = -1;
      }
    }
    
    // 重构网格
    const optimized: MeshAttributes = {
      points: [],
      faceVertexCounts: attributes.faceVertexCounts,
      faceVertexIndices: [],
    };
    
    // 复制使用的顶点
    for (let i = 0; i < attributes.points.length; i += 3) {
      const vertexIndex = i / 3;
      if (vertexMap[vertexIndex] !== -1) {
        optimized.points.push(
          attributes.points[i],
          attributes.points[i + 1],
          attributes.points[i + 2]
        );
      }
    }
    
    // 重新映射索引
    for (const index of attributes.faceVertexIndices) {
      optimized.faceVertexIndices.push(vertexMap[index]);
    }
    
    return optimized;
  }
  
  validateMesh(attributes: MeshAttributes): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // 检查顶点数据
    if (attributes.points.length % 3 !== 0) {
      errors.push('Points array length must be multiple of 3');
    }
    
    // 检查面数据
    let totalVertices = 0;
    for (const count of attributes.faceVertexCounts) {
      if (count < 3) {
        errors.push(`Invalid face vertex count: ${count}`);
      }
      totalVertices += count;
    }
    
    if (attributes.faceVertexIndices.length !== totalVertices) {
      errors.push('Face vertex indices length does not match total vertex count');
    }
    
    // 检查索引范围
    const maxIndex = attributes.points.length / 3 - 1;
    for (const index of attributes.faceVertexIndices) {
      if (index < 0 || index > maxIndex) {
        errors.push(`Invalid vertex index: ${index}`);
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// 导出默认实例
export const geometryUtils = new DefaultGeometryUtils();