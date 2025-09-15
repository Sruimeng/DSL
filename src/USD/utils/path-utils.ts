import { SdfPath } from '../types';

/**
 * 路径工具函数
 */

/**
 * 获取路径的basename
 */
export function getBasename(path: SdfPath): string {
  return path.name;
}

/**
 * 获取路径的dirname
 */
export function getDirname(path: SdfPath): string {
  return path.parentPath.pathString;
}

/**
 * 连接路径
 */
export function joinPaths(...parts: string[]): SdfPath {
  const cleanParts = parts.filter(p => p && p !== '/');
  if (cleanParts.length === 0) return new SdfPath('/');
  
  const joined = cleanParts.join('/').replace(/\/+/g, '/');
  return new SdfPath(joined.startsWith('/') ? joined : '/' + joined);
}

/**
 * 规范化路径
 */
export function normalizePath(path: string): SdfPath {
  // 移除多余的斜杠
  let normalized = path.replace(/\/+/g, '/');
  
  // 移除末尾的斜杠（除非是根路径）
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return new SdfPath(normalized);
}

/**
 * 检查路径是否为祖先
 */
export function isAncestor(ancestor: SdfPath, descendant: SdfPath): boolean {
  if (ancestor.pathString === '/') return true;
  if (ancestor.pathString === descendant.pathString) return false;
  
  return descendant.pathString.startsWith(ancestor.pathString + '/');
}

/**
 * 获取相对路径
 */
export function getRelativePath(from: SdfPath, to: SdfPath): SdfPath {
  const fromParts = from.pathString.split('/').filter(p => p);
  const toParts = to.pathString.split('/').filter(p => p);
  
  // 找到共同祖先
  let commonIndex = 0;
  while (commonIndex < fromParts.length && 
         commonIndex < toParts.length && 
         fromParts[commonIndex] === toParts[commonIndex]) {
    commonIndex++;
  }
  
  // 计算向上的步数
  const upSteps = fromParts.length - commonIndex;
  const relativeParts: string[] = [];
  
  for (let i = 0; i < upSteps; i++) {
    relativeParts.push('..');
  }
  
  // 添加向下的路径
  for (let i = commonIndex; i < toParts.length; i++) {
    relativeParts.push(toParts[i]);
  }
  
  return new SdfPath(relativeParts.join('/'));
}

/**
 * 获取绝对路径
 */
export function getAbsolutePath(base: SdfPath, relative: SdfPath): SdfPath {
  if (relative.pathString.startsWith('/')) {
    return relative;
  }
  
  const baseParts = base.pathString.split('/').filter(p => p);
  const relativeParts = relative.pathString.split('/').filter(p => p);
  
  const resultParts = [...baseParts];
  
  for (const part of relativeParts) {
    if (part === '..') {
      resultParts.pop();
    } else if (part !== '.' && part !== '') {
      resultParts.push(part);
    }
  }
  
  return new SdfPath('/' + resultParts.join('/'));
}

/**
 * 获取所有祖先路径
 */
export function getAncestors(path: SdfPath): SdfPath[] {
  const ancestors: SdfPath[] = [];
  let current = path.parentPath;
  
  while (current.pathString !== '/') {
    ancestors.unshift(current);
    current = current.parentPath;
  }
  
  ancestors.unshift(new SdfPath('/'));
  return ancestors;
}

/**
 * 获取路径深度
 */
export function getDepth(path: SdfPath): number {
  return path.pathString.split('/').filter(p => p).length;
}

/**
 * 检查路径是否有效
 */
export function isValidPath(path: string): boolean {
  // 必须以/开头
  if (!path.startsWith('/')) return false;
  
  // 不能有连续的//
  if (path.includes('//')) return false;
  
  // 不能有.或..作为路径段
  const parts = path.split('/').filter(p => p);
  for (const part of parts) {
    if (part === '.' || part === '..') return false;
  }
  
  // 不能为空路径段
  if (path.endsWith('/') && path !== '/') return false;
  
  return true;
}

/**
 * 路径比较函数
 */
export function comparePaths(a: SdfPath, b: SdfPath): number {
  const aParts = a.pathString.split('/').filter(p => p);
  const bParts = b.pathString.split('/').filter(p => p);
  
  // 比较深度
  if (aParts.length !== bParts.length) {
    return aParts.length - bParts.length;
  }
  
  // 逐段比较
  for (let i = 0; i < aParts.length; i++) {
    if (aParts[i] !== bParts[i]) {
      return aParts[i].localeCompare(bParts[i]);
    }
  }
  
  return 0;
}

/**
 * 查找共同祖先
 */
export function findCommonAncestor(paths: SdfPath[]): SdfPath {
  if (paths.length === 0) return new SdfPath('/');
  if (paths.length === 1) return paths[0];
  
  // 获取所有路径的祖先
  const ancestorSets = paths.map(path => new Set(getAncestors(path).map(p => p.pathString)));
  
  // 找到所有路径共有的祖先
  const commonAncestors = ancestorSets.reduce((acc, set) => {
    return new Set([...acc].filter(x => set.has(x)));
  });
  
  // 返回最深的共同祖先
  const sortedAncestors = Array.from(commonAncestors)
    .map(p => new SdfPath(p))
    .sort((a, b) => getDepth(b) - getDepth(a));
  
  return sortedAncestors[0] || new SdfPath('/');
}

/**
 * 路径过滤器
 */
export class PathFilter {
  private includePatterns: RegExp[] = [];
  private excludePatterns: RegExp[] = [];
  
  include(pattern: string | RegExp): this {
    this.includePatterns.push(typeof pattern === 'string' ? new RegExp(pattern) : pattern);
    return this;
  }
  
  exclude(pattern: string | RegExp): this {
    this.excludePatterns.push(typeof pattern === 'string' ? new RegExp(pattern) : pattern);
    return this;
  }
  
  matches(path: SdfPath): boolean {
    const pathStr = path.pathString;
    
    // 检查排除模式
    for (const pattern of this.excludePatterns) {
      if (pattern.test(pathStr)) return false;
    }
    
    // 如果没有包含模式，则包含所有
    if (this.includePatterns.length === 0) return true;
    
    // 检查包含模式
    for (const pattern of this.includePatterns) {
      if (pattern.test(pathStr)) return true;
    }
    
    return false;
  }
  
  filter(paths: SdfPath[]): SdfPath[] {
    return paths.filter(path => this.matches(path));
  }
}

/**
 * 路径树构建器
 */
export class PathTree {
  private root: PathNode = {
    path: new SdfPath('/'),
    children: new Map(),
  };
  
  addPath(path: SdfPath): void {
    const ancestors = getAncestors(path);
    ancestors.push(path);
    
    let current = this.root;
    
    for (const ancestor of ancestors) {
      if (!current.children.has(ancestor.pathString)) {
        current.children.set(ancestor.pathString, {
          path: ancestor,
          children: new Map(),
        });
      }
      current = current.children.get(ancestor.pathString)!;
    }
  }
  
  getRoot(): PathNode {
    return this.root;
  }
  
  find(path: SdfPath): PathNode | null {
    const ancestors = getAncestors(path);
    ancestors.push(path);
    
    let current = this.root;
    
    for (const ancestor of ancestors) {
      const child = current.children.get(ancestor.pathString);
      if (!child) return null;
      current = child;
    }
    
    return current;
  }
  
  getDescendants(path: SdfPath): PathNode[] {
    const node = this.find(path);
    if (!node) return [];
    
    const descendants: PathNode[] = [];
    const stack = Array.from(node.children.values());
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      descendants.push(current);
      stack.push(...Array.from(current.children.values()));
    }
    
    return descendants;
  }
}

interface PathNode {
  path: SdfPath;
  children: Map<string, PathNode>;
}

/**
 * 路径迭代器
 */
export class PathIterator {
  private paths: SdfPath[] = [];
  private index = 0;
  
  constructor(paths: SdfPath[]) {
    this.paths = [...paths].sort(comparePaths);
  }
  
  next(): SdfPath | null {
    if (this.index >= this.paths.length) return null;
    return this.paths[this.index++];
  }
  
  hasNext(): boolean {
    return this.index < this.paths.length;
  }
  
  reset(): void {
    this.index = 0;
  }
  
  getCurrent(): SdfPath | null {
    if (this.index === 0) return null;
    return this.paths[this.index - 1];
  }
  
  peek(): SdfPath | null {
    if (this.index >= this.paths.length) return null;
    return this.paths[this.index];
  }
}

/**
 * 路径通配符匹配
 */
export function matchWildcard(pattern: string, path: SdfPath): boolean {
  // 将通配符转换为正则表达式
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path.pathString);
}

/**
 * 路径表达式解析器
 */
export class PathExpression {
  private segments: PathSegment[] = [];
  
  constructor(expression: string) {
    this.parse(expression);
  }
  
  private parse(expression: string): void {
    // 简化的路径表达式解析
    // 支持: *, **, ?, {alt1,alt2}, [a-z]
    
    const parts = expression.split('/').filter(p => p);
    
    for (const part of parts) {
      if (part === '**') {
        this.segments.push({ type: 'recursive-wildcard' });
      } else if (part === '*') {
        this.segments.push({ type: 'wildcard' });
      } else if (part.includes('{') && part.includes('}')) {
        // 选项匹配 {a,b,c}
        const options = part.slice(1, -1).split(',');
        this.segments.push({ type: 'alternatives', options });
      } else if (part.includes('[') && part.includes(']')) {
        // 字符类匹配 [a-z]
        const charClass = part.slice(1, -1);
        this.segments.push({ type: 'char-class', pattern: charClass });
      } else {
        this.segments.push({ type: 'literal', value: part });
      }
    }
  }
  
  matches(path: SdfPath): boolean {
    const pathParts = path.pathString.split('/').filter(p => p);
    
    // 简化的匹配逻辑
    let pathIndex = 0;
    let segmentIndex = 0;
    
    while (pathIndex < pathParts.length && segmentIndex < this.segments.length) {
      const segment = this.segments[segmentIndex];
      const pathPart = pathParts[pathIndex];
      
      switch (segment.type) {
        case 'literal':
          if (segment.value !== pathPart) return false;
          pathIndex++;
          segmentIndex++;
          break;
          
        case 'wildcard':
          pathIndex++;
          segmentIndex++;
          break;
          
        case 'recursive-wildcard':
          // 递归通配符可以匹配多段
          if (segmentIndex === this.segments.length - 1) return true;
          
          // 尝试匹配剩余模式
          const remainingSegments = this.segments.slice(segmentIndex + 1);
          for (let i = pathIndex; i <= pathParts.length - remainingSegments.length; i++) {
            const subPath = new SdfPath('/' + pathParts.slice(i).join('/'));
            const subExpression = new PathExpression('/' + remainingSegments.map(s => {
              if (s.type === 'literal') return s.value;
              if (s.type === 'wildcard') return '*';
              return '*';
            }).join('/'));
            
            if (subExpression.matches(subPath)) return true;
          }
          return false;
          
        case 'alternatives':
          if (!segment.options!.includes(pathPart)) return false;
          pathIndex++;
          segmentIndex++;
          break;
          
        case 'char-class':
          // 简化的字符类匹配
          if (segment.pattern === '?') {
            pathIndex++;
            segmentIndex++;
          } else {
            return false;
          }
          break;
      }
    }
    
    // 必须完全匹配
    return pathIndex === pathParts.length && segmentIndex === this.segments.length;
  }
}

type PathSegment = 
  | { type: 'literal'; value: string }
  | { type: 'wildcard' }
  | { type: 'recursive-wildcard' }
  | { type: 'alternatives'; options: string[] }
  | { type: 'char-class'; pattern: string };