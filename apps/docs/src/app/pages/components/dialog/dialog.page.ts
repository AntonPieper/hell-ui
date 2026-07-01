import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DialogExampleExample } from './examples/example.example';
import dialogExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { DialogScopedToAppShellContentExample } from './examples/scoped-to-app-shell-content.example';
import dialogScopedToAppShellContentExampleCodeRaw from './examples/scoped-to-app-shell-content.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ...HELL_DIALOG_DIRECTIVES,
    DialogExampleExample,
    DialogScopedToAppShellContentExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Dialog</h1>
      <p>
        A floating window for short, focused tasks. Built on the <code>NgpDialog</code> primitive —
        overlay, focus trap, escape-to-close and outside-click-to-close are all handled for you.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="dialogExampleExampleCode">
        <app-dialog-example-example />
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
      <hd-example-tabs [code]="dialogScopedToAppShellContentExampleCode">
        <app-dialog-scoped-to-app-shell-content-example />
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
        <li>
          <code>ui</code>: Part Style Map overrides for the overlay, panel, title, and description
          root parts via <code>HellDialogOverlayUi</code>, <code>HellDialogUi</code>,
          <code>HellDialogTitleUi</code>, and <code>HellDialogDescriptionUi</code>.
        </li>
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
  protected readonly dialogExampleExampleCode = dialogExampleExampleCodeRaw;
  protected readonly dialogScopedToAppShellContentExampleCode =
    dialogScopedToAppShellContentExampleCodeRaw;
}
