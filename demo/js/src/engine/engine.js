// DSL引擎核心实现 - 框架无关的状态管理引擎
import { Vector3 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { ActionTypes, } from '../types';
function createDefaultScene(partial) {
    const now = Date.now();
    return {
        id: generateUUID(),
        name: 'Untitled Scene',
        objects: [],
        materials: [
            {
                id: 'default',
                name: 'Default Material',
                type: 'standard',
                color: '#ffffff',
                metalness: 0,
                roughness: 0.5,
                opacity: 1,
            },
        ],
        lights: [
            {
                id: 'ambient',
                name: 'Ambient Light',
                type: 'ambient',
                color: '#ffffff',
                intensity: 0.4,
            },
            {
                id: 'directional',
                name: 'Sun Light',
                type: 'directional',
                color: '#ffffff',
                intensity: 0.8,
                position: new Vector3(5, 5, 5),
                target: new Vector3(0, 0, 0),
            },
        ],
        camera: {
            type: 'perspective',
            position: new Vector3(5, 5, 5),
            target: new Vector3(0, 0, 0),
            fov: 75,
            aspect: 1,
            near: 0.1,
            far: 1000,
        },
        environment: {
            background: { type: 'color', color: '#f0f0f0' },
        },
        selection: [],
        metadata: {
            created: now,
            modified: now,
            version: '2.1',
        },
        ...partial,
    };
}
// DSL引擎核心类
export class DSLEngine {
    constructor(initialScene) {
        this.listeners = new Set();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.scene = createDefaultScene(initialScene);
        this.saveToHistory();
    }
    // 辅助方法：检查是否是子孙节点（避免循环引用）
    isDescendant(scene, ancestorId, nodeId) {
        const node = scene.objects.find((obj) => obj.id === nodeId);
        if (!node || !node.children)
            return false;
        for (const childId of node.children) {
            if (childId === ancestorId)
                return true;
            if (this.isDescendant(scene, ancestorId, childId))
                return true;
        }
        return false;
    }
    // 执行Action - 唯一修改状态的方式
    dispatch(action) {
        const newScene = this.reduce(this.scene, action);
        if (newScene !== this.scene) {
            // 保存历史
            this.saveToHistory();
            this.scene = newScene;
            // 通知所有监听器
            this.notifyListeners();
        }
    }
    // 获取当前状态
    getScene() {
        return this.scene;
    }
    // 监听状态变化
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    // Action处理器
    reduce(scene, action) {
        switch (action.type) {
            case 'ADD_OBJECT': {
                const objectId = generateUUID();
                const object = {
                    ...action.payload,
                    id: objectId,
                    name: action.payload.name || `Object_${objectId}`,
                    type: action.payload.type || 'mesh',
                    transform: {
                        position: new Vector3(0, 0, 0),
                        rotation: new Vector3(0, 0, 0),
                        scale: new Vector3(1, 1, 1),
                        ...action.payload.transform,
                    },
                    parent: action.payload.parent,
                    visible: action.payload.visible ?? true,
                    castShadow: action.payload.castShadow ?? false,
                    receiveShadow: action.payload.receiveShadow ?? false,
                };
                return {
                    ...scene,
                    objects: [...scene.objects, object],
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'UPDATE_OBJECT': {
                const { id, changes } = action.payload;
                const objectIndex = scene.objects.findIndex((obj) => obj.id === id);
                if (objectIndex === -1)
                    return scene;
                const updatedObjects = [...scene.objects];
                updatedObjects[objectIndex] = { ...updatedObjects[objectIndex], ...changes };
                return {
                    ...scene,
                    objects: updatedObjects,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'REMOVE_OBJECT': {
                const { id } = action.payload;
                const filteredObjects = scene.objects.filter((obj) => obj.id !== id);
                return {
                    ...scene,
                    objects: filteredObjects,
                    selection: scene.selection.filter((selectedId) => selectedId !== id),
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'DUPLICATE_OBJECT': {
                const { id } = action.payload;
                const original = scene.objects.find((obj) => obj.id === id);
                if (!original)
                    return scene;
                const newId = generateUUID();
                const duplicated = {
                    ...original,
                    id: newId,
                    name: `${original.name}_Copy`,
                    transform: {
                        ...original.transform,
                        position: new Vector3((original.transform.position?.x || 0) + 1, (original.transform.position?.y || 0) + 1, (original.transform.position?.z || 0) + 1),
                    },
                };
                return {
                    ...scene,
                    objects: [...scene.objects, duplicated],
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'MOVE_OBJECT': {
                const { id, parentId, index } = action.payload;
                const objects = [...scene.objects];
                const targetObj = objects.find((obj) => obj.id === id);
                if (!targetObj)
                    return scene;
                // 防止将对象移动到自己的子节点中（避免循环引用）
                if (parentId && this.isDescendant(scene, parentId, id)) {
                    return scene;
                }
                // 移除目标对象从旧的父节点的children中
                if (targetObj.parent) {
                    const oldParent = objects.find((obj) => obj.id === targetObj.parent);
                    if (oldParent && oldParent.children) {
                        oldParent.children = oldParent.children.filter((childId) => childId !== id);
                    }
                }
                // 更新目标对象的parent
                targetObj.parent = parentId;
                // 将目标对象添加到新的父节点的children中
                if (parentId) {
                    const newParent = objects.find((obj) => obj.id === parentId);
                    if (newParent) {
                        if (!newParent.children) {
                            newParent.children = [];
                        }
                        // 如果指定了index，插入到指定位置，否则添加到末尾
                        if (index !== undefined && index >= 0 && index <= newParent.children.length) {
                            newParent.children.splice(index, 0, id);
                        }
                        else {
                            newParent.children.push(id);
                        }
                    }
                }
                return {
                    ...scene,
                    objects,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'REORDER_CHILDREN': {
                const { parentId, childIds } = action.payload;
                const objects = [...scene.objects];
                const parent = objects.find((obj) => obj.id === parentId);
                if (!parent)
                    return scene;
                // 验证所有childIds都是当前parent的子节点
                const currentChildren = parent.children || [];
                const validChildIds = childIds.filter((id) => currentChildren.includes(id));
                // 更新parent的children顺序
                parent.children = validChildIds;
                return {
                    ...scene,
                    objects,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'ADD_MATERIAL': {
                const materialId = generateUUID();
                const material = {
                    id: materialId,
                    name: action.payload.name || `Material_${materialId}`,
                    type: action.payload.type || 'standard',
                    color: action.payload.color || '#ffffff',
                    metalness: action.payload.metalness ?? 0,
                    roughness: action.payload.roughness ?? 0.5,
                    opacity: action.payload.opacity ?? 1,
                    ...action.payload,
                };
                return {
                    ...scene,
                    materials: [...scene.materials, material],
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'UPDATE_MATERIAL': {
                const { id, changes } = action.payload;
                const materialIndex = scene.materials.findIndex((mat) => mat.id === id);
                if (materialIndex === -1)
                    return scene;
                const updatedMaterials = [...scene.materials];
                updatedMaterials[materialIndex] = {
                    ...updatedMaterials[materialIndex],
                    ...changes,
                };
                return {
                    ...scene,
                    materials: updatedMaterials,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'APPLY_MATERIAL': {
                const { objectIds, materialId } = action.payload;
                const materialExists = scene.materials.some((mat) => mat.id === materialId);
                if (!materialExists)
                    return scene;
                const updatedObjects = scene.objects.map((obj) => objectIds.includes(obj.id) ? { ...obj, material: { id: materialId } } : obj);
                return {
                    ...scene,
                    objects: updatedObjects,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'SELECT': {
                const { ids, mode } = action.payload;
                let newSelection;
                switch (mode) {
                    case 'set':
                        newSelection = ids.filter((id) => scene.objects.some((obj) => obj.id === id));
                        break;
                    case 'add':
                        newSelection = [
                            ...new Set([
                                ...scene.selection,
                                ...ids.filter((id) => scene.objects.some((obj) => obj.id === id)),
                            ]),
                        ];
                        break;
                    case 'toggle': {
                        const id = ids[0];
                        if (scene.objects.some((obj) => obj.id === id)) {
                            newSelection = scene.selection.includes(id)
                                ? scene.selection.filter((selectedId) => selectedId !== id)
                                : [...scene.selection, id];
                        }
                        else {
                            newSelection = scene.selection;
                        }
                        break;
                    }
                    default:
                        newSelection = scene.selection;
                }
                return { ...scene, selection: newSelection };
            }
            case 'CLEAR_SELECTION': {
                return { ...scene, selection: [] };
            }
            case 'UPDATE_CAMERA': {
                return {
                    ...scene,
                    camera: { ...scene.camera, ...action.payload },
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'ADD_LIGHT': {
                const lightId = generateUUID();
                const light = {
                    id: lightId,
                    name: action.payload.name || `Light_${lightId}`,
                    type: action.payload.type || 'directional',
                    color: action.payload.color || '#ffffff',
                    intensity: action.payload.intensity ?? 1,
                    ...action.payload,
                };
                return {
                    ...scene,
                    lights: [...scene.lights, light],
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'UPDATE_LIGHT': {
                const { id, changes } = action.payload;
                const lightIndex = scene.lights.findIndex((light) => light.id === id);
                if (lightIndex === -1)
                    return scene;
                const updatedLights = [...scene.lights];
                updatedLights[lightIndex] = { ...updatedLights[lightIndex], ...changes };
                return {
                    ...scene,
                    lights: updatedLights,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'REMOVE_LIGHT': {
                const { id } = action.payload;
                const filteredLights = scene.lights.filter((light) => light.id !== id);
                return {
                    ...scene,
                    lights: filteredLights,
                    metadata: { ...scene.metadata, modified: Date.now() },
                };
            }
            case 'RESET_SCENE': {
                return createDefaultScene();
            }
            case 'LOAD_SCENE': {
                return {
                    ...action.payload,
                    metadata: { ...action.payload.metadata, modified: Date.now() },
                };
            }
            default:
                return scene;
        }
    }
    // 历史管理
    saveToHistory() {
        // 清除当前位置之后的历史
        this.history = this.history.slice(0, this.historyIndex + 1);
        // 添加当前状态
        this.history.push(JSON.parse(JSON.stringify(this.scene)));
        this.historyIndex = this.history.length - 1;
        // 限制历史大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.scene = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.notifyListeners();
            return true;
        }
        return false;
    }
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.scene = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.notifyListeners();
            return true;
        }
        return false;
    }
    canUndo() {
        return this.historyIndex > 0;
    }
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }
    // 私有方法
    notifyListeners() {
        this.listeners.forEach((listener) => listener(this.scene));
    }
    // 公共方法 - 便捷操作
    addObject(object) {
        const id = generateUUID();
        this.dispatch({ type: ActionTypes.ADD_OBJECT, payload: { ...object, id } });
        return id;
    }
    updateObject(id, changes) {
        this.dispatch({ type: ActionTypes.UPDATE_OBJECT, payload: { id, changes } });
    }
    removeObject(id) {
        this.dispatch({ type: ActionTypes.REMOVE_OBJECT, payload: { id } });
    }
    selectObjects(ids, mode = 'set') {
        this.dispatch({ type: ActionTypes.SELECT, payload: { ids, mode } });
    }
    clearSelection() {
        this.dispatch({ type: ActionTypes.CLEAR_SELECTION });
    }
    addMaterial(material) {
        const id = generateUUID();
        this.dispatch({ type: ActionTypes.ADD_MATERIAL, payload: { ...material, id } });
        return id;
    }
    applyMaterial(objectIds, materialId) {
        this.dispatch({ type: ActionTypes.APPLY_MATERIAL, payload: { objectIds, materialId } });
    }
    // 查询方法
    getObject(id) {
        return this.scene.objects.find((obj) => obj.id === id) || null;
    }
    getSelectedObjects() {
        return this.scene.selection
            .map((id) => this.scene.objects.find((obj) => obj.id === id))
            .filter(Boolean);
    }
    findObjects(predicate) {
        return this.scene.objects.filter(predicate);
    }
    // 导入导出
    exportScene() {
        return JSON.parse(JSON.stringify(this.scene));
    }
    importScene(scene) {
        this.dispatch({ type: ActionTypes.LOAD_SCENE, payload: scene });
    }
}
