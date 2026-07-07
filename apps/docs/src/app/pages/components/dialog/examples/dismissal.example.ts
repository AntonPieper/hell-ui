import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-dismissal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <!-- Escape and outside-click dismissal are on by default. -->
    <button hellButton [hellDialogTrigger]="casual">Casual dialog</button>

    <!-- Force a deliberate choice: no Escape, no outside-click dismissal. -->
    <button
      hellButton
      variant="danger"
      [hellDialogTrigger]="mustDecide"
      [closeOnEscape]="false"
      [closeOnOutsideClick]="false"
    >
      Cancel subscription
    </button>

    <ng-template #casual let-close="close">
      <div hellDialogOverlay>
        <div hellDialog size="sm">
          <div hellCardHeader>
            <h2 hellDialogTitle>Dismiss me freely</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>Press Escape or click the backdrop to close this one.</p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="primary" (click)="close()">Got it</button>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #mustDecide let-close="close">
      <div hellDialogOverlay>
        <div hellDialog size="sm">
          <div hellCardHeader>
            <h2 hellDialogTitle>Cancel your subscription?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>
              This ends billing at the period's end. Escape and outside-click are disabled, so pick
              an explicit action.
            </p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost" (click)="close()">Keep subscription</button>
            <button hellButton variant="danger" (click)="close()">Cancel it</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogDismissalExample {}
