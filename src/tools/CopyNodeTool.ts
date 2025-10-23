import { copyNodeData } from "../data/DataUtils";
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

        let selectedNodeUids: Array<number> = Array.from(this.context.selectedNodeUids.values());

        // 如果按下去的节点是被选中的，则改为选择当前节点
        if (node && !this.context.selectedNodeUids.has(node.uid)) {
            selectedNodeUids = [node.uid];
            this.context.selectedNodeUids = new Set(selectedNodeUids);
        }
        // 复制选中节点
        const copiedNodes = arrayFilterNonNull<MindNode>(arrayFilterNonNull<MindNode>(selectedNodeUids.map(uid => this.context.getNodeByUid(uid)))
            .map((node: MindNode) => copyNodeData(node, vec2Copy(node.position)))
            .map(data => this.context.createNode(data))
            .map(uid => this.context.getNodeByUid(uid)));
            
        // 清空选中节点
        selectedNodeUids = [];
        // 把复制的节点加入节点池中，并设置为选中
        copiedNodes.forEach(n => {
            selectedNodeUids.push(n.uid);
        });
        this.context.selectedNodeUids = new Set(selectedNodeUids);
        // 如果只复制了一个节点，则编辑这个新的节点
        if (copiedNodes.length === 1) {
            this.context.editingNodeUid = copiedNodes[0].uid;
        }

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
            const node = this.context.getNodeByUid(uid);
            if (!node) return;
            this.context.modifyNode({
                uid: node.uid,
                position: Vec2Util.add(startPosition, delta),
            });
        });
    }

    onEnd(): void {
        if (!this.actived) return;

        this.startNodePositions.clear();
        this.startMousePosition = Vec2Util.zero();
        this.actived = false;
    }

}