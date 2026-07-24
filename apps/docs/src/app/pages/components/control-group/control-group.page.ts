import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ControlGroupBasicExample } from './examples/basic.example';
import controlGroupBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ControlGroupOverflowExample } from './examples/overflow.example';
import controlGroupOverflowExampleCodeRaw from './examples/overflow.example.ts?raw' with {
  loader: 'text',
};
import { ControlGroupStatesExample } from './examples/states.example';
import controlGroupStatesExampleCodeRaw from './examples/states.example.ts?raw' with {
  loader: 'text',
};
import { ControlGroupStylingExample } from './examples/styling.example';
import controlGroupStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-control-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ControlGroupBasicExample,
    ControlGroupOverflowExample,
    ControlGroupStatesExample,
    ControlGroupStylingExample,
    ExampleTabs,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Control Group"
        icon="faSolidLayerGroup"
        category="Styled primitive"
        importPath="hell-ui/control-group"
        stylesPath="hell-ui/control-group/styles.css"
      >
        <code>hellControlGroup</code> gives a consumer-owned input or trigger one shared visual
        frame with prefix, suffix, and button-action surfaces.
      </hd-page-header>

      <p>
        Control Group is a directive-first composition primitive: it owns no value, form model,
        or hidden control. Put the real input or trigger in the middle, arrange the optional
        surfaces in the order your workflow needs, and keep the control's native behavior intact.
        The root owns the shared frame and reflects focus-within, size, invalid, and disabled
        state for styling and accessibility.
      </p>

      <h2>Basic composition</h2>
      <p>
        The prefix and suffix are non-interactive content. The action is a native button whose
        default <code>type</code> is <code>button</code>, so it cannot accidentally submit an
        enclosing form. This example composes the group with <code>hellInput</code> and
        <code>hellField</code>; the input remains the real form control.
      </p>
      <p>
        The surfaces share one padding rhythm — one step per size (<code>hell-2</code> at
        <code>sm</code>, <code>hell-3</code> at <code>md</code>, <code>hell-4</code> at
        <code>lg</code>). The prefix and suffix pad only their outer edge; the grouped control
        supplies one step of horizontal padding per side, which is both the inner gap and the
        clip buffer for a scrolled value; actions pad one step on both sides of their divider.
        The <code>ui</code> string on the input in this example is that documented control
        padding.
      </p>
      <hd-example-tabs [code]="basicExampleCode" previewClass="grid max-w-xl gap-2">
        <app-control-group-basic-example />
      </hd-example-tabs>

      <h2>Overflow</h2>
      <p>
        The frame never grows or wraps for content. The grouped control is the only flexible
        surface (<code>flex-1 min-w-0</code> in its <code>ui</code>), so a very long unbroken
        value scrolls natively inside the control and clips one padding step away from its
        neighbors. The prefix and suffix hold their intrinsic size while the control has room;
        in an over-constrained frame they truncate with an ellipsis instead of clipping at the
        frame edge, and actions never shrink. When the value must stay readable in a cramped
        layout, give the control a small floor such as <code>min-w-16</code> and pin a
        must-read affix with <code>ui="shrink-0"</code>, as the narrow composition below does.
      </p>
      <hd-example-tabs [code]="overflowExampleCode" previewClass="grid max-w-xl gap-2">
        <app-control-group-overflow-example />
      </hd-example-tabs>

      <h2>Sizes and states</h2>
      <p>
        The root accepts <code>sm</code>, <code>md</code>, or <code>lg</code> and mirrors that value
        to every composition surface. <code>invalid</code> and <code>disabled</code> produce stable
        <code>data-*</code> attributes plus <code>aria-invalid</code> and
        <code>aria-disabled</code> on the group. Bind the same state to the real control so it
        keeps native validation, focus, and form-submission semantics; group actions inherit
        disabled state automatically.
      </p>
      <hd-example-tabs [code]="statesExampleCode" previewClass="grid gap-2">
        <app-control-group-states-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Each directive owns one <code>root</code> Public Part and its own <code>ui</code> input.
        The group cannot style projected child directives remotely: refine the root, prefix,
        suffix, action, and real control at their local Part Style Maps. The example below uses
        all five local styling seams while preserving the four-surface Control Group Interface.
        A filled affix opts back into a stretched flex surface
        (<code>inline-flex items-center self-stretch</code>) plus its own symmetric padding,
        because the default affix is a self-centered block that pads only its outer edge.
      </p>
      <hd-example-tabs [code]="stylingExampleCode" previewClass="grid gap-2">
        <app-control-group-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Directive</th>
            <th>Interface</th>
            <th>Stable attributes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>[hellControlGroup]</code></td>
            <td>
              <code>size: 'sm' | 'md' | 'lg'</code>, <code>invalid: boolean</code>,
              <code>disabled: boolean</code>, <code>ui: HellUiInput&lt;'root'&gt;</code>
            </td>
            <td>
              <code>role="group"</code>, <code>data-slot="root"</code>,
              <code>data-size</code>, <code>data-focus-within="true"</code>,
              <code>data-invalid="true"</code>, <code>data-disabled="true"</code>,
              <code>aria-invalid</code>, <code>aria-disabled</code>
            </td>
          </tr>
          <tr>
            <td><code>[hellControlGroupPrefix]</code></td>
            <td><code>ui: HellUiInput&lt;'root'&gt;</code></td>
            <td><code>data-slot="root"</code> plus mirrored size, invalid, and disabled state</td>
          </tr>
          <tr>
            <td><code>[hellControlGroupSuffix]</code></td>
            <td><code>ui: HellUiInput&lt;'root'&gt;</code></td>
            <td><code>data-slot="root"</code> plus mirrored size, invalid, and disabled state</td>
          </tr>
          <tr>
            <td><code>button[hellControlGroupAction]</code></td>
            <td><code>disabled: boolean</code>, <code>ui: HellUiInput&lt;'root'&gt;</code></td>
            <td>
              <code>data-slot="root"</code>, mirrored state, native <code>disabled</code>, and a
              safe default <code>type="button"</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The root uses <code>role="group"</code>. Give it an accessible name with
          <code>aria-label</code> or <code>aria-labelledby</code>, especially when an action sits
          beside the control.
        </li>
        <li>
          Keep a real label on the input or trigger. If a visual prefix or suffix communicates a
          unit or protocol, include that meaning in the control label or description too.
        </li>
        <li>
          <code>invalid</code> and <code>disabled</code> describe the shared frame. Bind those
          states to the native control as shown; the wrapper never fakes native disabled or form
          behavior.
        </li>
        <li>
          Focus may move from the input to an action without dropping
          <code>data-focus-within</code>; it clears only when focus leaves the complete group.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Compose one real field-like control and only the adornments that clarify its task.</li>
        <li>Use prefix or suffix for compact units, protocols, or stable context.</li>
        <li>Give every icon-only action an accessible name.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't store a second value on the group; the projected control remains the state machine.</li>
        <li>Don't rely on a visual suffix such as “USD” as the control's only unit announcement.</li>
        <li>Don't mark only the wrapper disabled while leaving the native control operable.</li>
      </ul>
    </article>
  `,
})
export class ControlGroupPage {
  protected readonly basicExampleCode = controlGroupBasicExampleCodeRaw;
  protected readonly overflowExampleCode = controlGroupOverflowExampleCodeRaw;
  protected readonly statesExampleCode = controlGroupStatesExampleCodeRaw;
  protected readonly stylingExampleCode = controlGroupStylingExampleCodeRaw;
}
