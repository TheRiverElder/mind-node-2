import { Vec2 } from "./util/mathematics";
import { LinkPainterIdV2, MindNodeLinkV2, MindNodePoolV2, MindNodeV2 } from "./data/versions/Version_2";

export type MindNode = Readonly<MindNodeV2>;
export type MindNodeLink = Readonly<MindNodeLinkV2>;
export type LinkPainterId = LinkPainterIdV2;
export type MindNodePool = MindNodePoolV2;
export type MutableMindNode = Omit<Mutable<MindNode>, "uid">;

export type Mutable<T extends Object> = {
    [key in keyof T]: T[key] | undefined;
}

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
export interface MindNodePoolEditorContext {
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
     * 根据给定参数，增加新节点
     * @param data 节点的数据，除了uid
     * @returns 返回生成节点的uid
     */
    createNode(data: Readonly<Partial<MutableMindNode>>): number;

    /**
     * 获取全部节点
     * @returns 查询到的节点
     */
    getAllNodes(): MindNode[];

    /**
     * 获取所有连接
     * @returns 返回查询到的连接
     */
    getAllLinks(): MindNodeLink[];

    /**
     * 根据uid获取节点
     * @param uid 节点的uid
     * @returns 返回查询到的节点
     */
    getNodeByUid(uid: number): MindNode | null;

    /**
     * 根据uid获取连接
     * @param uid 节点的uid
     * @returns 查询到的连接，如果没有找到则返回null
     */
    getLinkByUid(uid: number): MindNodeLink | null;

    /**
     * 获取从指定节点出发的所有连接
     * @param uid 节点的uid
     * @returns 返回该节点出发的全部链接
     */
    getLinksOfSource(uid: number): MindNodeLink[];

    /**
     * 获取到达指定节点的所有连接
     * @param uid 节点的uid
     * @returns 返回到达该节点的全部链接
     */
    getLinksOfTarget(uid: number): MindNodeLink[];

    /**
     * 从源到目标的连接
     * @param sourceUid 源节点uid
     * @param targetUid 目标节点uid
     * @returns 如果存在则返回连接，否则返回null
     */
    getLinkBetween(sourceUid: number, targetUid: number): MindNodeLink | null;

    /**
     * 修改node数据
     * @param data 节点数据，这个数据不会用以直接替换旧的节点，只会把内容复制过去
     * @returns 返回是否修改成功
     */
    modifyNode(data: Partial<MutableMindNode> & { readonly uid: MindNode["uid"] }): boolean;

    /**
     * 根据uid移除节点
     * @param uid 节点的uid
     * @returns 返回被移除的节点
     */
    removeNodeByUid(uid: number): MindNode | null;

    /**
     * 创建两个节点之间的连接
     * @param sourceNodeUid 开始节点的uid
     * @param targetNodeUid 结束节点的uid
     * @returns 新建的连接或已有的连接，若创建失败则返回null
     */
    createLink(sourceNodeUid: number, targetNodeUid: number): MindNodeLink | null;

    /**
     * 移除两个节点之间的连接
     * @param sourceNodeUid 开始节点的uid
     * @param targetNodeUid 结束节点的uid
     * @returns 被移除的链接，找不到则返回null
     */
    removeLink(sourceNodeUid: number, targetNodeUid: number): MindNodeLink | null;

    /**
     * 设置正在编辑的节点，即右侧栏的节点
     * 响应式数据，修改会导致布局更新。
     */
    editingNodeUid: number | null;

    /**
     * 获取某个节点的位置、尺寸信息，只能获取已经记录的信息，不能主动获取信息
     * @param uid 对应节点的uid
     * @returns 节点的位置与尺寸信息
     */
    getNodeRect(uid: number): Rect | null;

    /**
     * 向总控制器更新某个节点的位置、尺寸信息
     * @param uid 对应节点的uid
     * @param rect 对应节点的边框数据
     */
    setNodeRect(uid: number, rect: Rect): void;

    /**
     * 链接操作中，链接末尾鼠标的位置，由于还没选定到节点，所以用这个数据占位，方便绘制
     * 响应式数据，修改会导致布局更新。
     */
    virtualTargetPosition: Vec2 | null;

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