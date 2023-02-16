import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";
import { SimpleStorageClient } from "../sssp-api/SimpleStorageClient";

interface ProtocolOption {
    id: string;
    name: string;
    value: string;
}

export interface SSSPDataPersistenceState {
    host: string;
    path: string;
    locked: boolean;
    protocol: ProtocolOption;
}

const PROTOCOL_OPTION_AUTO = { id: "auto", name: "自动", value: "" };
const PROTOCOL_OPTION_HTTP = { id: "http", name: "HTTP", value: "http" };
const PROTOCOL_OPTION_HTTPS = { id: "https", name: "HTTPS", value: "https" };

function getProtocolOptions() {
    return [PROTOCOL_OPTION_AUTO, PROTOCOL_OPTION_HTTP, PROTOCOL_OPTION_HTTPS];
}

export default class SSSPDataPersistence extends Component<{}, SSSPDataPersistenceState> implements DataPersistence {

    private client: SimpleStorageClient | null = null;

    constructor(props: {}) {
        super(props);
        this.state = loadOrCreateState();
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
                let protocol = "http";
                if (this.state.protocol.id === "auto") {
                    protocol = window.location.protocol.replace(/:$/g, "");
                } else {
                    protocol = this.state.protocol.value;
                }
                const url = new URL(`${protocol}://${this.state.host}/?path=${encodeURIComponent(this.state.path)}`);
                localStorage.setItem(KEY, url.toString());
                // this.client = new SimpleStorageClient(new URL(`${window.location.protocol}//${this.state.host}/?path=${encodeURIComponent(this.state.path)}`));
                this.client = new SimpleStorageClient(url);
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
                <select 
                    value={this.state.protocol.id}
                    disabled={this.state.locked} 
                    onChange={e => this.setState(() => ({ protocol: getProtocolOptions().find(o => o.id === e.target.value) || PROTOCOL_OPTION_AUTO }))}
                >
                    {getProtocolOptions().map(o => (
                        <option value={o.id}>{o.name}</option>
                    ))}
                </select>
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

const KEY = "mind_node_2_sssp_cache";

function loadOrCreateState(): SSSPDataPersistenceState {
    const defaultState = {
        host: "localhost:8888",
        path: "C:/",
        locked: false,
        protocol: PROTOCOL_OPTION_AUTO,
    };
    const savedUrl = localStorage.getItem(KEY);
    if (savedUrl) {
        try {
            const url = new URL(savedUrl);
            const protocol = url.protocol.replace(/:$/, "");
            return {
                host: url.host || defaultState.host,
                path: url.searchParams.get("path") || defaultState.path,
                locked: false,
                protocol: getProtocolOptions().find(p => p.value === protocol) || PROTOCOL_OPTION_AUTO,
            };
        } catch (error) { }
    }
    return defaultState;
}