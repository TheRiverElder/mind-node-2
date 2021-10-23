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