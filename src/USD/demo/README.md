# USD Demo Components

This directory contains demonstration components that showcase the capabilities of the USD-based scene description system.

## Components

### 1. USDSceneBuilder
A comprehensive demo that demonstrates all major features of the USD scene description API:

- **Scene Hierarchy**: Creating and organizing scene elements
- **Primitive Creation**: Spheres, cubes, cylinders, planes, and custom meshes
- **Material System**: PBR materials with UsdPreviewSurface
- **Lighting**: Directional, point, spot, and dome lights
- **Animation**: Time-based animations with keyframes
- **Custom Meshes**: Creating complex geometry from vertices
- **Variant Sets**: Switching between different geometry types
- **Scene Statistics**: Real-time scene information

### 2. USDDemo
A simpler demonstration focusing on basic USD concepts and real-time interaction.

## Usage

```tsx
import { USDSceneBuilder } from './USD/demo';

function App() {
  return <USDSceneBuilder />;
}
```

## Key Features Demonstrated

1. **USD Scene API**: High-level API for scene construction
2. **Three.js Integration**: Seamless rendering with Three.js
3. **Material System**: Physically-based rendering materials
4. **Animation**: Time-based property animation
5. **Export/Import**: USD format export capabilities
6. **Real-time Editing**: Dynamic scene modification

## Architecture

The demo components showcase the layered architecture:

```
USD Scene API (High-level)
    ↓
USD Core (Stage, Prim, Attributes)
    ↓
Three.js Adapter (Rendering)
    ↓
Three.js (WebGL)
```

This design allows for:
- Easy scene construction using USD concepts
- Flexible rendering backend (not limited to Three.js)
- Standard USD format compatibility
- Extensible architecture for custom features