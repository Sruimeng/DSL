/**
 * Add Mesh Action - 添加网格动作
 *
 * 向场景中添加网格对象的动作。
 */

import * as THREE from 'three';
import type { Params } from '../type';
import { BaseAction } from './base-action';

/**
 * AddMeshAction 用于向场景中添加各种类型的网格
 * 支持基本几何体和自定义网格
 */
export class AddMeshAction extends BaseAction {
  name = 'AddMesh';
  description = 'Add a mesh to the scene';
  metadata = {
    category: 'scene',
    icon: 'cube',
    permissions: ['scene:write'],
  };

  /**
   * Validate action parameters
   */
  validate(params: Params | undefined): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }

    const { geometry } = params as any;

    // Check if geometry is specified
    if (!geometry || typeof geometry !== 'string') {
      return false;
    }

    // Validate geometry type
    const validGeometries = [
      'BoxGeometry',
      'SphereGeometry',
      'CylinderGeometry',
      'ConeGeometry',
      'TorusGeometry',
      'PlaneGeometry',
      'CircleGeometry',
      'RingGeometry',
      'TetrahedronGeometry',
      'OctahedronGeometry',
      'IcosahedronGeometry',
      'DodecahedronGeometry',
      'TubeGeometry',
      'LatheGeometry',
      'ExtrudeGeometry',
      'ShapeGeometry',
    ];

    if (!validGeometries.includes(geometry)) {
      return false;
    }

    // If custom vertices are provided, validate them
    if (geometry === 'BufferGeometry' && (params as any).vertices) {
      if (!Array.isArray((params as any).vertices) || (params as any).vertices.length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute the action
   */
  protected async onExecute(params: Params): Promise<THREE.Mesh> {
    const {
      geometry,
      material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      scale = { x: 1, y: 1, z: 1 },
      name,
      userData,
      castShadow = true,
      receiveShadow = true,
    } = params as any;

    // Create geometry
    const geom = this.createGeometry(geometry, params);

    // Create material
    const mat = this.createMaterial(material);

    // Create mesh
    const mesh = new THREE.Mesh(geom, mat);

    // Apply transforms
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.scale.set(scale.x, scale.y, scale.z);

    // Set properties
    if (name) {
      mesh.name = name;
    }
    if (userData) {
      mesh.userData = { ...userData };
    }

    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    // Add to scene
    this.addToScene(mesh);

    this.info(`Added mesh ${name || mesh.uuid} to scene`);

    return mesh;
  }

  /**
   * Create geometry based on type
   */
  private createGeometry(type: string, params: Params): THREE.BufferGeometry {
    const p = params as any;
    switch (type) {
      case 'BoxGeometry':
        return new THREE.BoxGeometry(
          p.width || 1,
          p.height || 1,
          p.depth || 1,
          p.widthSegments || 1,
          p.heightSegments || 1,
          p.depthSegments || 1,
        );

      case 'SphereGeometry':
        return new THREE.SphereGeometry(
          p.radius || 1,
          p.widthSegments || 32,
          p.heightSegments || 16,
          p.phiStart ?? 0,
          p.phiLength ?? Math.PI * 2,
          p.thetaStart ?? 0,
          p.thetaLength ?? Math.PI,
        );

      case 'CylinderGeometry':
        return new THREE.CylinderGeometry(
          p.radiusTop || 1,
          p.radiusBottom || 1,
          p.height || 2,
          p.radialSegments || 32,
          p.heightSegments || 1,
          p.openEnded || false,
          p.thetaStart ?? 0,
          p.thetaLength ?? Math.PI * 2,
        );

      case 'ConeGeometry':
        return new THREE.ConeGeometry(
          p.radius || 1,
          p.height || 2,
          p.radialSegments || 32,
          p.heightSegments || 1,
          p.openEnded || false,
          p.thetaStart ?? 0,
          p.thetaLength ?? Math.PI * 2,
        );

      case 'TorusGeometry':
        return new THREE.TorusGeometry(
          p.radius || 1,
          p.tube || 0.4,
          p.radialSegments || 16,
          p.tubularSegments || 100,
          p.arc ?? Math.PI * 2,
        );

      case 'PlaneGeometry':
        return new THREE.PlaneGeometry(
          p.width || 1,
          p.height || 1,
          p.widthSegments || 1,
          p.heightSegments || 1,
        );

      case 'CircleGeometry':
        return new THREE.CircleGeometry(
          p.radius || 1,
          p.segments || 32,
          p.thetaStart ?? 0,
          p.thetaLength ?? Math.PI * 2,
        );

      case 'RingGeometry':
        return new THREE.RingGeometry(
          p.innerRadius || 0.5,
          p.outerRadius || 1,
          p.thetaSegments || 32,
          p.phiSegments || 1,
          p.thetaStart ?? 0,
          p.thetaLength ?? Math.PI * 2,
        );

      case 'TetrahedronGeometry':
        return new THREE.TetrahedronGeometry(p.radius || 1, p.detail || 0);

      case 'OctahedronGeometry':
        return new THREE.OctahedronGeometry(p.radius || 1, p.detail || 0);

      case 'IcosahedronGeometry':
        return new THREE.IcosahedronGeometry(p.radius || 1, p.detail || 0);

      case 'DodecahedronGeometry':
        return new THREE.DodecahedronGeometry(p.radius || 1, p.detail || 0);

      case 'BufferGeometry':
        if (p.vertices && Array.isArray(p.vertices)) {
          const geometry = new THREE.BufferGeometry();
          const vertices = new Float32Array(p.vertices);
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

          if (p.indices && Array.isArray(p.indices)) {
            geometry.setIndex(p.indices);
          }

          if (p.normals && Array.isArray(p.normals)) {
            const normals = new Float32Array(p.normals);
            geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          }

          if (p.uvs && Array.isArray(p.uvs)) {
            const uvs = new Float32Array(p.uvs);
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          }

          return geometry;
        }
        throw new Error('BufferGeometry requires vertices parameter');

      default:
        throw new Error(`Unsupported geometry type: ${type}`);
    }
  }

  /**
   * Create material based on input
   */
  private createMaterial(materialInput: any): THREE.Material {
    if (materialInput instanceof THREE.Material) {
      return materialInput;
    }

    if (typeof materialInput === 'object') {
      switch (materialInput.type) {
        case 'MeshBasicMaterial':
          return new THREE.MeshBasicMaterial(materialInput);
        case 'MeshStandardMaterial':
          return new THREE.MeshStandardMaterial(materialInput);
        case 'MeshPhongMaterial':
          return new THREE.MeshPhongMaterial(materialInput);
        case 'MeshLambertMaterial':
          return new THREE.MeshLambertMaterial(materialInput);
        case 'MeshPhysicalMaterial':
          return new THREE.MeshPhysicalMaterial(materialInput);
        case 'MeshToonMaterial':
          return new THREE.MeshToonMaterial(materialInput);
        case 'MeshNormalMaterial':
          return new THREE.MeshNormalMaterial();
        case 'MeshMatcapMaterial':
          return new THREE.MeshMatcapMaterial(materialInput);
        default:
          return new THREE.MeshStandardMaterial(materialInput);
      }
    }

    // Default material
    return new THREE.MeshStandardMaterial({
      color: materialInput || 0x00ff00,
    });
  }

  /**
   * Add mesh to scene
   */
  private addToScene(mesh: THREE.Mesh): void {
    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;
      if (sceneManager?.addObject) {
        sceneManager.addObject(mesh);
      } else if (sceneManager?.getScene?.()) {
        sceneManager.getScene().add(mesh);
      }
    }
  }

  /**
   * Get action schema for parameter validation
   */
  getSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        geometry: {
          type: 'string',
          enum: [
            'BoxGeometry',
            'SphereGeometry',
            'CylinderGeometry',
            'ConeGeometry',
            'TorusGeometry',
            'PlaneGeometry',
            'CircleGeometry',
            'RingGeometry',
            'TetrahedronGeometry',
            'OctahedronGeometry',
            'IcosahedronGeometry',
            'DodecahedronGeometry',
            'BufferGeometry',
          ],
        },
        material: {
          oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'object' }],
        },
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
        name: { type: 'string' },
        castShadow: { type: 'boolean' },
        receiveShadow: { type: 'boolean' },
      },
      required: ['geometry'],
    };
  }
}
