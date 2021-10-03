import { Component } from "react";
import { MindNode } from "../interfaces";

interface MindNodeInfoProps {
    node: MindNode;
    nodes: Map<number, MindNode>;
    onUpdate: (node: MindNode) => void;
}
 
interface MindNodeInfoState {
    inputingText: string;
}
 
class MindNodeInfo extends Component<MindNodeInfoProps, MindNodeInfoState> {
    constructor(props: MindNodeInfoProps) {
        super(props);
        this.state = {
            inputingText: props.node.text,
        };
    }
    render() { 
        const { uid, position, outPorts, inPorts } = this.props.node;
        return (
            <div>
                <p>UID：#{ uid }</p>
                <p>位置：({ position.join(", ") })</p>
                <textarea
                    value={ this.state.inputingText }
                    onChange={ e => this.setText(e.target.value) }
                />

                <p>出线（{outPorts.length}）：</p>
                <ol>
                    { outPorts.map(uid => (<li key={ uid }>{ this.getBrief(uid) }</li>)) }
                </ol>

                <p>入线（{inPorts.length}）：</p>
                <ol>
                    { inPorts.map(uid => (<li key={ uid }>{ this.getBrief(uid) }</li>)) }
                </ol>
            </div>
        );
    }

    setText(text: string) {
        this.setState(() => ({ inputingText: text }));
        const node: MindNode = {
            ...this.props.node,
            text,
        };
        this.props.onUpdate(node);
    }

    getBrief = (uid: number) => {
        const node = this.props.nodes.get(uid);
        if (node) {
            return '#' + uid + '：' + node.text;
        } else {
            return '#' + uid;
        }
    }
}
 
export default MindNodeInfo;