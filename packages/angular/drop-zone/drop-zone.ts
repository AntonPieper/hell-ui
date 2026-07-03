import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/** Public parts of the HellDropZone module, styleable through its Part Style Map. */
export type HellDropZonePart = 'root';
/** Part Style Map accepted by the HellDropZone `ui` input. */
export type HellDropZoneUi = HellUi<HellDropZonePart>;

const HELL_DROP_ZONE_RECIPE = {
  root: 'flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-hell-3 rounded-lg border-[1.5px] border-dashed border-hell-border-strong bg-hell-surface-subtle p-hell-7 text-center text-hell-foreground-muted transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-active:border-hell-primary data-active:bg-hell-primary-soft data-active:text-hell-primary data-[dragover]:border-hell-primary data-[dragover]:bg-hell-primary-soft data-[dragover]:text-hell-primary data-disabled:cursor-not-allowed data-disabled:opacity-60',
} satisfies HellRecipe<HellDropZonePart>;

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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-active]': 'active() && !disabled() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    role: 'button',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class HellDropZone implements OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDropZonePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDropZonePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DROP_ZONE_RECIPE,
  });

  /** Disables interaction and drag/drop handling. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Allows selecting or dropping more than one file. Defaults to `true`. */
  readonly multiple = input(true, { transform: booleanAttribute });
  /** Comma-separated list of accepted file extensions or MIME types. Defaults to `null` (no restriction). */
  readonly accept = input<string | null>(null);
  /** Consumer-owned native file input (element or its ID) to bind instead of the auto-created fallback. Defaults to `null`. */
  readonly nativeInput = input<HTMLInputElement | string | null>(null);

  /** Emits the accepted files once the user drops or selects them. */
  readonly files = output<File[]>();

  /** Whether a dragged file is currently over the drop zone. */
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

  /** Opens the file picker unless the zone is disabled or the click originated from the input itself. */
  protected onClick(event?: MouseEvent) {
    if (event?.target === this.fileInput) return;
    event?.preventDefault();
    if (this.disabled()) return;
    this.ensureInput().click();
  }

  /** Activates the file picker on Enter/Space, mirroring native button behavior. */
  protected onKey(e: Event) {
    if (this.disabled()) return;
    e.preventDefault();
    this.onClick();
  }

  /** Tracks drag depth and marks the zone active when a drag enters it. */
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

  /** Keeps the zone marked active while a drag remains over it. */
  protected onDragOver(e: DragEvent) {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }
    e.preventDefault();
    this.active.set(true);
    if (!this.dragDepth) this.dragDepth = 1;
  }

  /** Reduces drag depth and clears the active state once the drag fully leaves the zone. */
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

  /** Resets drag state and emits the dropped files that match `accept`. */
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

  /** Unbinds the native input and removes the auto-created fallback input. */
  ngOnDestroy(): void {
    if (this.nativeInputBound) this.unbindInput(this.nativeInputBound);

    this.fallbackInput?.remove();
    this.nativeInputBound = undefined;
    this.fileInput = undefined;
    this.fallbackInput = undefined;
    this.resetDragState();
  }
}
