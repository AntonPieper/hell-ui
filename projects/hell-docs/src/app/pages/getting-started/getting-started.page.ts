import { Component, ChangeDetectionStrategy } from '@angular/core';
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
  imports: [CodeBlock, ExampleTabs, GettingStartedButtonDemo],
  template: `
    <article class="hd-prose">
      <h1>Getting started</h1>
      <p>
        hell ships Angular standalone components and directives with styling in one CSS entry point.
        Install the peer packages, add the Tailwind v4 PostCSS plugin, import the styles, then
        compose directives where you already write markup.
      </p>

      <h2>1. Install peers</h2>
      <p>
        npm peer metadata is package-wide, so every package entry point expects the light
        UI stack: Angular Forms/core/common, ng-primitives, @angular/cdk,
        <code>@floating-ui/dom</code>, ng-icons core, and rxjs. If you want built-in style
        defaults, add style-only Tailwind via <code>tailwindcss</code>. Feature entry points
        add optional peers only when you import them. Add
        <code>@ng-icons/font-awesome</code> only when you use icon-backed entries such as
        pagination or date-picker.
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
        Import Tailwind first, then hell. The library exposes Tailwind-facing CSS variables such as
        <code>bg-hell-surface</code>, <code>text-hell-foreground</code>, and
        <code>border-hell-border</code>.
      </p>
      <hd-code-block [code]="stylesCode" />

      <h2>4. Configure built-in labels</h2>
      <p>
        Built-in ARIA labels default to English. Use <code>provideHellLabels</code> from
        <code>@hell-ui/angular/core</code> at the application or feature boundary to localize shared labels.
      </p>
      <hd-code-block [code]="labelsCode" />

      <h2>5. Use a directive</h2>
      <p>
        Import only the standalone building blocks your component template uses. The same file is
        rendered below and loaded raw for the code tab.
      </p>
      <hd-example-tabs [code]="buttonDemoCode" previewClass="flex items-center gap-2">
        <app-getting-started-button-demo />
      </hd-example-tabs>

      <h2>Next choices</h2>
      <ul>
        <li>
          Register icons close to the component that renders them with <code>provideIcons</code>.
        </li>
        <li>Use <code>unstyled</code> when you need behavior without hell styling.</li>
        <li>Keep theme changes in CSS variables rather than component-specific overrides.</li>
      </ul>
    </article>
  `,
})
export class GettingStartedPage {
  protected readonly installCode = installCodeRaw;
  protected readonly postcssCode = postcssCodeRaw;
  protected readonly stylesCode = stylesCodeRaw;
  protected readonly labelsCode = `import { ApplicationConfig } from '@angular/core';\nimport { provideHellLabels } from '@hell-ui/angular/core';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideHellLabels({\n      loading: 'Wird geladen',\n      pagination: {\n        navigation: 'Seitennavigation',\n        nextPage: 'Nächste Seite',\n        page: (page) => 'Seite ' + page,\n      },\n    }),\n  ],\n};\n`;
  protected readonly buttonDemoCode = buttonDemoCodeRaw;
}
