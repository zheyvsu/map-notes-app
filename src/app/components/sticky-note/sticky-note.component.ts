import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { StickyNote, NOTE_COLORS } from '../../models/note.model';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDragHandle, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * 便签组件
 * 显示便签内容，支持拖拽、双击编辑、右键菜单
 */
@Component({
  selector: 'app-sticky-note',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDragHandle],
  templateUrl: './sticky-note.component.html',
  styleUrl: './sticky-note.component.scss'
})
export class StickyNoteComponent {
  @Input() note!: StickyNote;
  @Input() isSelected = false;

  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<{ id: string; color: string }>();
  @Output() positionChange = new EventEmitter<{ id: string; x: number; y: number }>();
  @Output() dragStart = new EventEmitter<string>();
  @Output() select = new EventEmitter<string>();

  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  noteColors = NOTE_COLORS;

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * 处理双击事件
   */
  onDoubleClick(): void {
    this.edit.emit(this.note.id);
  }

  /**
   * 拖拽开始
   */
  onDragStart(): void {
    this.dragStart.emit(this.note.id);
  }

  /**
   * 处理拖拽结束
   */
  onDragEnd(event: CdkDragEnd): void {
    // 获取拖动的距离（像素）
    const distance = event.distance;

    // 计算新的像素位置
    const newPixelX = this.note.x + distance.x;
    const newPixelY = this.note.y + distance.y;

    // 限制在容器内（简单的边界检查）
    const mapWrapper = document.querySelector('.map-wrapper');
    if (mapWrapper) {
      const wrapperRect = mapWrapper.getBoundingClientRect();
      const maxX = wrapperRect.width - this.note.width;
      const maxY = wrapperRect.height - this.note.height;

      this.positionChange.emit({
        id: this.note.id,
        x: Math.max(0, Math.min(maxX, newPixelX)),
        y: Math.max(0, Math.min(maxY, newPixelY))
      });
    } else {
      this.positionChange.emit({
        id: this.note.id,
        x: newPixelX,
        y: newPixelY
      });
    }
  }

  /**
   * 处理右键菜单
   */
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.showContextMenu = true;
  }

  /**
   * 关闭上下文菜单
   */
  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  /**
   * 删除便签
   */
  onDelete(): void {
    this.delete.emit(this.note.id);
    this.closeContextMenu();
  }

  /**
   * 更改颜色
   */
  onColorChange(color: string): void {
    this.colorChange.emit({ id: this.note.id, color });
    this.closeContextMenu();
  }

  /**
   * 选中便签
   */
  onSelect(): void {
    this.select.emit(this.note.id);
  }

  /**
   * 获取便签内容的纯文本预览
   */
  getContentPreview(): string {
    if (!this.note.content) {
      return '双击左键开始编辑...';
    }
    // 移除 HTML 标签，获取纯文本
    const temp = document.createElement('div');
    temp.innerHTML = this.note.content;
    const text = temp.textContent || temp.innerText || '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  /**
   * 获取安全的 HTML（保留内联样式）
   */
  getSafeContent(): SafeHtml {
    const content = this.note.content || '';
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  /**
   * 点击其他地方时关闭菜单
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeContextMenu();
  }
}
