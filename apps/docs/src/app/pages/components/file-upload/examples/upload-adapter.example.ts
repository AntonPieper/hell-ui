import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  HellFileUpload,
  type HellFileUploadItem,
  type HellFileUploadRejection,
} from '@hell-ui/angular/file-upload';

const MEGABYTE = 1024 * 1024;

// A stand-in for the app's real transport. Hell owns the chrome; this adapter
// owns the engine — it drives each file's status and progress and hands them
// back to the component through the controlled `items` array. Swap the
// setTimeout ticks for a real XHR/fetch with an `upload.onprogress` handler and
// the component does not change.
@Component({
  selector: 'app-file-upload-adapter-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFileUpload],
  template: `
    <hell-file-upload
      [items]="items()"
      accept="image/*,application/pdf"
      [maxBytes]="maxBytes"
      [maxFiles]="6"
      (filesAdded)="enqueue($event)"
      (rejected)="onRejected($event)"
      (removed)="cancel($event)"
      (retried)="retry($event)"
    />
  `,
})
export class FileUploadAdapterExample {
  protected readonly maxBytes = 5 * MEGABYTE;

  // The controlled state. A resumed session starts with one finished upload and
  // one that the mock server rejected, so the done and error/retry states are
  // visible immediately.
  protected readonly items = signal<readonly HellFileUploadItem[]>([
    { id: 'seed-done', name: 'contract-signed.pdf', size: 284_140, status: 'done' },
    {
      id: 'seed-error',
      name: 'passport-scan.jpg',
      size: 1_248_400,
      status: 'error',
      error: 'Upload failed (server returned 500). Try again.',
    },
  ]);

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private sequence = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
    });
  }

  /** Enqueue validated files as pending uploads and start the mock transfer. */
  protected enqueue(files: File[]): void {
    const additions = files.map<HellFileUploadItem>((file) => ({
      id: `file-${this.sequence++}`,
      file,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    }));
    this.items.update((current) => [...current, ...additions]);
    for (const item of additions) this.tick(item.id);
  }

  /** A consumer can log or surface rejections; the component already shows the
   * inline reason row and announces it politely. */
  protected onRejected(rejection: HellFileUploadRejection): void {
    // e.g. this.telemetry.track('upload_rejected', rejection.reason)
    void rejection;
  }

  /** Remove drops the item from the controlled list (canceling any transfer). */
  protected cancel(id: string): void {
    this.clearTimer(id);
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  /** Retry resets the item to a fresh upload; the component never does this itself. */
  protected retry(id: string): void {
    this.patch(id, { status: 'uploading', progress: 0, error: undefined });
    this.tick(id);
  }

  /** Advance one mock progress step, resolving to done at 100%. */
  private tick(id: string): void {
    const timer = setTimeout(() => {
      this.timers.delete(id);
      const item = this.items().find((candidate) => candidate.id === id);
      if (!item || item.status !== 'uploading') return;

      const progress = Math.min(1, (item.progress ?? 0) + 0.2);
      if (progress >= 1) {
        this.patch(id, { status: 'done', progress: 1 });
      } else {
        this.patch(id, { progress });
        this.tick(id);
      }
    }, 220);
    this.timers.set(id, timer);
  }

  private patch(id: string, changes: Partial<HellFileUploadItem>): void {
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
