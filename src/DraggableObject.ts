import { Vec2 } from "./util/mathematics";

/**
 * 拖动事件原理：
 * 1. 子组件的拖动部分收到MouseDown事件，记录鼠标相对于子组件原点的偏移offset，并调用父组件的onDragStart，
 * 2. 父组件监听MouseMove事件，并将鼠标位置用子组件的onDrag传递给子组件
 * 3. 父组件监听到MouseUp或MouseLeave事件，将鼠标位置用子组件的onDrop传递给子组件
 */

export interface DraggableObjectContainer {
    onDragStart(obj: DraggableObject): void;
}

export interface DraggableObject {
    uid: number;
    onDrag(mousePosition: Vec2): void;
    onDrop(mousePosition: Vec2): void;
}