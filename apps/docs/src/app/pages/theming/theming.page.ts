import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlock } from '../../shared/code-block';
import { ExampleTabs } from '../../shared/example-tabs';
import { ThemedPanelDemo } from './examples/scoped-theme-demo.example';
import scopedThemeDemoCodeRaw from './examples/scoped-theme-demo.example.ts?raw' with {
  loader: 'text',
};
import themeAttributeCodeRaw from './examples/theme-attribute.example.html?raw' with {
  loader: 'text',
};
import tokenOverrideCodeRaw from './examples/token-override.example.css?raw' with {
  loader: 'text',
};
import themeAdapterCodeRaw from './examples/theme-adapter.example.css?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-theming',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock, ExampleTabs, ThemedPanelDemo],
  template: `
    <article class="hd-prose">
      <h1>Theming</h1>
      <p>
        hell is token-first. Components read semantic CSS variables; Tailwind utilities read the
        same values through the <code>--color-hell-*</code>, <code>--spacing-hell-*</code>,
        <code>--radius-hell-*</code>, and <code>--shadow-hell-*</code> namespaces.
      </p>

      <p>
        Treat palette scales as raw material and semantic tokens as the contract. App code should
        prefer <code>--color-hell-primary</code> over <code>--color-hell-primary-900</code> so a
        theme can remap intent without touching every component.
      </p>

      <h2>Brand anchors</h2>
      <ul class="hd-token-map">
        <li>
          <code>primary</code> — <code>--color-hell-primary-900</code> →
          <code>--color-hell-primary</code>
        </li>
        <li>
          <code>success</code> — <code>--color-hell-success-500</code> →
          <code>--color-hell-success</code>
        </li>
        <li>
          <code>info</code> — <code>--color-hell-info-400</code> →
          <code>--color-hell-info</code>
        </li>
        <li>
          <code>danger</code> — <code>--color-hell-danger-500</code> →
          <code>--color-hell-danger</code>
        </li>
      </ul>

      <p>
        Components should consume semantic tokens. That keeps rendered UI stable even when palette
        weights are reclassified or expanded.
      </p>

      <h2>Theme adapters</h2>
      <p>
        Tokens define theme-wide primitives only. Skin-specific component decisions live in optional
        adapter stylesheets such as <code>@hell-ui/angular/themes/glass.css</code>. Import an
        adapter after the entrypoint CSS it adapts; components not covered by that adapter keep their
        default recipes.
      </p>
      <hd-code-block [code]="themeAdapterCode" />

      <h2>Light vs dark</h2>
      <p>
        The docs app defaults to the system color scheme. To force a theme, set
        <code>data-hell-theme</code> to <code>light</code> or <code>dark</code> on a high-level
        element, usually <code>&lt;html&gt;</code>.
      </p>
      <hd-code-block [code]="themeAttributeCode" />

      <h2>Overriding tokens</h2>
      <p>
        Override tokens at the narrowest scope that owns the visual decision. This keeps product
        areas distinct without forking components.
      </p>
      <hd-code-block [code]="tokenOverrideCode" />

      <h2>Scoped preview</h2>
      <hd-example-tabs [code]="scopedThemeDemoCode" previewClass="grid max-w-md gap-3">
        <app-themed-panel-demo />
      </hd-example-tabs>

      <h2>Rules</h2>
      <ul>
        <li>Use semantic tokens in component CSS and app overrides.</li>
        <li>Keep radii small; hell uses 2px to 12px with 6px as the default control shape.</li>
        <li>Use elevation sparingly; borders and tonal layers carry most hierarchy.</li>
        <li>Set theme and skin attributes once near the root. Do not toggle classes per component.</li>
      </ul>
    </article>
  `,
})
export class ThemingPage {
  protected readonly themeAttributeCode = themeAttributeCodeRaw;
  protected readonly tokenOverrideCode = tokenOverrideCodeRaw;
  protected readonly themeAdapterCode = themeAdapterCodeRaw;
  protected readonly scopedThemeDemoCode = scopedThemeDemoCodeRaw;
}
