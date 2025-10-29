
export default interface DataPersistence {
    load(): Promise<string>;
    save(dataString: string): Promise<boolean>;
    makeConfig(): any;
    loadConfig(config: any): boolean;
}