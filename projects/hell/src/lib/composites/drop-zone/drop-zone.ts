import { HellStyleable } from '../../core/styleable';
import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
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
export class HellDropZone extends HellStyleable implements OnDestroy {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly accept = input<string | null>(null);

  readonly files = output<File[]>();

  protected readonly active = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private fileInput?: HTMLInputElement;
  private dragDepth = 0;

  private readonly inputClickHandler = (event: MouseEvent) => event.stopPropagation();
  private readonly inputChangeHandler = () => {
    const input = this.fileInput;
    if (!input) return;
    if (!this.disabled() && input.files?.length) {
      const files = this.filterFiles(input.files);
      if (files.length) this.files.emit(files);
    }
    input.value = '';
  };

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
  protected onDragEnter(e: DragEvent) {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }

    e.preventDefault();
    if (this.dragOriginInsideHost(e.relatedTarget)) return;

    this.dragDepth += 1;
    this.active.set(true);
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(e: DragEvent) {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }
    e.preventDefault();
    this.active.set(true);
    if (!this.dragDepth) this.dragDepth = 1;
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(e: DragEvent) {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }
    if (this.dragOriginInsideHost(e.relatedTarget)) return;

    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (!this.dragDepth) {
      this.active.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }
    e.preventDefault();
    this.resetDragState();
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
    inp.addEventListener('click', this.inputClickHandler);
    inp.addEventListener('change', this.inputChangeHandler);
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

  private dragOriginInsideHost(relatedTarget: EventTarget | null): boolean {
    return relatedTarget instanceof Node && this.host.contains(relatedTarget);
  }

  private resetDragState(): void {
    this.dragDepth = 0;
    this.active.set(false);
  }

  ngOnDestroy(): void {
    if (!this.fileInput) return;

    this.fileInput.removeEventListener('click', this.inputClickHandler);
    this.fileInput.removeEventListener('change', this.inputChangeHandler);
    this.fileInput.remove();
    this.fileInput = undefined;
    this.resetDragState();
  }
}
