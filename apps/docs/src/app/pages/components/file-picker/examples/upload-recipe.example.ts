import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

import { HELL_ALERT_DIRECTIVES } from '@hell-ui/angular/alert';
import { HellButton } from '@hell-ui/angular/button';
import {
  HellFilePicker,
  type HellFileRejection,
  type HellFileSelection,
  type HellFileValidator,
} from '@hell-ui/angular/file-picker';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadItem {
  readonly id: string;
  readonly file: File;
  readonly status: UploadStatus;
  readonly progress: number;
  readonly error?: string;
  readonly attempt: number;
  readonly failFirstAttempt: boolean;
}

interface UploadCapacityIssue {
  readonly file: File;
  readonly message: string;
}

const MAX_QUEUE_ITEMS = 4;
const UPLOAD_TICK_MS = 180;

@Component({
  selector: 'app-file-picker-upload-recipe-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_ALERT_DIRECTIVES,
    HellButton,
    HellFilePicker,
    HellProgress,
    HellProgressBar,
  ],
  template: `
    <section class="grid gap-hell-4" data-upload-recipe>
      <div
        #pickerHost
        hellFilePicker
        #picker="hellFilePicker"
        accept="image/*,application/pdf"
        [maxBytes]="maxBytes"
        [maxFiles]="4"
        [validate]="validate"
        aria-label="Add upload files"
        aria-describedby="file-picker-upload-hint"
        (selection)="enqueue($event)"
      >
        <strong>Drop files into the application queue</strong>
        <span id="file-picker-upload-hint" class="hd-muted">
          Images or PDF, at most 5 MB each. The application keeps four queue slots.
        </span>
      </div>

      <button hellButton type="button" size="sm" class="justify-self-start" (click)="picker.open()">
        Browse files
      </button>

      @if (rejections().length) {
        <hell-alert variant="danger" data-upload-rejections>
          <h3 hellAlertTitle>File Picker rejected some files</h3>
          <ul hellAlertDescription class="m-0 list-disc ps-hell-4">
            @for (rejection of rejections(); track rejection.file) {
              <li [attr.data-reason]="rejection.reason">
                {{ rejection.file.name }} &mdash; {{ rejection.message }}
              </li>
            }
          </ul>
        </hell-alert>
      }

      @if (capacityIssues().length) {
        <hell-alert
          variant="warning"
          role="status"
          aria-live="polite"
          data-upload-capacity-issues
        >
          <h3 hellAlertTitle>Some accepted files were not queued</h3>
          <ul hellAlertDescription class="m-0 list-disc ps-hell-4">
            @for (issue of capacityIssues(); track issue.file) {
              <li [attr.data-capacity-file]="issue.file.name">
                {{ issue.file.name }} &mdash; {{ issue.message }}
              </li>
            }
          </ul>
        </hell-alert>
      }

      <p
        class="m-0 min-h-hell-5 text-sm text-hell-foreground-muted"
        role="status"
        aria-live="polite"
        data-upload-announcement
      >
        {{ announcement() }}
      </p>

      @if (items().length) {
        <section class="grid gap-hell-2">
          <h3 id="file-picker-upload-queue-title" class="m-0 text-sm font-semibold">
            Application upload queue
          </h3>
          <ul
            class="m-0 grid list-none gap-hell-2 p-0"
            aria-labelledby="file-picker-upload-queue-title"
            data-upload-queue
          >
            @for (item of items(); track item.id) {
              <li
                class="grid min-w-0 gap-hell-2 rounded-hell-lg border border-solid border-hell-border bg-hell-surface-subtle p-hell-3"
                [attr.data-upload-item]="item.file.name"
                [attr.data-upload-status]="item.status"
              >
                <div class="grid min-w-0 gap-hell-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div class="grid min-w-0 gap-hell-1">
                    <strong class="break-all text-sm">{{ item.file.name }}</strong>
                    <span class="text-xs text-hell-foreground-muted">
                      {{ formatBytes(item.file.size) }} &middot; {{ statusLabel(item.status) }}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-hell-2">
                    @if (item.status === 'error') {
                      <button
                        hellButton
                        type="button"
                        size="xs"
                        variant="soft"
                        [attr.data-upload-retry]="item.file.name"
                        [attr.aria-label]="'Retry ' + item.file.name"
                        (click)="retry(item.id, removeButton)"
                      >
                        Retry
                      </button>
                    }
                    <button
                      #removeButton
                      hellButton
                      type="button"
                      size="xs"
                      variant="ghost"
                      [attr.data-upload-remove]="item.file.name"
                      [attr.aria-label]="'Remove ' + item.file.name"
                      (click)="remove(item.id, pickerHost)"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                @if (item.status === 'pending' || item.status === 'uploading') {
                  <div
                    hellProgress
                    [value]="item.progress"
                    [attr.aria-label]="item.file.name + ' upload progress'"
                  >
                    <div hellProgressBar></div>
                  </div>
                }

                @if (item.status === 'error') {
                  <p class="m-0 text-sm text-hell-danger" data-upload-error>
                    {{ item.error }}
                  </p>
                }
              </li>
            }
          </ul>
        </section>
      }
    </section>
  `,
})
export class FilePickerUploadRecipeExample {
  protected readonly maxBytes = 5 * 1024 * 1024;
  protected readonly validate: HellFileValidator = (file) =>
    file.size === 0 ? 'Empty files cannot be uploaded' : null;

  // Everything below this line is ordinary application workflow state. File
  // Picker supplies only the accepted/rejected acquisition result above.
  protected readonly items = signal<readonly UploadItem[]>([
    {
      id: 'seed-done',
      file: new File([new Uint8Array(284_140)], 'contract-signed.pdf', {
        type: 'application/pdf',
      }),
      status: 'done',
      progress: 100,
      attempt: 0,
      failFirstAttempt: false,
    },
    {
      id: 'seed-error',
      file: new File([new Uint8Array(1_248_400)], 'passport-scan.jpg', {
        type: 'image/jpeg',
      }),
      status: 'error',
      progress: 40,
      error: 'Upload failed (server returned 500). Try again.',
      attempt: 0,
      failFirstAttempt: true,
    },
  ]);
  protected readonly rejections = signal<readonly HellFileRejection[]>([]);
  protected readonly capacityIssues = signal<readonly UploadCapacityIssue[]>([]);
  protected readonly announcement = signal('');

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private sequence = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
    });
  }

  protected enqueue(selection: HellFileSelection): void {
    const available = Math.max(0, MAX_QUEUE_ITEMS - this.items().length);
    const queuedFiles = selection.accepted.slice(0, available);
    const capacityIssues = selection.accepted
      .slice(available)
      .map<UploadCapacityIssue>((file) => ({
        file,
        message: `The application upload queue is limited to ${MAX_QUEUE_ITEMS} files`,
      }));
    this.rejections.set(selection.rejected);
    this.capacityIssues.set(capacityIssues);

    const additions = queuedFiles.map<UploadItem>((file) => ({
      id: `upload-${this.sequence++}`,
      file,
      status: 'pending',
      progress: 0,
      attempt: 0,
      failFirstAttempt: file.name.toLowerCase().includes('server-error'),
    }));
    this.items.update((current) => [...current, ...additions]);
    for (const item of additions) this.schedule(item.id);
  }

  protected retry(id: string, focusTarget: HTMLButtonElement): void {
    const item = this.items().find((candidate) => candidate.id === id);
    if (!item || item.status !== 'error') return;

    this.patch(id, {
      status: 'pending',
      progress: 0,
      error: undefined,
      attempt: item.attempt + 1,
    });
    focusTarget.focus();
    this.announcement.set(`${item.file.name} retry started`);
    this.schedule(id);
  }

  protected remove(id: string, focusTarget: HTMLElement): void {
    const item = this.items().find((candidate) => candidate.id === id);
    if (!item) return;

    this.clearTimer(id);
    this.items.update((current) => current.filter((candidate) => candidate.id !== id));
    focusTarget.focus();
    this.announcement.set(`${item.file.name} removed from the upload queue`);
  }

  protected formatBytes(bytes: number): string {
    return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  }

  protected statusLabel(status: UploadStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'uploading':
        return 'Uploading';
      case 'done':
        return 'Complete';
      case 'error':
        return 'Server error';
    }
  }

  private schedule(id: string): void {
    this.clearTimer(id);
    const timer = setTimeout(() => {
      this.timers.delete(id);
      this.advance(id);
    }, UPLOAD_TICK_MS);
    this.timers.set(id, timer);
  }

  private advance(id: string): void {
    const item = this.items().find((candidate) => candidate.id === id);
    if (!item || (item.status !== 'pending' && item.status !== 'uploading')) return;

    const progress = item.status === 'pending' ? 20 : Math.min(100, item.progress + 20);
    if (item.failFirstAttempt && item.attempt === 0 && progress >= 60) {
      this.patch(id, {
        status: 'error',
        progress,
        error: 'Upload failed (server returned 500). Try again.',
      });
      this.announcement.set(`${item.file.name} failed because the server returned an error`);
      return;
    }

    if (progress >= 100) {
      this.patch(id, { status: 'done', progress: 100 });
      this.announcement.set(`${item.file.name} upload complete`);
      return;
    }

    this.patch(id, { status: 'uploading', progress });
    this.schedule(id);
  }

  private patch(id: string, changes: Partial<UploadItem>): void {
    this.items.update((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.timers.delete(id);
  }
}
