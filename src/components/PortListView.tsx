import { MindNodeLink, MindNodePoolEditorContext } from "../interfaces";
import "../styles/PortListView.css";

export default function PortListView(props: {
    selfUid: number;
    type: "in" | "out";
    list: Array<MindNodeLink>;
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

    return (
        <ol className="PortListView">
            {list.map(link => {
                const nodeUid = type === "in" ? link.source : link.target;
                return (
                    <li key={nodeUid} className="snapshot">
                        <span>{getBrief(nodeUid)}</span>
                        <a onClick={() => context.editingObject = { type: 'link', uid: link.uid }}>编辑</a>
                        <a onClick={() => context.removeLinkByUid(link.uid)}>移除</a>
                        <a onClick={() => context.navagateToNode(nodeUid)}>定位</a>
                    </li>
                );
            })}
        </ol>
    );
}