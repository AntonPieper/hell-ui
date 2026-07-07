import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-scoped-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <!-- hellDialogScope marks the region the overlay should cover. -->
    <section hellDialogScope class="rounded-hell-md border border-hell-border p-hell-6">
      <p class="m-0 mb-hell-4 text-sm text-hell-foreground-muted">
        This bordered panel is the Dialog Scope. Open the dialog and the backdrop only covers this
        box — controls outside it stay clickable.
      </p>
      <button hellButton variant="primary" [hellDialogTrigger]="scoped">Block this panel</button>
    </section>

    <button hellButton variant="ghost" class="mt-hell-4">Still clickable outside the scope</button>

    <ng-template #scoped let-close="close">
      <div hellDialogOverlay scoped>
        <div hellDialog size="sm">
          <div hellCardHeader>
            <h2 hellDialogTitle>Scoped to this region</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>
              The overlay reads its bounds from the nearest <code>hellDialogScope</code>, leaving the
              surrounding chrome interactive.
            </p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="primary" (click)="close()">Close</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogScopedExample {}
