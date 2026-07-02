import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-dialog-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_DIALOG_DIRECTIVES, ...HELL_CARD_DIRECTIVES],
  template: `
    <button hellButton variant="danger" [hellDialogTrigger]="confirm">Delete workspace</button>

    <ng-template #confirm let-close="close">
      <!-- Overlay and dialog each expose their own root Public Part. -->
      <div hellDialogOverlay ui="bg-hell-danger/15">
        <div hellDialog size="sm" [ui]="{ root: 'border-hell-danger' }">
          <div hellCardHeader>
            <h2 hellDialogTitle ui="text-hell-danger">Delete this workspace?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>All dashboards and saved filters will be removed.</p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost" (click)="close()">Cancel</button>
            <button hellButton variant="danger" (click)="close()">Delete</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogStylingExample {}
