import React from "react";
import { Component, MouseEvent, RefObject } from "react";
import { Vec2 } from "../util/mathematics";
import "../styles/MindNodeCard.css";
import { MindNode, Rect } from "../interfaces";
import { MOUSE_BUTTON_LEFT } from "../constants";
import { toClassName } from "../util/javascript-extension";
import { getRect } from "../util/ui";
import RadioButton from "./RadioButton";

interface MindNodeCardProps {
    anchor: Vec2;
    node: MindNode;
    dragging: boolean;
    linking: boolean;
    choosen: boolean;
    onClick: (uid: number, e: MouseEvent) => void;
    onDragStart: (uid: number, e: MouseEvent) => void;
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
                position: [x, y], 
                text,
            }, 
            anchor: [anchorX, anchorY], 
            dragging,
            linking,
            choosen, 
        } = this.props;

        // 实际的坐标
        const fixedX = x + anchorX;
        const fixedY = y + anchorY;
        
        return (
            <div 
                className={ toClassName({ "MindNodeCard": true, linking, dragging, choosen }) } 
                ref={ this.selfRef }
                style={{
                    left: `${fixedX}px`,
                    top: `${fixedY}px`,
                }}
                onClick={ e => this.props.onClick(this.props.node.uid, e) }
            >
                <div
                    className="handle"
                    onMouseDown={ this.onHandleMouseDown }
                />

                <div className="wrapper">
                    <div className="text">
                        { text.split("\n").map((it, i) => (<p key={ i }>{ it }</p>)) }
                    </div>

                    <div className="tool-bar">
                        <RadioButton
                            key={ linking ? 11 : 10 }
                            value={ linking }
                            onChange={ () => this.props.onClickLinkButton(this.props.node.uid) }
                        >
                            <span>🔗</span>
                        </RadioButton>

                        <RadioButton
                            key={ choosen ? 1 : 0 }
                            value={ choosen }
                            onChange={ it => this.props.onClickChooseButton(this.props.node.uid, it) }
                        >
                            <span>✔</span>
                        </RadioButton>
                    </div>
                </div>
            </div>
        );
    }

    onHandleMouseDown = (e: MouseEvent) => {
        if (e.button === MOUSE_BUTTON_LEFT) {
            e.stopPropagation();
            this.props.onDragStart(this.props.node.uid, e);
        }
    }

    //#region 拖拽相关

    private selfRef: RefObject<HTMLDivElement> = React.createRef();

    //#endregion
}
 
export default MindNodeCard;