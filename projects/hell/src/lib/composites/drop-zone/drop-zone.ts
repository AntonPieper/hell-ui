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

function hellFileMatchesAccept(file: File, accept: string | null): boolean {
  const tokens = accept
    ?.split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens?.length) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (!type) return false;
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Drag-and-drop file input area. Emits a `files` event when the user drops
 * files or selects them via the hidden `<input type="file">` (which the
 * directive auto-creates and triggers on click).
 *
 * Bind to a `<div>` or `<label>`. Apply `multiple` and `accept` to constrain
 * emitted files. Treat `accept` as a client-side hint and validate again at
 * the upload boundary.
 */
@Directive({
  selector: '[hellDropzone]',
  host: {
    '[class.hell-dropzone]': '!unstyled()',
    '[attr.data-active]': 'active() && !disabled() ? "true" : null',
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

  @HostListener('click', ['$event'])
  protected onClick(event?: MouseEvent) {
    if (event?.target === this.fileInput) return;
    event?.preventDefault();
    if (this.disabled()) return;
    this.ensureInput().click();
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  protected onKey(e: Event) {
    if (this.disabled()) return;
    e.preventDefault();
    this.onClick();
  }

  @HostListener('dragenter', ['$event'])
  @HostListener('dragover', ['$event'])
  protected onDragOver(e: DragEvent) {
    if (this.disabled()) {
      this.active.set(false);
      return;
    }
    e.preventDefault();
    this.active.set(true);
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(e: DragEvent) {
    if (this.disabled() || e.target === this.host) this.active.set(false);
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    if (this.disabled()) {
      this.active.set(false);
      return;
    }
    e.preventDefault();
    this.active.set(false);
    const f = e.dataTransfer?.files;
    if (!f?.length) return;
    const files = this.filterFiles(f);
    if (files.length) this.files.emit(files);
  }

  private ensureInput(): HTMLInputElement {
    if (this.fileInput) {
      this.syncInput(this.fileInput);
      return this.fileInput;
    }

    const inp = this.host.ownerDocument.createElement('input');
    inp.type = 'file';
    inp.hidden = true;
    inp.tabIndex = -1;
    inp.addEventListener('click', (event: MouseEvent) => event.stopPropagation());
    inp.addEventListener('change', () => {
      if (!this.disabled() && inp.files?.length) {
        const files = this.filterFiles(inp.files);
        if (files.length) this.files.emit(files);
      }
      inp.value = '';
    });
    this.host.appendChild(inp);
    this.fileInput = inp;
    this.syncInput(inp);
    return inp;
  }

  private syncInput(input: HTMLInputElement): void {
    input.disabled = this.disabled();
    input.multiple = this.multiple();
    const accept = this.accept()?.trim() ?? '';
    input.accept = accept;
    if (!accept) input.removeAttribute('accept');
  }

  private filterFiles(list: FileList): File[] {
    const arr = Array.from(list).filter((file) => hellFileMatchesAccept(file, this.accept()));
    return this.multiple() ? arr : arr.slice(0, 1);
  }
}
