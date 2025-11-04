USD 场景数据的静态结构说明书
USD 的主要优点（对于我们来说）：

1. 协作好：支持图层，大家可以各改各的，最后合并不冲突。
2. 版本控制友好：文本格式，能直接 Git diff、merge。
3. 扩展性强：能描述几何、材质、动画、物理，还能自定义。
4. 整体结构
   USD 场景是一个 纯静态、声明式、JSON 兼容 的数据对象，由四部分组成：
   {
   "metadata": { ... }, // 全局设置
   "prims": [ ... ], // 所有对象（扁平列表）
   "animation": { ... }, // （可选）动画曲线数据
   "renderer": { ... } // （可选）渲染配置
   }
   ✅ 核心原则：

- 所有对象平铺在 prims 数组中
- 通过 name（绝对路径）唯一标识
- 通过 type 决定对象结构
- 跨对象引用仅用字符串路径（如 material: "/Mat"）

---

2. 静态数据组织流程图
   下图展示了 USD 场景数据的内部组成关系，所有连线均为静态包含，无运行时逻辑：
   暂时无法在飞书文档外展示此内容
   💡 此结构天然支持 结构化 diff，为编辑器的撤销/重做提供基础。

---

3. 各模块字段示例（关键字段）
   metadata
   { "upAxis": "Y", "frameRate": 24, "defaultPrim": "/World" }
   prims 示例
   Xform
   { "name": "/World", "type": "Xform" }
   Mesh
   {
   "name": "/World/Box",
   "type": "Mesh",
   "points": [{ "x": -0.5, "y": -0.5, "z": 0.5 }, ...],
   "faceVertexIndices": [0,1,2,3],
   "material": "/World/RedMat",
   "transform": { "translate": { "y": 1 } }
   }
   Material
   {
   "name": "/World/RedMat",
   "type": "Material",
   "model": "usdPreviewSurface",
   "previewSurface": { "diffuseColor": [1,0,0,1] }
   }
   Camera / Light（略，同前）
   animation（可选）
   {
   "curves": [{
   "attribute": "/World/Box.transform.translate.y",
   "values": [0, 1, 0],
   "timeSampling": { "type": "uniform", "times": [0,1,2] }
   }]
   }
   renderer（可选）
   { "api": "WebGL2", "background": { "type": "color", "color": [0.1,0.1,0.1] } }

---

4. 编辑器中操作设计
   由于 USD 场景数据是 纯数据、无副作用、结构清晰 的，非常适合实现基于 快照（Snapshot） 或 操作日志（Command） 的撤销/重做系统。
   以undo/redo为例
   结构化快照 + 路径级 diff

- 整个场景是一个 单一 JSON 对象
- 所有修改都发生在 prims[]、metadata、animation 等顶层字段
- 每个 Prim 有唯一 name 路径，可精确定位变更
  🔧 实现方式

1. 每次编辑操作后，保存完整场景快照（或增量 diff）
   // 历史栈
   history: {
   stack: USDScene[],
   currentIndex: number
   }
1. 或更高效：记录“变更指令”
   interface EditCommand {
   type: 'setPrim' | 'deletePrim' | 'updateMetadata' | 'setCurve';
   path: string; // e.g. "/prims/5/transform/translate/y"
   oldValue: any;
   newValue: any;
   }

- 撤销：执行 oldValue → newValue 的逆操作
- 重做：执行 newValue

1. 路径命名规范支持精准回滚

- 修改材质：/prims[name="/World/Box"]/material
- 修改动画：/animation/curves[0]/values[1]
- 修改相机参数：/prims[name="/World/Cam"]/attributes/focalLength

---

5. 关键规则总结
   规则
   说明
   扁平化存储
   prims 是数组，非树形嵌套
   路径即 ID
   name 为绝对路径，全局唯一
   引用即字符串
   材质、动画目标等均为路径字符串
   纯数据结构
   100% JSON serializable，无函数
   编辑器友好
   支持快照式或命令式 undo/redo
6. 问题
   1、FBX 拆分成自定义格式后，用户修改后，下载的时候如何还原

- 根据最终快照找diff还原到fbx/gltf原始模型里
- fbx/gltf作为外挂url，数据格式只描述场景信息作为快照
