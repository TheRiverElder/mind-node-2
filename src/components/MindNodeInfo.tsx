import { Component } from "react";
import { MindNode } from "../interfaces";
import "../styles/MindNodeInfo.css";
import { STOP_PROPAGATION } from "../util/dom";
import PortListView from "./PortListView";
import { MindNodePoolEditorContext } from "../interfaces";

interface MindNodeInfoProps {
    node: MindNode;
    onUpdate: (node: MindNode) => void;
    context: MindNodePoolEditorContext;
}

interface MindNodeInfoState {
    inputingBackground: string;
    inputingColor: string;
    inputingRenderer: string;
    inputingText: string;
}

class MindNodeInfo extends Component<MindNodeInfoProps, MindNodeInfoState> {
    constructor(props: MindNodeInfoProps) {
        super(props);
        this.state = {
            inputingBackground: props.node.background,
            inputingColor: props.node.color,
            inputingRenderer: props.node.renderer ?? "",
            inputingText: props.node.text,
        };
    }
    render() {
        const context = this.props.context;
        const { uid, position } = this.props.node;

        const inPorts = context.getLinksOfTarget(uid);
        const outPorts = context.getLinksOfSource(uid);

        return (
            <div
                className="MindNodeInfo"
                onMouseDown={STOP_PROPAGATION}
                onMouseMove={STOP_PROPAGATION}
                onMouseUp={STOP_PROPAGATION}
            >
                <div className="top-bar"></div>

                <div className="content">
                    <div>
                        <span className="title">UID：</span>
                        <span className="text">#{uid}</span>
                    </div>

                    <div>
                        <span className="title">位置：</span>
                        <span className="text">({position.map((it: number) => it.toFixed(1)).join(", ")})</span>
                    </div>

                    <div className="field-color">
                        <span className="title">背景样式：</span>
                        <input
                            className="color-input"
                            value={this.state.inputingBackground}
                            onChange={e => this.setBackground(e.target.value)}
                        />
                        <input
                            className="color-picker"
                            type="color"
                            value={this.state.inputingBackground}
                            onChange={e => this.setBackground(e.target.value)}
                        />
                    </div>

                    <div className="field-color">
                        <span className="title">文字样式：</span>
                        <input
                            className="color-input"
                            value={this.state.inputingColor}
                            onChange={e => this.setColor(e.target.value)}
                        />
                        <input
                            className="color-picker"
                            type="color"
                            value={this.state.inputingColor}
                            onChange={e => this.setColor(e.target.value)}
                        />
                    </div>

                    <div className="field-color">
                        <span className="title">渲染器：</span>
                        <select
                            value={this.state.inputingRenderer}
                            onChange={e => this.setRenderer(e.target.value)}
                        >
                            <option value={"default"}>default</option>
                            <option value={"markdown"}>markdown</option>
                        </select>
                    </div>

                    <div>
                        <span className="title">内容：</span>
                        <textarea
                            className="text-input"
                            onKeyUp={e => e.stopPropagation()}
                            value={this.state.inputingText}
                            onChange={e => this.setText(e.target.value)}
                        />
                    </div>

                    {/* TODO: 能搜索节点并手动添加出线和入线，以免有些节点太远连不到 */}
                    <div className="title">出线（{outPorts.length}个）：</div>
                    <PortListView
                        selfUid={uid}
                        list={outPorts}
                        type="out"
                        context={context}
                    />

                    <div className="title">入线（{inPorts.length}个）：</div>
                    <PortListView
                        selfUid={uid}
                        list={inPorts}
                        type="in"
                        context={context}
                    />
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

    setRenderer(renderer: string) {
        this.setState(() => ({ inputingRenderer: renderer }));
        const node: MindNode = { ...this.props.node, renderer };
        this.props.onUpdate(node);
    }

    getBrief = (uid: number) => {
        const node = this.props.context.getNodeByUid(uid);
        if (node) {
            return '#' + uid + '：' + node.text;
        } else {
            return '#' + uid;
        }
    }
}

export default MindNodeInfo;