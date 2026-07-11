import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyStateNoDataExample } from './examples/no-data.example';
import emptyStateNoDataExampleCodeRaw from './examples/no-data.example.ts?raw' with {
  loader: 'text',
};
import { EmptyStateNoResultsExample } from './examples/no-results.example';
import emptyStateNoResultsExampleCodeRaw from './examples/no-results.example.ts?raw' with {
  loader: 'text',
};
import { EmptyStateErrorExample } from './examples/error.example';
import emptyStateErrorExampleCodeRaw from './examples/error.example.ts?raw' with {
  loader: 'text',
};
import { EmptyStateForbiddenExample } from './examples/forbidden.example';
import emptyStateForbiddenExampleCodeRaw from './examples/forbidden.example.ts?raw' with {
  loader: 'text',
};
import { EmptyStateCustomContentExample } from './examples/custom-content.example';
import emptyStateCustomContentExampleCodeRaw from './examples/custom-content.example.ts?raw' with {
  loader: 'text',
};
import { EmptyStateConditionalExample } from './examples/conditional.example';
import emptyStateConditionalExampleCodeRaw from './examples/conditional.example.ts?raw' with {
  loader: 'text',
};
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    EmptyStateNoDataExample,
    EmptyStateNoResultsExample,
    EmptyStateErrorExample,
    EmptyStateForbiddenExample,
    EmptyStateCustomContentExample,
    EmptyStateConditionalExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Empty state"
        icon="faSolidBoxOpen"
        category="Mixed entry point"
        importPath="@hell-ui/angular/empty-state"
        stylesPath="@hell-ui/angular/empty-state/styles.css"
      >
        A centered media, title, description, and actions presentation for any region that has
        nothing to show — with presets and calls to action so blank screens still move the user
        forward.
      </hd-page-header>
      <p>
        <code>hell-empty-state</code> is one owned-anatomy component with five Public Parts —
        <code>root</code>, <code>media</code>, <code>title</code>, <code>description</code>, and
        <code>actions</code>. Set a <code>preset</code> to get a sensible default glyph and copy for
        the four situations blank regions actually fall into, then project your own title,
        description, media, or actions to override any part. The component owns its own centering
        and fills the block you drop it into, so call sites never add margin hacks.
      </p>
      <p>
        Reach for it whenever a list, table, dashboard card, or whole route would otherwise render
        empty: a feature the user has not used yet, a filter that matched nothing, a failed load, or
        a screen they lack permission for. Pair it with a <code>hellButton</code> (narrow entry
        point <code>&#64;hell-ui/angular/button</code>) so the empty state offers the obvious next
        step.
      </p>

      <h2>Presets and their calls to action</h2>
      <p>
        Each preset answers a different question, so the copy and the call to action differ. Pick
        the preset that matches <em>why</em> the region is empty; the consumer states the situation,
        the component does not guess it.
      </p>

      <h3>No data — "Create your first…"</h3>
      <p>
        Use <code>preset="noData"</code> when a feature is empty because nothing has been created
        yet. Invite the first item rather than reporting absence.
      </p>
      <hd-example-tabs [code]="emptyStateNoDataExampleCode">
        <app-empty-state-no-data-example />
      </hd-example-tabs>

      <h3>No results — "Clear filters"</h3>
      <p>
        Use <code>preset="noResults"</code> when data exists but the current search or filters
        excluded all of it. The dedicated preset stops users concluding their data is gone; offer a
        way back to everything.
      </p>
      <hd-example-tabs [code]="emptyStateNoResultsExampleCode">
        <app-empty-state-no-results-example />
      </hd-example-tabs>

      <h3>Error — "Retry"</h3>
      <p>
        Use <code>preset="error"</code> when a load failed. Keeping recovery in place beats sending
        the user to reload the page or hunt for a toast.
      </p>
      <hd-example-tabs [code]="emptyStateErrorExampleCode">
        <app-empty-state-error-example />
      </hd-example-tabs>

      <h3>Forbidden — "Request access"</h3>
      <p>
        Use <code>preset="forbidden"</code> when the user lacks permission, so missing rights do not
        read as missing data.
      </p>
      <hd-example-tabs [code]="emptyStateForbiddenExampleCode">
        <app-empty-state-forbidden-example />
      </hd-example-tabs>

      <h2>Custom media, heading level, and multiple actions</h2>
      <p>
        Skip <code>preset</code> and project everything yourself for high-traffic screens: a branded
        glyph or illustration through <code>hellEmptyStateMedia</code>, your own copy through
        <code>hellEmptyStateTitle</code> and <code>hellEmptyStateDescription</code>, and one or more
        buttons through <code>hellEmptyStateActions</code>. A projected title owns its own
        semantics — project a real heading element (an <code>&lt;h2&gt;</code> here) when the empty
        state stands in for a whole region; <code>headingLevel</code> promotes only the built-in
        preset title, so heading roles are never doubled.
      </p>
      <hd-example-tabs [code]="emptyStateCustomContentExampleCode">
        <app-empty-state-custom-content-example />
      </hd-example-tabs>

      <h2>Conditional content</h2>
      <p>
        Empty state has <strong>no default <code>&lt;ng-content&gt;</code></strong>: every projected
        node reaches a part only by matching that part's slot selector. Content projection matches
        each <code>&#64;if</code> block's <em>single</em> root node by its selector, so a lone
        <code>&lt;button hellEmptyStateActions&gt;</code> in an <code>&#64;if</code> projects fine —
        but an <code>&lt;ng-container&gt;</code> wrapper, or more than one element in the same block,
        carries no selector and is <strong>silently dropped</strong> (there is no default slot to
        catch it). Wrap the conditional content in
        <code>&lt;ng-container ngProjectAs="[hellEmptyStateActions]"&gt;</code> so it always reaches
        the actions slot — the canonical case being a Retry action that only appears while a retry
        is worth offering.
      </p>
      <hd-example-tabs [code]="emptyStateConditionalExampleCode">
        <app-empty-state-conditional-example />
      </hd-example-tabs>

      <h2>In a TanStack Table shell</h2>
      <p>
        The <a href="/components/table">TanStack Table shell</a>'s built-in empty chrome
        (<code>HellDefaultTableEmptyState</code>, registered through
        <code>provideHellTableStatusViews()</code>) is this component with
        <code>preset="noData"</code>, so tables and non-table regions speak one empty-state language.
        Project a <code>hellTableShellEmpty</code> template to swap in the
        <code>noResults</code> preset and a "clear filters" action when you can tell a filtered table
        from a truly empty one.
      </p>

      <h2>Styling</h2>
      <p>
        <code>hell-empty-state</code> owns five Public Parts. Its <code>ui</code> input takes either
        a shorthand class string (applied to <code>root</code>) or a map keyed by the part names
        below. Refinements merge on top of each part's recipe through Hell's Tailwind merge, so a
        conflicting utility wins deterministically.
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
            <td>The centering flex column — fills its container with comfortable padding.</td>
          </tr>
          <tr>
            <td><code>media</code></td>
            <td><code>media</code></td>
            <td>The glyph or projected illustration above the title.</td>
          </tr>
          <tr>
            <td><code>title</code></td>
            <td><code>title</code></td>
            <td>The emphasized headline — preset default or projected content.</td>
          </tr>
          <tr>
            <td><code>description</code></td>
            <td><code>description</code></td>
            <td>The supporting sentence beneath the title.</td>
          </tr>
          <tr>
            <td><code>actions</code></td>
            <td><code>actions</code></td>
            <td>The row that lays out projected buttons.</td>
          </tr>
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-empty-state&gt;</code> — the owned-anatomy component.
          <ul>
            <li>
              <code>preset</code>:
              <code>'noData' | 'noResults' | 'error' | 'forbidden' | null</code>. Selects the
              default glyph and default title/description strings. Default <code>null</code>.
            </li>
            <li>
              <code>headingLevel</code>: <code>2 | 3 | 4 | 5 | 6 | null</code>. Promotes the
              built-in preset title to a heading (via <code>role="heading"</code> and
              <code>aria-level</code>). Default <code>null</code> keeps it as non-semantic emphasis.
              Ignored when a <code>hellEmptyStateTitle</code> is projected — project a real heading
              element instead.
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellEmptyStatePart&gt;</code> where
              <code>HellEmptyStatePart = 'root' | 'media' | 'title' | 'description' | 'actions'</code>.
              Exports <code>HellEmptyStateUi</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>[hellEmptyStateMedia]</code>, <code>[hellEmptyStateTitle]</code>,
          <code>[hellEmptyStateDescription]</code>, <code>[hellEmptyStateActions]</code> — projection
          markers. Content projected with a marker always wins over the preset default for that
          part.
        </li>
        <li>
          <code>provideHellEmptyStateLabels(overrides)</code> — override any subset of the preset
          title/description strings (<code>HellEmptyStateLabels</code>) for an injector scope.
          Exposed token: <code>HELL_EMPTY_STATE_LABELS</code>.
        </li>
        <li>
          <code>HELL_EMPTY_STATE_DIRECTIVES</code>: array of the component plus all four projection
          markers, for bulk <code>imports</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The empty state reads as plain content with no live region — it describes a steady state,
          not an event, so there is no announcement noise.
        </li>
        <li>
          The default glyph is decorative and hidden from assistive tech; the title and description
          carry the meaning.
        </li>
        <li>
          The preset title is a non-semantic emphasized element by default. Set
          <code>headingLevel</code> when the empty state stands in for a whole region so it joins
          the page's heading outline without skipping levels. A projected title owns its own
          semantics: use a real heading element, and the wrapper stays inert so heading roles are
          never doubled.
        </li>
        <li>
          Actions are ordinary projected buttons that keep their own focus order and keyboard
          behavior; the component does not intercept activation.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Match the preset to the reason the region is empty, then keep or refine its call to action.</li>
        <li>Use <code>noResults</code> for a filtered-to-empty view so users do not think their data vanished.</li>
        <li>Give failed loads the <code>error</code> preset with an in-place retry instead of a silent blank.</li>
        <li>Drop the component straight into a table cell, card, or route region and let it center itself.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't reuse one generic "No results" message for both never-had-data and filtered-empty.</li>
        <li>Don't reach for the empty state to represent loading — use a skeleton or the Table Shell Status.</li>
        <li>Don't wrap it in extra centering utilities; container-filling centering is built in.</li>
      </ul>
    </article>
  `,
})
export class EmptyStatePage {
  protected readonly emptyStateNoDataExampleCode = emptyStateNoDataExampleCodeRaw;
  protected readonly emptyStateNoResultsExampleCode = emptyStateNoResultsExampleCodeRaw;
  protected readonly emptyStateErrorExampleCode = emptyStateErrorExampleCodeRaw;
  protected readonly emptyStateForbiddenExampleCode = emptyStateForbiddenExampleCodeRaw;
  protected readonly emptyStateCustomContentExampleCode = emptyStateCustomContentExampleCodeRaw;
  protected readonly emptyStateConditionalExampleCode = emptyStateConditionalExampleCodeRaw;
}
