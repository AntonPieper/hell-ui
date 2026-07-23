import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeader } from '../../shared/page-header';
import { CodeBlock } from '../../shared/code-block';
import { ExampleTabs } from '../../shared/example-tabs';
import { GettingStartedButtonDemo } from './examples/button-demo.example';
import buttonDemoCodeRaw from './examples/button-demo.example.ts?raw' with { loader: 'text' };
import installCodeRaw from './examples/install.example.sh?raw' with { loader: 'text' };
import postcssCodeRaw from './examples/postcss.example.json?raw' with { loader: 'text' };
import stylesCodeRaw from './examples/styles.example.css?raw' with { loader: 'text' };

@Component({
  selector: 'hd-getting-started',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock, ExampleTabs, GettingStartedButtonDemo, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header title="Getting started" icon="faSolidRocket">
        Install the peers, configure Tailwind v4, import the styles you need, and compose your first components.
      </hd-page-header>
      <p>
        hell ships Angular standalone components and directives with optional Tailwind-v4-backed
        style entry points. Install the peer packages, add the Tailwind v4 PostCSS plugin, import
        only the styles you need, then compose directives where you already write markup.
      </p>

      <h2>1. Install peers</h2>
      <p>
        pnpm is the only supported package manager for this repository. The checked-in pnpm lock
        backs CI and package-consumer tests with strict-peer installs. Package peer metadata is
        package-wide, so every package entry point expects the light UI stack: Angular
        Forms/core/common, ng-primitives, @angular/cdk, <code>@floating-ui/dom</code>, ng-icons
        core, and rxjs. If you import Hell styles, Tailwind is required via
        <code>tailwindcss</code>. Feature peers are still only runtime-needed when you import their
        feature entry points. Add <code>@angular/router</code> only when you import Hell dialog,
        because <code>ng-primitives/dialog</code> has a router peer. Add
        <code>@ng-icons/font-awesome</code> only when you use icon-backed entries such as pagination
        or date-picker.
      </p>
      <hd-code-block [code]="installCode" />

      <h2>2. Configure Tailwind v4</h2>
      <p>
        Tailwind v4 runs through <code>&#64;tailwindcss/postcss</code>. Add a
        <code>.postcssrc.json</code> at the root of your workspace:
      </p>
      <hd-code-block [code]="postcssCode" />

      <h2>3. Import the styles</h2>
      <p>
        Import Tailwind first, then the narrow Hell style entry points you need. The library exposes
        Tailwind-facing CSS variables such as <code>bg-hell-surface</code>,
        <code>text-hell-foreground</code>, and <code>border-hell-border</code>. CSS follows
        import paths: shared tokens first, then each component or feature stylesheet you use.
      </p>
      <hd-code-block [code]="stylesCode" />

      <h2>4. Configure built-in labels</h2>
      <p>
        Built-in ARIA labels default to English. Each entry point owns its labels and exports a
        <code>provideHell&lt;Module&gt;Labels</code> function; call it at the application or
        feature boundary to localize only the modules you use.
      </p>
      <hd-code-block [code]="labelsCode" />

      <h2>5. Use a directive</h2>
      <p>
        Import only the standalone building blocks your component template uses. Prefer narrow
        primitive and composite entry points, such as <code>hell-ui/button</code> or
        <code>hell-ui/app-shell</code>, over aggregate entry points when a component only
        needs one family. The same file is rendered below and loaded raw for the code tab.
      </p>
      <hd-example-tabs [code]="buttonDemoCode" previewClass="flex items-center gap-2">
        <app-getting-started-button-demo />
      </hd-example-tabs>

      <h2>Next choices</h2>
      <ul>
        <li>
          Register icons close to the component that renders them with <code>provideIcons</code>.
        </li>
        <li>Use <code>ui</code> to refine migrated component recipes.</li>
        <li>Keep theme changes in CSS variables rather than component-specific overrides.</li>
      </ul>
    </article>
  `,
})
export class GettingStartedPage {
  protected readonly installCode = installCodeRaw;
  protected readonly postcssCode = postcssCodeRaw;
  protected readonly stylesCode = stylesCodeRaw;
  protected readonly labelsCode = `import { ApplicationConfig } from '@angular/core';\nimport { HELL_SPINNER_LABELS } from 'hell-ui/spinner';\nimport { provideHellPaginationLabels } from 'hell-ui/pagination';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideHellLabels(HELL_SPINNER_LABELS, { loading: 'Wird geladen' }),\n    provideHellPaginationLabels({\n      navigation: 'Seitennavigation',\n      nextPage: 'Nächste Seite',\n      page: (page) => 'Seite ' + page,\n    }),\n  ],\n};\n`;
  protected readonly buttonDemoCode = buttonDemoCodeRaw;
}
