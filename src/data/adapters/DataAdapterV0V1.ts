import { DataAdapter } from "../DataAdapter";
import { MindNodePoolV0 } from "../versions/Version_0";
import { MindNodePoolV1 } from "../versions/Version_1";



export default class DataAdapterV0V1 implements DataAdapter<MindNodePoolV0, MindNodePoolV1> {
    
    get sourceVersion(): number {
        return 0;
    }
    
    get targetVersion(): number {
        return 1;
    }

    adapt(source: MindNodePoolV0): MindNodePoolV1 {
        return {
            version: 1,
            uidCounter: source.uidCounter,
            offset: source.offset,
            scaleFactor: source.scale,
            nodes: source.nodes,
        };
    }

}