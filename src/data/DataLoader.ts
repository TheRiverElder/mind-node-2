import { MindNodePool } from "../interfaces";
import ChainDataAdapter from "./ChainDataAdapter";
import { DataAdapter } from "./DataAdapter";

export class DataLoader {
    readonly currentVersion: number;

    private adaptersBySourceVersion = new Map<number, Map<number, DataAdapter>>();

    constructor(currentVersion: number) {
        this.currentVersion = currentVersion;
    }

    addAdapter(adapter: DataAdapter) {
        const sourceVersion = adapter.sourceVersion;
        const targetVersion = adapter.targetVersion;

        let candidates = this.adaptersBySourceVersion.get(sourceVersion);
        if (!candidates) {
            candidates = new Map();
            this.adaptersBySourceVersion.set(sourceVersion, candidates);
        }
        candidates.set(targetVersion, adapter);
    }

    getAdapter(sourceVersion: number, targetVersion: number): DataAdapter | null {
        const candidates = this.adaptersBySourceVersion.get(sourceVersion);
        if (candidates) {
            const adapter = candidates.get(targetVersion);
            if (adapter) return adapter;
            for (let newTargetVersion = 0; newTargetVersion < targetVersion; newTargetVersion++) {
                const newAdapter = candidates.get(newTargetVersion);
                if (newAdapter) {
                    const nextAdapter = this.getAdapter(newTargetVersion, targetVersion);
                    if (nextAdapter) return new ChainDataAdapter(sourceVersion, targetVersion, [newAdapter, nextAdapter]);
                }
            }
            return null;
        } else return null;
    }

    load(rawData: any): MindNodePool {
        if (!rawData) throw new Error("Cannot load null!");
        
        const rawSourceVersion = rawData.version;
        const sourceVersion = (typeof rawSourceVersion === 'number') ? rawSourceVersion : 0;
        if (sourceVersion === this.currentVersion) return rawData;
        const adapter = this.getAdapter(sourceVersion, this.currentVersion);
        if (!adapter) throw new Error(`Version not accept: From ${sourceVersion} to ${this.currentVersion}`);
        
        return adapter.adapt(rawData);
    }
}