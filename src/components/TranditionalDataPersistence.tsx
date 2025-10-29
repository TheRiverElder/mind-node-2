import { Component, ReactNode } from "react";
import DataPersistence from "../persistence/DataPersistence";

export interface TranditionalDataPersistenceState {
    file: File | null;
    outputFileName: string;
}

export default class TranditionalDataPersistence extends Component<{}, TranditionalDataPersistenceState> implements DataPersistence {

    constructor(props: {}) {
        super(props);
        this.state = {
            file: null,
            outputFileName: "",
        };
    }

    load(): Promise<string> {
        return new Promise((resolve, reject) => {
            const file = this.state.file;
            if (!file) {
                reject(new Error("No file selected!"));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reader.onabort = () => reject(new Error("Error encountered while reading " + file.name));
            reader.readAsText(file, "utf-8");
        });
    }
    
    save(dataString: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const outputFileName = this.state.outputFileName;
            if (outputFileName.length <= 0) {
                reject(new Error("No output file name!"));
                return;
            }

            const link: HTMLAnchorElement = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([dataString], {type: 'plain/text'}));
            link.download = outputFileName;
            link.click();

            resolve(true);
        });
    }

    makeConfig() {
        return {
            outputFileName: this.state.outputFileName || "未命名",
        };
    }

    loadConfig(config: any): boolean {
        this.setState(s => ({
            outputFileName: config.outputFileName || s.outputFileName,
        }));
        return true;
    }

    setFile(files: FileList | null) {
        if (!files || files.length <= 0) return;
        const file = files[0];

        this.setState(s => ({ 
            file,
            outputFileName: s.outputFileName || file.name,
        }));
    }

    render(): ReactNode {
        return (
            <div>
                <span>选择文件：</span>
                <input 
                    type="file"
                    onChange={e => this.setFile(e.target.files)} 
                />
                <span>保存文件名称：</span>
                <input 
                    value={this.state.outputFileName}
                    onChange={e => this.setState(() => ({ outputFileName: e.target.value }))} 
                />
            </div>
        );
    }

    
}