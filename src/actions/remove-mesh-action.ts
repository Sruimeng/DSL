/**
 * Remove Mesh Action - 移除网格动作
 *
 * 从场景中移除网格对象的动作。
 */

import * as THREE from 'three';
import type { Params } from '../type';
import { BaseAction } from './base-action';

/**
 * RemoveMeshAction 用于从场景中移除网格对象
 * 支持通过名称、UUID或对象引用移除
 */
export class RemoveMeshAction extends BaseAction {
  name = 'RemoveMesh';
  description = 'Remove a mesh from the scene';
  metadata = {
    category: 'scene',
    icon: 'trash',
    permissions: ['scene:write'],
  };

  /**
   * Validate action parameters
   */
  validate(params: Params | undefined): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }

    const { target } = params as any;

    // Must specify target by name, uuid, or object
    if (!target) {
      return false;
    }

    // Target can be string (name/uuid) or Object3D
    if (typeof target !== 'string' && !(target instanceof THREE.Object3D)) {
      return false;
    }

    return true;
  }

  /**
   * Execute the action
   */
  protected async onExecute(params: Params): Promise<void> {
    const { target, disposeGeometry = true, disposeMaterial = true } = params as any;

    // Find the object to remove
    const objectToRemove = this.findObject(target);

    if (!objectToRemove) {
      throw new Error(`Object not found: ${target}`);
    }

    // Remove from scene
    this.removeFromScene(objectToRemove);

    // Dispose resources if requested
    if (disposeGeometry || disposeMaterial) {
      this.disposeResources(objectToRemove, disposeGeometry, disposeMaterial);
    }

    this.info(`Removed mesh ${objectToRemove.name || objectToRemove.uuid} from scene`);
  }

  /**
   * Find object in scene
   */
  private findObject(target: string | THREE.Object3D): THREE.Object3D | null {
    // If target is already an Object3D, return it
    if (target instanceof THREE.Object3D) {
      return target;
    }

    // Search in scene
    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;
      const scene = sceneManager?.getScene?.();

      if (scene) {
        // Try to find by UUID first
        const byUuid = scene.getObjectByProperty('uuid', target);
        if (byUuid) {
          return byUuid;
        }

        // Try to find by name
        const byName = scene.getObjectByName(target);
        if (byName) {
          return byName;
        }

        // Search recursively
        let found: THREE.Object3D | null = null;
        scene.traverse((obj: any) => {
          if (!found && (obj.name === target || obj.uuid === target)) {
            found = obj;
          }
        });
        return found;
      }
    }

    return null;
  }

  /**
   * Remove object from scene
   */
  private removeFromScene(object: THREE.Object3D): void {
    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;

      // Try using SceneManager's removeObject method
      if (sceneManager?.removeObject) {
        sceneManager.removeObject(object);
      } else if (sceneManager?.getScene?.()) {
        // Fall back to direct scene manipulation
        const scene = sceneManager.getScene();
        scene.remove(object);

        // Also remove from parent if it has one
        if (object.parent) {
          object.parent.remove(object);
        }
      }
    }
  }

  /**
   * Dispose geometry and material resources
   */
  private disposeResources(
    object: THREE.Object3D,
    disposeGeometry: boolean,
    disposeMaterial: boolean,
  ): void {
    if (object instanceof THREE.Mesh) {
      // Dispose geometry
      if (disposeGeometry && object.geometry) {
        object.geometry.dispose();
      }

      // Dispose material
      if (disposeMaterial && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    }

    // Recursively dispose children
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (disposeGeometry && child.geometry) {
          child.geometry.dispose();
        }

        if (disposeMaterial && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
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
        },
        disposeGeometry: {
          type: 'boolean',
          default: true,
        },
        disposeMaterial: {
          type: 'boolean',
          default: true,
        },
      },
      required: ['target'],
    };
  }
}
