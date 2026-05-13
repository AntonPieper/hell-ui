import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-radio-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div hellRadioGroup orientation="horizontal" [value]="size()" (valueChange)="size.set($event!)">
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
  `,
})
export class RadioHorizontalExample {
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly size = signal<'sm' | 'md' | 'lg'>('md');
}
