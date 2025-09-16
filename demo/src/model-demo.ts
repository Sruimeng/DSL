/**
 * Model Demo - 模型演示
 *
 * 展示如何加载和展示3D模型
 */

import { DSLEngine } from '../../src/core/DSLEngine';

async function modelDemo() {
  console.log('=== Model Demo ===');

  // 创建场景用于展示模型
  const modelScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'ModelDemoScene',
      children: [
        // 环境设置
        {
          type: 'light',
          name: 'AmbientLight',
          lightType: 'ambient',
          intensity: 0.4,
          color: '#ffffff',
        },
        // 主光源
        {
          type: 'light',
          name: 'MainDirectionalLight',
          lightType: 'directional',
          intensity: 0.8,
          color: '#ffffff',
          transform: {
            position: { x: 5, y: 10, z: 5 },
            rotation: { x: -0.785, y: 0.785, z: 0 },
          },
        },
        // 补充光源
        {
          type: 'light',
          name: 'FillLight',
          lightType: 'directional',
          intensity: 0.3,
          color: '#ffe4b5',
          transform: {
            position: { x: -5, y: 5, z: -5 },
            rotation: { x: 0.5, y: -0.5, z: 0 },
          },
        },
        // 背光
        {
          type: 'light',
          name: 'RimLight',
          lightType: 'directional',
          intensity: 0.4,
          color: '#4169e1',
          transform: {
            position: { x: 0, y: 5, z: -5 },
            rotation: { x: 0.3, y: 0, z: 0 },
          },
        },
        // 展示平台
        {
          type: 'mesh',
          name: 'DisplayPlatform',
          geometry: {
            type: 'CylinderGeometry',
            radiusTop: 2,
            radiusBottom: 2.5,
            height: 0.2,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#2c3e50',
            roughness: 0.3,
            metalness: 0.8,
          },
          transform: {
            position: { x: 0, y: 0, z: 0 },
          },
        },
        // 地面
        {
          type: 'mesh',
          name: 'Ground',
          geometry: {
            type: 'PlaneGeometry',
            width: 20,
            height: 20,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#ecf0f1',
            roughness: 0.9,
            metalness: 0.1,
          },
          transform: {
            position: { x: 0, y: -1, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
        },
        // 参考网格（用于展示模型尺寸）
        {
          type: 'mesh',
          name: 'ReferenceGrid',
          geometry: {
            type: 'BoxGeometry',
            width: 4,
            height: 4,
            depth: 4,
          },
          material: {
            type: 'MeshBasicMaterial',
            color: '#3498db',
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          },
          transform: {
            position: { x: 0, y: 2, z: 0 },
          },
        },
        // 标签文本（使用简单的几何体代替）
        {
          type: 'mesh',
          name: 'ModelPlaceholder',
          geometry: {
            type: 'BoxGeometry',
            width: 1,
            height: 2,
            depth: 1,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#e74c3c',
            roughness: 0.4,
            metalness: 0.6,
          },
          transform: {
            position: { x: 0, y: 2, z: 0 },
          },
        },
        // 相机
        {
          type: 'camera',
          name: 'MainCamera',
          cameraType: 'perspective',
          fov: 45,
          near: 0.1,
          far: 1000,
          transform: {
            position: { x: 5, y: 3, z: 8 },
            rotation: { x: -0.2, y: 0.5, z: 0 },
          },
        },
      ],
    },
  };

  try {
    // 初始化 DSL Engine
    const engine = new DSLEngine();
    await engine.loadDSL(modelScene);

    console.log('Model demo scene loaded successfully');
    console.log('This demo shows a scene setup ready for 3D model loading');
    console.log('To load actual models, you would need:');
    console.log('1. GLTFLoader for loading .gltf/.glb files');
    console.log('2. FBXLoader for loading .fbx files');
    console.log('3. OBJLoader for loading .obj files');

    // 获取场景管理器并启动渲染
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      if (typeof window !== 'undefined') {
        sceneManager.startRenderLoop();

        // 添加旋转动画
        const placeholder = sceneManager.getScene().getObjectByName('ModelPlaceholder');
        const grid = sceneManager.getScene().getObjectByName('ReferenceGrid');

        const animate = () => {
          requestAnimationFrame(animate);

          if (placeholder) {
            placeholder.rotation.y += 0.005;
          }
          if (grid) {
            grid.rotation.y -= 0.003;
          }
        };

        animate();

        // 挂载到 window 对象
        (window as any).engine = engine;
        console.log('Model demo started! The placeholder shows where models would be loaded.');
      } else {
        console.log('Scene initialized (no render loop in Node.js environment)');
      }
    }

    return engine;
  } catch (error) {
    console.error('Error in model demo:', error);
    throw error;
  }
}

// 导出演示函数
export { modelDemo };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).modelDemo = modelDemo;
}