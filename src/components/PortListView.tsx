import { MindNodePoolEditorContext } from "../interfaces";
import "../styles/PortListView.css";
import { Vec2Util } from "../util/mathematics";

export default function PortListView(props: {
    selfUid: number;
    type: "in" | "out";
    list: Array<number>;
    context: MindNodePoolEditorContext;
}) {

    const { selfUid, type, list, context } = props;

    function getBrief(uid: number) {
        const node = context.getNodeByUid(uid);
        if (node) {
            const maxLength = 50;
            const text = node.text;
            return '#' + uid + '：' + (text.length > maxLength ? (text.slice(0, maxLength) + '...') : text);
        } else {
            return '#' + uid;
        }
    }

    function removeLink(uid: number) {
        if (uid === selfUid) return; // 不能删除自己
        switch (type) {
            case "in":
                context.removeLink(uid, selfUid);
                break;
            case "out":
                context.removeLink(selfUid, uid);
                break;
        }
    }

    function navagateToNode(uid: number) {
        const node = context.getNodeByUid(uid);
        const rect = context.getNodeRect(uid);
        if (node) {
            let offset = Vec2Util.multiply(node.position, -1);
            if (rect) {
                offset = Vec2Util.minus(offset, [rect.width / 2, rect.height / 2]);
            } else {
                offset = Vec2Util.minus(offset, [50, 20]);
            }
            context.offset = offset;
        }
    }

    return (
        <ol className="PortListView">
            {list.map(uid => (
                <li key={uid} className="snapshot">
                    <span>{getBrief(uid)}</span>
                    <a onClick={() => removeLink(uid)}>取消</a>
                    <a onClick={() => navagateToNode(uid)}>定位</a>
                </li>
            ))}
        </ol>
    );
}