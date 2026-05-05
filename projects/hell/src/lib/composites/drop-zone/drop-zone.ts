import { HellStyleable } from '../../core/styleable';
import {
  Directive,
  ElementRef,
  HostListener,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Drag-and-drop file input area. Emits a `files` event when the user drops
 * files or selects them via the hidden `<input type="file">` (which the
 * directive auto-creates and triggers on click).
 *
 * Bind to a `<div>` or `<label>`. Apply `multiple` and `accept` to constrain
 * what can be picked.
 */
@Directive({
  selector: '[hellDropzone]',
  host: {
    '[class.hell-dropzone]': '!unstyled()',
    '[attr.data-active]': 'active() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    role: 'button',
  },
})
export class HellDropZone extends HellStyleable {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly accept = input<string | null>(null);

  readonly files = output<File[]>();

  protected readonly active = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private fileInput?: HTMLInputElement;

  @HostListener('click')
  protected onClick() {
    if (this.disabled()) return;
    this.ensureInput();
    this.fileInput!.click();
  }

  @HostListener('keydown.enter')
  @HostListener('keydown.space', ['$any($event)'])
  protected onKey(e?: KeyboardEvent) {
    e?.preventDefault();
    this.onClick();
  }

  @HostListener('dragenter', ['$event'])
  @HostListener('dragover', ['$event'])
  protected onDragOver(e: DragEvent) {
    if (this.disabled()) return;
    e.preventDefault();
    this.active.set(true);
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(e: DragEvent) {
    if (e.target === this.host) this.active.set(false);
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    if (this.disabled()) return;
    e.preventDefault();
    this.active.set(false);
    const f = e.dataTransfer?.files;
    if (f && f.length) this.files.emit(this.filterFiles(f));
  }

  private ensureInput() {
    if (this.fileInput) return;
    const inp = this.host.ownerDocument.createElement('input');
    inp.type = 'file';
    inp.hidden = true;
    inp.tabIndex = -1;
    if (this.multiple()) inp.multiple = true;
    const a = this.accept();
    if (a) inp.accept = a;
    inp.addEventListener('change', () => {
      if (inp.files?.length) this.files.emit(this.filterFiles(inp.files));
      inp.value = '';
    });
    this.host.appendChild(inp);
    this.fileInput = inp;
  }

  private filterFiles(list: FileList): File[] {
    const arr = Array.from(list);
    return this.multiple() ? arr : arr.slice(0, 1);
  }
}
