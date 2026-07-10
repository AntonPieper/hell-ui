import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AlertActionsExample } from './examples/actions.example';
import alertActionsExampleCodeRaw from './examples/actions.example.ts?raw' with { loader: 'text' };
import { AlertAsyncRoleExample } from './examples/async-role.example';
import alertAsyncRoleExampleCodeRaw from './examples/async-role.example.ts?raw' with {
  loader: 'text',
};
import { AlertBannerExample } from './examples/banner.example';
import alertBannerExampleCodeRaw from './examples/banner.example.ts?raw' with { loader: 'text' };
import { AlertBasicExample } from './examples/basic.example';
import alertBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { AlertDismissibleExample } from './examples/dismissible.example';
import alertDismissibleExampleCodeRaw from './examples/dismissible.example.ts?raw' with {
  loader: 'text',
};
import { AlertIconExample } from './examples/icon.example';
import alertIconExampleCodeRaw from './examples/icon.example.ts?raw' with { loader: 'text' };
import { AlertStylingExample } from './examples/styling.example';
import alertStylingExampleCodeRaw from './examples/styling.example.ts?raw' with { loader: 'text' };
import { AlertValidationSummaryExample } from './examples/validation-summary.example';
import alertValidationSummaryExampleCodeRaw from './examples/validation-summary.example.ts?raw' with {
  loader: 'text',
};
import { AlertVariantsExample } from './examples/variants.example';
import alertVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with { loader: 'text' };

@Component({
  selector: 'hd-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    AlertBasicExample,
    AlertVariantsExample,
    AlertIconExample,
    AlertBannerExample,
    AlertDismissibleExample,
    AlertActionsExample,
    AlertAsyncRoleExample,
    AlertValidationSummaryExample,
    AlertStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Alert"
        icon="faSolidTriangleExclamation"
        category="Styled primitive"
        importPath="@hell-ui/angular/alert"
        stylesPath="@hell-ui/angular/alert/styles.css"
      >
        A persistent inline message for contextual notices — info, success, warning, and danger
        severities, an optional title, a default per-variant glyph, an actions region, an opt-in
        dismiss button, and a full-width banner layout. Compose it in place of ad-hoc
        Bootstrap-style alert markup.
      </hd-page-header>

      <p>
        <code>hell-alert</code> owns three Public Parts — <code>root</code>, <code>icon</code>, and
        <code>content</code> — and projects the <code>hellAlertTitle</code>,
        <code>hellAlertDescription</code>, <code>hellAlertActions</code>, and
        <code>hellAlertDismiss</code> directives you place inside it. Severity colors come from
        Semantic Theme Tokens, so alerts follow skins and the high-contrast theme automatically.
      </p>
      <p>
        Alerts have <strong>no live-region semantics by default</strong>, so a page full of static
        notices stays quiet for screen-reader users. Reach for Toast for transient, imperative
        notifications; reach for Alert for messages that stay on the page until the state changes.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="alertBasicExampleCode">
        <app-alert-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        <code>variant</code> picks the severity: <code>info</code> (default), <code>success</code>,
        <code>warning</code>, and <code>danger</code>. Each variant sets a soft background, a border,
        and an accent color for the default glyph — never rely on color alone, so keep the title and
        description meaningful.
      </p>
      <hd-example-tabs [code]="alertVariantsExampleCode" previewClass="flex flex-col gap-hell-3">
        <app-alert-variants-example />
      </hd-example-tabs>

      <h2>Icon</h2>
      <p>
        Every variant renders a decorative default glyph in the <code>icon</code> part. Project an
        element marked <code>hellAlertIcon</code> to replace it, or set
        <code>[showIcon]="false"</code> to remove the icon slot entirely. The glyph is always hidden
        from assistive tech because the variant is conveyed by text.
      </p>
      <hd-example-tabs [code]="alertIconExampleCode" previewClass="flex flex-col gap-hell-3">
        <app-alert-icon-example />
      </hd-example-tabs>

      <h2>Banner</h2>
      <p>
        <code>layout="banner"</code> spans the full container width with flush edges — for
        app-level messages like an unsupported-browser or version-update notice at the top of a
        shell. It is the same component with one input; behavior and parts are unchanged.
      </p>
      <hd-example-tabs [code]="alertBannerExampleCode">
        <app-alert-banner-example />
      </hd-example-tabs>

      <h2>Dismissible</h2>
      <p>
        Add a <code>hellAlertDismiss</code> button to make the alert closable. It is a native
        button with an accessible name from the Label Contract, and it
        <strong>emits <code>dismissed</code> without removing itself</strong> — the consumer owns
        visibility state, as shown here with a signal.
      </p>
      <hd-example-tabs [code]="alertDismissibleExampleCode">
        <app-alert-dismissible-example />
      </hd-example-tabs>

      <h2>Actions</h2>
      <p>
        Put real buttons in a <code>hellAlertActions</code> region instead of making the whole alert
        clickable. Actions and the dismiss button are reachable in document order with visible
        focus.
      </p>
      <hd-example-tabs [code]="alertActionsExampleCode">
        <app-alert-actions-example />
      </hd-example-tabs>

      <h2>Async alerts and roles</h2>
      <p>
        By default the alert sets no ARIA role, so statically rendered alerts read as ordinary page
        content and never announce on load. When you insert an alert in response to an async event,
        pass an explicit <code>role</code> so assistive tech announces it: <code>role="alert"</code>
        for urgent, interrupting messages and <code>role="status"</code> for polite ones. For
        transient announcements, pair the insertion with the Toast announcer instead.
      </p>
      <hd-example-tabs [code]="alertAsyncRoleExampleCode" previewClass="flex flex-col gap-hell-3">
        <app-alert-async-role-example />
      </hd-example-tabs>

      <h2>Validation summary</h2>
      <p>
        A short list renders cleanly inside the body — useful for field-group validation warnings
        ported from hand-rolled markup. Any content projects into the <code>content</code> part.
      </p>
      <hd-example-tabs [code]="alertValidationSummaryExampleCode">
        <app-alert-validation-summary-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Refine the <code>root</code>, <code>icon</code>, and <code>content</code> parts through the
        <code>ui</code> Part Style Map; the projected directives expose their own <code>ui</code>
        inputs for the title, description, actions, and dismiss button. Classes merge over the
        recipe through Hell's deterministic Tailwind merge.
      </p>
      <hd-example-tabs [code]="alertStylingExampleCode">
        <app-alert-styling-example />
      </hd-example-tabs>

      <h2>Parts</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>HellAlert</code></td>
            <td><code>root</code></td>
            <td>The alert box — layout, padding, border, and the variant-driven color scheme.</td>
          </tr>
          <tr>
            <td><code>HellAlert</code></td>
            <td><code>icon</code></td>
            <td>The leading glyph slot; holds the default per-variant glyph or projected icon.</td>
          </tr>
          <tr>
            <td><code>HellAlert</code></td>
            <td><code>content</code></td>
            <td>The body column holding the title, description, and actions.</td>
          </tr>
          <tr>
            <td><code>HellAlertTitle</code></td>
            <td><code>root</code></td>
            <td>The heading line.</td>
          </tr>
          <tr>
            <td><code>HellAlertDescription</code></td>
            <td><code>root</code></td>
            <td>The supporting body copy.</td>
          </tr>
          <tr>
            <td><code>HellAlertActions</code></td>
            <td><code>root</code></td>
            <td>The action-button row.</td>
          </tr>
          <tr>
            <td><code>HellAlertDismiss</code></td>
            <td><code>root</code></td>
            <td>The dismiss button.</td>
          </tr>
        </tbody>
      </table>

      <h2>API</h2>
      <p><code>hell-alert</code></p>
      <ul>
        <li><code>variant</code>: <code>HellAlertVariant</code> — <code>info | success | warning | danger</code>. Defaults to <code>info</code>.</li>
        <li><code>layout</code>: <code>HellAlertLayout</code> — <code>inline | banner</code>. Defaults to <code>inline</code>.</li>
        <li><code>showIcon</code>: <code>boolean</code> — render the icon slot. Defaults to <code>true</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellAlertPart&gt;</code> — refines <code>root</code>, <code>icon</code>, and <code>content</code>.</li>
        <li><code>(dismissed)</code>: emitted when a projected <code>hellAlertDismiss</code> button is activated; the alert never removes itself.</li>
      </ul>
      <p><code>hellAlertDismiss</code> (selector <code>button[hellAlertDismiss]</code>)</p>
      <ul>
        <li><code>aria-label</code>: overrides the accessible name; defaults to the <code>HELL_ALERT_LABELS</code> <code>dismiss</code> string.</li>
        <li>Override the label per injector with <code>provideHellAlertLabels(&#123; dismiss: '…' &#125;)</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>No ARIA role or live region by default — static alerts read as normal content and do not announce on load.</li>
        <li>The default glyph is <code>aria-hidden</code>; the variant is always conveyed by the text.</li>
        <li>The dismiss button is a native <code>&lt;button&gt;</code> with a Label Contract name, keyboard-operable with Enter and Space and a visible focus ring.</li>
        <li>For async insertions, set <code>role="alert"</code> or <code>role="status"</code>, or pair the insertion with the Toast announcer.</li>
      </ul>

      <h2>Boundary</h2>
      <p>
        Alert is for messages layered <em>within</em> a working screen. A full-page blocking state —
        "no access", "user limit reached", an empty results view — is not an alert; use the Empty
        State pattern for those so the whole region communicates the state instead of a floating
        notice. Transient, imperative notifications belong to Toast.
      </p>
    </article>
  `,
})
export class AlertPage {
  protected readonly alertBasicExampleCode = alertBasicExampleCodeRaw;
  protected readonly alertVariantsExampleCode = alertVariantsExampleCodeRaw;
  protected readonly alertIconExampleCode = alertIconExampleCodeRaw;
  protected readonly alertBannerExampleCode = alertBannerExampleCodeRaw;
  protected readonly alertDismissibleExampleCode = alertDismissibleExampleCodeRaw;
  protected readonly alertActionsExampleCode = alertActionsExampleCodeRaw;
  protected readonly alertAsyncRoleExampleCode = alertAsyncRoleExampleCodeRaw;
  protected readonly alertValidationSummaryExampleCode = alertValidationSummaryExampleCodeRaw;
  protected readonly alertStylingExampleCode = alertStylingExampleCodeRaw;
}
