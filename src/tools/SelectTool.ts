import { equalsArray } from "../util/javascript-extension";
import { Vec2, Vec2Util, X, Y } from "../util/mathematics";
import { ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class SelectTool extends ToolBase {

    private actived: boolean = false;
    private startMousePosition: Vec2 = Vec2Util.zero();

    onStart({ mousePosition }: ToolEvent): void {
        this.startMousePosition = mousePosition;
        this.actived = true;
    }

    onMove({ mousePosition }: ToolEvent): void {
        if (!this.actived) return;

        const [width, height] = Vec2Util.minus(mousePosition, this.startMousePosition);
        this.env.selectionArea = {
            x: this.startMousePosition[X],
            y: this.startMousePosition[Y],
            width,
            height,
        };
    }
    
    onEnd({ mousePosition, node, nativeEvent }: ToolEvent): void {
        if (!this.actived) return;

        let selectedNodeUids: Array<number> = [];
        if (equalsArray(this.startMousePosition, mousePosition)) { // 没有移动，那么就选中当前这个节点
            if (node) {
                selectedNodeUids = [node.uid];
            }
        } else { // 有移动，那么范围选取
            const [left, right] = [this.startMousePosition[X], mousePosition[X]].sort();
            const [top, bottom] = [this.startMousePosition[Y], mousePosition[Y]].sort();
            selectedNodeUids = Array.from(this.env.nodes.values()).filter((node) => {
                const rect = this.env.getNodeRect(node.uid);
                if (!rect) return false;
                const { x, y, width, height } = rect;
                return (x >= left && y >= top && x + width < right && y + height < bottom);
            }).map(node => node.uid);
        }

        if (nativeEvent.ctrlKey) {
            selectedNodeUids.forEach(it => this.env.selectedNodeUids.add(it));
        } else {
            this.env.selectedNodeUids = new Set(selectedNodeUids);
        }
        
        this.startMousePosition = Vec2Util.zero();
        this.env.selectionArea = null;
        this.actived = false;
    }

}