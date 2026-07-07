import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <button hellButton variant="primary" [hellDialogTrigger]="confirm">Publish article</button>

    <ng-template #confirm let-close="close">
      <div hellDialogOverlay>
        <div hellDialog>
          <div hellCardHeader>
            <h2 hellDialogTitle>Publish this article?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>Once published, the article is visible to everyone.</p>
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
export class DialogBasicExample {}
