import { linkNodes } from "../core";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class LinkNodeTool extends ToolBase {

    private actived: boolean = false;

    onStart({ node }: ToolEvent): void {
        if (!node) return;

        this.actived = true;

        // 如果按下去的节点是没被选中的，则改为选择当前节点
        if (node && !this.env.selectedNodeUids.has(node.uid)) {
            this.env.selectedNodeUids = new Set([node.uid]);
        }
    }

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;
        this.env.virtualDstPos = mousePosition;
    }

    onEnd({ node }: ToolEvent): void {
        if (!this.actived) return;

        this.env.virtualDstPos = null;

        if (node) {
            const dst = node;
            this.env.selectedNodeUids.forEach(uid => {
                const src = this.env.nodes.get(uid);
                if (src) {
                    linkNodes(src, dst);
                }
            });
        }

        this.actived = false;
    }

}