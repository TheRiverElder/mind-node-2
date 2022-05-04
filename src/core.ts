import { MindNode } from "./interfaces";
import { Vec2 } from "./util/mathematics";

export interface CreateNodeProps {
    uid: number,
    position: Vec2,
}

export function createNode({ uid, position }: CreateNodeProps): MindNode {
    return {
        uid,
        position,
        text: `#${uid}`,
        background: '#223344',
        color: '#ffffff',
        outPorts: [],
        inPorts: [],
    };
}