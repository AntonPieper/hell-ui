import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellSize } from '@hell-ui/angular/core';
import { HELL_DIALOG_IMPORTS } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_IMPORTS, ...HELL_DIALOG_IMPORTS],
  template: `
    @for (size of sizes; track size) {
      <button hellButton [hellDialogTrigger]="sized" [hellDialogData]="size">{{ size }}</button>
    }

    <ng-template #sized let-ref let-close="close">
      <div hellDialogOverlay>
        <div hellDialog [size]="ref.data">
          <div hellCardHeader>
            <h2 hellDialogTitle>Size “{{ ref.data }}”</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>
              The panel caps its max-width per size while staying full-width on narrow viewports.
            </p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="primary" (click)="close()">Done</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogSizesExample {
  protected readonly sizes: readonly Exclude<HellSize, 'xs'>[] = ['sm', 'md', 'lg', 'xl'];
}
