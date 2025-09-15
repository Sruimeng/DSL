/**
 * Examples Index - 示例索引
 *
 * 提供所有示例的统一入口
 */

// 导入所有示例
export { basicSceneExample } from './basic-scene';
export { pluginDemo, CustomStatsPlugin, AnimationPlugin } from './plugin-demo';
export { mcpDemo } from './mcp-demo';

// 示例列表
export const examples = [
  {
    name: 'Basic Scene',
    description: '基础场景示例，展示如何创建简单的3D场景',
    run: basicSceneExample,
  },
  {
    name: 'Plugin Demo',
    description: '插件演示，展示如何创建和使用自定义插件',
    run: pluginDemo,
  },
  {
    name: 'MCP Demo',
    description: 'MCP演示，展示如何通过MCP控制器与DSL Engine交互',
    run: mcpDemo,
  },
];

// 运行所有示例的辅助函数
export async function runAllExamples() {
  console.log('=== Running All Examples ===\n');

  for (const example of examples) {
    console.log(`\nRunning: ${example.name}`);
    console.log(`Description: ${example.description}`);
    console.log('----------------------------------------');

    try {
      await example.run();
      console.log(`✅ ${example.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${example.name} failed:`, error);
    }

    console.log('========================================\n');

    // 在示例之间添加延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// 如果直接运行此文件，提供交互式选择
if (typeof window !== 'undefined') {
  (window as any).examples = {
    basicScene: basicSceneExample,
    pluginDemo,
    mcpDemo,
    runAll: runAllExamples,
    list: examples,
  };

  console.log('Examples loaded! Available commands:');
  console.log('- examples.basicScene()');
  console.log('- examples.pluginDemo()');
  console.log('- examples.mcpDemo()');
  console.log('- examples.runAll()');
}