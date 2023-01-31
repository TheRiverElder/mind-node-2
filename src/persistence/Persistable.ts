export interface Persistable {
    load(dataString: string): void;
    save(): string;
}