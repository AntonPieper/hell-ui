import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div class="mb-2 text-sm font-medium">Plan</div>
    <div
      hellRadioGroup
      aria-label="Plan"
      orientation="vertical"
      [required]="true"
      [value]="plan()"
      (valueChange)="plan.set($event!)"
    >
      <button hellRadio value="free" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Free
      </button>
      <button
        hellRadio
        value="legacy"
        type="button"
        class="inline-flex items-center gap-2"
        [disabled]="true"
      >
        <span ngpRadioIndicator></span> Legacy
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
  `,
})
export class RadioExampleExample {
  protected readonly plan = signal<'free' | 'legacy' | 'pro' | 'enterprise'>('free');
}
