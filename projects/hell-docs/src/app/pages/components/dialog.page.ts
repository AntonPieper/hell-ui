import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HELL_DIALOG_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Dialog</h1>
      <p>A floating window for short, focused tasks. Built on the
        <code>NgpDialog</code> primitive — overlay, focus trap, escape-to-close
        and outside-click-to-close are all handled for you.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <button hellButton variant="primary" [hellDialogTrigger]="confirm">
          Publish article
        </button>

        <ng-template #confirm let-close="close">
          <div hellDialogOverlay>
            <div hellDialog size="md">
              <div hellDialogHeader>
                <h2 hellDialogTitle>Publish this article?</h2>
              </div>
              <div hellDialogBody>
                <p hellDialogDescription>
                  Once published, the article will be visible to everyone.
                </p>
              </div>
              <div hellDialogFooter>
                <button hellButton variant="ghost" (click)="close()">Cancel</button>
                <button hellButton variant="primary" (click)="close()">Publish</button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <h2>Anatomy</h2>
      <ul>
        <li><code>[hellDialogTrigger]</code> — the element that opens the dialog</li>
        <li><code>hellDialogOverlay</code> — the dimmed backdrop</li>
        <li><code>hellDialog</code> — the dialog box itself</li>
        <li><code>hellDialogHeader</code>, <code>hellDialogTitle</code>,
          <code>hellDialogDescription</code>, <code>hellDialogBody</code>,
          <code>hellDialogFooter</code> — semantic regions</li>
      </ul>

      <h2>Scoped (non-blocking)</h2>
      <p>
        Apply <code>hellDialogScope</code> to a region (typically the main
        content area) and add <code>scoped</code> on the overlay. The dialog
        and its backdrop are then constrained to that region — the rest of
        the page (sidebars, topbar, etc.) stays interactive.
      </p>
      <div class="hd-example">
        <div hellDialogScope class="relative flex h-64 items-start gap-3 rounded-md border border-hell-border p-4">
          <button hellButton variant="primary" [hellDialogTrigger]="scoped">
            Open scoped dialog
          </button>
          <p class="m-0 text-sm text-hell-foreground-muted">
            The dialog overlay only covers this card. Try clicking outside it
            (or anywhere else on the page) — interaction is preserved.
          </p>
        </div>

        <ng-template #scoped let-close="close">
          <div hellDialogOverlay scoped>
            <div hellDialog size="sm">
              <div hellDialogHeader>
                <h2 hellDialogTitle>Scoped dialog</h2>
              </div>
              <div hellDialogBody>
                <p hellDialogDescription>
                  Confined to the bounds of <code>hellDialogScope</code>.
                </p>
              </div>
              <div hellDialogFooter>
                <button hellButton variant="ghost" (click)="close()">Close</button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    </article>
  `,
})
export class DialogPage {}
