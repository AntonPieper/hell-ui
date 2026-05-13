import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_CARD_DIRECTIVES, HELL_DIALOG_DIRECTIVES, HellButton } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-dialog-scoped-to-app-shell-content-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_DIALOG_DIRECTIVES, ...HELL_CARD_DIRECTIVES],
  template: `
    <p class="m-0 text-sm text-hell-foreground-muted">
      Open it, then try the docs-site topbar links or sidenav. The overlay stays inside the page
      content area.
    </p>
    <button hellButton variant="primary" [hellDialogTrigger]="scopedShell">
      Open content-scoped dialog
    </button>

    <ng-template #scopedShell let-close="close">
      <div hellDialogOverlay scoped>
        <div hellDialog size="sm">
          <div hellCardHeader>
            <h2 hellDialogTitle>Only docs content is blocked</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>
              The trigger already lives inside the docs app's
              <code>hellAppContent</code>, so the scoped overlay follows that region automatically.
            </p>
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost" (click)="close()">Close</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogScopedToAppShellContentExample {}
