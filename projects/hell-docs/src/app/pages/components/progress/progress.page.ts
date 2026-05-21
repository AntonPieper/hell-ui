import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ProgressExamplesExample } from './examples/examples.example';
import progressExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { ProgressInteractiveExample } from './examples/interactive.example';
import progressInteractiveExampleCodeRaw from './examples/interactive.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ProgressExamplesExample, ProgressInteractiveExample],
  template: `
    <article class="hd-prose">
      <h1>Progress</h1>
      <p>
        Indicates the percentage of completion for a known-duration task. Set <code>value</code> as
        a number between <code>0</code> and <code>max</code> (default 100).
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="progressExamplesExampleCode" previewClass="grid max-w-95 gap-2">
        <app-progress-examples-example />
      </hd-example-tabs>

      <h2>Interactive</h2>
      <hd-example-tabs [code]="progressInteractiveExampleCode" previewClass="grid max-w-95 gap-2">
        <app-progress-interactive-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellProgress</code>: <code>value</code>, <code>max</code> (default 100). Provide an
          accessible name with visible text and <code>aria-labelledby</code>, or with a concise
          <code>aria-label</code> when no visible label is present.
        </li>
        <li><code>hellProgressBar</code>: the visual fill — apply on a child element</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use progress when completion percentage is known.</li>
        <li>Pair bars with text for precise long-running jobs.</li>
        <li>Use native values consistently from 0 to max.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't show fake progress for unknown duration; use Spinner or Skeleton.</li>
        <li>Don't rely on color alone for status.</li>
      </ul>
    </article>
  `,
})
export class ProgressPage {
  protected readonly progressExamplesExampleCode = progressExamplesExampleCodeRaw;
  protected readonly progressInteractiveExampleCode = progressInteractiveExampleCodeRaw;
}
