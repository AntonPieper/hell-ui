import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { injectHellPrompt } from 'hell-ui/confirm';

@Component({
  selector: 'app-confirm-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <div class="flex flex-col items-start gap-hell-3">
      <button hellButton variant="primary" type="button" (click)="publish()">Publish article</button>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class ConfirmBasicExample {
  private readonly prompt = injectHellPrompt();
  protected readonly status = signal('No decision yet.');

  protected async publish(): Promise<void> {
    const confirmed = await this.prompt.confirm(
      {
        title: 'Publish this article?',
        description: 'Once published, the article is visible to everyone.',
      },
      { action: { label: 'Publish', variant: 'primary' } },
    );
    this.status.set(confirmed ? 'Article published.' : 'Publishing cancelled.');
  }
}
