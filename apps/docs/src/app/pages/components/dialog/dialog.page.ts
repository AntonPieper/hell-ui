import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DialogBasicExample } from './examples/basic.example';
import dialogBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DialogSizesExample } from './examples/sizes.example';
import dialogSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { DialogDismissalExample } from './examples/dismissal.example';
import dialogDismissalExampleCodeRaw from './examples/dismissal.example.ts?raw' with {
  loader: 'text',
};
import { DialogScopedExample } from './examples/scoped.example';
import dialogScopedExampleCodeRaw from './examples/scoped.example.ts?raw' with {
  loader: 'text',
};
import { DialogAppShellScopedExample } from './examples/app-shell-scoped.example';
import dialogAppShellScopedExampleCodeRaw from './examples/app-shell-scoped.example.ts?raw' with {
  loader: 'text',
};
import { DialogEditRecordExample } from './examples/edit-record.example';
import dialogEditRecordExampleCodeRaw from './examples/edit-record.example.ts?raw' with {
  loader: 'text',
};
import { DialogStylingExample } from './examples/styling.example';
import dialogStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    RouterLink,
    DialogBasicExample,
    DialogSizesExample,
    DialogDismissalExample,
    DialogScopedExample,
    DialogAppShellScopedExample,
    DialogEditRecordExample,
    DialogStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Dialog"
        icon="faSolidWindowRestore"
        category="Styled primitive"
        importPath="hell-ui/dialog"
        stylesPath="hell-ui/dialog/styles.css"
      >
        A modal surface for short, focused decisions and edit tasks — with an optional scoped mode
        that blocks one content region while the surrounding shell stays live.
      </hd-page-header>
      <p>
        The Dialog entry point is a suite of directives built on the <code>NgpDialog</code> family
        from <code>ng-primitives</code>. <code>[hellDialogTrigger]</code> attaches to a native
        <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> and opens an
        <code>&lt;ng-template&gt;</code> through the primitive's dialog manager, which handles the
        portal, overlay, focus trap, and dismissal wiring. <code>hellDialogOverlay</code>,
        <code>hellDialog</code>, <code>hellDialogTitle</code>, and <code>hellDialogDescription</code>
        add the styled surface and accessible naming on top.
      </p>
      <p>
        Because the trigger and surface are directives rather than a wrapper component, you keep full
        control over the markup inside the dialog — the layout below reuses the shared
        <code>hellCard</code> header/body/footer slots, but any structure works. Reach for a dialog
        when an action needs a deliberate confirmation or a self-contained form (delete a record,
        edit a row, resolve a conflict). For lightweight, non-blocking hints, prefer Popover or
        Tooltip instead.
      </p>
      <p>
        Deciding between a dialog and a lighter surface? See
        <a routerLink="/guide/overlays">When to use which overlay</a>.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[hellDialogTrigger]</code> to a template reference and read the
        <code>close</code> function from the template context to dismiss it. Escape and outside-click
        close the dialog by default, and focus returns to the trigger afterward.
      </p>
      <hd-example-tabs [code]="dialogBasicExampleCode">
        <app-dialog-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> on <code>hellDialog</code> caps the panel's max-width:
        <code>sm</code> (380px), <code>md</code> (480px, the default), <code>lg</code> (720px), and
        <code>xl</code> (960px) — note this is a narrower scale than <code>HellSize</code>; there is
        no <code>xs</code> dialog. The panel is always full-width below its cap and never taller
        than the viewport, so its body scrolls when content overflows. This example passes the size
        through <code>[hellDialogData]</code> and reads it back from the template context.
      </p>
      <hd-example-tabs [code]="dialogSizesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-dialog-sizes-example />
      </hd-example-tabs>

      <h2>Dismissal</h2>
      <p>
        <code>closeOnEscape</code> and <code>closeOnOutsideClick</code> are trigger inputs forwarded
        to the primitive. Both default to enabled; set either to <code>false</code> to force a
        deliberate choice, or pass a guard function to decide per event. When you disable both, make
        sure the dialog itself offers an explicit way out.
      </p>
      <hd-example-tabs [code]="dialogDismissalExampleCode" previewClass="flex flex-wrap gap-2">
        <app-dialog-dismissal-example />
      </hd-example-tabs>

      <h2>Scoped</h2>
      <p>
        Add <code>scoped</code> to the overlay and open the trigger from inside a
        <code>hellDialogScope</code> region (or a <code>hellAppContent</code> from the app shell).
        The overlay then reads its bounds from that region instead of the viewport, so the backdrop
        covers only the scoped content while the surrounding chrome stays interactive. Each scoped
        overlay keeps its own inset variables, so simultaneous scoped dialogs never fight over shared
        state.
      </p>
      <p>
        <code>scoped</code> also narrows the dialog's <em>modality</em> to that region. Only the
        scope root becomes <code>inert</code> — removed from the tab order, from pointer input, and
        from the accessibility tree in one step — and stops scrolling. Everything outside it keeps
        real focus and stays in the accessibility tree, which is why a scoped dialog must not be
        used to block a decision the surrounding chrome could still undo. Without a scope root,
        <code>scoped</code> falls back to the viewport and to page-wide modality.
      </p>
      <hd-example-tabs [code]="dialogScopedExampleCode">
        <app-dialog-scoped-example />
      </hd-example-tabs>

      <h2>Scoped inside the app shell</h2>
      <p>
        The shell case is the reason scoped modality exists. <code>hellAppContent</code> is already
        a Dialog Scope root, so a scoped dialog opened from the main region blocks exactly that
        region: the topbar, the sidenav, the secondary panel, and any popover, menu, or omnibar
        panel they open stay fully usable, and shell overlays layer over the dialog region because
        <code>--hell-z-dialog-scoped</code> sits below <code>--hell-z-popover</code> and
        <code>--hell-z-menu</code>. Keyboard focus still cycles inside the dialog panel, so Tab
        never walks into the blocked region; the shell is reached by pointer or by its own global
        hotkeys, and Escape closes the dialog.
      </p>
      <hd-example-tabs [code]="dialogAppShellScopedExampleCode">
        <app-dialog-app-shell-scoped-example />
      </hd-example-tabs>

      <h2>With field, input, and button</h2>
      <p>
        A realistic edit-record modal: the trigger seeds the dialog with the current record through
        <code>[hellDialogData]</code>, the body is a <code>hellField</code> form of
        <code>hellInput</code> / <code>hellTextarea</code> controls, and submitting calls
        <code>close(result)</code>. The trigger's <code>(closed)</code> output then applies the
        returned value — or leaves the row untouched when the user cancels and the result is
        <code>undefined</code>.
      </p>
      <hd-example-tabs [code]="dialogEditRecordExampleCode">
        <app-dialog-edit-record-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The Dialog entry point is a suite of single-part directives — the overlay, panel, title, and
        description each own one Public Part named <code>root</code> and expose its own
        <code>ui</code> input. Pass a shorthand <code>ui="..."</code> string to refine that
        directive's <code>root</code>, or the equivalent explicit map
        (<code>[ui]="&#123; root: '...' &#125;"</code>). Both merge on top of each directive's recipe
        through Hell's Tailwind merge, so your classes win deterministically over the defaults they
        conflict with.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Directive</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>hellDialogOverlay</code></td>
            <td><code>root</code></td>
            <td>The fixed backdrop layer — dim color, blur, padding, and scroll behavior.</td>
          </tr>
          <tr>
            <td><code>hellDialog</code></td>
            <td><code>root</code></td>
            <td>The panel surface — max-width, border, radius, elevation shadow, and background.</td>
          </tr>
          <tr>
            <td><code>hellDialogTitle</code></td>
            <td><code>root</code></td>
            <td>The accessible title text — weight, size, and color.</td>
          </tr>
          <tr>
            <td><code>hellDialogDescription</code></td>
            <td><code>root</code></td>
            <td>The accessible description text — muted color and spacing.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>hellDialogScope</code> is a behavior-only marker with no rendered surface, so it has no
        Public Part or <code>ui</code> input. The example below refines every styled part at once.
      </p>
      <hd-example-tabs [code]="dialogStylingExampleCode">
        <app-dialog-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>hellDialogTrigger</code> (on a <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code>):</p>
      <ul>
        <li>
          <code>hellDialogTrigger</code>: <code>TemplateRef&lt;HellDialogTemplateContext&gt;</code>,
          required. The template rendered as the dialog's content; its context exposes
          <code>$implicit</code> (the <code>NgpDialogRef</code>, with a <code>data</code> property)
          and <code>close(result?)</code>.
        </li>
        <li>
          <code>closeOnEscape</code>: <code>NgpDismissGuardInput&lt;KeyboardEvent&gt;</code>
          (boolean or guard). Default enabled. Controls whether Escape dismisses the dialog.
        </li>
        <li>
          <code>closeOnOutsideClick</code>: <code>NgpDismissGuardInput&lt;Element&gt;</code>
          (boolean or guard). Default enabled. Controls whether a backdrop click dismisses it.
        </li>
        <li><code>disabled</code>: <code>boolean</code>. Default <code>false</code>. Blocks opening; disabled anchors also get <code>aria-disabled</code> / <code>tabindex="-1"</code>.</li>
        <li>
          <code>dialogData</code> / <code>hellDialogData</code>: <code>TData</code>. Value passed to
          the opened dialog and read back via <code>ref.data</code>. <code>hellDialogData</code>
          takes precedence when both are set.
        </li>
        <li><code>(closed)</code>: <code>output&lt;TResult | undefined&gt;</code>. Emits the result passed to <code>close()</code>, or <code>undefined</code> when closed without one.</li>
      </ul>
      <p><code>hellDialogOverlay</code>:</p>
      <ul>
        <li>
          <code>scoped</code>: <code>boolean</code>. Default <code>false</code>. Reads bounds from
          the nearest scope root instead of the viewport, and narrows modality to that root: the
          root becomes <code>inert</code> and stops scrolling while everything outside it keeps
          focus, pointer input, and its place in the accessibility tree.
        </li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or <code>&#123; root?: string &#125;</code> map refining <code>root</code>.</li>
      </ul>
      <p><code>hellDialog</code>:</p>
      <ul>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg' | 'xl'</code>. Default <code>md</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or <code>&#123; root?: string &#125;</code> map refining <code>root</code>.</li>
      </ul>
      <p><code>hellDialogTitle</code> / <code>hellDialogDescription</code>:</p>
      <ul>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or map refining <code>root</code>.</li>
      </ul>
      <p><code>hellDialogScope</code>: behavior-only marker; <code>exportAs: 'hellDialogScope'</code>; no inputs.</p>
      <p>
        Exported types: <code>HellDialogTemplateContext&lt;TData, TResult&gt;</code>.
        <code>HELL_DIALOG_IMPORTS</code> bundles all six directives for bulk import.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>The panel is a modal dialog (<code>role="dialog"</code>, <code>aria-modal</code>) from the underlying primitive. A page-modal dialog hides the rest of the page from assistive technology; a <code>scoped</code> one instead makes only its scope root <code>inert</code> and leaves the surrounding shell in the accessibility tree, so no still-focusable region is left behind an <code>aria-hidden</code> ancestor.</li>
        <li>
          Focus is trapped inside the panel: Tab and Shift+Tab cycle through the dialog's own
          focusable elements, and if none exist focus falls back to the panel itself. Focus is
          restored to the trigger when the dialog closes — including when a scoped dialog's trigger
          sat inside the region that was inert while it was open.
        </li>
        <li>
          A dialog opened from inside another dialog, and a popover, menu, or select opened from
          inside a dialog, keep their own dismissal order: Escape closes the innermost surface
          first, and interacting with a shell popover never dismisses the scoped dialog underneath.
        </li>
        <li>
          Name every dialog with <code>hellDialogTitle</code> (or an <code>aria-label</code>) and,
          where it helps, describe it with <code>hellDialogDescription</code>; the primitive wires
          both to <code>aria-labelledby</code> / <code>aria-describedby</code>.
        </li>
        <li>Escape and backdrop-click dismissal follow the shared dismissal-guard rules and can be disabled or gated per event through the trigger inputs.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Give every dialog a <code>hellDialogTitle</code>, and a <code>hellDialogDescription</code> when the task needs context.</li>
        <li>Put the confirming or destructive action last in the footer and style it <code>primary</code> or <code>danger</code>.</li>
        <li>Use <code>scoped</code> to block a single content region when the surrounding shell should stay usable.</li>
        <li>Return a result through <code>close(result)</code> and apply it in <code>(closed)</code> instead of mutating shared state from inside the template.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't open a dialog for a non-blocking hint — use Popover or Tooltip.</li>
        <li>Don't disable both Escape and outside-click without a visible close or cancel control.</li>
        <li>Don't target private descendants for styling — each directive's only Public Part is <code>root</code>.</li>
      </ul>
    </article>
  `,
})
export class DialogPage {
  protected readonly dialogBasicExampleCode = dialogBasicExampleCodeRaw;
  protected readonly dialogSizesExampleCode = dialogSizesExampleCodeRaw;
  protected readonly dialogDismissalExampleCode = dialogDismissalExampleCodeRaw;
  protected readonly dialogScopedExampleCode = dialogScopedExampleCodeRaw;
  protected readonly dialogAppShellScopedExampleCode = dialogAppShellScopedExampleCodeRaw;
  protected readonly dialogEditRecordExampleCode = dialogEditRecordExampleCodeRaw;
  protected readonly dialogStylingExampleCode = dialogStylingExampleCodeRaw;
}
