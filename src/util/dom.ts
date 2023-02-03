import { BaseSyntheticEvent } from "react";

export const STOP_PROPAGATION = (e: Event | BaseSyntheticEvent) => e.stopPropagation();
export function warpStopPropagation<TEvent extends (Event | BaseSyntheticEvent), TOut = void>(handle: (e: TEvent) => TOut): (e: TEvent) => TOut {
    return e => {
        e.stopPropagation();
        return handle(e);
    };
}

export const STOP_MOUSE_PROPAGATION = {
    onMouseDown: STOP_PROPAGATION,
    onMouseMove: STOP_PROPAGATION,
    onMouseUp: STOP_PROPAGATION,
};