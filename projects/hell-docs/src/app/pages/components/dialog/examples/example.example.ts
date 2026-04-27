import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton, HELL_CARD_DIRECTIVES, HELL_DIALOG_DIRECTIVES } from 'hell';

@Component({
  selector: 'app-dialog-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_DIALOG_DIRECTIVES, ...HELL_CARD_DIRECTIVES],
  template: `
    <button hellButton variant="primary" [hellDialogTrigger]="confirm">Publish article</button>

    <ng-template #confirm let-close="close">
      <div hellDialogOverlay>
        <div hellDialog size="md">
          <div hellCardHeader>
            <h2 hellDialogTitle>Publish this article?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>Once published, the article will be visible to everyone.</p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost" (click)="close()">Cancel</button>
            <button hellButton variant="primary" (click)="close()">Publish</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogExampleExample {}
