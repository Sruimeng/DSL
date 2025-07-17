import { Vector3 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils.js';
import type { DSLScene } from './types';

/**
 * 创建默认场景
 */
export function createDefaultScene(partial?: Partial<DSLScene>): DSLScene {
  const now = Date.now();

  return {
    id: generateUUID(),
    name: 'Untitled Scene',
    objects: [],
    materials: [
      {
        id: 'default',
        name: 'Default Material',
        type: 'standard',
        color: '#ffffff',
        metalness: 0,
        roughness: 0.5,
        opacity: 1,
      },
    ],
    lights: [
      {
        id: 'ambient-light',
        type: 'ambient',
        name: 'Ambient Light',
        color: '#404040',
        intensity: 0.4,
      },
      {
        id: 'directional-light',
        type: 'directional',
        name: 'Directional Light',
        color: '#ffffff',
        intensity: 0.8,
        position: new Vector3(5, 10, 5),
        target: new Vector3(0, 0, 0),
        castShadow: true,
      },
    ],
    camera: {
      type: 'perspective',
      position: new Vector3(5, 5, 5),
      target: new Vector3(0, 0, 0),
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    environment: {
      background: { type: 'color', color: '#f0f0f0' },
    },
    selection: [],
    metadata: {
      version: '1.0.0',
      created: now,
      modified: now,
    },
    ...partial,
  };
}

/**
 * DSL 深度克隆
 */
export function DSLDeepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Vector3) {
    return new Vector3(obj.x, obj.y, obj.z);
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => DSLDeepClone(item));
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = DSLDeepClone(obj[key]);
    }
  }

  return cloned;
}
