import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_EMPTY_STATE_COPY, HELL_EMPTY_STATE_IMPORTS } from 'hell-ui/empty-state';
import { HellButton } from 'hell-ui/button';

@Component({
  selector: 'app-empty-state-conditional-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_IMPORTS, HellButton],
  template: `
    <div class="h-72 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state glyph="error" [title]="copy.title">
        <span hellEmptyStateDescription>We could not load your invoices.</span>

        <!--
          Empty state has no default <ng-content>, so conditionally projected
          content only reaches the actions slot when the wrapper matches the
          slot selector. ngProjectAs on the <ng-container> forwards it; without
          it (or with more than one element in a bare @if) the buttons are
          silently dropped.
        -->
        <ng-container ngProjectAs="[hellEmptyStateActions]">
          @if (attemptsLeft() > 0) {
            <button hellEmptyStateActions hellButton type="button" (click)="retry()">
              Retry ({{ attemptsLeft() }} left)
            </button>
          } @else {
            <button hellEmptyStateActions hellButton variant="ghost" type="button" (click)="reset()">
              Contact support
            </button>
          }
        </ng-container>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateConditionalExample {
  protected readonly copy = HELL_EMPTY_STATE_COPY.error;
  protected readonly attemptsLeft = signal(2);

  protected retry(): void {
    this.attemptsLeft.update((left) => Math.max(0, left - 1));
  }

  protected reset(): void {
    this.attemptsLeft.set(2);
  }
}
