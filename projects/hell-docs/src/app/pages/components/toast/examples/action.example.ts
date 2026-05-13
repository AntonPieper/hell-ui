import { ChangeDetectionStrategy, Component, inject, viewChild, TemplateRef } from '@angular/core';
import { HellToastService } from '@hell-ui/angular/composites';
import { HellButton } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-toast-action-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="primary" (click)="undoExample()">Delete &mdash; with Undo</button>
  `,
})
export class ToastActionExample {
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
