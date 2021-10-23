import { Component } from "react";
import { MindNode } from "../interfaces";
import "../styles/MindNodeInfo.css";

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
            <div className="MindNodeInfo">
                <div className="top-bar"></div>

                <div className="content">
                    <p>
                        <span className="title">UID：</span>
                        <span className="text">#{ uid }</span>
                    </p>
                    <p>
                        <span className="title">位置：</span>
                        <span className="text">({ position.join(", ") })</span>
                    </p>

                    <p><span className="title">内容：</span></p>
                    <textarea
                        value={ this.state.inputingText }
                        onChange={ e => this.setText(e.target.value) }
                    />

                    <p className="title">出线（{outPorts.length}个）：</p>
                    <ol className="text">
                        { outPorts.map(uid => (<li key={ uid } className="snapshot">{ this.getBrief(uid) }</li>)) }
                    </ol>

                    <p className="title">入线（{inPorts.length}个）：</p>
                    <ol className="text">
                        { inPorts.map(uid => (<li key={ uid } className="snapshot">{ this.getBrief(uid) }</li>)) }
                    </ol>
                </div>
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