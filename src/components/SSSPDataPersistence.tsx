import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";
import { SimpleStorageClient } from "../sssp-api/SimpleStorageClient";
import Selector from "./Selector";

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

export default class SSSPDataPersistence implements DataPersistence {

    private client: SimpleStorageClient | null = null;

    locked: boolean = false;
    host: string = "";
    path: string = "";
    protocol: ProtocolOption = PROTOCOL_OPTION_AUTO;

    toggleConfirmed = () => {
        const locked = !this.locked;
        if (locked) {
            this.setupClient();
        } else {
            this.client = null;
        }
    }

    setupClient() {
        let protocol = "http";
        if (this.protocol.id === "auto") {
            protocol = window.location.protocol.replace(/:$/g, "");
        } else {
            protocol = this.protocol.value;
        }
        const url = new URL(`${protocol}://${this.host}/?path=${encodeURIComponent(this.path)}`);
        localStorage.setItem(KEY, url.toString());
        // this.client = new SimpleStorageClient(new URL(`${window.location.protocol}//${this.state.host}/?path=${encodeURIComponent(this.state.path)}`));
        this.client = new SimpleStorageClient(url);
    }

    load(): Promise<string> {
        const client = this.client;
        if (client) return client.getText(this.path);
        return new Promise((resolve, reject) => reject(new Error("未知错误！")));
    }

    save(dataString: string): Promise<boolean> {
        const client = this.client;
        if (client) return new Promise((resolve, reject) => client.add(dataString, this.path).then((body) => resolve(body.succeeded)).catch(reject));
        return new Promise((resolve, reject) => reject(new Error("未知错误！")));
    }

    makeConfig() {
        return {
            host: this.host,
            path: this.path,
            protocol: this.protocol.id,
        };
    }

    loadConfig(config: any): boolean {
        this.host = config.host ?? this.host;
        this.path = config.path ?? this.path;
        this.protocol = getProtocolOptions().find(it => it.id === config.protocol) ?? this.protocol;
        return true;
    }
}

export class SSSPDataPersistenceView extends Component<{ persistence: SSSPDataPersistence }, SSSPDataPersistenceState> {

    readonly persistence: SSSPDataPersistence;

    constructor(props: { persistence: SSSPDataPersistence }) {
        super(props);
        this.state = loadOrCreateState();

        const persistence = props.persistence;
        this.persistence = persistence;

        persistence.locked = this.state.locked;
        persistence.host = this.state.host;
        persistence.path = this.state.path;
        persistence.protocol = this.state.protocol;

        if (this.state.locked) {
            persistence.setupClient();
        }
    }

    toggleConfirmed(): void {
        this.setState(s => {
            this.persistence.toggleConfirmed();
            return { locked: this.persistence.locked };
        });
    }

    render(): ReactNode {
        return (
            <div>
                <button onClick={this.toggleConfirmed}>{this.state.locked ? "取消锁定" : "锁定"}</button>
                <Selector
                    value={this.state.protocol.id}
                    options={getProtocolOptions()}
                    getText={o => o.name}
                    getValue={o => o.id}
                    disabled={this.state.locked}
                    onChange={o => {
                        this.persistence.protocol = o;
                        this.setState(() => ({ protocol: o }));
                    }}
                />
                <span>服务器：</span>
                <input
                    disabled={this.state.locked}
                    value={this.state.host}
                    onChange={e => {
                        const value = e.target.value.trim();
                        this.persistence.host = value;
                        this.setState(() => ({ host: value }));
                    }}
                />
                <span>文件路径：</span>
                <input
                    disabled={this.state.locked}
                    value={this.state.path}
                    onChange={e => {
                        const value = e.target.value.replace(/\\/g, "/");
                        this.persistence.path = value;
                        this.setState(() => ({ path: value }));
                    }}
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
                protocol: getProtocolOptions().find(p => p.value === protocol) || PROTOCOL_OPTION_AUTO,
                locked: true, // 成功载入则自动给锁定
            };
        } catch (error) { }
    }
    return defaultState;
}