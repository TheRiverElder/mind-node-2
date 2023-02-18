
export interface MindNodeV1 {
    uid: number; 
    position: Vec2; 
    text: string; 
    background: string; 
    color: string; 
    outPorts: Array<number>; 
    inPorts: Array<number>; 
}

export interface MindNodePoolV1 {
    version: 1; // 增加了version字段
    uidCounter: number;
    offset: Vec2; 
    scaleFactor: number; // 将scale更名为scaleFactor
    nodes: Array<MindNodeV1>;
}