import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div
      hellRadioGroup
      aria-label="T-shirt size"
      orientation="horizontal"
      [value]="size()"
      (valueChange)="size.set($event!)"
    >
      <button hellRadio value="sm" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Small
      </button>
      <button hellRadio value="md" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Medium
      </button>
      <button hellRadio value="lg" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Large
      </button>
      <!-- Out of stock: individually disabled, skipped by roving focus and Arrow keys. -->
      <button hellRadio value="xl" type="button" class="inline-flex items-center gap-2" disabled>
        <span ngpRadioIndicator></span> X-Large
      </button>
    </div>
    <p class="mt-2">
      Selected size: <code>{{ size() }}</code>
    </p>
  `,
})
export class RadioHorizontalExample {
  protected readonly size = signal<'sm' | 'md' | 'lg' | 'xl'>('md');
}
