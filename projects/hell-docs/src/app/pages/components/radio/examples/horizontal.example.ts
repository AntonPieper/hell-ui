import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div id="size-radio-label" class="mb-2 text-sm font-medium">T-shirt size</div>
    <div
      hellRadioGroup
      aria-labelledby="size-radio-label"
      orientation="horizontal"
      [value]="size()"
      (valueChange)="size.set($event!)"
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
  `,
})
export class RadioHorizontalExample {
  protected readonly size = signal<'sm' | 'md' | 'lg'>('md');
}
