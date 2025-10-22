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

// TODO: 改为setter与getter模式，并禁止对nodes的直接操作
import type { ToolEnv } from "../interfaces"; 
export type { ToolEnv } from "../interfaces"; 

export abstract class ToolBase implements Tool {

    protected env: ToolEnv;
    constructor(env: ToolEnv) {
        this.env = env;
    }

    abstract onStart(event: ToolEvent): void;

    abstract onMove(event: ToolEvent): void;

    abstract onEnd(event: ToolEvent): void;

}