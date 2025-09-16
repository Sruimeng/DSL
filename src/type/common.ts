/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * 通用类型定义
 * 定义 DSL 系统的基础类型和工具类型
 */

// 基础数学类型
export interface IVector2 {
  x: number;
  y: number;
}

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IVector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

// 颜色类型
export type IColorRGB = [number, number, number];
export type IColorRGBA = [number, number, number, number];
export type IColor = IColorRGB | IColorRGBA | string;

// 矩阵类型
export type IMatrix3 = [number, number, number, number, number, number, number, number, number];

export type IMatrix4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

// 四元数和欧拉角
export interface IQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface IEuler {
  x: number; // 弧度
  y: number; // 弧度
  z: number; // 弧度
  order?: 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';
}

// 变换类型
export interface IXformTransform {
  translate?: IVector3;
  rotate?: IVector3; // 欧拉角（度数）
  scale?: IVector3;
  pivot?: IVector3;
  matrix?: IMatrix4;
}

// 边界框
export interface IBounds {
  min: IVector3;
  max: IVector3;
  center: IVector3;
  size: IVector3;
}

// 尺寸和矩形
export interface ISize {
  width: number;
  height: number;
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 时间相关
export interface ITimeCode {
  value: number;
  unit: 'frames' | 'seconds' | 'minutes';
}

export interface ITimeRange {
  start: ITimeCode;
  end: ITimeCode;
}

// 参数类型 - 改进类型安全
export type IParams = Record<string, any>;

// 错误处理
export enum IErrorType {
  LOADING = 'LOADING',
  PARSING = 'PARSING',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  NETWORK = 'NETWORK',
  PLUGIN = 'PLUGIN',
  UNKNOWN = 'UNKNOWN',
}

export interface IError {
  type: IErrorType;
  message: string;
  details?: unknown;
  stack?: string;
  cause?: IError;
}

// 操作结果
export interface IResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: IError;
  warnings?: string[];
}

// 事件系统
export type IEventType = string;

export interface IEventData {
  [key: string]: unknown;
}

export interface IEventHandler<T extends IEventData = IEventData> {
  (data: T): void | Promise<void>;
}

export interface IEventEmitter {
  on<T extends IEventData>(event: string, handler: IEventHandler<T>): this;
  once<T extends IEventData>(event: string, handler: IEventHandler<T>): this;
  off(event: string, handler: IEventHandler): this;
  emit<T extends IEventData>(event: string, data: T): boolean;
  removeAllListeners(event?: string): this;
}

// 进度相关
export interface IProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

export type IProgressCallback = (progress: IProgress) => void;

// 异步作业
export enum IJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface IJob<T = unknown> {
  id: string;
  name: string;
  status: IJobStatus;
  progress: number;
  result?: T;
  error?: IError;
  cancel(): void;
  wait(): Promise<T>;
}

// 资源管理
export enum IResourceType {
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

export interface ICacheEntry<T> {
  id: string;
  type: IResourceType;
  data: T;
  lastAccess: number;
  size: number;
  refCount: number;
}

export interface IResourceManager {
  load<T>(path: string, type: IResourceType, options?: unknown): Promise<T>;
  get<T>(id: string): T | undefined;
  cache<T>(id: string, resource: T, type: IResourceType): void;
  release(id: string): void;
  clear(): void;
  getStats(): {
    totalSize: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  };
}

// 生命周期
export type ILifecycleEvent =
  | 'created'
  | 'initialized'
  | 'started'
  | 'stopped'
  | 'paused'
  | 'resumed'
  | 'destroyed';

// 变更类型
export type IChangeType = 'add' | 'remove' | 'modify' | 'replace';

export interface IChangeRecord {
  type: IChangeType;
  target: string;
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: number;
}

// 验证
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface IValidatable {
  validate(): IValidationResult;
}

// 序列化
export interface ISerializable<T = unknown> {
  serialize(): T;
  deserialize(data: T): void;
}

// 可释放资源
export interface IDisposable {
  dispose(): void;
}

// 配置
export interface IConfig {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  all(): Record<string, unknown>;
  load(config: Record<string, unknown>): void;
  save(): void;
  reset(): void;
}

// 性能监控
export interface IPerformanceMonitor {
  start(label: string): void;
  end(label: string): number;
  mark(label: string): void;
  measure(name: string, startMark: string, endMark: string): number;
  getMeasures(): Record<string, number>;
  clear(): void;
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OmitFields<T, K extends keyof T> = Omit<T, K>;

// 类型守卫
export type ITypeGuard<T> = (value: unknown) => value is T;

// 版本信息
export interface IVersion {
  major: number;
  minor: number;
  patch: number;
  label?: string;
}

// 自定义错误类
export class DSLError extends Error {
  constructor(
    public type: IErrorType,
    message: string,
    public cause?: Error,
    public context?: unknown,
  ) {
    super(message);
    this.name = 'DSLError';
    this.stack = cause?.stack || this.stack;
  }
}

// 工具函数集合
export interface IUtils {
  uuid(): string;
  now(): number;
  clamp(value: number, min: number, max: number): number;
  lerp(start: number, end: number, t: number): number;
  degToRad(degrees: number): number;
  radToDeg(radians: number): number;
  deepClone<T>(obj: T): T;
  merge<T>(target: T, source: Partial<T>): T;
  debounce<T extends Function>(func: T, wait: number): T;
  throttle<T extends Function>(func: T, limit: number): T;
}
