import { isBetween, Vec2, Vec2Util, X, Y } from "../util/mathematics";
import LinkPainter from "./LinkPainter";

export default class StraightLineLinkPainter extends LinkPainter {
    drawLinks(g: CanvasRenderingContext2D, getPoint: (uid: number) => Vec2): void {
        const env = this.env;

        // 开始画线
        g.strokeStyle = "#808080";
        g.fillStyle = "#808080";
        g.lineWidth = 1.5;

        for (const sourceNode of Array.from(env.nodes.values())) {
            const sourcePoint = getPoint(sourceNode.uid);
            const outPorts = sourceNode.outPorts.slice();
            if (env.selectedNodeUids.has(sourceNode.uid) && env.virtualDstPos) {
                outPorts.push(-1);
            }

            const sourceNodeRect = (outPorts.length === 0) ? null : env.getNodeRect(sourceNode.uid);

            for (const targetNodeUid of outPorts) {
                const targetPoint = getPoint(targetNodeUid);

                // 跳过无需绘制的情况
                if (Vec2Util.equals(sourcePoint, targetPoint)) continue;

                g.beginPath();
                g.moveTo(...sourcePoint);
                g.lineTo(...targetPoint);
                g.stroke();

                const direction = Vec2Util.minus(targetPoint, sourcePoint);
                // const slope = Vec2Util.slope(targetPoint, sourcePoint); // 斜率
                // const intercept = sourcePoint[Y] - slope * sourcePoint[X]; // 截距

                // const findY = (x: number) => slope * x + intercept;
                // const findX = (y: number) => (y - intercept) / slope;

                const deltaX = targetPoint[X] - sourcePoint[X];
                const deltaY = targetPoint[Y] - sourcePoint[Y];
                const findY = (x: number) => (x - sourcePoint[X]) / deltaX * deltaY + sourcePoint[Y];
                const findX = (y: number) => (y - sourcePoint[Y]) / deltaY * deltaX + sourcePoint[X];

                const targetNodeRect = env.getNodeRect(targetNodeUid);

                let sourceHitPoint = sourcePoint;
                let targetHitPoint = targetPoint;

                {

                    if (sourceNodeRect) {
                        const left = sourceNodeRect.x;
                        const right = sourceNodeRect.x + sourceNodeRect.width;
                        const top = sourceNodeRect.y;
                        const bottom = sourceNodeRect.y + sourceNodeRect.height;


                        // 跳过无需绘制的情况
                        if (isBetween(targetPoint[X], left, right) && isBetween(targetPoint[Y], top, bottom)) continue;

                        const linkAngle = Math.atan2(targetPoint[Y] - sourcePoint[Y], targetPoint[X] - sourcePoint[X]);
                        const absLinkAngle = Math.abs(linkAngle);
                        const rectAngle = Math.abs(Math.atan2(sourceNodeRect.height, sourceNodeRect.width));
                        // console.log(`源：linkAngle = ${(linkAngle/Math.PI).toFixed(2)}π, rectAngle = ${(rectAngle/Math.PI).toFixed(2)}π`)

                        if (absLinkAngle < rectAngle) {
                            // 右边
                            sourceHitPoint = [right, findY(right)];
                        } else if (absLinkAngle >= (Math.PI - rectAngle)) {
                            // 左边
                            sourceHitPoint = [left, findY(left)];
                        } else if (linkAngle < 0) {
                            // 上边
                            sourceHitPoint = [findX(top), top];
                        } else {
                            // 下边
                            sourceHitPoint = [findX(bottom), bottom];
                        }
                    }

                    if (targetNodeRect) {

                        const left = targetNodeRect.x;
                        const right = targetNodeRect.x + targetNodeRect.width;
                        const top = targetNodeRect.y;
                        const bottom = targetNodeRect.y + targetNodeRect.height;

                        // 跳过无需绘制的情况
                        if (isBetween(sourcePoint[X], left, right) && isBetween(sourcePoint[Y], top, bottom)) continue;

                        const linkAngle = Math.atan2(sourcePoint[Y] - targetPoint[Y], sourcePoint[X] - targetPoint[X]);
                        const absLinkAngle = Math.abs(linkAngle);
                        const rectAngle = Math.abs(Math.atan2(targetNodeRect.height, targetNodeRect.width));
                        // console.log(`标：linkAngle = ${(linkAngle/Math.PI).toFixed(2)}π, rectAngle = ${(rectAngle/Math.PI).toFixed(2)}π`)

                        if (absLinkAngle < rectAngle) {
                            // 右边
                            targetHitPoint = [right, findY(right)];
                        } else if (absLinkAngle >= (Math.PI - rectAngle)) {
                            // 左边
                            targetHitPoint = [left, findY(left)];
                        } else if (linkAngle < 0) {
                            // 上边
                            targetHitPoint = [findX(top), top];
                        } else {
                            // 下边
                            targetHitPoint = [findX(bottom), bottom];
                        }
                    }

                }

                this.drawArrow(g, Vec2Util.add(sourceHitPoint, Vec2Util.multiply(Vec2Util.minus(targetHitPoint, sourceHitPoint), 0.5)), Vec2Util.angle(direction));
            }
        }
    }

}