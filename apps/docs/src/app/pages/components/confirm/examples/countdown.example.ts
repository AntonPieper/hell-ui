import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { injectHellPrompt } from 'hell-ui/confirm';

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
  private readonly prompt = injectHellPrompt();
  protected readonly status = signal('Database untouched.');

  protected async reset(): Promise<void> {
    const confirmed = await this.prompt.confirm(
      {
        title: 'Reset the production database?',
        description: 'Every table is truncated. The confirm button unlocks after a short pause.',
      },
      {
        action: { label: 'Reset now', variant: 'danger', countdownSeconds: 5 },
      },
    );
    this.status.set(confirmed ? 'Database reset.' : 'Database untouched.');
  }
}
