import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellSpinner } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-with-card-pending-action-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_CARD_DIRECTIVES, HellButton, HellSpinner],
  template: `
    <div hellCard class="max-w-95" [elevation]="2">
      <div hellCardHeader>Renew subscription</div>
      <div hellCardBody>
        <p>Your plan renews on Aug 4 for €249/month. Confirm to lock in the current rate.</p>
      </div>
      <div hellCardFooter>
        <button hellButton variant="ghost" [disabled]="pending()" type="button">Cancel</button>
        <button
          hellButton
          variant="primary"
          [disabled]="pending()"
          type="button"
          (click)="confirm()"
        >
          @if (pending()) {
            <span hellSpinner size="sm"></span>
          }
          {{ pending() ? 'Confirming…' : 'Confirm renewal' }}
        </button>
      </div>
    </div>
  `,
})
export class SpinnerWithCardPendingActionExample {
  protected readonly pending = signal(false);

  protected confirm(): void {
    this.pending.set(true);
    setTimeout(() => this.pending.set(false), 2000);
  }
}
