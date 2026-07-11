import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SaveBarContextualFormExample } from './examples/contextual-form.example';
import saveBarContextualFormExampleCodeRaw from './examples/contextual-form.example.ts?raw' with {
  loader: 'text',
};
import { SaveBarFormSubmitExample } from './examples/form-submit.example';
import saveBarFormSubmitExampleCodeRaw from './examples/form-submit.example.ts?raw' with {
  loader: 'text',
};
import { SaveBarPersistentSettingsExample } from './examples/persistent-settings.example';
import saveBarPersistentSettingsExampleCodeRaw from './examples/persistent-settings.example.ts?raw' with {
  loader: 'text',
};
import { SaveBarStickyScrollExample } from './examples/sticky-scroll.example';
import saveBarStickyScrollExampleCodeRaw from './examples/sticky-scroll.example.ts?raw' with {
  loader: 'text',
};
import { SaveBarConfirmDiscardExample } from './examples/confirm-discard.example';
import saveBarConfirmDiscardExampleCodeRaw from './examples/confirm-discard.example.ts?raw' with {
  loader: 'text',
};
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-save-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlock,
    ExampleTabs,
    PageHeader,
    SaveBarContextualFormExample,
    SaveBarFormSubmitExample,
    SaveBarPersistentSettingsExample,
    SaveBarStickyScrollExample,
    SaveBarConfirmDiscardExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Save bar"
        icon="faSolidFloppyDisk"
        category="Composite"
        importPath="@hell-ui/angular/save-bar"
        stylesPath="@hell-ui/angular/save-bar/styles.css"
      >
        A contextual unsaved-changes action bar: hidden until the form is dirty, then a message
        plus Discard and Save docked to the bottom of the scroll container — with a persistent
        mode for always-editable settings surfaces.
      </hd-page-header>
      <p>
        <code>hell-save-bar</code> owns no form knowledge. The consumer drives three state inputs —
        <code>dirty</code>, <code>busy</code>, and <code>disabled</code> — and handles two outputs,
        <code>saved</code> and <code>discarded</code>. Binding a reactive form is one line of state
        wiring: dirty from <code>form.dirty</code>, disabled from
        <code>form.invalid || form.pending</code>, busy from your in-flight signal. The bar is the
        dirty indicator: it appears when there is something to act on and states it plainly, so
        dirtiness is visible before a route guard has to interrupt navigation.
      </p>
      <p>
        <code>busy</code> gates both actions while a save is in flight (no double submits, no
        discarding mid-save) and shows a progress glyph in Save; <code>disabled</code> gates Save
        only, so an invalid form can still be discarded. The bar never assumes a save succeeded —
        clear <code>busy</code> and the form's dirtiness when your mutation resolves.
      </p>

      <h2>Contextual mode with a reactive form</h2>
      <p>
        The default <code>contextual</code> mode renders the bar only while <code>dirty</code>.
        Its appearance never steals focus — typing continues uninterrupted — and screen readers
        hear the message once, politely, through the CDK LiveAnnouncer. The slide-in transition is
        suppressed under <code>prefers-reduced-motion</code>.
      </p>
      <hd-example-tabs [code]="saveBarContextualFormExampleCode">
        <app-save-bar-contextual-form-example />
      </hd-example-tabs>
      <p>
        By default the Save button is <code>type="button"</code> and emits only <code>(saved)</code>
        — even inside a <code>&lt;form&gt;</code> it never raises <code>ngSubmit</code>, so there is
        no double-fire and no "handle one, not both" caveat. Clear <code>busy</code> and mark the
        form pristine only once the mutation resolves; keeping it dirty until then is what makes the
        bar disappear at the right moment.
      </p>

      <h2>Form submission and per-instance message</h2>
      <p>
        Set <code>saveType="submit"</code> to wire the built-in Save to native form submission:
        handle <code>(ngSubmit)</code> instead of <code>(saved)</code>, and pressing Enter in a
        field saves too. Note the asymmetry — that Enter-to-save shortcut exists
        <em>only</em> with <code>saveType="submit"</code>; the default button never submits on
        Enter. Give a single surface its own copy with the <code>message</code> input (it overrides
        the Label Contract default without a scoped provider and is what the LiveAnnouncer speaks),
        and size both built-in buttons with <code>size</code>.
      </p>
      <hd-example-tabs [code]="saveBarFormSubmitExampleCode">
        <app-save-bar-form-submit-example />
      </hd-example-tabs>

      <h2>Persistent mode for settings surfaces</h2>
      <p>
        Always-editable surfaces keep a stable footer with <code>mode="persistent"</code>. The
        unsaved-changes message still tracks <code>dirty</code>, and extra footer-anchored actions
        — Reset, Delete — project into the actions part before the built-in buttons.
      </p>
      <hd-example-tabs [code]="saveBarPersistentSettingsExampleCode">
        <app-save-bar-persistent-settings-example />
      </hd-example-tabs>

      <h2>Sticky inside a scroll container</h2>
      <p>
        The bar renders in normal flow and sticks to the bottom of its nearest scroll container —
        no fixed-position portal, no overlap: scroll to the end and the last field sits above the
        bar, never behind it. Master-detail screens compose the same bar inside the split-view
        detail pane.
      </p>
      <hd-example-tabs [code]="saveBarStickyScrollExampleCode">
        <app-save-bar-sticky-scroll-example />
      </hd-example-tabs>

      <h2>Recipe: app-shell placement</h2>
      <p>
        In an app shell, <code>hellAppContent</code> is the scroll container. Place the bar at the
        end of the routed page content and it docks to the content region's viewport while the
        page scrolls behind it:
      </p>
      <hd-code-block [code]="appShellRecipe" />

      <h2>Recipe: discard through the confirm function</h2>
      <p>
        <code>discarded</code> is just an event — route it through
        <a href="/components/confirm">the confirm function</a> when discards should be recoverable.
        The same pairing backs the
        <a href="/components/confirm">unsaved-changes route guard recipe</a>: the bar makes
        dirtiness visible in place, the guard catches navigation.
      </p>
      <hd-example-tabs [code]="saveBarConfirmDiscardExampleCode">
        <app-save-bar-confirm-discard-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>hell-save-bar</code> owns five Public Parts. Its <code>ui</code> input takes either a
        shorthand class string (applied to <code>root</code>) or a map keyed by the part names
        below; refinements merge deterministically through Hell's Tailwind merge. The built-in
        buttons render on the button primitive, so <code>save</code> and <code>discard</code>
        refinements merge into each button's own recipe. State is exposed as
        <code>data-mode</code>, <code>data-dirty</code>, and <code>data-busy</code> on the root.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th><code>data-slot</code></th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td><code>root</code></td>
            <td>The sticky bar itself — bordered, elevated surface, bottom-docked.</td>
          </tr>
          <tr>
            <td><code>message</code></td>
            <td><code>message</code></td>
            <td>The unsaved-changes message, rendered while dirty.</td>
          </tr>
          <tr>
            <td><code>actions</code></td>
            <td><code>actions</code></td>
            <td>The row holding projected extra actions plus Discard and Save.</td>
          </tr>
          <tr>
            <td><code>discard</code></td>
            <td><code>discard</code></td>
            <td>The built-in Discard button (ghost, busy-gated).</td>
          </tr>
          <tr>
            <td><code>save</code></td>
            <td><code>save</code></td>
            <td>The built-in Save button (primary, busy- and disabled-gated).</td>
          </tr>
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-save-bar&gt;</code> — the owned-anatomy Composite.
          <ul>
            <li>
              <code>mode</code>: <code>'contextual' | 'persistent'</code>. Contextual renders the
              bar only while dirty; persistent keeps it always visible. Default
              <code>'contextual'</code>.
            </li>
            <li>
              <code>dirty</code>: <code>boolean</code>. Shows the bar (contextual) and the message
              (both modes). Default <code>false</code>.
            </li>
            <li>
              <code>busy</code>: <code>boolean</code>. Gates both actions and shows a progress
              glyph in Save. Default <code>false</code>.
            </li>
            <li>
              <code>disabled</code>: <code>boolean</code>. Gates Save only. Default
              <code>false</code>.
            </li>
            <li>
              <code>message</code>: <code>string | undefined</code>. Per-instance unsaved-changes
              message; overrides the Label Contract default for this bar and is the text the
              LiveAnnouncer speaks. Default <code>undefined</code> (falls back to the contract).
            </li>
            <li>
              <code>saveType</code>: <code>'button' | 'submit'</code>. <code>'button'</code> (the
              default) emits only <code>saved</code> and never submits an enclosing form;
              <code>'submit'</code> opts into native form submission. Default
              <code>'button'</code>.
            </li>
            <li>
              <code>size</code>: <code>HellSize</code> (<code>'xs' | 'sm' | 'md' | 'lg' | 'xl'</code>),
              forwarded to both built-in buttons. Default <code>'sm'</code>.
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellSaveBarPart&gt;</code> where
              <code>HellSaveBarPart = 'root' | 'message' | 'actions' | 'save' | 'discard'</code>.
              Exports <code>HellSaveBarUi</code>.
            </li>
            <li>
              <code>(saved)</code>, <code>(discarded)</code>: emitted when the built-in actions are
              activated. The consumer performs the mutation or reset and drives
              <code>busy</code>/<code>dirty</code>.
            </li>
            <li>
              Projected content renders into the actions part, before the built-in buttons.
            </li>
          </ul>
        </li>
        <li>
          <code>provideHellSaveBarLabels(overrides)</code> — override any subset of the message and
          button labels (<code>HellSaveBarLabels</code>) for an injector scope. Exposed token:
          <code>HELL_SAVE_BAR_LABELS</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Appearance never steals focus; the bar renders in document order after the form fields,
          so Tab reaches Discard and Save right where a keyboard user expects them.
        </li>
        <li>
          On contextual appearance the message is announced once through the CDK LiveAnnouncer
          (polite) — the bar itself is not a live region, so it cannot interrupt typing or produce
          announcement storms.
        </li>
        <li>
          The slide-in transition is disabled under <code>prefers-reduced-motion</code>; the bar
          simply appears. The busy glyph stops spinning under the same preference.
        </li>
        <li>
          Gated actions use native <code>disabled</code>, and the busy glyph is decorative
          (<code>aria-hidden</code>); the Save label stays stable while busy.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Bind <code>dirty</code>/<code>disabled</code>/<code>busy</code> straight to reactive form state and your in-flight signal.</li>
        <li>Keep the bar inside the pane it saves — the content region, not a global footer portal.</li>
        <li>Route <code>discarded</code> through the confirm function when edits are expensive to lose.</li>
        <li>Use <code>persistent</code> mode for settings pages that are always editable.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't clear <code>busy</code> optimistically — wait for the mutation to resolve, then mark the form pristine.</li>
        <li>Don't bind <code>(saved)</code> when you've opted into <code>saveType="submit"</code> — handle <code>(ngSubmit)</code> instead, or the save runs twice.</li>
        <li>Don't rebuild dirty tracking in the bar's place — the form already knows; the bar just shows it.</li>
      </ul>
    </article>
  `,
})
export class SaveBarPage {
  protected readonly saveBarContextualFormExampleCode = saveBarContextualFormExampleCodeRaw;
  protected readonly saveBarFormSubmitExampleCode = saveBarFormSubmitExampleCodeRaw;
  protected readonly saveBarPersistentSettingsExampleCode = saveBarPersistentSettingsExampleCodeRaw;
  protected readonly saveBarStickyScrollExampleCode = saveBarStickyScrollExampleCodeRaw;
  protected readonly saveBarConfirmDiscardExampleCode = saveBarConfirmDiscardExampleCodeRaw;

  protected readonly appShellRecipe = `<div hellAppShell>
  <header hellAppTopbar>…</header>
  <nav hellAppSidenav>…</nav>
  <main hellAppContent>
    <!-- routed page content -->
    <form [formGroup]="form">
      …fields…
      <hell-save-bar
        [dirty]="form.dirty"
        [disabled]="form.invalid || form.pending"
        [busy]="saving()"
        (saved)="save()"
        (discarded)="form.reset(initialValue)"
      />
    </form>
  </main>
</div>`;
}
