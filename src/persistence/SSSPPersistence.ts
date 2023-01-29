import { SimpleStorageClient } from "../sssp-api/SimpleStorageClient";
import type DataPersistence from "./DataPersistence";

export default class SSSPPersistence implements DataPersistence {

    private readonly client: SimpleStorageClient;
    private readonly path: string;

    constructor(client: SimpleStorageClient, path: string) {
        this.client = client;
        this.path = path;
    }

    load(): Promise<string> {
        return this.client.getText(this.path);
    }

    save(dataString: string): Promise<boolean> {
        return new Promise((resolve) => this.client.add(this.path, dataString).then((body) => resolve(body.succeeded)));
    }
}