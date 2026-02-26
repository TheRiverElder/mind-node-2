import { Component } from "react";
import { MindNodeLink } from "../interfaces";
import "../styles/MindNodeLinkInfo.css";
import { STOP_PROPAGATION } from "../util/dom";
import { MindNodePoolEditorContext } from "../interfaces";
import "../styles/MindNodeLinkInfo.css";

interface MindNodeLinkInfoProps {
    link: MindNodeLink;
    onUpdate: (data: Partial<MindNodeLink> & { uid: MindNodeLink['uid'] }) => void;
    context: MindNodePoolEditorContext;
}

interface MindNodeLinkInfoState {
    inputingColor: string;
    inputingText: string;
}

class MindNodeLinkInfo extends Component<MindNodeLinkInfoProps, MindNodeLinkInfoState> {
    constructor(props: MindNodeLinkInfoProps) {
        super(props);
        this.state = {
            inputingColor: props.link.color,
            inputingText: props.link.text,
        };
    }
    render() {
        const context = this.props.context;
        const { uid } = this.props.link;

        const link = context.getLinkByUid(uid);
        if (!link) return null;

        const { source, target } = link;

        return (
            <div
                className="MindNodeLinkInfo"
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

                    <div className="field-color">
                        <span className="title">线条样式：</span>
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

                    <div>
                        <span className="title">起点</span>
                        <div key={source} className="snapshot">
                            <span>{this.getBrief(source)}</span>
                            <a onClick={() => context.navagateToNode(source)}>定位</a>
                        </div>
                        <span className="title">目标</span>
                        <div key={target} className="snapshot">
                            <span>{this.getBrief(target)}</span>
                            <a onClick={() => context.navagateToNode(target)}>定位</a>
                        </div>
                    </div>

                    <div>
                        <span className="title">文字：</span>
                        <textarea
                            className="text-input"
                            onKeyUp={e => e.stopPropagation()}
                            value={this.state.inputingText}
                            onChange={e => this.setText(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    setText(text: string) {
        this.setState(() => ({ inputingText: text }));
        const data = { uid: this.props.link.uid, text };console.log(data);
        this.props.onUpdate(data);
    }

    setColor(color: string) {
        this.setState(() => ({ inputingColor: color }));
        const data = { uid: this.props.link.uid, color };
        this.props.onUpdate(data);
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

export default MindNodeLinkInfo;