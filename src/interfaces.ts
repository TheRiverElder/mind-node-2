import { Vec2 } from "./util/mathematics";

export interface MindNode {
    uid: number; // 它的唯一标识符
    position: Vec2; // 它的坐标，是一个二元组，格式是[x, y]
    text: string; // 它的内容，目前只支持纯文本
    outPorts: Array<number>; // 它的下线，即它接下来要连接到后续节点列表
    inPorts: Array<number>; // 它的上线，即它接下来要连接到后续节点列表
}

export interface MindNodePool {
    uidCounter: number;
    offset: Vec2; // 原点相对画面中点的偏移坐标
    scale: number;
    nodes: Array<MindNode>; // 节点池内的节点
}

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