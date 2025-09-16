/**
 * Material Demo - 材质演示
 *
 * 展示各种材质类型和属性的使用
 */

import { DSLEngine } from '../../src/core/DSLEngine';

async function materialDemo() {
  console.log('=== Material Demo ===');

  // 创建包含各种材质的场景
  const materialScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'MaterialDemoScene',
      children: [
        // 环境光
        {
          type: 'light',
          name: 'AmbientLight',
          lightType: 'ambient',
          intensity: 0.2,
        },
        // 主方向光
        {
          type: 'light',
          name: 'DirectionalLight',
          lightType: 'directional',
          intensity: 1.0,
          color: '#ffffff',
          transform: {
            position: { x: 5, y: 10, z: 5 },
          },
        },
        // 点光源（用于展示高光）
        {
          type: 'light',
          name: 'PointLight',
          lightType: 'point',
          intensity: 0.5,
          color: '#ffffff',
          distance: 100,
          transform: {
            position: { x: 2, y: 3, z: 2 },
          },
        },
        // 基础网格材质
        {
          type: 'mesh',
          name: 'MeshBasicMaterial',
          geometry: {
            type: 'BoxGeometry',
            width: 1,
            height: 1,
            depth: 1,
          },
          material: {
            type: 'MeshBasicMaterial',
            color: '#ff0000',
            wireframe: false,
          },
          transform: {
            position: { x: -4, y: 1, z: 0 },
          },
        },
        // 标准网格材质 - 金属
        {
          type: 'mesh',
          name: 'StandardMetal',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.6,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#silver',
            metalness: 1.0,
            roughness: 0.2,
          },
          transform: {
            position: { x: -2, y: 1, z: 0 },
          },
        },
        // 标准网格材质 - 塑料
        {
          type: 'mesh',
          name: 'StandardPlastic',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.6,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#00ff00',
            metalness: 0.0,
            roughness: 0.5,
          },
          transform: {
            position: { x: 0, y: 1, z: 0 },
          },
        },
        // 标准网格材质 - 粗糙金属
        {
          type: 'mesh',
          name: 'RoughMetal',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.6,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#gold',
            metalness: 1.0,
            roughness: 0.8,
          },
          transform: {
            position: { x: 2, y: 1, z: 0 },
          },
        },
        // 物理材质 - 清漆
        {
          type: 'mesh',
          name: 'Clearcoat',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.6,
          },
          material: {
            type: 'MeshPhysicalMaterial',
            color: '#4169E1',
            metalness: 0.0,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
          },
          transform: {
            position: { x: 4, y: 1, z: 0 },
          },
        },
        // 地面
        {
          type: 'mesh',
          name: 'Ground',
          geometry: {
            type: 'PlaneGeometry',
            width: 15,
            height: 15,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#f0f0f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
        },
        // 相机
        {
          type: 'camera',
          name: 'MainCamera',
          cameraType: 'perspective',
          fov: 60,
          near: 0.1,
          far: 1000,
          transform: {
            position: { x: 0, y: 3, z: 8 },
            rotation: { x: -0.2, y: 0, z: 0 },
          },
        },
      ],
    },
  };

  try {
    // 初始化 DSL Engine
    const engine = new DSLEngine();
    await engine.loadDSL(materialScene);

    console.log('Material demo loaded successfully');

    // 获取场景管理器并启动渲染
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      if (typeof window !== 'undefined') {
        sceneManager.startRenderLoop();

        // 添加动画效果
        const spheres = [
          sceneManager.getScene().getObjectByName('StandardMetal'),
          sceneManager.getScene().getObjectByName('StandardPlastic'),
          sceneManager.getScene().getObjectByName('RoughMetal'),
          sceneManager.getScene().getObjectByName('Clearcoat'),
        ];

        const animate = () => {
          requestAnimationFrame(animate);

          spheres.forEach((sphere, index) => {
            if (sphere) {
              sphere.rotation.y += 0.01;
              sphere.position.y = 1 + Math.sin(Date.now() * 0.001 + index) * 0.2;
            }
          });
        };

        animate();

        // 挂载到 window 对象
        (window as any).engine = engine;
        console.log('Material demo started! Objects are animated to showcase material properties.');
      } else {
        console.log('Scene initialized (no render loop in Node.js environment)');
      }
    }

    return engine;
  } catch (error) {
    console.error('Error in material demo:', error);
    throw error;
  }
}

// 导出演示函数
export { materialDemo };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).materialDemo = materialDemo;
}