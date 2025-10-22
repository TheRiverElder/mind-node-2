import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class LinkNodeTool extends ToolBase {

    private actived: boolean = false;

    onStart({ node }: ToolEvent): void {
        if (!node) return;

        this.actived = true;

        // 如果按下去的节点是没被选中的，则改为选择当前节点
        if (node && !this.context.selectedNodeUids.has(node.uid)) {
            this.context.selectedNodeUids = new Set([node.uid]);
        }
    }

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;
        this.context.virtualTargetPosition = mousePosition;
    }

    onEnd({ node }: ToolEvent): void {
        if (!this.actived) return;

        this.context.virtualTargetPosition = null;

        if (node) {
            const dstUid = node.uid;
            this.context.selectedNodeUids.forEach(srcUid => this.context.createLink(srcUid, dstUid));
        }

        this.actived = false;
    }

}