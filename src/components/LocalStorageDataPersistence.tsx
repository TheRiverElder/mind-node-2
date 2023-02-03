import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export interface LocalStorageDataPersistenceState {
    key: string;
}

export const KEY_PREFIX = "MindNodeData--";

export default class LocalStorageDataPersistence extends Component<{}, LocalStorageDataPersistenceState> implements DataPersistence {

    constructor(props: {}) {
        super(props);
        this.state = {
            key: "",
        };
    }

    load(): Promise<string> {
        return new Promise((resolve, reject) => {
            const key = this.state.key;
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
            const key = this.state.key;
            if (!key) {
                reject(new Error("No key specified!"));
                return;
            }

            const actualKey = KEY_PREFIX + key;

            localStorage.setItem(actualKey, dataString);
            resolve(true);
        });
    }

    render(): ReactNode {
        return (
            <div>
                <span>键名：</span>
                <span>{KEY_PREFIX}</span>
                <input 
                    value={this.state.key}
                    onChange={e => this.setState(() => ({ key: e.target.value }))} 
                />
            </div>
        );
    }

    
}