import { ChangeDetectionStrategy, Component, inject, viewChild, TemplateRef } from '@angular/core';
import { HellToastService } from '@hell-ui/angular/toast';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-toast-persistent-custom-content-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="ghost" (click)="customExample()">Show custom toast</button>

    <ng-template #custom let-ctx>
      <div class="flex items-center gap-3">
        <div
          class="grid size-9 place-items-center rounded-full bg-hell-info-soft font-semibold text-hell-info-strong"
        >
          SS
        </div>
        <div class="min-w-0">
          <div class="font-semibold text-hell-foreground">Sara Severin</div>
          <div class="hd-muted">commented on “Q4 plan”</div>
        </div>
        <button hellButton size="sm" variant="primary" (click)="ctx.dismiss()">View</button>
      </div>
    </ng-template>
  `,
})
export class ToastPersistentCustomContentExample {
  protected readonly svc = inject(HellToastService);
  private readonly customTpl =
    viewChild<TemplateRef<{ $implicit: { id: number; dismiss: () => void } }>>('custom');

  protected undoExample() {
    this.svc.show({
      title: 'Article moved to trash',
      description: '“Roadmap Q4”',
      variant: 'default',
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: (dismiss) => {
          this.svc.success('Restored', { description: '“Roadmap Q4” is back where it was.' });
          dismiss();
        },
      },
    });
  }

  protected customExample() {
    const tpl = this.customTpl();
    if (!tpl) return;
    this.svc.show({ template: tpl, duration: 0 });
  }

  protected burst() {
    const lines = [
      ['Build started', 'main @ 7c9a02b'],
      ['Tests passed', '482 specs in 14.2s'],
      ['Bundle ready', 'main.js — 142kb gzipped'],
      ['Deployed', 'preview-42.heinrich.app'],
      ['Notified team', '#release on Slack'],
    ] as const;
    lines.forEach(([t, d], i) => {
      setTimeout(() => this.svc.success(t, { description: d }), i * 220);
    });
  }
}
