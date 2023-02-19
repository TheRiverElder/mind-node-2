
export interface MindNodeV2 {
    uid: number; 
    position: Vec2; 
    text: string; 
    background: string; 
    color: string; 
    // 删除inPoirts和outPorts字段
}

export interface MindNodeLinkV2 {
    uid: number; 
    sourceNodeUid: number;
    targetNodeUid: number;
    text: string;
    background: string; 
    color: string; 
}

export type LinkPainterIdV2 = "bezier_curve" | "straight_line";

export interface MindNodePoolV2 {
    version: 2;
    linkPainterId: LinkPainterId; 
    uidCounter: number;
    offset: Vec2; 
    scaleFactor: number;
    nodes: Array<MindNodeV2>;
    links: Array<MindNodeLinkV2>;
}