import { Rect } from "../interfaces";
import { Vec2 } from "../util/mathematics";
import Curve from "./Curve";

// y = slope * x + inception, x 包含于 domain
export default class StrightLineCurve implements Curve {

    constructor(
        public readonly slope: number, // 斜率
        public readonly inception: number, // 截距
        public readonly domain: [number, number], // 定义域
    ) { }

    draw(g: CanvasRenderingContext2D): void {
        throw new Error("Method not implemented.");
    }

    findIntercectionPointsWithRect(rect: Rect): Array<Vec2> {
        throw new Error("Method not implemented.");
    }

}