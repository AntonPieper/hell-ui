import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeader } from '../../shared/page-header';
import { RouterLink } from '@angular/router';
import { CodeBlock } from '../../shared/code-block';

const ENTRYPOINT_IMPORTS_CODE = `// TypeScript: one narrow entry point per surface you use.
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';

// CSS: shared tokens once, then one stylesheet per entry point you render.
// styles.css
// @import 'tailwindcss';
// @import '@hell-ui/angular/tokens.css';
// @import '@hell-ui/angular/button/styles.css';
// @import '@hell-ui/angular/select/styles.css';
`;

const PART_STYLE_MAP_CODE = `<!-- String shorthand refines the component's default Public Part. -->
<button hellButton ui="rounded-full px-6">Invite</button>

<!-- The object form maps Public Part names to Tailwind classes. -->
<hell-dialpad [ui]="{ callButton: 'bg-hell-success', numberInput: 'font-mono' }" />

<!-- class stays additive: layout hooks only, never recipe overrides. -->
<button hellButton class="col-start-2" ui="h-12">Save</button>`;

const STATE_ATTRIBUTE_CODE = `/* Style by contract, not by internal DOM. Public Parts render data-slot;
   states render data-* attributes. */
[hellSelectTrigger][data-slot='trigger'][data-open] {
  border-color: var(--color-hell-primary);
}`;

const THEME_CODE = `/* Runtime themes override Semantic Theme Tokens, not component variables. */
:root[data-hell-palette='emerald'] {
  --color-hell-primary: var(--color-hell-primary-600);
}

/* Optional curated skins ship as Theme Adapter Stylesheets. */
@import '@hell-ui/angular/themes/glass.css';`;

@Component({
  selector: 'hd-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlock, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header title="Guide" icon="faSolidBook">
        The map of the library: what hell optimizes for, how its entry points are organized, and which contracts to build against as a consumer.
      </hd-page-header>

      <h2>Philosophy</h2>
      <ul>
        <li>
          <strong>Consumers own markup.</strong> Most modules are directive-first: you write the
          DOM, hell contributes behavior, accessibility, and state attributes.
        </li>
        <li>
          <strong>Behavior is delegated, not reinvented.</strong> Keyboard, focus, and ARIA
          semantics come from ng-primitives and the CDK underneath stable hell selectors.
        </li>
        <li>
          <strong>Costs stay where they belong.</strong> Every surface is a narrow Package Entry
          Point, so peer dependencies and CSS ship only to the routes that import them.
        </li>
        <li>
          <strong>Styling is a contract.</strong> Components expose named Public Parts, state
          attributes, and semantic tokens — never "reach into whatever DOM happens to exist".
        </li>
      </ul>

      <h2>Architecture: Module Categories</h2>
      <p>
        Each entry point declares a Module Category that describes its public contract. The
        category never appears in import paths — imports stay import-path-first, such as
        <code>@hell-ui/angular/button</code> — but it tells you what to expect:
      </p>
      <ul>
        <li>
          <strong>Styled Primitives</strong> (button, input, menu, dialog, …) are low-level
          modules. Their value is behavior, accessibility, state attributes, default Tailwind part
          recipes, and public CSS variables. You own the surrounding structure.
        </li>
        <li>
          <strong>Mixed Entry Points</strong> (select, combobox, pagination) export primitive
          directives plus a small convenience component, for example
          <code>hell-select</code>, when assembling the primitive is boilerplate.
        </li>
        <li>
          <strong>Composites</strong> (app shell, omnibar, date picker, toast, …) combine
          primitives into a higher-level experience and may own real DOM. Their docs name the
          owned Public Parts and the escape hatches.
        </li>
        <li>
          <strong>Tables</strong> come in exactly two supported paths:
          <code>@hell-ui/angular/table</code> for semantic native-table primitives, and
          <code>@hell-ui/angular/table-tanstack</code> for a hell-styled shell around a
          caller-owned TanStack Table. hell never owns row models, sorting, or selection state.
        </li>
        <li>
          <strong>Features</strong> (code editor, PDF viewer, audio transcript) carry optional
          peers or heavy browser runtimes. They stay behind feature entry points and feature CSS
          so nobody else pays for them.
        </li>
      </ul>

      <h2>Package Entry Points</h2>
      <p>
        The root <code>@hell-ui/angular</code> export is deliberately light: stable core only
        (Part Style Map types, labels, search core). Everything visual lives behind a narrow entry
        point whose import path matches its source directory. CSS follows the same rule: a shared
        token substrate at <code>@hell-ui/angular/tokens.css</code>, one
        <code>&lt;entrypoint&gt;/styles.css</code> per surface, and no category aggregate paths.
      </p>
      <hd-code-block [code]="entrypointImportsCode" />
      <p>
        Import stylesheets through your Tailwind-processed global stylesheet. Shipped entrypoint
        CSS carries its own recipe sources, so you never add <code>&#64;source</code> scanning for
        <code>node_modules</code> to receive hell's default visuals.
      </p>

      <h2>Styling model</h2>
      <p>
        Every public module follows the same Component Contract: behavior directives, stable
        Public Parts marked with <code>data-slot</code>, state via <code>data-*</code> attributes,
        semantic CSS variables for supported values, and a Part Style Map for refinement.
      </p>
      <p>
        Defaults come from the component-owned Part Recipe — complete Tailwind utility strings per
        Public Part. Your <code>ui</code> input merges into that recipe through one deterministic
        Part-Class Pipeline, so a consumer class like <code>h-12</code> reliably beats the
        recipe's height without selector tricks:
      </p>
      <hd-code-block [code]="partStyleMapCode" />
      <ul>
        <li>
          <code>ui="..."</code> — string shorthand for the module's default Public Part (single
          -host directives use <code>root</code>).
        </li>
        <li>
          <code>[ui]="&#123; part: '...' &#125;"</code> — explicit map for multi-part owned
          anatomy. Each module exports its part union (<code>HellDialpadPart</code>) and map type
          (<code>HellDialpadUi</code>).
        </li>
        <li>
          <code>class</code> — an Additive Class Hook for layout and test hooks. It is not the
          override path for conflicting recipe utilities; that is what <code>ui</code> is for.
        </li>
      </ul>
      <p>
        For CSS that lives outside templates, target the same stable contract instead of internal
        DOM:
      </p>
      <hd-code-block [code]="stateAttributeCode" />

      <h2>Theming and customization</h2>
      <p>
        Runtime theming flows through Semantic Theme Tokens such as
        <code>--color-hell-primary</code>, <code>--color-hell-border</code>, and
        <code>--color-hell-surface-elevated</code>. Components never expose their own public color
        variable families, so a theme is a token override, not a component-by-component hunt.
        Curated skins ship as optional Theme Adapter Stylesheets under
        <code>@hell-ui/angular/themes/*.css</code>, imported after the entrypoint CSS they adapt.
      </p>
      <hd-code-block [code]="themeCode" />
      <p>Beyond visuals, the Customization Surface is deliberately explicit:</p>
      <ul>
        <li>
          <strong>Labels:</strong> built-in ARIA and status text is injectable through each
          entry point's <code>provideHell&lt;Module&gt;Labels</code> function — no forking
          components to localize, and no central label bag pulling every module's strings into
          your bundle.
        </li>
        <li>
          <strong>Adapters:</strong> date/time parsing, search ranking, and resize policy expose
          adapter seams (<code>provideHellDateInputAdapter</code>,
          <code>provideHellSearchRanker</code>) instead of mode booleans.
        </li>
        <li>
          <strong>Behavior stays intact:</strong> required accessibility, geometry, and lifecycle
          wiring are not removable through the Part Style Map.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Import one entry point per surface; let unused surfaces cost nothing.</li>
        <li>Use <code>ui</code> for visual refinement and <code>data-*</code> selectors in CSS.</li>
        <li>Override semantic tokens at the narrowest scope that owns the decision.</li>
        <li>Reach for a Composite before assembling the same primitive collage twice.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't import the root entry point for UI — it is core-only by design.</li>
        <li>Don't style unknown internal DOM; only Public Parts are contract.</li>
        <li>Don't fight the recipe with <code>class</code>; conflicting utilities belong in
          <code>ui</code>.</li>
        <li>Don't build a parallel table model — TanStack owns table state, hell styles it.</li>
      </ul>

      <p>
        Next: <a routerLink="/getting-started">Getting started</a> walks through installation, and
        <a routerLink="/theming">Theming</a> covers tokens and skins in depth.
      </p>
    </article>
  `,
})
export class GuidePage {
  protected readonly entrypointImportsCode = ENTRYPOINT_IMPORTS_CODE;
  protected readonly partStyleMapCode = PART_STYLE_MAP_CODE;
  protected readonly stateAttributeCode = STATE_ATTRIBUTE_CODE;
  protected readonly themeCode = THEME_CODE;
}
