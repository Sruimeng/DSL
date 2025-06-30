# TripoScript 2.1 纯JavaScript Demo

这些demo展示了TripoScript 2.1 DSL引擎的各种功能和特性，全部使用纯JavaScript编写，无需React或其他框架。

## 🎯 Demo列表

### 1. 基础示例 (`basic-example.html`)
展示DSL引擎的核心功能和基本使用方法：
- **基础对象操作**：创建立方体、球体、平面
- **材质系统**：标准材质、线框模式、随机颜色
- **光照控制**：环境光、平行光开关
- **状态监听**：实时显示场景状态信息

**技术要点**：
- TripoEngine初始化和Action派发
- TripoRenderer自动状态同步
- 轨道控制器集成

### 2. 对象操作 (`object-operations.html`)
演示完整的对象生命周期管理：
- **CRUD操作**：创建、选择、修改、删除对象
- **变换控制**：实时位置、旋转、缩放调整
- **层级管理**：对象组合和取消组合
- **历史记录**：撤销/重做功能

**技术要点**：
- Action模式的完整实现
- 对象选择和高亮显示
- 变换矩阵的实时更新

### 3. 材质管理 (`material-manager.html`)
专注于材质系统的深度展示：
- **材质类型**：标准、基础、线框、Phong材质
- **属性控制**：颜色、金属度、粗糙度、透明度
- **预设材质**：黄金、银色、玻璃、木材等
- **批量操作**：随机化、重置、材质球展示

**技术要点**：
- 材质状态管理
- 属性动态更新
- 材质合批优化

### 4. 场景构建 (`scene-builder.html`)
复杂3D场景的搭建和环境设置：
- **场景模板**：城市、森林、博物馆、工作室、太空、极简
- **光照系统**：多种光源类型和质量控制
- **环境配置**：背景、雾效、时间段设置
- **相机控制**：视角调整、动画预设

**技术要点**：
- 复杂场景的程序化生成
- 环境光照系统
- 相机动画实现

### 5. 交互控制 (`interactive-demo.html`)
鼠标控制、动画和实时交互功能：
- **交互模式**：选择、移动、旋转、缩放、绘制、删除
- **动画系统**：旋转、弹跳、波浪、轨道动画
- **物理效果**：重力、力场、碰撞检测
- **实时绘制**：鼠标拖拽创建对象

**技术要点**：
- 射线投射和对象拾取
- 动画状态管理
- 简单物理模拟

### 6. 性能测试 (`performance-test.html`)
大量对象管理和性能优化：
- **压力测试**：100-5000个对象的性能表现
- **性能监控**：FPS、渲染时间、内存使用
- **优化策略**：实例化、剔除、LOD、材质合批
- **自动化测试**：基准测试、压力测试、内存泄漏检测

**技术要点**：
- 性能指标监控
- 批量对象管理
- 渲染优化技术

## 🚀 运行Demo

### 本地开发服务器
由于使用了ES6模块，需要通过HTTP服务器运行：

```bash
# 使用Python (推荐)
cd demo
python -m http.server 8080

# 使用Node.js
npm install -g live-server
live-server demo

# 使用VS Code Live Server插件
# 右键index.html -> Open with Live Server
```

然后访问 `http://localhost:8080`

### 直接打开文件
某些浏览器（如Chrome）不允许直接打开使用ES6模块的HTML文件，会遇到CORS错误。

## 🎨 架构特点

### 1. 框架无关性
- 所有demo都使用纯JavaScript编写
- 不依赖React、Vue等UI框架
- 可以轻松集成到任何前端项目

### 2. 状态驱动
```javascript
// DSL引擎作为唯一状态源
const engine = new TripoEngine();

// 通过Action修改状态
engine.dispatch({
  type: 'ADD_OBJECT',
  payload: { /* object data */ }
});

// 渲染器自动同步状态变化
const renderer = new TripoRenderer(canvas, engine);
```

### 3. Action模式
所有状态修改都通过Action进行，确保：
- 状态变更的可预测性
- 操作历史的可追踪性
- 撤销/重做功能的实现

### 4. 自动同步渲染
ThreeJS渲染器自动监听DSL状态变化：
- 无需手动调用渲染函数
- 增量更新，性能优化
- 完全解耦的渲染层

## 📚 学习路径

### 新手推荐顺序：
1. **基础示例** - 了解核心概念
2. **对象操作** - 学习Action模式
3. **材质管理** - 掌握材质系统
4. **场景构建** - 构建复杂场景
5. **交互控制** - 实现用户交互
6. **性能测试** - 优化和扩展

### 进阶开发者：
- 直接查看感兴趣的功能demo
- 研究源码实现细节
- 参考架构设计模式

## 🔧 自定义和扩展

### 添加新的几何体类型
```javascript
// 在renderer中扩展createGeometry方法
case 'torus':
  return new THREE.TorusGeometry(
    geomDef.params.radius || 1,
    geomDef.params.tube || 0.4,
    geomDef.params.radialSegments || 8,
    geomDef.params.tubularSegments || 6
  );
```

### 创建自定义材质
```javascript
// 添加新的材质类型
const customMaterial = engine.addMaterial({
  type: 'custom',
  shader: 'your-custom-shader',
  uniforms: { /* shader uniforms */ }
});
```

### 实现新的动画类型
```javascript
// 在动画系统中添加新类型
case 'spiral':
  const spiralRadius = anim.radius + time * anim.growth;
  const spiralAngle = time * anim.speed;
  // ... 螺旋运动逻辑
```

## 🐛 常见问题

### 1. 模块加载错误
**问题**：`Failed to load module`
**解决**：确保通过HTTP服务器运行，不要直接打开HTML文件

### 2. Three.js版本兼容
**问题**：某些Three.js API不可用
**解决**：检查Three.js版本，demo基于Three.js r150+

### 3. 性能问题
**问题**：大量对象时卡顿
**解决**：使用性能测试demo中的优化策略

### 4. 内存泄漏
**问题**：长时间运行内存增长
**解决**：确保正确调用dispose方法清理资源

## 📈 性能基准

在现代浏览器中的预期性能：
- **100个对象**：60 FPS
- **500个对象**：45-60 FPS  
- **1000个对象**：30-45 FPS
- **5000个对象**：15-30 FPS（需要优化）

实际性能取决于：
- 硬件配置（GPU性能）
- 几何体复杂度
- 材质和光照设置
- 是否启用阴影

## 🤝 贡献指南

欢迎提交新的demo或改进现有demo：

1. Fork项目
2. 创建新的demo文件
3. 更新main index.html
4. 提交Pull Request

## 📄 许可证

这些demo遵循项目主许可证。 