import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MaterialManager, SdfPath, ThreeJSAdapter, USDScene, UsdStageImpl } from '../';

/**
 * USD场景构建器演示
 * 展示如何使用USDScene API构建复杂的3D场景
 */
export const USDSceneBuilder: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [sceneInfo, setSceneInfo] = useState<any>(null);
  const [selectedPrim, setSelectedPrim] = useState<string>('');
  const sceneRef = useRef<USDScene | null>(null);
  const adapterRef = useRef<ThreeJSAdapter | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 初始化USD场景
    const { scene, adapter } = initializeUSDScene();

    // 构建示例场景
    buildExampleScene(scene);

    // 同步到Three.js并开始渲染
    adapter.syncScene();
    startRenderLoop(adapter);

    // 更新场景信息
    setSceneInfo(scene.getSceneInfo());

    return () => {
      cleanup();
    };
  }, []);

  /**
   * 初始化USD场景
   */
  const initializeUSDScene = () => {
    // 创建根图层
    const rootLayer = {
      identifier: 'scene.usda',
      displayName: 'USD Scene',
      rootPrims: [],
      subLayers: [],
      timeCodesPerSecond: 24,
      framesPerSecond: 24,
    };

    // 创建Stage
    const stage = new UsdStageImpl(rootLayer);

    // 创建材质管理器
    const materialManager = new MaterialManager(stage);

    // 创建USD场景
    const scene = new USDScene(stage, materialManager);
    sceneRef.current = scene;

    // 创建Three.js适配器
    const adapter = new ThreeJSAdapter(stage, materialManager);
    adapterRef.current = adapter;

    return { scene, adapter };
  };

  /**
   * 构建示例场景
   */
  const buildExampleScene = (scene: USDScene) => {
    // 1. 创建基础几何体
    createBasicGeometry(scene);

    // 2. 创建复杂网格
    createComplexMesh(scene);

    // 3. 创建材质
    createMaterials(scene);

    // 4. 应用材质
    applyMaterials(scene);

    // 5. 创建灯光
    createLighting(scene);

    // 6. 创建相机
    createCameras(scene);

    // 7. 添加动画
    addAnimations(scene);

    // 8. 创建引用（组合示例）
    createReferences(scene);

    // 9. 创建变体（变体示例）
    createVariants(scene);
  };

  /**
   * 创建基础几何体
   */
  const createBasicGeometry = (scene: USDScene) => {
    // 地面
    scene.createCube('Ground', {
      position: [0, -0.5, 0],
      scale: [20, 1, 20],
    });

    // 中心球体
    scene.createSphere('CenterSphere', {
      radius: 1,
      position: [0, 1, 0],
    });

    // 左侧立方体
    scene.createCube('LeftCube', {
      size: 1.5,
      position: [-3, 0.75, 0],
      rotation: [0, 45, 0],
    });

    // 右侧圆柱体
    scene.createCylinder('RightCylinder', {
      radius: 0.5,
      height: 2,
      position: [3, 1, 0],
    });

    // 后方平面（作为背景）
    scene.createPlane('BackPlane', {
      width: 15,
      height: 10,
      position: [0, 2, -8],
      rotation: [10, 0, 0],
    });
  };

  /**
   * 创建复杂网格
   */
  const createComplexMesh = (scene: USDScene) => {
    // 创建金字塔
    const pyramidPoints = [
      // 底面四个顶点
      -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1,
      // 顶点
      0, 2, 0,
    ];

    const pyramidFaceCounts = [3, 3, 3, 3, 3, 3];
    const pyramidIndices = [
      // 底面（两个三角形）
      0, 1, 2, 0, 2, 3,
      // 侧面（四个三角形）
      0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4,
    ];

    scene.createCustomMesh(
      'Pyramid',
      {
        points: pyramidPoints,
        faceVertexCounts: pyramidFaceCounts,
        faceVertexIndices: pyramidIndices,
      },
      {
        position: [-1, 1, 2],
      },
    );

    // 创建环形结构
    const torusPoints: number[] = [];
    const torusCounts: number[] = [];
    const torusIndices: number[] = [];

    const majorRadius = 1.5;
    const minorRadius = 0.3;
    const majorSegments = 16;
    const minorSegments = 8;

    // 生成环形顶点
    for (let i = 0; i <= majorSegments; i++) {
      const u = (i / majorSegments) * Math.PI * 2;
      const centerX = Math.cos(u) * majorRadius;
      const centerZ = Math.sin(u) * majorRadius;

      for (let j = 0; j <= minorSegments; j++) {
        const v = (j / minorSegments) * Math.PI * 2;
        const x = centerX + Math.cos(v) * minorRadius * Math.cos(u);
        const y = Math.sin(v) * minorRadius;
        const z = centerZ + Math.cos(v) * minorRadius * Math.sin(u);

        torusPoints.push(x, y, z);
      }
    }

    // 生成面
    for (let i = 0; i < majorSegments; i++) {
      for (let j = 0; j < minorSegments; j++) {
        const a = i * (minorSegments + 1) + j;
        const b = a + minorSegments + 1;
        const c = b + 1;
        const d = a + 1;

        torusCounts.push(4, 4);
        torusIndices.push(a, b, c, d, a, d, c, b);
      }
    }

    scene.createCustomMesh(
      'Torus',
      {
        points: torusPoints,
        faceVertexCounts: torusCounts,
        faceVertexIndices: torusIndices,
      },
      {
        position: [1, 1, 2],
      },
    );
  };

  /**
   * 创建材质
   */
  const createMaterials = (scene: USDScene) => {
    // 基础材质
    scene.createMaterial('RedPlastic', {
      color: [0.8, 0.2, 0.2],
      roughness: 0.8,
      metallic: 0.0,
    });

    scene.createMaterial('BlueMetal', {
      color: [0.2, 0.2, 0.8],
      roughness: 0.1,
      metallic: 1.0,
    });

    scene.createMaterial('GreenGlass', {
      color: [0.2, 0.8, 0.2],
      roughness: 0.0,
      opacity: 0.3,
      ior: 1.5,
    });

    scene.createMaterial('Gold', {
      color: [1.0, 0.8, 0.2],
      roughness: 0.2,
      metallic: 1.0,
    });

    scene.createMaterial('WhiteMatte', {
      color: [0.9, 0.9, 0.9],
      roughness: 1.0,
      metallic: 0.0,
    });

    // 发光材质
    scene.createMaterial('Emissive', {
      color: [0.1, 0.1, 0.1],
      emissive: [1.0, 0.5, 0.2],
    });
  };

  /**
   * 应用材质
   */
  const applyMaterials = (scene: USDScene) => {
    // 地面使用白色哑光材质
    scene.assignMaterial(new SdfPath('/World/Geometry/Ground'), 'WhiteMatte');

    // 球体使用金色材质
    scene.assignMaterial(new SdfPath('/World/Geometry/CenterSphere'), 'Gold');

    // 立方体使用红色塑料
    scene.assignMaterial(new SdfPath('/World/Geometry/LeftCube'), 'RedPlastic');

    // 圆柱体使用蓝色金属
    scene.assignMaterial(new SdfPath('/World/Geometry/RightCylinder'), 'BlueMetal');

    // 背景平面使用绿色玻璃
    scene.assignMaterial(new SdfPath('/World/Geometry/BackPlane'), 'GreenGlass');

    // 金字塔使用金色
    scene.assignMaterial(new SdfPath('/World/Geometry/Pyramid'), 'Gold');

    // 环形使用红色塑料
    scene.assignMaterial(new SdfPath('/World/Geometry/Torus'), 'RedPlastic');
  };

  /**
   * 创建灯光
   */
  const createLighting = (scene: USDScene) => {
    // 主光源（方向光）
    scene.createLight('KeyLight', 'directional', {
      color: [1.0, 0.95, 0.8],
      intensity: 1.5,
      rotation: [-45, -30, 0],
      angle: 0.53,
    });

    // 环境光
    scene.createLight('FillLight', 'dome', {
      color: [0.5, 0.7, 1.0],
      intensity: 0.3,
    });

    // 点光源（动态）
    scene.createLight('PointLight', 'point', {
      color: [1.0, 0.5, 0.2],
      intensity: 2.0,
      position: [3, 2, 3],
      radius: 0.1,
    });

    // 聚光灯
    scene.createLight('SpotLight', 'spot', {
      color: [0.8, 0.8, 1.0],
      intensity: 3.0,
      position: [-2, 3, 2],
      rotation: [-30, 0, 0],
      width: 2.0,
      height: 2.0,
    });
  };

  /**
   * 创建相机
   */
  const createCameras = (scene: USDScene) => {
    // 主相机
    scene.createCamera('MainCamera', {
      position: [5, 3, 5],
      rotation: [-20, 45, 0],
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 1000,
    });

    // 顶视图相机
    scene.createCamera('TopCamera', {
      position: [0, 10, 0],
      rotation: [-90, 0, 0],
      fov: 60,
    });

    // 侧视图相机
    scene.createCamera('SideCamera', {
      position: [10, 2, 0],
      rotation: [0, 90, 0],
      fov: 60,
    });
  };

  /**
   * 添加动画
   */
  const addAnimations = (scene: USDScene) => {
    // 球体旋转动画
    scene.createAnimation(new SdfPath('/World/Geometry/CenterSphere'), 'xformOp:rotateXYZ', [
      { time: 0, value: [0, 0, 0] },
      { time: 24, value: [0, 360, 0] },
      { time: 48, value: [0, 720, 0] },
    ]);

    // 立方体缩放动画
    scene.createAnimation(new SdfPath('/World/Geometry/LeftCube'), 'xformOp:scale', [
      { time: 0, value: [1, 1, 1] },
      { time: 12, value: [1.2, 1.2, 1.2] },
      { time: 24, value: [0.8, 0.8, 0.8] },
      { time: 36, value: [1.2, 1.2, 1.2] },
      { time: 48, value: [1, 1, 1] },
    ]);

    // 点光源移动动画
    scene.createAnimation(new SdfPath('/World/Lights/PointLight'), 'xformOp:translate', [
      { time: 0, value: [3, 2, 3] },
      { time: 12, value: [-3, 2, -3] },
      { time: 24, value: [-3, 2, 3] },
      { time: 36, value: [3, 2, -3] },
      { time: 48, value: [3, 2, 3] },
    ]);

    // 材质颜色动画
    scene.createAnimation(
      new SdfPath('/World/Materials/RedPlastic/surfaceShader'),
      'diffuseColor',
      [
        { time: 0, value: [0.8, 0.2, 0.2] },
        { time: 16, value: [0.2, 0.8, 0.2] },
        { time: 32, value: [0.2, 0.2, 0.8] },
        { time: 48, value: [0.8, 0.2, 0.2] },
      ],
    );
  };

  /**
   * 创建引用（组合功能）
   */
  const createReferences = (scene: USDScene) => {
    // 创建一个可重用的资产
    const assetPath = scene.createSphere('Asset_Sphere', {
      radius: 0.5,
    });
    scene.assignMaterial(assetPath, 'BlueMetal');

    // 创建多个引用实例
    for (let i = 0; i < 5; i++) {
      const instancePath = scene.createTransform(`Instance_${i}`);
      scene.setTransform(instancePath, {
        position: [i * 2 - 4, 3, -2],
        scale: [0.5, 0.5, 0.5],
      });

      // 这里应该创建对原始资产的引用
      // 简化处理，直接复制
      const copyPath = scene.duplicatePrim(assetPath, `Copy_${i}`);
      if (copyPath) {
        scene.setParent(copyPath, instancePath);
      }
    }
  };

  /**
   * 创建变体（变体示例）
   */
  const createVariants = (scene: USDScene) => {
    // 创建一个带有变体的Prim
    const variantPrim = scene.createTransform('VariantObject');

    // 创建变体集
    const variants = [
      {
        name: 'Cube',
        primSpec: {
          typeName: 'Cube',
          attributes: {
            size: { defaultValue: 1.0 },
          },
        },
      },
      {
        name: 'Sphere',
        primSpec: {
          typeName: 'Sphere',
          attributes: {
            radius: { defaultValue: 0.7 },
          },
        },
      },
      {
        name: 'Cylinder',
        primSpec: {
          typeName: 'Cylinder',
          attributes: {
            radius: { defaultValue: 0.5 },
            height: { defaultValue: 1.5 },
          },
        },
      },
    ];

    scene.createVariantSet(variantPrim, 'Geometry', variants);
    scene.setTransform(variantPrim, {
      position: [0, 2, 4],
    });

    // 默认选择Cube变体
    scene.setVariantSelection(variantPrim, 'Geometry', 'Cube');
  };

  /**
   * 开始渲染循环
   */
  const startRenderLoop = (adapter: ThreeJSAdapter) => {
    const scene = adapter.getScene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(5, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // 更新时间以驱动动画
      const time = (Date.now() * 0.001 * 24) % 48; // 48帧循环
      adapter.getStage().setTime(time);

      renderer.render(scene, camera);
    };
    animate();

    // 窗口大小调整
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return { renderer, controls };
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (mountRef.current && adapterRef.current) {
      const canvas = mountRef.current.querySelector('canvas');
      if (canvas) {
        mountRef.current.removeChild(canvas);
      }
    }
  };

  /**
   * 导出USD
   */
  const handleExportUSD = () => {
    if (!sceneRef.current) return;

    const usdaContent = sceneRef.current.exportToUSDA();
    const blob = new Blob([usdaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.usda';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 添加随机Prim
   */
  const handleAddRandomPrim = () => {
    if (!sceneRef.current) return;

    const types = ['Sphere', 'Cube', 'Cylinder'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 1],
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const primName = `Random${type}_${Date.now()}`;
    let primPath: SdfPath;

    switch (type) {
      case 'Sphere':
        primPath = sceneRef.current.createSphere(primName, {
          radius: Math.random() * 0.5 + 0.3,
          position: [(Math.random() - 0.5) * 10, Math.random() * 3 + 2, (Math.random() - 0.5) * 10],
        });
        break;
      case 'Cube':
        primPath = sceneRef.current.createCube(primName, {
          size: Math.random() * 0.8 + 0.4,
          position: [(Math.random() - 0.5) * 10, Math.random() * 3 + 2, (Math.random() - 0.5) * 10],
        });
        break;
      case 'Cylinder':
        primPath = sceneRef.current.createCylinder(primName, {
          radius: Math.random() * 0.4 + 0.2,
          height: Math.random() * 1.5 + 0.5,
          position: [(Math.random() - 0.5) * 10, Math.random() * 3 + 2, (Math.random() - 0.5) * 10],
        });
        break;
      default:
        return;
    }

    // 创建并应用随机材质
    const materialName = `${primName}_Material`;
    sceneRef.current.createMaterial(materialName, {
      color: color,
      metallic: Math.random(),
      roughness: Math.random(),
    });

    sceneRef.current.assignMaterial(primPath, materialName);

    // 同步到Three.js
    adapterRef.current?.syncScene();

    // 更新场景信息
    setSceneInfo(sceneRef.current.getSceneInfo());
  };

  /**
   * 切换变体
   */
  const handleSwitchVariant = (variantName: string) => {
    if (!sceneRef.current) return;

    sceneRef.current.setVariantSelection(
      new SdfPath('/World/Geometry/VariantObject'),
      'Geometry',
      variantName,
    );

    adapterRef.current?.syncScene();
  };

  return (
    <div className="usd-scene-builder">
      <div ref={mountRef} className="viewport" />

      <div className="controls">
        <div className="panel">
          <h2>USD Scene Builder Demo</h2>

          {sceneInfo && (
            <div className="section">
              <h3>Scene Statistics</h3>
              <ul>
                <li>Total Prims: {sceneInfo.primCount}</li>
                <li>Materials: {sceneInfo.materialCount}</li>
                <li>Lights: {sceneInfo.lightCount}</li>
                <li>Cameras: {sceneInfo.cameraCount}</li>
              </ul>
            </div>
          )}

          <div className="section">
            <h3>Scene Operations</h3>
            <button onClick={handleAddRandomPrim}>Add Random Prim</button>
            <button onClick={handleExportUSD}>Export USD</button>
            <button onClick={() => adapterRef.current?.syncScene()}>Sync Scene</button>
          </div>

          <div className="section">
            <h3>Variant Switching</h3>
            <button onClick={() => handleSwitchVariant('Cube')}>Show Cube Variant</button>
            <button onClick={() => handleSwitchVariant('Sphere')}>Show Sphere Variant</button>
            <button onClick={() => handleSwitchVariant('Cylinder')}>Show Cylinder Variant</button>
          </div>

          <div className="section">
            <h3>Features Demonstrated</h3>
            <ul>
              <li>✅ USD Scene Hierarchy</li>
              <li>✅ Primitive Creation</li>
              <li>✅ Material System</li>
              <li>✅ Lighting Setup</li>
              <li>✅ Animation System</li>
              <li>✅ Custom Meshes</li>
              <li>✅ Variant Sets</li>
              <li>✅ Scene Statistics</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .usd-scene-builder {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #111;
        }

        .viewport {
          width: 100%;
          height: 100%;
        }

        .controls {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          max-width: 300px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .panel h2 {
          margin-top: 0;
          color: #4caf50;
          font-size: 20px;
        }

        .section {
          margin: 20px 0;
          padding-top: 20px;
          border-top: 1px solid #333;
        }

        .section:first-child {
          border-top: none;
          padding-top: 0;
        }

        .section h3 {
          margin-bottom: 10px;
          color: #81c784;
          font-size: 16px;
        }

        button {
          display: block;
          width: 100%;
          margin: 5px 0;
          padding: 10px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        button:hover {
          background: #45a049;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        li {
          padding: 2px 0;
          font-size: 14px;
        }

        .section ul li:before {
          content: '• ';
          color: #4caf50;
        }
      `}</style>
    </div>
  );
};
