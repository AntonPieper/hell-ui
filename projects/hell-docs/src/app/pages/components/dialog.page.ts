import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton, HELL_CARD_DIRECTIVES, HELL_DIALOG_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
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
              <div hellCardHeader>
                <h2 hellDialogTitle>Publish this article?</h2>
              </div>
              <div hellCardBody>
                <p hellDialogDescription>
                  Once published, the article will be visible to everyone.
                </p>
              </div>
              <div hellCardFooter>
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
        <li><code>hellCardHeader</code>, <code>hellCardBody</code>,
          <code>hellCardFooter</code> — shared layout slots reused inside the dialog</li>
        <li><code>hellDialogTitle</code>, <code>hellDialogDescription</code> — dialog-specific text primitives</li>
      </ul>

      <h2>Scoped to app-shell content</h2>
      <p>
        Add <code>scoped</code> to the overlay and open the dialog from inside a
        dialog root. This docs page already renders inside the docs app's
        <code>hellAppContent</code>, so the dialog below only blocks the main
        content region while the real topbar and sidebars stay interactive.
      </p>
      <div class="hd-example">
        <p class="m-0 text-sm text-hell-foreground-muted">
          Open it, then try the docs-site topbar links or sidenav. The overlay
          stays inside the page content area.
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
                  <code>hellAppContent</code>, so the scoped overlay follows that
                  region automatically.
                </p>
              </div>
              <div hellCardFooter>
                <button hellButton variant="ghost" (click)="close()">Close</button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <p class="hd-muted">
        Need arbitrary region instead? Mark it with <code>hellDialogScope</code>
        and keep <code>scoped</code> on overlay.
      </p>

      <h2>API</h2>
      <ul>
        <li><code>[hellDialogTrigger]</code>: bind to an <code>&lt;ng-template&gt;</code>; exposes template context <code>close()</code>.</li>
        <li><code>closeOnEscape</code>, <code>closeOnOutsideClick</code>: trigger inputs forwarded to <code>NgpDialogTrigger</code>.</li>
        <li><code>(closed)</code>: emits when the dialog closes.</li>
        <li><code>hellDialogOverlay</code>: backdrop layer; <code>scoped</code> keeps it inside nearest <code>hellDialogScope</code> / <code>hellAppContent</code>.</li>
        <li><code>hellDialog</code>: panel; <code>size</code> is <code>xs | sm | md | lg | xl</code>.</li>
        <li><code>hellDialogTitle</code>, <code>hellDialogDescription</code>: accessible title and description wiring.</li>
        <li><code>hellDialogScope</code>: marks a custom overlay bounding region.</li>
        <li><code>unstyled</code>: available on overlay, panel, title and description.</li>
      </ul>
    </article>
  `,
})
export class DialogPage {}
