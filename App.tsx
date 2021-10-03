import React, { Component, MouseEvent, RefObject } from 'react';
import './App.css';
import MindNodeCard from './components/MindNodeCard';
import MindNodeInfo from './components/MindNodeInfo';
import { MOUSE_BUTTON_LEFT, MOUSE_BUTTON_MIDDLE } from './constants';
import { MindNode, MindNodePool, Rect } from './interfaces';
import { getMapValue } from './util/javascript-extension';
import { UidGenerator, Vec2, vec2Add, vec2Minus, X, Y } from './util/mathematics';
import { get2dContext, getPosition, getRect } from './util/ui';

export interface AppProps {

}

export interface AppState {
    nodes: Array<MindNode>;
    offset: Vec2;
    editingNodeUid: number | null;
    mouseState: 'dragNode' | 'dragPool' | 'chooseNodes' | null; 
    section: Rect | null;
    dataString: string;
}


class App extends Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            nodes: [],
            offset: [0, 0],
            editingNodeUid: null,
            mouseState: null,
            section: null,
            dataString: '',
        };
    }

    componentDidMount() {
        this.updateStateNodes();
        this.drawLines();
        window.addEventListener('resize', this.resetView);
        this.resetView();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resetView);
    }

    componentDidUpdate() {
        this.drawLines();
    }

    render() {
        return (
            <div className="App" >
                {/* 顶部工具栏 */}
                { this.renderTopBar() }

                {/* 实际池子 */}
                <div 
                    className={ "node-pool" + (this.draggingNodeStartPositions.size ? " dragging" : "")}
                    ref={ this.poolRef }
                    onMouseDown={ this.onMouseDown }
                    onMouseMove={ this.onMouseMove }
                    onMouseUp={ this.onMouseUp }
                    onMouseLeave={ this.onMouseLeave }
                >
                    <canvas ref={ this.canvasRef } />

                    {
                        this.state.nodes.map(it => (
                            <MindNodeCard
                                key={ it.uid }
                                anchor={ this.getAnchor() }
                                node={ it }
                                linking={ this.linkingNodeUid === it.uid }
                                choosen={ this.choosenNodeUids.has(it.uid) }
                                dragging={ this.draggingNodeStartPositions.has(it.uid) }
                                onClick={ this.onClickNode }
                                onDragStart={ this.onDragNodeStart }
                                onRectUpdate={ (uid, rect) => this.nodeCardRects.set(uid, rect) }
                                onClickLinkButton={ (uid) => this.linkNode(uid) }
                                onClickChooseButton={ this.setNodeChoosen }
                            />
                        ))
                    }

                    { this.renderSection() }
                    
                    { this.renderNodeInfo() }
                </div>

                {/* 底部状态栏 */}
                { this.renderBottomBar() }
            </div>
        );
    }

    // 每个节点卡片的矩形信息，仅保存运行时的UI信息，位置与尺寸
    private readonly nodeCardRects: Map<number, Rect> = new Map();
    // 所有节点列表，是实际的数据
    private readonly nodes: Map<number, MindNode> = new Map();

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
        this.forceUpdate();
    }

    getAnchor(): Vec2 {
        return vec2Add(this.origin, this.state.offset);
    }

    getPoolFix(): Vec2 {
        return getPosition(getRect(this.poolRef));
    }
    
    // 池子UI组件
    private poolRef: RefObject<HTMLDivElement> = React.createRef();
    // 连接线的画板UI组件
    private canvasRef: RefObject<HTMLCanvasElement> = React.createRef();

    hideNodeInfoView = () => this.setState(() => ({ editingNodeUid: null }));

    drawLines() {
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
        g.fillStyle = "#000000";
        g.lineWidth = 3;
        // const anchor = this.getAnchor();
        // 修正量，是画布的client位置
        const fix: Vec2 = this.getPoolFix();

        function getPoint(rect?: Rect): Vec2 {
            if (rect) {
                const { x, y, width, height } = rect;
                const primative: Vec2 = [x + width / 2, y + height / 2];
                return vec2Minus(primative, fix);
            }
            return [0, 0];
        }
        for (const node of Array.from(this.nodes.values())) {
            const sourcePoint = getPoint(this.nodeCardRects.get(node.uid));
            for (const portUid of node.outPorts) {
                const targetNode = this.nodes.get(portUid);
                if (!targetNode) continue;

                const targetPoint = getPoint(this.nodeCardRects.get(targetNode.uid));

                g.beginPath();
                g.moveTo(...sourcePoint);
                g.lineTo(...targetPoint);
                g.stroke();
            }
        }
    }

    renderTopBar() {
        return (
            <div className="top-bar">
                <button onClick={ this.createNode }>新增</button>
                <button onClick={ this.save }>保存</button>
                <button onClick={ this.load }>载入</button>
                <button onClick={ this.unchooseAllNodes }>取消选择</button>
                <textarea
                    value={ this.state.dataString }
                    placeholder="在此输入/输出数据"
                    onChange={ e => this.setState(() => ({ dataString: e.target.value })) }
                />
            </div>
        )
    }

    renderBottomBar() {
        return (
            <div className="bottom-bar">
                <span className="piece">总节点数：{ this.state.nodes.length }</span>
                <span className="piece">选中节点数：{ this.choosenNodeUids.size }</span>
            </div>
        )
    }

    renderNodeInfo() {
        const editingNode = (this.state.editingNodeUid !== null) ? (this.nodes.get(this.state.editingNodeUid)) : null;
        if (!editingNode) return null;

        return (
            <div className="node-info">
                <button className="icon" onClick={ this.hideNodeInfoView }>&gt;</button>
                <MindNodeInfo
                    key={ editingNode.uid }
                    node={ editingNode }
                    nodes={ this.nodes }
                    onUpdate={ node => this.updateNode(node) }
                />
            </div>
        );
    }

    renderSection() {
        const { section } = this.state;
        return section ? (
            <div 
                className="section"
                style={{
                    left: section.x + 'px',
                    top: section.y + 'px',
                    width: section.width + 'px',
                    height: section.height + 'px',
                }}
            />
        ) : null
    }

    //#endregion

    //#region 数据控制

    private uidGenerator: UidGenerator = new UidGenerator();

    createNode = () => {
        const uid = this.uidGenerator.generate();
        const node: MindNode = {
            uid,
            position: vec2Minus([0, 0], this.state.offset),
            text: `#${uid}`,
            outPorts: [],
            inPorts: [],
        };

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
        this.choosenNodeUids.delete(uid);
        this.draggingNodeStartPositions.delete(uid);
        this.updateStateNodes();
    }

    updateStateNodes() {
        this.setState(() => ({ nodes: Array.from(this.nodes.values()) }));
    }

    // 正在连接的节点UID
    private linkingNodeUid: number | null = null;

    linkNode(uid: number) {
        const targetNode = this.nodes.get(uid);
        if (!targetNode) return;
        if (this.linkingNodeUid !== null) {
            if (this.linkingNodeUid !== targetNode.uid) {
                const sourceNode = this.nodes.get(this.linkingNodeUid);
                if (sourceNode && targetNode) {
                    const outPorts = new Set(sourceNode.outPorts);
                    const inPorts = new Set(targetNode.inPorts);
                    if (outPorts.has(targetNode.uid)) {
                        outPorts.delete(targetNode.uid);
                        inPorts.delete(sourceNode.uid);
                    } else {
                        outPorts.add(targetNode.uid);
                        inPorts.add(sourceNode.uid);
                    }
                    sourceNode.outPorts = Array.from(outPorts);
                    targetNode.inPorts = Array.from(inPorts);
                    this.updateStateNodes();
                }
            }
            this.linkingNodeUid = null;
        } else {
            this.linkingNodeUid = targetNode.uid;
        }
    }

    //#endregion

    //#region 鼠标事件

    onClickNode = (uid: number, event: MouseEvent) => {
        if (event.ctrlKey) {
            this.toggleChooseNode(uid);
        } else {
            this.setState(() => ({ editingNodeUid: uid }));
        }
    }

    onMouseDown = (e: MouseEvent) => {
        if (!!this.state.mouseState) return;

        if (e.nativeEvent.button === MOUSE_BUTTON_LEFT) {
            this.onSectionChooseStart(e);
        } else if (e.nativeEvent.button === MOUSE_BUTTON_MIDDLE) {
            this.onDragPoolStart(e);
        }
    }

    onMouseMove = (e: MouseEvent) => {
        if (!this.state.mouseState) return;

        if (this.state.mouseState === 'dragNode') {
            this.onDragNodeMove(e);
        } else if (this.state.mouseState === 'dragPool') {
            this.onDragPool(e);
        } else if (this.state.mouseState === 'chooseNodes') {
            this.onSectionChooseMove(e);
        }
    }

    onMouseUp = (e: MouseEvent) => {
        if (!this.state.mouseState) return;

        if (this.state.mouseState === 'dragNode') {
            this.onDragNodeMove(e);
            this.onDragNodeEnd(e);
        } else if (this.state.mouseState === 'dragPool') {
            this.onDragPoolEnd(e);
        } else if (this.state.mouseState === 'chooseNodes') {
            this.onSectionChooseEnd(e);
        }
    }

    onMouseLeave = (e: MouseEvent) => {
        this.onMouseUp(e);
    }

    //#endregion

    //#region 拖动节点相关

    // 正在拖动的节点的UID列表
    private readonly draggingNodeStartPositions: Map<number, Vec2> = new Map();
    // 开始拖动时的鼠标相对屏幕的绝对位置
    private dragNodeStartMousePosition: Vec2 = [0, 0];

    onDragNodeStart = (uid: number, e: MouseEvent) => {
        this.setState(() => ({ mouseState: 'dragNode' }));
        this.dragNodeStartMousePosition = [e.screenX, e.screenY];

        [
            uid,
            ...Array.from(this.choosenNodeUids)
        ].forEach(uid => getMapValue(this.nodes, uid, node => this.draggingNodeStartPositions.set(uid, node.position)));
    }

    onDragNodeMove = (e: MouseEvent) => {
        if (this.draggingNodeStartPositions.size) {
            // console.log("onMouseDrag")
            const mousePosition: Vec2 = [e.screenX, e.screenY];
            const deltaMousePosition: Vec2 = vec2Minus(mousePosition, this.dragNodeStartMousePosition);

            for (const [uid, draggingNodeStartPosition] of Array.from(this.draggingNodeStartPositions.entries())) {
                const newNodePosition = vec2Add(draggingNodeStartPosition, deltaMousePosition);
                getMapValue(this.nodes, uid, node => 
                    this.updateNode({ 
                        ...node, 
                        position: newNodePosition,
                    })
                );
            }
            this.updateStateNodes();
        }
    }

    onDragNodeEnd = (e: MouseEvent) => {
        if (this.draggingNodeStartPositions.size) {
            // console.log("onMouseDrop")
            this.draggingNodeStartPositions.clear();
            this.updateStateNodes();
        }
        this.setState(() => ({ mouseState: null }));
    }

    //#endregion

    //#region 拖动节点池相关

    private dragPoolStartOffset: Vec2 = [0, 0];
    private dragPoolStartMousePosition: Vec2 = [0, 0];
    onDragPoolStart(e: MouseEvent) {
        // console.log("onDragPoolStart");
        this.setState(() => ({ mouseState: 'dragPool' }));
        this.dragPoolStartOffset = this.state.offset;
        this.dragPoolStartMousePosition = [e.screenX, e.screenY];
    }
    
    onDragPool(e: MouseEvent) {
        e.stopPropagation();
        const mousePosition: Vec2 = [e.screenX, e.screenY];
        const deltaOffset = vec2Minus(mousePosition, this.dragPoolStartMousePosition);
        this.setState(() => ({ offset: vec2Add(this.dragPoolStartOffset, deltaOffset) }));
    }
    
    onDragPoolEnd(e: MouseEvent) {
        this.onDragPool(e);
        this.setState(() => ({ mouseState: null }));
    }

    //#endregion

    //#region 持久化

    buildPool(): MindNodePool {
        return {
            offset: this.state.offset,
            nodes: Array.from(this.nodes.values()),
        };
    }

    load = () => {
        try {
            const pool: MindNodePool = JSON.parse(this.state.dataString);

            this.nodes.clear();
            this.nodeCardRects.clear();
            this.draggingNodeStartPositions.clear();
            this.choosenNodeUids.clear();
            pool.nodes.forEach(it => this.nodes.set(it.uid, it));

            this.setState(() => ({
                offset: pool.offset,
                nodes: pool.nodes,
            }));
        } catch (e) {
            alert('解析数据失败！');
        }
    }

    save = () => {
        const pool: MindNodePool = this.buildPool();
        this.setState(() => ({ dataString: JSON.stringify(pool) }));
        console.log(pool);
    }

    //#endregion

    //#region 节点选择相关

    // 被选中的节点UID列表
    private choosenNodeUids: Set<number> = new Set();

    toggleChooseNode(uid: number) {
        if (this.choosenNodeUids.has(uid)) {
            this.unchooseNode(uid);
        } else {
            this.chooseNode(uid);
        }
    }

    setNodeChoosen = (uid: number, value: boolean) => {
        console.log("setNodeChoosen", uid, value);
        
        if (value) {
            this.chooseNode(uid);
        } else {
            this.unchooseNode(uid);
        }
    }

    chooseNode(uid: number) {
        this.choosenNodeUids.add(uid);
        this.forceUpdate();
    }

    unchooseNode(uid: number) {
        this.choosenNodeUids.delete(uid);
        this.forceUpdate();
    }

    unchooseAllNodes = () => {
        this.choosenNodeUids.clear();
        this.forceUpdate();
    }

    // 选取开始时的鼠标位置
    private sectionChooseStartMousePosition: Vec2 = [0, 0];

    onSectionChooseStart(e: MouseEvent) {
        this.setState(() => ({ mouseState: 'chooseNodes' }));
        this.sectionChooseStartMousePosition = [e.clientX, e.clientY];
    }
    onSectionChooseMove(e: MouseEvent) {
        const fix = this.getPoolFix();
        const mousePosition = vec2Minus([e.clientX, e.clientY], fix);
        const [x, y] = vec2Minus(this.sectionChooseStartMousePosition, fix);
        this.setState(() => ({ section: {
            x,
            y,
            width: mousePosition[X] - x,
            height: mousePosition[Y] - y,
        } }));
    }
    onSectionChooseEnd(e: MouseEvent) {
        const [sectionLeft, sectionRight] = [this.sectionChooseStartMousePosition[X], e.clientX].sort();
        const [sectionTop, sectionBottom] = [this.sectionChooseStartMousePosition[Y], e.clientY].sort();
        const newChoosenNodeUids = Array.from(this.nodeCardRects.entries()).filter(
            ([, { x, y, width, height }]) => 
                (x >= sectionLeft && y >= sectionTop && x + width <= sectionRight && y + height <= sectionBottom)
        ).map(([uid]) => uid);
        if (!e.ctrlKey) {
            this.choosenNodeUids.clear();
        }
        newChoosenNodeUids.forEach(it => this.choosenNodeUids.add(it));
        this.setState(() => ({ mouseState: null, section: null }));
    }

    //#endregion
}

export default App;
