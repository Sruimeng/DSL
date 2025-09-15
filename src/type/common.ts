/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * 通用工具类型定义
 *
 * 定义 DSL 系统中使用的通用工具、助手
 * 和共享接口的类型。
 */

/**
 * Color representation
 */
export type Color = [number, number, number] | [number, number, number, number];

/**
 * Vector types
 */
export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];

/**
 * Matrix types
 */
export type Matrix3 = number[];
export type Matrix4 = number[];

/**
 * Quaternion type
 */
export type Quaternion = [number, number, number, number];

/**
 * Euler angles type
 */
export type Euler = [number, number, number];

/**
 * Bounds/AABB type
 */
export interface Bounds {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  size: Vector3;
}

/**
 * Sphere bounds type
 */
export interface SphereBounds {
  center: Vector3;
  radius: number;
}

/**
 * Ray type
 */
export interface Ray {
  origin: Vector3;
  direction: Vector3;
}

/**
 * Plane type
 */
export interface Plane {
  normal: Vector3;
  constant: number;
}

/**
 * Transform interface
 */
export interface Transform {
  /** Position */
  position: Vector3;
  /** Rotation in degrees */
  rotation: Euler;
  /** Scale */
  scale: Vector3;
  /** Optional quaternion */
  quaternion?: Quaternion;
  /** Optional matrix */
  matrix?: Matrix4;
}

/**
 * Size interface
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle interface
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Time range
 */
export interface TimeRange {
  start: number;
  end: number;
}

/**
 ** Version type
 */
export interface Version {
  major: number;
  minor: number;
  patch: number;
  label?: string;
}

/**
 * Error types
 */
export enum ErrorType {
  LOADING = 'LOADING',
  PARSING = 'PARSING',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  NETWORK = 'NETWORK',
  PLUGIN = 'PLUGIN',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class
 */
export class DSLError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public cause?: Error,
    public context?: unknown,
  ) {
    super(message);
    this.name = 'DSLError';
    this.stack = cause?.stack || this.stack;
  }
}

/**
 * Result type for operations
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: {
    type: ErrorType;
    message: string;
    details?: unknown;
  };
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Async job status
 */
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Job interface for async operations
 */
export interface Job<T = unknown> {
  /** Job ID */
  id: string;
  /** Job name */
  name: string;
  /** Job status */
  status: JobStatus;
  /** Progress (0-1) */
  progress: number;
  /** Job result */
  result?: T;
  /** Job error */
  error?: Error;
  /** Cancel job */
  cancel(): void;
  /** Wait for completion */
  wait(): Promise<T>;
}

/**
 ** Job queue interface
 */
export interface JobQueue {
  /** Add job to queue */
  add<T>(name: string, task: () => Promise<T>, priority?: number): Job<T>;
  /** Get job by ID */
  get(id: string): Job | undefined;
  /** Cancel job */
  cancel(id: string): boolean;
  /** Clear all jobs */
  clear(): void;
  /** Get queue statistics */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
}

/**
 * Resource types
 */
export enum ResourceType {
  TEXTURE = 'TEXTURE',
  GEOMETRY = 'GEOMETRY',
  MATERIAL = 'MATERIAL',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  FONT = 'FONT',
  SHADER = 'SHADER',
  JSON = 'JSON',
  BINARY = 'BINARY',
}

/**
 * Resource cache entry
 */
export interface CacheEntry<T> {
  /** Resource ID */
  id: string;
  /** Resource type */
  type: ResourceType;
  /** Resource data */
  data: T;
  /** Last access time */
  lastAccess: number;
  /** Size in bytes */
  size: number;
  /** Reference count */
  refCount: number;
}

/**
 ** Resource manager interface
 */
export interface ResourceManager {
  /** Load resource */
  load<T>(path: string, type: ResourceType, options?: unknown): Promise<T>;
  /** Get cached resource */
  get<T>(id: string): T | undefined;
  /** Cache resource */
  cache<T>(id: string, resource: T, type: ResourceType): void;
  /** Release resource */
  release(id: string): void;
  /** Clear all resources */
  clear(): void;
  /** Get cache statistics */
  getStats(): {
    totalSize: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  };
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  /** Add event listener */
  on(event: string, listener: Function): this;
  /** Add one-time event listener */
  once(event: string, listener: Function): this;
  /** Remove event listener */
  off(event: string, listener: Function): this;
  /** Emit event */
  emit(event: string, ...args: unknown[]): boolean;
  /** Remove all listeners */
  removeAllListeners(event?: string): this;
  /** Get listener count */
  listenerCount(event: string): number;
}

/**
 ** Utility functions
 */
export interface Utils {
  /** Generate UUID */
  uuid(): string;
  /** Get current timestamp */
  now(): number;
  /** Clamp value between min and max */
  clamp(value: number, min: number, max: number): number;
  /** Linear interpolation */
  lerp(start: number, end: number, t: number): number;
  /** Convert degrees to radians */
  degToRad(degrees: number): number;
  /** Convert radians to degrees */
  radToDeg(radians: number): number;
  /** Deep clone object */
  deepClone<T>(obj: T): T;
  /** Merge objects */
  merge<T>(target: T, source: Partial<T>): T;
  /** Parse URL */
  parseUrl(url: string): {
    protocol: string;
    host: string;
    path: string;
    query: Record<string, string>;
    hash: string;
  };
  /** Format bytes */
  formatBytes(bytes: number, decimals?: number): string;
  /** Format time */
  formatTime(seconds: number): string;
  /** Debounce function */
  debounce<T extends Function>(func: T, wait: number): T;
  /** Throttle function */
  throttle<T extends Function>(func: T, limit: number): T;
}

/**
 * Configuration interface
 */
export interface Config {
  /** Get configuration value */
  get<T>(key: string, defaultValue?: T): T;
  /** Set configuration value */
  set(key: string, value: unknown): void;
  /** Check if key exists */
  has(key: string): boolean;
  /** Delete configuration key */
  delete(key: string): boolean;
  /** Get all configuration */
  all(): Record<string, unknown>;
  /** Load configuration from object */
  load(config: Record<string, unknown>): void;
  /** Save configuration to storage */
  save(): void;
  /** Reset to defaults */
  reset(): void;
}

/**
 ** Performance monitor interface
 */
export interface PerformanceMonitor {
  /** Start measuring */
  start(label: string): void;
  /** End measuring */
  end(label: string): number;
  /** Mark timestamp */
  mark(label: string): void;
  /** Measure between marks */
  measure(name: string, startMark: string, endMark: string): number;
  /** Get measures */
  getMeasures(): Record<string, number>;
  /** Clear all measures */
  clear(): void;
}

/**
 * Disposable interface for cleanup
 */
export interface Disposable {
  /** Dispose resources */
  dispose(): void;
}

/**
 * Validatable interface
 */
export interface Validatable {
  /** Validate object */
  validate(): Result<boolean>;
}

/**
 * Serializable interface
 */
export interface Serializable<T = unknown> {
  /** Serialize to JSON */
  serialize(): T;
  /** Deserialize from JSON */
  deserialize(data: T): void;
}
