/**
 * Modify Property Action - 修改属性动作
 *
 * 修改场景中对象属性的动作。
 */

import * as THREE from 'three';
import type { Params } from '../type';
import { BaseAction } from './base-action';

/**
 * ModifyPropertyAction 用于修改场景中对象的属性
 * 支持位置、旋转、缩放、可见性等属性修改
 */
export class ModifyPropertyAction extends BaseAction {
  name = 'ModifyProperty';
  description = 'Modify properties of objects in the scene';
  metadata = {
    category: 'scene',
    icon: 'edit',
    permissions: ['scene:write'],
  };

  /**
   * Validate action parameters
   */
  validate(params: Params | undefined): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }

    const { target, properties } = params as any;

    // Must specify target and properties
    if (!target || !properties) {
      return false;
    }

    // Target can be string (name/uuid) or Object3D
    if (typeof target !== 'string' && !(target instanceof THREE.Object3D)) {
      return false;
    }

    // Properties must be an object
    if (typeof properties !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Execute the action
   */
  protected async onExecute(params: Params): Promise<THREE.Object3D[]> {
    const { target, properties, recursive = false } = params as any;

    // Find target objects
    const targets = this.findTargets(target, recursive);

    if (targets.length === 0) {
      throw new Error(`No objects found matching target: ${target}`);
    }

    // Apply properties to each target
    const modifiedObjects: THREE.Object3D[] = [];

    for (const obj of targets) {
      this.applyProperties(obj, properties);
      modifiedObjects.push(obj);
    }

    this.info(`Modified properties of ${modifiedObjects.length} objects`);

    return modifiedObjects;
  }

  /**
   * Find target objects
   */
  private findTargets(target: string | THREE.Object3D, recursive: boolean): THREE.Object3D[] {
    // If target is already an Object3D
    if (target instanceof THREE.Object3D) {
      return recursive ? this.getAllDescendants(target) : [target];
    }

    // Search in scene
    const targets: THREE.Object3D[] = [];

    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;
      const scene = sceneManager?.getScene?.();

      if (scene) {
        // Try to find by UUID
        const byUuid = scene.getObjectByProperty('uuid', target);
        if (byUuid) {
          return recursive ? this.getAllDescendants(byUuid) : [byUuid];
        }

        // Try to find by name (could be multiple)
        const byName = scene.getObjectsByName(target, recursive);
        if (byName.length > 0) {
          return byName;
        }

        // If target is a wildcard, get all objects
        if (target === '*') {
          scene.traverse((obj: any) => {
            if (obj !== scene) {
              targets.push(obj);
            }
          });
          return targets;
        }

        // Search by pattern (simple * wildcard support)
        if (target.includes('*')) {
          const pattern = target.replace(/\*/g, '.*');
          const regex = new RegExp(pattern);
          scene.traverse((obj: any) => {
            if (obj !== scene && regex.test(obj.name)) {
              targets.push(obj);
            }
          });
          return targets;
        }
      }
    }

    return targets;
  }

  /**
   * Get all descendants of an object
   */
  private getAllDescendants(object: THREE.Object3D): THREE.Object3D[] {
    const descendants: THREE.Object3D[] = [];
    object.traverse((obj) => {
      if (obj !== object) {
        descendants.push(obj);
      }
    });
    return descendants;
  }

  /**
   * Apply properties to object
   */
  private applyProperties(object: THREE.Object3D, properties: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(properties)) {
      this.setProperty(object, key, value);
    }
  }

  /**
   * Set a single property on an object
   */
  private setProperty(object: THREE.Object3D, key: string, value: unknown): void {
    switch (key) {
      // Transform properties
      case 'position':
      case 'pos':
        if (typeof value === 'object' && value !== null) {
          const pos = value as Record<string, number>;
          object.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
        }
        break;

      case 'rotation':
      case 'rot':
        if (typeof value === 'object' && value !== null) {
          const rot = value as Record<string, number>;
          object.rotation.set(
            THREE.MathUtils.degToRad(rot.x || 0),
            THREE.MathUtils.degToRad(rot.y || 0),
            THREE.MathUtils.degToRad(rot.z || 0),
          );
        }
        break;

      case 'scale':
        if (typeof value === 'object' && value !== null) {
          const scale = value as Record<string, number>;
          object.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
        }
        break;

      // Visibility
      case 'visible':
      case 'visibility':
        object.visible = Boolean(value);
        break;

      // Name
      case 'name':
        if (typeof value === 'string') {
          object.name = value;
        }
        break;

      // Layers
      case 'layers':
        if (typeof value === 'number') {
          object.layers.set(value);
        }
        break;

      // Material properties (for Mesh)
      case 'material':
        if (object instanceof THREE.Mesh) {
          if (typeof value === 'string') {
            // Parse color string
            const color = new THREE.Color(value);
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => {
                if ('color' in mat) {
                  (mat as any).color = color;
                }
              });
            } else if ('color' in object.material) {
              (object.material as any).color = color;
            }
          } else if (typeof value === 'number') {
            const color = new THREE.Color(value);
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => {
                if ('color' in mat) {
                  (mat as any).color = color;
                }
              });
            } else if ('color' in object.material) {
              (object.material as any).color = color;
            }
          } else if (typeof value === 'object' && value !== null) {
            // Apply material properties
            this.applyMaterialProperties(object, value as Record<string, unknown>);
          }
        }
        break;

      // Cast shadow
      case 'castShadow':
        object.castShadow = Boolean(value);
        break;

      // Receive shadow
      case 'receiveShadow':
        object.receiveShadow = Boolean(value);
        break;

      // Render order
      case 'renderOrder':
        if (typeof value === 'number') {
          object.renderOrder = value;
        }
        break;

      // Frustum culling
      case 'frustumCulled':
        object.frustumCulled = Boolean(value);
        break;

      // User data
      case 'userData':
        if (typeof value === 'object' && value !== null) {
          object.userData = { ...object.userData, ...value };
        }
        break;

      // Custom property
      default:
        // Try to set as direct property
        if (key in object) {
          (object as any)[key] = value;
        } else {
          this.warn(`Unknown property: ${key}`);
        }
        break;
    }
  }

  /**
   * Apply material properties
   */
  private applyMaterialProperties(mesh: THREE.Mesh, properties: Record<string, unknown>): void {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((mat) => {
      for (const [key, value] of Object.entries(properties)) {
        switch (key) {
          case 'color':
            if (typeof value === 'string' || typeof value === 'number') {
              (mat as any).color = new THREE.Color(value);
            }
            break;

          case 'opacity':
            if (typeof value === 'number') {
              (mat as any).opacity = value;
              mat.transparent = value < 1;
            }
            break;

          case 'transparent':
            mat.transparent = Boolean(value);
            break;

          case 'wireframe':
            (mat as any).wireframe = Boolean(value);
            break;

          case 'metalness':
            if ('metalness' in mat) {
              (mat as any).metalness = Number(value);
            }
            break;

          case 'roughness':
            if ('roughness' in mat) {
              (mat as any).roughness = Number(value);
            }
            break;

          case 'emissive':
            if (typeof value === 'string' || typeof value === 'number') {
              (mat as any).emissive = new THREE.Color(value);
            }
            break;

          default:
            if (key in mat) {
              (mat as any)[key] = value;
            }
            break;
        }
      }
    });
  }

  /**
   * Get action schema for parameter validation
   */
  getSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        target: {
          oneOf: [{ type: 'string' }, { type: 'object', instanceof: 'Object3D' }],
          description: 'Target object name, UUID, or Object3D instance',
        },
        properties: {
          type: 'object',
          properties: {
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            rotation: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            scale: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            visible: { type: 'boolean' },
            name: { type: 'string' },
            material: {
              oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'object' }],
            },
            castShadow: { type: 'boolean' },
            receiveShadow: { type: 'boolean' },
          },
        },
        recursive: {
          type: 'boolean',
          default: false,
          description: 'Apply to all descendants if target is a group',
        },
      },
      required: ['target', 'properties'],
    };
  }
}
