/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * Math Utils - 数学工具类
 *
 * 提供3D数学计算相关的工具函数。
 */

import * as THREE from 'three';
import type { IEuler, IMatrix4, IQuaternion, IVector3 } from '../type/common';

/**
 * MathUtils 提供了3D数学计算的工具函数
 * 包括向量、矩阵、四元数等运算
 */
export class MathUtils {
  /**
   * 生成UUID
   */
  static uuid(): string {
    return THREE.MathUtils.generateUUID();
  }

  /**
   * 获取当前时间（毫秒）
   */
  static now(): number {
    return performance.now();
  }

  /**
   * 限制数值在范围内
   */
  static clamp(value: number, min: number, max: number): number {
    return THREE.MathUtils.clamp(value, min, max);
  }

  /**
   * 线性插值
   */
  static lerp(start: number, end: number, t: number): number {
    return THREE.MathUtils.lerp(start, end, t);
  }

  /**
   * 角度转弧度
   */
  static degToRad(degrees: number): number {
    return THREE.MathUtils.degToRad(degrees);
  }

  /**
   * 弧度转角度
   */
  static radToDeg(radians: number): number {
    return THREE.MathUtils.radToDeg(radians);
  }

  /**
   * 深度克隆对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item)) as T;
    }

    if (obj instanceof THREE.Object3D) {
      return obj.clone() as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * 合并对象
   */
  static merge<T>(target: T, source: Partial<T>): T {
    return { ...target, ...source };
  }

  /**
   * 防抖函数
   */
  static debounce<T extends Function>(func: T, wait: number): T {
    let timeout: number;
    return ((...args: unknown[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait) as unknown as number;
    }) as unknown as T;
  }

  /**
   * 节流函数
   */
  static throttle<T extends Function>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: unknown[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as unknown as T;
  }

  /**
   * 向量运算
   */
  static vector = {
    /**
     * 创建向量
     */
    create(x = 0, y = 0, z = 0): IVector3 {
      return { x, y, z };
    },

    /**
     * 向量加法
     */
    add(a: IVector3, b: IVector3): IVector3 {
      return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z,
      };
    },

    /**
     * 向量减法
     */
    subtract(a: IVector3, b: IVector3): IVector3 {
      return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z,
      };
    },

    /**
     * 向量乘法（标量）
     */
    multiply(v: IVector3, scalar: number): IVector3 {
      return {
        x: v.x * scalar,
        y: v.y * scalar,
        z: v.z * scalar,
      };
    },

    /**
     * 向量除法（标量）
     */
    divide(v: IVector3, scalar: number): IVector3 {
      if (scalar === 0) throw new Error('Cannot divide by zero');
      return {
        x: v.x / scalar,
        y: v.y / scalar,
        z: v.z / scalar,
      };
    },

    /**
     * 向量点积
     */
    dot(a: IVector3, b: IVector3): number {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    },

    /**
     * 向量叉积
     */
    cross(a: IVector3, b: IVector3): IVector3 {
      return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
      };
    },

    /**
     * 向量长度
     */
    length(v: IVector3): number {
      return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },

    /**
     * 向量归一化
     */
    normalize(v: IVector3): IVector3 {
      const len = this.length(v);
      if (len === 0) return { x: 0, y: 0, z: 0 };
      return this.divide(v, len);
    },

    /**
     * 向量距离
     */
    distance(a: IVector3, b: IVector3): number {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    /**
     * 向量插值
     */
    lerp(a: IVector3, b: IVector3, t: number): IVector3 {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
      };
    },

    /**
     * 转换为THREE.Vector3
     */
    toThree(v: IVector3): THREE.Vector3 {
      return new THREE.Vector3(v.x, v.y, v.z);
    },

    /**
     * 从THREE.Vector3转换
     */
    fromThree(v: THREE.Vector3): IVector3 {
      return { x: v.x, y: v.y, z: v.z };
    },
  };

  /**
   * 四元数运算
   */
  static quaternion = {
    /**
     * 创建四元数
     */
    create(x = 0, y = 0, z = 0, w = 1): IQuaternion {
      return { x, y, z, w };
    },

    /**
     * 从欧拉角创建四元数
     */
    fromEuler(euler: IEuler): IQuaternion {
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(euler.x, euler.y, euler.z, euler.order),
      );
      return { x: q.x, y: q.y, z: q.z, w: q.w };
    },

    /**
     * 从轴角创建四元数
     */
    fromAxisAngle(axis: IVector3, angle: number): IQuaternion {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(axis.x, axis.y, axis.z),
        angle,
      );
      return { x: q.x, y: q.y, z: q.z, w: q.w };
    },

    /**
     * 四元数乘法
     */
    multiply(a: IQuaternion, b: IQuaternion): IQuaternion {
      const qa = new THREE.Quaternion(a.x, a.y, a.z, a.w);
      const qb = new THREE.Quaternion(b.x, b.y, b.z, b.w);
      const result = qa.multiply(qb);
      return { x: result.x, y: result.y, z: result.z, w: result.w };
    },

    /**
     * 四元数归一化
     */
    normalize(q: IQuaternion): IQuaternion {
      const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
      if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
      return {
        x: q.x / len,
        y: q.y / len,
        z: q.z / len,
        w: q.w / len,
      };
    },

    /**
     * 四元数球面线性插值
     */
    slerp(a: IQuaternion, b: IQuaternion, t: number): IQuaternion {
      const qa = new THREE.Quaternion(a.x, a.y, a.z, a.w);
      const qb = new THREE.Quaternion(b.x, b.y, b.z, b.w);
      const result = qa.slerp(qb, t);
      return { x: result.x, y: result.y, z: result.z, w: result.w };
    },

    /**
     * 转换为THREE.Quaternion
     */
    toThree(q: IQuaternion): THREE.Quaternion {
      return new THREE.Quaternion(q.x, q.y, q.z, q.w);
    },

    /**
     * 从THREE.Quaternion转换
     */
    fromThree(q: THREE.Quaternion): IQuaternion {
      return { x: q.x, y: q.y, z: q.z, w: q.w };
    },
  };

  /**
   * 矩阵运算
   */
  static matrix = {
    /**
     * 创建4x4单位矩阵
     */
    createIdentity4(): IMatrix4 {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    },

    /**
     * 从平移、旋转、缩放创建矩阵
     */
    compose(position: IVector3, rotation: IEuler, scale: IVector3): IMatrix4 {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(position.x, position.y, position.z),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation.x, rotation.y, rotation.z, rotation.order),
        ),
        new THREE.Vector3(scale.x, scale.y, scale.z),
      );
      return m.elements as IMatrix4;
    },

    /**
     * 矩阵乘法
     */
    multiply4(a: IMatrix4, b: IMatrix4): IMatrix4 {
      const ma = new THREE.Matrix4().fromArray(a);
      const mb = new THREE.Matrix4().fromArray(b);
      const result = ma.multiply(mb);
      return result.elements as IMatrix4;
    },

    /**
     * 矩阵转置
     */
    transpose4(m: IMatrix4): IMatrix4 {
      const matrix = new THREE.Matrix4().fromArray(m);
      matrix.transpose();
      return matrix.elements as IMatrix4;
    },

    /**
     * 矩阵求逆
     */
    invert4(m: IMatrix4): IMatrix4 {
      const matrix = new THREE.Matrix4().fromArray(m);
      matrix.invert();
      return matrix.elements as IMatrix4;
    },

    /**
     * 从矩阵提取位置
     */
    getPosition(m: IMatrix4): IVector3 {
      const matrix = new THREE.Matrix4().fromArray(m);
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(matrix);
      return { x: pos.x, y: pos.y, z: pos.z };
    },

    /**
     * 从矩阵提取旋转（欧拉角）
     */
    getRotation(m: IMatrix4, order: THREE.EulerOrder = 'XYZ'): IEuler {
      const matrix = new THREE.Matrix4().fromArray(m);
      const euler = new THREE.Euler();
      euler.setFromRotationMatrix(matrix, order);
      return {
        x: euler.x,
        y: euler.y,
        z: euler.z,
        order,
      };
    },

    /**
     * 从矩阵提取缩放
     */
    getScale(m: IMatrix4): IVector3 {
      const matrix = new THREE.Matrix4().fromArray(m);
      const scale = new THREE.Vector3();
      scale.setFromMatrixScale(matrix);
      return { x: scale.x, y: scale.y, z: scale.z };
    },

    /**
     * 转换为THREE.Matrix4
     */
    toThree4(m: IMatrix4): THREE.Matrix4 {
      return new THREE.Matrix4().fromArray(m);
    },

    /**
     * 从THREE.Matrix4转换
     */
    fromThree4(m: THREE.Matrix4): IMatrix4 {
      return m.elements as IMatrix4;
    },
  };

  /**
   * 几何计算
   */
  static geometry = {
    /**
     * 计算三角形面积
     */
    triangleArea(a: IVector3, b: IVector3, c: IVector3): number {
      const ab = MathUtils.vector.subtract(b, a);
      const ac = MathUtils.vector.subtract(c, a);
      const cross = MathUtils.vector.cross(ab, ac);
      return MathUtils.vector.length(cross) * 0.5;
    },

    /**
     * 计算三角形中心
     */
    triangleCenter(a: IVector3, b: IVector3, c: IVector3): IVector3 {
      return {
        x: (a.x + b.x + c.x) / 3,
        y: (a.y + b.y + c.y) / 3,
        z: (a.z + b.z + c.z) / 3,
      };
    },

    /**
     * 计算三角形法线
     */
    triangleNormal(a: IVector3, b: IVector3, c: IVector3): IVector3 {
      const ab = MathUtils.vector.subtract(b, a);
      const ac = MathUtils.vector.subtract(c, a);
      return MathUtils.vector.normalize(MathUtils.vector.cross(ab, ac));
    },

    /**
     * 点到线段的距离
     */
    pointToLineDistance(point: IVector3, lineStart: IVector3, lineEnd: IVector3): number {
      const lineVec = MathUtils.vector.subtract(lineEnd, lineStart);
      const pointVec = MathUtils.vector.subtract(point, lineStart);
      const lineLen = MathUtils.vector.length(lineVec);
      const lineDir = MathUtils.vector.normalize(lineVec);

      const projLength = MathUtils.vector.dot(pointVec, lineDir);
      const clampedProj = MathUtils.clamp(projLength, 0, lineLen);

      const closestPoint = MathUtils.vector.add(
        lineStart,
        MathUtils.vector.multiply(lineDir, clampedProj),
      );

      return MathUtils.vector.distance(point, closestPoint);
    },

    /**
     * 点到平面的距离
     */
    pointToPlaneDistance(point: IVector3, planePoint: IVector3, planeNormal: IVector3): number {
      const pointVec = MathUtils.vector.subtract(point, planePoint);
      const normal = MathUtils.vector.normalize(planeNormal);
      return Math.abs(MathUtils.vector.dot(pointVec, normal));
    },

    /**
     * 检查点是否在三角形内
     */
    pointInTriangle(
      point: IVector3,
      triangleA: IVector3,
      triangleB: IVector3,
      triangleC: IVector3,
    ): boolean {
      // 使用重心坐标法
      const v0 = MathUtils.vector.subtract(triangleC, triangleA);
      const v1 = MathUtils.vector.subtract(triangleB, triangleA);
      const v2 = MathUtils.vector.subtract(point, triangleA);

      const dot00 = MathUtils.vector.dot(v0, v0);
      const dot01 = MathUtils.vector.dot(v0, v1);
      const dot02 = MathUtils.vector.dot(v0, v2);
      const dot11 = MathUtils.vector.dot(v1, v1);
      const dot12 = MathUtils.vector.dot(v1, v2);

      const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
      const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
      const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

      return u >= 0 && v >= 0 && u + v <= 1;
    },

    /**
     * 计算包围盒
     */
    boundingBox(points: IVector3[]): {
      min: IVector3;
      max: IVector3;
      center: IVector3;
      size: IVector3;
    } {
      if (points.length === 0) {
        return {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
          center: { x: 0, y: 0, z: 0 },
          size: { x: 0, y: 0, z: 0 },
        };
      }

      let minX = points[0].x;
      let minY = points[0].y;
      let minZ = points[0].z;
      let maxX = points[0].x;
      let maxY = points[0].y;
      let maxZ = points[0].z;

      for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x);
        minY = Math.min(minY, points[i].y);
        minZ = Math.min(minZ, points[i].z);
        maxX = Math.max(maxX, points[i].x);
        maxY = Math.max(maxY, points[i].y);
        maxZ = Math.max(maxZ, points[i].z);
      }

      return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        center: {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          z: (minZ + maxZ) / 2,
        },
        size: {
          x: maxX - minX,
          y: maxY - minY,
          z: maxZ - minZ,
        },
      };
    },

    /**
     * 计算包围球
     */
    boundingSphere(points: IVector3[]): { center: IVector3; radius: number } {
      if (points.length === 0) {
        return { center: { x: 0, y: 0, z: 0 }, radius: 0 };
      }

      // 使用Ritter's算法
      let minX = points[0].x;
      let minY = points[0].y;
      let minZ = points[0].z;
      let maxX = points[0].x;
      let maxY = points[0].y;
      let maxZ = points[0].z;

      for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x);
        minY = Math.min(minY, points[i].y);
        minZ = Math.min(minZ, points[i].z);
        maxX = Math.max(maxX, points[i].x);
        maxY = Math.max(maxY, points[i].y);
        maxZ = Math.max(maxZ, points[i].z);
      }

      // 初始球心
      const center = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2,
      };

      // 初始半径
      let radius = 0;
      for (const point of points) {
        const dist = MathUtils.vector.distance(point, center);
        radius = Math.max(radius, dist);
      }

      // 微调球心和半径
      for (let i = 0; i < 2; i++) {
        for (const point of points) {
          const dist = MathUtils.vector.distance(point, center);
          if (dist > radius) {
            const diff = dist - radius;
            const direction = MathUtils.vector.normalize(MathUtils.vector.subtract(point, center));
            center.x += direction.x * diff * 0.5;
            center.y += direction.y * diff * 0.5;
            center.z += direction.z * diff * 0.5;
            radius += diff * 0.5;
          }
        }
      }

      return { center, radius };
    },
  };

  /**
   * 颜色工具
   */
  static color = {
    /**
     * 颜色插值
     */
    lerp(color1: number | string, color2: number | string, t: number): number {
      const c1 = new THREE.Color(color1);
      const c2 = new THREE.Color(color2);
      const result = c1.lerp(c2, t);
      return result.getHex();
    },

    /**
     * RGB转HEX
     */
    rgbToHex(r: number, g: number, b: number): number {
      return (r << 16) | (g << 8) | b;
    },

    /**
     * HEX转RGB
     */
    hexToRgb(hex: number): { r: number; g: number; b: number } {
      return {
        r: (hex >> 16) & 255,
        g: (hex >> 8) & 255,
        b: hex & 255,
      };
    },

    /**
     * HSL转RGB
     */
    hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
      const color = new THREE.Color();
      color.setHSL(h, s, l);
      return {
        r: Math.round(color.r * 255),
        g: Math.round(color.g * 255),
        b: Math.round(color.b * 255),
      };
    },

    /**
     * RGB转HSL
     */
    rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
      const color = new THREE.Color(r / 255, g / 255, b / 255);
      const hsl = {};
      color.getHSL(hsl as any);
      return hsl as { h: number; s: number; l: number };
    },
  };
}
