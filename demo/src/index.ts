/**
 * Demo Index - 演示索引
 *
 * 提供所有演示的统一入口
 */

// 导入所有演示
export { basicSceneExample } from './basic-scene';
export { materialDemo } from './material-demo';
export { mcpDemo } from './mcp-demo';
export { modelDemo } from './model-demo';
export { AnimationPlugin, CustomStatsPlugin, pluginDemo } from './plugin-demo';
export { undoRedoDemo } from './undo-redo-demo';

// 演示列表
export const demos = [
  {
    name: 'Basic Scene',
    description: '基础场景演示，展示如何创建简单的3D场景',
    run: basicSceneExample,
    file: 'basic-scene.ts',
  },
  {
    name: 'Plugin Demo',
    description: '插件演示，展示如何创建和使用自定义插件',
    run: pluginDemo,
    file: 'plugin-demo.ts',
  },
  {
    name: 'MCP Demo',
    description: 'MCP演示，展示如何通过MCP控制器与DSL Engine交互',
    run: mcpDemo,
    file: 'mcp-demo.ts',
  },
  {
    name: 'Material Demo',
    description: '材质演示，展示各种材质类型和属性的使用',
    run: materialDemo,
    file: 'material-demo.ts',
  },
  {
    name: 'Model Demo',
    description: '模型演示，展示如何加载和展示3D模型',
    run: modelDemo,
    file: 'model-demo.ts',
  },
  {
    name: 'Undo/Redo Demo',
    description: '撤销重做演示，展示如何实现撤销/重做功能',
    run: undoRedoDemo,
    file: 'undo-redo-demo.ts',
  },
];

// 运行所有演示的辅助函数
export async function runAllDemos() {
  console.log('=== Running All Demos ===\n');

  for (const demo of demos) {
    console.log(`\nRunning: ${demo.name}`);
    console.log(`Description: ${demo.description}`);
    console.log(`File: ${demo.file}`);
    console.log('----------------------------------------');

    try {
      await demo.run();
      console.log(`✅ ${demo.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${demo.name} failed:`, error);
    }

    console.log('========================================\n');

    // 在演示之间添加延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// 查找演示
export function findDemo(name: string) {
  return demos.find(
    (demo) =>
      demo.name.toLowerCase().includes(name.toLowerCase()) ||
      demo.file.toLowerCase().includes(name.toLowerCase()),
  );
}

// 运行指定演示
export async function runDemo(name: string) {
  const demo = findDemo(name);
  if (demo) {
    await demo.run();
  } else {
    console.error(`Demo not found: ${name}`);
    console.log('Available demos:', demos.map((d) => d.name).join(', '));
  }
}

// 如果直接运行此文件，提供交互式选择
if (typeof window !== 'undefined') {
  (window as any).demos = {
    basicScene: basicSceneExample,
    pluginDemo,
    mcpDemo,
    materialDemo,
    modelDemo,
    undoRedoDemo,
    runAll: runAllDemos,
    run: runDemo,
    list: demos,
    find: findDemo,
  };

  console.log('Demos loaded! Available commands:');
  console.log('- demos.basicScene()');
  console.log('- demos.pluginDemo()');
  console.log('- demos.mcpDemo()');
  console.log('- demos.materialDemo()');
  console.log('- demos.modelDemo()');
  console.log('- demos.undoRedoDemo()');
  console.log('- demos.runAll()');
  console.log('- demos.run("demo name")');
  console.log('- demos.list.forEach(d => console.log(d.name))');
}
