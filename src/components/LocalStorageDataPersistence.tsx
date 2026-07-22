import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export interface LocalStorageDataPersistenceState {
    key: string;
    keyList: Array<string> | null;
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

export class LocalStorageDataPersistenceView extends Component<{ persistence: LocalStorageDataPersistence }, LocalStorageDataPersistenceState> {

    readonly persistence: LocalStorageDataPersistence;

    constructor(props: { persistence: LocalStorageDataPersistence }) {
        super(props);
        this.persistence = props.persistence;
        this.state = {
            key: this.persistence.key ?? "",
            keyList: null,
        };
    }

    loadLeyList() {
        const length = localStorage.length ?? 0;
        const keyList: string[] = [];
        for (let i = 0; i < length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(KEY_PREFIX)) continue;
            keyList.push(key.substring(KEY_PREFIX.length));
        }
        this.setState({ keyList });
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
                <div>
                    <button onClick={() => this.loadLeyList()}>显示所有</button>
                    <ul>
                        {this.state.keyList?.map(k => (
                            <li>
                                <span>{k}</span>
                                <button onClick={() => this.setState({ key: k })}>填入</button>
                                <button onClick={() => {
                                    // 使用html原生弹窗确认是否删除
                                    if (window.confirm(`确定删除${KEY_PREFIX}${k}吗？`)) {
                                        localStorage.removeItem(`${KEY_PREFIX}${k}`);
                                        this.loadLeyList();
                                    }
                                }}>删除</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }


}