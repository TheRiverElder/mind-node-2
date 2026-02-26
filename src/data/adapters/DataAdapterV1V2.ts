import { DataAdapter } from "../DataAdapter";
import { MindNodePoolV1 } from "../versions/Version_1";
import { MindNodeLinkV2, MindNodePoolV2, MindNodeV2 } from "../versions/Version_2";

export default class DataAdapterV1V2 implements DataAdapter<MindNodePoolV1, MindNodePoolV2> {
    
    get sourceVersion(): number {
        return 1;
    }
    
    get targetVersion(): number {
        return 2;
    }

    adapt(source: MindNodePoolV1): MindNodePoolV2 {

        let uidCounter = source.uidCounter;

        const nodes: Array<MindNodeV2> = [];
        const links: Array<MindNodeLinkV2> = [];

        for (const oldNode of source.nodes) {
            const uid = oldNode.uid;
            const newNode: MindNodeV2 = {
                uid,
                position: oldNode.position,
                text: oldNode.text,
                background: oldNode.background,
                color: oldNode.color,
                renderer: oldNode.renderer,
            };
            nodes.push(newNode);
            
            for (const nextNodeUid of oldNode.outPorts) {
                const link: MindNodeLinkV2  = {
                    uid: uidCounter++,
                    source: uid,
                    target: nextNodeUid,
                    text: '',
                    color: 'black',
                };
                links.push(link);
            }
        }

        return {
            version: 2,
            linkPainterId: source.linkPainterId,
            uidCounter,
            offset: source.offset,
            scaleFactor: source.scaleFactor,
            nodes,
            links,
        };
    }

}