import { copyNode } from "../core";
import { MindNode } from "../interfaces";
import { arrayFilterNonNull } from "../util/lang";
import { Vec2Util, Vec2, vec2Copy } from "../util/mathematics";
import { ToolBase, ToolEvent } from "./Tool";

// 复制节点
export class CopyNodeTool extends ToolBase {

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
        // 复制选中节点
        const copiedNodes = arrayFilterNonNull<MindNode>(Array.from(selectedNodeUids.values()).map(uid => this.env.nodes.get(uid)))
            .map((node: MindNode) => copyNode(node, { uid: this.env.genUid(), position: vec2Copy(node.position) }));
        console.log("copiedNodes", copiedNodes);
        // 清空选中节点
        this.env.selectedNodeUids.clear()
        // 把复制的节点加入节点池中，冰设置为选中
        copiedNodes.forEach(n => {
            this.env.nodes.set(n.uid, n);
            this.env.selectedNodeUids.add(n.uid);
        });

        // 拖动所有选择节点一起移动
        this.startNodePositions.clear();
        for (const node of copiedNodes) {
            if (!node) continue;
            this.startNodePositions.set(node.uid, node.position);
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