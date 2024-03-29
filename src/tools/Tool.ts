import { MindNode, Rect } from "../interfaces";
import { Vec2 } from "../util/mathematics";
import { MouseEvent } from "react";

export interface ToolEvent {
    mousePosition: Vec2;
    node: MindNode | null;
    nativeEvent: MouseEvent;
}

export interface Tool {
    onStart(event: ToolEvent): void; // 此时还未开始移动鼠标
    onMove(event: ToolEvent): void; // 在onStart之后，鼠标移动才调用，如果鼠标没移动，则不调用；若鼠标移动过，则在onEnd之前回调用一次
    onEnd(event: ToolEvent): void; // 此时鼠标停止移动
}

export interface ToolEnv {
    offset: Vec2;
    scale: number;
    // MindNode 实例可能会改变，所以在其它位置引用其uid较为妥当
    nodes: Map<number, MindNode>;
    addNode(node: MindNode): void;

    // 保存的是节点矩形的缓存，会随着布局的变化而更新
    getNodeRect(uid: number): Rect | null;

    // 链接操作中，链接末尾鼠标的未知
    virtualDstPos: Vec2 | null;
    selectedNodeUids: Set<number>;
    selectionArea: Rect | null;
    pixel2pool(vec: Vec2): Vec2;
    genUid(): number;

    getAnchor(): Vec2;

    // 修正量，是画布的client位置
    getPoolFix(): Vec2;
}

export abstract class ToolBase implements Tool {

    protected env: ToolEnv;
    constructor(env: ToolEnv) {
        this.env = env;
    }

    abstract onStart(event: ToolEvent): void;

    abstract onMove(event: ToolEvent): void;

    abstract onEnd(event: ToolEvent): void;

}