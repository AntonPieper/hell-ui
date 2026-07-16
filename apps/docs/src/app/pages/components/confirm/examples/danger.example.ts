import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { injectHellPrompt } from '@hell-ui/angular/confirm';

@Component({
  selector: 'app-confirm-danger-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <div class="flex flex-col items-start gap-hell-3">
      <button hellButton variant="danger" type="button" (click)="remove()">Delete project</button>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class ConfirmDangerExample {
  private readonly prompt = injectHellPrompt();
  protected readonly status = signal('The project is safe.');

  protected async remove(): Promise<void> {
    const confirmed = await this.prompt.confirm(
      {
        title: 'Delete this project?',
        description: 'This permanently deletes the project and everything inside it.',
      },
      {
        action: { label: 'Delete project', variant: 'danger' },
        cancelAction: { label: 'Keep project', variant: 'default' },
      },
    );
    this.status.set(confirmed ? 'Project deleted.' : 'The project is safe.');
  }
}
