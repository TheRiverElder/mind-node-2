

export interface SSSPJsonResponseBody<T = undefined> {
    succeeded: boolean;
    errorMessage?: string;
    data?: T;
}

export interface ItemInformationCache {
    path: string;
    isFile: boolean;
    isDirectory: boolean;
    fileSize: number;
    lastModifiedTime: number;
}

export interface DirectoryInformationCache {
    path: string;
    children: Array<ChildInformationCache>;
}

export interface ChildInformationCache {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}