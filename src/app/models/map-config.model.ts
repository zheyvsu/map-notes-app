/**
 * 地图状态配置
 */
export interface MapState {
  scale: number;                 // 缩放比例 (1 = 100%)
  translateX: number;            // 平移 X (px)
  translateY: number;            // 平移 Y (px)
  minScale: number;             // 最小缩放
  maxScale: number;             // 最大缩放
}

/**
 * 地图配置
 */
export interface MapConfig {
  mapType: string;               // 地图类型
  initialScale: number;         // 初始缩放
  initialTranslateX: number;    // 初始平移 X
  initialTranslateY: number;    // 初始平移 Y
}

/**
 * 创建默认地图状态
 */
export function createDefaultMapState(): MapState {
  return {
    scale: 1,
    translateX: 0,
    translateY: 0,
    minScale: 0.2,
    maxScale: 5
  };
}

/**
 * 创建默认地图配置
 */
export function createDefaultMapConfig(): MapConfig {
  return {
    mapType: 'china',
    initialScale: 1,
    initialTranslateX: 0,
    initialTranslateY: 0
  };
}
