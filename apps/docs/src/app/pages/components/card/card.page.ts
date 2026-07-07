import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardAllPartsStylingExample } from './examples/all-parts-styling.example';
import cardAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { CardBasicExample } from './examples/basic.example';
import cardBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { CardElevationExample } from './examples/elevation.example';
import cardElevationExampleCodeRaw from './examples/elevation.example.ts?raw' with {
  loader: 'text',
};
import { CardEntitySummaryExample } from './examples/entity-summary.example';
import cardEntitySummaryExampleCodeRaw from './examples/entity-summary.example.ts?raw' with {
  loader: 'text',
};
import { CardWithFooterExample } from './examples/with-footer.example';
import cardWithFooterExampleCodeRaw from './examples/with-footer.example.ts?raw' with {
  loader: 'text',
};
import { CardWithoutHeaderExample } from './examples/without-header.example';
import cardWithoutHeaderExampleCodeRaw from './examples/without-header.example.ts?raw' with {
  loader: 'text',
};
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    CardBasicExample,
    CardElevationExample,
    CardWithoutHeaderExample,
    CardWithFooterExample,
    CardEntitySummaryExample,
    CardAllPartsStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Card"
        icon="faSolidIdCard"
        category="Styled primitive"
        importPath="@hell-ui/angular/card"
        stylesPath="@hell-ui/angular/card/styles.css"
      >
        A bordered surface with header, body, and footer regions for grouping one idea, object, or
        workflow.
      </hd-page-header>
      <p>
        Card is a suite of four host directives — <code>hellCard</code>,
        <code>hellCardHeader</code>, <code>hellCardBody</code>, and <code>hellCardFooter</code> —
        that attach to <code>div</code>s you already own instead of rendering their own template.
        Each directive contributes layout, borders, and spacing to its host element; there is no
        wrapper component and no projected content contract to fight.
      </p>
      <p>
        Reach for a card whenever a dense business app needs to visually group one idea, record, or
        workflow: a settings section, a single entity summary, a stat tile, a confirmation panel
        with actions. <code>hellCardHeader</code>, <code>hellCardBody</code>, and
        <code>hellCardFooter</code> are all optional and independent — compose whichever regions the
        content actually needs.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="cardBasicExampleCode">
        <app-card-basic-example />
      </hd-example-tabs>

      <h2>Elevation</h2>
      <p>
        <code>elevation</code> controls shadow depth from <code>0</code> (flat, border only) to
        <code>3</code> (floating). It reflects to a <code>data-elevation</code> attribute on the
        host, so the shadow lives in CSS rather than a class list you have to swap. Defaults to
        <code>1</code>.
      </p>
      <hd-example-tabs
        [code]="cardElevationExampleCode"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]"
      >
        <app-card-elevation-example />
      </hd-example-tabs>

      <h2>Without header or footer</h2>
      <p>
        Cards are composable, not a fixed three-slot template — drop the header and/or footer when
        the body speaks for itself.
      </p>
      <hd-example-tabs
        [code]="cardWithoutHeaderExampleCode"
        previewClass="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
      >
        <app-card-without-header-example />
      </hd-example-tabs>

      <h2>With footer actions</h2>
      <p>
        <code>hellCardFooter</code> right-aligns its content by default, which fits a
        cancel/confirm action row. Pair it with <code>hellButton</code> (narrow entry point
        <code>@hell-ui/angular/button</code>).
      </p>
      <hd-example-tabs [code]="cardWithFooterExampleCode">
        <app-card-with-footer-example />
      </hd-example-tabs>

      <h2>With entity summary</h2>
      <p>
        A realistic composite: <code>hellCardHeader</code> carries a <code>hell-avatar</code> and
        name/role, an overflow button sits opposite it, the body mixes prose with
        <code>hellTag</code> status labels, and <code>hellCardFooter</code> closes with a
        secondary/primary action pair. Each nested component keeps its own behavior and Part Style
        Map — the card only supplies the surface and regions.
      </p>
      <hd-example-tabs [code]="cardEntitySummaryExampleCode">
        <app-card-entity-summary-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every card directive follows the same Part Style Map shape: it owns exactly one public
        part, <code>root</code>, so its <code>ui</code> input takes either a shorthand class string
        or an explicit <code>{{ '{' }} root: string {{ '}' }}</code> map. Because each directive is
        independent, refine the directive whose region you actually want to change instead of
        cascading classes down from <code>hellCard</code>.
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
            <td><code>HellCard</code></td>
            <td><code>root</code></td>
            <td>
              The outer surface — border, background, radius, and the elevation-driven shadow.
            </td>
          </tr>
          <tr>
            <td><code>HellCardHeader</code></td>
            <td><code>root</code></td>
            <td>The top region — bottom border, padding, and title typography.</td>
          </tr>
          <tr>
            <td><code>HellCardBody</code></td>
            <td><code>root</code></td>
            <td>The main content region — padding and flex sizing.</td>
          </tr>
          <tr>
            <td><code>HellCardFooter</code></td>
            <td><code>root</code></td>
            <td>The bottom region — top border, padding, and end-aligned action layout.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Refinements merge on top of each directive's own recipe through Hell's Tailwind merge, so a
        conflicting utility such as <code>rounded-hell-xl</code> or <code>bg-hell-primary</code>
        wins deterministically over the default it replaces.
      </p>
      <hd-example-tabs [code]="cardAllPartsStylingExampleCode">
        <app-card-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>Every directive below accepts <code>ui</code>: a shorthand class string or a map keyed by its part names.</p>
      <ul>
        <li>
          <code>[hellCard]</code> — the outer surface.
          <ul>
            <li>
              <code>elevation</code>: <code>0 | 1 | 2 | 3</code>. Shadow depth, reflected as
              <code>data-elevation</code>. Default <code>1</code>.
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellCardPart&gt;</code> where
              <code>HellCardPart = 'root'</code>. Exports <code>HellCardUi</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>[hellCardHeader]</code> — the header region.
          <code>ui</code>: <code>HellUiInput&lt;HellCardHeaderPart&gt;</code> where
          <code>HellCardHeaderPart = 'root'</code>. Exports <code>HellCardHeaderUi</code>.
        </li>
        <li>
          <code>[hellCardBody]</code> — the body region.
          <code>ui</code>: <code>HellUiInput&lt;HellCardBodyPart&gt;</code> where
          <code>HellCardBodyPart = 'root'</code>. Exports <code>HellCardBodyUi</code>.
        </li>
        <li>
          <code>[hellCardFooter]</code> — the footer region.
          <code>ui</code>: <code>HellUiInput&lt;HellCardFooterPart&gt;</code> where
          <code>HellCardFooterPart = 'root'</code>. Exports <code>HellCardFooterUi</code>.
        </li>
        <li>
          <code>HELL_CARD_DIRECTIVES</code>: array of all four directives, for bulk
          <code>imports</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          All four directives are plain attribute directives on generic elements — none of them add
          a role, so the card itself carries no implicit landmark or heading semantics.
        </li>
        <li>
          Put a real heading (or at least bold text with adequate contrast) inside
          <code>hellCardHeader</code> so the region reads as a title to sighted users; add a
          semantic heading element when the card content should appear in the page outline.
        </li>
        <li>
          Cards are never click targets themselves — interactive content inside (buttons, links)
          keeps its own focus order and semantics.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use a card to group one idea, record, or workflow.</li>
        <li>
          Compose <code>hellCardHeader</code>, <code>hellCardBody</code>, and
          <code>hellCardFooter</code> for consistent spacing instead of hand-rolling padding.
        </li>
        <li>Reserve higher <code>elevation</code> for content that should visually float above the page, such as a floating summary or an active step.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't turn every list row into its own card — that just multiplies borders and padding.</li>
        <li>Don't put unrelated actions in a single card footer.</li>
        <li>Don't rely on the card as a clickable surface; give interactive content its own button or link.</li>
      </ul>
    </article>
  `,
})
export class CardPage {
  protected readonly cardBasicExampleCode = cardBasicExampleCodeRaw;
  protected readonly cardElevationExampleCode = cardElevationExampleCodeRaw;
  protected readonly cardWithoutHeaderExampleCode = cardWithoutHeaderExampleCodeRaw;
  protected readonly cardWithFooterExampleCode = cardWithFooterExampleCodeRaw;
  protected readonly cardEntitySummaryExampleCode = cardEntitySummaryExampleCodeRaw;
  protected readonly cardAllPartsStylingExampleCode = cardAllPartsStylingExampleCodeRaw;
}
