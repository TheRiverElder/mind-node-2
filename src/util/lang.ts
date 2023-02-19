
// 将一个对象转换成className字符串
export function toClassName(obj: { [key: string]: (boolean | string) }): string {
    const arr: Array<string> = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const element = obj[key];
            if (typeof element === 'string') {
                arr.push(element);
            } else {
                if (element) {
                    arr.push(key);
                }
            }
        }
    }
    return arr.join(' ');
}

export function getMapValue<K, V>(map: Map<K, V>, key: K, handler: (value: V, key: K) => void) {
    const value = map.get(key);
    if (value) {
        handler(value, key);
    }
}

export function filterSet<T>(set: Set<T>, filterFn: (e: T) => boolean): Set<T> {
    const r: T[] = [];
    set.forEach(it => {
        if (filterFn(it)) {
            r.push(it);
        }
    });
    return new Set(r);
}

export function equalsArray<T>(a1: Array<T>, a2: Array<T>): boolean {
    if (a1.length !== a2.length) return false;
    for (let index = 0; index < a1.length; index++) {
        if (a1[index] !== a2[index]) return false;
    }
    return true;
}

export function arrayFilterNonNull<T, E = T | undefined | null>(array: Array<E>): Array<T> {
    return array.filter(e => e || (e !== null && e !== undefined)) as any;
}

export const NOP = () => {};

export function arrayFindOrFirst<E>(array: Array<E>, predicate: (element: E) => boolean): E {
    if (array.length === 0) throw new Error("Array must have at least one element!");
    return array.find(predicate) || array[0];
}
