import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { StickyNote, createStickyNote } from './models/note.model';
import { NoteStorageService } from './services/note-storage.service';
import { HistoryService } from './services/history.service';
import { MapViewerComponent } from './components/map-viewer/map-viewer.component';
import { StickyNoteComponent } from './components/sticky-note/sticky-note.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { CommonModule } from '@angular/common';

/**
 * 命令：添加便签
 */
class AddNoteCommand {
  constructor(
    private storage: NoteStorageService,
    private note: StickyNote
  ) {}

  execute(): void {
    this.storage.addNote(this.note);
  }

  undo(): void {
    this.storage.deleteNote(this.note.id);
  }

  get description(): string {
    return `Add note: ${this.note.title}`;
  }
}

/**
 * 命令：更新便签
 */
class UpdateNoteCommand {
  constructor(
    private storage: NoteStorageService,
    private noteId: string,
    private updates: Partial<StickyNote>,
    private previousState?: StickyNote
  ) {}

  execute(): void {
    if (this.previousState) {
      // 重做：恢复新状态
      this.storage.updateNote(this.noteId, this.updates);
    } else {
      // 首次执行：保存旧状态
      const notes = this.storage.getCurrentNotes();
      this.previousState = notes.find(n => n.id === this.noteId);
      this.storage.updateNote(this.noteId, this.updates);
    }
  }

  undo(): void {
    if (this.previousState) {
      this.storage.updateNote(this.noteId, this.previousState);
    }
  }

  get description(): string {
    return `Update note: ${this.noteId}`;
  }
}

/**
 * 命令：删除便签
 */
class DeleteNoteCommand {
  constructor(
    private storage: NoteStorageService,
    private note: StickyNote
  ) {}

  execute(): void {
    this.storage.deleteNote(this.note.id);
  }

  undo(): void {
    this.storage.addNote(this.note);
  }

  get description(): string {
    return `Delete note: ${this.note.title}`;
  }
}

/**
 * 主应用组件
 */
@Component({
  selector: 'app-root',
  imports: [CommonModule, MapViewerComponent, StickyNoteComponent, NoteEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = '地图便签应用';

  private noteStorage = inject(NoteStorageService);
  private history = inject(HistoryService);

  notes: StickyNote[] = [];
  selectedNoteId: string | null = null;
  editingNoteId: string | null = null;
  editingNote: StickyNote | null = null;
  lastAddedNote: StickyNote | null = null;  // 最近添加的便签

  canUndo = false;
  canRedo = false;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // 订阅便签数据
    this.subscriptions.push(
      this.noteStorage.getNotes().subscribe(notes => {
        // 确保旧数据有 hasBeenDragged 字段
        this.notes = notes.map(note => ({
          ...note,
          hasBeenDragged: note.hasBeenDragged ?? false
        }));

        // 找到最新的便签（可能是未拖拽的）
        const undraggedNotes = this.notes.filter(n => !n.hasBeenDragged);
        if (undraggedNotes.length > 0) {
          // 取最后添加的未拖拽便签
          this.lastAddedNote = undraggedNotes.reduce((latest, note) =>
            note.createdAt > latest.createdAt ? note : latest
          );
        }
      })
    );

    // 订阅撤销/重做状态
    this.subscriptions.push(
      this.history.canUndo.subscribe(canUndo => {
        this.canUndo = canUndo;
      })
    );

    this.subscriptions.push(
      this.history.canRedo.subscribe(canRedo => {
        this.canRedo = canRedo;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * 添加便签
   */
  onAddNote(): void {
    let x = 0;
    let y = 0;

    // 如果最近添加的便签没有被拖拽，新便签放在它下面
    if (this.lastAddedNote && !this.lastAddedNote.hasBeenDragged) {
      x = this.lastAddedNote.x;
      y = this.lastAddedNote.y + 40; // 向下偏移 40px，露出头部
    } else {
      // 否则放在右上角
      const mapWrapper = document.querySelector('.map-wrapper');
      if (mapWrapper) {
        const rect = mapWrapper.getBoundingClientRect();
        x = rect.width - 200 - 20; // 右上角（便签宽 200 + 边距 20）
        y = 20; // 顶部边距 20
      } else {
        x = 800; // 默认位置
        y = 20;
      }
    }

    const newNote = createStickyNote({
      x,
      y,
      zIndex: this.notes.length + 1  // 层级递增
    });

    const command = new AddNoteCommand(this.noteStorage, newNote);
    this.history.execute(command);

    // 更新最近添加的便签
    this.lastAddedNote = newNote;

    // 立即编辑新便签
    this.editingNoteId = newNote.id;
    this.editingNote = { ...newNote };
  }

  /**
   * 编辑便签
   */
  onEditNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      this.editingNoteId = noteId;
      this.editingNote = { ...note };
    }
  }

  /**
   * 保存编辑
   */
  onSaveNote(updates: Partial<StickyNote>): void {
    if (this.editingNoteId && this.editingNote) {
      const command = new UpdateNoteCommand(
        this.noteStorage,
        this.editingNoteId,
        updates
      );
      this.history.execute(command);
    }
    this.closeEditor();
  }

  /**
   * 取消编辑
   */
  onCancelEdit(): void {
    this.closeEditor();
  }

  /**
   * 删除便签
   */
  onDeleteNote(noteId: string): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      const command = new DeleteNoteCommand(this.noteStorage, note);
      this.history.execute(command);

      if (this.selectedNoteId === noteId) {
        this.selectedNoteId = null;
      }
    }
  }

  /**
   * 更改便签颜色
   */
  onColorChange(event: { id: string; color: string }): void {
    const command = new UpdateNoteCommand(
      this.noteStorage,
      event.id,
      { backgroundColor: event.color }
    );
    this.history.execute(command);
  }

  /**
   * 便签位置变化
   */
  onNotePositionChange(event: { id: string; x: number; y: number }): void {
    const command = new UpdateNoteCommand(
      this.noteStorage,
      event.id,
      { x: event.x, y: event.y, hasBeenDragged: true }
    );
    this.history.execute(command);

    // 更新本地引用
    if (this.lastAddedNote && this.lastAddedNote.id === event.id) {
      this.lastAddedNote.hasBeenDragged = true;
    }
  }

  /**
   * 选中便签
   */
  onSelectNote(noteId: string): void {
    this.selectedNoteId = noteId;
  }

  /**
   * 撤销
   */
  onUndo(): void {
    this.history.undo();
  }

  /**
   * 重做
   */
  onRedo(): void {
    this.history.redo();
  }

  /**
   * 关闭编辑器
   */
  private closeEditor(): void {
    this.editingNoteId = null;
    this.editingNote = null;
  }

  /**
   * 点击空白处取消选中
   */
  onBackgroundClick(): void {
    this.selectedNoteId = null;
  }
}
