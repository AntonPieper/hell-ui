import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadioGroup, HellRadio, HellRadioIndicator } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <article class="hd-prose">
      <h1>Radio</h1>
      <p>Pick one option from a small set. Use a select instead for &gt; 5 options.</p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="grid gap-4">
        <div
          hellRadioGroup
          orientation="vertical"
          [value]="plan()"
          (valueChange)="plan.set($any($event))"
        >
          <button hellRadio value="free" type="button" class="inline-flex items-center gap-2">
            <span ngpRadioIndicator></span> Free
          </button>
          <button hellRadio value="pro" type="button" class="inline-flex items-center gap-2">
            <span ngpRadioIndicator></span> Pro
          </button>
          <button hellRadio value="enterprise" type="button" class="inline-flex items-center gap-2">
            <span ngpRadioIndicator></span> Enterprise
          </button>
        </div>

        <p>
          Selected: <code>{{ plan() }}</code>
        </p>
      </hd-example-tabs>

      <h2>Horizontal</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
        <div
          hellRadioGroup
          orientation="horizontal"
          [value]="size()"
          (valueChange)="size.set($any($event))"
        >
          <button hellRadio value="sm" type="button" class="inline-flex items-center gap-[0.4rem]">
            <span ngpRadioIndicator></span> Small
          </button>
          <button hellRadio value="md" type="button" class="inline-flex items-center gap-[0.4rem]">
            <span ngpRadioIndicator></span> Medium
          </button>
          <button hellRadio value="lg" type="button" class="inline-flex items-center gap-[0.4rem]">
            <span ngpRadioIndicator></span> Large
          </button>
        </div>
        <p class="mt-2">
          Selected size: <code>{{ size() }}</code>
        </p>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellRadioGroup</code>: <code>value</code>, <code>valueChange</code>,
          <code>orientation</code>, <code>disabled</code>
        </li>
        <li><code>hellRadio</code>: <code>value</code>, <code>disabled</code></li>
        <li>
          <code>ngpRadioIndicator</code>: visual marker (re-exported as
          <code>HellRadioIndicator</code>)
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use radio for one choice from a small set.</li>
        <li>Keep options visible and mutually exclusive.</li>
        <li>Use horizontal orientation only for short labels.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use radio for independent toggles.</li>
        <li>Don't make users open a menu to understand all choices.</li>
      </ul>
    </article>
  `,
})
export class RadioPage {
  protected readonly exampleCodes = [
    '<div hellRadioGroup orientation="vertical" value="free">\n  <button hellRadio value="free" type="button" class="inline-flex items-center gap-2">\n    <span ngpRadioIndicator></span>\n    Free\n  </button>\n  <button hellRadio value="team" type="button" class="inline-flex items-center gap-2">\n    <span ngpRadioIndicator></span>\n    Team\n  </button>\n</div>\n',
    '<div hellRadioGroup orientation="horizontal" value="md">\n  <button hellRadio value="sm" type="button" class="inline-flex items-center gap-[0.4rem]">\n    <span ngpRadioIndicator></span>\n    Small\n  </button>\n  <button hellRadio value="md" type="button" class="inline-flex items-center gap-[0.4rem]">\n    <span ngpRadioIndicator></span>\n    Medium\n  </button>\n</div>\n',
  ] as const;
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly size = signal<'sm' | 'md' | 'lg'>('md');
}
