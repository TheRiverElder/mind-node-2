import { Component } from "react";
import { MindNode } from "../interfaces";
import "../styles/MindNodeInfo.css";
import { STOP_PROPAGATION } from "../util/dom";

interface MindNodeInfoProps {
    node: MindNode;
    nodes: Map<number, MindNode>;
    onUpdate: (node: MindNode) => void;
}

interface MindNodeInfoState {
    inputingBackground: string;
    inputingColor: string;
    inputingText: string;
}

class MindNodeInfo extends Component<MindNodeInfoProps, MindNodeInfoState> {
    constructor(props: MindNodeInfoProps) {
        super(props);
        this.state = {
            inputingBackground: props.node.background,
            inputingColor: props.node.color,
            inputingText: props.node.text,
        };
    }
    render() {
        const { uid, position, outPorts, inPorts } = this.props.node;
        return (
            <div 
                className="MindNodeInfo"
                onMouseDown={STOP_PROPAGATION}
                onMouseMove={STOP_PROPAGATION}
                onMouseUp={STOP_PROPAGATION}
            >
                <div className="top-bar"></div>

                <div className="content">
                    <p>
                        <span className="title">UID：</span>
                        <span className="text">#{uid}</span>
                    </p>

                    <p>
                        <span className="title">位置：</span>
                        <span className="text">({position.map(it => it.toFixed(1)).join(", ")})</span>
                    </p>

                    <p className="field-color">
                        <span className="title">背景样式：</span>
                        <input
                            className="color-input"
                            value={this.state.inputingBackground}
                            onChange={e => this.setBackground(e.target.value)}
                        />
                        <div className="color-input-preview" style={{ background: this.state.inputingBackground }} />
                    </p>

                    <p className="field-color">
                        <span className="title">文字样式：</span>
                        <input
                            className="color-input"
                            value={this.state.inputingColor}
                            onChange={e => this.setColor(e.target.value)}
                        />
                        <div className="color-input-preview" style={{ background: this.state.inputingColor }} />
                    </p>

                    <p>
                        <span className="title">内容：</span>
                        <textarea
                            className="text-input"
                            value={this.state.inputingText}
                            onChange={e => this.setText(e.target.value)}
                        />
                    </p>

                    <p className="title">出线（{outPorts.length}个）：</p>
                    <ol className="text">
                        {outPorts.map(uid => (<li key={uid} className="snapshot">{this.getBrief(uid)}</li>))}
                    </ol>

                    <p className="title">入线（{inPorts.length}个）：</p>
                    <ol className="text">
                        {inPorts.map(uid => (<li key={uid} className="snapshot">{this.getBrief(uid)}</li>))}
                    </ol>
                </div>
            </div>
        );
    }

    setText(text: string) {
        this.setState(() => ({ inputingText: text }));
        const node: MindNode = { ...this.props.node, text };
        this.props.onUpdate(node);
    }

    setBackground(background: string) {
        this.setState(() => ({ inputingBackground: background }));
        const node: MindNode = { ...this.props.node, background };
        this.props.onUpdate(node);
    }

    setColor(color: string) {
        this.setState(() => ({ inputingColor: color }));
        const node: MindNode = { ...this.props.node, color };
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