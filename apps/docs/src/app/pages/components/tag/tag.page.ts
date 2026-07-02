import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TagBadgeExample } from './examples/badge.example';
import tagBadgeExampleCodeRaw from './examples/badge.example.ts?raw' with { loader: 'text' };
import { TagKeyboardHintExample } from './examples/keyboard-hint.example';
import tagKeyboardHintExampleCodeRaw from './examples/keyboard-hint.example.ts?raw' with {
  loader: 'text',
};
import { TagTagVariantsExample } from './examples/tag-variants.example';
import tagTagVariantsExampleCodeRaw from './examples/tag-variants.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, TagTagVariantsExample, TagBadgeExample, TagKeyboardHintExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tag, Badge, Kbd"
        icon="faSolidTag"
        category="Styled primitive"
        importPath="@hell-ui/angular/tag"
        stylesPath="@hell-ui/angular/tag/styles.css"
      >
        Tags, badges, and keyboard hints (<code>kbd</code>) for compact metadata in tables, headers, and toolbars.
      </hd-page-header>
      <h2>Tag variants</h2>
      <hd-example-tabs [code]="tagTagVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-tag-tag-variants-example />
      </hd-example-tabs>

      <h2>Badge</h2>
      <hd-example-tabs [code]="tagBadgeExampleCode" previewClass="flex items-center gap-3">
        <app-tag-badge-example />
      </hd-example-tabs>

      <h2>Keyboard hint</h2>
      <hd-example-tabs [code]="tagKeyboardHintExampleCode">
        <app-tag-keyboard-hint-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellTag variant</code>:
          <code>default | primary | info | success | warning | danger</code>
        </li>
        <li><code>ui</code>: string shorthand or <code>&#123; root: '...' &#125;</code></li>
        <li><code>hellBadge</code>: small numeric counter</li>
        <li><code>hellKbd</code>: keyboard key indicator</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Tags and badges are plain text to assistive tech — never encode meaning in color alone.</li>
        <li><code>hellKbd</code> renders real <code>kbd</code> elements for shortcut hints.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use tags for status, category or compact metadata.</li>
        <li>Use badges for counts and keyboard hints for shortcuts.</li>
        <li>Keep variant meaning consistent across pages.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't make tags look clickable unless they are interactive.</li>
        <li>Don't encode critical status by color alone.</li>
      </ul>
    </article>
  `,
})
export class TagPage {
  protected readonly tagTagVariantsExampleCode = tagTagVariantsExampleCodeRaw;
  protected readonly tagBadgeExampleCode = tagBadgeExampleCodeRaw;
  protected readonly tagKeyboardHintExampleCode = tagKeyboardHintExampleCodeRaw;
}
