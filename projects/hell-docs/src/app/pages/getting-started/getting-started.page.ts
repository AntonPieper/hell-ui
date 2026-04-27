import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlock } from '../../shared/code-block';

@Component({
  selector: 'hd-getting-started',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock],
  template: `
    <article class="hd-prose">
      <h1>Installation</h1>
      <p>
        hell is built as an Angular library that depends on Angular Primitives, Tailwind v4, and
        optional specialised libraries for feature components.
      </p>

      <h2>1. Install peers</h2>
      <hd-code-block [code]="installCode" />

      <h2>2. Configure Tailwind v4</h2>
      <p>Add a <code>.postcssrc.json</code> at the root of your workspace:</p>
      <hd-code-block [code]="postcssCode" />

      <h2>3. Import the styles</h2>
      <p>Add the following to your global stylesheet (typically <code>src/styles.css</code>):</p>
      <hd-code-block [code]="stylesCode" />

      <h2>4. Use a directive</h2>
      <hd-code-block [code]="buttonCode" />
    </article>
  `,
})
export class GettingStartedPage {
  protected readonly installCode = `pnpm add ng-primitives @ng-icons/core @ng-icons/font-awesome
pnpm add -D tailwindcss @tailwindcss/postcss postcss
`;

  protected readonly postcssCode = `{
  "plugins": { "@tailwindcss/postcss": {} }
}
`;

  protected readonly stylesCode = `@import 'tailwindcss';
@import 'hell/styles';
`;

  protected readonly buttonCode = `import { Component } from '@angular/core';
import { HellButton } from 'hell';

@Component({
  selector: 'app-demo',
  imports: [HellButton],
  template: \`<button hellButton variant="primary">Save</button>\`,
})
export class DemoComponent {}
`;
}
