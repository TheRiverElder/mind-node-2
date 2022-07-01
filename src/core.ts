import { MindNode, MindNodePool } from "./interfaces";
import { Vec2 } from "./util/mathematics";

export interface CreateNodeProps {
    uid: number,
    position: Vec2,
}

export function copyNode(node: MindNode, { uid, position }: CreateNodeProps): MindNode {console.log('copyNode', uid)
    return {
        ...node,
        uid,
        position,
    };
}

export function createNode({ uid, position }: CreateNodeProps): MindNode {console.log('createNode', uid)
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

export function loadPool(raw: MindNodePool): MindNodePool {
    const pool: MindNodePool = {
        uidCounter: raw.uidCounter || 0,
        offset: raw.offset || [0, 0],
        scale: raw.scale || 1,
        nodes: raw.nodes ? raw.nodes.map(it => Object.assign(createNode(it), it)) : [],
    };

    return pool;
}