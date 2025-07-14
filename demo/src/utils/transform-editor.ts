// Transform编辑器UI组件
import { Vector3 } from 'three';
import type { DSLEngine } from '../../../src/engine/engine';
import { ActionTypes } from '../../../src/types/core';

export class TransformEditorUI {
  private engine: DSLEngine;
  private container: HTMLElement;
  private selectedObjectId: string | null = null;

  constructor(engine: DSLEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.setupUI();
    this.setupEventListeners();
  }

  // 设置UI结构
  private setupUI(): void {
    this.container.innerHTML = `
      <div class="transform-editor">
        <!-- 位置编辑 -->
        <div class="transform-group">
          <div class="transform-group-title">Position (位置)</div>
          <div class="transform-inputs">
            <input type="number" id="posX" class="transform-input" step="0.1" placeholder="X">
            <input type="number" id="posY" class="transform-input" step="0.1" placeholder="Y">
            <input type="number" id="posZ" class="transform-input" step="0.1" placeholder="Z">
          </div>
        </div>
        
        <!-- 旋转编辑 -->
        <div class="transform-group">
          <div class="transform-group-title">Rotation (旋转)</div>
          <div class="transform-inputs">
            <input type="number" id="rotX" class="transform-input" step="0.1" placeholder="X">
            <input type="number" id="rotY" class="transform-input" step="0.1" placeholder="Y">
            <input type="number" id="rotZ" class="transform-input" step="0.1" placeholder="Z">
          </div>
        </div>
        
        <!-- 缩放编辑 -->
        <div class="transform-group">
          <div class="transform-group-title">Scale (缩放)</div>
          <div class="transform-inputs">
            <input type="number" id="scaleX" class="transform-input" step="0.1" placeholder="X">
            <input type="number" id="scaleY" class="transform-input" step="0.1" placeholder="Y">
            <input type="number" id="scaleZ" class="transform-input" step="0.1" placeholder="Z">
          </div>
        </div>

        <!-- 快速操作按钮 -->
        <div class="transform-actions">
          <button id="resetTransform" class="btn btn-secondary">🔄 重置Transform</button>
          <button id="centerObject" class="btn btn-secondary">🎯 居中对象</button>
        </div>
      </div>
    `;
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // 监听DSL场景变化
    this.engine.subscribe(() => {
      this.updateFromSelection();
    });

    // 位置输入事件
    ['posX', 'posY', 'posZ'].forEach((id) => {
      const input = this.container.querySelector(`#${id}`) as HTMLInputElement;
      input?.addEventListener('change', () => {
        this.updateTransform(
          'position',
          id.slice(-1).toLowerCase() as 'x' | 'y' | 'z',
          input.value,
        );
      });
    });

    // 旋转输入事件（度数转弧度）
    ['rotX', 'rotY', 'rotZ'].forEach((id) => {
      const input = this.container.querySelector(`#${id}`) as HTMLInputElement;
      input?.addEventListener('change', () => {
        this.updateTransform(
          'rotation',
          id.slice(-1).toLowerCase() as 'x' | 'y' | 'z',
          input.value,
        );
      });
    });

    // 缩放输入事件
    ['scaleX', 'scaleY', 'scaleZ'].forEach((id) => {
      const input = this.container.querySelector(`#${id}`) as HTMLInputElement;
      input?.addEventListener('change', () => {
        this.updateTransform('scale', id.slice(-1).toLowerCase() as 'x' | 'y' | 'z', input.value);
      });
    });

    // 重置Transform按钮
    const resetBtn = this.container.querySelector('#resetTransform');
    resetBtn?.addEventListener('click', () => {
      this.resetTransform();
    });

    // 居中对象按钮
    const centerBtn = this.container.querySelector('#centerObject');
    centerBtn?.addEventListener('click', () => {
      this.centerObject();
    });
  }

  // 根据选择更新UI
  private updateFromSelection(): void {
    const scene = this.engine.getScene();
    const selectedIds = scene.selection;

    if (selectedIds.length === 1) {
      this.selectedObjectId = selectedIds[0];
      const object = scene.objects.find((obj) => obj.id === this.selectedObjectId);

      if (object) {
        this.updateInputValues(object);
        this.enableInputs();
      }
    } else {
      this.selectedObjectId = null;
      this.clearInputValues();
      this.disableInputs();
    }
  }

  // 更新输入框数值
  private updateInputValues(object: any): void {
    const transform = object.transform || {};

    // 获取位置值（兼容Vector3对象和普通对象）
    const position = transform.position || new Vector3(0, 0, 0);
    const posX = typeof position.x === 'number' ? position.x : 0;
    const posY = typeof position.y === 'number' ? position.y : 0;
    const posZ = typeof position.z === 'number' ? position.z : 0;

    // 获取旋转值
    const rotation = transform.rotation || new Vector3(0, 0, 0);
    const rotX = typeof rotation.x === 'number' ? rotation.x : 0;
    const rotY = typeof rotation.y === 'number' ? rotation.y : 0;
    const rotZ = typeof rotation.z === 'number' ? rotation.z : 0;

    // 获取缩放值
    const scale = transform.scale || new Vector3(1, 1, 1);
    const scaleX = typeof scale.x === 'number' ? scale.x : 1;
    const scaleY = typeof scale.y === 'number' ? scale.y : 1;
    const scaleZ = typeof scale.z === 'number' ? scale.z : 1;

    // 更新位置
    (this.container.querySelector('#posX') as HTMLInputElement).value = posX.toFixed(2);
    (this.container.querySelector('#posY') as HTMLInputElement).value = posY.toFixed(2);
    (this.container.querySelector('#posZ') as HTMLInputElement).value = posZ.toFixed(2);

    // 更新旋转（弧度转度数）
    (this.container.querySelector('#rotX') as HTMLInputElement).value =
      this.radToDeg(rotX).toFixed(2);
    (this.container.querySelector('#rotY') as HTMLInputElement).value =
      this.radToDeg(rotY).toFixed(2);
    (this.container.querySelector('#rotZ') as HTMLInputElement).value =
      this.radToDeg(rotZ).toFixed(2);

    // 更新缩放
    (this.container.querySelector('#scaleX') as HTMLInputElement).value = scaleX.toFixed(2);
    (this.container.querySelector('#scaleY') as HTMLInputElement).value = scaleY.toFixed(2);
    (this.container.querySelector('#scaleZ') as HTMLInputElement).value = scaleZ.toFixed(2);
  }

  // 清空输入框
  private clearInputValues(): void {
    const inputs = this.container.querySelectorAll(
      '.transform-input',
    ) as NodeListOf<HTMLInputElement>;
    inputs.forEach((input) => {
      input.value = '';
    });
  }

  // 启用输入框
  private enableInputs(): void {
    const inputs = this.container.querySelectorAll(
      '.transform-input',
    ) as NodeListOf<HTMLInputElement>;
    const buttons = this.container.querySelectorAll('.btn') as NodeListOf<HTMLButtonElement>;

    inputs.forEach((input) => {
      input.disabled = false;
    });

    buttons.forEach((button) => {
      button.disabled = false;
    });
  }

  // 禁用输入框
  private disableInputs(): void {
    const inputs = this.container.querySelectorAll(
      '.transform-input',
    ) as NodeListOf<HTMLInputElement>;
    const buttons = this.container.querySelectorAll('.btn') as NodeListOf<HTMLButtonElement>;

    inputs.forEach((input) => {
      input.disabled = true;
    });

    buttons.forEach((button) => {
      button.disabled = true;
    });
  }

  // 更新Transform
  private updateTransform(
    type: 'position' | 'rotation' | 'scale',
    axis: 'x' | 'y' | 'z',
    value: string,
  ): void {
    if (!this.selectedObjectId) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const scene = this.engine.getScene();
    const object = scene.objects.find((obj) => obj.id === this.selectedObjectId);
    if (!object) return;

    // 获取当前transform
    const currentTransform = object.transform || {};

    // 创建新的transform对象，使用Vector3
    const newTransform = {
      position: this.copyVector3(currentTransform.position, new Vector3(0, 0, 0)),
      rotation: this.copyVector3(currentTransform.rotation, new Vector3(0, 0, 0)),
      scale: this.copyVector3(currentTransform.scale, new Vector3(1, 1, 1)),
    };

    // 更新对应的值
    switch (type) {
      case 'position':
        newTransform.position[axis] = numValue;
        break;
      case 'rotation':
        // 度数转弧度
        newTransform.rotation[axis] = this.degToRad(numValue);
        break;
      case 'scale':
        newTransform.scale[axis] = numValue;
        break;
    }

    // 分发更新action
    this.engine.dispatch({
      type: ActionTypes.UPDATE_OBJECT,
      payload: {
        id: this.selectedObjectId,
        changes: { transform: newTransform },
      },
    });
  }

  // 复制Vector3，兼容现有对象和Vector3实例
  private copyVector3(source: any, defaultValue: Vector3): Vector3 {
    if (!source) return defaultValue.clone();

    if (source instanceof Vector3) {
      return source.clone();
    }

    // 兼容普通对象
    return new Vector3(
      typeof source.x === 'number' ? source.x : defaultValue.x,
      typeof source.y === 'number' ? source.y : defaultValue.y,
      typeof source.z === 'number' ? source.z : defaultValue.z,
    );
  }

  // 重置Transform
  private resetTransform(): void {
    if (!this.selectedObjectId) return;

    this.engine.dispatch({
      type: ActionTypes.UPDATE_OBJECT,
      payload: {
        id: this.selectedObjectId,
        changes: {
          transform: {
            position: new Vector3(0, 0, 0),
            rotation: new Vector3(0, 0, 0),
            scale: new Vector3(1, 1, 1),
          },
        },
      },
    });
  }

  // 居中对象
  private centerObject(): void {
    if (!this.selectedObjectId) return;

    this.engine.dispatch({
      type: ActionTypes.UPDATE_OBJECT,
      payload: {
        id: this.selectedObjectId,
        changes: {
          transform: {
            position: new Vector3(0, 0, 0),
          },
        },
      },
    });
  }

  // 工具方法：弧度转度数
  private radToDeg(rad: number): number {
    return rad * (180 / Math.PI);
  }

  // 工具方法：度数转弧度
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
