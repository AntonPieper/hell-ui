import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ConfirmBasicExample } from './examples/basic.example';
import confirmBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmDangerExample } from './examples/danger.example';
import confirmDangerExampleCodeRaw from './examples/danger.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmCountdownExample } from './examples/countdown.example';
import confirmCountdownExampleCodeRaw from './examples/countdown.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmContentTemplateExample } from './examples/content-template.example';
import confirmContentTemplateExampleCodeRaw from './examples/content-template.example.ts?raw' with {
  loader: 'text',
};
import { PopconfirmRowDeleteExample } from './examples/popconfirm-row-delete.example';
import popconfirmRowDeleteExampleCodeRaw from './examples/popconfirm-row-delete.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    ConfirmBasicExample,
    ConfirmDangerExample,
    ConfirmCountdownExample,
    ConfirmContentTemplateExample,
    PopconfirmRowDeleteExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Confirm"
        icon="faSolidSquareCheck"
        category="Composite"
        importPath="@hell-ui/angular/confirm"
        stylesPath="@hell-ui/angular/confirm/styles.css"
      >
        A promise-based confirmation service that opens one accessible modal on the dialog primitive
        and resolves whether the user went ahead — so destructive flows read top-to-bottom instead of
        wiring a dialog component per screen.
      </hd-page-header>
      <p>
        The confirm entry point is a <strong>Composite</strong> over the Dialog primitive. Inject
        <code>HellConfirmService</code> anywhere and <code>await</code> a single
        <code>confirm(options)</code> call: it opens a focus-trapped, labelled modal and resolves
        <code>{{ '{' }} confirmed {{ '}' }}</code>. The promise <strong>always resolves</strong> —
        Escape, a backdrop click, and the cancel button all resolve <code>confirmed: false</code>, so
        you never wrap the call in a try/catch. Calls <strong>queue</strong>: the service never shows
        two confirm dialogs at once.
      </p>
      <p>
        Reach for the confirm service for blocking yes/no decisions — delete, reset, discard,
        "are you sure". For lightweight in-context confirmations anchored to a control (such as a row
        delete), a declarative popconfirm on the popover primitive is a better fit. For transient,
        non-blocking feedback after an action, use Toast.
      </p>

      <h2>Basic</h2>
      <p>
        Pass a <code>title</code>, an optional <code>description</code>, and read
        <code>confirmed</code> off the resolved result. Focus is trapped in the dialog and returned to
        the trigger when it closes; the default severity focuses the confirm button.
      </p>
      <hd-example-tabs [code]="confirmBasicExampleCode">
        <app-confirm-basic-example />
      </hd-example-tabs>

      <h2>Danger</h2>
      <p>
        Set <code>severity: 'danger'</code> for destructive actions. The confirm button switches to
        the destructive <code>danger</code> button variant, and initial focus moves to
        <em>cancel</em> so an Enter-by-habit doesn't destroy data. Custom
        <code>confirmLabel</code> / <code>cancelLabel</code> name the action in the user's words.
      </p>
      <hd-example-tabs [code]="confirmDangerExampleCode">
        <app-confirm-danger-example />
      </hd-example-tabs>

      <h2>Countdown</h2>
      <p>
        <code>countdownSeconds</code> keeps the confirm button disabled with a visible remaining-seconds
        suffix (formatted through the Label Contract) so a user cannot reflexively confirm something
        irreversible. The countdown only <strong>gates enabling</strong> — it never auto-confirms;
        the user still has to click.
      </p>
      <hd-example-tabs [code]="confirmCountdownExampleCode">
        <app-confirm-countdown-example />
      </hd-example-tabs>

      <h2>Projected content</h2>
      <p>
        Pass a <code>content</code> template to add a one-off option — for example an "also delete
        imported groups" checkbox — without building a custom dialog. The template context exposes a
        <code>state</code> signal seeded from <code>contentState</code>; read it with
        <code>state()</code> and update it with <code>state.set(...)</code>. Its final value rides back
        to the caller in <code>result.content</code>.
      </p>
      <hd-example-tabs [code]="confirmContentTemplateExampleCode">
        <app-confirm-content-template-example />
      </hd-example-tabs>

      <h2>Popconfirm: in-context confirmation</h2>
      <p>
        For lightweight confirmations anchored to a control — a row delete, an inline "remove" —
        reach for the declarative <strong>popconfirm</strong> instead of a modal. Attach
        <code>hellPopconfirm</code> to any button, point it at a template holding a
        <code>&lt;hell-popconfirm-panel&gt;</code>, and read <code>confirmed</code> to run the action.
        There is no promise API on the declarative form: the trigger emits <code>confirmed</code> or
        <code>dismissed</code> and the action itself stays in your code.
      </p>
      <p>
        The panel renders on the popover primitive, so focus moves into it on open and returns to the
        trigger on dismiss, and Escape or an outside click dismisses it through the shared Floating
        Dismissal rules. Only one popconfirm is open at a time — arming a second row's delete closes
        the first, so "armed delete" states can never accumulate. Set <code>severity="danger"</code>
        to match the confirm service's destructive styling and start focus on cancel.
      </p>
      <hd-example-tabs [code]="popconfirmRowDeleteExampleCode">
        <app-popconfirm-row-delete-example />
      </hd-example-tabs>

      <h2>Recipe: unsaved-changes route guard</h2>
      <p>
        Hell ships no <code>CanDeactivate</code> guard — the framework-agnostic surface stays small —
        but the confirm service composes into one cleanly. Model save / discard / stay as a small
        result and let the guard block navigation until the user decides. This recipe is
        documentation only; copy it into your app:
      </p>
      <pre><code>{{ routeGuardRecipe }}</code></pre>
      <p>
        Because <code>confirm</code> always resolves, the guard never needs a try/catch: a backdrop
        click or Escape resolves <code>confirmed: false</code>, which you map to "stay on the page".
        Use a projected <code>content</code> template if you want an explicit "save before leaving"
        checkbox whose state rides back in the result.
      </p>

      <h2>API</h2>
      <h3><code>HellConfirmService</code> (<code>providedIn: 'root'</code>)</h3>
      <ul>
        <li>
          <code>confirm&lt;TContentState&gt;(options): Promise&lt;HellConfirmResult&lt;TContentState&gt;&gt;</code>
          — open a confirmation and resolve with the outcome. Never rejects. Concurrent calls queue.
        </li>
      </ul>
      <h3><code>HellConfirmOptions&lt;TContentState&gt;</code></h3>
      <ul>
        <li><code>title</code>: <code>string</code>. Accessible title and heading.</li>
        <li><code>description?</code>: <code>string</code>. Linked as the dialog's accessible description.</li>
        <li><code>severity?</code>: <code>'default' | 'danger'</code>. Default <code>default</code>. <code>danger</code> uses the destructive confirm variant and focuses cancel.</li>
        <li><code>confirmLabel?</code> / <code>cancelLabel?</code>: <code>string</code>. Override the button labels; fall back to the Label Contract.</li>
        <li><code>countdownSeconds?</code>: <code>number</code>. Seconds the confirm button stays disabled with a visible countdown. Gating only.</li>
        <li><code>content?</code>: <code>TemplateRef&lt;HellConfirmContentContext&lt;TContentState&gt;&gt;</code>. Projected into the dialog body.</li>
        <li><code>contentState?</code>: <code>TContentState</code>. Initial value of the content template's <code>state</code> signal.</li>
      </ul>
      <h3><code>HellConfirmResult&lt;TContentState&gt;</code></h3>
      <ul>
        <li><code>confirmed</code>: <code>boolean</code>. Whether the user confirmed.</li>
        <li><code>content?</code>: <code>TContentState</code>. Final projected-content state, when a <code>content</code> template was used.</li>
      </ul>
      <h3><code>HellConfirmContentContext&lt;TContentState&gt;</code></h3>
      <ul>
        <li><code>$implicit</code> / <code>state</code>: <code>WritableSignal&lt;TContentState&gt;</code> — the same content state signal, exposed as the template's implicit value and as <code>state</code>.</li>
      </ul>
      <h3><code>HellPopconfirm</code> (trigger directive)</h3>
      <p>
        Attach to a <code>button</code> or <code>a</code>. Bind
        <code>[hellPopconfirm]="template"</code> where the template holds a
        <code>&lt;hell-popconfirm-panel&gt;</code>. Pass-through inputs
        <code>placement</code>, <code>offset</code>, <code>flip</code>, <code>shift</code>,
        <code>container</code>, and <code>disabled</code> forward to the popover trigger.
      </p>
      <ul>
        <li><code>confirmed</code>: output. Emits when the user confirms — run the action here.</li>
        <li>
          <code>dismissed</code>: output. Emits when the popconfirm closes without confirming (cancel,
          Escape, outside click, or another popconfirm opening).
        </li>
      </ul>
      <h3><code>HellPopconfirmPanel</code> (<code>&lt;hell-popconfirm-panel&gt;</code>)</h3>
      <ul>
        <li><code>message?</code>: <code>string</code>. Falls back to the Label Contract's <code>popconfirmMessage</code>.</li>
        <li><code>severity?</code>: <code>'default' | 'danger'</code>. Default <code>default</code>. <code>danger</code> uses the destructive confirm variant and focuses cancel.</li>
        <li><code>confirmLabel?</code> / <code>cancelLabel?</code>: <code>string</code>. Override the button labels; fall back to the Label Contract.</li>
      </ul>
      <h3>Also exported</h3>
      <ul>
        <li><code>HellConfirmSeverity</code> — <code>'default' | 'danger'</code>.</li>
        <li>
          <code>HellConfirmLabels</code>, <code>HELL_CONFIRM_LABELS</code>,
          <code>provideHellConfirmLabels()</code> — the Label Contract for the default
          <code>confirm</code> / <code>cancel</code> labels, the <code>countdown</code> suffix
          formatter, and the popconfirm's default <code>popconfirmMessage</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The confirmation is a modal dialog from the underlying primitive: content outside it is inert while open, and focus is trapped inside and restored to the opener on close.</li>
        <li>The dialog is named by its <code>title</code> (<code>aria-labelledby</code>) and, when present, described by its <code>description</code> (<code>aria-describedby</code>).</li>
        <li>Escape and backdrop-click dismiss the dialog and resolve <code>confirmed: false</code>.</li>
        <li><code>danger</code> confirmations focus the cancel button first; default confirmations focus the confirm button. When a countdown gates the confirm button, focus starts on cancel.</li>
        <li>Every built-in string — the default <code>confirm</code> / <code>cancel</code> labels and the countdown suffix — is behind the Label Contract. Override them with <code>provideHellConfirmLabels()</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use it for blocking yes/no decisions, and <code>await</code> the result inline.</li>
        <li>Set <code>severity: 'danger'</code> for destructive actions and give the confirm button a specific verb ("Delete project").</li>
        <li>Add a <code>countdownSeconds</code> gate for irreversible, high-blast-radius actions.</li>
        <li>Project a <code>content</code> template for one-off options instead of forking a custom dialog.</li>
        <li>Override built-in labels through <code>provideHellConfirmLabels()</code> for localization.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a confirm dialog for non-blocking feedback — use Toast.</li>
        <li>Don't rely on a rejected promise for cancellation; <code>confirm</code> always resolves.</li>
        <li>Don't open confirmations in a loop expecting them to stack — they queue one at a time.</li>
        <li>Don't put the only way out behind the countdown; cancel, Escape, and the backdrop always work.</li>
      </ul>
    </article>
  `,
})
export class ConfirmPage {
  protected readonly confirmBasicExampleCode = confirmBasicExampleCodeRaw;
  protected readonly confirmDangerExampleCode = confirmDangerExampleCodeRaw;
  protected readonly confirmCountdownExampleCode = confirmCountdownExampleCodeRaw;
  protected readonly confirmContentTemplateExampleCode = confirmContentTemplateExampleCodeRaw;
  protected readonly popconfirmRowDeleteExampleCode = popconfirmRowDeleteExampleCodeRaw;

  protected readonly routeGuardRecipe = `import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { HellConfirmService } from '@hell-ui/angular/confirm';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  if (!component.hasUnsavedChanges()) return true;
  const { confirmed } = await inject(HellConfirmService).confirm({
    title: 'Discard unsaved changes?',
    description: 'Your edits on this page will be lost.',
    severity: 'danger',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
  });
  return confirmed; // false (cancel / Escape / backdrop) keeps the user on the page
};`;
}
