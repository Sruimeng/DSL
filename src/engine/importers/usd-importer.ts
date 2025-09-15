import type { USDScene, USDPrim, USDAttribute, USDRelationship } from '../../USD/types/core';
import type { DSLScene, DSLObject, DSLObjectType, DSLTransform, DSLComponent } from '../types';
import { USDPrimType, USDAttributeType } from '../../USD/types/core';
import { v4 as uuidv4 } from 'uuid';

export class USDSceneImporter {
  private _usdScene: USDScene | null = null;
  private _objectMap: Map<string, string> = new Map(); // USD prim path -> DSL object ID

  async import(usdScene: USDScene, options: any = {}): Promise<DSLScene> {
    this._usdScene = usdScene;
    this._objectMap.clear();

    // 创建DSL场景
    const dslScene: DSLScene = {
      id: uuidv4(),
      name: usdScene.defaultPrim || 'USD Scene',
      objects: new Map(),
      root: this._createRootObject(),
      metadata: {
        source: 'USD',
        metersPerUnit: usdScene.metersPerUnit,
        upAxis: usdScene.upAxis
      }
    };

    // 导入根层级的Prim
    if (usdScene.stage.rootLayer.primChildren) {
      for (const prim of usdScene.stage.rootLayer.primChildren) {
        await this._importPrim(prim, dslScene, dslScene.root.id);
      }
    }

    return dslScene;
  }

  private _createRootObject(): DSLObject {
    const rootId = uuidv4();
    return {
      id: rootId,
      name: 'Root',
      type: 'group',
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1]
      },
      visible: true,
      children: [],
      components: new Map(),
      metadata: {}
    };
  }

  private async _importPrim(prim: USDPrim, dslScene: DSLScene, parentId: string): Promise<string | null> {
    // 创建DSL对象
    const object = this._createObjectFromPrim(prim);
    if (!object) return null;

    // 添加到场景
    dslScene.objects.set(object.id, object);
    this._objectMap.set(prim.path, object.id);

    // 设置父子关系
    const parent = dslScene.objects.get(parentId);
    if (parent) {
      parent.children.push(object.id);
      object.parent = parentId;
    }

    // 导入变换
    this._importTransform(prim, object);

    // 导入可见性
    this._importVisibility(prim, object);

    // 导入组件
    await this._importComponents(prim, object, dslScene);

    // 递归导入子Prim
    if (prim.children) {
      for (const childPrim of prim.children) {
        await this._importPrim(childPrim, dslScene, object.id);
      }
    }

    return object.id;
  }

  private _createObjectFromPrim(prim: USDPrim): DSLObject | null {
    // 根据Prim类型确定DSL对象类型
    const type = this._mapPrimTypeToDSLType(prim.typeName);

    const object: DSLObject = {
      id: uuidv4(),
      name: prim.name,
      type,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1]
      },
      visible: true,
      children: [],
      components: new Map(),
      metadata: {
        'usd:path': prim.path,
        'usd:typeName': prim.typeName,
        ...prim.metadata
      }
    };

    return object;
  }

  private _mapPrimTypeToDSLType(primType: string): DSLObjectType {
    switch (primType) {
      case USDPrimType.Xform:
      case USDPrimType.Scope:
        return 'group';

      case USDPrimType.Mesh:
      case USDPrimType.Cube:
      case USDPrimType.Sphere:
      case USDPrimType.Cylinder:
      case USDPrimType.Cone:
        return 'mesh';

      case USDPrimType.DistantLight:
      case USDPrimType.DomeLight:
      case USDPrimType.SphereLight:
      case USDPrimType.DiskLight:
      case USDPrimType.RectLight:
      case USDPrimType.CylinderLight:
        return 'light';

      case USDPrimType.Camera:
        return 'camera';

      default:
        return 'group';
    }
  }

  private _importTransform(prim: USDPrim, object: DSLObject): void {
    // 查找变换属性
    const translateAttr = prim.attributes.get('xformOp:translate');
    const rotateAttr = prim.attributes.get('xformOp:rotateXYZ');
    const scaleAttr = prim.attributes.get('xformOp:scale');
    const matrixAttr = prim.attributes.get('xformOp:transform');

    if (matrixAttr) {
      // 使用矩阵变换
      object.transform.matrix = matrixAttr.value as number[];
      // TODO: 将矩阵分解为position、rotation、scale
    } else {
      // 使用分解的变换
      if (translateAttr) {
        object.transform.position = [...translateAttr.value] as [number, number, number];
      }

      if (rotateAttr) {
        const euler = rotateAttr.value as [number, number, number];
        object.transform.rotation = this._eulerToQuaternion(euler);
      }

      if (scaleAttr) {
        object.transform.scale = [...scaleAttr.value] as [number, number, number];
      }
    }
  }

  private _importVisibility(prim: USDPrim, object: DSLObject): void {
    const visibilityAttr = prim.attributes.get('visibility');
    if (visibilityAttr) {
      object.visible = visibilityAttr.value === 'inherited' || visibilityAttr.value === 'visible';
    }
  }

  private async _importComponents(prim: USDPrim, object: DSLObject, dslScene: DSLScene): Promise<void> {
    // 根据Prim类型导入相应的组件
    switch (prim.typeName) {
      case USDPrimType.Mesh:
        await this._importMeshComponent(prim, object);
        break;

      case USDPrimType.DistantLight:
      case USDPrimType.DomeLight:
      case USDPrimType.SphereLight:
      case USDPrimType.DiskLight:
      case USDPrimType.RectLight:
      case USDPrimType.CylinderLight:
        await this._importLightComponent(prim, object);
        break;

      case USDPrimType.Camera:
        await this._importCameraComponent(prim, object);
        break;
    }

    // 导入材质绑定
    await this._importMaterialBinding(prim, object, dslScene);
  }

  private async _importMeshComponent(prim: USDPrim, object: DSLObject): Promise<void> {
    // 创建Mesh组件
    const meshComponent: DSLComponent = {
      id: uuidv4(),
      type: 'mesh',
      enabled: true,
      data: {
        geometry: prim.path, // 使用Prim路径作为几何体ID
        material: '', // 将在材质绑定中设置
        castShadow: true,
        receiveShadow: true
      }
    };

    // 从Prim属性中提取几何体数据
    const pointsAttr = prim.attributes.get('points');
    const faceVertexCountsAttr = prim.attributes.get('faceVertexCounts');
    const faceVertexIndicesAttr = prim.attributes.get('faceVertexIndices');

    if (pointsAttr || faceVertexCountsAttr || faceVertexIndicesAttr) {
      // 这里可以将实际的geometry数据存储到资源管理器中
      // meshComponent.data.geometry = this._extractGeometryData(prim);
    }

    object.components.set(meshComponent.id, meshComponent);
  }

  private async _importLightComponent(prim: USDPrim, object: DSLObject): Promise<void> {
    // 获取灯光属性
    const colorAttr = prim.attributes.get('color');
    const intensityAttr = prim.attributes.get('intensity');
    const exposureAttr = prim.attributes.get('exposure');
    const radiusAttr = prim.attributes.get('radius');
    const angleAttr = prim.attributes.get('angle');

    // 确定灯光类型
    let lightType: string;
    switch (prim.typeName) {
      case USDPrimType.DistantLight:
        lightType = 'directional';
        break;
      case USDPrimType.DomeLight:
        lightType = 'ambient';
        break;
      case USDPrimType.SphereLight:
        lightType = 'point';
        break;
      default:
        lightType = 'spot';
    }

    // 创建Light组件
    const lightComponent: DSLComponent = {
      id: uuidv4(),
      type: 'light',
      enabled: true,
      data: {
        lightType,
        color: colorAttr ? [...colorAttr.value] as [number, number, number] : [1, 1, 1],
        intensity: intensityAttr ? intensityAttr.value as number : 1,
        distance: radiusAttr ? radiusAttr.value as number : undefined,
        angle: angleAttr ? (angleAttr.value as number) * Math.PI / 180 : undefined, // 转换为弧度
        penumbra: 0.1
      }
    };

    // 处理曝光
    if (exposureAttr) {
      lightComponent.data.intensity *= Math.pow(2, exposureAttr.value as number);
    }

    object.components.set(lightComponent.id, lightComponent);
  }

  private async _importCameraComponent(prim: USDPrim, object: DSLObject): Promise<void> {
    // 获取相机属性
    const focalLengthAttr = prim.attributes.get('focalLength');
    const horizApertureAttr = prim.attributes.get('horizontalAperture');
    const clippingRangeAttr = prim.attributes.get('clippingRange');
    const fStopAttr = prim.attributes.get('fStop');
    const focusDistanceAttr = prim.attributes.get('focusDistance');

    // 计算FOV
    let fov = 50; // 默认值
    if (focalLengthAttr && horizApertureAttr) {
      const focalLength = focalLengthAttr.value as number;
      const filmWidth = horizApertureAttr.value as number;
      fov = 2 * Math.atan(filmWidth / (2 * focalLength)) * 180 / Math.PI;
    }

    // 获取裁剪平面
    let near = 0.1;
    let far = 1000;
    if (clippingRangeAttr) {
      const range = clippingRangeAttr.value as [number, number];
      near = range[0];
      far = range[1];
    }

    // 创建Camera组件
    const cameraComponent: DSLComponent = {
      id: uuidv4(),
      type: 'camera',
      enabled: true,
      data: {
        cameraType: 'perspective',
        fov,
        near,
        far,
        aspect: 16 / 9 // 默认宽高比
      }
    };

    object.components.set(cameraComponent.id, cameraComponent);
  }

  private async _importMaterialBinding(prim: USDPrim, object: DSLObject, dslScene: DSLScene): Promise<void> {
    // 查找材质绑定关系
    const materialBindingRel = prim.relationships.get('material:binding');
    if (!materialBindingRel) return;

    // 获取目标材质路径
    const materialPath = materialBindingRel.targetPaths[0];
    if (!materialPath) return;

    // 创建材质组件（简化处理，实际应该创建材质Prim）
    const materialComponent: DSLComponent = {
      id: uuidv4(),
      type: 'material',
      enabled: true,
      data: {
        type: 'pbr',
        color: [1, 1, 1],
        roughness: 0.5,
        metalness: 0.0,
        opacity: 1.0
      }
    };

    // 更新Mesh组件的材质引用
    const meshComponent = Array.from(object.components.values()).find(c => c.type === 'mesh');
    if (meshComponent) {
      meshComponent.data.material = materialPath;
    }

    object.components.set(materialComponent.id, materialComponent);
  }

  private _eulerToQuaternion(euler: [number, number, number]): [number, number, number, number] {
    const [roll, pitch, yaw] = euler;

    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    const w = cr * cp * cy + sr * sp * sy;
    const x = sr * cp * cy - cr * sp * sy;
    const y = cr * sp * cy + sr * cp * sy;
    const z = cr * cp * sy - sr * sp * cy;

    return [x, y, z, w];
  }
}

export function createUSDSceneImporter(): USDSceneImporter {
  return new USDSceneImporter();
}