import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export interface LocalStorageDataPersistenceState {
    key: string;
}

export const KEY_PREFIX = "MindNodeData--";

export default class LocalStorageDataPersistence implements DataPersistence {

    key: string = "";

    load(): Promise<string> {
        return new Promise((resolve, reject) => {
            const key = this.key;
            if (!key) {
                reject(new Error("No key specified!"));
                return;
            }

            const actualKey = KEY_PREFIX + key;

            const dataString = localStorage.getItem(actualKey);
            if (dataString) {
                resolve(dataString);
            } else {
                reject(new Error("No data in this key: " + key));
            }
        });
    }

    save(dataString: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const key = this.key;
            if (!key) {
                reject(new Error("No key specified!"));
                return;
            }

            const actualKey = KEY_PREFIX + key;

            localStorage.setItem(actualKey, dataString);
            resolve(true);
        });
    }

    makeConfig() {
        return {
            key: this.key,
        };
    }

    loadConfig(config: any): boolean {
        this.key = config.key ?? this.key;
        return true;
    }
}

export class LocalStorageDataPersistenceView extends Component<{ persistence: LocalStorageDataPersistence}, LocalStorageDataPersistenceState> {

    readonly persistence: LocalStorageDataPersistence;

    constructor(props: { persistence: LocalStorageDataPersistence}) {
        super(props);
        this.persistence = props.persistence;
        this.state = {
            key: this.persistence.key ?? "",
        };
    }

    render(): ReactNode {
        return (
            <div>
                <span>键名：</span>
                <span>{KEY_PREFIX}</span>
                <input
                    value={this.state.key}
                    onChange={e => {
                        const value = e.target.value;
                        this.persistence.key = value;
                        this.setState(() => ({ key: value }));
                    }}
                />
            </div>
        );
    }


}