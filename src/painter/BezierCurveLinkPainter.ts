import { getBezierPointAndAngle, Vec2, Vec2Util } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class BezierCurveLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const env = this.env;
        const nodes = env.nodes;
        
        const angleCache = new Map<number, number>();
        function getAngle(uid: number): number {

            if (angleCache.has(uid)) return angleCache.get(uid) || NaN;

            const nodePosition = getPoint(uid);

            // uid < 0 代表这是鼠标的链接预览
            if (uid === -1) {
                let inRelative: Vec2 = [0, 0];
                for (const inNodeUid of Array.from(env.selectedNodeUids.values())) {
                    inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
                }
                inRelative = Vec2Util.normalize(inRelative);
                const angle = Math.atan2(inRelative[1], inRelative[0]);
                angleCache.set(uid, angle);
                return angle;
            }

            const node = nodes.get(uid);
            if (!node) return NaN;

            let inRelative: Vec2 = [0, 0];
            for (const inNodeUid of node.inPorts) {
                inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
            }
            inRelative = Vec2Util.normalize(inRelative);

            let outRelative: Vec2 = [0, 0];
            for (const outNodeUid of node.outPorts) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(getPoint(outNodeUid), nodePosition)));
            }
            if (env.selectedNodeUids.has(node.uid) && env.virtualDstPos) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(env.virtualDstPos, nodePosition)));
            }
            outRelative = Vec2Util.normalize(outRelative);

            const finalPoint = Vec2Util.add(inRelative, outRelative);
            const angle = Math.atan2(finalPoint[1], finalPoint[0]);

            angleCache.set(node.uid, angle);
            return angle;
        };


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
                const sourceAngle = getAngle(node.uid);
                const targetAngle = getAngle(targetNodeUid);
                if (isNaN(sourceAngle) || isNaN(targetAngle)) continue;

                const controlHandleLength = Vec2Util.modulo(Vec2Util.minus(targetPoint, sourcePoint)) / 3;

                const controlPoint1 = Vec2Util.add(sourcePoint, Vec2Util.fromAngle(sourceAngle, controlHandleLength));
                const controlPoint2 = Vec2Util.minus(targetPoint, Vec2Util.fromAngle(targetAngle, controlHandleLength));

                const controlPoints: Vec2[] = [sourcePoint, controlPoint1, controlPoint2, targetPoint];

                const [centerPoint, centerAngle] = getBezierPointAndAngle(0.55, ...controlPoints);


                g.beginPath();
                g.moveTo(...sourcePoint);
                g.bezierCurveTo(...controlPoint1, ...controlPoint2, ...targetPoint);
                g.stroke();
                this.drawArrow(g, centerPoint, centerAngle);
            }
        }
    }
    
}