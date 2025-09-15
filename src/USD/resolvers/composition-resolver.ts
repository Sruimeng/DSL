import { UsdStageImpl } from '../stage';
import type { UsdPrim, SdfPath, ResolvedReference, ResolvedInheritance, ResolvedVariant } from '../types';

/**
 * USD组合解析器 - 处理引用、继承、变体等组合弧
 */
export class CompositionResolver {
  constructor(private stage: UsdStageImpl) {}

  /**
   * 解析Prim的组合，返回最终的合成Prim
   */
  resolve(prim: UsdPrim): {
    local: UsdPrim;
    references: ResolvedReference[];
    inherits: ResolvedInheritance[];
    variants: ResolvedVariant[];
    finalPrim: UsdPrim;
  } {
    const result = {
      local: { ...prim },
      references: [] as ResolvedReference[],
      inherits: [] as ResolvedInheritance[],
      variants: [] as ResolvedVariant[],
      finalPrim: this.createEmptyPrim(prim.path, prim.typeName),
    };

    // 1. 处理变体（最高优先级）
    if (prim.variants) {
      for (const variantSet of prim.variants) {
        if (variantSet.selection) {
          const variant = variantSet.variants.find(v => v.name === variantSet.selection);
          if (variant) {
            const resolvedVariant: ResolvedVariant = {
              setName: variantSet.name,
              variantName: variantSet.selection,
              prim: this.mergePrimSpecs(result.finalPrim, variant.primSpec),
            };
            result.variants.push(resolvedVariant);
            result.finalPrim = resolvedVariant.prim;
          }
        }
      }
    }

    // 2. 处理继承
    if (prim.inherits) {
      for (const inheritPath of prim.inherits) {
        const inheritPrim = this.stage.getPrimAtPath(inheritPath);
        if (inheritPrim) {
          const resolvedInheritance: ResolvedInheritance = {
            path: inheritPath,
            prim: inheritPrim,
          };
          result.inherits.push(resolvedInheritance);
          result.finalPrim = this.mergePrimSpecs(result.finalPrim, inheritPrim);
        }
      }
    }

    // 3. 处理引用
    if (prim.references) {
      for (const ref of prim.references) {
        const refPrim = this.stage.getPrimAtPath(ref.primPath || new SdfPath('/'));
        if (refPrim) {
          const resolvedRef: ResolvedReference = {
            assetPath: ref.assetPath,
            primPath: ref.primPath || new SdfPath('/'),
            layer: this.stage.getRootLayer(),
            prim: refPrim,
          };
          result.references.push(resolvedRef);
          result.finalPrim = this.mergePrimSpecs(result.finalPrim, refPrim);
        }
      }
    }

    // 4. 最后应用本地定义（最高优先级）
    result.finalPrim = this.mergePrimSpecs(result.finalPrim, prim);

    return result;
  }

  /**
   * 合并两个Prim定义，处理属性优先级
   */
  private mergePrimSpecs(target: UsdPrim, source: Partial<UsdPrim>): UsdPrim {
    const merged = { ...target };

    // 合并属性（源覆盖目标）
    if (source.attributes) {
      merged.attributes = new Map([...target.attributes]);
      for (const [name, attr] of source.attributes) {
        merged.attributes.set(name, { ...attr });
      }
    }

    // 合并关系
    if (source.relationships) {
      merged.relationships = new Map([...target.relationships]);
      for (const [name, rel] of source.relationships) {
        merged.relationships.set(name, { ...rel });
      }
    }

    // 合并元数据
    if (source.metadata) {
      merged.metadata = new Map([...target.metadata]);
      for (const [key, value] of source.metadata) {
        merged.metadata.set(key, value);
      }
    }

    // 合并其他字段
    if (source.active !== undefined) merged.active = source.active;
    if (source.instanceable !== undefined) merged.instanceable = source.instanceable;
    if (source.kind !== undefined) merged.kind = source.kind;

    return merged;
  }

  /**
   * 创建空的Prim模板
   */
  private createEmptyPrim(path: SdfPath, typeName: string): UsdPrim {
    return {
      path,
      typeName,
      specifier: 'def',
      active: true,
      attributes: new Map(),
      relationships: new Map(),
      metadata: new Map(),
    };
  }

  /**
   * 检查是否存在循环继承
   */
  checkInheritanceCycles(prim: UsdPrim, inheritPath: SdfPath): boolean {
    const visited = new Set<string>();
    return this.checkInheritanceCyclesRecursive(prim, inheritPath, visited);
  }

  private checkInheritanceCyclesRecursive(
    prim: UsdPrim,
    targetPath: SdfPath,
    visited: Set<string>
  ): boolean {
    if (visited.has(prim.path.pathString)) {
      return true; // 发现循环
    }

    visited.add(prim.path.pathString);

    if (prim.path.equals(targetPath)) {
      return true; // 找到目标路径，存在循环
    }

    if (prim.inherits) {
      for (const inheritPath of prim.inherits) {
        const inheritPrim = this.stage.getPrimAtPath(inheritPath);
        if (inheritPrim) {
          if (this.checkInheritanceCyclesRecursive(inheritPrim, targetPath, visited)) {
            return true;
          }
        }
      }
    }

    visited.delete(prim.path.pathString);
    return false;
  }

  /**
   * 解析变体选择
   */
  resolveVariantSelection(prim: UsdPrim, setName: string, variantName?: string): ResolvedVariant | null {
    const variantSet = prim.variants?.find(vs => vs.name === setName);
    if (!variantSet) return null;

    const selection = variantName || variantSet.selection;
    if (!selection) return null;

    const variant = variantSet.variants.find(v => v.name === selection);
    if (!variant) return null;

    return {
      setName,
      variantName: selection,
      prim: this.mergePrimSpecs(this.createEmptyPrim(prim.path, prim.typeName), variant.primSpec),
    };
  }

  /**
   * 获取所有有效的变体集
   */
  getEffectiveVariantSets(prim: UsdPrim): Map<string, string[]> {
    const effectiveSets = new Map<string, string[]>();

    // 收集所有变体集
    const collectVariants = (p: UsdPrim) => {
      if (p.variants) {
        for (const vs of p.variants) {
          effectiveSets.set(vs.name, vs.variants.map(v => v.name));
        }
      }
    };

    // 从继承链收集
    if (prim.inherits) {
      for (const inheritPath of prim.inherits) {
        const inheritPrim = this.stage.getPrimAtPath(inheritPath);
        if (inheritPrim) {
          collectVariants(inheritPrim);
        }
      }
    }

    // 本地变体覆盖继承
    collectVariants(prim);

    return effectiveSets;
  }

  /**
   * 重新生成Prim索引（用于性能优化）
   */
  reindexPrim(prim: UsdPrim): void {
    // 这里可以实现Prim索引的重新生成逻辑
    // 例如缓存组合结果、预计算变换等
  }

  /**
   * 获取Prim的完整继承链
   */
  getInheritanceChain(prim: UsdPrim): SdfPath[] {
    const chain: SdfPath[] = [];
    const visited = new Set<string>();

    const collectInherits = (p: UsdPrim) => {
      if (!p.inherits) return;

      for (const inheritPath of p.inherits) {
        if (!visited.has(inheritPath.pathString)) {
          visited.add(inheritPath.pathString);
          chain.push(inheritPath);

          const inheritPrim = this.stage.getPrimAtPath(inheritPath);
          if (inheritPrim) {
            collectInherits(inheritPrim);
          }
        }
      }
    };

    collectInherits(prim);
    return chain;
  }

  /**
   * 检查Prim是否依赖于另一个Prim
   */
  hasDependency(prim: UsdPrim, dependencyPath: SdfPath): boolean {
    // 检查引用
    if (prim.references) {
      for (const ref of prim.references) {
        if (ref.primPath?.equals(dependencyPath)) {
          return true;
        }
      }
    }

    // 检查继承
    if (prim.inherits) {
      for (const inheritPath of prim.inherits) {
        if (inheritPath.equals(dependencyPath)) {
          return true;
        }
        const inheritPrim = this.stage.getPrimAtPath(inheritPath);
        if (inheritPrim && this.hasDependency(inheritPrim, dependencyPath)) {
          return true;
        }
      }
    }

    // 检查负载
    if (prim.payload?.primPath?.equals(dependencyPath)) {
      return true;
    }

    return false;
  }
}