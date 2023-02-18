
export interface MindNodeV0 {
    uid: number; // 它的唯一标识符
    position: Vec2; // 它的坐标，是一个二元组，格式是[x, y]
    text: string; // 它的内容，目前只支持纯文本
    background: string; // 它的背景，支持CSS的background支持的样式
    color: string; // 它的文字颜色，支持CSS的color支持的颜色
    outPorts: Array<number>; // 它的下线，即它接下来要连接到后续节点列表
    inPorts: Array<number>; // 它的上线，即它接下来要连接到后续节点列表
}

export interface MindNodePoolV0 {
    uidCounter: number;
    offset: Vec2; // 原点相对画面中点的偏移坐标
    scale: number;
    nodes: Array<MindNodeV1>; // 节点池内的节点
}