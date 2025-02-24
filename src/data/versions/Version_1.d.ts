
export interface MindNodeV1 {
    uid: number; 
    position: Vec2; 
    text: string; 
    background: string; 
    color: string; 
    // 从V2标准迁移增加的renderer字段，以便增加功能
    renderer: string;
    outPorts: Array<number>; 
    inPorts: Array<number>; 
}

export type LinkPainterIdV1 = "bezier_curve" | "straight_line";

export interface MindNodePoolV1 {
    version: 1; // 增加了version字段
    linkPainterId: LinkPainterIdV1; // 增加了linkPainter字段
    uidCounter: number;
    offset: Vec2; 
    scaleFactor: number; // 将scale更名为scaleFactor
    nodes: Array<MindNodeV1>;
}