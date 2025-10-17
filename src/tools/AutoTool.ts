import { MOUSE_BUTTON_MIDDLE, MOUSE_BUTTON_RIGHT } from "../constants";
import { CopyNodeTool } from "./CopyNodeTool";
import { CreateNodeTool } from "./CreateNodeTool";
import { DragNodeTool } from "./DragNodeTool";
import { DragPoolTool } from "./DragPoolTool";
import { LinkNodeTool } from "./LinkNodeTool";
import { SelectTool } from "./SelectTool";
import { Tool, ToolBase, ToolEvent } from "./Tool";

// 拖动整个节点池
export class AutoTool extends ToolBase {

    private tool: Tool | null = null;

    onStart(event: ToolEvent): void {
        const { node, nativeEvent } = event;
        if (nativeEvent.button === MOUSE_BUTTON_MIDDLE) {
            this.tool = new DragPoolTool(this.env);
        } else if (nativeEvent.button === MOUSE_BUTTON_RIGHT) {
            this.tool = new LinkNodeTool(this.env);
        } else if (nativeEvent.ctrlKey) {
            this.tool = new SelectTool(this.env);
        } else if (nativeEvent.shiftKey) {
            this.tool = new CreateNodeTool(this.env);
            nativeEvent.preventDefault();
        } else if (nativeEvent.altKey) {
            this.tool = new CopyNodeTool(this.env);
        } else if (node) {
            this.tool = new DragNodeTool(this.env);
        } else {
            this.tool = new SelectTool(this.env);
        }
        // console.log("AutoTool.tool =", this.tool.constructor.name);
        this.tool.onStart(event);
    }

    onMove(event: ToolEvent): void {
        this.tool?.onMove(event);
    }
    
    onEnd(event: ToolEvent): void {
        this.tool?.onEnd(event);
        this.tool = new SelectTool(this.env);
    }

}