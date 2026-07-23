import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AccordionAllPartsStylingExample } from './examples/all-parts-styling.example';
import accordionAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { AccordionBasicExample } from './examples/basic.example';
import accordionBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AccordionDisabledItemExample } from './examples/disabled-item.example';
import accordionDisabledItemExampleCodeRaw from './examples/disabled-item.example.ts?raw' with {
  loader: 'text',
};
import { AccordionMultipleExample } from './examples/multiple.example';
import accordionMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { AccordionWithSettingsPanelExample } from './examples/with-settings-panel.example';
import accordionWithSettingsPanelExampleCodeRaw from './examples/with-settings-panel.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    AccordionBasicExample,
    AccordionMultipleExample,
    AccordionDisabledItemExample,
    AccordionWithSettingsPanelExample,
    AccordionAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Accordion"
        icon="faSolidLayerGroup"
        category="Styled primitive"
        importPath="hell-ui/accordion"
        stylesPath="hell-ui/accordion/styles.css"
      >
        Vertically stacked disclosure sections that reveal one panel — or several — at a time
        without leaving the page.
      </hd-page-header>
      <p>
        Accordion is a suite of four host directives —
        <code>hellAccordion</code>, <code>hellAccordionItem</code>,
        <code>hellAccordionTrigger</code>, and <code>hellAccordionContent</code> — built on
        <code>ng-primitives/accordion</code>. Each directive attaches to markup you already own
        (a wrapping <code>div</code>, a heading's <code>button</code>, a content
        <code>div</code>), contributing state, ARIA wiring, an animated expand/collapse
        transition, and one styleable <code>root</code> part rather than rendering its own
        template.
      </p>
      <p>
        Reach for it in dense business apps to defer secondary content until it's asked for: FAQ
        lists, grouped settings, or long forms split into named sections. Set
        <code>type="single"</code> so opening one section closes the others — good for
        navigation-like disclosure — or <code>type="multiple"</code> when panels hold independent
        reference content that can stay open side by side.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="accordionBasicExampleCode">
        <app-accordion-basic-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <p>
        Set <code>type="multiple"</code> so several items can stay expanded at once. The
        <code>value</code> becomes an array of open item values instead of a single value.
      </p>
      <hd-example-tabs [code]="accordionMultipleExampleCode">
        <app-accordion-multiple-example />
      </hd-example-tabs>

      <h2>Disabled item</h2>
      <p>
        Add the <code>disabled</code> attribute to a single <code>hellAccordionItem</code> to lock
        it closed while the rest of the accordion stays interactive — useful for gating content
        behind a plan or permission. Add <code>disabled</code> to <code>hellAccordion</code>
        itself to lock the whole group.
      </p>
      <hd-example-tabs [code]="accordionDisabledItemExampleCode">
        <app-accordion-disabled-item-example />
      </hd-example-tabs>

      <h2>With settings panel</h2>
      <p>
        Nest an accordion inside <code>hellCard</code> (narrow entry point
        <code>hell-ui/card</code>) for a grouped settings surface, and lead each trigger
        with a <code>hell-icon</code> (narrow entry point <code>hell-ui/icon</code>) so
        sections are scannable at a glance. Flatten the card body's padding and the accordion's own
        border with <code>ui</code> so the two components read as one surface.
      </p>
      <hd-example-tabs [code]="accordionWithSettingsPanelExampleCode">
        <app-accordion-with-settings-panel-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every accordion module follows the same Part Style Map shape: it owns exactly one public
        part, <code>root</code>, so its <code>ui</code> input takes either a shorthand class
        string or an explicit <code>{{ '{' }} root: string {{ '}' }}</code> map. Because each
        module is independent, refine the module you actually want to change instead of cascading
        classes down from <code>hellAccordion</code>.
      </p>
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
            <td><code>HellAccordion</code></td>
            <td><code>root</code></td>
            <td>The group container — border, radius, and background around every item.</td>
          </tr>
          <tr>
            <td><code>HellAccordionItem</code></td>
            <td><code>root</code></td>
            <td>One section wrapper, including the divider between items.</td>
          </tr>
          <tr>
            <td><code>HellAccordionTrigger</code></td>
            <td><code>root</code></td>
            <td>The clickable header button, its padding, and the chevron glyph.</td>
          </tr>
          <tr>
            <td><code>HellAccordionContent</code></td>
            <td><code>root</code></td>
            <td>The collapsible panel — text color and the animated height transition.</td>
          </tr>
        </tbody>
      </table>
      <p>The example below refines every part across every module in the entry point:</p>
      <hd-example-tabs [code]="accordionAllPartsStylingExampleCode">
        <app-accordion-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>Every directive below accepts <code>ui</code>: a shorthand class string or a map keyed by its part names.</p>
      <ul>
        <li>
          <code>[hellAccordion]</code> — group container (host directive <code>NgpAccordion</code>).
          <ul>
            <li><code>value</code>: <code>T | T[] | null</code>, default <code>null</code>. A single value in <code>type="single"</code>, an array in <code>type="multiple"</code>.</li>
            <li><code>valueChange</code>: <code>OutputEmitterRef&lt;T | T[] | null&gt;</code> — emits the new value whenever an item is toggled.</li>
            <li><code>type</code>: <code>'single' | 'multiple'</code>, default <code>'single'</code>.</li>
            <li><code>collapsible</code>: <code>boolean</code>, default <code>false</code>. In <code>type="single"</code>, allows closing the currently open item so nothing stays open.</li>
            <li><code>disabled</code>: <code>boolean</code>, default <code>false</code>. Disables every item in the group.</li>
            <li><code>orientation</code>: <code>'vertical' | 'horizontal'</code>, default <code>'vertical'</code>. Informational for assistive tech and CSS hooks only — layout stays consumer-owned.</li>
            <li><code>ui: HellUiInput&lt;'root'&gt;</code>.</li>
          </ul>
        </li>
        <li>
          <code>[hellAccordionItem]</code> — apply once per section (host directive <code>NgpAccordionItem</code>).
          <ul>
            <li><code>value</code>: <code>T</code>, required in practice — identifies the item within the group's <code>value</code>.</li>
            <li><code>disabled</code>: <code>boolean</code>, default <code>false</code>. Locks this item closed independent of the group.</li>
            <li><code>ui: HellUiInput&lt;'root'&gt;</code>.</li>
          </ul>
        </li>
        <li>
          <code>button[hellAccordionTrigger]</code> — the section header button (host directive <code>NgpAccordionTrigger</code>). Sets <code>type="button"</code> automatically.
          <ul>
            <li><code>ui: HellUiInput&lt;'root'&gt;</code>.</li>
          </ul>
        </li>
        <li>
          <code>[hellAccordionContent]</code> — the collapsible panel (host directive <code>NgpAccordionContent</code>). Mirrors the item's closed state to <code>aria-hidden</code> and <code>inert</code> so hidden content and its focusable descendants are unreachable while collapsed.
          <ul>
            <li><code>ui: HellUiInput&lt;'root'&gt;</code>.</li>
          </ul>
        </li>
        <li>Import every directive at once via <code>HELL_ACCORDION_IMPORTS</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Triggers are native <code>button</code> elements exposing <code>aria-expanded</code> and <code>aria-controls</code> pointing at their panel.</li>
        <li>The panel itself exposes <code>role="region"</code> and <code>aria-labelledby</code> pointing back at its trigger, via the underlying <code>ngpAccordionContent</code> primitive.</li>
        <li>
          Collapsed panels get <code>aria-hidden="true"</code> and <code>inert</code> from
          <code>hellAccordionContent</code>, removing their content — and any focusable
          descendants — from the accessibility tree and tab order while still keeping the element
          rendered so the expand/collapse transition can animate.
        </li>
        <li>Keyboard interaction is native: reach triggers with Tab, activate with Enter or Space. There is no roving-tabindex arrow-key navigation between triggers.</li>
        <li>Wrap each trigger in a real heading (<code>h3</code> in these examples) so the page outline stays navigable by screen reader users.</li>
      </ul>

      <ul class="hd-do">
        <li>Use <code>single</code> for navigation-like disclosure and <code>multiple</code> for independent reference content.</li>
        <li>Keep trigger text short, descriptive, and wrapped in a real heading element.</li>
        <li>Put padding inside <code>hellAccordionContent</code>'s children, not on the animated host itself.</li>
      </ul>
      <ul class="hd-dont">
        <li>Don't hide a validation error or other critical message inside a collapsed item — the user may never open it.</li>
        <li>Don't nest accordions inside accordions unless the hierarchy is genuinely unavoidable.</li>
        <li>Don't rely on arrow-key navigation between triggers — it isn't implemented; Tab order is the only keyboard path between sections.</li>
      </ul>
    </article>
  `,
})
export class AccordionPage {
  protected readonly accordionBasicExampleCode = accordionBasicExampleCodeRaw;
  protected readonly accordionMultipleExampleCode = accordionMultipleExampleCodeRaw;
  protected readonly accordionDisabledItemExampleCode = accordionDisabledItemExampleCodeRaw;
  protected readonly accordionWithSettingsPanelExampleCode =
    accordionWithSettingsPanelExampleCodeRaw;
  protected readonly accordionAllPartsStylingExampleCode = accordionAllPartsStylingExampleCodeRaw;
}
