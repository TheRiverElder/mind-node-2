
export type Vec2 = [number, number];
export const X = 0;
export const Y = 1;

export function vec2Add(v1: Vec2, v2: Vec2): Vec2 {
    return [v1[X] + v2[X], v1[Y] + v2[Y]];
}

export function vec2Minus(v1: Vec2, v2: Vec2): Vec2 {
    return [v1[X] - v2[X], v1[Y] - v2[Y]];
}

export class UidGenerator {

    public uidCounter: number = 0;

    constructor(uidCounter: number = 0) {
        this.uidCounter = uidCounter;
    }

    generate() {
        return this.uidCounter++;
    }

}