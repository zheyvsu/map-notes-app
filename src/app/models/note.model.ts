/**
 * 便签数据模型
 */
export interface StickyNote {
  id: string;                    // 唯一标识
  x: number;                     // X 坐标 (px)
  y: number;                     // Y 坐标 (px)
  title: string;                 // 标题
  content: string;               // 富文本内容 (HTML)
  backgroundColor: string;       // 背景色
  width: number;                 // 宽度 (px)
  height: number;                // 高度 (px)
  zIndex: number;                // 层级
  hasBeenDragged: boolean;       // 是否被拖拽过
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
}

/**
 * 创建新的便签实例
 */
export function createStickyNote(overrides?: Partial<StickyNote>): StickyNote {
  const now = Date.now();
  return {
    id: generateId(),
    x: 100,                      // 默认位置: 100px
    y: 100,                      // 默认位置: 100px
    title: '新便签',
    content: '',
    backgroundColor: '#fff7b1',  // 默认黄色
    width: 200,
    height: 150,
    zIndex: 1,
    hasBeenDragged: false,       // 默认未拖拽
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 预定义的便签颜色
 */
export const NOTE_COLORS = [
  '#fff7b1', // 黄色
  '#b1e3ff', // 蓝色
  '#ffb1b1', // 红色
  '#b1ffb1', // 绿色
  '#e8b1ff', // 紫色
  '#ffb1e8', // 粉色
  '#ffe8b1', // 橙色
  '#ffffff', // 白色
] as const;
