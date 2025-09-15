/**
 * Undo/Redo Demo - 撤销重做演示
 *
 * 展示如何实现撤销/重做功能
 */

import { DSLEngine } from '../../src/core/DSLEngine';

async function undoRedoDemo() {
  console.log('=== Undo/Redo Demo ===');

  // 创建基础场景
  const baseScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'UndoRedoDemoScene',
      children: [
        // 基础设置
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
            position: { x: 0, y: 3, z: 8 },
          },
        },
        // 地面
        {
          type: 'mesh',
          name: 'Ground',
          geometry: {
            type: 'PlaneGeometry',
            width: 10,
            height: 10,
          },
          material: {
            type: 'MeshStandardMaterial',
            color: '#808080',
          },
          transform: {
            position: { x: 0, y: -2, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
        },
      ],
    },
  };

  try {
    // 初始化 DSL Engine
    const engine = new DSLEngine();
    await engine.loadDSL(baseScene);

    console.log('Undo/Redo demo initialized');
    console.log('Controls:');
    console.log('- Press "A" to add a random object');
    console.log('- Press "Z" to undo last action');
    console.log('- Press "Y" to redo last undone action');
    console.log('- Press "C" to clear all objects');

    // 获取场景管理器
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      if (typeof window !== 'undefined') {
        sceneManager.startRenderLoop();

        // 历史记录管理
        const history: any[] = [];
        let historyIndex = -1;

        // 添加对象函数
        const addRandomObject = () => {
          const geometries = ['BoxGeometry', 'SphereGeometry', 'ConeGeometry', 'CylinderGeometry', 'TorusGeometry'];
          const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

          const geometry = geometries[Math.floor(Math.random() * geometries.length)];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const name = `Object_${Date.now()}`;

          const newObject = {
            type: 'mesh',
            name,
            geometry: {
              type: geometry,
              ...(geometry === 'BoxGeometry' && { width: 1, height: 1, depth: 1 }),
              ...(geometry === 'SphereGeometry' && { radius: 0.5 }),
              ...(geometry === 'ConeGeometry' && { radius: 0.5, height: 1 }),
              ...(geometry === 'CylinderGeometry' && { radiusTop: 0.5, radiusBottom: 0.5, height: 1 }),
              ...(geometry === 'TorusGeometry' && { radius: 0.7, tube: 0.2 }),
            },
            material: {
              type: 'MeshStandardMaterial',
              color,
            },
            transform: {
              position: {
                x: (Math.random() - 0.5) * 6,
                y: Math.random() * 2,
                z: (Math.random() - 0.5) * 6,
              },
            },
          };

          // 保存到历史记录
          saveToHistory('add', { object: newObject });

          // 添加到场景
          const threeObject = engine['dslParser'].parseObject(newObject);
          if (threeObject) {
            sceneManager.addObject(threeObject);
            console.log(`Added ${name}`);
          }
        };

        // 删除最后一个对象
        const removeLastObject = () => {
          const scene = sceneManager.getScene();
          const meshes = scene.children.filter(child => child.type === 'Mesh');

          if (meshes.length > 0) {
            const lastMesh = meshes[meshes.length - 1];
            saveToHistory('remove', {
              object: lastMesh.userData.sourceData,
              index: meshes.length - 1
            });
            sceneManager.removeObject(lastMesh);
            console.log(`Removed ${lastMesh.name}`);
          }
        };

        // 保存到历史记录
        const saveToHistory = (action: string, data: any) => {
          // 删除当前位置之后的历史
          history.splice(historyIndex + 1);

          // 添加新记录
          history.push({ action, data, timestamp: Date.now() });
          historyIndex = history.length - 1;

          console.log(`History: ${historyIndex + 1}/${history.length}`);
        };

        // 撤销
        const undo = () => {
          if (historyIndex >= 0) {
            const current = history[historyIndex];

            if (current.action === 'add') {
              // 找到并删除添加的对象
              const scene = sceneManager.getScene();
              const object = scene.getObjectByName(current.data.object.name);
              if (object) {
                sceneManager.removeObject(object);
              }
            } else if (current.action === 'remove') {
              // 重新添加删除的对象
              const threeObject = engine['dslParser'].parseObject(current.data.object);
              if (threeObject) {
                sceneManager.addObject(threeObject);
              }
            }

            historyIndex--;
            console.log(`Undo! History: ${historyIndex + 1}/${history.length}`);
          } else {
            console.log('Nothing to undo');
          }
        };

        // 重做
        const redo = () => {
          if (historyIndex < history.length - 1) {
            historyIndex++;
            const current = history[historyIndex];

            if (current.action === 'add') {
              // 重新添加对象
              const threeObject = engine['dslParser'].parseObject(current.data.object);
              if (threeObject) {
                sceneManager.addObject(threeObject);
              }
            } else if (current.action === 'remove') {
              // 再次删除对象
              const scene = sceneManager.getScene();
              const object = scene.getObjectByName(current.data.object.name);
              if (object) {
                sceneManager.removeObject(object);
              }
            }

            console.log(`Redo! History: ${historyIndex + 1}/${history.length}`);
          } else {
            console.log('Nothing to redo');
          }
        };

        // 清除所有对象
        const clearAll = () => {
          const scene = sceneManager.getScene();
          const meshes = [...scene.children.filter(child => child.type === 'Mesh')];

          if (meshes.length > 0) {
            saveToHistory('clear', { objects: meshes.map(m => ({
              object: m.userData.sourceData,
              index: scene.children.indexOf(m)
            }))});

            meshes.forEach(mesh => sceneManager.removeObject(mesh));
            console.log(`Cleared ${meshes.length} objects`);
          }
        };

        // 键盘事件处理
        const handleKeyPress = (event: KeyboardEvent) => {
          switch (event.key.toLowerCase()) {
            case 'a':
              addRandomObject();
              break;
            case 'z':
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                undo();
              }
              break;
            case 'y':
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                redo();
              }
              break;
            case 'c':
              if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                clearAll();
              }
              break;
          }
        };

        window.addEventListener('keydown', handleKeyPress);

        // 添加一些初始对象
        setTimeout(() => {
          addRandomObject();
          setTimeout(() => addRandomObject(), 500);
          setTimeout(() => addRandomObject(), 1000);
        }, 1000);

        // 挂载到 window 对象
        (window as any).engine = engine;
        (window as any).undoRedoDemo = {
          addRandomObject,
          removeLastObject,
          undo,
          redo,
          clearAll,
          getHistory: () => ({ history, historyIndex }),
        };

        console.log('Undo/Redo demo started! Try the keyboard controls.');
      } else {
        console.log('Scene initialized (no render loop in Node.js environment)');
      }
    }

    return engine;
  } catch (error) {
    console.error('Error in undo/redo demo:', error);
    throw error;
  }
}

// 导出演示函数
export { undoRedoDemo };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).undoRedoDemo = undoRedoDemo;
}
