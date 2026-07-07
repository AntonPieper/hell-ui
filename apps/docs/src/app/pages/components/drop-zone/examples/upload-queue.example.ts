import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellDropZone } from '@hell-ui/angular/drop-zone';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import { HellTag } from '@hell-ui/angular/tag';

interface UploadItem {
  readonly id: number;
  readonly name: string;
  readonly progress: number;
  readonly status: 'uploading' | 'done' | 'error';
}

let nextId = 0;

@Component({
  selector: 'app-drop-zone-upload-queue-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone, HellProgress, HellProgressBar, HellTag, HellButton, HellIcon],
  providers: [provideIcons({ faSolidXmark })],
  template: `
    <div hellDropzone accept=".pdf,.png,.jpg,.jpeg" (files)="onFiles($event)">
      <strong>Drop invoices here</strong>
      <span class="hd-muted">PDF, PNG, or JPG</span>
    </div>

    @if (uploads().length) {
      <ul class="mt-hell-4 grid gap-hell-3">
        @for (upload of uploads(); track upload.id) {
          <li class="grid gap-hell-1">
            <div class="flex items-center justify-between gap-hell-2">
              <span class="truncate text-sm font-medium">{{ upload.name }}</span>
              <div class="flex items-center gap-hell-2">
                @switch (upload.status) {
                  @case ('uploading') {
                    <span hellTag variant="info">{{ upload.progress }}%</span>
                  }
                  @case ('done') {
                    <span hellTag variant="success">Done</span>
                  }
                  @case ('error') {
                    <span hellTag variant="danger">Failed</span>
                  }
                }
                <button
                  hellButton
                  iconOnly
                  variant="ghost"
                  size="xs"
                  type="button"
                  [attr.aria-label]="'Remove ' + upload.name"
                  (click)="remove(upload.id)"
                >
                  <hell-icon name="faSolidXmark" />
                </button>
              </div>
            </div>
            <div
              hellProgress
              [attr.aria-label]="upload.name + ' upload progress'"
              [value]="upload.progress"
            >
              <div hellProgressBar></div>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class DropZoneUploadQueueExample {
  protected readonly uploads = signal<UploadItem[]>([]);

  protected onFiles(files: File[]): void {
    for (const file of files) {
      const id = nextId++;
      this.uploads.update((items) => [...items, { id, name: file.name, progress: 0, status: 'uploading' }]);
      this.simulateUpload(id);
    }
  }

  protected remove(id: number): void {
    this.uploads.update((items) => items.filter((item) => item.id !== id));
  }

  private simulateUpload(id: number): void {
    const tick = () => {
      this.uploads.update((items) =>
        items.map((item) => {
          if (item.id !== id || item.status !== 'uploading') return item;
          const progress = Math.min(100, item.progress + 20);
          return { ...item, progress, status: progress >= 100 ? 'done' : 'uploading' };
        }),
      );

      const current = this.uploads().find((item) => item.id === id);
      if (current?.status === 'uploading') window.setTimeout(tick, 300);
    };

    window.setTimeout(tick, 300);
  }
}
