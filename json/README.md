# USD JSON Demos

本目录提供大量 JSON 版 USD/DSL 示例，聚焦一期的 3D 模型场景：

- `simple-mesh.json`：单三角形示例，含 `primvars.st` UV。
- `quad-uvs.json`：四边形平面，UV 完整。
- `vertex-colors.json`：顶点颜色示例（`displayColor.values`）。
- `double-sided.json`：双面渲染平面（`doubleSided: true`）。
- `xform-hierarchy.json`：层级 Xform + 两个 Mesh。
- `camera-light.json`：相机与方向光 + 阴影与色调映射设置。
- `material-basic.json`：材质 `Material` prim + 绑定 Mesh。
- `polygon-mesh.json`：五边形示例（多边形面）。
- `multi-materials.json`：两个材质与两个网格示例。
- `renderer-settings.json`：顶层渲染器配置示例。
- `gltf-like.json`：贴近 glTF 常见内容的场景。
- `tri-quad-mix.json`：混合三角形与四边形面示例。

建议：使用 `schema/usd-scene.schema.json` 进行校验（见 `schema/README.md`）。

