import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellConfirmService } from '@hell-ui/angular/confirm';

@Component({
  selector: 'app-confirm-countdown-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <div class="flex flex-col items-start gap-hell-3">
      <button hellButton variant="danger" type="button" (click)="reset()">Reset database</button>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class ConfirmCountdownExample {
  private readonly confirm = inject(HellConfirmService);
  protected readonly status = signal('Database untouched.');

  protected async reset(): Promise<void> {
    const { confirmed } = await this.confirm.confirm({
      title: 'Reset the production database?',
      description: 'Every table is truncated. The confirm button unlocks after a short pause.',
      severity: 'danger',
      confirmLabel: 'Reset now',
      countdownSeconds: 5,
    });
    this.status.set(confirmed ? 'Database reset.' : 'Database untouched.');
  }
}
