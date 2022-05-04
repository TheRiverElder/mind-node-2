import React from "react";
import { Component, MouseEvent, RefObject } from "react";
import { Vec2 } from "../util/mathematics";
import "../styles/MindNodeCard.css";
import { MindNode, Rect } from "../interfaces";
import { toClassName } from "../util/javascript-extension";
import { getRect } from "../util/ui";
import RadioButton from "./RadioButton";
import Icon from "./Icon";

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
            }, 
            anchor: [anchorX, anchorY], 
            linking,
            choosen, 
        } = this.props;

        // 实际的坐标
        const fixedX = x + anchorX;
        const fixedY = y + anchorY;
        
        return (
            <div 
                className={ toClassName({ "MindNodeCard": true, linking, choosen }) } 
                ref={ this.selfRef }
                style={{
                    left: `${fixedX}px`,
                    top: `${fixedY}px`,
                }}
                onClick={ e => this.props.onClick(e, uid) }
                onMouseDown={ e => this.props.onMouseDown(e, uid) }
                onMouseMove={ e => this.props.onMouseMove(e, uid) }
                onMouseUp={ e => this.props.onMouseUp(e, uid) }
            >
                <div className="frame" />

                <div className="static" style={{ background }}>
                    <div className="wrapper">
                        <div className="text" style={{ color }}>
                            { text.split("\n").map((it, i) => (<p key={ i }>{ it }</p>)) }
                        </div>
                        
                        <div className="tool-bar">
                            <RadioButton
                                key={ linking ? 11 : 10 }
                                value={ linking }
                                onChange={ () => this.props.onClickLinkButton(uid) }
                            >
                                <Icon name="link" size="80%"/>
                            </RadioButton>
                            
                            <RadioButton
                                key={ choosen ? 1 : 0 }
                                value={ choosen }
                                onChange={ it => this.props.onClickChooseButton(uid, it) }
                            >
                                <Icon name="checked" size="80%"/>
                            </RadioButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    //#region 拖拽相关

    private selfRef: RefObject<HTMLDivElement> = React.createRef();

    //#endregion
}
 
export default MindNodeCard;