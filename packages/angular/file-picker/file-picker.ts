import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

import {
  hellCreateLabels, type HellLabels,
  hellPartStyler,
  type HellRecipe,
  type HellUiInput,
} from 'hell-ui/core';
import type { InjectionToken } from '@angular/core';

/** Why one acquired file was rejected. */
export type HellFileRejectionReason = 'type' | 'size' | 'count' | 'custom';

/** One file that failed File Picker validation. */
export interface HellFileRejection {
  /** The file that failed validation. */
  readonly file: File;
  /** The validation rule that rejected the file. */
  readonly reason: HellFileRejectionReason;
  /** Human-readable detail from the Label Contract or custom validator. */
  readonly message?: string;
}

/** The complete result of one drop or native browse acquisition. */
export interface HellFileSelection {
  /** Valid files admitted by the per-batch count limit, in acquisition order. */
  readonly accepted: readonly File[];
  /** Invalid or overflow files, in acquisition order. */
  readonly rejected: readonly HellFileRejection[];
}

/**
 * Synchronous consumer validation for one file. Return `null` or `undefined`
 * to accept it, or a message to reject it with reason `custom`.
 */
export type HellFileValidator = (file: File) => string | null | undefined;

/** Built-in strings owned by the File Picker entry point's Label Contract. */
export interface HellFilePickerLabels {
  /** Detail for a file that does not match the configured `accept` tokens. */
  readonly rejectedType: (name: string) => string;
  /** Detail for a file larger than the configured per-file byte limit. */
  readonly rejectedSize: (name: string, maxBytes: number) => string;
  /** Detail for a valid file beyond the effective per-batch count limit. */
  readonly rejectedCount: (name: string, maxFiles: number) => string;
  /** Polite announcement made when files are accepted. */
  readonly acceptedAnnouncement: (count: number) => string;
  /** Polite announcement made when files are rejected. */
  readonly rejectedAnnouncement: (count: number) => string;
}

/** Injection token resolving to the effective File Picker labels. */
export const HELL_FILE_PICKER_LABELS: InjectionToken<HellLabels<HellFilePickerLabels>> =
  hellCreateLabels<HellFilePickerLabels>('HELL_FILE_PICKER_LABELS', {
    rejectedType: (name) => `${name} is not an accepted file type`,
    rejectedSize: (name, maxBytes) =>
      `${name} is larger than the ${hellFormatBytes(maxBytes)} limit`,
    rejectedCount: (name, maxFiles) =>
      `${name} exceeds the per-batch limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'}`,
    acceptedAnnouncement: (count) =>
      `${count} file${count === 1 ? '' : 's'} accepted`,
    rejectedAnnouncement: (count) =>
      `${count} file${count === 1 ? '' : 's'} rejected`,
  });

const HELL_FILE_PICKER_RECIPE = {
  root: 'flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-hell-3 rounded-hell-lg border-[1.5px] border-dashed border-hell-border-strong bg-hell-surface-subtle p-hell-7 text-center text-hell-foreground-muted transition-[background-color,border-color,color] duration-[var(--hell-duration-fast)] ease-hell-out outline-none hover:border-hell-primary hover:bg-hell-primary-soft/50 focus-visible:border-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 data-[dragging=true]:border-hell-primary data-[dragging=true]:bg-hell-primary-soft data-[dragging=true]:text-hell-primary data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:hover:border-hell-border-strong data-[disabled=true]:hover:bg-hell-surface-subtle',
} satisfies HellRecipe<'root'>;

const HELL_FILE_PICKER_INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'summary',
  'textarea',
  '[tabindex]',
].join(', ');

const HELL_FILE_PICKER_ACTION_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
  'treeitem',
]);

function hellFormatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${units[exponent]}`;
}

function hellNullableNumber(value: number | string | null): number | null {
  return value == null || value === '' ? null : numberAttribute(value);
}

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
 * File acquisition and validation behavior for a consumer-owned host.
 *
 * Clicking the host, pressing Enter/Space while it is focused, or calling
 * `open()` launches one internal native file input. Dropping files and native
 * selection both emit one `HellFileSelection`; validation never owns or reads
 * an accumulated upload queue. `maxFiles` limits only the current batch.
 */
@Directive({
  selector: '[hellFilePicker]',
  exportAs: 'hellFilePicker',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'button',
    '[attr.data-dragging]': 'dragging() && !disabled() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '(click)': 'onHostClick($event)',
    '(keydown)': 'onHostKeydown($event)',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class HellFilePicker implements OnDestroy {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FILE_PICKER_RECIPE,
  });

  /**
   * Comma-separated file extensions, exact MIME types, or MIME families used
   * as both a native chooser hint and a validation rule.
   */
  readonly accept = input<string | null>(null);

  /** Whether one acquisition may contain multiple files. Defaults to `true`. */
  readonly multiple = input(true, { transform: booleanAttribute });

  /** Maximum size of each accepted file in bytes. `null` sets no limit. */
  readonly maxBytes = input<number | null, number | string | null>(null, {
    transform: hellNullableNumber,
  });

  /** Maximum number of valid files accepted from one batch. `null` sets no limit. */
  readonly maxFiles = input<number | null, number | string | null>(null, {
    transform: hellNullableNumber,
  });

  /** Disables native browse, keyboard, and drag/drop acquisition. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Optional synchronous per-file validation after type and size checks. */
  readonly validate = input<HellFileValidator | null>(null);

  /** Emits once for every enabled native change or drop acquisition. */
  readonly selection = output<HellFileSelection>();

  /** Whether a file drag is currently contained by the host. */
  protected readonly dragging = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly labels = inject(HELL_FILE_PICKER_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private fileInput?: HTMLInputElement;
  private dragDepth = 0;

  private readonly inputClickHandler = (event: MouseEvent): void => event.stopPropagation();
  private readonly inputChangeHandler = (): void => {
    const input = this.fileInput;
    if (!input) return;

    try {
      if (!this.disabled()) this.emitSelection(this.normalizeFiles(input.files));
    } finally {
      // Native inputs suppress a same-file change unless their value is reset.
      input.value = '';
    }
  };

  constructor() {
    effect(() => {
      const disabled = this.disabled();
      const multiple = this.multiple();
      const accept = this.accept()?.trim() ?? '';

      if (disabled) this.resetDragState();
      if (this.fileInput) this.syncInput(this.fileInput, { accept, disabled, multiple });
    });
  }

  /** Opens the internal native chooser when the picker is enabled. */
  open(): void {
    if (this.disabled()) return;

    const input = this.ensureInput();
    input.value = '';
    input.click();
  }

  /** Opens the native chooser when the consumer-owned root is clicked. */
  protected onHostClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.target === this.fileInput ||
      this.startedInInteractiveDescendant(event)
    ) {
      return;
    }
    this.open();
  }

  /** Mirrors native button activation without stealing keys from child controls. */
  protected onHostKeydown(event: KeyboardEvent): void {
    if (event.target !== this.host || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (this.disabled()) return;
    event.preventDefault();
    this.open();
  }

  /** Starts drag state without flickering when the pointer crosses child boundaries. */
  protected onDragEnter(event: DragEvent): void {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }

    event.preventDefault();
    if (this.relatedTargetIsInside(event.relatedTarget)) return;
    this.dragDepth += 1;
    this.dragging.set(true);
  }

  /** Keeps the host eligible as a file drop target. */
  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }

    event.preventDefault();
    if (!this.dragDepth) this.dragDepth = 1;
    this.dragging.set(true);
  }

  /** Clears drag state only after the drag leaves the complete host. */
  protected onDragLeave(event: DragEvent): void {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }
    if (this.relatedTargetIsInside(event.relatedTarget)) return;

    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (!this.dragDepth) this.dragging.set(false);
  }

  /** Normalizes and validates one DataTransfer batch. */
  protected onDrop(event: DragEvent): void {
    if (this.disabled()) {
      this.resetDragState();
      return;
    }

    event.preventDefault();
    this.resetDragState();
    this.emitSelection(this.normalizeFiles(event.dataTransfer?.files));
  }

  private ensureInput(): HTMLInputElement {
    if (this.fileInput) {
      this.syncInput(this.fileInput);
      return this.fileInput;
    }

    const input = this.host.ownerDocument.createElement('input');
    input.type = 'file';
    input.hidden = true;
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.addEventListener('click', this.inputClickHandler);
    input.addEventListener('change', this.inputChangeHandler);
    this.host.appendChild(input);
    this.fileInput = input;
    this.syncInput(input);
    return input;
  }

  private syncInput(
    input: HTMLInputElement,
    state: {
      readonly accept: string;
      readonly disabled: boolean;
      readonly multiple: boolean;
    } = {
      accept: this.accept()?.trim() ?? '',
      disabled: this.disabled(),
      multiple: this.multiple(),
    },
  ): void {
    input.disabled = state.disabled;
    input.multiple = state.multiple;
    input.accept = state.accept;
    if (!state.accept) input.removeAttribute('accept');
  }

  private normalizeFiles(files: FileList | null | undefined): readonly File[] {
    return files ? Array.from(files) : [];
  }

  private emitSelection(files: readonly File[]): void {
    const accepted: File[] = [];
    const rejected: HellFileRejection[] = [];
    const maxBytes = this.normalizedMaxBytes();
    const maxFiles = this.effectiveBatchLimit();
    const validate = this.validate();

    for (const file of files) {
      if (!hellFileMatchesAccept(file, this.accept())) {
        rejected.push({
          file,
          reason: 'type',
          message: this.labels.rejectedType(file.name),
        });
        continue;
      }

      if (maxBytes !== null && file.size > maxBytes) {
        rejected.push({
          file,
          reason: 'size',
          message: this.labels.rejectedSize(file.name, maxBytes),
        });
        continue;
      }

      const customMessage = validate?.(file);
      if (customMessage != null) {
        rejected.push({ file, reason: 'custom', message: customMessage });
        continue;
      }

      if (accepted.length >= maxFiles) {
        rejected.push({
          file,
          reason: 'count',
          message: this.labels.rejectedCount(file.name, maxFiles),
        });
        continue;
      }

      accepted.push(file);
    }

    this.selection.emit({ accepted, rejected });
    this.announceSelection(accepted.length, rejected.length);
  }

  private announceSelection(accepted: number, rejected: number): void {
    const messages: string[] = [];
    if (accepted) messages.push(this.labels.acceptedAnnouncement(accepted));
    if (rejected) messages.push(this.labels.rejectedAnnouncement(rejected));
    if (messages.length) void this.announcer.announce(messages.join('. '), 'polite');
  }

  private normalizedMaxBytes(): number | null {
    const value = this.maxBytes();
    if (value === null) return null;
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, value);
  }

  private effectiveBatchLimit(): number {
    const configured = this.maxFiles();
    const maxFiles =
      configured === null
        ? Number.POSITIVE_INFINITY
        : Number.isFinite(configured)
          ? Math.max(0, Math.floor(configured))
          : 0;
    return this.multiple() ? maxFiles : Math.min(1, maxFiles);
  }

  private relatedTargetIsInside(target: EventTarget | null | undefined): boolean {
    if (!target || typeof (target as Node).nodeType !== 'number') return false;
    return this.host.contains(target);
  }

  private startedInInteractiveDescendant(event: MouseEvent): boolean {
    const ElementCtor = this.host.ownerDocument.defaultView?.Element;
    if (!ElementCtor) return false;

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    for (const target of path) {
      if (target === this.host) break;
      if (!(target instanceof ElementCtor)) continue;
      const element = target as Element;
      if (element.matches(HELL_FILE_PICKER_INTERACTIVE_SELECTOR)) return true;

      const contentEditable = element.getAttribute('contenteditable');
      if (contentEditable !== null && contentEditable.toLowerCase() !== 'false') return true;

      const role = element.getAttribute('role')?.trim().split(/\s+/)[0]?.toLowerCase();
      if (role && HELL_FILE_PICKER_ACTION_ROLES.has(role)) return true;
    }

    return false;
  }

  private resetDragState(): void {
    this.dragDepth = 0;
    this.dragging.set(false);
  }

  /** Removes the internal native input and its listeners. */
  ngOnDestroy(): void {
    if (this.fileInput) {
      this.fileInput.removeEventListener('click', this.inputClickHandler);
      this.fileInput.removeEventListener('change', this.inputChangeHandler);
      this.fileInput.remove();
      this.fileInput = undefined;
    }
    this.resetDragState();
  }
}
