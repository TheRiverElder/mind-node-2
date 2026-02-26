import React, { Component, MouseEvent, ReactNode, RefObject } from 'react';
import './App.css';
import LocalStorageDataPersistence from './components/LocalStorageDataPersistence';
import MindNodeCard from './components/MindNodeCard';
import MindNodeInfo from './components/MindNodeInfo';
import Selector from './components/Selector';
import SSSPDataPersistence from './components/SSSPDataPersistence';
import TextDataPersistence from './components/TextDataPersistence';
import TranditionalDataPersistence from './components/TranditionalDataPersistence';
import { createDefaultNode, loadPool } from './data/DataUtils';
import { LinkPainterId, MindNode, MindNodePool, MindNodePoolEditorContext, MutableMindNode, Rect } from './interfaces';
import BezierCurveLinkPainter from './painter/BezierCurveLinkPainter';
import LinkPainter from './painter/LinkPainter';
import StraightLineLinkPainter from './painter/StraightLineLinkPainter';
import DataPersistence from './persistence/DataPersistence';
import { AutoTool } from './tools/AutoTool';
import { CopyNodeTool } from './tools/CopyNodeTool';
import { CreateNodeTool } from './tools/CreateNodeTool';
import { DragNodeTool } from './tools/DragNodeTool';
import { DragPoolTool } from './tools/DragPoolTool';
import { LinkNodeTool } from './tools/LinkNodeTool';
import { SelectTool } from './tools/SelectTool';
import { STOP_MOUSE_PROPAGATION, warpStopPropagation } from './util/dom';
import { arrayFindOrFirst, NOP } from './util/lang';
import { Vec2Util, Vec2 } from './util/mathematics';
import { get2dContext, getPosition, getRect } from './util/ui';
import { Tool, ToolEvent } from './tools/Tool';
import NavigationBar, { NavigationBarItem } from './components/NavigationBar';

type ToolFlag = 'createNode' | 'linkNode' | 'copyNode' | 'dragNode' | 'dragPool' | 'select' | 'auto';

const TOOL_FLAGS: ToolFlag[] = ['createNode', 'linkNode', 'copyNode', 'dragNode', 'dragPool', 'select', 'auto'];
const TOOL_NAMES = {
    'createNode': "增加",
    'linkNode': "链接",
    'copyNode': "复制",
    'dragNode': "移动",
    'dragPool': "拖动",
    'select': "选择",
    'auto': "自动",
};

interface PersistenceSelection {
    name: string;
    id: string;
    value: typeof Component<any, any, any>;
}

interface LinkPainterSelection {
    name: string;
    id: LinkPainterId;
    value: LinkPainter;
}

interface Message {
    timestamp: number;
    text: string;
    renderType?: 'plain' | 'html',
}

export interface AppProps {

}

export interface AppState {
    uidCounter: number;
    nodes: Array<MindNode>;
    offset: Vec2;
    scaleFactor: number;
    virtualTargetPosition: Vec2 | null;
    editingNodeUid: number | null;
    toolFlag: ToolFlag | null;
    selectionArea: Rect | null;
    lastSavedTime: Date | null;
    persistence: PersistenceSelection;
    linkPainter: LinkPainterSelection;
    messages: Message[];
    dialogContent: ReactNode | null;
}


class App extends Component<AppProps, AppState> implements MindNodePoolEditorContext {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            uidCounter: 0,
            nodes: [],
            offset: [0, 0],
            scaleFactor: 1,
            virtualTargetPosition: null,
            editingNodeUid: null,
            toolFlag: null,
            selectionArea: null,
            lastSavedTime: null,
            persistence: this.persistences[0],
            linkPainter: this.linkPainters[0],
            messages: [],
            dialogContent: null,
        };
    }

    private readonly persistences: PersistenceSelection[] = [
        { name: "SSSP", id: "sssp", value: SSSPDataPersistence },
        { name: "文本", id: "text", value: TextDataPersistence },
        { name: "传统", id: "tranditional", value: TranditionalDataPersistence },
        { name: "浏览器存储", id: "local_storage", value: LocalStorageDataPersistence },
    ];

    private readonly linkPainters: LinkPainterSelection[] = [
        { name: "直线", id: "straight_line", value: new StraightLineLinkPainter(this) },
        { name: "贝塞尔曲线", id: "bezier_curve", value: new BezierCurveLinkPainter(this) },
    ];

    private persistenceRef: RefObject<Component & DataPersistence> = React.createRef() as any;
    private dialogRef: RefObject<HTMLDialogElement> = React.createRef() as any;

    private mounted = false;

    componentDidMount() {
        this.mounted = true;
        this.updateStateNodes();
        this.drawLines();
        window.addEventListener('resize', this.resetView);
        document.addEventListener('keydown', this.onGlobalKeyDown);
        window.addEventListener('keyup', this.onGlobalKeyUp);
        this.resetView();
        this.setTool('auto');
        requestAnimationFrame(this.update);
        this.loadPersistanceConfig();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resetView);
        document.removeEventListener('keydown', this.onGlobalKeyDown);
        window.removeEventListener('keyup', this.onGlobalKeyUp);
        this.mounted = false;
    }

    // componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<AppState>, snapshot?: any): void {
    //     this.drawLines();
    // }

    render() {
        return (
            <div className="App" onContextMenu={e => e.preventDefault()}>
                {/* 顶部工具栏 */}
                {this.renderTopBar()}

                {/* 持久化栏 */}
                {this.renderPersistanceBar()}

                {/* 实际池子 */}
                <div
                    className={"node-pool"}
                    ref={this.poolRef}
                    onMouseDown={this.onMouseDown}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp}
                    onMouseLeave={this.onMouseLeave}
                >
                    <canvas ref={this.canvasRef} />

                    {
                        this.state.nodes.map(it => (
                            <MindNodeCard
                                key={it.uid}
                                anchor={this.getAnchor()}
                                node={it}
                                linking={false}
                                choosen={this.selectedNodeUids.has(it.uid)}
                                editing={this.state.editingNodeUid === it.uid}
                                // onClick={this.onClickNode}
                                onMouseDown={this.onMouseDown}
                                onMouseMove={this.onMouseMove}
                                onMouseUp={this.onMouseUp}
                                onRectUpdate={(uid, rect) => {
                                    this.setNodeRect(uid, rect);
                                    requestAnimationFrame(() => this.drawLines());
                                }}
                                onClickLinkButton={NOP}
                                onClickChooseButton={NOP}
                            />
                        ))
                    }

                    {this.renderSelectionArea()}
                    {this.renderToolButtons()}
                    {this.renderNodeInfo()}
                </div>

                {/* 底部状态栏 */}
                {this.renderBottomBar()}

                {/* 消息图层 */}
                {this.renderMessages()}

                {/* 对话框 */}
                {this.renderDialog()}
            </div>
        );
    }

    onGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "s" && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            this.save();
        }
    }

    onGlobalKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Delete') {
            this.deleteSelectedNodes();
        }
    }

    //#region 渲染

    // 池子UI组件
    private poolRef: RefObject<HTMLDivElement | null> = React.createRef();
    // 连接线的画板UI组件
    private canvasRef: RefObject<HTMLCanvasElement | null> = React.createRef();

    hideNodeInfoView = () => this.setState(() => ({ editingNodeUid: null }));

    drawLines() {
        const canvasAndContext = get2dContext(this.canvasRef);
        if (!canvasAndContext) {
            console.log("Invalid canvas");
            return;
        }
        const [canvas] = canvasAndContext;

        this.state.linkPainter.value.paint(canvas);
        return;
    }

    private topBarItems: Array<NavigationBarItem> = [
        {
            text: '关于',
            onClick: () => this.showAboutMessage(),
        },
        {
            text: '图像',
            onClick: () => this.showDialog(({ close }) => (
                <div>
                    <select>
                        <option>Vanilla 2d</option>
                        <option>Pixi.js</option>
                    </select>
                    <button onClick={() => close()}>确认</button>
                </div>
            )),
        },
    ];

    renderTopBar() {
        return (<NavigationBar items={this.topBarItems} />);
        // return (
        //     <div className="top-bar">
        //         <div onClick={this.showAboutMessage}>关于</div>
        //         <div className='spacer'></div>
        //         <div className='end'><a target="_blank" href="https://icons8.com/icon/86374/edit-pencil">Edit</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a></div>
        //     </div>
        // );
    }

    renderPersistanceBar() {
        return (
            <div className="persistance-bar">
                <button onClick={this.save}>保存</button>
                <button onClick={this.load}>载入</button>
                <span>保存方式：</span>
                <Selector
                    value={this.state.persistence.id}
                    options={this.persistences}
                    getText={o => o.name}
                    getValue={o => o.id}
                    onChange={o => this.setState(() => ({ persistence: o }))}
                />
                <span>连线方式：</span>
                <Selector
                    value={this.state.linkPainter.id}
                    options={this.linkPainters}
                    getText={o => o.name}
                    getValue={o => o.id}
                    onChange={o => {
                        this.setState(() => ({ linkPainter: o }));
                        requestAnimationFrame(() => this.drawLines());
                    }}
                />
                {this.renderPersistence()}
            </div>
        )
    }

    renderPersistence() {
        const Component = this.state.persistence.value;
        return (<Component ref={this.persistenceRef} />);
    }

    renderToolButtons() {
        return (
            <div className="tool-bar">
                {TOOL_FLAGS.map(f => (
                    <button
                        key={f}
                        {...STOP_MOUSE_PROPAGATION}
                        onClick={warpStopPropagation(this.setTool.bind(this, f))}
                        disabled={this.state.toolFlag === f}
                    >{TOOL_NAMES[f]}</button>
                ))}
                <span>|</span>
                <button {...STOP_MOUSE_PROPAGATION} onClick={warpStopPropagation(this.createAndAddNode)}>新增</button>
                <button {...STOP_MOUSE_PROPAGATION} onClick={warpStopPropagation(this.unchooseAllNodes)}>取消选择</button>
                <button {...STOP_MOUSE_PROPAGATION} onClick={warpStopPropagation(this.deleteSelectedNodes)}>删除所选</button>
            </div>
        )
    }

    renderBottomBar() {
        return (
            <div className="bottom-bar">
                <span className="piece">总节点数：{this.state.nodes.length}</span>
                <span className="piece">选中节点数：{this.selectedNodeUids.size}</span>
                <span className="piece">最近保存于：{this.state.lastSavedTime?.toLocaleString() || "未保存"}</span>
                <span className="piece">版本：{__APP_VERSION__}</span>
            </div>
        )
    }

    renderNodeInfo() {
        const editingNode = (this.state.editingNodeUid !== null) ? (this.nodes.get(this.state.editingNodeUid)) : null;
        if (!editingNode) return null;

        return (
            <div className="node-info">
                <button className="icon" onClick={this.hideNodeInfoView}>&gt;</button>
                <MindNodeInfo
                    key={editingNode.uid}
                    node={editingNode}
                    nodes={this.nodes}
                    onUpdate={node => this.modifyNode(node)}
                    context={this}
                />
            </div>
        );
    }

    renderSelectionArea() {
        const { selectionArea } = this.state;
        if (!selectionArea) return null;
        let { x, y, width, height } = selectionArea;
        // let [left, top] = Vec2Util.minus([x, y], this.getPoolFix());
        let [left, top] = [x, y];
        if (width < 0) {
            width = -width;
            left = left - width;
        }
        if (height < 0) {
            height = -height;
            top = top - height;
        }
        return (
            <div
                className="section"
                style={{
                    left: left + 'px',
                    top: top + 'px',
                    width: width + 'px',
                    height: height + 'px',
                }}
            />
        );
    }

    renderMessages() {
        return (
            <div className="messages">
                {this.state.messages.map(({ timestamp, text, renderType = "plain" }) => (
                    renderType === "html" ? (<div className="message" key={timestamp} dangerouslySetInnerHTML={{ __html: text }} />)
                        : (<span className="message" key={timestamp}>{text}</span>)
                ))}
            </div>
        );
    }

    renderDialog() {
        const dialogContent = this.state.dialogContent;
        return (
            <dialog ref={this.dialogRef}>
                {dialogContent}
            </dialog>
        );
    }

    showMessage(text: string, renderType: Message["renderType"] = "plain") {
        const message: Message = {
            timestamp: Date.now(),
            text,
            renderType,
        };
        this.setState(s => {
            const messages = [message].concat(s.messages);
            const maxMessageAmount = 5;
            if (messages.length >= maxMessageAmount) {
                messages.splice(maxMessageAmount, messages.length - maxMessageAmount);
            }
            return { messages };
        });
    }

    //#endregion

    //#region 工具

    get offset() { return this.state.offset; }
    set offset(o) { this.setState(() => ({ offset: o })) }

    get scale() { return this.state.scaleFactor; }
    set scale(s) { this.setState(() => ({ scaleFactor: s })) }

    get selectionArea() { return this.state.selectionArea; }
    set selectionArea(sa) { this.setState(() => ({ selectionArea: sa })) }

    private nodeCardRects: Map<number, Rect> = new Map();
    public selectedNodeUids: Set<number> = new Set();

    getNodeRect(uid: number): Rect | null {
        return this.nodeCardRects.get(uid) || null;
    }

    setNodeRect(uid: number, rect: Rect) {
        this.nodeCardRects.set(uid, rect);
    }

    private tool: Tool | null = null;

    setTool(flag: ToolFlag | null) {
        switch (flag) {
            case 'createNode': this.tool = new CreateNodeTool(this); break;
            case 'linkNode': this.tool = new LinkNodeTool(this); break;
            case 'copyNode': this.tool = new CopyNodeTool(this); break;
            case 'dragNode': this.tool = new DragNodeTool(this); break;
            case 'dragPool': this.tool = new DragPoolTool(this); break;
            case 'select': this.tool = new SelectTool(this); break;
            case 'auto': this.tool = new AutoTool(this); break;
            default: this.tool = null; break;
        }
        this.setState(() => ({ toolFlag: flag }));
    }

    //#endregion

    //#region UI相关

    /*
     * O->A->N
     * ----    :Origin to Anchor: Offset
     *    ---- :Anchor to Node: Position (of node)
     */

    // 原点，应该是pool组件的中心点
    private origin: Vec2 = [0, 0];

    get virtualTargetPosition(): Vec2 | null { return this.state.virtualTargetPosition; }
    set virtualTargetPosition(pos: Vec2) { this.setState({ virtualTargetPosition: pos }); }

    resetView = () => {
        const box = this.poolRef.current?.getBoundingClientRect();
        if (!box) return;


        this.origin = [box.width / 2, box.height / 2];
        const canvas = this.canvasRef.current;
        if (canvas) {
            canvas.width = box.width;
            canvas.height = box.height;
        }
        this.notifyUpdate();
    }

    getAnchor(): Vec2 {
        return Vec2Util.add(this.origin, this.state.offset);
    }

    getPoolFix(): Vec2 {
        return getPosition(getRect(this.poolRef));
    }

    // 是否需要更新
    private dirty: boolean = true;

    notifyUpdate() {
        this.dirty = true;
    }

    update = () => {
        if (!this.mounted) return;
        if (this.dirty) {
            this.updateStateNodes();
            // this.drawLines();
            this.dirty = false;
        }
        requestAnimationFrame(this.update);
    }

    navatageTo(nodeUid: number) {
        // TODO: 根据uid获取节点，然后将屏幕中心移动到该节点处
    }

    //#endregion

    //#region 数据控制

    // 所有节点列表，是实际的数据
    public readonly nodes: Map<number, MindNode> = new Map();

    private uidCounter: number = 0;

    genUid() {
        const uid = this.uidCounter++;
        this.setState(() => ({ uidCounter: this.uidCounter }));
        return uid;
    }

    createAndAddNode = () => {
        const position = Vec2Util.minus([0, 0], this.state.offset);
        this.createNode({ position });
    }

    createNode(data: Readonly<Partial<MutableMindNode>>): number {
        const uid = this.genUid();
        const node = createDefaultNode(uid, data);
        this.nodes.set(node.uid, node);
        this.setState(() => ({ editingNodeUid: node.uid }));
        this.updateStateNodes();
        return uid;
    }

    getAllNodes(): MindNode[] {
        return Array.from(this.nodes.values());
    }

    modifyNode(data: Partial<MutableMindNode> & { readonly uid: MindNode['uid']; }): boolean {
        const node = this.nodes.get(data.uid);
        if (!node) return false;

        Object.assign(node, data);
        this.updateStateNodes();
        return true;
    }

    removeNodeByUid(uid: number): MindNode | null {
        const node = this.nodes.get(uid);
        this.nodes.delete(uid);
        this.nodeCardRects.delete(uid);
        this.selectedNodeUids.delete(uid);
        this.updateStateNodes();

        if (node) {
            for (const targetNodeUid of node.outPorts) {
                const targetNode = this.getNodeByUid(targetNodeUid);
                if (!targetNode) continue;

                this.modifyNode({
                    uid: targetNode.uid,
                    inPorts: targetNode.inPorts.filter(port => port !== targetNodeUid && this.nodes.has(port)),
                });
            }


            for (const sourceNodeUid of node.inPorts) {
                const sourceNode = this.getNodeByUid(sourceNodeUid);
                if (!sourceNode) continue;

                this.modifyNode({
                    uid: sourceNode.uid,
                    outPorts: sourceNode.outPorts.filter(port => port !== sourceNodeUid && this.nodes.has(port)),
                });
            }

        }

        return node ?? null;
    }

    // addNode(node: MindNode) {
    //     this.nodes.set(node.uid, node);
    //     this.setState(() => ({ editingNodeUid: node.uid }));
    //     this.updateStateNodes();
    // }

    // updateNode(node: MindNode) {
    //     this.nodes.set(node.uid, node);
    //     this.updateStateNodes();
    // }

    getNodeByUid(uid: number): MindNode | null {
        return this.nodes.get(uid) ?? null;
    }

    updateStateNodes() {
        this.setState(() => ({ nodes: Array.from(this.nodes.values()) }));
    }

    createLink(sourceNodeUid: number, targetNodeUid: number): boolean {
        const sourceNode = this.getNodeByUid(sourceNodeUid);
        const targetNode = this.getNodeByUid(targetNodeUid);

        if (sourceNode) {
            // 如果之前没有创建过，则创建新的连接
            const sourceOutIndex = sourceNode.outPorts.indexOf(targetNodeUid);
            // 如果target为空，则取消异常的链接
            if (!targetNode && sourceOutIndex >= 0) {
                sourceNode.outPorts.splice(sourceOutIndex, 1);
            } else if (targetNode && sourceOutIndex < 0) {
                sourceNode.outPorts.push(targetNode.uid);
            }
        }

        if (targetNode) {
            // 如果之前没有创建过，则创建新的连接
            const targetInIndex = targetNode.inPorts.indexOf(sourceNodeUid);
            // 如果source为空，则取消异常的链接
            if (!sourceNode && targetInIndex >= 0) {
                targetNode.inPorts.splice(targetInIndex, 1);
            } else if (sourceNode && targetInIndex < 0) {
                targetNode.inPorts.push(sourceNode.uid);
            }
        }


        this.updateStateNodes();
        return true;
    }

    removeLink(sourceNodeUid: number, targetNodeUid: number): boolean {
        // TODO: 移除链接
        const sourceNode = this.getNodeByUid(sourceNodeUid);
        const targetNode = this.getNodeByUid(targetNodeUid);

        if (sourceNode) {
            const sourceOutIndex = sourceNode.outPorts.indexOf(targetNodeUid);
            if (sourceOutIndex >= 0) {
                sourceNode.outPorts.splice(sourceOutIndex, 1);
            }
        }

        if (targetNode) {
            const targetInIndex = targetNode.inPorts.indexOf(sourceNodeUid);
            if (targetInIndex >= 0) {
                targetNode.inPorts.splice(targetInIndex, 1);
            }
        }

        this.updateStateNodes();
        return true;
    }

    searchNodes(options: {
        keyword: string;
        excludingNodeUids?: Set<number>;
        useRegex?: boolean;
    } | string): MindNode[] {
        const {
            keyword,
            excludingNodeUids = new Set(),
            useRegex = true,
        } = typeof options === 'string' ? { keyword: options, useRegex: true } : options;

        const matchesKeyword: (node: MindNode) => boolean = useRegex
            ? (() => {
                const regex = new RegExp(keyword);
                return node => regex.test(node.text)
            })()
            : node => node.text.indexOf(keyword) >= 0;

        return Array.from(this.nodes.values())
            .filter(node => !excludingNodeUids.has(node.uid))
            .filter(matchesKeyword);
    }

    //#endregion

    //#region 鼠标事件

    onClickNode = (event: MouseEvent, uid: number) => {
        this.setState(() => ({ editingNodeUid: uid }));
    }

    private getToolEvent(e: MouseEvent, uid?: number): ToolEvent {
        if (typeof uid === 'number') {
            e.stopPropagation();
        }
        const node = typeof uid === 'number' ? (this.nodes.get(uid) || null) : null;
        const mousePosition = Vec2Util.minus([e.clientX, e.clientY], this.getPoolFix());
        // const mousePosition: Vec2 = [e.clientX, e.clientY];
        return {
            mousePosition,
            node,
            nativeEvent: e,
        };
    }

    private pointerMoving: boolean = false;

    onMouseDown = (e: MouseEvent, uid?: number) => {
        this.pointerMoving = false;
        this.tool?.onStart(this.getToolEvent(e, uid));
        this.notifyUpdate();
    }

    onMouseMove = (e: MouseEvent, uid?: number) => {
        this.pointerMoving = true;
        this.tool?.onMove(this.getToolEvent(e, uid));
        this.notifyUpdate();
    }

    onMouseUp = (e: MouseEvent, uid?: number) => {
        const ev = this.getToolEvent(e, uid);
        if (this.pointerMoving) {
            this.tool?.onMove(ev);
        }
        this.tool?.onEnd(ev);
        this.notifyUpdate();
    }

    onMouseLeave = (e: MouseEvent, uid?: number) => {
        this.onMouseUp(e, uid);
    }

    //#endregion

    //#region 坐标变换

    // 把数据里的坐标转换为在.pool DOM元素种像素为单位的坐标
    pool2pixel(poolCoord: Vec2): Vec2 {
        return Vec2Util.add(poolCoord, this.getAnchor());
    }

    // 在.pool DOM元素种像素为单位的坐标转换为把数据里的坐标
    pixel2pool(pixelCoord: Vec2): Vec2 {
        return Vec2Util.add(Vec2Util.minus(pixelCoord, this.getAnchor()), [-10, -10]);
    }

    //#endregion

    //#region 持久化

    buildPool(): MindNodePool {
        return {
            version: 1,
            linkPainterId: this.state.linkPainter.id,
            uidCounter: this.state.uidCounter,
            offset: this.state.offset,
            scaleFactor: this.state.scaleFactor,
            nodes: Array.from(this.nodes.values()),
        };
    }

    resolveTextDataString(dataString: string) {
        try {
            const raw = JSON.parse(dataString);

            const pool: MindNodePool = loadPool(raw);

            this.nodes.clear();
            this.nodeCardRects.clear();
            this.selectedNodeUids.clear();
            pool.nodes.forEach(it => this.nodes.set(it.uid, it));

            this.setState(() => ({
                uidCounter: pool.uidCounter,
                offset: pool.offset,
                nodes: pool.nodes,
                scaleFactor: pool.scaleFactor,
                linkPainter: arrayFindOrFirst<LinkPainterSelection>(this.linkPainters, (lp) => lp.id === pool.linkPainterId)
            }));
            this.uidCounter = pool.uidCounter;
        } catch (e) {
            this.showMessage('解析数据失败：' + e);
        }
    }

    load = () => {
        const persistence: DataPersistence | null = this.persistenceRef.current;
        if (!persistence) {
            this.showMessage("未指定持久化方案！");
            return;
        }
        this.savePersistanceConfig(this.state.persistence.id, persistence);
        persistence.load()
            .then(dataString => {
                this.showMessage("载入成功！");
                this.resolveTextDataString(dataString);
            }).catch(e => {
                this.showMessage('获取数据失败：' + e);
            });
    }

    save = () => {
        const persistence: DataPersistence | null = this.persistenceRef.current;
        if (!persistence) {
            this.showMessage("未指定持久化方案！");
            return;
        }
        this.savePersistanceConfig(this.state.persistence.id, persistence);
        const pool: MindNodePool = this.buildPool();
        // console.log(pool);
        const lastSavedTime: Date = new Date();
        const dataString = JSON.stringify(pool);
        persistence.save(dataString)
            .then((succeeded) => {
                if (succeeded) {
                    this.showMessage("保存成功！");
                    this.setState(() => ({ lastSavedTime }));
                } else {
                    this.showMessage("保存失败：未知原因");
                }
            }).catch(e => {
                this.showMessage("保存失败：" + e);
            });
    }

    savePersistanceConfig(id: string, persistence: DataPersistence) {
        const config = persistence.makeConfig();
        const key = "MindNode2-persistance_config";
        const value = JSON.stringify({
            id,
            config,
        });

        localStorage.setItem(key, value);
    }

    loadPersistanceConfig() {
        const key = "MindNode2-persistance_config";
        const valueString = localStorage.getItem(key);
        if (!valueString) return;
        try {
            const { id, config } = JSON.parse(valueString);
            const persistence = this.persistences.find(it => it.id === id);
            if (persistence) {
                this.setState(() => ({ persistence }));
                setTimeout(() => {
                    this.persistenceRef.current?.loadConfig(config);
                }, 0);
            }
        } catch (e) {
            console.error(e);
        }
    }

    //#endregion

    //#region 节点选择相关

    get editingNodeUid(): number | null { return this.state.editingNodeUid; }
    set editingNodeUid(value: number | null) {
        this.setState(() => ({ editingNodeUid: value }));
    }

    // setNodeChoosen = (uid: number, value: boolean) => {
    //     if (value) {
    //         this.selectedNodeUids.add(uid);
    //     } else {
    //         this.selectedNodeUids.delete(uid);
    //     }
    //     this.notifyUpdate();
    // };

    unchooseAllNodes = () => {
        this.selectedNodeUids.clear();
        this.notifyUpdate();
    };

    deleteSelectedNodes = () => {
        for (const uid of this.selectedNodeUids) {
            this.removeNodeByUid(uid);
        }
    };

    //#endregion

    //#region 其它

    showAboutMessage = () => {
        this.showMessage(`
            <span>使用图标库：</span>
            <a target="_blank" href="https://icons8.com/icon/86374/edit-pencil">Edit</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
        `, "html")
    };

    private dialogContext: AppDialogContext = {
        close: () => this.closeDialog(),
    };

    showDialog(createDialog: (context: AppDialogContext) => React.ReactNode): void {
        this.setState(() => ({ dialogContent: createDialog(this.dialogContext) }));
        // 当dialog标签被渲染后，再显示
        setTimeout(() => { this.dialogRef.current?.showModal() }, 0);
    }

    closeDialog() {
        this.dialogRef.current?.close();
        this.setState(() => ({ dialogContent: null }));
    }

    //#endregion
}

export default App;


export interface AppDialogContext {
    close: () => void;
}