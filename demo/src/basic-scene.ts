/**
 * Basic Scene Example - 基础场景示例
 *
 * 演示如何使用 DSL 创建基础的 3D 场景
 */

import { DSLEngine } from '../../src/core/DSLEngine';

async function basicSceneExample() {
  console.log('=== Basic Scene Example ===');

  // 1. 创建一个简单的 USD 场景描述
  const simpleScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'BasicScene',
      worldTransform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      children: [
        {
          type: 'mesh',
          name: 'Ground',
          geometry: {
            type: 'PlaneGeometry',
            width: 10,
            height: 10,
            widthSegments: 1,
            heightSegments: 1,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#808080',
            roughness: 0.8,
            metalness: 0.2,
          },
          transform: {
            position: { x: 0, y: -2, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
        {
          type: 'mesh',
          name: 'Cube',
          geometry: {
            type: 'BoxGeometry',
            width: 1,
            height: 1,
            depth: 1,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#00ff00',
            roughness: 0.5,
            metalness: 0.5,
          },
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
        {
          type: 'mesh',
          name: 'Sphere',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.5,
            widthSegments: 32,
            heightSegments: 16,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#ff0000',
            roughness: 0.3,
            metalness: 0.7,
          },
          transform: {
            position: { x: 2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
        {
          type: 'light',
          name: 'AmbientLight',
          lightType: 'ambient',
          intensity: 0.4,
          color: '#ffffff',
        },
        {
          type: 'light',
          name: 'DirectionalLight',
          lightType: 'directional',
          intensity: 0.8,
          color: '#ffffff',
          transform: {
            position: { x: 5, y: 5, z: 5 },
            rotation: { x: -Math.PI / 4, y: Math.PI / 4, z: 0 },
          },
        },
        {
          type: 'camera',
          name: 'MainCamera',
          cameraType: 'perspective',
          fov: 75,
          aspect: window.innerWidth / window.innerHeight,
          near: 0.1,
          far: 1000,
          transform: {
            position: { x: 3, y: 3, z: 5 },
            rotation: { x: -0.3, y: 0.5, z: 0 },
          },
        },
      ],
    },
  };

  try {
    // 2. 初始化 DSL Engine
    const engine = new DSLEngine();

    // 3. 加载 USD 场景
    await engine.loadDSL(simpleScene);

    // 4. 获取场景管理器
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      console.log('Scene loaded successfully!');
      console.log('Scene contains:', sceneManager.getScene().children.length, 'objects');

      // 5. 启动渲染循环
      sceneManager.startRenderLoop();

      // 6. 添加简单的动画
      const cube = sceneManager.getScene().getObjectByName('Cube');
      if (cube) {
        const animate = () => {
          requestAnimationFrame(animate);
          cube.rotation.y += 0.01;
        };
        animate();
      }

      console.log('Basic scene example completed!');
    }
  } catch (error) {
    console.error('Error in basic scene example:', error);
  }
}

// 导出示例函数
export { basicSceneExample };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).basicSceneExample = basicSceneExample;
}
