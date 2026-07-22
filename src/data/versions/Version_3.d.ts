
export interface MindNodeV3 {
    uid: number; 
    position: Vec2; 
    text: string; 
    renderer: string;
    style: MindNodeLinkV3;
}

export interface MindNodeStyleV3 {
    base: string | null;
    background: string; 
    color: string; 
    width: string;
    padding: string;
    custom?: Record<string, any>;
}

export interface MindNodeLinkV3 {
    uid: number; 
    source: number;
    target: number;
    text: string;
    // background: string; 
    color: string; 
}

export type LinkPainterIdV3 = "bezier_curve" | "straight_line";

export interface MindNodePoolV3 {
    version: 3;
    linkPainterId: LinkPainterIdV3; 
    uidCounter: number;
    offset: Vec2; 
    scaleFactor: number;
    nodes: Array<MindNodeV3>;
    links: Array<MindNodeLinkV3>;
}