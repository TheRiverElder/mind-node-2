import { getBezierPointAndAngle, Vec2, Vec2Util } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class BezierCurveLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const env = this.env;
        const nodes = env.nodes;
        
        const angleCache = new Map<number, [number, number]>(); // [入线的角度, 出线的角度]，NaN代表控制柄长度为0

        function getAngle(uid: number): [number, number] {

            // uid < 0 代表这是鼠标的链接预览
            if (uid === -1) return [NaN, NaN];

            if (angleCache.has(uid)) return angleCache.get(uid) || [NaN, NaN];

            const nodePosition = getPoint(uid);

            const node = nodes.get(uid);
            if (!node) return [NaN, NaN];

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

            const inAngle = Math.atan2(outRelative[1], outRelative[0]);
            const outAngle = Math.atan2(inRelative[1], inRelative[0]);

            const angle: [number, number] = [inAngle, outAngle];

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
                const [, sourceOutAngle] = getAngle(node.uid);
                const [targetInAngle, ] = getAngle(targetNodeUid);
                
                const baseControlHandleLength = Vec2Util.modulo(Vec2Util.minus(targetPoint, sourcePoint)) / 3;
                const sourceOutControlHandleLength = isNaN(sourceOutAngle) ? 0 : baseControlHandleLength;
                const targetInControlHandleLength = isNaN(targetInAngle) ? 0 : baseControlHandleLength;

                const controlPoint1 = Vec2Util.add(sourcePoint, Vec2Util.fromAngle(sourceOutAngle, sourceOutControlHandleLength));
                const controlPoint2 = Vec2Util.minus(targetPoint, Vec2Util.fromAngle(targetInAngle, targetInControlHandleLength));

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