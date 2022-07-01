import { MindNode, Rect } from "../interfaces";
import { Vec2 } from "../util/mathematics";
import { MouseEvent } from "react";

export interface ToolEvent {
    mousePosition: Vec2;
    node: MindNode | null;
    nativeEvent: MouseEvent;
}

export interface Tool {
    onStart(event: ToolEvent): void;
    onMove(event: ToolEvent): void;
    onEnd(event: ToolEvent): void;
}

export interface ToolEnv {
    offset: Vec2;
    scale: number;
    // MindNode 实例可能会改变，所以在其它位置引用其uid较为妥当
    nodes: Map<number, MindNode>;
    getNodeRect(uid: number): Rect | null;

    virtualDstPos: Vec2 | null;
    selectedNodeUids: Set<number>;
    selectionArea: Rect | null;
    pixel2pool(vec: Vec2): Vec2;
    genUid(): number;
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