import { getBezierPointAndAngle, Vec2, Vec2Util } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class BezierCurveLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const context = this.context;
        const nodes = context.getAllNodes();

        const angleCache = new Map<number, number>();

        function getAngle(uid: number): number {

            // uid < 0 代表这是鼠标的链接预览
            if (uid === -1) return NaN;

            if (angleCache.has(uid)) return angleCache.get(uid) || NaN;

            const nodePosition = getPoint(uid);

            const node = context.getNodeByUid(uid);
            if (!node) return NaN;

            const inPorts = new Set(node.inPorts);
            const outPorts = new Set(node.outPorts);

            const validInPorts = node.inPorts.filter(u => !outPorts.has(u));
            const validOutPorts = node.outPorts.filter(u => !inPorts.has(u));

            const virtualTargetPosition = context.virtualTargetPosition;
            const isSelected = context.selectedNodeUids.has(node.uid);

            if (validInPorts.length === 0 || ((validOutPorts.length) === 0 && !(isSelected && !!virtualTargetPosition))) {
                angleCache.set(node.uid, NaN);
                return NaN;
            }

            let inRelative: Vec2 = [0, 0];
            for (const inNodeUid of validInPorts) {
                inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
            }
            inRelative = Vec2Util.normalize(inRelative);

            let outRelative: Vec2 = [0, 0];
            for (const outNodeUid of validOutPorts) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(getPoint(outNodeUid), nodePosition)));
            }
            if (isSelected && !!virtualTargetPosition) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(virtualTargetPosition, nodePosition)));
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

        for (const sourceNode of context.getAllNodes()) {
            const sourcePoint = getPoint(sourceNode.uid);
            const outPorts = sourceNode.outPorts.slice();
            if (context.selectedNodeUids.has(sourceNode.uid) && context.virtualTargetPosition !== null) {
                outPorts.push(-1);
            }

            for (const targetNodeUid of outPorts) {

                const targetPoint = getPoint(targetNodeUid);
                const sourceAngle = getAngle(sourceNode.uid);
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