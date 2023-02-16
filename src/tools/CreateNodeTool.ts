import { createNode } from "../core";
import { MindNode } from "../interfaces";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class CreateNodeTool extends ToolBase {

    onStart(): void { }

    onMove(): void { }

    onEnd({ mousePosition }: ToolEvent): void {
        const position = this.env.pixel2pool(mousePosition);
        const uid = this.env.genUid();
        const node: MindNode = createNode({ uid, position });
        this.env.addNode(node);
    }

}