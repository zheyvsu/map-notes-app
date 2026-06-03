import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild } from '@angular/core';
import { StickyNote, NOTE_COLORS } from '../../models/note.model';
import { CommonModule } from '@angular/common';

/**
 * 便签编辑器组件
 * 使用 Quill 富文本编辑器编辑便签内容
 */
@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss'
})
export class NoteEditorComponent implements OnInit {
  @Input() note!: StickyNote;

  @Output() save = new EventEmitter<Partial<StickyNote>>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  editedTitle: string = '';
  selectedColor: string = '';
  noteColors = NOTE_COLORS;
  isEditorReady = false;

  // Quill 编辑器实例
  private quill: any;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    // 初始化数据（在变更检测之前）
    this.editedTitle = this.note.title;
    this.selectedColor = this.note.backgroundColor;
  }

  ngAfterViewInit(): void {
    // 初始化编辑器和聚焦（在变更检测之后）
    this.initializeEditor();

    // 聚焦标题输入框
    setTimeout(() => {
      this.titleInput?.nativeElement.focus();
    }, 100);
  }

  /**
   * 初始化 Quill 编辑器
   */
  private initializeEditor(): void {
    // 动态加载 Quill
    if (typeof window !== 'undefined' && (window as any).Quill) {
      const Quill = (window as any).Quill;
      this.quill = new Quill(this.editorContainer.nativeElement, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'clean']
          ]
        },
        placeholder: '输入便签内容...'
      });

      // 设置初始内容
      if (this.note.content) {
        this.quill.root.innerHTML = this.note.content;
      }

      this.isEditorReady = true;
    } else {
      console.error('Quill is not loaded');
    }
  }

  /**
   * 保存便签
   */
  onSave(): void {
    const content = this.quill ? this.quill.root.innerHTML : '';
    this.save.emit({
      title: this.editedTitle || '新便签',
      content: content,
      backgroundColor: this.selectedColor,
      width: this.note.width,
      height: this.note.height
    });
  }

  /**
   * 取消编辑
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * 更改颜色
   */
  onColorChange(color: string): void {
    this.selectedColor = color;
  }

  /**
   * 处理键盘事件
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
    }
  }
}
