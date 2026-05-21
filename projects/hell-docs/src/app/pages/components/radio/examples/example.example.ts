import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div id="plan-radio-label" class="mb-2 text-sm font-medium">Plan</div>
    <div
      hellRadioGroup
      aria-labelledby="plan-radio-label"
      orientation="vertical"
      [value]="plan()"
      (valueChange)="plan.set($event!)"
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
  `,
})
export class RadioExampleExample {
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
}
