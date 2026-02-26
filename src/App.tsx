import React, { Component, MouseEvent, ReactNode, RefObject } from 'react';
import './App.css';
import MindNodeCard from './components/MindNodeCard';
import MindNodeInfo from './components/MindNodeInfo';
import { createDefaultNode, loadPool } from './data/DataUtils';
import { EditingObject, LinkPainterId, MindNode, MindNodeLink, MindNodePool, MindNodePoolEditorContext, MutableMindNode, Rect } from './interfaces';
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
import MindNodeLinkInfo from './components/MindNodeLinkInfo';
import FileSavingSettingsView, { getDefaultPersistenceSelection, getAllPersistences, PersistenceSelection } from './components/FileSavingSettingsView';

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
    editingObject: EditingObject | null;
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
            editingObject: null,
            toolFlag: null,
            selectionArea: null,
            lastSavedTime: null,
            persistence: getDefaultPersistenceSelection(),
            linkPainter: this.linkPainters[0],
            messages: [],
            dialogContent: null,
        };
    }

    private readonly linkPainters: LinkPainterSelection[] = [
        { name: "直线", id: "straight_line", value: new StraightLineLinkPainter(this) },
        { name: "贝塞尔曲线", id: "bezier_curve", value: new BezierCurveLinkPainter(this) },
    ];

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
        this.loadPersistenceConfig();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resetView);
        document.removeEventListener('keydown', this.onGlobalKeyDown);
        window.removeEventListener('keyup', this.onGlobalKeyUp);
        this.mounted = false;
    }

    render() {
        return (
            <div className="App" onContextMenu={e => e.preventDefault()}>
                {/* 顶部工具栏 */}
                {this.renderNavigationBar()}

                {/* 持久化栏 */}
                {/* {this.renderPersistenceBar()} */}

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
                                editing={this.state.editingObject?.type === "node" && this.state.editingObject?.uid === it.uid}
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
                    {this.renderInfoPanel()}
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

    hideInfoPanel = () => this.setState(() => ({ editingObject: null }));

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
            text: '文件',
            children: [
                {
                    text: '数据持久化设置',
                    onClick: () => this.showDialog(({ close }) => (
                        <div>
                            <FileSavingSettingsView
                                value={this.state.persistence}
                                onChange={p => this.setState({ persistence: p })}
                                onSave={this.save}
                                onLoad={this.load}
                            />
                            <div>
                                <button onClick={() => close()}>返回</button>
                            </div>
                        </div>
                    )),
                },
            ],
        },
        {
            text: '图像',
            children: [
                {
                    text: '线条样式',
                    children: [
                        { text: '直线', onClick: () => this.setState({ linkPainter: this.linkPainters[0] }) },
                        { text: '贝塞尔曲线', onClick: () => this.setState({ linkPainter: this.linkPainters[1] }) },
                    ],
                },
                {
                    text: '设置连线渲染器（未实现）',
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
            ],
        },
        {
            text: '关于',
            onClick: () => this.showAboutMessage(),
        },
    ];

    renderNavigationBar() {
        return (<NavigationBar items={this.topBarItems} />);
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
                <button {...STOP_MOUSE_PROPAGATION} onClick={warpStopPropagation(this.save)}>保存</button>
                <button {...STOP_MOUSE_PROPAGATION} onClick={warpStopPropagation(this.load)}>重新载入</button>
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

    renderInfoPanel() {
        if (!this.state.editingObject) return null;

        const { type, uid } = this.state.editingObject;

        let content = null;
        switch (type) {
            case "node": {
                const node = this.nodes.get(uid);
                if (!node) break;
                content = node && (
                    <MindNodeInfo
                        key={uid}
                        node={node}
                        onUpdate={data => this.modifyNode(data)}
                        context={this}
                    />
                );
                break;
            }
            case "link": {
                const link = this.links.get(uid);
                if (!link) break;
                content = (
                    <MindNodeLinkInfo
                        key={uid}
                        link={link}
                        onUpdate={data => this.modifyLink(data)}
                        context={this}
                    />
                );
                break;
            }
        }

        if (!content) return null;

        return (
            <div className="node-info">
                <button className="icon" onClick={this.hideInfoPanel}>&gt;</button>
                {content}
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

    navagateToNode(uid: number) {
        const node = this.getNodeByUid(uid);
        const rect = this.getNodeRect(uid);
        if (node) {
            let offset = Vec2Util.multiply(node.position, -1);
            if (rect) {
                offset = Vec2Util.minus(offset, [rect.width / 2, rect.height / 2]);
            } else {
                offset = Vec2Util.minus(offset, [50, 20]);
            }
            this.offset = offset;
        }
    }

    //#endregion

    //#region 数据控制

    // 所有节点列表，是实际的数据
    public readonly nodes: Map<number, MindNode> = new Map();
    public readonly links: Map<number, MindNodeLink> = new Map();

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
        this.setState(() => ({ editingObject: { type: 'node', uid } }));
        this.updateStateNodes();
        return uid;
    }

    getAllNodes(): MindNode[] {
        return Array.from(this.nodes.values());
    }

    getAllLinks(): MindNodeLink[] {
        return Array.from(this.links.values());
    }

    modifyNode(data: Partial<MutableMindNode> & { readonly uid: MindNode['uid']; }): boolean {
        const node = this.nodes.get(data.uid);
        if (!node) return false;

        Object.assign(node, data);
        this.updateStateNodes();
        return true;
    }

    modifyLink(data: Partial<MindNodeLink> & { readonly uid: MindNodeLink['uid']; }): boolean {
        const link = this.links.get(data.uid);
        if (!link) return false;

        Object.assign(link, data);
        this.updateStateNodes();
        return true;
    }

    // 这个方法不会触发连接的更新
    removeNodeDirectly(uid: number): MindNode | null {
        const node = this.nodes.get(uid);
        this.nodes.delete(uid);
        this.nodeCardRects.delete(uid);
        this.selectedNodeUids.delete(uid);
        this.updateStateNodes();

        return node ?? null;
    }

    removeNodeByUid(uid: number): MindNode | null {
        const node = this.removeNodeDirectly(uid);
        if (node) {
            // 删除所有从该节点出发或到达该节点的链接
            for (const link of this.links.values()) {
                if (link.source === uid || link.target === uid) {
                    this.removeLinkDirectly(link.uid);
                }
            }
        }
        return node;
    }

    // 这个方法不会触发节点的更新
    removeLinkDirectly(uid: number): MindNodeLink | null {
        const link = this.links.get(uid);
        this.links.delete(uid);
        return link ?? null;
    }

    removeLinkByUid(uid: number): MindNodeLink | null {
        const link = this.removeLinkDirectly(uid);
        if (link) {
            this.removeNodeDirectly(link?.source);
            this.removeNodeDirectly(link?.target);
        }
        return link;
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

    getLinkByUid(uid: number): MindNodeLink | null {
        return this.links.get(uid) ?? null;
    }

    getLinksOfSource(sourceNodeUid: number): MindNodeLink[] {
        const links = [];
        for (const link of this.links.values()) {
            if (link.source === sourceNodeUid) {
                links.push(link);
            }
        }
        return links;
    }

    getLinksOfTarget(targetNodeUid: number): MindNodeLink[] {
        const links = [];
        for (const link of this.links.values()) {
            if (link.target === targetNodeUid) {
                links.push(link);
            }
        }
        return links;
    }

    getLinkBetween(sourceNodeUid: number, targetNodeUid: number): MindNodeLink | null {
        const sourceLinks = this.getLinksOfSource(sourceNodeUid);
        for (const link of sourceLinks) {
            if (link.target === targetNodeUid) return link;
        }
        return null;
    }

    updateStateNodes() {
        this.setState(() => ({ nodes: Array.from(this.nodes.values()) }));
    }

    createLink(sourceNodeUid: number, targetNodeUid: number): MindNodeLink | null {
        if (sourceNodeUid === targetNodeUid) return null;
        if (!this.getNodeByUid(sourceNodeUid) || !this.getNodeByUid(targetNodeUid)) return null;

        const existingLink = this.getLinkBetween(sourceNodeUid, targetNodeUid);
        if (existingLink) return existingLink;

        const link: MindNodeLink = {
            uid: this.genUid(),
            source: sourceNodeUid,
            target: targetNodeUid,
            color: '#808080',
            text: '',
        };

        this.links.set(link.uid, link);

        this.updateStateNodes();

        return link;
    }

    removeLink(sourceNodeUid: number, targetNodeUid: number): MindNodeLink | null {
        const link = this.getLinkBetween(sourceNodeUid, targetNodeUid);
        if (!link) return null;

        this.links.delete(link.uid);

        this.updateStateNodes();
        return link;
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
        this.setState(() => ({ editingObject: { type: 'node', uid } }));
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
            version: 2,
            linkPainterId: this.state.linkPainter.id,
            uidCounter: this.state.uidCounter,
            offset: this.state.offset,
            scaleFactor: this.state.scaleFactor,
            nodes: Array.from(this.nodes.values()),
            links: Array.from(this.links.values()),
        };
    }

    resolveTextDataString(dataString: string) {
        try {
            const raw = JSON.parse(dataString);

            const pool: MindNodePool = loadPool(raw);

            this.nodes.clear();
            this.links.clear();
            this.nodeCardRects.clear();
            this.selectedNodeUids.clear();
            pool.nodes.forEach(it => this.nodes.set(it.uid, it));
            pool.links.forEach(it => this.links.set(it.uid, it));

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
        const persistence: DataPersistence | null = this.state.persistence.value;
        if (!persistence) {
            this.showMessage("未指定持久化方案！");
            return;
        }
        this.savePersistenceConfig(this.state.persistence.id, persistence);
        persistence.load()
            .then(dataString => {
                this.showMessage("载入成功！");
                this.resolveTextDataString(dataString);
            }).catch(e => {
                this.showMessage('获取数据失败：' + e);
            });
    }

    save = () => {
        const persistence: DataPersistence | null = this.state.persistence.value;
        if (!persistence) {
            this.showMessage("未指定持久化方案！");
            return;
        }
        this.savePersistenceConfig(this.state.persistence.id, persistence);
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

    savePersistenceConfig(id: string, persistence: DataPersistence) {
        const config = persistence.makeConfig();
        const key = "MindNode2-persistence_config";
        const value = JSON.stringify({
            id,
            config,
        });

        localStorage.setItem(key, value);
    }

    loadPersistenceConfig() {
        const key = "MindNode2-persistence_config";
        const valueString = localStorage.getItem(key);
        if (!valueString) return;
        try {
            const { id, config } = JSON.parse(valueString);
            const persistence = getAllPersistences().find(it => it.id === id);
            if (persistence) {
                this.setState(() => ({ persistence }));
                setTimeout(() => {
                    this.state.persistence.value?.loadConfig(config);
                }, 0);
            }
        } catch (e) {
            console.error(e);
        }
    }

    //#endregion

    //#region 节点选择相关

    get editingObject(): EditingObject | null { return this.state.editingObject; }
    set editingObject(editingObject: EditingObject | null) {
        this.setState(() => ({ editingObject }));
    }

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