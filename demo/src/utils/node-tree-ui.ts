// 节点树UI管理器 - 负责树状结构的可视化渲染
import type { DSLEngine } from '../../../src/engine/engine';
import type { SceneObject } from '../../../src/types/core';
import { ActionTypes } from '../../../src/types/core';

// UI节点状态接口
export interface UINodeState {
  id: string;
  expanded: boolean;
  dragging: boolean;
}

// 节点树UI管理器
export class NodeTreeUI {
  private engine: DSLEngine;
  private container: HTMLElement;
  private nodeStates: Map<string, UINodeState> = new Map();
  private draggedNodeId: string | null = null;
  private dropTargetId: string | null = null;

  constructor(engine: DSLEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.setupEventListeners();
  }

  // 渲染节点树
  render(): void {
    const scene = this.engine.getScene();
    this.container.innerHTML = '';

    // 构建树结构
    const rootNodes = this.buildTreeStructure(scene.objects);

    // 渲染根节点
    rootNodes.forEach((node) => {
      this.renderNode(node, 0);
    });
  }

  // 构建树结构
  private buildTreeStructure(objects: SceneObject[]): SceneObject[] {
    const objectMap = new Map<string, SceneObject>();
    const rootNodes: SceneObject[] = [];

    // 建立对象映射
    objects.forEach((obj) => {
      objectMap.set(obj.id, obj);
    });

    // 构建父子关系
    objects.forEach((obj) => {
      if (!obj.parent) {
        rootNodes.push(obj);
      }
    });

    return rootNodes;
  }

  // 渲染单个节点
  private renderNode(object: SceneObject, depth: number): void {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.style.paddingLeft = `${depth * 16 + 8}px`;
    nodeElement.setAttribute('data-node-id', object.id);

    // 获取节点状态
    const state = this.getNodeState(object.id);

    // 获取子节点
    const children = this.getChildren(object.id);
    const hasChildren = children.length > 0;

    // 构建节点HTML
    const icon = this.getNodeIcon(object.type);
    const visibilityIcon = object.visible !== false ? '👁️' : '🙈';
    const expandIcon = hasChildren ? (state.expanded ? '📂' : '📁') : '📄';
    const isSelected = this.engine.getScene().selection.includes(object.id);

    if (isSelected) {
      nodeElement.classList.add('selected');
    }

    nodeElement.innerHTML = `
      <span class="drag-handle" style="cursor: grab; margin-right: 4px; color: #999;">⋮⋮</span>
      <span class="expand-icon" style="cursor: pointer; margin-right: 4px;">${expandIcon}</span>
      <span class="node-icon" style="margin-right: 4px;">${icon}</span>
      <span class="node-name" style="flex: 1;">${object.name}</span>
      <span class="visibility-icon" style="cursor: pointer; margin-left: 4px;">${visibilityIcon}</span>
    `;

    // 绑定事件
    this.bindNodeEvents(nodeElement, object);

    this.container.appendChild(nodeElement);

    // 递归渲染子节点
    if (state.expanded && hasChildren) {
      children.forEach((child) => {
        this.renderNode(child, depth + 1);
      });
    }
  }

  // 绑定节点事件
  private bindNodeEvents(nodeElement: HTMLElement, object: SceneObject): void {
    // 节点选择
    nodeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectNode(object.id);
    });

    // 展开/折叠
    const expandIcon = nodeElement.querySelector('.expand-icon');
    expandIcon?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExpanded(object.id);
    });

    // 显隐切换
    const visibilityIcon = nodeElement.querySelector('.visibility-icon');
    visibilityIcon?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVisibility(object.id);
    });

    // 拖拽事件
    nodeElement.draggable = true;
    nodeElement.addEventListener('dragstart', (e) => this.onDragStart(e, object.id));
    nodeElement.addEventListener('dragover', (e) => this.onDragOver(e, object.id));
    nodeElement.addEventListener('drop', (e) => this.onDrop(e, object.id));
    nodeElement.addEventListener('dragend', () => this.onDragEnd());
  }

  // 获取节点状态
  private getNodeState(nodeId: string): UINodeState {
    if (!this.nodeStates.has(nodeId)) {
      this.nodeStates.set(nodeId, {
        id: nodeId,
        expanded: false,
        dragging: false,
      });
    }
    return this.nodeStates.get(nodeId)!;
  }

  // 获取子节点
  private getChildren(parentId: string): SceneObject[] {
    const scene = this.engine.getScene();
    return scene.objects.filter((obj) => obj.parent === parentId);
  }

  // 获取节点图标
  private getNodeIcon(type: string): string {
    switch (type) {
      case 'mesh':
        return '🔷';
      case 'group':
        return '📦';
      case 'light':
        return '💡';
      default:
        return '❓';
    }
  }

  // 选择节点
  private selectNode(nodeId: string): void {
    this.engine.dispatch({
      type: ActionTypes.SELECT,
      payload: { ids: [nodeId], mode: 'set' },
    });
    this.render();
  }

  // 切换展开状态
  private toggleExpanded(nodeId: string): void {
    const state = this.getNodeState(nodeId);
    state.expanded = !state.expanded;
    this.render();
  }

  // 切换可见性
  private toggleVisibility(nodeId: string): void {
    const object = this.engine.getScene().objects.find((obj) => obj.id === nodeId);
    if (object) {
      this.engine.dispatch({
        type: ActionTypes.UPDATE_OBJECT,
        payload: {
          id: nodeId,
          changes: { visible: !object.visible },
        },
      });
    }
  }

  // 拖拽开始
  private onDragStart(e: DragEvent, nodeId: string): void {
    this.draggedNodeId = nodeId;
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', nodeId);
      e.dataTransfer.effectAllowed = 'move';
    }

    const state = this.getNodeState(nodeId);
    state.dragging = true;
  }

  // 拖拽悬停
  private onDragOver(e: DragEvent, targetId: string): void {
    e.preventDefault();

    if (!this.draggedNodeId || this.draggedNodeId === targetId) return;

    // 检查是否可以放置
    if (this.canDropOn(this.draggedNodeId, targetId)) {
      this.dropTargetId = targetId;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    } else {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }

  // 拖拽放置
  private onDrop(e: DragEvent, targetId: string): void {
    e.preventDefault();

    if (!this.draggedNodeId || !this.canDropOn(this.draggedNodeId, targetId)) {
      return;
    }

    // 执行移动操作 - 使用DSL引擎的Action
    this.engine.dispatch({
      type: ActionTypes.MOVE_OBJECT,
      payload: {
        id: this.draggedNodeId,
        parentId: targetId,
      },
    });
  }

  // 拖拽结束
  private onDragEnd(): void {
    if (this.draggedNodeId) {
      const state = this.getNodeState(this.draggedNodeId);
      state.dragging = false;
    }

    this.draggedNodeId = null;
    this.dropTargetId = null;
    this.render();
  }

  // 检查是否可以放置
  private canDropOn(sourceId: string, targetId: string): boolean {
    // 不能拖拽到自己
    if (sourceId === targetId) return false;

    // 不能拖拽到自己的子节点（避免循环）
    return !this.isDescendant(sourceId, targetId);
  }

  // 检查是否为子孙节点
  private isDescendant(ancestorId: string, nodeId: string): boolean {
    const scene = this.engine.getScene();
    const node = scene.objects.find((obj) => obj.id === nodeId);

    if (!node || !node.parent) return false;
    if (node.parent === ancestorId) return true;

    return this.isDescendant(ancestorId, node.parent);
  }

  // 展开所有节点
  expandAll(): void {
    this.nodeStates.forEach((state) => {
      state.expanded = true;
    });
    this.render();
  }

  // 折叠所有节点
  collapseAll(): void {
    this.nodeStates.forEach((state) => {
      state.expanded = false;
    });
    this.render();
  }

  // 设置事件监听
  private setupEventListeners(): void {
    // 监听DSL状态变化，自动重新渲染
    this.engine.subscribe(() => {
      this.render();
    });
  }
}
