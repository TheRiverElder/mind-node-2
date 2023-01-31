import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export interface TextDataPersistenceState {
    dataText: string;
}

export default class TextDataPersistence extends Component<{}, TextDataPersistenceState> implements DataPersistence {

    constructor(props: {}) {
        super(props);
        this.state = {
            dataText: "",
        };
    }

    load(): Promise<string> {
        return new Promise((resolve) => resolve(this.state.dataText));
    }

    save(dataString: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.setState(() => ({ dataText: dataString }));
            resolve(true);
        });
    }

    render(): ReactNode {
        return (
            <div>
                <span>文本数据（JSON）：</span>
                <textarea 
                    value={this.state.dataText} 
                    onChange={e => this.setState(() => ({ dataText: e.target.value.replace(/\\/g, "/") }))} 
                />
            </div>
        );
    }
}