export default interface DataPersistence {
    load(): Promise<string>;
    save(dataString: string): Promise<boolean>;
}