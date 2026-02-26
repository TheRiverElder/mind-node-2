import { Vec2Util, Vec2 } from "../util/mathematics";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class DragNodeTool extends ToolBase {

    private actived: boolean = false;
    private startMousePosition: Vec2 = Vec2Util.zero();
    private startNodePositions: Map<number, Vec2> = new Map();
    private moved: boolean = false;
    private startNodeUid: number | null = null;

    onStart({ mousePosition, node }: ToolEvent): void {
        this.startNodePositions.clear();
        this.startMousePosition = mousePosition;
        this.actived = true;

        if (node) {
            this.startNodeUid = node.uid;
        }

        let selectedNodeUids: Array<number> = Array.from(this.context.selectedNodeUids.values());
        // 如果按下去的节点是未被选中的，则改为选择当前节点
        if (node && !this.context.selectedNodeUids.has(node.uid)) {
            selectedNodeUids = [node.uid];
            this.context.selectedNodeUids = new Set(selectedNodeUids);
        }
        // 拖动所有选择节点一起移动
        this.startNodePositions.clear();
        for (const uid of selectedNodeUids) {
            const node = this.context.getNodeByUid(uid);
            if (!node) continue;
            this.startNodePositions.set(uid, node.position);
        }
    }

    private delta: Vec2 = Vec2Util.zero();

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;

        const delta = Vec2Util.minus(mousePosition, this.startMousePosition);
        this.delta = delta; // 记录下移动的偏移量
        this.startNodePositions.forEach((startPosition, uid) => {
            this.context.modifyNode({ uid, position: Vec2Util.add(startPosition, delta), })
        });

        this.moved = true;
    }

    onEnd(): void {
        if (!this.actived) return;

        this.startNodePositions.clear();
        this.startMousePosition = Vec2Util.zero();
        this.actived = false;

        // 如果一开始有节点被选中，再进行接下来的判断
        if (this.startNodeUid !== null) {
            // 如果没有接收到move事件，则判定为没有移动过。如果移动距离很小也可以认为没有移动过（仅针对是否编辑该节点的判定）。
            const notActualMoved = !this.moved || Vec2Util.moduloSquared(this.delta) < 5;
            // 如果没有移动过，则说明这只是一次普通的点击，则编辑该节点
            if (notActualMoved) {
                this.context.editingObject = { type: 'node', uid: this.startNodeUid };
            }
        }
    }

}