
export type Vec2 = [number, number];
export const X = 0;
export const Y = 1;

export function vec2FromAngle(angle: number, modulo: number = 1): Vec2 {
    if (Number.isNaN(angle)) return [0, 0];
    return [Math.cos(angle) * modulo, Math.sin(angle) * modulo]; 
}

export function vec2Add(...vs: Vec2[]): Vec2 {
    return [vs.reduce((p, v) => p + v[0], 0), vs.reduce((p, v) => p + v[1], 0)];
}

export function vec2Minus(v1: Vec2, v2: Vec2): Vec2 {
    return [v1[X] - v2[X], v1[Y] - v2[Y]];
}

export function vec2Normalize(v: Vec2): Vec2 {
    if (v[0] === 0 && v[1] === 0) return [0, 0];
    const angle = Math.atan2(v[1], v[0]);
    return [Math.cos(angle), Math.sin(angle)];
}

export function vec2Modulo(v: Vec2): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

export function vec2Angle(v: Vec2): number {
    return Math.atan2(v[1], v[0]);
}

export function vec2Multiply(v: Vec2, n: number): Vec2 {
    return [v[0] * n, v[1] * n];
}

export const Vec2Util =  {
    zero(): Vec2 {
        return [0, 0]; 
    },

    unit(): Vec2 {
        return [1, 1]; 
    },

    of(x: number = 0, y: number = 0): Vec2 {
        return [x, y]; 
    },

    fromAngle(angle: number, modulo: number = 1): Vec2 {
        if (Number.isNaN(angle)) return [0, 0];
        return [Math.cos(angle) * modulo, Math.sin(angle) * modulo]; 
    },

    add(...vs: Vec2[]): Vec2 {
        return [vs.reduce((p, v) => p + v[0], 0), vs.reduce((p, v) => p + v[1], 0)];
    },

    minus(v1: Vec2, v2: Vec2): Vec2 {
        return [v1[X] - v2[X], v1[Y] - v2[Y]];
    },
    
    normalize(v: Vec2): Vec2 {
        if (v[0] === 0 && v[1] === 0) return [0, 0];
        const angle = Math.atan2(v[1], v[0]);
        return [Math.cos(angle), Math.sin(angle)];
    },
    
    modulo(v: Vec2): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    },
    
    angle(v: Vec2): number {
        return Math.atan2(v[1], v[0]);
    },
    
    multiply(v: Vec2, n: number): Vec2 {
        return [v[0] * n, v[1] * n];
    },
};


export class UidGenerator {

    public uidCounter: number = 0;

    constructor(uidCounter: number = 0) {
        this.uidCounter = uidCounter;
    }

    generate() {
        return this.uidCounter++;
    }

}

// return [pointPosition, angle]
export function getBezierPointAndAngle(t: number, ...controlPoints: Vec2[]): [Vec2, number] {
    if (controlPoints.length <= 1) return [controlPoints[0], 0];

    let cps: Vec2[] = controlPoints;
    while (cps.length > 2) {
        const nextCPs: Vec2[] = [];
        for (let i = 1; i < cps.length; i++) {
            const [p0X, p0Y] = cps[i - 1];
            const [p1X, p1Y] = cps[i];
            nextCPs.push([p0X + (p1X - p0X) * t, p0Y + (p1Y - p0Y) * t]);
        }
        cps = nextCPs;
    }
    const [finalP0X, finalP0Y] = cps[0];
    const [finalP1X, finalP1Y] = cps[1];
    const deltaX = finalP1X - finalP0X;
    const deltaY = finalP1Y - finalP0Y;
    const finalPoint: Vec2 = [finalP0X + deltaX * t, finalP0Y + deltaY * t];
    const finalAngle = Math.atan2(deltaY, deltaX);
    return [finalPoint, finalAngle];
}