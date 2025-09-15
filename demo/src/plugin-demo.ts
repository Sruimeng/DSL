/**
 * Plugin Demo Example - 插件演示示例
 *
 * 演示如何使用和创建插件
 */

import { DSLEngine } from '../../src/core/DSLEngine';
import { BasePlugin } from '../../src/plugins/BasePlugin';
import * as THREE from 'three';

// 自定义插件示例
class CustomStatsPlugin extends BasePlugin {
  name = 'CustomStatsPlugin';
  version = '1.0.0';
  description = 'Custom statistics plugin for demo';

  private stats: {
    fps: number;
    objects: number;
    triangles: number;
  } = {
    fps: 0,
    objects: 0,
    triangles: 0,
  };

  private lastTime = 0;
  private frames = 0;

  onRegister(engine: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  }): void {
    super.onRegister(engine);
    console.log('CustomStatsPlugin registered');
  }

  update(deltaTime: number): void {
    // 计算 FPS
    this.frames++;
    const currentTime = performance.now();
    if (currentTime >= this.lastTime + 1000) {
      this.stats.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }

    // 更新统计信息
    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;
      const scene = sceneManager?.getScene?.();
      if (scene) {
        this.stats.objects = scene.children.length;
      }
    }
  }

  getStats() {
    return { ...this.stats };
  }
}

// 动画插件示例
class AnimationPlugin extends BasePlugin {
  name = 'AnimationPlugin';
  version = '1.0.0';
  description = 'Simple animation plugin';

  private animatedObjects: Map<THREE.Object3D, {
    rotationSpeed: { x: number; y: number; z: number };
    floatSpeed: number;
    floatHeight: number;
    initialY: number;
  }> = new Map();

  onRegister(engine: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  }): void {
    super.onRegister(engine);

    // 查找需要动画的对象
    if (this.engine?.getSceneManager) {
      const sceneManager = this.engine.getSceneManager() as any;
      const scene = sceneManager?.getScene?.();
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.userData?.animate) {
            this.animatedObjects.set(obj, {
              rotationSpeed: obj.userData.rotationSpeed || { x: 0, y: 0.01, z: 0 },
              floatSpeed: obj.userData.floatSpeed || 1,
              floatHeight: obj.userData.floatHeight || 0.5,
              initialY: obj.position.y,
            });
          }
        });
      }
    }
  }

  update(deltaTime: number): void {
    const time = performance.now() * 0.001;

    this.animatedObjects.forEach((animation, obj) => {
      // 旋转动画
      obj.rotation.x += animation.rotationSpeed.x;
      obj.rotation.y += animation.rotationSpeed.y;
      obj.rotation.z += animation.rotationSpeed.z;

      // 浮动动画
      obj.position.y = animation.initialY + Math.sin(time * animation.floatSpeed) * animation.floatHeight;
    });
  }

  addObject(obj: THREE.Object3D, options: {
    rotationSpeed?: { x: number; y: number; z: number };
    floatSpeed?: number;
    floatHeight?: number;
  } = {}): void {
    this.animatedObjects.set(obj, {
      rotationSpeed: options.rotationSpeed || { x: 0, y: 0.01, z: 0 },
      floatSpeed: options.floatSpeed || 1,
      floatHeight: options.floatHeight || 0.5,
      initialY: obj.position.y,
    });
  }

  removeObject(obj: THREE.Object3D): void {
    this.animatedObjects.delete(obj);
  }
}

async function pluginDemo() {
  console.log('=== Plugin Demo Example ===');

  // 创建场景
  const scene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'PluginDemoScene',
      children: [
        {
          type: 'mesh',
          name: 'AnimatedCube',
          geometry: {
            type: 'BoxGeometry',
            width: 1,
            height: 1,
            depth: 1,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#00ff00',
          },
          transform: {
            position: { x: 0, y: 0, z: 0 },
          },
          userData: {
            animate: true,
            rotationSpeed: { x: 0.01, y: 0.02, z: 0 },
            floatSpeed: 2,
            floatHeight: 0.5,
          },
        },
        {
          type: 'mesh',
          name: 'AnimatedSphere',
          geometry: {
            type: 'SphereGeometry',
            radius: 0.5,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#ff0000',
          },
          transform: {
            position: { x: 2, y: 0, z: 0 },
          },
          userData: {
            animate: true,
            floatSpeed: 1.5,
            floatHeight: 0.8,
          },
        },
        {
          type: 'light',
          name: 'AmbientLight',
          lightType: 'ambient',
          intensity: 0.4,
        },
        {
          type: 'light',
          name: 'DirectionalLight',
          lightType: 'directional',
          intensity: 0.8,
          transform: {
            position: { x: 5, y: 5, z: 5 },
          },
        },
        {
          type: 'camera',
          name: 'MainCamera',
          cameraType: 'perspective',
          fov: 75,
          near: 0.1,
          far: 1000,
          transform: {
            position: { x: 0, y: 2, z: 5 },
          },
        },
      ],
    },
  };

  try {
    // 1. 初始化引擎
    const engine = new DSLEngine();
    await engine.loadDSL(scene);

    // 2. 创建插件实例
    const statsPlugin = new CustomStatsPlugin();
    const animationPlugin = new AnimationPlugin();

    // 3. 注册插件
    engine.registerPlugin('stats', statsPlugin);
    engine.registerPlugin('animation', animationPlugin);

    console.log('Plugins registered successfully');

    // 4. 获取场景管理器并启动渲染
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      sceneManager.startRenderLoop();

      // 5. 添加控制台输出以显示统计信息
      setInterval(() => {
        const stats = statsPlugin.getStats();
        console.log(`FPS: ${stats.fps}, Objects: ${stats.objects}`);
      }, 1000);

      // 6. 添加交互 - 按空格键添加新的动画对象
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          const geometry = new THREE.BoxGeometry(
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5
          );
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
          });
          const mesh = new THREE.Mesh(geometry, material);

          mesh.position.set(
            (Math.random() - 0.5) * 5,
            Math.random() * 2,
            (Math.random() - 0.5) * 5
          );

          mesh.userData.animate = true;

          sceneManager.addObject(mesh);
          animationPlugin.addObject(mesh);

          console.log('Added new animated object');
        }
      };

      window.addEventListener('keypress', handleKeyPress);

      console.log('Plugin demo started! Press SPACE to add animated objects');
    }
  } catch (error) {
    console.error('Error in plugin demo:', error);
  }
}

// 导出示例函数
export { pluginDemo, CustomStatsPlugin, AnimationPlugin };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).pluginDemo = pluginDemo;
}