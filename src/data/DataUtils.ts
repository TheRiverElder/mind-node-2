import { MindNode, MindNodePool } from "../interfaces";
import { Vec2 } from "../util/mathematics";
import DataAdapterV0V1 from "./adapters/DataAdapterV0V1";
import { DataLoader } from "./DataLoader";

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

const DATA_LOADER: DataLoader = initialzieDataLoader();

export function loadPool(raw: MindNodePool): MindNodePool {
    return DATA_LOADER.load(raw);
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

function initialzieDataLoader(): DataLoader {
    const dataLoader = new DataLoader(1);
    
    dataLoader.addAdapter(new DataAdapterV0V1());

    return dataLoader;
}