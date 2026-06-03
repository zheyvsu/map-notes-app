import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MapState, createDefaultMapState } from '../models/map-config.model';

/**
 * 地图状态服务
 * 管理地图的缩放、平移状态，提供坐标转换功能
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  private state$ = new BehaviorSubject<MapState>(createDefaultMapState());
  private containerSize = { width: 0, height: 0 };

  constructor() {}

  /**
   * 获取当前地图状态的 Observable
   */
  getState(): Observable<MapState> {
    return this.state$.asObservable();
  }

  /**
   * 获取当前地图状态（同步）
   */
  getCurrentState(): MapState {
    return this.state$.value;
  }

  /**
   * 设置地图状态
   */
  setState(state: Partial<MapState>): void {
    const current = this.getCurrentState();
    this.state$.next({ ...current, ...state });
  }

  /**
   * 设置容器尺寸
   */
  setContainerSize(width: number, height: number): void {
    this.containerSize = { width, height };
  }

  /**
   * 获取容器尺寸
   */
  getContainerSize(): { width: number; height: number } {
    return this.containerSize;
  }

  /**
   * 缩放地图
   * @param delta 缩放增量（正值放大，负值缩小）
   * @param centerX 缩放中心 X 坐标（可选）
   * @param centerY 缩放中心 Y 坐标（可选）
   */
  zoom(delta: number, centerX?: number, centerY?: number): void {
    const state = this.getCurrentState();
    const oldScale = state.scale;
    let newScale = oldScale + delta;

    // 限制缩放范围
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

    if (newScale === oldScale) {
      return; // 缩放没有变化
    }

    const scaleRatio = newScale / oldScale;

    // 如果提供了缩放中心，调整平移量以保持中心点位置不变
    if (centerX !== undefined && centerY !== undefined) {
      const newTranslateX = centerX - (centerX - state.translateX) * scaleRatio;
      const newTranslateY = centerY - (centerY - state.translateY) * scaleRatio;
      this.setState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY
      });
    } else {
      this.setState({ scale: newScale });
    }
  }

  /**
   * 平移地图
   * @param deltaX X 方向平移量
   * @param deltaY Y 方向平移量
   */
  pan(deltaX: number, deltaY: number): void {
    const state = this.getCurrentState();
    this.setState({
      translateX: state.translateX + deltaX,
      translateY: state.translateY + deltaY
    });
  }

  /**
   * 重置地图到初始状态
   */
  reset(): void {
    this.state$.next(createDefaultMapState());
  }

  /**
   * 将像素坐标转换为百分比坐标（相对于容器）
   * @param pixelX 像素 X 坐标
   * @param pixelY 像素 Y 坐标
   * @returns 百分比坐标 { x, y }
   */
  pixelToPercent(pixelX: number, pixelY: number): { x: number; y: number } {
    if (this.containerSize.width === 0 || this.containerSize.height === 0) {
      return { x: 50, y: 50 }; // 默认中心位置
    }
    return {
      x: (pixelX / this.containerSize.width) * 100,
      y: (pixelY / this.containerSize.height) * 100
    };
  }

  /**
   * 将百分比坐标转换为像素坐标
   * @param percentX 百分比 X 坐标
   * @param percentY 百分比 Y 坐标
   * @returns 像素坐标 { x, y }
   */
  percentToPixel(percentX: number, percentY: number): { x: number; y: number } {
    return {
      x: (percentX / 100) * this.containerSize.width,
      y: (percentY / 100) * this.containerSize.height
    };
  }

  /**
   * 将屏幕坐标转换为地图内部坐标（考虑缩放和平移）
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 地图坐标 { x, y }
   */
  screenToMap(screenX: number, screenY: number): { x: number; y: number } {
    const state = this.getCurrentState();
    return {
      x: (screenX - state.translateX) / state.scale,
      y: (screenY - state.translateY) / state.scale
    };
  }

  /**
   * 将地图内部坐标转换为屏幕坐标（考虑缩放和平移）
   * @param mapX 地图 X 坐标
   * @param mapY 地图 Y 坐标
   * @returns 屏幕坐标 { x, y }
   */
  mapToScreen(mapX: number, mapY: number): { x: number; y: number } {
    const state = this.getCurrentState();
    return {
      x: mapX * state.scale + state.translateX,
      y: mapY * state.scale + state.translateY
    };
  }

  /**
   * 获取变换字符串（用于 CSS transform）
   */
  getTransformString(): string {
    const state = this.getCurrentState();
    return `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }
}
