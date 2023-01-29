import { DirectoryInformationCache, ItemInformationCache, SSSPJsonResponseBody } from "./ResponseTypes";

export class SimpleStorageClient {

    static readonly METHOD_GET = "GET";
    static readonly METHOD_POST = "POST";

    static readonly ACTION_GET = "get";
    static readonly ACTION_GET_INFORMATION = "get-information";
    static readonly ACTION_GET_CHILDREN = "get-children";
    static readonly ACTION_ADD = "add";
    static readonly ACTION_DELETE = "delete";
    static readonly ACTION_RECYCLE = "recycle";
    static readonly ACTION_RENAME = "rename";

    private readonly baseUrl: URL;

    constructor(baseUrl: URL) {
        this.baseUrl = baseUrl;
    }

    public constructUrl(action: string, path?: string, target?: string): string {
        const searchParamEntries: [string, string][] = Array.from(this.baseUrl.searchParams.entries());

        // URLSearchParams会导致path的空格变成加号，是十分严重且SB的行为
        // searchParams.set("action", action);
        // if (typeof path === "string") {
        //     searchParams.set("path", path);
        // }
        // if (typeof target === "string") {
        //     searchParams.set("target", target);
        // }

        searchParamEntries.push(["action", action]);
        if (typeof path === "string") {
            searchParamEntries.push(["path", path]);
        }
        if (typeof target === "string") {
            searchParamEntries.push(["target", target]);
        }

        return this.baseUrl.origin + this.baseUrl.pathname + "?" + searchParamEntries.map(([k, v]) => (k + "=" + encodeURIComponent(v))).join("&");
    }

    public constructPromise<T>(url: string, method: string): Promise<SSSPJsonResponseBody<T>> {
        return new Promise((resolve, reject) => fetch(url, { method, mode: "no-cors" })
            .then(response =>
                response.json().then(jsonData => resolve(jsonData)).catch(e => reject(e))
            ).catch(e => reject(e))
        );
    }

    public getInformation(path: string): Promise<SSSPJsonResponseBody<ItemInformationCache>> {
        return this.constructPromise(this.constructUrl(SimpleStorageClient.ACTION_GET_INFORMATION, path), SimpleStorageClient.METHOD_GET);
    }

    public getChildren(path: string): Promise<SSSPJsonResponseBody<DirectoryInformationCache>> {
        return this.constructPromise(this.constructUrl(SimpleStorageClient.ACTION_GET_CHILDREN, path), SimpleStorageClient.METHOD_GET);
    }

    public getText(path?: string): Promise<string> {
        return new Promise((resolve, reject) =>
            fetch(
                this.constructUrl(SimpleStorageClient.ACTION_GET, path),
                { method: SimpleStorageClient.METHOD_GET, mode: "no-cors" }
            ).then(response =>
                response.text().then(textData => resolve(textData)).catch(e => reject(e))
            ).catch(e => reject(e))
        );
    }

    public add(textData: string, path?: string): Promise<SSSPJsonResponseBody> {
        const urlString = this.constructUrl(SimpleStorageClient.ACTION_ADD, path);
        console.log("add", urlString);
        return new Promise((resolve, reject) =>
            fetch(
                urlString,
                { method: SimpleStorageClient.METHOD_POST, body: textData, mode: "no-cors" }
            ).then(response =>
                response.json().then(jsonData => resolve(jsonData)).catch(e => reject(e))
            ).catch(e => reject(e))
        );
    }

    public delete(path: string): Promise<SSSPJsonResponseBody> {
        return this.constructPromise(this.constructUrl(SimpleStorageClient.ACTION_DELETE, path), SimpleStorageClient.METHOD_POST);
    }

    public recycle(path: string): Promise<SSSPJsonResponseBody> {
        return this.constructPromise(this.constructUrl(SimpleStorageClient.ACTION_RECYCLE, path), SimpleStorageClient.METHOD_POST);
    }

    public rename(path: string, target: string): Promise<SSSPJsonResponseBody> {
        return this.constructPromise(this.constructUrl(SimpleStorageClient.ACTION_RENAME, path, target), SimpleStorageClient.METHOD_POST);
    }


}