import { RefObject } from "react";
import { Rect } from "../interfaces";
import { Vec2 } from "./mathematics";

export function get2dContext(ref: RefObject<HTMLCanvasElement>): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
    const canvas = ref.current;
    if (!canvas) return null;
    const context = canvas.getContext('2d');
    if (!context) return null;
    return [canvas, context];
}

export function getRect<T extends HTMLElement>(ref: RefObject<T>): Rect {
    const box = ref.current?.getBoundingClientRect();
    return {
        x: box?.x || 0,
        y: box?.y || 0,
        width: box?.width || 0,
        height: box?.height || 0,
    };
}

export function getPosition(rect?: Rect): Vec2 {
    return [rect?.x || 0, rect?.y || 0];
}