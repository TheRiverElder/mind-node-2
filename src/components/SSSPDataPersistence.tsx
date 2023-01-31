import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";
import { SimpleStorageClient } from "../sssp-api/SimpleStorageClient";

export interface SSSPDataPersistenceState {
    host: string;
    path: string;
    locked: boolean;
}

export default class SSSPDataPersistence extends Component<{}, SSSPDataPersistenceState> implements DataPersistence {

    private client: SimpleStorageClient | null = null;

    constructor(props: {}) {
        super(props);
        this.state = {
            host: "localhost:8888",
            path: "C:/",
            locked: false,
        };
    }

    load(): Promise<string> {
        if (!this.state.locked) return new Promise((resolve, reject) => reject(new Error("未锁定！")));
        const client = this.client;
        if (client) return client.getText(this.state.path);
        return new Promise((resolve, reject) => reject(new Error("未知错误！")));
    }

    save(dataString: string): Promise<boolean> {
        if (!this.state.locked) return new Promise((resolve, reject) => reject(new Error("未锁定！")));
        const client = this.client;
        if (client) return new Promise((resolve, reject) => client.add(dataString, this.state.path).then((body) => resolve(body.succeeded)).catch(reject));
        return new Promise((resolve, reject) => reject(new Error("未知错误！")));
    }

    toggleConfirmed = () => {
        this.setState(s => {
            const locked = !s.locked;
            if (locked) {
                this.client = new SimpleStorageClient(new URL(`http://${this.state.host}/?path=${encodeURIComponent(this.state.path)}`));
            } else {
                this.client = null;
            }
            return { locked };
        });
    }

    render(): ReactNode {
        return (
            <div>
                <button onClick={this.toggleConfirmed}>{this.state.locked ? "取消锁定" : "锁定"}</button>
                <span>服务器：</span>
                <input
                    disabled={this.state.locked}
                    value={this.state.host}
                    onChange={e => this.setState(() => ({ host: e.target.value }))}
                />
                <span>文件路径：</span>
                <input 
                    disabled={this.state.locked}
                    value={this.state.path} 
                    onChange={e => this.setState(() => ({ path: e.target.value.replace(/\\/g, "/") }))} 
                />
            </div>
        );
    }
}