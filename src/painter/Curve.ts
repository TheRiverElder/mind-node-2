import { Rect } from "../interfaces";
import { Vec2 } from "../util/mathematics";

export default interface Curve {

    draw(g: CanvasRenderingContext2D): void;

    findIntercectionPointsWithRect(rect: Rect): Array<Vec2>;
}