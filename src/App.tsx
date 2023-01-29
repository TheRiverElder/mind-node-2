import React, { Component, MouseEvent, RefObject } from 'react';
import './App.css';
import MindNodeCard from './components/MindNodeCard';
import MindNodeInfo from './components/MindNodeInfo';
import { createNode, loadPool, unlinkNodes } from './core';
import { MindNode, MindNodePool, Rect } from './interfaces';
import { SimpleStorageClient } from './sssp-api/SimpleStorageClient';
import { AutoTool } from './tools/AutoTool';
import { CopyNodeTool } from './tools/CopyNodeTool';
import { CreateNodeTool } from './tools/CreateNodeTool';
import { DragNodeTool } from './tools/DragNodeTool';
import { DragPoolTool } from './tools/DragPoolTool';
import { LinkNodeTool } from './tools/LinkNodeTool';
import { SelectTool } from './tools/SelectTool';
import { Tool, ToolEnv, ToolEvent } from './tools/Tool';
import { arrayFilterNonNull, NOP } from './util/lang';
import { getBezierPointAndAngle, Vec2Util, Vec2 } from './util/mathematics';
import { get2dContext, getPosition, getRect } from './util/ui';

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

export interface AppProps {

}

export interface AppState {
    uidCounter: number;
    nodes: Array<MindNode>;
    offset: Vec2;
    scale: number;
    editingNodeUid: number | null;
    toolFlag: ToolFlag | null;
    selectionArea: Rect | null;
    dataString: string;
    lastSavedTime: Date | null;
}


class App extends Component<AppProps, AppState> implements ToolEnv {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            uidCounter: 0,
            nodes: [],
            offset: [0, 0],
            scale: 1,
            editingNodeUid: null,
            toolFlag: null,
            selectionArea: null,
            dataString: '',
            lastSavedTime: null,
        };
    }

    private mounted = false;

    componentDidMount() {
        this.mounted = true;
        this.updateStateNodes();
        this.drawLines();
        window.addEventListener('resize', this.resetView);
        document.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.resetView();
        this.setTool('auto');
        requestAnimationFrame(this.update);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resetView);
        document.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.mounted = false;
    }

    render() {
        return (
            <div className="App" onContextMenu={e => e.preventDefault()}>
                {/* 顶部工具栏 */}
                {this.renderTopBar()}

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
                                onClick={this.onClickNode}
                                onMouseDown={this.onMouseDown}
                                onMouseMove={this.onMouseMove}
                                onMouseUp={this.onMouseUp}
                                onRectUpdate={(uid, rect) => this.setNodeRect(uid, rect)}
                                onClickLinkButton={NOP}
                                onClickChooseButton={NOP}
                            />
                        ))
                    }

                    {this.renderSelectionArea()}

                    {this.renderNodeInfo()}
                </div>

                {/* 底部状态栏 */}
                {this.renderBottomBar()}
            </div>
        );
    }

    onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "s" && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            this.save();
        }
    }

    onKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Delete') {
            this.deleteSelectedNodes();
        }
    }

    //#region 渲染

    // 池子UI组件
    private poolRef: RefObject<HTMLDivElement> = React.createRef();
    // 连接线的画板UI组件
    private canvasRef: RefObject<HTMLCanvasElement> = React.createRef();

    public virtualDstPos: Vec2 | null = null;

    hideNodeInfoView = () => this.setState(() => ({ editingNodeUid: null }));

    drawLines() {
        // console.log("this.virtualDstPos", this.virtualDstPos)
        // console.log("drawLines");
        const canvasAndContext = get2dContext(this.canvasRef);
        if (!canvasAndContext) {
            console.log("Invalid canvas");
            return;
        }
        const [canvas, g] = canvasAndContext;

        g.clearRect(0, 0, canvas.width, canvas.height);
        // 开始画线
        g.strokeStyle = "#808080";
        g.fillStyle = "#808080";
        g.lineWidth = 1.5;
        // const anchor = this.getAnchor();
        // 修正量，是画布的client位置
        const fix: Vec2 = this.getPoolFix();

        const pointCache = new Map<number, Vec2>();
        const getPoint: (uid: number) => Vec2 = (uid: number) => {
            const cachedPoint = pointCache.get(uid);
            if (cachedPoint) return cachedPoint;

            if (uid === -1) {
                const point = Vec2Util.minus(this.virtualDstPos || [0, 0], fix);
                pointCache.set(uid, point);
                return point;
            }

            const rect = this.nodeCardRects.get(uid);
            if (rect) {
                const point = Vec2Util.add(Vec2Util.minus([rect.x, rect.y], fix), [rect.width / 2, rect.height / 2]);
                pointCache.set(uid, point);
                return point;
            }
            return [0, 0];
        };

        const nodes = this.nodes;
        const angleCache = new Map<number, number>();
        const getAngle: (uid: number) => number = (uid: number) => {

            if (angleCache.has(uid)) return angleCache.get(uid) || NaN;

            const nodePosition = getPoint(uid);

            if (uid === -1) {
                let inRelative: Vec2 = [0, 0];
                for (const inNodeUid of Array.from(this.selectedNodeUids.values())) {
                    inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
                }
                inRelative = Vec2Util.normalize(inRelative);
                const angle = Math.atan2(inRelative[1], inRelative[0]);
                angleCache.set(uid, angle);
                return angle;
            }

            const node = nodes.get(uid);
            if (!node) return NaN;

            let inRelative: Vec2 = [0, 0];
            for (const inNodeUid of node.inPorts) {
                inRelative = Vec2Util.add(inRelative, Vec2Util.normalize(Vec2Util.minus(nodePosition, getPoint(inNodeUid))));
            }
            inRelative = Vec2Util.normalize(inRelative);

            let outRelative: Vec2 = [0, 0];
            for (const outNodeUid of node.outPorts) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(getPoint(outNodeUid), nodePosition)));
            }
            if (this.selectedNodeUids.has(node.uid) && this.virtualDstPos) {
                outRelative = Vec2Util.add(outRelative, Vec2Util.normalize(Vec2Util.minus(this.virtualDstPos, nodePosition)));
            }
            outRelative = Vec2Util.normalize(outRelative);

            const finalPoint = Vec2Util.add(inRelative, outRelative);
            const angle = Math.atan2(finalPoint[1], finalPoint[0]);

            angleCache.set(node.uid, angle);
            return angle;
        };

        for (const node of Array.from(this.nodes.values())) {
            const sourcePoint = getPoint(node.uid);
            const outPorts = node.outPorts.slice();
            if (this.selectedNodeUids.has(node.uid) && this.virtualDstPos) {
                outPorts.push(-1);
            }

            for (const targetNodeUid of outPorts) {

                const targetPoint = getPoint(targetNodeUid);
                const sourceAngle = getAngle(node.uid);
                const targetAngle = getAngle(targetNodeUid);
                if (isNaN(sourceAngle) || isNaN(targetAngle)) continue;

                const controlHandleLength = Vec2Util.modulo(Vec2Util.minus(targetPoint, sourcePoint)) / 3;

                const controlPoint1 = Vec2Util.add(sourcePoint, Vec2Util.fromAngle(sourceAngle, controlHandleLength));
                const controlPoint2 = Vec2Util.minus(targetPoint, Vec2Util.fromAngle(targetAngle, controlHandleLength));

                const controlPoints: Vec2[] = [sourcePoint, controlPoint1, controlPoint2, targetPoint];

                const [centerPoint, centerAngle] = getBezierPointAndAngle(0.55, ...controlPoints);


                g.beginPath();
                g.moveTo(...sourcePoint);
                g.bezierCurveTo(...controlPoint1, ...controlPoint2, ...targetPoint);
                g.stroke();
                g.beginPath();
                g.moveTo(...Vec2Util.add(centerPoint, Vec2Util.fromAngle(centerAngle, g.lineWidth * 3)));
                g.lineTo(...Vec2Util.add(centerPoint, Vec2Util.fromAngle(centerAngle + 0.8 * Math.PI, g.lineWidth * 3)));
                g.lineTo(...Vec2Util.add(centerPoint, Vec2Util.fromAngle(centerAngle - 0.8 * Math.PI, g.lineWidth * 3)));
                g.fill();
            }
        }
    }

    renderTopBar() {
        return (
            <div className="top-bar">
                <button onClick={this.createAndAddNode}>新增</button>
                <button onClick={this.save}>保存</button>
                <button onClick={this.load}>载入</button>
                <button onClick={this.unchooseAllNodes}>取消选择</button>
                <button onClick={this.deleteSelectedNodes}>删除所选</button>
                {TOOL_FLAGS.map(f => (
                    <button
                        key={f}
                        onClick={this.setTool.bind(this, f)}
                        disabled={this.state.toolFlag === f}
                    >{TOOL_NAMES[f]}</button>
                ))}
                <textarea
                    value={this.state.dataString}
                    placeholder="在此输入/输出数据"
                    onChange={e => this.setState(() => ({ dataString: e.target.value }))}
                />
            </div>
        )
    }

    renderBottomBar() {
        return (
            <div className="bottom-bar">
                <span className="piece">总节点数：{this.state.nodes.length}</span>
                <span className="piece">选中节点数：{this.selectedNodeUids.size}</span>
                <span className="piece">最近保存于：{this.state.lastSavedTime?.toLocaleString() || "未保存"}</span>
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
                    onUpdate={node => this.updateNode(node)}
                />
            </div>
        );
    }

    renderSelectionArea() {
        const { selectionArea } = this.state;
        if (!selectionArea) return null;
        let { x, y, width, height } = selectionArea;
        let [left, top] = Vec2Util.minus([x, y], this.getPoolFix());
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

    //#endregion

    //#region 工具

    get offset() { return this.state.offset; }
    set offset(o) { this.setState(() => ({ offset: o })) }

    get scale() { return this.state.scale; }
    set scale(s) { this.setState(() => ({ scale: s })) }

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
            this.drawLines();
            this.dirty = false;
        }
        requestAnimationFrame(this.update);
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
        const node: MindNode = createNode({ uid: this.genUid(), position: Vec2Util.minus([0, 0], this.state.offset) });
        this.addNode(node);
    }

    addNode(node: MindNode) {
        this.nodes.set(node.uid, node);
        this.updateStateNodes();
    }

    updateNode(node: MindNode) {
        this.nodes.set(node.uid, node);
        this.updateStateNodes();
    }

    removeNode(uid: number) {
        this.nodes.delete(uid);
        this.nodeCardRects.delete(uid);
        this.selectedNodeUids.delete(uid);
        this.updateStateNodes();
    }

    updateStateNodes() {
        this.setState(() => ({ nodes: Array.from(this.nodes.values()) }));
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
        // const mousePosition = Vec2.minus([e.clientX, e.clientY], this.getPoolFix());
        const mousePosition: Vec2 = [e.clientX, e.clientY];
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
        return Vec2Util.minus(Vec2Util.minus(pixelCoord, this.getAnchor()), this.getPoolFix());
    }

    //#endregion

    //#region 持久化

    buildPool(): MindNodePool {
        return {
            uidCounter: this.state.uidCounter,
            offset: this.state.offset,
            scale: this.state.scale,
            nodes: Array.from(this.nodes.values()),
        };
    }

    load = () => {
        try {
            const baseUrl = new URL(this.state.dataString);
            const client: SimpleStorageClient = new SimpleStorageClient(baseUrl);
            client.getText()
                .then(dataString => this.resolveTextDataString(dataString))
                .catch(e => {
                    alert('获取数据失败！');
                    console.error('load data failed', e);
                });
            return;
        } catch (e) { }
        this.resolveTextDataString(this.state.dataString);
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
                scale: pool.scale,
            }));
            this.uidCounter = pool.uidCounter;
        } catch (e) {
            alert('解析数据失败！');
        }
    }

    save = () => {
        const pool: MindNodePool = this.buildPool();
        // console.log(pool);
        const lastSavedTime: Date = new Date(); 
        const dataString = JSON.stringify(pool);
        try {
            const baseUrl = new URL(this.state.dataString);
            const client: SimpleStorageClient = new SimpleStorageClient(baseUrl);
            client.add(dataString)
                .then(body => {
                    if (!body.succeeded) {
                        console.error("Save by SSSP failed:", body.errorMessage);
                        this.setState(() => ({ dataString, lastSavedTime }));
                    } else {
                        console.log("Save by SSSP succeeded.");
                        this.setState(() => ({ lastSavedTime }));
                    }
                }).catch(e => {
                    console.error("Save by SSSP failed (fetch error):", e);
                    this.setState(() => ({ dataString, lastSavedTime }));
                });
            return;
        } catch (e) { }
        console.error("Save by SSSP failed. Saving to text.");
        this.setState(() => ({ dataString, lastSavedTime }));
    }

    //#endregion

    //#region 节点选择相关

    setNodeChoosen = (uid: number, value: boolean) => {
        if (value) {
            this.selectedNodeUids.add(uid);
        } else {
            this.selectedNodeUids.delete(uid);
        }
        this.notifyUpdate();
    }

    unchooseAllNodes = () => {
        this.selectedNodeUids.clear();
        this.notifyUpdate();
    }

    deleteSelectedNodes = () => {
        this.selectedNodeUids.forEach(uid => {
            this.nodeCardRects.delete(uid);
            const node = this.nodes.get(uid);
            if (node) {
                this.nodes.delete(uid);
                arrayFilterNonNull<MindNode>(node.outPorts.map(ou => this.nodes.get(ou))).forEach(dst => unlinkNodes(node, dst));
                arrayFilterNonNull<MindNode>(node.inPorts.map(iu => this.nodes.get(iu))).forEach(src => unlinkNodes(src, node));
            }
        });
        this.selectedNodeUids.clear();
        this.notifyUpdate();
    }

    //#endregion
}

export default App;
