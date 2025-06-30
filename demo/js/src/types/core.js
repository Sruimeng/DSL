export var ActionTypes;
(function (ActionTypes) {
    /**
     * 添加对象
     */
    ActionTypes["ADD_OBJECT"] = "ADD_OBJECT";
    /**
     * 更新对象
     */
    ActionTypes["UPDATE_OBJECT"] = "UPDATE_OBJECT";
    /**
     * 删除对象
     */
    ActionTypes["REMOVE_OBJECT"] = "REMOVE_OBJECT";
    /**
     * 复制对象
     */
    ActionTypes["DUPLICATE_OBJECT"] = "DUPLICATE_OBJECT";
    /**
     * 移动对象 - 改变对象的父子关系和层级位置
     */
    ActionTypes["MOVE_OBJECT"] = "MOVE_OBJECT";
    /**
     * 重新排序子对象 - 调整同级对象的顺序
     */
    ActionTypes["REORDER_CHILDREN"] = "REORDER_CHILDREN";
    /**
     * 添加材质 - 创建新的材质定义
     */
    ActionTypes["ADD_MATERIAL"] = "ADD_MATERIAL";
    /**
     * 更新材质 - 修改现有材质的属性
     */
    ActionTypes["UPDATE_MATERIAL"] = "UPDATE_MATERIAL";
    /**
     * 应用材质 - 将材质分配给指定对象
     */
    ActionTypes["APPLY_MATERIAL"] = "APPLY_MATERIAL";
    /**
     * 选择对象 - 设置场景中的选中状态
     */
    ActionTypes["SELECT"] = "SELECT";
    /**
     * 清除选择 - 取消所有对象的选中状态
     */
    ActionTypes["CLEAR_SELECTION"] = "CLEAR_SELECTION";
    /**
     * 更新相机 - 修改相机位置、角度等参数
     */
    ActionTypes["UPDATE_CAMERA"] = "UPDATE_CAMERA";
    /**
     * 添加光源 - 创建新的光源对象
     */
    ActionTypes["ADD_LIGHT"] = "ADD_LIGHT";
    /**
     * 更新光源 - 修改现有光源的属性
     */
    ActionTypes["UPDATE_LIGHT"] = "UPDATE_LIGHT";
    /**
     * 删除光源 - 移除指定的光源对象
     */
    ActionTypes["REMOVE_LIGHT"] = "REMOVE_LIGHT";
    /**
     * 重置场景 - 清空场景并恢复到初始状态
     */
    ActionTypes["RESET_SCENE"] = "RESET_SCENE";
    /**
     * 加载场景 - 从外部数据加载完整场景配置
     */
    ActionTypes["LOAD_SCENE"] = "LOAD_SCENE";
})(ActionTypes || (ActionTypes = {}));
