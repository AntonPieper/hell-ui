import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { OmnibarBasicExample } from './examples/basic.example';
import omnibarBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { OmnibarSizesExample } from './examples/sizes.example';
import omnibarSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { OmnibarHotkeyExample } from './examples/hotkey.example';
import omnibarHotkeyExampleCodeRaw from './examples/hotkey.example.ts?raw' with {
  loader: 'text',
};
import { OmnibarAsyncSearchExample } from './examples/async-search.example';
import omnibarAsyncSearchExampleCodeRaw from './examples/async-search.example.ts?raw' with {
  loader: 'text',
};
import { OmnibarCommandPaletteExample } from './examples/command-palette.example';
import omnibarCommandPaletteExampleCodeRaw from './examples/command-palette.example.ts?raw' with {
  loader: 'text',
};
import { OmnibarStylingExample } from './examples/styling.example';
import omnibarStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-omnibar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    OmnibarBasicExample,
    OmnibarSizesExample,
    OmnibarHotkeyExample,
    OmnibarAsyncSearchExample,
    OmnibarCommandPaletteExample,
    OmnibarStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Omnibar"
        icon="faSolidTerminal"
        category="Composite"
        importPath="@hell-ui/angular/omnibar"
        stylesPath="@hell-ui/angular/omnibar/styles.css"
      >
        A command-palette searchbox that owns query state, keyboard navigation, and a floating
        results panel while you own every result row.
      </hd-page-header>
      <p>
        <code>hell-omnibar</code> is a Composite that combines the Hell search primitive, the shared
        <code>HellSearchService</code> ranker, and a listbox/active-descendant keyboard model behind
        one <code>&lt;hell-omnibar&gt;</code> element. It renders the input row itself and portals the
        results panel through Angular CDK's connected overlay so the dropdown escapes clipped
        ancestors, but the result rows, groups, and empty/loading bodies are all projected content
        you control. Its behavior is driven by the Omnibar Runtime: debounced search, abortable async
        sources, active-item tracking, delegated outside-click/focus dismissal, and an optional global
        hotkey.
      </p>
      <p>
        Reach for it whenever a dense business app needs a search-and-jump surface: a top-bar command
        palette, an entity finder, a quick-action launcher, or a scoped filter box. Feed it local
        objects through <code>searchItems</code> for small in-memory sets, or wire
        <code>searchSource</code> to a backend for large or remote data. Because rendering is
        projected, the same component fits people pickers, command menus, and record search without a
        per-domain wrapper.
      </p>

      <h2>Basic</h2>
      <p>
        Bind local objects to <code>searchItems</code>, describe how to rank them with
        <code>searchFields</code>, and project a group of <code>hellOmnibarItem</code> buttons from
        the ranked <code>searchResultsChange</code> output. Each item carries a <code>value</code>
        your <code>(submit)</code> handler receives on Enter or click.
      </p>
      <hd-example-tabs [code]="basicCode" previewClass="min-h-[220px]">
        <app-omnibar-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> accepts <code>sm</code>, <code>md</code> (default), or <code>lg</code> and
        drives the control height, font size, and inline padding through the
        <code>data-size</code> attribute. Match it to the density of the surrounding chrome.
      </p>
      <hd-example-tabs [code]="sizesCode" previewClass="min-h-[160px]">
        <app-omnibar-sizes-example />
      </hd-example-tabs>

      <h2>Global hotkey</h2>
      <p>
        Set <code>hotkey</code> to a combo such as <code>mod+k</code> (Cmd on macOS, Ctrl elsewhere)
        or <code>/</code> to register a document-level listener that focuses and opens the panel. It
        is opt-in convenience, not an app shortcut manager: it ignores already-prevented keydowns,
        matches modifiers exactly, and skips bare keys typed in other editable fields. Leave it
        <code>null</code> (the default) and open from app state when a shortcut router owns
        collisions. Pair it with a <code>kbd</code> hint in the trailing slot so the shortcut is
        discoverable.
      </p>
      <hd-example-tabs [code]="hotkeyCode" previewClass="min-h-[120px]">
        <app-omnibar-hotkey-example />
      </hd-example-tabs>

      <h2>Async search</h2>
      <p>
        Wire <code>searchSource</code> to any function returning a promise, observable, or array;
        newer queries abort superseded requests through the <code>signal</code> on the request.
        <code>searchDebounce</code> gates how long typing settles before a search starts,
        <code>searchLimit</code> caps rendered rows, and <code>loadingTemplate</code> replaces the
        default skeleton while keeping the announced status wrapper. Failures surface through
        <code>(searchError)</code> so the panel stays usable — here an error row renders in the
        projected footer. An actions strip above the results holds toolbar-style filters, and a
        disabled item is skipped by keyboard navigation. Type <code>error</code> to see the failure
        path.
      </p>
      <hd-example-tabs [code]="asyncCode" previewClass="min-h-[240px]">
        <app-omnibar-async-search-example />
      </hd-example-tabs>

      <h2>With kbd</h2>
      <p>
        A realistic command palette mounted in a product top bar: an icon-led searchbox with a
        <code>hellKbd</code> shortcut hint in the trailing slot, grouped commands, and per-command
        shortcut chips in each item's trailing slot. <code>hellKbd</code> comes from the narrow
        <code>&#64;hell-ui/angular/tag</code> entry point, and the <code>faSolid*</code> icons render
        through <code>hell-icon</code>.
      </p>
      <hd-example-tabs [code]="commandPaletteCode" previewClass="min-h-[160px]">
        <app-omnibar-command-palette-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The omnibar family follows Hell's Part Style Map contract. Every module accepts a
        <code>ui</code> input: pass a shorthand string to refine that module's default part
        (<code>ui="text-hell-primary"</code>), or a map keyed by part name to refine several parts of
        the same module (<code>[ui]="&#123; input: '…', panel: '…' &#125;"</code>). Refinements merge
        on top of each part's recipe through Hell's Tailwind merge, so they win deterministically over
        the defaults they conflict with. A <code>ui</code> map only styles the DOM its own module
        owns — projected children such as items, groups, chips, and actions each expose their own
        single-part <code>ui</code>.
      </p>
      <p>
        <code>HellOmnibar</code> owns the multi-part anatomy; its part names use canonical camelCase
        (<code>inputWrap</code>) that matches the rendered <code>data-slot</code> values. Every other
        exported module is single-part and refined through its own <code>ui</code>:
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module (selector)</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="12"><code>HellOmnibar</code> (<code>hell-omnibar</code>)</td>
            <td><code>root</code></td>
            <td>Host element wrapping the control and overlay origin.</td>
          </tr>
          <tr>
            <td><code>control</code></td>
            <td>The input row: leading slot, input wrap, clear button, trailing slot.</td>
          </tr>
          <tr>
            <td><code>inputWrap</code></td>
            <td>Overflow-clipping wrapper around the native input.</td>
          </tr>
          <tr>
            <td><code>input</code></td>
            <td>The native <code>&lt;input type="search"&gt;</code> element.</td>
          </tr>
          <tr>
            <td><code>clear</code></td>
            <td>The built-in clear-query button (hidden when the query is empty).</td>
          </tr>
          <tr>
            <td><code>panel</code></td>
            <td>The portaled dropdown surface containing actions, results, and status.</td>
          </tr>
          <tr>
            <td><code>actions</code></td>
            <td>Wrapper around the projected actions strip, above the results.</td>
          </tr>
          <tr>
            <td><code>results</code></td>
            <td>The scrollable listbox region holding projected groups and items.</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td>The status region shown while a search runs.</td>
          </tr>
          <tr>
            <td><code>skeletonRow</code></td>
            <td>One placeholder row in the default loading skeleton.</td>
          </tr>
          <tr>
            <td><code>skeletonText</code></td>
            <td>The stacked text placeholders inside a skeleton row.</td>
          </tr>
          <tr>
            <td><code>empty</code></td>
            <td>The default no-results message.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarPanel</code> (<code>[hellOmnibarPanel]</code>)</td>
            <td><code>root</code></td>
            <td>Optional wrapper you place around the projected panel body.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarGroup</code> (<code>[hellOmnibarGroup]</code>)</td>
            <td><code>root</code></td>
            <td>A labeled group of related result items.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarGroupLabel</code> (<code>[hellOmnibarGroupLabel]</code>)</td>
            <td><code>root</code></td>
            <td>The visual heading for a group.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarItem</code> (<code>button[hellOmnibarItem]</code>)</td>
            <td><code>root</code></td>
            <td>A selectable result row (the <code>option</code> button).</td>
          </tr>
          <tr>
            <td><code>HellOmnibarItemIcon</code> (<code>[hellOmnibarItemIcon]</code>)</td>
            <td><code>root</code></td>
            <td>Leading icon slot inside a result row.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarItemText</code> (<code>[hellOmnibarItemText]</code>)</td>
            <td><code>root</code></td>
            <td>Primary text column inside a result row.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarItemSubtext</code> (<code>[hellOmnibarItemSubtext]</code>)</td>
            <td><code>root</code></td>
            <td>Secondary text under the primary label.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarItemTrailing</code> (<code>[hellOmnibarItemTrailing]</code>)</td>
            <td><code>root</code></td>
            <td>Trailing slot inside a result row, e.g. a shortcut chip.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarChip</code> (<code>[hellOmnibarChip]</code>)</td>
            <td><code>root</code></td>
            <td>Scope/filter chip placed in a leading or trailing slot.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarChipRemove</code> (<code>button[hellOmnibarChipRemove]</code>)</td>
            <td><code>root</code></td>
            <td>The remove button inside a chip.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarActionsStrip</code> (<code>[hellOmnibarActions]</code>)</td>
            <td><code>root</code></td>
            <td>The toolbar of action buttons rendered above results.</td>
          </tr>
          <tr>
            <td><code>HellOmnibarAction</code> (<code>button[hellOmnibarAction]</code>)</td>
            <td><code>root</code></td>
            <td>One action button in the strip (supports a pressed state).</td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines every public part across the modules it renders, using Hell design
        tokens. Type to see the refined loading skeleton before results settle.
      </p>
      <hd-example-tabs [code]="stylingCode" previewClass="min-h-[220px]">
        <app-omnibar-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><strong><code>HellOmnibar</code></strong> — inputs:</p>
      <ul>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Control size preset. Default <code>'md'</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Blocks opening and editing. Default <code>false</code>.</li>
        <li><code>placeholder</code>: <code>string</code>. Input placeholder. Default <code>'Search…'</code>.</li>
        <li><code>ariaLabel</code>: <code>string</code>. Accessible name for the input. Default <code>'Search'</code>.</li>
        <li><code>emptyMessage</code>: <code>string</code>. No-results text. Default <code>'No results'</code>.</li>
        <li><code>emptyTemplate</code>: <code>TemplateRef&lt;unknown&gt; | null</code>. Replaces the default empty body. Default <code>null</code>.</li>
        <li>
          <code>loadingTemplate</code>: <code>TemplateRef&lt;HellOmnibarLoadingTemplateContext&gt; | null</code>.
          Replaces the default skeleton; context carries <code>rows</code> and <code>message</code>. Default <code>null</code>.
        </li>
        <li><code>searchItems</code>: <code>readonly unknown[] | null</code>. Local items ranked by <code>HellSearchService</code>. Default <code>null</code>.</li>
        <li><code>searchSource</code>: <code>HellSearchSource&lt;unknown&gt; | null</code>. Async/remote source; superseded requests receive an abort signal. Default <code>null</code>.</li>
        <li><code>searchFields</code>: <code>readonly HellSearchField&lt;never&gt;[]</code>. Weighted local ranking fields. Default <code>[]</code>.</li>
        <li><code>searchLimit</code>: <code>number | undefined</code>. Caps emitted results. Default <code>undefined</code>.</li>
        <li><code>searchParams</code>: <code>unknown</code>. Opaque context forwarded to the source. Default <code>undefined</code>.</li>
        <li><code>searchDebounce</code>: <code>number</code>. Milliseconds before a search runs; <code>0</code> is immediate. Default <code>120</code>.</li>
        <li><code>loadingMessage</code>: <code>string</code>. Status announced while searching. Default <code>'Searching'</code>.</li>
        <li><code>loadingRows</code>: <code>number</code>. Skeleton row count. Default <code>4</code>.</li>
        <li><code>hotkey</code>: <code>string | null</code>. Optional global open shortcut, e.g. <code>'mod+k'</code>. Default <code>null</code>.</li>
        <li><code>openOnFocus</code>: <code>boolean</code>. Opens on type/focus; set <code>false</code> for controlled mode. Default <code>true</code>.</li>
        <li><code>value</code>: <code>model&lt;string&gt;</code>. Two-way bound query string. Default <code>''</code>.</li>
        <li><code>minPanelWidth</code>: <code>number</code>. Minimum overlay panel width; still matches a wider control. Default <code>320</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellOmnibarPart&gt;</code>. Part Style Map for the omnibar anatomy.</li>
      </ul>
      <p><strong><code>HellOmnibar</code></strong> — outputs:</p>
      <ul>
        <li><code>submit</code>: <code>HellOmnibarSubmitEvent</code> — <code>&#123; value, item, source &#125;</code>, emitted when an item is activated by mouse, keyboard, or API.</li>
        <li><code>openChange</code>: <code>boolean</code> — the new open state on every open/close.</li>
        <li><code>searchResultsChange</code>: <code>readonly HellSearchResult&lt;unknown&gt;[]</code> — ranked results for the current query.</li>
        <li><code>searchError</code>: <code>unknown</code> — async source failures; the panel stays usable.</li>
      </ul>
      <p><strong><code>HellOmnibarItem</code></strong> — inputs / outputs:</p>
      <ul>
        <li><code>value</code>: <code>T</code>. Payload emitted via <code>(select)</code> and the parent <code>(submit)</code>.</li>
        <li><code>closeOnSelect</code>: <code>boolean</code>. Whether activation closes the panel. Default <code>true</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Skips the row in navigation/activation. Default <code>false</code>.</li>
        <li><code>select</code>: <code>output&lt;T&gt;</code>. Emits the item value on activation.</li>
      </ul>
      <p>Other child inputs: <code>HellOmnibarGroup</code> has <code>label: string</code> (default <code>''</code>); <code>HellOmnibarAction</code> has <code>pressed: boolean</code> (default <code>false</code>). Every module also accepts a <code>ui</code> input.</p>
      <p><strong>Projected slots</strong> (attribute selectors on projected content):</p>
      <ul>
        <li><code>[hellOmnibarLeading]</code> — content before the input (icon, badge, chip).</li>
        <li><code>[hellOmnibarTrailing]</code> — content after the input (kbd hint, status).</li>
        <li><code>[hellOmnibarActions]</code> — the actions strip rendered above results.</li>
        <li><code>[hellOmnibarFooter]</code> — content pinned below the results (e.g. an error row).</li>
        <li>default slot — projected groups and items (the panel body).</li>
      </ul>
      <p><strong>Exported types</strong>:</p>
      <ul>
        <li>
          Part unions: <code>HellOmnibarPart</code> (the 12-part anatomy above) plus single-part
          <code>HellOmnibarPanelPart</code>, <code>HellOmnibarGroupPart</code>,
          <code>HellOmnibarGroupLabelPart</code>, <code>HellOmnibarItemPart</code>,
          <code>HellOmnibarItemIconPart</code>, <code>HellOmnibarItemTextPart</code>,
          <code>HellOmnibarItemSubtextPart</code>, <code>HellOmnibarItemTrailingPart</code>,
          <code>HellOmnibarChipPart</code>, <code>HellOmnibarChipRemovePart</code>,
          <code>HellOmnibarActionsStripPart</code>, and <code>HellOmnibarActionPart</code> (all <code>'root'</code>).
        </li>
        <li>
          Matching <code>ui</code> map types: <code>HellOmnibarUi</code>,
          <code>HellOmnibarPanelUi</code>, <code>HellOmnibarGroupUi</code>,
          <code>HellOmnibarGroupLabelUi</code>, <code>HellOmnibarItemUi</code>,
          <code>HellOmnibarItemIconUi</code>, <code>HellOmnibarItemTextUi</code>,
          <code>HellOmnibarItemSubtextUi</code>, <code>HellOmnibarItemTrailingUi</code>,
          <code>HellOmnibarChipUi</code>, <code>HellOmnibarChipRemoveUi</code>,
          <code>HellOmnibarActionsStripUi</code>, and <code>HellOmnibarActionUi</code>
          (each <code>HellUi&lt;…Part&gt;</code>).
        </li>
        <li>
          Event/context types: <code>HellOmnibarSubmitEvent</code>,
          <code>HellOmnibarActivationSource</code> (<code>'mouse' | 'keyboard' | 'api'</code>),
          <code>HellOmnibarLoadingTemplateContext</code>.
        </li>
        <li>
          Labels: <code>HellOmnibarLabels</code> (<code>&#123; clearSearch &#125;</code>),
          <code>provideHellOmnibarLabels(overrides)</code>, and <code>HELL_OMNIBAR_LABELS</code> to
          localize the clear-button label.
        </li>
        <li><code>HELL_OMNIBAR_DIRECTIVES</code> — the full standalone import array for the composition.</li>
      </ul>
      <p>
        Panel geometry/surface theming is exposed through CSS variables on the host:
        <code>--hell-omnibar-panel-bg</code>, <code>--hell-omnibar-panel-radius</code>,
        <code>--hell-omnibar-panel-shadow</code>, and <code>--hell-omnibar-panel-max-height</code>,
        plus control-level <code>--hell-omnibar-bg</code>, <code>--hell-omnibar-border</code>,
        <code>--hell-omnibar-radius</code>, <code>--hell-omnibar-height</code>, and
        <code>--hell-omnibar-padding-x</code>. Replace the ranker with an external engine (Fuse.js,
        MiniSearch, FlexSearch) through <code>provideHellSearchRanker</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The input follows the combobox pattern: <code>role="combobox"</code>,
          <code>aria-autocomplete="list"</code>, <code>aria-expanded</code>,
          <code>aria-controls</code> pointing at the results region, and
          <code>aria-activedescendant</code> tracking the highlighted option.
        </li>
        <li>
          The results region is <code>role="listbox"</code> only while it holds items; each row is
          <code>role="option"</code> with <code>aria-selected</code> reflecting the active item and
          <code>aria-disabled</code>/<code>data-disabled</code> for disabled rows.
        </li>
        <li>
          Keyboard: <code>ArrowDown</code>/<code>ArrowUp</code> move the active option (ArrowDown also
          opens a closed panel), <code>Home</code>/<code>End</code> jump to the first/last option,
          <code>Enter</code> activates the active option, and <code>Escape</code> closes the panel,
          then clears the query, then blurs the input.
        </li>
        <li>
          <code>Tab</code> stays anchored on the input while open (the control's clear button and
          actions leave the tab order); <code>F6</code> moves into the actions strip and back, and
          <code>ArrowLeft</code>/<code>ArrowRight</code> move between action buttons.
        </li>
        <li>
          Groups render <code>role="group"</code> with an <code>aria-label</code>; the actions strip
          is <code>role="toolbar"</code>; and the loading region is <code>role="status"</code> labeled
          with <code>loadingMessage</code>, so busy/empty states are announced as content, not just
          spinners.
        </li>
        <li>The clear button is labeled through the <code>clearSearch</code> label (localizable via <code>provideHellOmnibarLabels</code>).</li>
        <li>The global <code>hotkey</code> respects other editable surfaces and already-prevented keydowns before firing.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use <code>searchSource</code> with an abort <code>signal</code> for remote data so superseded queries cancel.</li>
        <li>Project item templates so results match the domain — icon, primary/secondary text, trailing hint.</li>
        <li>Keep <code>hotkey</code> <code>null</code> when an app shortcut router owns collisions; open from app state instead.</li>
        <li>Refine visuals through each module's <code>ui</code> Part Style Map so refinements win over recipe classes.</li>
        <li>Commit filters as structured state (chips, actions), not free text encoded in the query.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mount several always-on omnibars sharing the same global <code>hotkey</code>.</li>
        <li>Don't couple result rows to a specific API shape — map backend payloads to your item model first.</li>
        <li>Don't target private descendants; style through the named parts and each child's <code>ui</code>.</li>
        <li>Don't debounce opening and closing the panel — debounce the search work with <code>searchDebounce</code>.</li>
      </ul>
    </article>
  `,
})
export class OmnibarPage {
  protected readonly basicCode = omnibarBasicExampleCodeRaw;
  protected readonly sizesCode = omnibarSizesExampleCodeRaw;
  protected readonly hotkeyCode = omnibarHotkeyExampleCodeRaw;
  protected readonly asyncCode = omnibarAsyncSearchExampleCodeRaw;
  protected readonly commandPaletteCode = omnibarCommandPaletteExampleCodeRaw;
  protected readonly stylingCode = omnibarStylingExampleCodeRaw;
}
