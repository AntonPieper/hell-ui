import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ToastActionExample } from './examples/action.example';
import toastActionExampleCodeRaw from './examples/action.example.ts?raw' with {
  loader: 'text',
};
import { ToastBasicExample } from './examples/basic.example';
import toastBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ToastStackingExample } from './examples/stacking.example';
import toastStackingExampleCodeRaw from './examples/stacking.example.ts?raw' with {
  loader: 'text',
};
import { ToastStylingExample } from './examples/styling.example';
import toastStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { ToastTemplateExample } from './examples/template.example';
import toastTemplateExampleCodeRaw from './examples/template.example.ts?raw' with {
  loader: 'text',
};
import { ToastVariantsExample } from './examples/variants.example';
import toastVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};
import { ToastWithUploadProgressExample } from './examples/with-upload-progress.example';
import toastWithUploadProgressExampleCodeRaw from './examples/with-upload-progress.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    ToastBasicExample,
    ToastVariantsExample,
    ToastActionExample,
    ToastTemplateExample,
    ToastStackingExample,
    ToastWithUploadProgressExample,
    ToastStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Toast"
        icon="faSolidBell"
        category="Composite"
        importPath="@hell-ui/angular/toast"
        stylesPath="@hell-ui/angular/toast/styles.css"
      >
        Non-blocking notifications driven by a service and one global toaster, with a Sonner-style
        stack that fans out on hover and pauses its timers while you read.
      </hd-page-header>
      <p>
        The toast entry point is a <strong>Composite</strong> built on the internal
        <em>Toast Stack</em> runtime. You mount a single <code>&lt;hell-toaster /&gt;</code> near the
        root of your app and drive it from anywhere by injecting
        <code>HellToastService</code>. Creation returns a small <code>HellToastRef</code>; the
        renderer records, numeric ids, auto-dismiss timers, and pause/resume controls stay inside
        the private Toast Stack. The toaster owns the collapse-and-fan layout, exit animations,
        measuring, and scrolling.
      </p>
      <p>
        Reach for a toast for transient, non-blocking feedback that follows a user action — a save
        succeeded, an export finished, a row was moved to trash with an undo. Newest toasts pile at
        the front; hover or focus the stack to fan it out, and once more than one is live a
        built-in dismiss-all control appears. Announcements go through Angular CDK
        <code>LiveAnnouncer</code>, so the visible stack is a labeled visual region rather than a
        live region that re-reads on every layout shift.
      </p>

      <h2>Basic</h2>
      <p>
        Inject <code>HellToastService</code> and call a variant shortcut with a title and optional
        <code>description</code>. The single <code>&lt;hell-toaster /&gt;</code> mounted in the app
        shell renders it — you never place a toaster per feature.
      </p>
      <hd-example-tabs [code]="toastBasicExampleCode">
        <app-toast-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        Five variants set the glyph and semantic color: <code>default</code> for neutral
        confirmations, <code>success</code>, <code>info</code>, <code>warning</code>, and
        <code>danger</code>. Use the <code>message</code>, <code>success</code>, <code>info</code>,
        <code>warning</code>, and <code>error</code> shortcuts, or pass <code>variant</code> to
        <code>show()</code> directly.
      </p>
      <hd-example-tabs [code]="toastVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-toast-variants-example />
      </hd-example-tabs>

      <h2>Action</h2>
      <p>
        Pass a single <code>action</code> with a <code>label</code> and an
        <code>onClick(dismiss)</code> handler. The handler receives the <code>dismiss</code>
        callback so it can close the toast after acting — an undo affordance is the canonical use.
        Give action toasts a longer <code>duration</code> so the action stays reachable.
      </p>
      <hd-example-tabs [code]="toastActionExampleCode">
        <app-toast-action-example />
      </hd-example-tabs>

      <h2>Custom template</h2>
      <p>
        For layouts the title/description pair can't express, pass a native
        <code>TemplateRef</code>. Its implicit context is the same small
        <code>HellToastRef</code>, so a <code>let-toast</code> binding can dismiss or update its own
        toast without exposing a renderer id. No marker directive is required. Template toasts
        carry no derivable text, so supply an explicit <code>announcement</code> for the
        screen-reader.
      </p>
      <hd-example-tabs [code]="toastTemplateExampleCode">
        <app-toast-template-example />
      </hd-example-tabs>

      <h2>Stacking</h2>
      <p>
        Emit a burst and the stack collapses behind the front-most toast, peeking the ones beneath.
        Hover or focus it to fan the cards into a scrollable column; auto-dismiss timers pause the
        whole time and resume when you leave. <code>maxVisible</code> caps how many cards show
        before the rest collapse into the overflow. (These toasts use <code>duration: 0</code> so
        they stay up while you explore the fan-out.)
      </p>
      <hd-example-tabs [code]="toastStackingExampleCode">
        <app-toast-stacking-example />
      </hd-example-tabs>

      <h2>With button and progress</h2>
      <p>
        A realistic async-feedback flow: a <code>hellButton</code> kicks off an upload and reflects
        the pending state through its own <code>disabled</code> input and label. A single sticky
        template toast tracks progress with a <code>hellProgress</code> bar. Its retained
        <code>HellToastRef</code> patches the same toast to success content, variant, and a new
        duration when the upload completes; the update creates no second toast and makes no second
        announcement.
      </p>
      <hd-example-tabs [code]="toastWithUploadProgressExampleCode">
        <app-toast-with-upload-progress-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The toaster follows Hell's <strong>Part Style Map</strong> contract. A shorthand
        <code>ui="..."</code> string refines the default <code>root</code> part; a
        <code>[ui]</code> map (<code>HellToasterUi</code>) refines named parts. Refinements merge on
        top of the recipe through Hell's Tailwind merge, so a conflicting class such as
        <code>bg-hell-primary-soft</code> wins deterministically over the default surface. Because
        an app renders exactly one toaster, put the <code>[ui]</code> map where that single
        <code>&lt;hell-toaster /&gt;</code> is mounted. Per-toast emphasis flows through
        <code>data-variant</code> on each <code>toast</code> part rather than variant-suffixed part
        keys.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td>The <code>hell-toaster</code> host — fixed anchor, stack width, and layout CSS variables.</td>
          </tr>
          <tr>
            <td><code>region</code></td>
            <td>The labeled <code>role="region"</code> wrapper that captures hover/focus for pause and fan-out.</td>
          </tr>
          <tr>
            <td><code>viewport</code></td>
            <td>The scroll container that grows when expanded and scrolls once the stack overflows.</td>
          </tr>
          <tr>
            <td><code>list</code></td>
            <td>The <code>&lt;ol&gt;</code> that positions each toast card absolutely within the stack.</td>
          </tr>
          <tr>
            <td><code>toast</code></td>
            <td>Each toast card — surface, border, radius, shadow, and grid layout. Shared by every toast.</td>
          </tr>
          <tr>
            <td><code>glyph</code></td>
            <td>The leading status icon, tinted per <code>data-variant</code>.</td>
          </tr>
          <tr>
            <td><code>body</code></td>
            <td>The text column holding the title and description (or a custom template body).</td>
          </tr>
          <tr>
            <td><code>title</code></td>
            <td>The toast heading line.</td>
          </tr>
          <tr>
            <td><code>description</code></td>
            <td>The supporting body line under the title.</td>
          </tr>
          <tr>
            <td><code>action</code></td>
            <td>The optional inline action button rendered to the right of the body.</td>
          </tr>
          <tr>
            <td><code>close</code></td>
            <td>The per-toast dismiss button (shown when <code>dismissible</code>).</td>
          </tr>
          <tr>
            <td><code>toolbar</code></td>
            <td>The floating container for the dismiss-all control, revealed when the stack expands.</td>
          </tr>
          <tr>
            <td><code>dismissAll</code></td>
            <td>The dismiss-all button, shown once more than one toast is live.</td>
          </tr>
        </tbody>
      </table>
      <p>
        This example provides a component-scoped <code>HellToastService</code> and mounts its own
        <code>top-center</code> toaster so the refined toasts stay out of the docs' global
        bottom-right stack. Send two or more to reveal the styled <code>toolbar</code> and
        <code>dismissAll</code> parts.
      </p>
      <hd-example-tabs [code]="toastStylingExampleCode">
        <app-toast-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>HellToaster</code> — <code>&lt;hell-toaster&gt;</code></h3>
      <ul>
        <li>
          <code>position</code>: <code>HellToastPosition</code> —
          <code>top-left | top-center | top-right | bottom-left | bottom-center | bottom-right</code>.
          Default <code>bottom-right</code>.
        </li>
        <li>
          <code>maxVisible</code>: <code>number</code>. Cards shown before the stack collapses into
          overflow. Default <code>3</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellToasterPart&gt;</code> — a shorthand class
          string for the <code>root</code> part or a <code>HellToasterUi</code> map of part → class
          string.
        </li>
        <li>
          Exported types: <code>HellToasterPart</code>
          (<code>'root' | 'region' | 'viewport' | 'list' | 'toast' | 'glyph' | 'body' | 'title' |
          'description' | 'action' | 'close' | 'toolbar' | 'dismissAll'</code>),
          <code>HellToasterUi</code> (<code>HellUi&lt;HellToasterPart&gt;</code>).
        </li>
      </ul>
      <h3><code>HellToastService</code> (<code>providedIn: 'root'</code>)</h3>
      <ul>
        <li><code>show(options: HellToastOptions): HellToastRef</code> — render a toast and return its scoped reference.</li>
        <li>
          <code>message</code>, <code>success</code>, <code>info</code>, <code>warning</code>,
          <code>error</code> <code>(title, opts?)</code> — variant shortcuts; each returns a
          <code>HellToastRef</code>.
        </li>
        <li><code>dismissAll()</code> — dismiss every mounted toast.</li>
      </ul>
      <h3><code>HellToastRef</code></h3>
      <ul>
        <li>
          <code>update(patch: HellToastUpdate)</code> — patch this toast in place. Omitted fields
          remain unchanged; <code>null</code> clears nullable content such as
          <code>title</code>, <code>description</code>, <code>action</code>, or
          <code>template</code>.
        </li>
        <li>
          Only an explicitly supplied <code>duration</code> restarts the countdown. Other patches
          preserve the remaining time. Updates never run the live announcement again.
        </li>
        <li>
          <code>dismiss()</code> — begin this toast's exit animation. Update and dismiss calls made
          after dismissal begins are idempotent no-ops.
        </li>
      </ul>
      <h3><code>HellToastOptions</code></h3>
      <ul>
        <li><code>title?</code> / <code>description?</code>: <code>string</code>. Falls back to <code>description</code> when <code>title</code> is omitted.</li>
        <li><code>variant?</code>: <code>HellToastVariant</code> — <code>default | success | info | warning | danger</code>. Default <code>default</code>.</li>
        <li><code>duration?</code>: <code>number</code> ms. <code>0</code> keeps the toast until dismissed. Default <code>4500</code>.</li>
        <li><code>action?</code>: <code>HellToastAction</code> — <code>{{ '{' }} label: string; onClick: (dismiss: () =&gt; void) =&gt; void {{ '}' }}</code>.</li>
        <li><code>dismissible?</code>: <code>boolean</code>. Shows the close button. Default <code>true</code>.</li>
        <li><code>template?</code>: <code>TemplateRef&lt;{{ '{' }} $implicit: HellToastRef {{ '}' }}&gt;</code> — custom body.</li>
        <li><code>announcement?</code>: <code>string</code>. Explicit <code>LiveAnnouncer</code> text; overrides the derived title/description announcement.</li>
      </ul>
      <h3>Also exported</h3>
      <ul>
        <li><code>HellToastRef</code> and <code>HellToastUpdate</code> — the reference and patch contracts described above.</li>
        <li><code>HELL_TOAST_IMPORTS</code> — <code>[HellToaster]</code> for bulk import.</li>
        <li><code>HellToastLabels</code>, <code>HELL_TOAST_LABELS</code>, <code>provideHellLabels(HELL_TOAST_LABELS, …)</code> — the Label Contract for the region, stack, dismiss, and dismiss-all strings.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          New toasts are announced via CDK <code>LiveAnnouncer</code> with
          <code>'polite'</code> politeness. The announcement is the explicit
          <code>announcement</code>, else the joined <code>title</code>/<code>description</code>,
          else the <code>notification</code> label for text-less template toasts. Reference updates
          are not re-announced.
        </li>
        <li>
          The visible stack is a labeled <code>role="region"</code> named by the
          <code>notifications</code> label — a container, not a live region — so layout shifts and
          re-renders are not re-read.
        </li>
        <li>
          Hover, focus-in, and focus-out drive fan-out and timer pause/resume; auto-dismiss is
          paused the whole time the stack is hovered or holds focus, and resumes on leave.
        </li>
        <li>
          When the stack overflows, the scrollable <code>viewport</code> becomes focusable
          (<code>tabindex="0"</code>) and is labeled by the <code>stack</code> label. Controls on
          toasts hidden behind the collapsed cap are removed from the tab order and marked
          <code>aria-hidden</code>.
        </li>
        <li>
          The close button carries the <code>dismiss</code> label and the dismiss-all button the
          <code>dismissAll</code> label; the status glyph is <code>aria-hidden</code>. Override any
          string with <code>provideHellLabels(HELL_TOAST_LABELS, …)</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Mount exactly one <code>&lt;hell-toaster /&gt;</code> in the app shell and drive it from the service everywhere else.</li>
        <li>Keep messages to a short title plus an optional one-line description.</li>
        <li>Give action toasts a longer <code>duration</code> (or <code>0</code>) so the action stays reachable.</li>
        <li>Retain the returned <code>HellToastRef</code> to update a long-running toast in place instead of stacking new ones.</li>
        <li>Supply an <code>announcement</code> for template toasts whose visuals have no derivable text.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use toasts for errors that need in-form correction — surface those inline in the form.</li>
        <li>Don't put critical, must-not-miss information only in a toast; it auto-dismisses and can be missed.</li>
        <li>Don't mount a toaster per feature — a second one would render the same service's toasts twice.</li>
        <li>Don't fight the recipe with conflicting <code>class</code> utilities; refine parts through <code>ui</code>.</li>
      </ul>
    </article>
  `,
})
export class ToastPage {
  protected readonly toastBasicExampleCode = toastBasicExampleCodeRaw;
  protected readonly toastVariantsExampleCode = toastVariantsExampleCodeRaw;
  protected readonly toastActionExampleCode = toastActionExampleCodeRaw;
  protected readonly toastTemplateExampleCode = toastTemplateExampleCodeRaw;
  protected readonly toastStackingExampleCode = toastStackingExampleCodeRaw;
  protected readonly toastWithUploadProgressExampleCode = toastWithUploadProgressExampleCodeRaw;
  protected readonly toastStylingExampleCode = toastStylingExampleCodeRaw;
}
