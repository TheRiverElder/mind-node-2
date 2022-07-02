import { MindNode, MindNodePool } from "./interfaces";
import { Vec2 } from "./util/mathematics";

export interface CreateNodeProps {
    uid: number,
    position: Vec2,
}

export function copyNode(node: MindNode, { uid, position }: CreateNodeProps): MindNode {
    return {
        ...node,
        uid,
        position,
        inPorts: [],
        outPorts: [],
    };
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

export function loadPool(raw: MindNodePool): MindNodePool {
    const pool: MindNodePool = {
        uidCounter: raw.uidCounter || 0,
        offset: raw.offset || [0, 0],
        scale: raw.scale || 1,
        nodes: raw.nodes ? raw.nodes.map(it => Object.assign(createNode(it), it)) : [],
    };

    return pool;
}
export function linkNodes(sourceNode: MindNode, targetNode: MindNode): boolean {
    if (sourceNode && targetNode && sourceNode.uid !== targetNode.uid) {
        const outPorts = new Set(sourceNode.outPorts);
        const inPorts = new Set(targetNode.inPorts);
        if (outPorts.has(targetNode.uid)) {
            outPorts.delete(targetNode.uid);
            inPorts.delete(sourceNode.uid);
        } else {
            outPorts.add(targetNode.uid);
            inPorts.add(sourceNode.uid);
        }
        sourceNode.outPorts = Array.from(outPorts);
        targetNode.inPorts = Array.from(inPorts);
        return true;
    } else return false;
}

export function unlinkNodes(sourceNode: MindNode, targetNode: MindNode) {
    if (sourceNode && targetNode) {
        const outPorts = new Set(sourceNode.outPorts);
        const inPorts = new Set(targetNode.inPorts);
        if (outPorts.has(targetNode.uid)) {
            outPorts.delete(targetNode.uid);
        }
        if (inPorts.has(sourceNode.uid)) {
            inPorts.delete(sourceNode.uid);
        }
        sourceNode.outPorts = Array.from(outPorts);
        targetNode.inPorts = Array.from(inPorts);
    }
}