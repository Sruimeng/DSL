import type { UsdPrim, SdfPath, TimeSample } from '../types';
import { UsdStageImpl } from '../stage';

/**
 * USD属性解析器 - 处理时间采样和组合解析
 */
export class AttributeResolver {
  constructor(private stage: UsdStageImpl) {}

  /**
   * 解析属性值，考虑时间采样和组合弧
   */
  resolve(prim: UsdPrim, attrName: string, time?: number): {
    value: any;
    source: 'local' | 'reference' | 'payload' | 'inherit' | 'specialize' | 'variant';
    sourcePath: SdfPath;
  } | null {
    // 1. 首先检查本地属性
    const localAttr = prim.attributes.get(attrName);
    if (localAttr) {
      const value = this.getAttributeValueAtTime(localAttr, time);
      if (value !== undefined) {
        return {
          value,
          source: 'local',
          sourcePath: prim.path,
        };
      }
    }

    // 2. 检查变体
    if (prim.variants) {
      for (const variantSet of prim.variants) {
        if (variantSet.selection) {
          const selectedVariant = variantSet.variants.find(v => v.name === variantSet.selection);
          if (selectedVariant?.primSpec.attributes?.has(attrName)) {
            const attr = selectedVariant.primSpec.attributes.get(attrName);
            const value = this.getAttributeValueAtTime(attr!, time);
            if (value !== undefined) {
              return {
                value,
                source: 'variant',
                sourcePath: prim.path,
              };
            }
          }
        }
      }
    }

    // 3. 检查继承
    if (prim.inherits) {
      for (const inheritPath of prim.inherits) {
        const inheritPrim = this.stage.getPrimAtPath(inheritPath);
        if (inheritPrim) {
          const inherited = this.resolve(inheritPrim, attrName, time);
          if (inherited && inherited.value !== undefined) {
            return {
              ...inherited,
              source: 'inherit',
            };
          }
        }
      }
    }

    // 4. 检查引用
    if (prim.references) {
      for (const ref of prim.references) {
        const refPrim = this.stage.getPrimAtPath(ref.primPath || new SdfPath('/'));
        if (refPrim) {
          const referenced = this.resolve(refPrim, attrName, time);
          if (referenced && referenced.value !== undefined) {
            return {
              ...referenced,
              source: 'reference',
            };
          }
        }
      }
    }

    // 5. 检查负载
    if (prim.payload) {
      const payloadPrim = this.stage.getPrimAtPath(prim.payload.primPath || new SdfPath('/'));
      if (payloadPrim) {
        const payload = this.resolve(payloadPrim, attrName, time);
        if (payload && payload.value !== undefined) {
          return {
            ...payload,
            source: 'payload',
          };
        }
      }
    }

    return null;
  }

  /**
   * 获取属性在指定时间的值
   */
  private getAttributeValueAtTime(attr: {
    defaultValue?: any;
    timeSamples?: TimeSample[];
  }, time?: number): any {
    if (time === undefined || !attr.timeSamples || attr.timeSamples.length === 0) {
      return attr.defaultValue;
    }

    // 二分查找时间采样
    const samples = attr.timeSamples.sort((a, b) => a.time - b.time);
    
    // 精确匹配
    const exactMatch = samples.find(s => s.time === time);
    if (exactMatch) {
      return exactMatch.value;
    }

    // 插值
    const before = samples.filter(s => s.time <= time).pop();
    const after = samples.find(s => s.time > time);

    if (before && after) {
      // 线性插值
      const t = (time - before.time) / (after.time - before.time);
      return this.interpolateValues(before.value, after.value, t);
    }

    // 使用最近的值
    return before?.value ?? after?.value ?? attr.defaultValue;
  }

  /**
   * 值插值
   */
  private interpolateValues(from: any, to: any, t: number): any {
    // 数字插值
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * t;
    }

    // 向量插值
    if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
      return from.map((f, i) => f + (to[i] - f) * t);
    }

    // 四元数插值（球面插值）
    if (from?.type === 'quaternion' && to?.type === 'quaternion') {
      return this.slerpQuaternion(from, to, t);
    }

    // 默认返回最近的值
    return t < 0.5 ? from : to;
  }

  /**
   * 四元数球面插值
   */
  private slerpQuaternion(q1: any, q2: any, t: number): any {
    // 简化的四元数插值实现
    const dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    const sign = dot < 0 ? -1 : 1;
    
    const angle = Math.acos(Math.abs(dot));
    const sinAngle = Math.sin(angle);
    
    if (sinAngle < 0.001) {
      // 接近时使用线性插值
      return {
        type: 'quaternion',
        x: q1.x + (q2.x * sign - q1.x) * t,
        y: q1.y + (q2.y * sign - q1.y) * t,
        z: q1.z + (q2.z * sign - q1.z) * t,
        w: q1.w + (q2.w * sign - q1.w) * t,
      };
    }

    const f1 = Math.sin((1 - t) * angle) / sinAngle;
    const f2 = Math.sin(t * angle) / sinAngle * sign;

    return {
      type: 'quaternion',
      x: q1.x * f1 + q2.x * f2,
      y: q1.y * f1 + q2.y * f2,
      z: q1.z * f1 + q2.z * f2,
      w: q1.w * f1 + q2.w * f2,
    };
  }

  /**
   * 获取属性的时间采样范围
   */
  getTimeSamplingRange(prim: UsdPrim, attrName: string): { start: number; end: number } | null {
    const attr = prim.attributes.get(attrName);
    if (!attr?.timeSamples || attr.timeSamples.length === 0) {
      return null;
    }

    const times = attr.timeSamples.map(s => s.time);
    return {
      start: Math.min(...times),
      end: Math.max(...times),
    };
  }

  /**
   * 检查属性是否随时间变化
   */
  hasTimeSamples(prim: UsdPrim, attrName: string): boolean {
    const attr = prim.attributes.get(attrName);
    return !!(attr?.timeSamples && attr.timeSamples.length > 0);
  }

  /**
   * 获取所有时间采样时间
   */
  getAllTimeSamples(prim: UsdPrim, attrName: string): number[] {
    const attr = prim.attributes.get(attrName);
    if (!attr?.timeSamples) return [];
    
    return attr.timeSamples.map(s => s.time).sort((a, b) => a - b);
  }
}