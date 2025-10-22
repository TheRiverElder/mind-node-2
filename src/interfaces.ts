import { LinkPainterIdV1, MindNodePoolV1, MindNodeV1 } from "./data/versions/Version_1";
import { Vec2 } from "./util/mathematics";

export type MindNode = MindNodeV1;
export type LinkPainterId = LinkPainterIdV1;
export type MindNodePool = MindNodePoolV1;
export type MutableMindNode = Omit<MindNode, "uid">;

// export interface MindNodePoolComponent {
//     addNode(node: MindNode): void;
//     updateNode(node: MindNode): void;
//     removeNode(uid: number): void;
//     getOffset(): Vec2;
//     getAnchor(): Vec2;
//     recordCardLinkAnchorPosition(uid: number, position: Vec2): void;
//     onLink(node: MindNode): void;
// }

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// TODO: 改为setter与getter模式，并禁止对nodes的直接操作
export interface ToolEnv {
    /**
     * 屏幕中心相对于世界中心的位置
     * 响应式数据，修改会导致布局更新。
     */
    offset: Vec2;

    /**
     * 画布的缩放，目前只会缩放节点在画布上的位置，不会缩放节点本身的大小
     * 响应式数据，修改会导致布局更新。
     */
    scale: number;

    /**
     * MindNode 实例可能会改变，所以在其它位置引用其uid较为妥当
     * @deprecated 内容会改为只读的
     * @see {ToolEnv.getNodeByUid}
     */
    nodes: Map<number, MindNode>;

    /**
     * 根据给定参数，增加新节点
     * @param data 节点的数据，除了uid
     * @returns 返回生成节点的uid
     */
    createNode(data: Readonly<Partial<MutableMindNode>>): number;

    /**
     * 根据uid获取节点
     * @param uid 节点的uid
     * @returns 返回查询到的节点
     */
    getNodeByUid(uid: number): MindNode | null;

    /**
     * 获取全部节点
     * @returns 查询到的节点
     */
    getAllNodes(): MindNode[];

    /**
     * 修改node数据
     * @param data 节点数据，这个数据不会用以直接替换旧的节点，只会把内容复制过去
     * @returns 返回是否修改成功
     */
    modifyNodeByUid(data: MindNode): boolean;

    /**
     * 根据uid移除节点
     * @param uid 节点的uid
     * @returns 返回被移除的节点
     */
    removeNodeByUid(uid: number): MindNode | null;

    /**
     * 增加新的节点
     * @deprecated uid将会改为统一分配
     * @see {ToolEnv.createNode}
     */
    addNode(node: MindNode): void;

    /**
     * 设置正在编辑的节点，即右侧栏的节点
     * 响应式数据，修改会导致布局更新。
     */
    editingNodeUid: number;

    // 保存的是节点矩形的缓存，会随着布局的变化而更新
    getNodeRect(uid: number): Rect | null;

    /**
     * 链接操作中，链接末尾鼠标的位置，由于还没选定到节点，所以用这个数据占位，方便绘制
     * 响应式数据，修改会导致布局更新。
     */
    virtualDstPos: Vec2 | null;

    /**
     * 被选中的节点，即卡片外围有绿色虚线框的节点
     * 响应式数据，修改会导致布局更新。
     */
    selectedNodeUids: Set<number>;

    /**
     * 鼠标框选时的选区
     * 响应式数据，修改会导致布局更新。
     */
    selectionArea: Rect | null;

    /**
     * pixel坐标是实际在画布上的坐标，pool左边是在节点池的虚拟坐标系中的坐标
     * @param vec 输入的像素位置
     * @returns 输出虚拟画布位置
     */
    pixel2pool(vec: Vec2): Vec2;

    /**
     * @deprecated 将会由节点管理的逻辑统一分配
     */
    genUid(): number;

    /**
     * 相当于poolFix + offset
     */
    getAnchor(): Vec2;

    /**
     * 修正量，是画布的client位置
     */
    getPoolFix(): Vec2;
}