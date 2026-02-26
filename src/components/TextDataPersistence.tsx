import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export default class TextDataPersistence implements DataPersistence {

    dataText: string = "";

    load(): Promise<string> {
        return new Promise((resolve) => resolve(this.dataText));
    }

    save(dataString: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.dataText = dataString;
            resolve(true);
        });
    }

    makeConfig() {
        return { dataText: this.dataText };
    }

    loadConfig(config: any): boolean {
        this.dataText = config.dataText ?? "";
        return true;
    }
}

export interface TextDataPersistenceState {
    dataText: string;
}

export class TextDataPersistenceView extends Component<{ persistence: TextDataPersistence }, TextDataPersistenceState> {

    readonly persistence: TextDataPersistence;

    constructor(props: { persistence: TextDataPersistence }) {
        super(props);
        this.persistence = props.persistence;
        this.state = {
            dataText: "",
        };
    }


    copy = () => {
        window.navigator.clipboard.writeText(this.state.dataText);
    }

    paste = () => {
        window.navigator.clipboard.readText().then(text => {
            this.persistence.dataText = text;
            this.setState(() => ({ dataText: text }));
        });
    }

    render(): ReactNode {
        return (
            <div>
                <span>文本数据（JSON）：</span>
                <textarea
                    value={this.state.dataText}
                    onChange={e => {
                        const value = e.target.value.replace(/\\/g, "/");
                        this.persistence.dataText = value;
                        this.setState(() => ({ dataText: value }));
                    }}
                />
                <button onClick={this.copy}>复制</button>
                <button onClick={this.paste}>粘贴</button>
            </div>
        );
    }
}