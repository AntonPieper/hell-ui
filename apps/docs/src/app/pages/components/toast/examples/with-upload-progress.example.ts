import { ChangeDetectionStrategy, Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import { HellToastService, type HellToastRef } from '@hell-ui/angular/toast';

@Component({
  selector: 'app-toast-with-upload-progress-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellProgress, HellProgressBar],
  template: `
    <button hellButton variant="primary" type="button" [disabled]="running()" (click)="upload()">
      {{ running() ? 'Uploading…' : 'Upload report' }}
    </button>

    <ng-template #uploading>
      <div class="grid gap-hell-2">
        <div class="font-semibold text-hell-foreground">Uploading report.pdf</div>
        <div hellProgress aria-label="Upload progress" [value]="percent()">
          <div hellProgressBar></div>
        </div>
        <div class="hd-muted tabular-nums">{{ percent() }}%</div>
      </div>
    </ng-template>
  `,
})
export class ToastWithUploadProgressExample {
  protected readonly svc = inject(HellToastService);
  private readonly uploading = viewChild.required<TemplateRef<{ $implicit: HellToastRef }>>('uploading');

  protected readonly running = signal(false);
  protected readonly percent = signal(0);

  protected upload() {
    if (this.running()) return;
    this.running.set(true);
    this.percent.set(0);

    // Keep the returned reference to update this toast in place as the upload changes state.
    const toast = this.svc.show({
      template: this.uploading(),
      duration: 0,
      dismissible: false,
      announcement: 'Uploading report.pdf',
    });

    const tick = setInterval(() => {
      this.percent.update((value) => Math.min(100, value + 20));
      if (this.percent() >= 100) {
        clearInterval(tick);
        toast.update({
          template: null,
          title: 'Upload complete',
          description: 'report.pdf is ready to share.',
          variant: 'success',
          duration: 4000,
          dismissible: true,
        });
        this.running.set(false);
      }
    }, 500);
  }
}
