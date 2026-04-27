import { ChangeDetectionStrategy, Component, inject, viewChild, TemplateRef } from '@angular/core';
import { HellButton, HellToastService } from 'hell';

@Component({
  selector: 'app-toast-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button
      hellButton
      variant="ghost"
      (click)="svc.message('Saved as draft', { description: 'Your changes are stored locally.' })"
    >
      Default
    </button>
    <button
      hellButton
      variant="primary"
      (click)="
        svc.success('Article published', {
          description: 'Visible to readers in a few seconds.',
        })
      "
    >
      Success
    </button>
    <button
      hellButton
      variant="ghost"
      (click)="
        svc.info('Background sync running', {
          description: 'Updating your library in the background.',
        })
      "
    >
      Info
    </button>
    <button
      hellButton
      variant="ghost"
      (click)="svc.warning('Quota almost full', { description: '92% of your storage is used.' })"
    >
      Warning
    </button>
    <button
      hellButton
      variant="danger"
      (click)="
        svc.error('Upload failed', {
          description: 'Network unreachable. We will retry shortly.',
        })
      "
    >
      Danger
    </button>
  `,
})
export class ToastVariantsExample {
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
