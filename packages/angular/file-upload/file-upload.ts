import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidCheck,
  faSolidFile,
  faSolidTriangleExclamation,
  faSolidUpload,
} from '@ng-icons/font-awesome/solid';
import { NgpProgress } from 'ng-primitives/progress';
import {
  hellCreateLabels,
  hellPartStyler,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellDropZone } from '@hell-ui/angular/drop-zone';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import type { InjectionToken, OutputEmitterRef, Provider } from '@angular/core';

/**
 * Lifecycle state of one file in the managed list. The consumer owns every
 * transition; the component only renders the state it is handed.
 */
export type HellFileUploadStatus = 'pending' | 'uploading' | 'done' | 'error';

/**
 * One entry in the controlled file list. The consumer holds the array and
 * feeds transport state (`status`, `progress`, `error`) in; the component
 * never mutates an item.
 */
export interface HellFileUploadItem {
  /** Stable identity used by the remove/retry outputs and list tracking. */
  readonly id: string;
  /** Original file; optional once the upload has completed and it is dropped. */
  readonly file?: File;
  /** Display name shown in the list. */
  readonly name: string;
  /** Size in bytes shown in the item meta. */
  readonly size: number;
  /** Transport state driving which affordances render. */
  readonly status: HellFileUploadStatus;
  /** Upload fraction from `0` to `1`, rendered as a progressbar while uploading. */
  readonly progress?: number;
  /** Human-readable failure reason rendered while `status` is `error`. */
  readonly error?: string;
}

/** Machine-readable reason a file failed validation, emitted with `rejected`. */
export type HellFileUploadRejectionReason = 'type' | 'size' | 'count';

/** Payload of the `rejected` output: the offending file plus why it failed. */
export interface HellFileUploadRejection {
  /** The file that failed validation. */
  readonly file: File;
  /** Why the file was rejected. */
  readonly reason: HellFileUploadRejectionReason;
}

/** Built-in strings owned by the file-upload entry point's Label Contract. */
export interface HellFileUploadLabels {
  /** Label of the built-in Browse button. */
  readonly browse: string;
  /** Prompt shown inside the drop zone; also its accessible name. */
  readonly hint: string;
  /** Accessible name for an item's remove button, given the file name. */
  readonly remove: (name: string) => string;
  /** Accessible name for a failed item's retry button, given the file name. */
  readonly retry: (name: string) => string;
  /** Accessible name for an item's progressbar, given the file name. */
  readonly progress: (name: string) => string;
  /** Inline reason for a file rejected by the accept list. */
  readonly rejectedType: (name: string) => string;
  /** Inline reason for a file rejected for exceeding `maxBytes`. */
  readonly rejectedSize: (name: string, maxBytes: number) => string;
  /** Inline reason for a file rejected for exceeding `maxFiles`. */
  readonly rejectedCount: (name: string, maxFiles: number) => string;
  /** Status text shown while an item is uploading. */
  readonly statusUploading: string;
  /** Status text shown while an item is waiting to upload. */
  readonly statusPending: string;
  /** Status text shown once an item is done. */
  readonly statusDone: string;
  /** Status text shown while an item is in error. */
  readonly statusError: string;
  /** Polite announcement made when files are accepted. */
  readonly addedAnnouncement: (count: number) => string;
  /** Polite announcement made when files are rejected. */
  readonly rejectedAnnouncement: (count: number) => string;
  /** Polite announcement made when an item transitions to done. */
  readonly doneAnnouncement: (name: string) => string;
  /** Polite announcement made when an item transitions to error. */
  readonly errorAnnouncement: (name: string) => string;
}

const HELL_FILE_UPLOAD_LABELS_CONTRACT = hellCreateLabels<HellFileUploadLabels>(
  'HELL_FILE_UPLOAD_LABELS',
  {
    browse: 'Browse files',
    hint: 'Drag files here, or use the button below',
    remove: (name) => `Remove ${name}`,
    retry: (name) => `Retry ${name}`,
    progress: (name) => `${name} upload progress`,
    rejectedType: (name) => `${name} is not an accepted file type`,
    rejectedSize: (name, maxBytes) => `${name} is larger than the ${hellFormatBytes(maxBytes)} limit`,
    rejectedCount: (name, maxFiles) =>
      `${name} exceeds the limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'}`,
    statusPending: 'Pending',
    statusUploading: 'Uploading',
    statusDone: 'Done',
    statusError: 'Failed',
    addedAnnouncement: (count) => `${count} file${count === 1 ? '' : 's'} added`,
    rejectedAnnouncement: (count) => `${count} file${count === 1 ? '' : 's'} rejected`,
    doneAnnouncement: (name) => `${name} uploaded`,
    errorAnnouncement: (name) => `${name} failed to upload`,
  },
);

/** Injection token resolving to the effective file-upload labels. */
export const HELL_FILE_UPLOAD_LABELS: InjectionToken<HellFileUploadLabels> =
  HELL_FILE_UPLOAD_LABELS_CONTRACT.token;

/** Override any subset of the file-upload labels for an injector scope. */
export function provideHellFileUploadLabels(overrides: Partial<HellFileUploadLabels>): Provider {
  return HELL_FILE_UPLOAD_LABELS_CONTRACT.provide(overrides);
}

/** Public parts of the HellFileUpload module, styleable through its Part Style Map. */
export type HellFileUploadPart =
  | 'root'
  | 'dropzone'
  | 'browse'
  | 'list'
  | 'item'
  | 'itemIcon'
  | 'itemName'
  | 'itemMeta'
  | 'itemProgress'
  | 'itemError'
  | 'itemRemove'
  | 'itemRetry';
/** Part Style Map accepted by the HellFileUpload `ui` input. */
export type HellFileUploadUi = HellUi<HellFileUploadPart>;

const HELL_FILE_UPLOAD_ITEM_ACTION =
  'inline-flex aspect-square h-[1.75rem] shrink-0 cursor-pointer items-center justify-center rounded-hell-md border-0 bg-transparent p-0 text-hell-foreground-muted opacity-80 transition-[background-color,color,opacity] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] outline-none hover:bg-hell-foreground/10 hover:text-hell-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

const HELL_FILE_UPLOAD_RECIPE = {
  root: 'flex w-full flex-col gap-hell-4',
  dropzone: '',
  browse: 'self-start',
  list: 'm-0 flex list-none flex-col gap-hell-2 p-0',
  item: 'flex items-center gap-hell-3 rounded-hell-lg border border-solid border-hell-border bg-hell-surface-subtle p-hell-3 data-[status=rejected]:border-hell-danger data-[status=rejected]:bg-hell-danger-soft data-[status=error]:border-hell-danger',
  itemIcon:
    'flex shrink-0 items-center text-hell-foreground-subtle data-[status=done]:text-hell-success data-[status=error]:text-hell-danger data-[status=rejected]:text-hell-danger',
  itemName: 'min-w-0 flex-1 truncate text-sm font-medium text-hell-foreground',
  itemMeta: 'shrink-0 text-xs text-hell-foreground-muted',
  itemProgress: 'mt-hell-2 w-full',
  itemError: 'm-0 mt-hell-1 w-full text-xs text-hell-danger',
  itemRemove: HELL_FILE_UPLOAD_ITEM_ACTION,
  itemRetry: HELL_FILE_UPLOAD_ITEM_ACTION,
} satisfies HellRecipe<HellFileUploadPart>;

/** How long a transient inline rejection row stays visible before it clears. */
const HELL_FILE_UPLOAD_REJECTION_DISMISS_MS = 6000;

function hellFormatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${units[exponent]}`;
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
 * `hell-file-upload` — a drop-zone composite with a managed, fully controlled
 * file list.
 *
 * Users add files by drag-drop or the built-in Browse button (multi-file is
 * first-class, with an optional `maxFiles` cap), and each accepted item renders
 * the consumer-fed state — name, size, a progressbar while uploading, a
 * done/error status, an error message, and Remove/Retry affordances. The
 * component performs no HTTP and never mutates item state: `items` is a
 * controlled input, and `filesAdded`/`rejected`/`removed`/`retried` are the
 * whole seam (the TanStack-shell philosophy — Hell owns the chrome, the
 * consumer owns the engine). Retry emits `retried` with the item id; the
 * consumer resets that item's status/progress.
 *
 * Validation (accept extensions and MIME, `maxBytes`, `maxFiles`) runs
 * identically for the drop and browse paths; each violation emits `rejected`
 * with a machine-readable reason and renders a transient inline rejection row
 * with the Label Contract reason (not a toast). Additions, rejections, and
 * done/error transitions are announced politely through the CDK LiveAnnouncer,
 * and per-file progress carries progressbar semantics from the progress
 * primitive. The hidden input's `multiple` is derived from `maxFiles`
 * (single-file when `maxFiles === 1`).
 *
 * Usage:
 *   <hell-file-upload
 *     [items]="items()"
 *     accept=".pdf,image/*"
 *     [maxBytes]="5 * 1024 * 1024"
 *     [maxFiles]="10"
 *     (filesAdded)="enqueue($event)"
 *     (rejected)="note($event)"
 *     (removed)="cancel($event)"
 *     (retried)="retry($event)"
 *   />
 */
@Component({
  selector: 'hell-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellDropZone,
    HellButton,
    HellIcon,
    HellProgress,
    HellProgressBar,
    NgpProgress,
  ],
  providers: [
    provideIcons({ faSolidCheck, faSolidFile, faSolidTriangleExclamation, faSolidUpload }),
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
  template: `
    <input
      #picker
      type="file"
      hidden
      tabindex="-1"
      aria-hidden="true"
    />

    <div
      hellDropzone
      data-slot="dropzone"
      [ui]="part('dropzone')"
      [multiple]="multiple()"
      [accept]="null"
      [disabled]="disabled()"
      [nativeInput]="picker"
      [attr.aria-label]="labels.hint"
      (files)="onFiles($event)"
    >
      <hell-icon name="faSolidUpload" size="1.75em" />
      <span>{{ labels.hint }}</span>
    </div>

    <button
      hellButton
      type="button"
      variant="default"
      size="sm"
      data-slot="browse"
      [ui]="part('browse')"
      [disabled]="disabled()"
      (click)="openPicker(picker)"
    >
      {{ labels.browse }}
    </button>

    @if (items().length || rejections().length) {
      <ul data-slot="list" [class]="part('list')">
        @for (rejection of rejections(); track rejection.id) {
          <li data-slot="item" data-status="rejected" [class]="part('item')">
            <hell-icon
              data-slot="itemIcon"
              data-status="rejected"
              [ui]="part('itemIcon')"
              name="faSolidTriangleExclamation"
              size="1.25em"
            />
            <div class="flex min-w-0 flex-1 flex-col">
              <span data-slot="itemName" [class]="part('itemName')">{{ rejection.name }}</span>
              <p data-slot="itemError" [class]="part('itemError')">{{ rejection.message }}</p>
            </div>
          </li>
        }
        @for (item of items(); track item.id) {
          <li data-slot="item" [attr.data-status]="item.status" [class]="part('item')">
            <hell-icon
              data-slot="itemIcon"
              [attr.data-status]="item.status"
              [ui]="part('itemIcon')"
              [name]="iconName(item.status)"
              size="1.25em"
            />
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex items-center gap-hell-2">
                <span data-slot="itemName" [class]="part('itemName')">{{ item.name }}</span>
                <span data-slot="itemMeta" [class]="part('itemMeta')">
                  {{ formatSize(item.size) }}{{ statusSuffix(item.status) }}
                </span>
              </div>
              @if (item.status === 'uploading') {
                <!-- Match NgpProgress directly so its aliased value input is
                     visible to separate-entrypoint AOT. Angular de-duplicates
                     it with the NgpProgress host directive on HellProgress. -->
                <div
                  hellProgress
                  ngpProgress
                  data-slot="itemProgress"
                  [ui]="part('itemProgress')"
                  [ngpProgressValue]="progressValue(item)"
                  [attr.aria-label]="labels.progress(item.name)"
                >
                  <div hellProgressBar></div>
                </div>
              }
              @if (item.status === 'error' && item.error) {
                <p data-slot="itemError" [class]="part('itemError')">{{ item.error }}</p>
              }
            </div>
            <div class="flex shrink-0 items-center gap-hell-1">
              @if (item.status === 'error') {
                <button
                  type="button"
                  data-slot="itemRetry"
                  [class]="part('itemRetry')"
                  [disabled]="disabled()"
                  [attr.aria-label]="labels.retry(item.name)"
                  (click)="retried.emit(item.id)"
                ></button>
              }
              <button
                type="button"
                data-slot="itemRemove"
                [class]="part('itemRemove')"
                [disabled]="disabled()"
                [attr.aria-label]="labels.remove(item.name)"
                (click)="removed.emit(item.id)"
              ></button>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class HellFileUpload {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellFileUploadPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellFileUploadPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FILE_UPLOAD_RECIPE,
  });

  /**
   * Controlled file list. The consumer holds the array and feeds per-file
   * transport state in; the component renders it and never mutates it.
   */
  readonly items = input<readonly HellFileUploadItem[]>([]);

  /**
   * Comma-separated accepted file extensions (`.pdf`) and/or MIME types
   * (`image/png`, `image/*`). A file must match at least one token. `null`
   * (default) accepts any type.
   */
  readonly accept = input<string | null>(null);

  /** Maximum accepted size per file in bytes. `null` (default) sets no size limit. */
  readonly maxBytes = input<number | null, number | string | null>(null, {
    transform: (value) => (value == null || value === '' ? null : numberAttribute(value)),
  });

  /**
   * Maximum number of items in the list. `null` (default) sets no count limit;
   * `1` makes the control single-file. Also derives the hidden input's
   * `multiple` attribute.
   */
  readonly maxFiles = input<number | null, number | string | null>(null, {
    transform: (value) => (value == null || value === '' ? null : numberAttribute(value)),
  });

  /** Disables the drop zone, Browse button, and per-item actions. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits the files that passed validation. The consumer performs the transfer. */
  readonly filesAdded: OutputEmitterRef<File[]> = output<File[]>();

  /** Emits once per file that failed validation, with a machine-readable reason. */
  readonly rejected: OutputEmitterRef<HellFileUploadRejection> = output<HellFileUploadRejection>();

  /** Emits the id of the item whose Remove button was activated. */
  readonly removed: OutputEmitterRef<string> = output<string>();

  /** Emits the id of the item whose Retry button was activated. */
  readonly retried: OutputEmitterRef<string> = output<string>();

  /** Effective labels for built-in strings, rejection reasons, and announcements. */
  protected readonly labels = inject(HELL_FILE_UPLOAD_LABELS);

  private readonly announcer = inject(LiveAnnouncer);

  /** Whether the hidden input and drop zone accept multiple files (`maxFiles !== 1`). */
  protected readonly multiple = computed(() => this.maxFiles() !== 1);

  private readonly transientRejections = signal<
    readonly { readonly id: number; readonly name: string; readonly message: string }[]
  >([]);
  /** Transient inline rejection rows, rendered above the controlled items. */
  protected readonly rejections = this.transientRejections.asReadonly();

  private rejectionSeq = 0;
  private readonly rejectionTimers = new Set<ReturnType<typeof setTimeout>>();
  private previousStatuses: Map<string, HellFileUploadStatus> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.rejectionTimers) clearTimeout(timer);
      this.rejectionTimers.clear();
    });

    // Announce done/error transitions politely through the CDK LiveAnnouncer,
    // never as a live region on the list itself: the message reads once and
    // never interrupts the consumer's focus.
    effect(() => {
      const items = this.items();
      const next = new Map<string, HellFileUploadStatus>();
      for (const item of items) next.set(item.id, item.status);

      const previous = this.previousStatuses;
      if (previous) {
        for (const item of items) {
          const before = previous.get(item.id);
          if (before === undefined || before === item.status) continue;
          if (item.status === 'done') {
            void this.announcer.announce(this.labels.doneAnnouncement(item.name), 'polite');
          } else if (item.status === 'error') {
            void this.announcer.announce(this.labels.errorAnnouncement(item.name), 'polite');
          }
        }
      }
      this.previousStatuses = next;
    });
  }

  /** Opens the shared hidden file input from the Browse button. */
  protected openPicker(input: HTMLInputElement): void {
    if (this.disabled()) return;
    input.click();
  }

  /** Validates a batch (drop or browse) and emits `filesAdded`/`rejected`. */
  protected onFiles(files: readonly File[]): void {
    if (this.disabled() || !files.length) return;

    const accepted: File[] = [];
    const rejections: { readonly id: number; readonly name: string; readonly message: string }[] =
      [];
    const maxBytes = this.maxBytes();
    const maxFiles = this.maxFiles();
    let slots =
      maxFiles == null ? Number.POSITIVE_INFINITY : Math.max(0, maxFiles - this.items().length);

    for (const file of files) {
      if (!hellFileMatchesAccept(file, this.accept())) {
        rejections.push(this.rejection(file, 'type', this.labels.rejectedType(file.name)));
        continue;
      }
      if (maxBytes != null && file.size > maxBytes) {
        rejections.push(this.rejection(file, 'size', this.labels.rejectedSize(file.name, maxBytes)));
        continue;
      }
      if (slots <= 0) {
        rejections.push(
          this.rejection(file, 'count', this.labels.rejectedCount(file.name, maxFiles ?? 0)),
        );
        continue;
      }
      accepted.push(file);
      slots -= 1;
    }

    const announcements: string[] = [];
    if (accepted.length) {
      this.filesAdded.emit(accepted);
      announcements.push(this.labels.addedAnnouncement(accepted.length));
    }
    if (rejections.length) {
      this.showRejections(rejections);
      announcements.push(this.labels.rejectedAnnouncement(rejections.length));
    }
    if (announcements.length) {
      void this.announcer.announce(announcements.join('. '), 'polite');
    }
  }

  private rejection(
    file: File,
    reason: HellFileUploadRejectionReason,
    message: string,
  ): { readonly id: number; readonly name: string; readonly message: string } {
    this.rejected.emit({ file, reason });
    return { id: this.rejectionSeq++, name: file.name, message };
  }

  private showRejections(
    rejections: readonly { readonly id: number; readonly name: string; readonly message: string }[],
  ): void {
    this.transientRejections.update((current) => [...current, ...rejections]);
    const ids = new Set(rejections.map((rejection) => rejection.id));
    const timer = setTimeout(() => {
      this.rejectionTimers.delete(timer);
      this.transientRejections.update((current) =>
        current.filter((rejection) => !ids.has(rejection.id)),
      );
    }, HELL_FILE_UPLOAD_REJECTION_DISMISS_MS);
    this.rejectionTimers.add(timer);
  }

  /** Human-readable size for the item meta. */
  protected formatSize(bytes: number): string {
    return hellFormatBytes(bytes);
  }

  /** Trailing Label Contract status word appended to the item meta. */
  protected statusSuffix(status: HellFileUploadStatus): string {
    switch (status) {
      case 'pending':
        return ` · ${this.labels.statusPending}`;
      case 'uploading':
        return ` · ${this.labels.statusUploading}`;
      case 'done':
        return ` · ${this.labels.statusDone}`;
      case 'error':
        return ` · ${this.labels.statusError}`;
    }
  }

  /** Built-in decorative icon for a consumer-controlled upload state. */
  protected iconName(status: HellFileUploadStatus): string {
    switch (status) {
      case 'done':
        return 'faSolidCheck';
      case 'error':
        return 'faSolidTriangleExclamation';
      default:
        return 'faSolidFile';
    }
  }

  /** Progress percentage (0–100) for the progressbar, clamped from the `0–1` fraction. */
  protected progressValue(item: HellFileUploadItem): number {
    const fraction = item.progress ?? 0;
    return Math.max(0, Math.min(100, Math.round(fraction * 100)));
  }
}
