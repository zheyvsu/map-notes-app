import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Command } from '../models/command.model';

/**
 * 历史服务 - 实现撤销/重做功能
 * 使用命令模式管理操作历史
 */
@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize = 50; // 最大历史记录数量

  private canUndo$ = new BehaviorSubject<boolean>(false);
  private canRedo$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  /**
   * 是否可以撤销
   */
  get canUndo(): Observable<boolean> {
    return this.canUndo$.asObservable();
  }

  /**
   * 是否可以重做
   */
  get canRedo(): Observable<boolean> {
    return this.canRedo$.asObservable();
  }

  /**
   * 获取当前是否可以撤销（同步）
   */
  get canUndoNow(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 获取当前是否可以重做（同步）
   */
  get canRedoNow(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 执行命令
   */
  execute(command: Command): void {
    try {
      command.execute();
      this.undoStack.push(command);
      this.redoStack = []; // 清空重做栈

      // 限制历史记录大小
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }

      this.updateStates();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }

  /**
   * 撤销
   */
  undo(): void {
    if (this.undoStack.length === 0) {
      return;
    }

    const command = this.undoStack.pop()!;
    try {
      command.undo();
      this.redoStack.push(command);
      this.updateStates();
    } catch (error) {
      console.error('Failed to undo command:', error);
      // 撤销失败，将命令放回撤销栈
      this.undoStack.push(command);
    }
  }

  /**
   * 重做
   */
  redo(): void {
    if (this.redoStack.length === 0) {
      return;
    }

    const command = this.redoStack.pop()!;
    try {
      command.execute();
      this.undoStack.push(command);
      this.updateStates();
    } catch (error) {
      console.error('Failed to redo command:', error);
      // 重做失败，将命令放回重做栈
      this.redoStack.push(command);
    }
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateStates();
  }

  /**
   * 设置最大历史记录数量
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    // 如果当前历史记录超过新的大小，截断
    while (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    this.updateStates();
  }

  /**
   * 获取历史记录统计信息
   */
  getStats(): { undoCount: number; redoCount: number } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    };
  }

  /**
   * 更新状态
   */
  private updateStates(): void {
    this.canUndo$.next(this.undoStack.length > 0);
    this.canRedo$.next(this.redoStack.length > 0);
  }

  /**
   * 批量执行命令（作为单个操作）
   * 所有命令会作为一个整体被撤销/重做
   */
  executeBatch(commands: Command[]): void {
    if (commands.length === 0) {
      return;
    }

    try {
      commands.forEach(cmd => cmd.execute());
      this.undoStack.push(...commands);
      this.redoStack = [];

      // 限制历史记录大小
      while (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }

      this.updateStates();
    } catch (error) {
      console.error('Failed to execute batch commands:', error);
    }
  }
}
