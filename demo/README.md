# Three.js USD DSL Demos

This directory contains simple demos showcasing the Three.js USD DSL capabilities.

## Running the Demos

1. First, build the main library:
```bash
pnpm build
```

2. Start a local server in the demo directory:
```bash
cd demo
python -m http.server 8000
# or use any other static server
```

3. Open your browser to `http://localhost:8000`

## Demo Structure

- `index.html` - Main demo launcher page
- `html/` - Legacy demo files (will be migrated)
- `examples/` - Simple HTML demos with TypeScript modules
  - `basic-scene.html` - Basic 3D scene with interactive controls
  - `material-demo.html` - Material system examples
  - `model-demo.html` - 3D model loading examples
  - `plugin-demo.html` - Plugin system examples
  - `mcp-demo.html` - MCP integration examples
  - `undo-redo-demo.html` - Undo/redo system examples

## Development

Each demo is a standalone HTML file that imports the DSL library as an ES module:
```html
<script type="module">
  import { DSLEngine } from '/dist/index.mjs';
  // Your demo code here
</script>
```

This approach keeps the demos simple and focused on the library functionality without complex build tools.