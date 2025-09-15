import type { DSLScene, DSLObject, DSLObjectType, DSLMeshComponent, DSLLightComponent, DSLCameraComponent } from '../types';
import type { USDScene, USDPrim, USDAttribute, USDRelationship, Xformable, Gprim, Camera, Light } from '../../USD/types/core';
import { USDPrimType, USDAttributeType } from '../../USD/types/core';

export class USDSceneExporter {
  private _scene: DSLScene | null = null;
  private _primMap: Map<string, USDPrim> = new Map();

  async export(dslScene: DSLScene, options: any = {}): Promise<USDScene> {
    this._scene = dslScene;
    this._primMap.clear();

    // 创建USD场景
    const usdScene: USDScene = {
      stage: {
        rootLayer: {
          specifier: 'def',
          primChildren: []
        },
        sessionLayer: {
          specifier: 'over',
          primChildren: []
        }
      },
      defaultPrim: '/World',
      metersPerUnit: 1,
      upAxis: 'Y'
    };

    // 创建根Prim
    const worldPrim: USDPrim = {
      path: '/World',
      name: 'World',
      specifier: 'def',
      typeName: USDPrimType.Xform,
      attributes: new Map(),
      relationships: new Map(),
      metadata: {
        'kind': 'assembly'
      },
      children: []
    };

    usdScene.stage.rootLayer.primChildren.push(worldPrim);
    this._primMap.set('/World', worldPrim);

    // 导出根对象的子对象
    for (const childId of dslScene.root.children) {
      await this._exportObject(childId, worldPrim, '/World');
    }

    return usdScene;
  }

  private async _exportObject(objectId: string, parentPrim: USDPrim, parentPath: string): Promise<void> {
    const object = this._scene!.objects.get(objectId);
    if (!object) return;

    // 创建对应的USD Prim
    const primPath = `${parentPath}/${object.name}`;
    const prim = this._createPrimFromObject(object, primPath);

    if (!prim) return;

    parentPrim.children!.push(prim);
    this._primMap.set(primPath, prim);

    // 导出变换
    this._exportTransform(object, prim);

    // 导出可见性
    this._exportVisibility(object, prim);

    // 导出组件
    await this._exportComponents(object, prim);

    // 递归导出子对象
    for (const childId of object.children) {
      await this._exportObject(childId, prim, primPath);
    }
  }

  private _createPrimFromObject(object: DSLObject, primPath: string): USDPrim | null {
    const basePrim: USDPrim = {
      path: primPath,
      name: object.name,
      specifier: 'def',
      typeName: USDPrimType.Xform,
      attributes: new Map(),
      relationships: new Map(),
      metadata: {
        ...object.metadata,
        'dsl:id': object.id,
        'dsl:type': object.type
      },
      children: []
    };

    // 根据对象类型创建对应的Prim
    switch (object.type) {
      case 'group':
        return basePrim;

      case 'mesh':
        return {
          ...basePrim,
          typeName: USDPrimType.Mesh
        };

      case 'light':
        return {
          ...basePrim,
          typeName: USDPrimType.SphereLight // 默认使用球光
        };

      case 'camera':
        return {
          ...basePrim,
          typeName: USDPrimType.Camera
        };

      case 'usd-prim':
        // 如果已经是USD Prim，保持其类型
        const usdType = object.metadata['usd:typeName'] || USDPrimType.Xform;
        return {
          ...basePrim,
          typeName: usdType
        };

      default:
        return basePrim;
    }
  }

  private _exportTransform(object: DSLObject, prim: USDPrim): void {
    const { position, rotation, scale } = object.transform;

    // 创建xformOp属性
    const xformOpOrder: USDAttribute = {
      name: 'xformOpOrder',
      typeName: USDAttributeType.TokenArray,
      value: ['xformOp:translate', 'xformOp:rotateXYZ', 'xformOp:scale'],
      metadata: new Map()
    };
    prim.attributes.set('xformOpOrder', xformOpOrder);

    // 平移
    const translateAttr: USDAttribute = {
      name: 'xformOp:translate',
      typeName: USDAttributeType.Double3,
      value: position,
      metadata: new Map()
    };
    prim.attributes.set('xformOp:translate', translateAttr);

    // 旋转 (从四元数转换为欧拉角)
    const eulerRotation = this._quaternionToEuler(rotation);
    const rotateAttr: USDAttribute = {
      name: 'xformOp:rotateXYZ',
      typeName: USDAttributeType.Double3,
      value: eulerRotation,
      metadata: new Map()
    };
    prim.attributes.set('xformOp:rotateXYZ', rotateAttr);

    // 缩放
    const scaleAttr: USDAttribute = {
      name: 'xformOp:scale',
      typeName: USDAttributeType.Double3,
      value: scale,
      metadata: new Map()
    };
    prim.attributes.set('xformOp:scale', scaleAttr);
  }

  private _exportVisibility(object: DSLObject, prim: USDPrim): void {
    const visibilityAttr: USDAttribute = {
      name: 'visibility',
      typeName: USDAttributeType.Token,
      value: object.visible ? 'inherited' : 'invisible',
      metadata: new Map()
    };
    prim.attributes.set('visibility', visibilityAttr);
  }

  private async _exportComponents(object: DSLObject, prim: USDPrim): Promise<void> {
    for (const component of object.components.values()) {
      switch (component.type) {
        case 'mesh':
          await this._exportMeshComponent(component as DSLMeshComponent, prim);
          break;

        case 'light':
          await this._exportLightComponent(component as DSLLightComponent, prim);
          break;

        case 'camera':
          await this._exportCameraComponent(component as DSLCameraComponent, prim);
          break;

        case 'material':
          await this._exportMaterialComponent(component, prim);
          break;
      }
    }
  }

  private async _exportMeshComponent(component: DSLMeshComponent, prim: USDPrim): Promise<void> {
    // 设置Mesh相关的属性
    const meshPrim = prim as Gprim;

    // 这里需要根据实际的geometry数据来设置points、faceVertexCounts、faceVertexIndices等属性
    // 由于DSL中的geometry是引用ID，我们需要从资源管理器中获取实际的geometry数据
    const geometryId = component.data.geometry;

    // 创建材质绑定关系
    if (component.data.material) {
      const materialBindingRel: USDRelationship = {
        name: 'material:binding',
        targetPaths: [`/Materials/${component.data.material}`]
      };
      prim.relationships.set('material:binding', materialBindingRel);
    }

    // 阴影属性
    if (component.data.castShadow) {
      const castShadowsAttr: USDAttribute = {
        name: 'primvars:castShadows',
        typeName: USDAttributeType.Int,
        value: 1,
        metadata: new Map()
      };
      prim.attributes.set('primvars:castShadows', castShadowsAttr);
    }

    if (component.data.receiveShadow) {
      const receiveShadowsAttr: USDAttribute = {
        name: 'primvars:receiveShadows',
        typeName: USDAttributeType.Int,
        value: 1,
        metadata: new Map()
      };
      prim.attributes.set('primvars:receiveShadows', receiveShadowsAttr);
    }
  }

  private async _exportLightComponent(component: DSLLightComponent, prim: USDPrim): Promise<void> {
    const lightPrim = prim as Light;

    // 根据灯光类型设置Prim类型
    switch (component.data.lightType) {
      case 'directional':
        prim.typeName = USDPrimType.DistantLight;
        break;
      case 'point':
        prim.typeName = USDPrimType.SphereLight;
        break;
      case 'spot':
        prim.typeName = USDPrimType.DiskLight; // 近似处理
        break;
    }

    // 颜色
    const colorAttr: USDAttribute = {
      name: 'color',
      typeName: USDAttributeType.Color3f,
      value: component.data.color,
      metadata: new Map()
    };
    prim.attributes.set('color', colorAttr);

    // 强度
    const intensityAttr: USDAttribute = {
      name: 'intensity',
      typeName: USDAttributeType.Float,
      value: component.data.intensity,
      metadata: new Map()
    };
    prim.attributes.set('intensity', intensityAttr);

    // 距离（对于点光源和聚光灯）
    if (component.data.distance !== undefined) {
      const radiusAttr: USDAttribute = {
        name: 'radius',
        typeName: USDAttributeType.Float,
        value: component.data.distance,
        metadata: new Map()
      };
      prim.attributes.set('radius', radiusAttr);
    }

    // 角度（对于聚光灯）
    if (component.data.angle !== undefined) {
      const coneAngleAttr: USDAttribute = {
        name: 'angle',
        typeName: USDAttributeType.Float,
        value: component.data.angle * 180 / Math.PI, // 转换为角度
        metadata: new Map()
      };
      prim.attributes.set('angle', coneAngleAttr);
    }
  }

  private async _exportCameraComponent(component: DSLCameraComponent, prim: USDPrim): Promise<void> {
    const cameraPrim = prim as Camera;

    if (component.data.cameraType === 'perspective') {
      // 透视投影
      const fovAttr: USDAttribute = {
        name: 'focalLength',
        typeName: USDAttributeType.Float,
        value: this._fovToFocalLength(component.data.fov || 50),
        metadata: new Map()
      };
      prim.attributes.set('focalLength', fovAttr);

      const horizApertureAttr: USDAttribute = {
        name: 'horizontalAperture',
        typeName: USDAttributeType.Float,
        value: 36, // 35mm胶片宽度
        metadata: new Map()
      };
      prim.attributes.set('horizontalAperture', horizApertureAttr);

      const vertApertureAttr: USDAttribute = {
        name: 'verticalAperture',
        typeName: USDAttributeType.Float,
        value: 24, // 35mm胶片高度
        metadata: new Map()
      };
      prim.attributes.set('verticalAperture', vertApertureAttr);
    }

    // 裁剪平面
    const clippingRangeAttr: USDAttribute = {
      name: 'clippingRange',
      typeName: USDAttributeType.Double2,
      value: [component.data.near, component.data.far],
      metadata: new Map()
    };
    prim.attributes.set('clippingRange', clippingRangeAttr);
  }

  private async _exportMaterialComponent(component: DSLComponent, prim: USDPrim): Promise<void> {
    // 这里需要创建材质Prim，通常在/Materials路径下
    // 由于材质可能共享，我们需要在全局材质表中创建引用
    const materialId = component.data.id || component.id;

    // 创建材质绑定
    const materialBindingRel: USDRelationship = {
      name: 'material:binding',
      targetPaths: [`/Materials/${materialId}`]
    };
    prim.relationships.set('material:binding', materialBindingRel);
  }

  private _quaternionToEuler(quat: [number, number, number, number]): [number, number, number] {
    const [x, y, z, w] = quat;

    // 转换为欧拉角（弧度）
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (w * y - z * x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * Math.PI / 2;
    } else {
      pitch = Math.asin(sinp);
    }

    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return [roll, pitch, yaw];
  }

  private _fovToFocalLength(fov: number): number {
    // 将视场角转换为焦距（mm）
    const filmHeight = 24; // 35mm胶片高度
    return filmHeight / (2 * Math.tan((fov * Math.PI / 180) / 2));
  }
}

export function createUSDSceneExporter(): USDSceneExporter {
  return new USDSceneExporter();
}