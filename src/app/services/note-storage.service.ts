import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { StickyNote } from '../models/note.model';

/**
 * LocalStorage 键名
 */
const STORAGE_KEY = 'map_notes_app_data';

/**
 * 便签存储服务
 * 负责 LocalStorage 的读写操作
 */
@Injectable({
  providedIn: 'root'
})
export class NoteStorageService {
  private notes$ = new BehaviorSubject<StickyNote[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 获取所有便签的 Observable
   */
  getNotes(): Observable<StickyNote[]> {
    return this.notes$.asObservable();
  }

  /**
   * 获取当前所有便签（同步）
   */
  getCurrentNotes(): StickyNote[] {
    return this.notes$.value;
  }

  /**
   * 设置所有便签
   */
  private setNotes(notes: StickyNote[]): void {
    this.notes$.next(notes);
    this.saveToStorage(notes);
  }

  /**
   * 添加便签
   */
  addNote(note: StickyNote): void {
    const notes = this.getCurrentNotes();
    this.setNotes([...notes, note]);
  }

  /**
   * 更新便签
   */
  updateNote(noteId: string, updates: Partial<StickyNote>): void {
    const notes = this.getCurrentNotes();
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      const updatedNotes = [...notes];
      updatedNotes[index] = {
        ...updatedNotes[index],
        ...updates,
        updatedAt: Date.now()
      };
      this.setNotes(updatedNotes);
    }
  }

  /**
   * 删除便签
   */
  deleteNote(noteId: string): void {
    const notes = this.getCurrentNotes();
    this.setNotes(notes.filter(n => n.id !== noteId));
  }

  /**
   * 批量更新便签
   */
  updateNotes(notes: StickyNote[]): void {
    this.setNotes(notes);
  }

  /**
   * 清空所有便签
   */
  clearAll(): void {
    this.setNotes([]);
  }

  /**
   * 从 LocalStorage 加载数据
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.notes$.next(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load notes from storage:', error);
      this.notes$.next([]);
    }
  }

  /**
   * 保存数据到 LocalStorage
   */
  private saveToStorage(notes: StickyNote[]): void {
    try {
      const data = JSON.stringify(notes);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save notes to storage:', error);
    }
  }

  /**
   * 导出数据（用于备份）
   */
  exportData(): string {
    const notes = this.getCurrentNotes();
    return JSON.stringify(notes, null, 2);
  }

  /**
   * 导入数据（用于恢复）
   */
  importData(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        this.setNotes(parsed);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import notes:', error);
      return false;
    }
  }

  /**
   * 获取存储大小（字节）
   */
  getStorageSize(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '';
      return new Blob([data]).size;
    } catch {
      return 0;
    }
  }
}
