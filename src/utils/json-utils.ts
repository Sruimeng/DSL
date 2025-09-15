/**
 * JSON Utils - JSON工具类
 *
 * 提供JSON处理相关的工具函数。
 */

/**
 * JsonUtils 提供了JSON序列化、反序列化、验证等功能
 */
export class JsonUtils {
  /**
   * 安全解析JSON字符串
   */
  static parse<T = unknown>(text: string, defaultValue?: T): T | undefined {
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return defaultValue;
    }
  }

  /**
   * 安全序列化对象为JSON字符串
   */
  static stringify(
    obj: unknown,
    replacer?: (key: string, value: unknown) => unknown,
    space?: string | number,
  ): string {
    try {
      return JSON.stringify(obj, replacer, space);
    } catch (error) {
      console.warn('Failed to stringify object:', error);
      return '{}';
    }
  }

  /**
   * 深度复制对象（使用JSON方法）
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  /**
   * 合并JSON对象
   */
  static merge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    return { ...target, ...source };
  }

  /**
   * 递归合并JSON对象
   */
  static deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          result[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
          ) as T[Extract<keyof T, string>];
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }

  /**
   * 获取对象属性值（支持点分隔路径）
   */
  static get<T = unknown>(
    obj: Record<string, unknown>,
    path: string,
    defaultValue?: T,
  ): T | undefined {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = (result as Record<string, unknown>)[key];
    }

    return (result as T) ?? defaultValue;
  }

  /**
   * 设置对象属性值（支持点分隔路径）
   */
  static set<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  }

  /**
   * 删除对象属性（支持点分隔路径）
   */
  static delete<T extends Record<string, unknown>>(obj: T, path: string): T {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        return obj;
      }
      current = current[key] as Record<string, unknown>;
    }

    delete current[keys[keys.length - 1]];
    return obj;
  }

  /**
   * 检查对象是否有指定路径
   */
  static has(obj: Record<string, unknown>, path: string): boolean {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return false;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current !== undefined;
  }

  /**
   * 展平对象
   */
  static flatten(
    obj: Record<string, unknown>,
    prefix = '',
    separator = '.',
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const flattened = this.flatten(value as Record<string, unknown>, newKey, separator);
          Object.assign(result, flattened);
        } else {
          result[newKey] = value;
        }
      }
    }

    return result;
  }

  /**
   * 反展平对象
   */
  static unflatten(obj: Record<string, unknown>, separator = '.'): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const keys = key.split(separator);
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
          const subKey = keys[i];
          if (
            !(subKey in current) ||
            typeof current[subKey] !== 'object' ||
            current[subKey] === null
          ) {
            current[subKey] = {};
          }
          current = current[subKey] as Record<string, unknown>;
        }

        current[keys[keys.length - 1]] = value;
      }
    }

    return result;
  }

  /**
   * 过滤对象属性
   */
  static filter<T extends Record<string, unknown>>(
    obj: T,
    predicate: (value: unknown, key: string) => boolean,
  ): Partial<T> {
    const result: Partial<T> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (predicate(value, key)) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * 选择对象属性
   */
  static pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;

    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }

    return result;
  }

  /**
   * 排除对象属性
   */
  static omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };

    for (const key of keys) {
      delete result[key];
    }

    return result as Omit<T, K>;
  }

  /**
   * 将查询字符串转换为对象
   */
  static parseQuery(queryString: string): Record<string, string> {
    const result: Record<string, string> = {};

    if (queryString.startsWith('?')) {
      queryString = queryString.slice(1);
    }

    const pairs = queryString.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }

    return result;
  }

  /**
   * 将对象转换为查询字符串
   */
  static stringifyQuery(obj: Record<string, string | number | boolean>): string {
    const pairs: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }

    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  /**
   * 验证JSON Schema（简化版）
   */
  static validate(
    data: unknown,
    schema: {
      type?: string;
      properties?: Record<string, { type: string; required?: boolean }>;
      required?: string[];
    },
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查类型
    if (schema.type && typeof data !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof data}`);
    }

    // 检查对象属性
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // 检查必需属性
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in obj)) {
            errors.push(`Missing required property: ${prop}`);
          }
        }
      }

      // 检查属性类型
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in obj) {
            const value = obj[prop];
            if (typeof value !== propSchema.type) {
              errors.push(`Property ${prop} should be ${propSchema.type}, got ${typeof value}`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 格式化JSON字符串（带颜色和缩进）
   */
  static format(json: unknown, indent = 2): string {
    try {
      return JSON.stringify(json, null, indent);
    } catch {
      return String(json);
    }
  }

  /**
   * 压缩JSON字符串（移除空格）
   */
  static minify(json: unknown): string {
    try {
      return JSON.stringify(json);
    } catch {
      return String(json);
    }
  }

  /**
   * 美化JSON字符串（添加语法高亮的HTML）
   */
  static prettyHtml(json: unknown): string {
    try {
      const str = JSON.stringify(json, null, 2);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
          (match) => {
            let cls = 'number';
            if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                cls = 'key';
              } else {
                cls = 'string';
              }
            } else if (/true|false/.test(match)) {
              cls = 'boolean';
            } else if (/null/.test(match)) {
              cls = 'null';
            }
            return `<span class="${cls}">${match}</span>`;
          },
        );
    } catch {
      return `<span class="error">Invalid JSON</span>`;
    }
  }

  /**
   * 检查字符串是否为有效的JSON
   */
  static isValid(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 修复常见的JSON格式问题
   */
  static fix(text: string): string {
    return (
      text
        // 移除注释
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
        // 移除尾随逗号
        .replace(/,\s*([}\]])/g, '$1')
        // 修复单引号
        .replace(/'([^']+)'/g, '"$1"')
        // 修复未转义的控制字符
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1F\x7F]/g, (match) => {
          const code = match.charCodeAt(0);
          return `\\u${code.toString(16).padStart(4, '0')}`;
        })
    );
  }

  /**
   * 转换为CamelCase
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  /**
   * 转换为snake_case
   */
  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  /**
   * 转换为kebab-case
   */
  static toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  /**
   * 转换为PascalCase
   */
  static toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }
}
