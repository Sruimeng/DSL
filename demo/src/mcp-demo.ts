/**
 * MCP Demo Example - MCP 演示示例
 *
 * 演示如何通过 MCP 控制器与 DSL Engine 交互
 */

import { DSLEngine } from '../../src/core/DSLEngine';
import { MCPController } from '../../src/mcp/MCPController';
import { AddMeshAction } from '../../src/actions/AddMeshAction';
import { RemoveMeshAction } from '../../src/actions/RemoveMeshAction';
import { ModifyPropertyAction } from '../../src/actions/ModifyPropertyAction';

async function mcpDemo() {
  console.log('=== MCP Demo Example ===');

  // 1. 创建基础场景
  const baseScene = {
    usdVersion: '0.0.1',
    scene: {
      name: 'MCPDemoScene',
      children: [
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
      ],
    },
  };

  try {
    // 2. 初始化 DSL Engine
    const engine = new DSLEngine();
    await engine.loadDSL(baseScene);

    // 3. 创建 MCP 控制器
    const mcp = new MCPController(engine);

    // 4. 注册动作到 MCP
    mcp.registerAction('AddMesh', AddMeshAction);
    mcp.registerAction('RemoveMesh', RemoveMeshAction);
    mcp.registerAction('ModifyProperty', ModifyPropertyAction);

    console.log('MCP Controller initialized with actions');

    // 5. 获取场景管理器并启动渲染
    const sceneManager = engine.getSceneManager();
    if (sceneManager) {
      sceneManager.startRenderLoop();

      // 6. 演示 MCP 动作调用

      // 添加一个红色立方体
      console.log('Adding a red cube...');
      await mcp.callAction('AddMesh', {
        geometry: 'BoxGeometry',
        width: 1,
        height: 1,
        depth: 1,
        material: {
          type: 'MeshStandardMaterial',
          color: '#ff0000',
        },
        position: { x: -2, y: 0, z: 0 },
        name: 'RedCube',
      });

      // 添加一个蓝色球体
      console.log('Adding a blue sphere...');
      await mcp.callAction('AddMesh', {
        geometry: 'SphereGeometry',
        radius: 0.5,
        material: {
          type: 'MeshStandardMaterial',
          color: '#0000ff',
        },
        position: { x: 2, y: 0, z: 0 },
        name: 'BlueSphere',
      });

      // 添加一个绿色圆环
      console.log('Adding a green torus...');
      await mcp.callAction('AddMesh', {
        geometry: 'TorusGeometry',
        radius: 0.7,
        tube: 0.2,
        material: {
          type: 'MeshStandardMaterial',
          color: '#00ff00',
        },
        position: { x: 0, y: 1, z: 0 },
        name: 'GreenTorus',
      });

      // 修改立方体的属性
      console.log('Modifying red cube properties...');
      await mcp.callAction('ModifyProperty', {
        target: 'RedCube',
        properties: {
          position: { x: -2, y: 0.5, z: 0 },
          rotation: { x: 0.5, y: 0.5, z: 0 },
          scale: { x: 1.2, y: 1.2, z: 1.2 },
        },
      });

      // 修改球体的材质颜色
      console.log('Changing sphere color to yellow...');
      await mcp.callAction('ModifyProperty', {
        target: 'BlueSphere',
        properties: {
          material: '#ffff00',
        },
      });

      // 获取所有可用工具
      console.log('\nAvailable MCP tools:');
      const tools = mcp.getTools();
      tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });

      // 7. 演示错误处理
      console.log('\nTesting error handling...');
      try {
        await mcp.callAction('NonExistentAction', {});
      } catch (error) {
        console.log('Caught expected error:', (error as Error).message);
      }

      // 8. 创建一个简单的命令行界面（仅在 Node.js 环境中）
      if (typeof window === 'undefined') {
        console.log('\n=== Interactive MCP Command Line ===');
        console.log('Available commands:');
        console.log('- add <geometry> [name]: Add a new mesh');
        console.log('- remove <name>: Remove a mesh');
        console.log('- modify <name> <property> <value>: Modify object property');
        console.log('- list: List all objects');
        console.log('- exit: Exit demo');

        // 模拟命令行输入
        const simulateCommands = async () => {
          const commands = [
            'add ConeGeometry MyCone',
            'list',
            'modify MyCone position {"x":0,"y":2,"z":0}',
            'remove MyCone',
            'exit',
          ];

          for (const cmd of commands) {
            console.log(`\n> ${cmd}`);
            await processCommand(cmd);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        };

        const processCommand = async (command: string) => {
          const parts = command.split(' ');
          const cmd = parts[0];

          switch (cmd) {
            case 'add':
              const geometry = parts[1];
              const name = parts[2] || `Object_${Date.now()}`;
              await mcp.callAction('AddMesh', {
                geometry,
                position: { x: Math.random() * 4 - 2, y: 0, z: Math.random() * 4 - 2 },
                name,
              });
              console.log(`Added ${name} with ${geometry}`);
              break;

            case 'remove':
              const targetName = parts[1];
              await mcp.callAction('RemoveMesh', {
                target: targetName,
              });
              console.log(`Removed ${targetName}`);
              break;

            case 'modify':
              const target = parts[1];
              const prop = parts[2];
              const valueStr = parts.slice(3).join(' ');
              try {
                const value = JSON.parse(valueStr);
                await mcp.callAction('ModifyProperty', {
                  target,
                  properties: {
                    [prop]: value,
                  },
                });
                console.log(`Modified ${target}.${prop} = ${valueStr}`);
              } catch (e) {
                console.log('Invalid JSON value');
              }
              break;

            case 'list':
              if (sceneManager) {
                const objects: string[] = [];
                sceneManager.getScene().traverse((obj: any) => {
                  if (obj.name && obj.name !== 'Scene') {
                    objects.push(`- ${obj.name} (${obj.type})`);
                  }
                });
                console.log('Objects in scene:');
                objects.forEach(obj => console.log(obj));
              }
              break;

            case 'exit':
              console.log('Goodbye!');
              break;

            default:
              console.log('Unknown command');
          }
        };

        // 启动命令模拟
        await simulateCommands();
      } else {
        // 浏览器环境下的演示
        console.log('\nMCP Demo completed successfully!');
        console.log('Check the scene for the created objects.');

        // 添加交互提示
        console.log('\nYou can interact with the demo using the developer console:');
        console.log('- window.mcp.callAction("AddMesh", params)');
        console.log('- window.mcp.callAction("RemoveMesh", { target: "ObjectName" })');
        console.log('- window.mcp.callAction("ModifyProperty", { target: "ObjectName", properties: {...} })');

        // 将 mcp 挂载到 window 对象以便调试
        (window as any).mcp = mcp;
      }
    }
  } catch (error) {
    console.error('Error in MCP demo:', error);
  }
}

// 导出示例函数
export { mcpDemo };

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  (window as any).mcpDemo = mcpDemo;
}