import {
  Color,
  DoubleSide,
  NoBlending,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
} from 'three';

// 创建线框专用的 uniforms
const WireframeUniforms = {
  linewidth: { value: 1 },
  resolution: { value: new Vector2(1, 1) },
  wireframeColor: { value: new Color(0x000000) },
  wireframeOpacity: { value: 1.0 },
  normalOffset: { value: 0.001 }, // 法线偏移距离
  // debugMode: { value: 0 }, // 调试模式：0=正常，1=显示法线方向
};

/**
 * 按照 LineMaterial 拓展的材质，用于渲染线框
 */
export class TriangleWireframeMaterial extends ShaderMaterial {
  constructor(
    options: {
      color?: number;
      lineWidth?: number;
      opacity?: number;
      normalOffset?: number;
    } = {},
  ) {
    const { color = 0x000000, lineWidth = 2.0, opacity = 1.0, normalOffset = 0.0 } = options;

    const uniforms = UniformsUtils.merge([UniformsLib.common, UniformsLib.fog, WireframeUniforms]);

    // 设置初始 uniform 值
    uniforms.wireframeColor.value = new Color(color);
    uniforms.linewidth.value = lineWidth;
    uniforms.wireframeOpacity.value = opacity;
    uniforms.normalOffset.value = normalOffset;

    super({
      uniforms: uniforms,

      vertexShader: `
        #include <common>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        uniform float linewidth;
        uniform vec2 resolution;
        uniform float normalOffset;

        attribute vec3 instanceStart;
        attribute vec3 instanceEnd;
        attribute vec3 instanceNormal; // 面法线

        varying vec2 vUv;

        varying vec3 vNormal; // 传递法线到片段着色器用于调试

        void trimSegment(const in vec4 start, inout vec4 end) {
          float a = projectionMatrix[2][2];
          float b = projectionMatrix[3][2];
          float nearEstimate = -0.5 * b / a;
          float alpha = (nearEstimate - start.z) / (end.z - start.z);
          end.xyz = mix(start.xyz, end.xyz, alpha);
        }

        void main() {
          float aspect = resolution.x / resolution.y;

          // 确保法线单位化
          vec3 normal = normalize(instanceNormal);
          vNormal = normal;

          // 沿法线方向偏移，让线框稍微偏离表面
          vec3 offsetStart = instanceStart + normal * normalOffset;
          vec3 offsetEnd = instanceEnd + normal * normalOffset;

          // 摄像机空间中的线段端点（使用偏移后的位置）
          vec4 start = modelViewMatrix * vec4(offsetStart, 1.0);
          vec4 end = modelViewMatrix * vec4(offsetEnd, 1.0);

          vUv = uv;

          // 透视投影特殊处理
          bool perspective = (projectionMatrix[2][3] == -1.0);

          if (perspective) {
            if (start.z < 0.0 && end.z >= 0.0) {
              trimSegment(start, end);
            } else if (end.z < 0.0 && start.z >= 0.0) {
              trimSegment(end, start);
            }
          }

          // 裁剪空间
          vec4 clipStart = projectionMatrix * start;
          vec4 clipEnd = projectionMatrix * end;

          // NDC 空间
          vec3 ndcStart = clipStart.xyz / clipStart.w;
          vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

          // 线段方向
          vec2 dir = ndcEnd.xy - ndcStart.xy;
          dir.x *= aspect;
          dir = normalize(dir);

          #ifdef WORLD_UNITS
            // 世界空间单位模式
            vec3 worldDir = normalize(end.xyz - start.xyz);
            vec3 tmpFwd = normalize(mix(start.xyz, end.xyz, 0.5));
            vec3 worldUp = normalize(cross(worldDir, tmpFwd));
            vec3 worldFwd = cross(worldDir, worldUp);
            worldPos = position.y < 0.5 ? start : end;

            // 高度偏移
            float hw = linewidth * 0.5;
            worldPos.xyz += position.x < 0.0 ? hw * worldUp : -hw * worldUp;

            // 端点扩展
            worldPos.xyz += position.y < 0.5 ? -hw * worldDir : hw * worldDir;
            worldPos.xyz += worldFwd * hw;

            // 端点处理
            if (position.y > 1.0 || position.y < 0.0) {
              worldPos.xyz -= worldFwd * 2.0 * hw;
            }

            // 投影世界坐标
            vec4 clip = projectionMatrix * worldPos;
            vec3 clipPose = (position.y < 0.5) ? ndcStart : ndcEnd;
            clip.z = clipPose.z * clip.w;
          #else
            // 屏幕空间单位模式
            vec2 offset = vec2(dir.y, -dir.x);
            dir.x /= aspect;
            offset.x /= aspect;

            // 根据position.x决定线宽方向 (-1 = 左侧, 1 = 右侧)
            if (position.x < 0.0) offset *= -1.0;

            // 端点扩展
            if (position.y < 0.0) {
              offset += -dir;
            } else if (position.y > 1.0) {
              offset += dir;
            }

            // 应用线宽
            offset *= linewidth;
            offset /= resolution.y;

            // 选择起点或终点
            vec4 clip = (position.y < 0.5) ? clipStart : clipEnd;
            offset *= clip.w;
            clip.xy += offset;
          #endif

          gl_Position = clip;

          vec4 mvPosition = (position.y < 0.5) ? start : end;

          #include <logdepthbuf_vertex>
          #include <clipping_planes_vertex>
          #include <fog_vertex>
        }
      `,

      fragmentShader: `
        uniform vec3 wireframeColor;
        uniform float wireframeOpacity;
        uniform float linewidth;
        // uniform float debugMode;

        varying vec2 vUv;

        varying vec3 vNormal;

        #include <common>
        #include <color_pars_fragment>
        #include <fog_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <clipping_planes_pars_fragment>

        vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {
          float mua;
          float mub;

          vec3 p13 = p1 - p3;
          vec3 p43 = p4 - p3;
          vec3 p21 = p2 - p1;

          float d1343 = dot(p13, p43);
          float d4321 = dot(p43, p21);
          float d1321 = dot(p13, p21);
          float d4343 = dot(p43, p43);
          float d2121 = dot(p21, p21);

          float denom = d2121 * d4343 - d4321 * d4321;
          float numer = d1343 * d4321 - d1321 * d4343;

          mua = numer / denom;
          mua = clamp(mua, 0.0, 1.0);
          mub = (d1343 + d4321 * (mua)) / d4343;
          mub = clamp(mub, 0.0, 1.0);

          return vec2(mua, mub);
        }

        void main() {
          #include <clipping_planes_fragment>

          float alpha = wireframeOpacity;
          vec3 finalColor = wireframeColor;

          // if (debugMode > 0.5) {
          //   finalColor = abs(vNormal); // 将法线方向映射为颜色
          // }

         // 屏幕空间单位模式：基于UV的抗锯齿
        if (abs(vUv.y) > 1.0) {
          float a = vUv.x;
          float b = (vUv.y > 0.0) ? vUv.y - 1.0 : vUv.y + 1.0;
          float len2 = a * a + b * b;

          if (len2 > 1.0) discard;
        }

        // 基于UV的抗锯齿
        float edgeAlpha = 1.0;
        if (abs(vUv.x) > 0.7) {
          edgeAlpha = 1.0 - smoothstep(0.7, 1.0, abs(vUv.x));
        }
        alpha *= edgeAlpha;

          gl_FragColor = vec4(finalColor, alpha);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
          #include <premultiplied_alpha_fragment>
        }
      `,

      side: DoubleSide,
      blending: NoBlending,
    });
  }
}
