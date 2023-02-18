import { DataAdapter } from "./DataAdapter";

export default class ChainDataAdapter implements DataAdapter {
    readonly sourceVersion: number;
    readonly targetVersion: number;
    readonly chain: DataAdapter[];

    constructor(sourceVersion: number, targetVersion: number, chain: DataAdapter[]) {
        this.sourceVersion = sourceVersion;
        this.targetVersion = targetVersion;
        this.chain = chain;
    }

    adapt(source: any) {
        let data = source;
        for (const adapter of this.chain) {
            data = adapter.adapt(data);
        }
        return data;
    }

}