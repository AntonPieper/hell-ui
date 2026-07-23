import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellInput } from 'hell-ui/input';
import { HellSlider } from 'hell-ui/slider';

@Component({
  selector: 'app-slider-with-field-input-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellInput, HellSlider],
  template: `
    <div hellField class="max-w-sm">
      <label hellFieldLabel id="alert-threshold-label" for="alert-threshold-input">
        CPU alert threshold
      </label>
      <div class="flex items-center gap-hell-4">
        <hell-slider
          id="alert-threshold-slider"
          class="flex-1"
          aria-labelledby="alert-threshold-label"
          [min]="0"
          [max]="100"
          [step]="5"
          [value]="threshold()"
          (valueChange)="threshold.set($event)"
        />
        <div class="flex items-center gap-hell-2">
          <input
            id="alert-threshold-input"
            hellInput
            size="sm"
            type="number"
            class="w-16 text-end"
            [min]="0"
            [max]="100"
            [step]="5"
            [value]="threshold()"
            (change)="threshold.set(clamp($any($event.target).valueAsNumber))"
          />
          <span class="text-xs text-hell-foreground-muted">%</span>
        </div>
      </div>
      <div hellFieldDescription>Page on-call when CPU stays above this for 5 minutes.</div>
    </div>
  `,
})
export class SliderWithFieldInputExample {
  protected readonly threshold = signal(80);

  protected clamp(value: number): number {
    if (!Number.isFinite(value)) return this.threshold();
    return Math.min(100, Math.max(0, value));
  }
}
