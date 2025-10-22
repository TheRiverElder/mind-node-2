import { MindNodePoolEditorContext } from "../interfaces";
import "../styles/PortListView.css";

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
            return '#' + uid + '：' + node.text;
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
        if (node) {
            context.offset = node.position;
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