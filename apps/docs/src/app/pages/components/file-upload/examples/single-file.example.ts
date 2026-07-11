import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HellFileUpload, type HellFileUploadItem } from '@hell-ui/angular/file-upload';

// Single-file mode is just `maxFiles="1"`: the hidden input drops its `multiple`
// attribute, a second pick is rejected with the count reason, and the list holds
// at most one item. This is the shape the fax and avatar flows map onto.
@Component({
  selector: 'app-file-upload-single-file-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFileUpload],
  template: `
    <hell-file-upload
      [items]="items()"
      accept="application/pdf"
      [maxBytes]="maxBytes"
      [maxFiles]="1"
      (filesAdded)="enqueue($event)"
      (removed)="clear()"
      (retried)="retry()"
    />
  `,
})
export class FileUploadSingleFileExample {
  protected readonly maxBytes = 10 * 1024 * 1024;
  protected readonly items = signal<readonly HellFileUploadItem[]>([]);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
    });
  }

  protected enqueue(files: File[]): void {
    const [file] = files;
    if (!file) return;
    this.items.set([{ id: 'fax', file, name: file.name, size: file.size, status: 'uploading', progress: 0 }]);
    this.tick();
  }

  protected clear(): void {
    this.items.set([]);
  }

  protected retry(): void {
    this.patch({ status: 'uploading', progress: 0, error: undefined });
    this.tick();
  }

  private tick(): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      const [item] = this.items();
      if (!item || item.status !== 'uploading') return;
      const progress = Math.min(1, (item.progress ?? 0) + 0.25);
      this.patch(progress >= 1 ? { status: 'done', progress: 1 } : { progress });
      if (progress < 1) this.tick();
    }, 220);
    this.timers.add(timer);
  }

  private patch(changes: Partial<HellFileUploadItem>): void {
    this.items.update((current) => current.map((item) => ({ ...item, ...changes })));
  }
}
