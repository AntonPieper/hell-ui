import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ProgressAllPartsStylingExample } from './examples/all-parts-styling.example';
import progressAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { ProgressBasicExample } from './examples/basic.example';
import progressBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ProgressIndeterminateExample } from './examples/indeterminate.example';
import progressIndeterminateExampleCodeRaw from './examples/indeterminate.example.ts?raw' with {
  loader: 'text',
};
import { ProgressLabeledValueExample } from './examples/labeled-value.example';
import progressLabeledValueExampleCodeRaw from './examples/labeled-value.example.ts?raw' with {
  loader: 'text',
};
import { ProgressThicknessExample } from './examples/thickness.example';
import progressThicknessExampleCodeRaw from './examples/thickness.example.ts?raw' with {
  loader: 'text',
};
import { ProgressWithJobStatusCardExample } from './examples/with-job-status-card.example';
import progressWithJobStatusCardExampleCodeRaw from './examples/with-job-status-card.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    ProgressBasicExample,
    ProgressLabeledValueExample,
    ProgressIndeterminateExample,
    ProgressThicknessExample,
    ProgressWithJobStatusCardExample,
    ProgressAllPartsStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Progress"
        icon="faSolidBarsProgress"
        category="Styled primitive"
        importPath="hell-ui/progress"
        stylesPath="hell-ui/progress/styles.css"
      >
        A determinate track-and-fill bar for tasks whose completion percentage you already know.
      </hd-page-header>
      <p>
        Progress is a pair of host directives — <code>hellProgress</code> for the track and
        <code>hellProgressBar</code> for the fill — built on <code>NgpProgress</code> and
        <code>NgpProgressIndicator</code> from <code>ng-primitives</code>. <code>hellProgress</code>
        owns the accessible <code>role="progressbar"</code> semantics and reflects
        <code>value</code>/<code>max</code> to ARIA attributes; <code>hellProgressBar</code> is a
        plain child element whose width tracks the current percentage.
      </p>
      <p>
        Reach for it whenever a dense business app knows how far along a task is: file uploads,
        multi-step imports, storage quotas, onboarding checklists. When the duration or fraction
        complete is unknown, use an indeterminate <code>hellProgress</code> (below) or a spinner
        instead of guessing a number.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="progressBasicExampleCode">
        <app-progress-basic-example />
      </hd-example-tabs>

      <h2>Labeled value</h2>
      <p>
        For long-running or user-triggered operations, pair the bar with visible percentage text
        and point <code>aria-labelledby</code> at your own label element instead of duplicating it
        in <code>aria-label</code>.
      </p>
      <hd-example-tabs [code]="progressLabeledValueExampleCode">
        <app-progress-labeled-value-example />
      </hd-example-tabs>

      <h2>Indeterminate</h2>
      <p>
        Pass <code>[value]="null"</code> (or omit a value entirely and set it to <code>null</code>
        once loading starts) to drop <code>aria-valuenow</code> and set the
        <code>data-indeterminate</code> attribute on the track. The fill has no defined width in
        this state, so style your own looping indicator on <code>hellProgressBar</code>, such as a
        partial-width bar with a pulse animation.
      </p>
      <hd-example-tabs [code]="progressIndeterminateExampleCode">
        <app-progress-indeterminate-example />
      </hd-example-tabs>

      <h2>Thickness</h2>
      <p>
        There is no <code>size</code> input — the track has no visual size variants of its own, so
        adjust its height directly through <code>ui</code>. Because <code>hellProgressBar</code>
        uses <code>h-full</code> and <code>rounded-[inherit]</code>, the fill and corners follow the
        track automatically.
      </p>
      <hd-example-tabs [code]="progressThicknessExampleCode">
        <app-progress-thickness-example />
      </hd-example-tabs>

      <h2>With job status card</h2>
      <p>
        A realistic composite: a <code>hellCard</code> names the job and its current
        <code>hellChip</code> status, then a labeled <code>hellProgress</code>/<code>hellProgressBar</code>
        pair reports how far the export has gotten. Each nested component keeps its own behavior and
        Part Style Map — the card only supplies the surface and header/body regions.
      </p>
      <hd-example-tabs [code]="progressWithJobStatusCardExampleCode">
        <app-progress-with-job-status-card-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>hellProgress</code> and <code>hellProgressBar</code> are independent directives that
        each own exactly one Public Part, <code>root</code> — the track and the fill respectively.
        Pass <code>ui="..."</code> as shorthand to refine that part's default recipe classes, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit map. Refine whichever
        directive owns the region you want to change; there is no cascading from the track down to
        the fill.
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
            <td><code>HellProgress</code></td>
            <td><code>root</code></td>
            <td>The track — height, width, background, radius, and clipping.</td>
          </tr>
          <tr>
            <td><code>HellProgressBar</code></td>
            <td><code>root</code></td>
            <td>The fill — background, radius, and the width transition.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Refinements merge on top of each directive's own recipe through Hell's Tailwind merge, so a
        conflicting utility such as <code>bg-hell-success</code> or <code>h-hell-3</code> wins
        deterministically over the default it replaces.
      </p>
      <hd-example-tabs [code]="progressAllPartsStylingExampleCode">
        <app-progress-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>[hellProgress]</code> — the track. Hosts <code>NgpProgress</code>.
          <ul>
            <li>
              <code>value</code>: <code>number | null</code>. The current progress value. Pass
              <code>null</code> for an indeterminate state. Default <code>0</code>.
            </li>
            <li><code>max</code>: <code>number</code>. The value that represents completion. Default <code>100</code>.</li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>[hellProgressBar]</code> — the fill. Hosts <code>NgpProgressIndicator</code>, which
          reads the track's state through DI and sets its own inline <code>width</code> style; apply
          it to a child element of <code>hellProgress</code>.
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>hellProgress</code> sets <code>role="progressbar"</code>,
          <code>aria-valuemin="0"</code>, <code>aria-valuemax</code> (from <code>max</code>), and
          <code>aria-valuenow</code> (from <code>value</code>) on its host element.
        </li>
        <li>
          When <code>value</code> is <code>null</code>, <code>aria-valuenow</code> is omitted
          entirely and the <code>data-indeterminate</code> attribute is set on the track instead,
          which is how assistive tech is told the percentage is unknown.
        </li>
        <li>
          <code>aria-valuetext</code> is set to a rounded percentage string (for example
          <code>"66%"</code>) whenever <code>value</code> is a number, so screen readers announce a
          human percentage even if you also render your own visible text. It is empty while
          indeterminate.
        </li>
        <li>
          The track carries no accessible name by itself — set <code>aria-label</code> for a short
          standalone name, or <code>aria-labelledby</code> to point at a visible label you already
          render, as in the labeled value example above.
        </li>
        <li>
          <code>hellProgressBar</code> is purely visual; it renders no ARIA attributes of its own,
          so screen readers read state from the <code>hellProgress</code> track, not the fill.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use progress when the completion percentage is genuinely known.</li>
        <li>Pair the bar with visible percentage text for long-running or user-triggered jobs.</li>
        <li>Set <code>[value]="null"</code> while duration is unknown, then switch to a real value once you have one.</li>
        <li>Give every <code>hellProgress</code> an <code>aria-label</code> or <code>aria-labelledby</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't fake a slowly-ticking percentage for unknown-duration work; use the indeterminate state or a spinner instead.</li>
        <li>Don't rely on fill color alone to convey status — pair it with a <code>hellChip</code> or text label.</li>
        <li>Don't style descendants of <code>hellProgress</code> directly; refine <code>hellProgressBar</code>'s own <code>ui</code> instead.</li>
      </ul>
    </article>
  `,
})
export class ProgressPage {
  protected readonly progressBasicExampleCode = progressBasicExampleCodeRaw;
  protected readonly progressLabeledValueExampleCode = progressLabeledValueExampleCodeRaw;
  protected readonly progressIndeterminateExampleCode = progressIndeterminateExampleCodeRaw;
  protected readonly progressThicknessExampleCode = progressThicknessExampleCodeRaw;
  protected readonly progressWithJobStatusCardExampleCode = progressWithJobStatusCardExampleCodeRaw;
  protected readonly progressAllPartsStylingExampleCode = progressAllPartsStylingExampleCodeRaw;
}
