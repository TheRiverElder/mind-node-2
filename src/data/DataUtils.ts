import { MindNode, MindNodePool, MutableMindNode } from "../interfaces";
import { Vec2, Vec2Util } from "../util/mathematics";
import DataAdapterV0V1 from "./adapters/DataAdapterV0V1";
import { DataLoader } from "./DataLoader";

export function copyNodeData(node: MindNode, position: Vec2 = node.position): MutableMindNode {
    const { uid, ...originData } = node;
    return {
        ...originData,
        position,
        inPorts: [],
        outPorts: [],
    };
}

export function createDefaultNode(uid: number, data: Readonly<Partial<MutableMindNode>>): MindNode {
    return {
        uid,
        position: Vec2Util.zero(),
        text: `请输入文本`,
        background: '#223344',
        color: '#ffffff',
        renderer: "default",
        outPorts: [],
        inPorts: [],
        ...data,
    };
}

const DATA_LOADER: DataLoader = initialzieDataLoader();

export function loadPool(raw: MindNodePool): MindNodePool {
    return DATA_LOADER.load(raw);
}

function initialzieDataLoader(): DataLoader {
    const dataLoader = new DataLoader(1);

    dataLoader.addAdapter(new DataAdapterV0V1());

    return dataLoader;
}