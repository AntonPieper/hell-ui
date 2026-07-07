import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_DIALOG_DIRECTIVES, type HellDialogUi } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <button hellButton variant="danger" [hellDialogTrigger]="confirm">Delete workspace</button>

    <ng-template #confirm let-close="close">
      <!-- Every dialog directive refines its own root part through ui. -->
      <!-- Shorthand string ui refines the default part... -->
      <div hellDialogOverlay ui="bg-hell-danger-soft/40 backdrop-blur-none">
        <!-- ...and the [ui] map form addresses the same part by name. -->
        <div hellDialog size="sm" [ui]="dialogUi">
          <div hellCardHeader>
            <h2 hellDialogTitle ui="text-hell-danger-strong">Delete this workspace?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription ui="text-hell-foreground">
              All dashboards and saved filters are removed. This cannot be undone.
            </p>
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
export class DialogStylingExample {
  protected readonly dialogUi: HellDialogUi = {
    root: 'rounded-hell-xl border-2 border-hell-danger',
  };
}
