/**
 * USDLoader - USD JSON 加载器
 *
 * 异步加载 USD JSON 文件，返回 DSL JSON。
 */

import type { IUSDScene } from '../type';

/**
 * USDLoader 负责加载 USD 格式的场景文件
 */
export class USDLoader {
  /**
   * 加载 USD JSON 文件
   * @param url USD JSON 文件路径
   * @param options 加载选项
   * @returns Promise<IUSDScene> 解析后的 USD 场景对象
   */
  public static async load(
    url: string,
    options: {
      credentials?: RequestCredentials;
      headers?: Record<string, string>;
      timeout?: number;
    } = {},
  ): Promise<IUSDScene> {
    const { credentials = 'same-origin', headers = {}, timeout = 30000 } = options;

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 设置默认请求头
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // 发起请求
      const response = await fetch(url, {
        method: 'GET',
        credentials,
        headers: defaultHeaders,
        signal: controller.signal,
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 解析 JSON 数据
      const data = await response.json();

      // 验证数据格式
      if (!this.validateUSDScene(data)) {
        throw new Error('Invalid USD scene format');
      }

      return data as IUSDScene;
    } catch (error) {
      // 处理错误
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
      throw new Error('Failed to load USD scene');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 加载 USD JSON 文本内容
   * @param text JSON 文本内容
   * @returns Promise<IUSDScene> 解析后的 USD 场景对象
   */
  public static async loadText(text: string): Promise<IUSDScene> {
    try {
      // 解析 JSON
      const data = JSON.parse(text);

      // 验证数据格式
      if (!this.validateUSDScene(data)) {
        throw new Error('Invalid USD scene format');
      }

      return data as IUSDScene;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }

  /**
   * 验证 USD 场景数据格式
   * @param data 待验证的数据
   * @returns boolean 是否为有效的 USD 场景
   */
  private static validateUSDScene(data: unknown): boolean {
    // 基本类型检查
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const sceneData = data as Record<string, unknown>;

    // 检查必需字段
    if (!Array.isArray(sceneData.prims)) {
      return false;
    }

    // 验证 metadata（如果存在）
    if (sceneData.metadata && typeof sceneData.metadata === 'object') {
      const metadata = sceneData.metadata as Record<string, unknown>;

      // 验证时间相关字段
      if (metadata.startTime !== undefined && typeof metadata.startTime !== 'number') {
        return false;
      }
      if (metadata.endTime !== undefined && typeof metadata.endTime !== 'number') {
        return false;
      }
      if (metadata.frameRate !== undefined && typeof metadata.frameRate !== 'number') {
        return false;
      }
    }

    // 验证 layer（如果存在）
    if (sceneData.layer && typeof sceneData.layer === 'object') {
      const layer = sceneData.layer as Record<string, unknown>;

      if (layer.identifier && typeof layer.identifier !== 'string') {
        return false;
      }
      if (layer.subLayers && !Array.isArray(layer.subLayers)) {
        return false;
      }
    }

    // 递归验证 prims
    return this.validatePrims(sceneData.prims);
  }

  /**
   * 验证 Prim 数组
   * @param prims Prim 数组
   * @returns boolean 是否全部有效
   */
  private static validatePrims(prims: unknown[]): boolean {
    for (const prim of prims) {
      if (!this.validatePrim(prim)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 验证单个 Prim
   * @param prim Prim 对象
   * @returns boolean 是否有效
   */
  private static validatePrim(prim: unknown): boolean {
    if (typeof prim !== 'object' || prim === null) {
      return false;
    }

    const primData = prim as Record<string, unknown>;

    // 检查必需字段
    if (typeof primData.name !== 'string' || primData.name.trim() === '') {
      return false;
    }

    if (typeof primData.type !== 'string' || primData.type.trim() === '') {
      return false;
    }

    // 检查可选字段类型
    if (primData.parent !== undefined && typeof primData.parent !== 'string') {
      return false;
    }

    if (primData.active !== undefined && typeof primData.active !== 'boolean') {
      return false;
    }

    if (
      primData.visibility !== undefined &&
      primData.visibility !== 'inherited' &&
      primData.visibility !== 'invisible'
    ) {
      return false;
    }

    // 递归验证子 prims
    if (Array.isArray(primData.children)) {
      if (!this.validatePrims(primData.children)) {
        return false;
      }
    }

    // 特殊类型验证
    switch (primData.type) {
      case 'Mesh':
        return this.validateMeshPrim(primData);
      case 'Camera':
        return this.validateCameraPrim(primData);
      case 'Light':
        return this.validateLightPrim(primData);
      case 'Material':
        return this.validateMaterialPrim(primData);
      case 'Xform':
        return this.validateXformPrim(primData);
      default:
        // 其他类型暂时只验证基本结构
        return true;
    }
  }

  /**
   * 验证网格 Prim
   * @param prim 网格 Prim
   * @returns boolean 是否有效
   */
  private static validateMeshPrim(prim: Record<string, unknown>): boolean {
    // 检查必需的几何属性
    if (!Array.isArray(prim.points)) {
      return false;
    }

    if (!Array.isArray(prim.faceVertexCounts)) {
      return false;
    }

    if (!Array.isArray(prim.faceVertexIndices)) {
      return false;
    }

    // 检查数组长度一致性
    const totalVertices = prim.faceVertexCounts.reduce(
      (sum: number, count: number) => sum + count,
      0,
    );
    if (prim.faceVertexIndices.length !== totalVertices) {
      return false;
    }

    // 检查顶点数据格式
    for (const point of prim.points) {
      if (
        !Array.isArray(point) ||
        point.length !== 3 ||
        point.some((coord: unknown) => typeof coord !== 'number')
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证相机 Prim
   * @param prim 相机 Prim
   * @returns boolean 是否有效
   */
  private static validateCameraPrim(prim: Record<string, unknown>): boolean {
    if (prim.attributes && typeof prim.attributes === 'object') {
      const attrs = prim.attributes as Record<string, unknown>;

      // 检查投影类型
      if (
        attrs.projection !== undefined &&
        attrs.projection !== 'perspective' &&
        attrs.projection !== 'orthographic'
      ) {
        return false;
      }

      // 检查数值属性
      const numericAttrs = ['focalLength', 'horizontalAperture', 'verticalAperture', 'near', 'far'];
      for (const attr of numericAttrs) {
        if (attrs[attr] !== undefined && typeof attrs[attr] !== 'number') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证光源 Prim
   * @param prim 光源 Prim
   * @returns boolean 是否有效
   */
  private static validateLightPrim(prim: Record<string, unknown>): boolean {
    if (prim.lightType !== undefined && typeof prim.lightType !== 'string') {
      return false;
    }

    // 检查光源属性
    if (prim.intensity !== undefined && typeof prim.intensity !== 'number') {
      return false;
    }

    if (prim.color !== undefined && !this.validateColor(prim.color)) {
      return false;
    }

    return true;
  }

  /**
   * 验证材质 Prim
   * @param prim 材质 Prim
   * @returns boolean 是否有效
   */
  private static validateMaterialPrim(prim: Record<string, unknown>): boolean {
    if (
      prim.model !== undefined &&
      prim.model !== 'usdPreviewSurface' &&
      prim.model !== 'mdl' &&
      prim.model !== 'custom'
    ) {
      return false;
    }

    // 验证 inputs
    if (prim.inputs && typeof prim.inputs === 'object') {
      const inputs = prim.inputs as Record<string, unknown>;

      if (inputs.diffuseColor !== undefined && !this.validateColor(inputs.diffuseColor)) {
        return false;
      }

      if (inputs.emissiveColor !== undefined && !this.validateColor(inputs.emissiveColor)) {
        return false;
      }

      // 检查数值属性
      const numericInputs = ['metallic', 'roughness', 'opacity', 'ior'];
      for (const input of numericInputs) {
        if (inputs[input] !== undefined && typeof inputs[input] !== 'number') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证变换 Prim
   * @param prim 变换 Prim
   * @returns boolean 是否有效
   */
  private static validateXformPrim(prim: Record<string, unknown>): boolean {
    if (prim.transform && typeof prim.transform === 'object') {
      const transform = prim.transform as Record<string, unknown>;

      // 检查平移
      if (transform.translate !== undefined) {
        if (!this.validateVector3(transform.translate)) {
          return false;
        }
      }

      // 检查旋转
      if (transform.rotate !== undefined) {
        if (!this.validateVector3(transform.rotate)) {
          return false;
        }
      }

      // 检查缩放
      if (transform.scale !== undefined) {
        if (!this.validateVector3(transform.scale)) {
          return false;
        }
      }

      // 检查矩阵
      if (transform.matrix !== undefined) {
        if (!Array.isArray(transform.matrix) || transform.matrix.length !== 16) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证颜色值
   * @param color 颜色值
   * @returns boolean 是否有效
   */
  private static validateColor(color: unknown): boolean {
    if (Array.isArray(color)) {
      return color.length === 3 || color.length === 4;
    }
    return typeof color === 'string';
  }

  /**
   * 验证三维向量
   * @param vec 向量值
   * @returns boolean 是否有效
   */
  private static validateVector3(vec: unknown): boolean {
    return (
      Array.isArray(vec) &&
      vec.length === 3 &&
      vec.every((coord: unknown) => typeof coord === 'number')
    );
  }
}
