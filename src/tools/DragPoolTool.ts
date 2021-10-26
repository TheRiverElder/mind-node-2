import { Vec2Util, Vec2 } from "../util/mathematics";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class DragPoolTool extends ToolBase {

    private actived: boolean = false;
    private startPoolOffset: Vec2 = Vec2Util.zero();
    private startMousePosition: Vec2 = Vec2Util.zero();

    onStart({ mousePosition }: ToolEvent): void {
        this.startPoolOffset = this.env.offset;
        this.startMousePosition = mousePosition;
        this.actived = true;
    }

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;
        
        this.env.offset = Vec2Util.add(this.startPoolOffset, Vec2Util.minus(mousePosition, this.startMousePosition));
    }
    
    onEnd(): void {
        if (!this.actived) return;
        
        this.startPoolOffset = Vec2Util.zero();
        this.startMousePosition = Vec2Util.zero();
        this.actived = false;
    }

}