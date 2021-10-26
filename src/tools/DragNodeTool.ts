import { Vec2Util, Vec2 } from "../util/mathematics";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class DragNodeTool extends ToolBase {

    private actived: boolean = false;
    private startMousePosition: Vec2 = Vec2Util.zero();
    private startNodePositions: Map<number, Vec2> = new Map();

    onStart({ mousePosition, node }: ToolEvent): void {
        this.startNodePositions.clear();
        this.startMousePosition = mousePosition;
        this.actived = true;

        let selectedNodeUids: Array<number> = Array.from(this.env.selectedNodeUids.values());
        // 如果按下去的节点是被选中的，则改为选择当前节点
        if (node && !this.env.selectedNodeUids.has(node.uid)) { 
            selectedNodeUids = [node.uid];
            this.env.selectedNodeUids = new Set(selectedNodeUids);
        }
        // 拖动所有选择节点一起移动
        for (const uid of selectedNodeUids) {
            const node = this.env.nodes.get(uid);
            if (!node) continue;
            this.startNodePositions.set(uid, node.position);
        }
    }

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;
        
        
        const delta = Vec2Util.minus(mousePosition, this.startMousePosition);
        this.startNodePositions.forEach((startPosition, uid) => {
            const node = this.env.nodes.get(uid);
            if (!node) return;
            node.position = Vec2Util.add(startPosition, delta);
        });
    }
    
    onEnd(): void {
        if (!this.actived) return;
        
        this.startNodePositions.clear();
        this.startMousePosition = Vec2Util.zero();
        this.actived = false;
    }

}