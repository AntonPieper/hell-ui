import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton, HELL_CARD_DIRECTIVES, HELL_DIALOG_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellButton, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Dialog</h1>
      <p>
        A floating window for short, focused tasks. Built on the <code>NgpDialog</code> primitive —
        overlay, focus trap, escape-to-close and outside-click-to-close are all handled for you.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <button hellButton variant="primary" [hellDialogTrigger]="confirm">Publish article</button>

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
      </hd-example-tabs>

      <h2>Anatomy</h2>
      <ul>
        <li><code>[hellDialogTrigger]</code> — the element that opens the dialog</li>
        <li><code>hellDialogOverlay</code> — the dimmed backdrop</li>
        <li><code>hellDialog</code> — the dialog box itself</li>
        <li>
          <code>hellCardHeader</code>, <code>hellCardBody</code>, <code>hellCardFooter</code> —
          shared layout slots reused inside the dialog
        </li>
        <li>
          <code>hellDialogTitle</code>, <code>hellDialogDescription</code> — dialog-specific text
          primitives
        </li>
      </ul>

      <h2>Scoped to app-shell content</h2>
      <p>
        Add <code>scoped</code> to the overlay and open the dialog from inside a dialog root. This
        docs page already renders inside the docs app's <code>hellAppContent</code>, so the dialog
        below only blocks the main content region while the real topbar and sidebars stay
        interactive.
      </p>
      <hd-example-tabs [code]="exampleCodes[1]">
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
                  <code>hellAppContent</code>, so the scoped overlay follows that region
                  automatically.
                </p>
              </div>
              <div hellCardFooter>
                <button hellButton variant="ghost" (click)="close()">Close</button>
              </div>
            </div>
          </div>
        </ng-template>
      </hd-example-tabs>

      <p class="hd-muted">
        Need arbitrary region instead? Mark it with <code>hellDialogScope</code> and keep
        <code>scoped</code> on overlay.
      </p>

      <h2>API</h2>
      <ul>
        <li>
          <code>[hellDialogTrigger]</code>: bind to an <code>&lt;ng-template&gt;</code>; exposes
          template context <code>close()</code>.
        </li>
        <li>
          <code>closeOnEscape</code>, <code>closeOnOutsideClick</code>: trigger inputs forwarded to
          <code>NgpDialogTrigger</code>.
        </li>
        <li><code>(closed)</code>: emits when the dialog closes.</li>
        <li>
          <code>hellDialogOverlay</code>: backdrop layer; <code>scoped</code> keeps it inside
          nearest <code>hellDialogScope</code> / <code>hellAppContent</code>.
        </li>
        <li>
          <code>hellDialog</code>: panel; <code>size</code> is <code>xs | sm | md | lg | xl</code>.
        </li>
        <li>
          <code>hellDialogTitle</code>, <code>hellDialogDescription</code>: accessible title and
          description wiring.
        </li>
        <li><code>hellDialogScope</code>: marks a custom overlay bounding region.</li>
        <li><code>unstyled</code>: available on overlay, panel, title and description.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use dialogs for modal decisions and blocking tasks.</li>
        <li>Include a title and description for screen readers.</li>
        <li>Put destructive actions last and style them as danger.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't open dialogs for lightweight hints; use Popover or Tooltip.</li>
        <li>Don't trap users without a clear close or cancel path.</li>
      </ul>
    </article>
  `,
})
export class DialogPage {
  protected readonly exampleCodes = [
    '<button hellButton variant="primary" [hellDialogTrigger]="confirm">\n  Publish article\n</button>\n\n<ng-template #confirm let-close="close">\n  <div hellDialogOverlay>\n    <div hellDialog size="md">\n      <div hellCardHeader>\n        <h2 hellDialogTitle>Publish this article?</h2>\n      </div>\n      <div hellCardBody>\n        <p hellDialogDescription>\n          Once published, the article will be visible to everyone.\n        </p>\n      </div>\n      <div hellCardFooter>\n        <button hellButton variant="ghost" (click)="close()">Cancel</button>\n        <button hellButton variant="primary" (click)="close()">Publish</button>\n      </div>\n    </div>\n  </div>\n</ng-template>\n',
    '<p class="m-0 text-sm text-hell-foreground-muted">\n  Open it, then try the docs-site topbar links or sidenav. The overlay\n  stays inside the page content area.\n</p>\n<button hellButton variant="primary" [hellDialogTrigger]="scopedShell">\n  Open content-scoped dialog\n</button>\n\n<ng-template #scopedShell let-close="close">\n  <div hellDialogOverlay scoped>\n    <div hellDialog size="sm">\n      <div hellCardHeader>\n        <h2 hellDialogTitle>Only docs content is blocked</h2>\n      </div>\n      <div hellCardBody>\n        <p hellDialogDescription>\n          The trigger already lives inside the docs app\'s\n          <code>hellAppContent</code>, so the scoped overlay follows that\n          region automatically.\n        </p>\n      </div>\n      <div hellCardFooter>\n        <button hellButton variant="ghost" (click)="close()">Close</button>\n      </div>\n    </div>\n  </div>\n</ng-template>\n',
  ] as const;
}
