import React from "react";
import { Component, MouseEvent, RefObject } from "react";
import { Vec2 } from "../util/mathematics";
import "../styles/MindNodeCard.css";
import { MindNode, Rect } from "../interfaces";
import { toClassName } from "../util/lang";
import { getRect } from "../util/ui";
import { markdown } from "markdown";

interface MindNodeCardProps {
    anchor: Vec2;
    node: MindNode;
    linking: boolean;
    choosen: boolean;
    onClick: (e: MouseEvent, uid: number) => void;
    onMouseDown: (e: MouseEvent, uid: number) => void;
    onMouseMove: (e: MouseEvent, uid: number) => void;
    onMouseUp: (e: MouseEvent, uid: number) => void;
    onRectUpdate: (uid: number, rect: Rect) => void;
    onClickLinkButton: (uid: number) => void;
    onClickChooseButton: (uid: number, choosen: boolean) => void;
}

class MindNodeCard extends Component<MindNodeCardProps> {

    componentDidMount() {
        this.props.onRectUpdate(this.props.node.uid, getRect(this.selfRef));
    }

    componentDidUpdate() {
        this.props.onRectUpdate(this.props.node.uid, getRect(this.selfRef));
    }

    render() {
        const {
            node: {
                uid,
                position: [x, y],
                text,
                background,
                color,
                renderer,
            },
            anchor: [anchorX, anchorY],
            linking,
            choosen,
        } = this.props;

        // 实际的坐标
        const fixedX = x + anchorX;
        const fixedY = y + anchorY;

        this.renderContent(renderer, text);

        return (
            <div
                className={toClassName({ "MindNodeCard": true, linking, choosen })}
                ref={this.selfRef}
                style={{
                    left: `${fixedX}px`,
                    top: `${fixedY}px`,
                }}
                onClick={e => this.props.onClick(e, uid)}
                onMouseDown={e => this.props.onMouseDown(e, uid)}
                onMouseMove={e => this.props.onMouseMove(e, uid)}
                onMouseUp={e => this.props.onMouseUp(e, uid)}
            >
                <div className="frame" />

                <div className="static" style={{ background }}>
                    <div className="wrapper">
                        <div className="text" style={{ color }}>
                            {this.renderContent(renderer, text)}
                        </div>

                        {/* <div className="tool-bar">
                            <RadioButton
                                key={linking ? 11 : 10}
                                value={linking}
                                onChange={() => this.props.onClickLinkButton(uid)}
                            >
                                <Icon name="link" size="80%" />
                            </RadioButton>

                            <RadioButton
                                key={choosen ? 1 : 0}
                                value={choosen}
                                onChange={it => this.props.onClickChooseButton(uid, it)}
                            >
                                <Icon name="checked" size="80%" />
                            </RadioButton>
                        </div> */}
                    </div>
                </div>
            </div>
        );
    }

    private renderContent(renderer: string, text: string) {
        renderer = renderer || "default";

        switch (renderer) {
            case "default": {
                return text.split("\n").map((it, i) => (<p key={i}>{escapeWhiteSpace(it)}</p>)); 
            }
            case "markdown": {
                return (<div dangerouslySetInnerHTML={{ __html: this.renderMarkdown(text) }} />);
            }
            default: return text;
        } 
        
    }

    private renderMarkdown(text: string): string {
        const html = markdown.toHTML(text);
        return html;
    }

    //#region 拖拽相关

    private selfRef: RefObject<HTMLDivElement | null> = React.createRef();

    //#endregion
    
}

export default MindNodeCard;

function escapeWhiteSpace(text: string): string {
    return text.replace(/ /g, "\u00a0");
}