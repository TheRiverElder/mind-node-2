import { getBezierPointAndAngle, Vec2, Vec2Util } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class BezierCurveLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const env = this.env;
        const nodes = env.nodes;
        
        const angleCache = new Map<number, number>();

        function getAngle(uid: number): number {

            // uid < 0 代表这是鼠标的链接预览
            if (uid === -1) return NaN;

            if (angleCache.has(uid)) return angleCache.get(uid) || NaN;

            const nodePosition = getPoint(uid);

            const node = nodes.get(uid);
            if (!node) return NaN;

            const virtualDstPos = env.virtualDstPos;
            const isSelected = env.selectedNodeUids.has(node.uid);

            if (node.inPorts.length === 0 || ((node.outPorts.length) === 0 && !(isSelected && !!virtualDstPos))) {
                angleCache.set(node.uid, NaN);
                return NaN;
            }

            let inRelative: Vec2 = [0, 0];
            for (const inNodeUid of node.inPorts) {
                inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
            }
            inRelative = Vec2Util.normalize(inRelative);

            let outRelative: Vec2 = [0, 0];
            for (const outNodeUid of node.outPorts) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(getPoint(outNodeUid), nodePosition)));
            }
            if (isSelected && !!virtualDstPos) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(virtualDstPos, nodePosition)));
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

                const baseLength = Vec2Util.modulo(Vec2Util.minus(targetPoint, sourcePoint)) / 3;
                const sourceControlHandleLength = isNaN(sourceAngle) ? 0 : baseLength;
                const targetControlHandleLength = isNaN(targetAngle) ? 0 : baseLength;

                const controlPoint1 = Vec2Util.add(sourcePoint, Vec2Util.fromAngle(sourceAngle || 0, sourceControlHandleLength));
                const controlPoint2 = Vec2Util.minus(targetPoint, Vec2Util.fromAngle(targetAngle || 0, targetControlHandleLength));

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