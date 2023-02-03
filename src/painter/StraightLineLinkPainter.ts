import { Vec2, Vec2Util } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class StraightLineLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const env = this.env;

        // 开始画线
        g.strokeStyle = "#808080";
        g.fillStyle = "#808080";
        g.lineWidth = 1.5;

        for (const node of Array.from(env.nodes.values())) {
            const sourcePoint = getPoint(node.uid);
            const outPorts = node.outPorts.slice();
            if (env.selectedNodeUids.has(node.uid) && env.virtualDstPos) {
                outPorts.push(-1);
            }

            for (const targetNodeUid of outPorts) {
                const targetPoint = getPoint(targetNodeUid);

                g.beginPath();
                g.moveTo(...sourcePoint);
                g.lineTo(...targetPoint);
                g.stroke();

                const direction = Vec2Util.minus(targetPoint, sourcePoint);
                this.drawArrow(g, Vec2Util.add(sourcePoint, Vec2Util.multiply(direction, 0.55)), Vec2Util.angle(direction));
            }
        }
    }

}