import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ConfirmAnchoredRowDeleteExample } from './examples/anchored-row-delete.example';
import confirmAnchoredRowDeleteExampleCodeRaw from './examples/anchored-row-delete.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmBasicExample } from './examples/basic.example';
import confirmBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmChoiceUnsavedChangesExample } from './examples/choice-unsaved-changes.example';
import confirmChoiceUnsavedChangesExampleCodeRaw from './examples/choice-unsaved-changes.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmCountdownExample } from './examples/countdown.example';
import confirmCountdownExampleCodeRaw from './examples/countdown.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmDangerExample } from './examples/danger.example';
import confirmDangerExampleCodeRaw from './examples/danger.example.ts?raw' with {
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
    ConfirmAnchoredRowDeleteExample,
    ConfirmChoiceUnsavedChangesExample,
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
        One promise-based Prompt Interface for modal and anchored decisions: ask a question,
        offer typed actions, and await the answer inline.
      </hd-page-header>

      <p>
        Call <code>injectHellPrompt()</code> once in a component or directive to capture its label
        scope, Floating Scope, and view context. The returned <code>HellPrompt</code> has two
        methods over the same Interaction State Machine:
      </p>
      <ul>
        <li><code>confirm()</code> specializes the choice flow to <code>boolean</code>.</li>
        <li><code>choose&lt;TValue&gt;()</code> resolves the value of one <code>HellPromptAction&lt;TValue&gt;</code>.</li>
      </ul>
      <p>
        Calls without an <code>anchor</code> use the shared modal queue. Add an
        <code>anchor</code> and optional <code>placement</code> to either method for an anchored
        prompt on the popover primitive. Only one anchored prompt is open at a time; opening the
        next resolves the previous one through its dismissal policy.
      </p>
      <p>
        Every promise always resolves. Escape, backdrop or outside dismissal resolves the action
        marked <code>dismissEquivalent</code>, or <code>null</code> for a generic choice without
        one. <code>confirm()</code> always treats its cancel action as the dismiss equivalent, so
        dismissal resolves <code>false</code>.
      </p>

      <h2>Basic confirmation</h2>
      <p>
        Pass a title string or <code>{{ '{' }} title, description? {{ '}' }}</code> plus optional
        action data. The default action labels come from the Confirm Label Contract. A safe,
        enabled confirm action receives initial focus, the modal traps focus, and focus returns to
        the opener after resolution.
      </p>
      <hd-example-tabs [code]="confirmBasicExampleCode">
        <app-confirm-basic-example />
      </hd-example-tabs>

      <h2>Destructive confirmation</h2>
      <p>
        Use <code>variant: 'danger'</code> for a destructive action. The visible variant also
        activates the safe initial-focus policy, so the cancel action receives focus instead of a
        destructive or countdown-gated button. A custom <code>cancelAction</code> can name the safe
        path in the user's language.
      </p>
      <hd-example-tabs [code]="confirmDangerExampleCode">
        <app-confirm-danger-example />
      </hd-example-tabs>

      <h2>Countdown gating</h2>
      <p>
        Set <code>countdownSeconds</code> on any action to keep it disabled with a visible,
        Label-Contract-formatted suffix. Reaching zero only enables the button; it never selects
        the action automatically, and every dismissal path stays available.
      </p>
      <hd-example-tabs [code]="confirmCountdownExampleCode">
        <app-confirm-countdown-example />
      </hd-example-tabs>

      <h2>Anchored confirmation</h2>
      <p>
        Set <code>anchor</code> to keep a lightweight decision beside its control, and set
        <code>placement</code> when the default <code>'bottom'</code> position is not appropriate.
        The panel is still the same boolean choice: Escape and outside interaction resolve
        <code>false</code>, focus returns to the anchor, and the panel participates in the caller's
        Floating Scope.
      </p>
      <hd-example-tabs [code]="confirmAnchoredRowDeleteExampleCode">
        <app-confirm-anchored-row-delete-example />
      </hd-example-tabs>

      <h2>Generic choices</h2>
      <p>
        Use <code>choose&lt;TValue&gt;()</code> when a decision has more than two honest answers.
        Each plain <code>HellPromptAction&lt;TValue&gt;</code> carries its result <code>value</code>,
        visible <code>label</code>, optional button <code>variant</code>, optional
        <code>countdownSeconds</code>, and optional <code>dismissEquivalent</code>. At most one
        action may be dismiss-equivalent.
      </p>
      <p>
        With a destructive or gated action present, initial focus moves to the safe
        dismiss-equivalent action when available, then to the first safe action. Generic choices
        can also use <code>anchor</code> and <code>placement</code> without changing their value
        model.
      </p>
      <hd-example-tabs [code]="confirmChoiceUnsavedChangesExampleCode">
        <app-confirm-choice-unsaved-changes-example />
      </hd-example-tabs>

      <h3>Recipe: unsaved-changes route guard</h3>
      <p>
        Hell does not ship an application-specific <code>CanDeactivate</code> guard. Let the
        component capture its Prompt Interface and expose a navigation method; the environment
        guard then delegates without trying to inject a view-owned factory itself:
      </p>
      <pre tabindex="0"><code>{{ routeGuardRecipe }}</code></pre>

      <h2>API</h2>
      <h3><code>injectHellPrompt(): HellPrompt</code></h3>
      <ul>
        <li>
          <code class="break-all whitespace-normal"
            >confirm(prompt, {{ '{' }} action?, cancelAction?, anchor?, placement? {{ '}' }})</code
          >
          resolves <code>Promise&lt;boolean&gt;</code>. The action resolves <code>true</code>; cancel and
          dismissal resolve <code>false</code>.
        </li>
        <li>
          <code class="break-all whitespace-normal"
            >choose&lt;TValue&gt;(prompt, actions, {{ '{' }} anchor?, placement? {{ '}' }})</code
          >
          resolves <code>Promise&lt;TValue | null&gt;</code>.
        </li>
      </ul>

      <h3><code>HellPromptAction&lt;TValue&gt;</code></h3>
      <ul>
        <li><code>value: TValue</code> — resolution value.</li>
        <li><code>label: string</code> — visible button label.</li>
        <li>
          <code>variant?: HellButtonVariant</code> — <code>choose()</code> defaults to
          <code>'default'</code>; <code>confirm()</code> defaults its positive action to
          <code>'primary'</code>, an omitted cancel action to <code>'ghost'</code>, and an
          explicitly supplied cancel action without a variant to <code>'default'</code>.
        </li>
        <li><code>countdownSeconds?: number</code> — disabled countdown gate.</li>
        <li><code>dismissEquivalent?: boolean</code> — dismissal resolution and safe-focus candidate.</li>
      </ul>

      <h3>Label Contract</h3>
      <p>
        <code>HellConfirmLabels</code> and <code>HELL_CONFIRM_LABELS</code> provide the default
        confirm label, cancel label, and countdown suffix formatter. Override a subset with
        <code class="break-all whitespace-normal">provideHellLabels(HELL_CONFIRM_LABELS, …)</code>
        at the caller's injector scope.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>Every surface is named by the prompt title and linked to its optional description.</li>
        <li>Modal prompts trap focus, queue one at a time, and restore focus to each opener.</li>
        <li>Anchored prompts restore focus to their anchor and dismiss on Escape or outside interaction.</li>
        <li>Danger and countdown-gated actions do not receive automatic initial focus while a safe action exists.</li>
        <li>All built-in text remains scoped through the Confirm Label Contract.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use specific action labels such as "Delete project" instead of "OK".</li>
        <li>Use <code>choose&lt;TValue&gt;()</code> for a third honest answer instead of nesting confirmations.</li>
        <li>Use <code>anchor</code> only when the decision belongs directly beside its control.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a prompt for non-blocking feedback; use Toast.</li>
        <li>Don't rely on promise rejection for cancellation; prompt promises always resolve.</li>
        <li>Don't put forms in a prompt; compose the Dialog primitive for input workflows.</li>
        <li>Don't put the only way out behind a countdown gate.</li>
      </ul>
    </article>
  `,
})
export class ConfirmPage {
  protected readonly confirmBasicExampleCode = confirmBasicExampleCodeRaw;
  protected readonly confirmDangerExampleCode = confirmDangerExampleCodeRaw;
  protected readonly confirmCountdownExampleCode = confirmCountdownExampleCodeRaw;
  protected readonly confirmAnchoredRowDeleteExampleCode =
    confirmAnchoredRowDeleteExampleCodeRaw;
  protected readonly confirmChoiceUnsavedChangesExampleCode =
    confirmChoiceUnsavedChangesExampleCodeRaw;

  protected readonly routeGuardRecipe = `import { Component } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { injectHellPrompt } from '@hell-ui/angular/confirm';

@Component({ selector: 'app-editor-page', template: '' })
export class EditorPage {
  private readonly prompt = injectHellPrompt();
  private dirty = true;

  async confirmNavigation(): Promise<boolean> {
    if (!this.dirty) return true;

    const decision = await this.prompt.choose<'save' | 'discard' | 'stay'>(
      'You have unsaved changes',
      [
        { value: 'save', label: 'Save and leave', variant: 'primary' },
        { value: 'discard', label: 'Discard changes', variant: 'danger' },
        { value: 'stay', label: 'Keep editing', dismissEquivalent: true },
      ],
    );

    if (decision === 'save') this.dirty = false; // Persist first in a real editor.
    return decision !== 'stay' && decision !== null;
  }
}

export const unsavedChangesGuard: CanDeactivateFn<EditorPage> = (component) =>
  component.confirmNavigation();`;
}
