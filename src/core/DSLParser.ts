/**
 * DSLParser - DSL 解析器
 *
 * 将 USD JSON 解析为 Three.js 对象数组。
 */

import * as THREE from 'three';
import type {
  IConePrimitive,
  ICubePrimitive,
  ICurvesPrim,
  ICylinderPrimitive,
  IMeshPrim,
  IPointsPrim,
  ISpherePrimitive,
  IUSDPrim,
  IUSDScene,
  IXformPrim,
} from '../type';

/**
 * DSLParser 负责 USD JSON 到 Three.js 对象的转换
 */
export class DSLParser {
  private static textureCache: Map<string, THREE.Texture> = new Map();
  private static materialCache: Map<string, THREE.Material> = new Map();

  /**
   * 解析 USD 场景，生成 Three.js 对象数组
   * @param dslJson USD 场景描述
   * @returns THREE.Object3D[] Three.js 对象数组
   */
  public static parse(dslJson: IUSDScene): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];

    // 解析场景元数据
    if (dslJson.metadata) {
      this.applySceneMetadata(dslJson.metadata);
    }

    // 解析所有 Prim
    if (dslJson.prims) {
      for (const prim of dslJson.prims) {
        const object = this.parsePrim(prim);
        if (object) {
          objects.push(object);
        }
      }
    }

    return objects;
  }

  /**
   * 解析单个 Prim
   * @param prim USD Prim
   * @returns THREE.Object3D | null 转换后的对象
   */
  private static parsePrim(prim: IUSDPrim): THREE.Object3D | null {
    // 根据 Prim 类型调用相应的解析器
    switch (prim.type) {
      case 'Xform':
        return this.parseXformPrim(prim as IXformPrim);
      case 'Mesh':
        return this.parseMeshPrim(prim as IMeshPrim);
      case 'Curves':
        return this.parseCurvesPrim(prim as ICurvesPrim);
      case 'Points':
        return this.parsePointsPrim(prim as IPointsPrim);
      case 'Cube':
        return this.parseCubePrim(prim as ICubePrimitive);
      case 'Sphere':
        return this.parseSpherePrim(prim as ISpherePrimitive);
      case 'Cylinder':
        return this.parseCylinderPrim(prim as ICylinderPrimitive);
      case 'Cone':
        return this.parseConePrim(prim as IConePrimitive);
      case 'Camera':
        return this.parseCameraPrim(prim);
      case 'Light':
        return this.parseLightPrim(prim);
      case 'Material':
        // 材质 Prim 不会直接创建对象，而是被其他 Prim 引用
        return null;
      default:
        console.warn(`Unsupported prim type: ${prim.type}`);
        return null;
    }
  }

  /**
   * 解析变换 Prim
   * @param prim 变换 Prim
   * @returns THREE.Group 变换组
   */
  private static parseXformPrim(prim: IXformPrim): THREE.Group {
    const group = new THREE.Group();
    group.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(group, prim.transform);
    }

    // 解析子 Prims
    if (prim.children) {
      for (const childPrim of prim.children) {
        const childObject = this.parsePrim(childPrim);
        if (childObject) {
          group.add(childObject);
        }
      }
    }

    // 设置可见性
    if (prim.visibility === 'invisible') {
      group.visible = false;
    }

    return group;
  }

  /**
   * 解析网格 Prim
   * @param prim 网格 Prim
   * @returns THREE.Mesh 网格对象
   */
  private static parseMeshPrim(prim: IMeshPrim): THREE.Mesh | null {
    try {
      // 创建几何体
      const geometry = this.createMeshGeometry(prim);
      if (!geometry) {
        return null;
      }

      // 创建材质
      const material = this.createMeshMaterial(prim);

      // 创建网格
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = prim.name;

      // 应用变换
      if (prim.transform) {
        this.applyTransform(mesh, prim.transform);
      }

      // 设置双面渲染
      if (prim.doubleSided) {
        material.side = THREE.DoubleSide;
      }

      // 设置可见性
      if (prim.visibility === 'invisible') {
        mesh.visible = false;
      }

      return mesh;
    } catch (error) {
      console.error(`Failed to parse mesh prim ${prim.name}:`, error);
      return null;
    }
  }

  /**
   * 创建网格几何体
   * @param prim 网格 Prim
   * @returns THREE.BufferGeometry | null 缓冲几何体
   */
  private static createMeshGeometry(prim: IMeshPrim): THREE.BufferGeometry | null {
    const geometry = new THREE.BufferGeometry();

    // 设置顶点位置
    const vertices: number[] = [];
    for (const point of prim.points) {
      vertices.push(point.x, point.y, point.z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    // 设置面索引
    const indices: number[] = [];
    let vertexIndex = 0;
    for (let i = 0; i < prim.faceVertexCounts.length; i++) {
      const count = prim.faceVertexCounts[i];

      if (count === 3) {
        // 三角形
        for (let j = 0; j < 3; j++) {
          indices.push(prim.faceVertexIndices[vertexIndex + j]);
        }
      } else if (count === 4) {
        // 四边形，拆分为两个三角形
        const v0 = prim.faceVertexIndices[vertexIndex];
        const v1 = prim.faceVertexIndices[vertexIndex + 1];
        const v2 = prim.faceVertexIndices[vertexIndex + 2];
        const v3 = prim.faceVertexIndices[vertexIndex + 3];

        indices.push(v0, v1, v2);
        indices.push(v0, v2, v3);
      } else {
        // 多边形，使用三角扇形
        const first = prim.faceVertexIndices[vertexIndex];
        for (let j = 1; j < count - 1; j++) {
          indices.push(
            first,
            prim.faceVertexIndices[vertexIndex + j],
            prim.faceVertexIndices[vertexIndex + j + 1],
          );
        }
      }

      vertexIndex += count;
    }
    geometry.setIndex(indices);

    // 计算法线
    geometry.computeVertexNormals();

    // 设置 UV 坐标
    if (prim.primvars?.st || prim.primvars?.uv) {
      const uvData = prim.primvars.st || prim.primvars.uv;
      if (uvData?.values) {
        const uvs: number[] = [];
        for (const uv of uvData.values) {
          uvs.push(...uv);
        }
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      }
    }

    // 设置顶点颜色
    if (prim.displayColor?.values) {
      const colors: number[] = [];
      for (const color of prim.displayColor.values) {
        colors.push(...color.map((c) => c / 255));
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    return geometry;
  }

  /**
   * 创建网格材质
   * @param prim 网格 Prim
   * @returns THREE.Material 材质对象
   */
  private static createMeshMaterial(prim: IMeshPrim): THREE.Material {
    // 默认材质
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.5,
    });

    // 查找绑定的材质
    if (prim.material) {
      const boundMaterial = this.findMaterial(prim.material);
      if (boundMaterial) {
        return boundMaterial;
      }
    }

    return material;
  }

  /**
   * 解析曲线 Prim
   * @param prim 曲线 Prim
   * @returns THREE.Line 曲线对象
   */
  private static parseCurvesPrim(prim: ICurvesPrim): THREE.Line | null {
    try {
      const points: THREE.Vector3[] = [];

      // 解析曲线点
      for (const point of prim.points) {
        points.push(new THREE.Vector3(point.x, point.y, point.z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });

      const line = new THREE.Line(geometry, material);
      line.name = prim.name;

      // 应用变换
      if (prim.transform) {
        this.applyTransform(line, prim.transform);
      }

      return line;
    } catch (error) {
      console.error(`Failed to parse curves prim ${prim.name}:`, error);
      return null;
    }
  }

  /**
   * 解析点 Prim
   * @param prim 点 Prim
   * @returns THREE.Points 点云对象
   */
  private static parsePointsPrim(prim: IPointsPrim): THREE.Points | null {
    try {
      const positions: number[] = [];

      // 解析点位置
      for (const point of prim.points) {
        positions.push(point.x, point.y, point.z);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: prim.widths?.values[0] || 0.1,
      });

      const points = new THREE.Points(geometry, material);
      points.name = prim.name;

      // 应用变换
      if (prim.transform) {
        this.applyTransform(points, prim.transform);
      }

      return points;
    } catch (error) {
      console.error(`Failed to parse points prim ${prim.name}:`, error);
      return null;
    }
  }

  /**
   * 解析立方体 Prim
   * @param prim 立方体 Prim
   * @returns THREE.Mesh 立方体网格
   */
  private static parseCubePrim(prim: ICubePrimitive): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(prim.size, prim.size, prim.size);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const cube = new THREE.Mesh(geometry, material);
    cube.name = prim.name;

    // 应用变换
    if (prim.center) {
      cube.position.set(prim.center.x, prim.center.y, prim.center.z);
    }

    if (prim.transform) {
      this.applyTransform(cube, prim.transform);
    }

    return cube;
  }

  /**
   * 解析球体 Prim
   * @param prim 球体 Prim
   * @returns THREE.Mesh 球体网格
   */
  private static parseSpherePrim(prim: ISpherePrimitive): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(
      prim.radius,
      prim.widthSegments || 32,
      prim.heightSegments || 16,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(sphere, prim.transform);
    }

    return sphere;
  }

  /**
   * 解析圆柱体 Prim
   * @param prim 圆柱体 Prim
   * @returns THREE.Mesh 圆柱体网格
   */
  private static parseCylinderPrim(prim: ICylinderPrimitive): THREE.Mesh {
    const radiusTop = prim.radiusTop ?? prim.radiusBottom ?? 1;
    const radiusBottom = prim.radiusBottom ?? prim.radiusTop ?? 1;

    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      prim.height,
      prim.radialSegments || 32,
      prim.heightSegments || 1,
      prim.openEnded,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(cylinder, prim.transform);
    }

    return cylinder;
  }

  /**
   * 解析圆锥体 Prim
   * @param prim 圆锥体 Prim
   * @returns THREE.Mesh 圆锥体网格
   */
  private static parseConePrim(prim: IConePrimitive): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(
      prim.radius,
      prim.height,
      prim.radialSegments || 32,
      prim.heightSegments || 1,
      prim.openEnded,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const cone = new THREE.Mesh(geometry, material);
    cone.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(cone, prim.transform);
    }

    return cone;
  }

  /**
   * 解析相机 Prim
   * @param prim 相机 Prim
   * @returns THREE.PerspectiveCamera | THREE.OrthographicCamera 相机对象
   */
  private static parseCameraPrim(
    prim: IUSDPrim,
  ): THREE.PerspectiveCamera | THREE.OrthographicCamera | null {
    // 这里简化处理，实际需要根据具体属性创建不同类型的相机
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(camera, prim.transform);
    }

    return camera;
  }

  /**
   * 解析光源 Prim
   * @param prim 光源 Prim
   * @returns THREE.Light 光源对象
   */
  private static parseLightPrim(prim: IUSDPrim): THREE.Light | null {
    // 这里简化处理，实际需要根据 lightType 创建不同类型的光源
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.name = prim.name;

    // 应用变换
    if (prim.transform) {
      this.applyTransform(light, prim.transform);
    }

    return light;
  }

  /**
   * 查找材质
   * @param materialPath 材质路径
   * @returns THREE.Material | null 材质对象
   */
  private static findMaterial(materialPath: string): THREE.Material | null {
    // 这里简化处理，实际需要实现材质查找逻辑
    return null;
  }

  /**
   * 应用变换
   * @param object Three.js 对象
   * @param transform 变换数据
   */
  private static applyTransform(object: THREE.Object3D, transform: any): void {
    if (transform.translate) {
      object.position.set(transform.translate.x, transform.translate.y, transform.translate.z);
    }

    if (transform.rotate) {
      // Three.js 使用弧度，USD 使用度数
      object.rotation.set(
        THREE.MathUtils.degToRad(transform.rotate.x),
        THREE.MathUtils.degToRad(transform.rotate.y),
        THREE.MathUtils.degToRad(transform.rotate.z),
      );
    }

    if (transform.scale) {
      object.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
    }

    if (transform.matrix) {
      // 应用变换矩阵
      const matrix = new THREE.Matrix4();
      matrix.fromArray(transform.matrix);
      object.applyMatrix4(matrix);
    }
  }

  /**
   * 应用场景元数据
   * @param metadata 场景元数据
   */
  private static applySceneMetadata(metadata: any): void {
    // 这里可以应用场景级别的设置，如上轴方向、时间码等
    if (metadata.upAxis === 'Z') {
      // 如果是 Z 轴向上，需要调整所有对象的旋转
      console.warn('Z-up axis is not fully supported yet');
    }
  }

  /**
   * 清理缓存
   */
  public static clearCache(): void {
    // 清理纹理缓存
    this.textureCache.forEach((texture) => texture.dispose());
    this.textureCache.clear();

    // 清理材质缓存
    this.materialCache.forEach((material) => material.dispose());
    this.materialCache.clear();
  }
}
