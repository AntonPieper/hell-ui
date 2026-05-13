import { HellStyleable } from '../../core/styleable';
import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  booleanAttribute,
  effect,
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
 * files or selects them via a native `<input type="file">`.
 *
 * By default, a hidden input is auto-created and managed by the directive. For
 * tighter control, bind `nativeInput` to a consumer-owned file input (or its
 * ID string), while keeping the compatibility fallback when not provided.
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
  readonly nativeInput = input<HTMLInputElement | string | null>(null);

  readonly files = output<File[]>();

  protected readonly active = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private fileInput?: HTMLInputElement;
  private nativeInputBound?: HTMLInputElement;
  private fallbackInput?: HTMLInputElement;
  private dragDepth = 0;

  private readonly inputClickHandler = (event: MouseEvent) => event.stopPropagation();
  private readonly inputChangeHandler = (event?: Event) => {
    const input = event?.target instanceof HTMLInputElement ? event.target : this.fileInput;
    if (!input) return;
    if (!this.disabled() && input.files?.length) {
      const files = this.filterFiles(input.files);
      if (files.length) this.files.emit(files);
    }
    input.value = '';
  };

  constructor() {
    super();
    effect(() => {
      const configuredInput = this.resolveNativeInput();
      if (configuredInput) {
        this.fileInput = configuredInput;
        this.bindInput(configuredInput);
        this.syncInput(configuredInput);
        return;
      }

      if (this.nativeInputBound && this.nativeInputBound !== this.fallbackInput) {
        const previousInput = this.nativeInputBound;
        this.unbindInput(previousInput);
        if (this.fileInput === previousInput) this.fileInput = undefined;
      }

      if (this.fallbackInput) {
        this.fileInput = this.fallbackInput;
        this.bindInput(this.fallbackInput);
        this.syncInput(this.fallbackInput);
      }
    });
  }

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
    const configuredInput = this.resolveNativeInput();
    const input = configuredInput ?? this.ensureFallbackInput();

    this.fileInput = input;
    this.bindInput(input);
    this.syncInput(input);
    return input;
  }

  private resolveNativeInput(): HTMLInputElement | null {
    const providedInput = this.nativeInput();
    if (!providedInput) return null;

    const candidate =
      typeof providedInput === 'string'
        ? this.host.ownerDocument.getElementById(providedInput)
        : providedInput;

    return candidate instanceof HTMLInputElement && candidate.type === 'file'
      ? candidate
      : null;
  }

  private ensureFallbackInput(): HTMLInputElement {
    if (this.fallbackInput) return this.fallbackInput;

    const inp = this.host.ownerDocument.createElement('input');
    inp.type = 'file';
    inp.hidden = true;
    inp.tabIndex = -1;
    this.host.appendChild(inp);
    this.fallbackInput = inp;
    return inp;
  }

  private bindInput(input: HTMLInputElement): void {
    if (this.nativeInputBound === input) return;

    if (this.nativeInputBound) this.unbindInput(this.nativeInputBound);

    input.addEventListener('click', this.inputClickHandler);
    input.addEventListener('change', this.inputChangeHandler);
    this.nativeInputBound = input;
  }

  private unbindInput(input: HTMLInputElement): void {
    input.removeEventListener('click', this.inputClickHandler);
    input.removeEventListener('change', this.inputChangeHandler);
    if (this.nativeInputBound === input) this.nativeInputBound = undefined;
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
    if (this.nativeInputBound) this.unbindInput(this.nativeInputBound);

    this.fallbackInput?.remove();
    this.nativeInputBound = undefined;
    this.fileInput = undefined;
    this.fallbackInput = undefined;
    this.resetDragState();
  }
}
