import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellToastService } from 'hell-ui/toast';

@Component({
  selector: 'app-toast-stacking-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <button hellButton variant="ghost" type="button" (click)="deployLog()">
      Run deploy
    </button>
  `,
})
export class ToastStackingExample {
  protected readonly svc = inject(HellToastService);

  protected deployLog() {
    const steps: readonly (readonly [string, string])[] = [
      ['Build started', 'main @ 7c9a02b'],
      ['Tests passed', '482 specs in 14.2s'],
      ['Bundle ready', 'main.js — 142 kB gzipped'],
      ['Deployed', 'preview-42.hell.app'],
      ['Smoke check queued', 'chromium / firefox / webkit'],
      ['Notified team', '#release on Slack'],
    ];
    steps.forEach(([title, description], i) => {
      setTimeout(() => this.svc.success(title, { description, duration: 0 }), i * 180);
    });
  }
}
