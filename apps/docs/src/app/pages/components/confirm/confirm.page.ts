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
import { PopconfirmRowDeleteExample } from './examples/popconfirm-row-delete.example';
import popconfirmRowDeleteExampleCodeRaw from './examples/popconfirm-row-delete.example.ts?raw' with {
  loader: 'text',
};
import { ConfirmChoiceUnsavedChangesExample } from './examples/choice-unsaved-changes.example';
import confirmChoiceUnsavedChangesExampleCodeRaw from './examples/choice-unsaved-changes.example.ts?raw' with {
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
    PopconfirmRowDeleteExample,
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
        Promise-based confirmation functions on the dialog and popover primitives:
        ask a prompt, offer composable actions, and await a plain answer — so
        destructive flows read top-to-bottom instead of wiring a dialog component
        per screen.
      </hd-page-header>
      <p>
        The confirm entry point is a <strong>Composite</strong> built around one idea: a
        confirmation is a <em>prompt</em> plus <em>actions</em>. The prompt is a string or
        <code>{{ '{' }} title, description? {{ '}' }}</code>; actions are opaque values built with
        the <code>hell*Action</code> combinators, aligned with the button variant vocabulary.
        Inject one of three functions and <code>await</code> it:
      </p>
      <ul>
        <li><code>injectHellConfirm()</code> — a modal yes/no decision resolving <code>boolean</code>.</li>
        <li><code>injectHellPopconfirm()</code> — the same decision anchored to a control, resolving <code>boolean</code>.</li>
        <li><code>injectHellChoice()</code> — a modal N-way decision resolving a typed key or <code>null</code>.</li>
      </ul>
      <p>
        Every promise <strong>always resolves</strong> — Escape, a backdrop or outside click, and
        the cancel button resolve <code>false</code> (or the choice's dismiss-equivalent key) — so
        you never wrap a confirmation in try/catch. Modal calls <strong>queue</strong>: two confirm
        surfaces never show at once.
      </p>

      <h2>Basic</h2>
      <p>
        Inject the function once, then <code>await confirm(prompt, action)</code>. The dialog is
        named by the prompt title and described by its description; focus is trapped inside and
        returned to the trigger when it closes. A non-destructive action holds initial focus.
        Without an action, the confirm button falls back to the Label Contract's default primary
        action.
      </p>
      <hd-example-tabs [code]="confirmBasicExampleCode">
        <app-confirm-basic-example />
      </hd-example-tabs>

      <h2>Destructive</h2>
      <p>
        Build the confirm action with <code>hellDestructiveAction</code> for anything that destroys
        data: the button takes the destructive <code>danger</code> variant and initial focus moves
        to <em>cancel</em> so an Enter-by-habit doesn't delete anything. The optional third
        parameter replaces the default cancel button — here
        <code>hellSecondaryAction('Keep project')</code> names the way out in the user's words.
      </p>
      <hd-example-tabs [code]="confirmDangerExampleCode">
        <app-confirm-danger-example />
      </hd-example-tabs>

      <h2>Countdown</h2>
      <p>
        <code>hellCountdownAction(seconds, action)</code> decorates any action with a gate: its
        button stays disabled with a visible remaining-seconds suffix (formatted through the Label
        Contract) so a user cannot reflexively confirm something irreversible. The countdown only
        <strong>gates enabling</strong> — it never auto-confirms; the user still has to click.
      </p>
      <hd-example-tabs [code]="confirmCountdownExampleCode">
        <app-confirm-countdown-example />
      </hd-example-tabs>

      <h2>Popconfirm: anchored confirmation</h2>
      <p>
        For lightweight confirmations that belong next to their control — a row delete, an inline
        "remove" — <code>injectHellPopconfirm()</code> is the same linear control flow on the
        popover primitive. Pass the anchor element, a prompt, and an action; the panel opens
        against the anchor, focus moves into it, and the promise resolves <code>true</code> only on
        confirm. Escape and outside clicks dismiss through the shared Floating Dismissal rules and
        return focus to the anchor.
      </p>
      <p>
        Only one popconfirm is open at a time — arming a second row's delete closes the first and
        resolves it <code>false</code>, so "armed delete" states can never accumulate.
      </p>
      <hd-example-tabs [code]="popconfirmRowDeleteExampleCode">
        <app-popconfirm-row-delete-example />
      </hd-example-tabs>

      <h2>Choice: N-way decisions</h2>
      <p>
        Some confirmations have more than two honest answers. <code>injectHellChoice()</code>
        renders one button per <code>hellChoiceAction(key, action)</code> and resolves the chosen
        key, typed from the actions you pass. Escape and backdrop dismissal resolve the key of the
        single action marked <code>dismissEquivalent</code> — else <code>null</code> — so "the user
        walked away" has an explicit meaning instead of a nested second confirm.
      </p>
      <p>
        The canonical shape is unsaved changes: save / discard / keep-editing as one linear
        decision. With a destructive action present, initial focus moves to the safe
        dismiss-equivalent action, and Escape means "keep editing" — not a silent nothing.
      </p>
      <hd-example-tabs [code]="confirmChoiceUnsavedChangesExampleCode">
        <app-confirm-choice-unsaved-changes-example />
      </hd-example-tabs>

      <h3>Recipe: unsaved-changes route guard</h3>
      <p>
        Hell ships no <code>CanDeactivate</code> guard — the framework-agnostic surface stays
        small — but <code>choice()</code> composes into one cleanly: save / discard / keep-editing
        as one linear decision, with keep-editing as the dismiss equivalent. This recipe is
        documentation only; copy it into your app:
      </p>
      <pre><code>{{ routeGuardRecipe }}</code></pre>
      <p>
        Because the promise always resolves, the guard never needs a try/catch: Escape and a
        backdrop click resolve <code>'stay'</code> through the dismiss-equivalent action, which
        keeps the user on the page.
      </p>

      <h2>API</h2>
      <h3>Prompts and actions</h3>
      <ul>
        <li>
          <code>HellConfirmPrompt</code> — <code>string | {{ '{' }} title: string; description?: string {{ '}' }}</code>.
          The title names the surface; the description is linked as its accessible description.
        </li>
        <li>
          <code>hellPrimaryAction(label)</code> / <code>hellSecondaryAction(label)</code> /
          <code>hellDestructiveAction(label)</code> — build an opaque
          <code>HellConfirmAction</code> with the <code>primary</code> / <code>default</code> /
          <code>danger</code> button variant. Destructive actions move initial focus to the safe
          alternative.
        </li>
        <li>
          <code>hellCountdownAction(seconds, action)</code> — decorator; disables the action's
          button for <code>seconds</code> with a Label-Contract-formatted suffix. Gating only.
        </li>
        <li>
          <code>hellChoiceAction(key, action, {{ '{' }} dismissEquivalent? {{ '}' }})</code> — binds
          an action to the typed key a choice resolves with; at most one action per choice may be
          dismiss-equivalent.
        </li>
        <li>
          <code>HellConfirmAction</code> and <code>HellChoiceAction&lt;K&gt;</code> are opaque —
          the combinators are their only constructors.
        </li>
      </ul>
      <h3>Inject functions</h3>
      <ul>
        <li>
          <code>injectHellConfirm(): (prompt, action?, cancelAction?) =&gt; Promise&lt;boolean&gt;</code>
          — modal confirmation. No <code>action</code> means the Label Contract's default primary
          action; <code>cancelAction</code> replaces the default cancel button. Calls queue.
        </li>
        <li>
          <code>injectHellPopconfirm(): (anchor, prompt, action?) =&gt; Promise&lt;boolean&gt;</code>
          — anchored confirmation on the popover primitive. Single-open: opening one dismisses
          another and resolves it <code>false</code>. Must be injected in a component or directive.
        </li>
        <li>
          <code>injectHellChoice(): (prompt, actions) =&gt; Promise&lt;K | null&gt;</code> — modal
          N-way decision; resolves the activated action's key, the dismiss-equivalent key on
          dismissal, else <code>null</code>. Shares the confirm queue.
        </li>
      </ul>
      <h3>Also exported</h3>
      <ul>
        <li>
          <code>HellConfirmFn</code>, <code>HellPopconfirmFn</code>, <code>HellChoiceFn</code> —
          the function types returned by the inject functions, for typing fields.
        </li>
        <li>
          <code>HellConfirmLabels</code>, <code>HELL_CONFIRM_LABELS</code>,
          <code>provideHellConfirmLabels()</code> — the Label Contract for the default
          <code>confirm</code> action label, the default <code>cancel</code> label, and the
          <code>countdown</code> suffix formatter.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Modal confirmations are dialogs from the underlying primitive: content outside is inert while open, focus is trapped inside and restored to the opener on close.</li>
        <li>Popconfirm panels are anchored dialogs on the popover primitive: focus moves into the panel on open and returns to the anchor on close, and Escape or an outside click dismisses through the shared Floating Dismissal rules.</li>
        <li>Every surface is named by its prompt title (<code>aria-labelledby</code>) and, when present, described by its description (<code>aria-describedby</code>).</li>
        <li>Destructive and countdown-gated actions start focus on the safe alternative: the cancel button, or a choice's safe dismiss-equivalent action.</li>
        <li>Every built-in string — the default action labels and the countdown suffix — sits behind the Label Contract. Override them with <code>provideHellConfirmLabels()</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use it for blocking decisions, and <code>await</code> the result inline.</li>
        <li>Name actions with specific verbs ("Delete project"), not "OK".</li>
        <li>Use <code>hellDestructiveAction</code> for anything that destroys data, and add a <code>hellCountdownAction</code> gate when the blast radius is high.</li>
        <li>Reach for <code>choice()</code> when a decision has a third honest answer — never nest confirms.</li>
        <li>Override built-in labels through <code>provideHellConfirmLabels()</code> for localization.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a confirmation for non-blocking feedback — use Toast.</li>
        <li>Don't rely on a rejected promise for cancellation; the promise always resolves.</li>
        <li>Don't put forms or checkboxes inside a confirmation — the moment it needs input, it is a dialog; compose the dialog primitive instead.</li>
        <li>Don't open confirmations in a loop expecting them to stack — modal calls queue one at a time.</li>
        <li>Don't put the only way out behind the countdown; cancel, Escape, and the backdrop always work.</li>
      </ul>
    </article>
  `,
})
export class ConfirmPage {
  protected readonly confirmBasicExampleCode = confirmBasicExampleCodeRaw;
  protected readonly confirmDangerExampleCode = confirmDangerExampleCodeRaw;
  protected readonly confirmCountdownExampleCode = confirmCountdownExampleCodeRaw;
  protected readonly popconfirmRowDeleteExampleCode = popconfirmRowDeleteExampleCodeRaw;
  protected readonly confirmChoiceUnsavedChangesExampleCode =
    confirmChoiceUnsavedChangesExampleCodeRaw;

  protected readonly routeGuardRecipe = `import { CanDeactivateFn } from '@angular/router';
import {
  hellChoiceAction,
  hellDestructiveAction,
  hellPrimaryAction,
  hellSecondaryAction,
  injectHellChoice,
} from '@hell-ui/angular/confirm';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
  save(): Promise<void>;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  if (!component.hasUnsavedChanges()) return true;

  const choose = injectHellChoice();
  const decision = await choose(
    {
      title: 'You have unsaved changes',
      description: 'Save them, discard them, or keep editing this page.',
    },
    [
      hellChoiceAction('save', hellPrimaryAction('Save and leave')),
      hellChoiceAction('discard', hellDestructiveAction('Discard changes')),
      hellChoiceAction('stay', hellSecondaryAction('Keep editing'), { dismissEquivalent: true }),
    ],
  );

  switch (decision) {
    case 'save':
      await component.save();
      return true;
    case 'discard':
      return true;
    default:
      return false; // 'stay' — Escape and backdrop land here too
  }
};`;
}
