import { MindNodePoolEditorContext } from "../interfaces";
import { Vec2, Vec2Util, X, Y } from "../util/mathematics";
import { Painter } from "./Painter";

export default abstract class LinkPainter implements Painter  {

    protected readonly context: MindNodePoolEditorContext;

    constructor(context: MindNodePoolEditorContext) {
        this.context = context;
    }
    

    paint(canvas: HTMLCanvasElement): void {
        const g = canvas.getContext("2d");
        if (!g) {
            console.log("Invalid canvas");
            return;
        }

        const context = this.context;

        g.clearRect(0, 0, canvas.width, canvas.height);
        // const anchor = this.getAnchor();
        // 修正量，是画布的client位置
        const fix: Vec2 = context.getPoolFix();

        const pointCache = new Map<number, Vec2>();
        function getPoint(uid: number): Vec2 {
            const cachedPoint = pointCache.get(uid);
            if (cachedPoint) return cachedPoint;

            if (uid === -1) {
                // const point = Vec2Util.minus(env.virtualTargetPosition ?? [0, 0], fix);
                const point = context.virtualTargetPosition ?? [0, 0];
                pointCache.set(uid, point);
                return point;
            }

            const rect = context.getNodeRect(uid);
            if (rect) {
                // const point = Vec2Util.add(Vec2Util.minus([rect.x, rect.y], fix), [rect.width / 2, rect.height / 2]);
                const point = Vec2Util.add([rect.x, rect.y], [rect.width / 2, rect.height / 2]);
                pointCache.set(uid, point);
                return point;
            }
            return [0, 0];
        };

        this.drawLinks(g, getPoint.bind(this));
    }

    abstract drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void;

    protected drawArrow(g: CanvasRenderingContext2D, position: Vec2, angle: number) {
        g.beginPath();
        g.moveTo(...Vec2Util.add(position, Vec2Util.fromAngle(angle, g.lineWidth * 3)));
        g.lineTo(...Vec2Util.add(position, Vec2Util.fromAngle(angle + 0.8 * Math.PI, g.lineWidth * 3)));
        g.lineTo(...Vec2Util.add(position, Vec2Util.fromAngle(angle - 0.8 * Math.PI, g.lineWidth * 3)));
        g.fill();
    }

    protected drawText(g: CanvasRenderingContext2D, position: Vec2, text: string) {
        const textMatrics = g.measureText(text);
        g.fillText(text, position[X] - textMatrics.width / 2, position[Y] - textMatrics.hangingBaseline);
    }
    
}