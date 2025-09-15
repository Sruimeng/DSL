# USD-based DSL 重构方案

## 概述

本项目将现有的DSL架构重构为基于USD（Universal Scene Description）的结构，提供更强大的场景描述能力、组合功能和可扩展性。

## 核心架构

### 1. USD核心系统 (`/types`, `/stage`, `/resolvers`)

- **Prim系统**: 场景图的基本构建块，支持层级结构
- **Stage**: 场景图的根容器，管理Prim和图层
- **属性系统**: 支持时间采样的动态属性
- **组合引擎**: 处理引用、继承、变体等组合弧

### 2. 材质系统 (`/materials`)

- **UsdPreviewSurface**: 标准PBR材质模型
- **材质网络**: 支持节点图和着色器连接
- **材质管理器**: 创建、编辑和验证材质

### 3. 图层系统 (`/layer-system`)

- **图层管理**: 支持多层非破坏性编辑
- **子图层**: 引用外部USD文件
- **图层堆栈**: 弱到强的组合顺序

### 4. 几何体系统 (`/geometry`)

- **基本几何体**: 球体、立方体、圆柱体等
- **网格处理**: 顶点、面、法线、UV坐标
- **几何体工具**: 变换、优化、验证

### 5. Three.js适配器 (`/adapters`)

- **实时渲染**: 将USD场景转换为Three.js对象
- **材质转换**: USD材质到Three.js材质的映射
- **几何体转换**: USD几何体到Three.js几何体的转换

### 6. 插件系统 (`/plugins`)

- **插件管理器**: 动态加载和管理插件
- **插件接口**: 渲染器、导入器、导出器等
- **依赖解析**: 处理插件间的依赖关系

### 7. DSL集成 (`/dsl-integration`)

- **USDDSLEngine**: 桥接DSL和USD的引擎
- **双向转换**: DSL↔USD场景数据的转换

### 8. 迁移工具 (`/migration`)

- **DSL到USD迁移器**: 将现有DSL场景迁移到USD
- **迁移配置**: 可配置的迁移选项

## 使用示例

### 创建USD场景

```typescript
import { UsdStageImpl, SdfPath } from './USD';

// 创建Stage
const stage = new UsdStageImpl(rootLayer);

// 定义Prim
const meshPath = new SdfPath('/World/Geometry/Mesh');
const meshPrim = stage.definePrim(meshPath, 'Mesh');

// 设置属性
stage.setAttributeValue(meshPath, 'xformOp:translate', [0, 0, 0]);
stage.setAttributeValue(meshPath, 'xformOp:scale', [1, 1, 1]);

// 创建材质
const materialManager = new MaterialManager(stage);
const materialPath = materialManager.createMaterial({
  materialName: 'MyMaterial',
  surfaceShader: {
    type: 'UsdPreviewSurface',
    params: {
      diffuseColor: [0.8, 0.2, 0.2],
      metallic: 0.5,
      roughness: 0.3,
    },
  },
});

// 绑定材质
stage.createRelationship(meshPath, 'material:binding', [materialPath]);
```

### 迁移现有DSL场景

```typescript
import { DSLToUSDMigrator, DEFAULT_MIGRATION_CONFIG } from './USD/migration';

const migrator = new DSLToUSDMigrator(stage, materialManager);
const result = await migrator.migrate(dslScene, {
  ...DEFAULT_MIGRATION_CONFIG,
  materialConversion: 'previewSurface',
  validationLevel: 'normal',
});

if (result.success) {
  console.log('迁移成功！', result.log);
} else {
  console.error('迁移失败:', result.errors);
}
```

### 使用Three.js渲染

```typescript
import { ThreeJSAdapter } from './USD/adapters';

const adapter = new ThreeJSAdapter(stage, materialManager);
const threeScene = adapter.getScene();

// 同步场景
adapter.syncScene();

// 获取Three.js对象
const meshObject = adapter.getObjectForPrim(meshPath);
```

## 优势

1. **标准化**: 基于业界标准的USD格式
2. **可组合性**: 支持引用、继承、变体等高级功能
3. **可扩展性**: 插件架构支持自定义功能
4. **兼容性**: 与主流DCC工具（Maya、Houdini、Blender）兼容
5. **性能**: 优化的场景图遍历和属性解析
6. **灵活性**: 支持时间采样和动画

## 迁移步骤

1. **备份现有代码**: 保留原始DSL实现作为参考
2. **逐步替换**: 按模块逐步替换为USD实现
3. **测试验证**: 确保功能正确性和性能
4. **文档更新**: 更新API文档和使用指南
5. **培训团队**: 让团队熟悉新的USD架构

## 注意事项

- USD的学习曲线较陡，需要团队培训
- 某些DSL特有功能需要自定义实现
- 性能调优可能需要根据具体用例进行
- 保持向后兼容性，支持旧场景文件的导入