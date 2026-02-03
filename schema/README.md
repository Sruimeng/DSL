# Schema 使用说明（Phase 1）

本目录包含一个最小可用的 JSON Schema（`usd-scene.schema.json`），用于校验一期聚焦的 3D 模型场景数据（与当前 DSL/类型/示例资产对齐）。

## 适用范围
- 场景基本结构：`metadata`、`layer`、`prims`。
- Prim 类型：`Xform`、`Mesh`、`Camera`、`Light`、`Material`（以及基础 `BasePrim`）。
- Mesh 关键字段：`points`、`faceVertexCounts`、`faceVertexIndices`、`primvars.st/uv`、`displayColor`、`doubleSided`、`material`。
- 渲染器核心字段（可选）：`renderer.api`、`renderer.background`、`renderer.shadows`、`renderer.toneMapping`。

## 用法示例（Node.js + Ajv）
```js
import Ajv from 'ajv';
import { readFileSync } from 'fs';

const ajv = new Ajv({ allErrors: true });
const schema = JSON.parse(readFileSync('schema/usd-scene.schema.json', 'utf-8'));
const validate = ajv.compile(schema);

const doc = JSON.parse(readFileSync('demo/assets/basic-scene.json', 'utf-8'));
const ok = validate(doc);

if (!ok) {
  console.error('Schema validation errors:', validate.errors);
} else {
  console.log('Schema validation passed.');
}
```

## 设计原则
- 最小约束：尽量与当前解析逻辑一致，避免误杀有效字段。
- 渐进扩展：后续阶段可在 `$defs` 中补充更多 USD 特性（references、payload、variantSets 等）。
- 容错与开放：顶层允许附加字段；具体对象尽量保留 `additionalProperties` 以兼容现有示例。

## 后续计划（建议）
- 引入 CI 中的 Schema 校验步骤，对 `demo/assets/*.json` 进行校验。
- 逐步扩充材质网络、相机/灯光属性、坐标/单位规范等。
- 根据解析器演进，同步增强 Schema（保持 SemVer 稳定）。

