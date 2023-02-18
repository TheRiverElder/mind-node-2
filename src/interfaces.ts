import { MindNodePoolV1, MindNodeV1 } from "./data/versions/Version_1";
import { Vec2 } from "./util/mathematics";

export type MindNode = MindNodeV1;
export type MindNodePool = MindNodePoolV1;

export interface MindNodePoolComponent {
    addNode(node: MindNode): void;
    updateNode(node: MindNode): void;
    removeNode(uid: number): void;
    getOffset(): Vec2;
    getAnchor(): Vec2;
    recordCardLinkAnchorPosition(uid: number, position: Vec2): void;
    onLink(node: MindNode): void;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}