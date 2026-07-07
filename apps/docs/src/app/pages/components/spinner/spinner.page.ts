import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SpinnerAllPartsStylingExample } from './examples/all-parts-styling.example';
import spinnerAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerBasicExample } from './examples/basic.example';
import spinnerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerInsideAButtonExample } from './examples/inside-a-button.example';
import spinnerInsideAButtonExampleCodeRaw from './examples/inside-a-button.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerSizesExample } from './examples/sizes.example';
import spinnerSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerVariantsExample } from './examples/variants.example';
import spinnerVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};
import { SpinnerWithCardPendingActionExample } from './examples/with-card-pending-action.example';
import spinnerWithCardPendingActionExampleCodeRaw from './examples/with-card-pending-action.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    SpinnerBasicExample,
    SpinnerVariantsExample,
    SpinnerSizesExample,
    SpinnerInsideAButtonExample,
    SpinnerWithCardPendingActionExample,
    SpinnerAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Spinner"
        icon="faSolidSpinner"
        category="Styled primitive"
        importPath="@hell-ui/angular/skeleton"
        stylesPath="@hell-ui/angular/skeleton/styles.css"
      >
        An indeterminate activity indicator for short, unquantifiable waits — it has no notion of
        progress, only that something is happening.
      </hd-page-header>
      <p>
        <code>hellSpinner</code> is a directive you attach to any inline element — typically an
        empty <code>&lt;span&gt;</code> — with no primitive dependency and no owned DOM beyond the
        host. It renders one of four CSS-driven animations, inherits color from
        <code>currentColor</code>, and scales itself in <code>em</code> off its own
        <code>font-size</code>, so it always matches the text or button it sits next to without
        extra wiring.
      </p>
      <p>
        Reach for it whenever a wait has no known duration or layout to preserve: a submit button
        mid-request, a toolbar refresh action, a row being reprocessed. It ships in the same
        <code>@hell-ui/angular/skeleton</code> entry point as
        <a routerLink="/components/skeleton"><code>hellSkeleton</code></a>
        for historical reasons, but the two solve different problems — reach for
        <code>hellSkeleton</code> instead when you know the shape of the content that is coming and
        want to reserve its footprint.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="spinnerBasicExampleCode">
        <app-spinner-basic-example />
      </hd-example-tabs>

      <h2>Variants</h2>
      <p>
        Four built-in variants — <code>ring</code> (default), <code>dots</code>,
        <code>bars</code>, <code>pulse</code>. All inherit <code>currentColor</code>, so they adapt
        to surrounding text and themed buttons automatically.
      </p>
      <hd-example-tabs
        [code]="spinnerVariantsExampleCode"
        previewClass="flex flex-wrap items-center gap-8"
      >
        <app-spinner-variants-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        Five preset sizes (<code>xs sm md lg xl</code>), or set any <code>font-size</code> directly
        — spinners are sized entirely in <code>em</code>, presets included.
      </p>
      <hd-example-tabs
        [code]="spinnerSizesExampleCode"
        previewClass="flex flex-wrap items-end gap-6"
      >
        <app-spinner-sizes-example />
      </hd-example-tabs>

      <h2>Inside a button</h2>
      <p>
        The most common placement: swap a button's label area for a spinner while an action is
        in flight, and disable the button so it can't be triggered twice. <code>currentColor</code>
        keeps the spinner's color matched to the button's <code>variant</code> without any extra
        class.
      </p>
      <hd-example-tabs
        [code]="spinnerInsideAButtonExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-spinner-inside-a-button-example />
      </hd-example-tabs>

      <h2>With card</h2>
      <p>
        A realistic pending action: <code>hellCard</code> (narrow entry point
        <code>@hell-ui/angular/card</code>) frames a confirmation, and its primary
        <code>hellButton</code> swaps in a <code>hellSpinner</code> and a busy label for the
        duration of the request. Both buttons disable while pending so the click can't fire twice.
      </p>
      <hd-example-tabs [code]="spinnerWithCardPendingActionExampleCode">
        <app-spinner-with-card-pending-action-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSpinner</code> owns exactly one Public Part, <code>root</code> — the host
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>HellSpinnerUi</code> map. Refinements merge on top of the variant/size recipe through
        Hell's Tailwind merge, so a conflicting utility such as a custom <code>text-[36px]</code>
        font-size wins deterministically over the size preset it replaces.
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
            <td><code>HellSpinner</code></td>
            <td><code>root</code></td>
            <td>The indicator itself — color (via <code>currentColor</code>) and font-size-driven scale.</td>
          </tr>
          <tr>
            <td><code>HellSkeleton</code></td>
            <td><code>root</code></td>
            <td>
              The placeholder itself — shimmer background, radius. Documented on the
              <a routerLink="/components/skeleton">Skeleton</a> page; shown below only because it
              shares this entry point.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Keep <code>class</code> for layout hooks — margins, flex placement — since the recipe never
        sets them. Use <code>ui</code> whenever a refinement needs to beat a recipe utility such as
        the size-driven <code>font-size</code>.
      </p>
      <hd-example-tabs
        [code]="spinnerAllPartsStylingExampleCode"
        previewClass="flex flex-col"
      >
        <app-spinner-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>hellSpinner</code></p>
      <ul>
        <li>
          <code>variant</code>: <code>HellSpinnerVariant</code> —
          <code>'ring' | 'dots' | 'bars' | 'pulse'</code>. Default <code>'ring'</code>.
        </li>
        <li><code>size</code>: <code>HellSize</code> — <code>xs | sm | md | lg | xl</code>. Default <code>'md'</code>.</li>
        <li>
          <code>aria-label</code> (<code>ariaLabel</code>): <code>string | null</code>. Overrides
          the accessible label for this instance. Default <code>null</code>, falling back to the
          injected <code>HELL_SKELETON_LABELS</code> loading label.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellSpinnerPart&gt;</code> — a shorthand class
          string or a <code>HellSpinnerUi</code> map (<code>&#123; root: string &#125;</code>) that
          refines the <code>root</code> public part.
        </li>
        <li>
          Exported types: <code>HellSpinnerPart</code> (<code>'root'</code>),
          <code>HellSpinnerUi</code> (<code>HellUi&lt;HellSpinnerPart&gt;</code>),
          <code>HellSpinnerVariant</code>.
        </li>
        <li>
          Also exported from this entry point: <code>HELL_SKELETON_LABELS</code> injection token
          and <code>provideHellSkeletonLabels()</code>, which override the shared
          <code>loading</code> label for both <code>hellSpinner</code> and
          <a routerLink="/components/skeleton"><code>hellSkeleton</code></a> in an injector's scope.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Renders with <code>role="status"</code>, so assistive tech treats the spinner as a live
          region and announces it without extra wiring.
        </li>
        <li>
          Carries an <code>aria-label</code> resolved from the <code>HELL_SKELETON_LABELS</code>
          Label Contract ("Loading" by default) unless you pass an explicit
          <code>aria-label</code> — do this whenever the surrounding context is more specific than
          "loading", for example "Saving changes".
        </li>
        <li>
          Purely visual otherwise: it has no keyboard interaction and does not manage focus. Pair
          it with a <code>disabled</code> trigger control so the in-flight action can't be started
          twice.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Disable the triggering control while its spinner is visible, so the action can't fire twice.</li>
        <li>
          Override <code>aria-label</code> with the specific operation ("Saving", "Sending") when
          the default "Loading" isn't precise enough.
        </li>
        <li>
          Let the spinner inherit <code>currentColor</code> instead of hardcoding a color — it then
          matches any button <code>variant</code> automatically.
        </li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>
          Don't show a spinner for work that resolves in under ~200 ms; the flicker reads as worse
          feedback than none at all.
        </li>
        <li>
          Don't use a spinner to mask a layout shift — reserve the space with
          <a routerLink="/components/skeleton">Skeleton</a> instead.
        </li>
        <li>Don't leave a long-running operation on an indeterminate spinner if you can report real progress — use Progress instead.</li>
      </ul>
    </article>
  `,
})
export class SpinnerPage {
  protected readonly spinnerBasicExampleCode = spinnerBasicExampleCodeRaw;
  protected readonly spinnerVariantsExampleCode = spinnerVariantsExampleCodeRaw;
  protected readonly spinnerSizesExampleCode = spinnerSizesExampleCodeRaw;
  protected readonly spinnerInsideAButtonExampleCode = spinnerInsideAButtonExampleCodeRaw;
  protected readonly spinnerWithCardPendingActionExampleCode =
    spinnerWithCardPendingActionExampleCodeRaw;
  protected readonly spinnerAllPartsStylingExampleCode = spinnerAllPartsStylingExampleCodeRaw;
}
