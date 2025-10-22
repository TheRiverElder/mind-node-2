import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class CreateNodeTool extends ToolBase {

    onStart(): void { }

    onMove(): void { }

    onEnd({ mousePosition }: ToolEvent): void {
        const position = this.context.pixel2pool(mousePosition);
        this.context.createNode({ position });
    }

}