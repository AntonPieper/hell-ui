import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ButtonBasicExample } from './examples/basic.example';
import buttonBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ButtonBlockExample } from './examples/block.example';
import buttonBlockExampleCodeRaw from './examples/block.example.ts?raw' with {
  loader: 'text',
};
import { ButtonFormActionsExample } from './examples/form-actions.example';
import buttonFormActionsExampleCodeRaw from './examples/form-actions.example.ts?raw' with {
  loader: 'text',
};
import { ButtonIconsExample } from './examples/icons.example';
import buttonIconsExampleCodeRaw from './examples/icons.example.ts?raw' with {
  loader: 'text',
};
import { ButtonSizesExample } from './examples/sizes.example';
import buttonSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { ButtonStylingExample } from './examples/styling.example';
import buttonStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { ButtonVariantsExample } from './examples/variants.example';
import buttonVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ButtonBasicExample,
    ButtonVariantsExample,
    ButtonSizesExample,
    ButtonIconsExample,
    ButtonBlockExample,
    ButtonFormActionsExample,
    ButtonStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Button"
        icon="faSolidHandPointer"
        category="Styled primitive"
        importPath="hell-ui/button"
        stylesPath="hell-ui/button/styles.css"
      >
        Triggers an action or navigation with guarded disabled semantics on both buttons and anchors.
      </hd-page-header>
      <p>
        <code>hellButton</code> is a directive you attach to a native <code>&lt;button&gt;</code> or
        <code>&lt;a&gt;</code>, built on the <code>NgpButton</code> primitive from
        <code>ng-primitives</code> for keyboard, focus, and disabled handling. It adds
        <code>variant</code>, <code>size</code>, <code>iconOnly</code>, and <code>block</code>
        inputs on top, plus a single-part <code>ui</code> Part Style Map.
      </p>
      <p>
        Because it is a directive rather than a wrapper component, it never gets between you and
        the host element — you keep full control over attributes like <code>type</code>,
        <code>href</code>, or <code>routerLink</code>. This makes it the default choice for every
        clickable action in a dense business app: toolbar actions, dialog footers, form submit
        rows, and inline links styled as buttons all use the same directive.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="buttonBasicExampleCode">
        <app-button-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        Seven variants cover the emphasis levels a business app needs: <code>primary</code> for
        the one main action in a region, <code>default</code> and <code>soft</code> for secondary
        actions, <code>ghost</code> and <code>link</code> for low-emphasis actions, and
        <code>danger</code> / <code>success</code> for destructive or confirming actions.
      </p>
      <hd-example-tabs [code]="buttonVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-button-variants-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs
        [code]="buttonSizesExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-sizes-example />
      </hd-example-tabs>

      <h2>Icons</h2>
      <p>
        Project a <code>hell-icon</code> before or after the label for leading/trailing icons, or
        add <code>iconOnly</code> to render a square icon button. Always pair
        <code>iconOnly</code> with an <code>aria-label</code>, since there is no visible text left
        to name the action.
      </p>
      <hd-example-tabs
        [code]="buttonIconsExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-icons-example />
      </hd-example-tabs>

      <h2>Block</h2>
      <p>
        Add <code>block</code> to stretch the button to its container's width — useful for stacked
        action groups in narrow layouts like dialogs or mobile sheets.
      </p>
      <hd-example-tabs [code]="buttonBlockExampleCode">
        <app-button-block-example />
      </hd-example-tabs>

      <h2>With field and input</h2>
      <p>
        A typical form actions row: a <code>hellField</code>-wrapped <code>hellInput</code> with a
        cancel/submit pair below it. The primary button reflects the pending save state through its
        own <code>disabled</code> input and label, without any extra plumbing.
      </p>
      <hd-example-tabs [code]="buttonFormActionsExampleCode">
        <app-button-form-actions-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellButton</code> exposes exactly one Public Part, <code>root</code> — the host
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the variant/size recipe through
        Hell's Tailwind merge, so refinements win deterministically over the defaults they
        conflict with.
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
            <td>The button/anchor host element — background, border, text, radius, shadow.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Template <code>class</code> still works for layout hooks and non-conflicting utilities, but
        prefer <code>ui</code> whenever a refinement needs to win over a recipe class such as
        <code>bg-hell-surface-elevated</code> or <code>px-hell-5</code>.
      </p>
      <hd-example-tabs
        [code]="buttonStylingExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-button-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>variant</code>: <code>HellButtonVariant</code> —
          <code>default | primary | soft | ghost | link | danger | success</code>. Default
          <code>default</code>.
        </li>
        <li><code>size</code>: <code>HellSize</code> — <code>xs | sm | md | lg | xl</code>. Default <code>md</code>.</li>
        <li><code>iconOnly</code>: <code>boolean</code>. Renders a square icon-button shape. Default <code>false</code>.</li>
        <li><code>block</code>: <code>boolean</code>. Stretches the button to the container's width. Default <code>false</code>.</li>
        <li>
          <code>disabled</code>: <code>boolean</code> (inherited from <code>NgpButton</code>).
          Applies the native <code>disabled</code> attribute on <code>&lt;button&gt;</code> hosts;
          on <code>&lt;a&gt;</code> hosts it sets <code>aria-disabled="true"</code>,
          <code>tabindex="-1"</code>, and blocks click/Enter activation.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — a shorthand class
          string or a <code>&#123; root?: string &#125;</code> map that
          refines the <code>root</code> public part.
        </li>
        <li>
          </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          On a <code>&lt;button&gt;</code> host, the directive defaults the native
          <code>type</code> attribute to <code>"button"</code> unless you set it explicitly (for
          example <code>type="submit"</code>), so buttons never accidentally submit a form.
        </li>
        <li>
          On a <code>&lt;button&gt;</code> host, <code>disabled</code> uses the native
          <code>disabled</code> attribute; disabled anchors instead get
          <code>aria-disabled="true"</code> and <code>tabindex="-1"</code>, and both
          <code>click</code> and <code>Enter</code> keydown are prevented so a disabled link never
          navigates.
        </li>
        <li>
          Focus visibility comes from the shared focus-ring token
          (<code>data-focus-visible</code>) and survives <code>ui</code> overrides because it is
          part of the base recipe.
        </li>
        <li>Icon-only buttons carry no accessible name from content, so they must set <code>aria-label</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use <code>primary</code> sparingly — one per region, for the one action you want the user to take.</li>
        <li>Use <code>ghost</code> or <code>link</code> for low-emphasis actions in toolbars and rows.</li>
        <li>Always pair <code>iconOnly</code> with an <code>aria-label</code>.</li>
        <li>Use <code>ui</code> instead of conflicting <code>class</code> utilities for visual refinements.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put two <code>danger</code> or two <code>primary</code> buttons next to each other.</li>
        <li>Don't target private descendants — <code>root</code> is the only public part.</li>
        <li>Don't rely on template <code>class</code> order to beat recipe utilities; use <code>ui</code> instead.</li>
      </ul>
    </article>
  `,
})
export class ButtonPage {
  protected readonly buttonBasicExampleCode = buttonBasicExampleCodeRaw;
  protected readonly buttonVariantsExampleCode = buttonVariantsExampleCodeRaw;
  protected readonly buttonSizesExampleCode = buttonSizesExampleCodeRaw;
  protected readonly buttonIconsExampleCode = buttonIconsExampleCodeRaw;
  protected readonly buttonBlockExampleCode = buttonBlockExampleCodeRaw;
  protected readonly buttonFormActionsExampleCode = buttonFormActionsExampleCodeRaw;
  protected readonly buttonStylingExampleCode = buttonStylingExampleCodeRaw;
}
