import { MindNode, MindNodeLink } from "../interfaces";
import { Vec2 } from "../util/mathematics";

export default interface EditorHistory {
    undo(context: HistoryControlContext): void;
}


/**
 * 用于进行一些原子操作，不产生任何副作用，也不更新UI，把控制权交给History.undo()
 */
export interface HistoryControlContext {

    getUidCounter(): number;
    setUidCounter(value: number): void;

    getOffset(): Vec2;
    setOffset(value: Vec2): void;

    addNode(node: MindNode): void;
    removeNode(uid: number): void;
    modifyNode(node: MindNode): void;


    addLink(link: MindNodeLink): void;
    removeLink(uid: number): void;
    modifyLink(link: MindNodeLink): void;

}