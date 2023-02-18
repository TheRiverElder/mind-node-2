
// 适配不同版本，将其转化到其它版本
export interface DataAdapter<TSource = any, TTarget = any> {
    get sourceVersion(): number;
    get targetVersion(): number;
    adapt(source: TSource): TTarget;
}