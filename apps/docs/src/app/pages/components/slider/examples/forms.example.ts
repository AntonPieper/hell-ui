import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, max } from '@angular/forms/signals';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellSlider } from 'hell-ui/slider';

@Component({
  selector: 'app-slider-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellSlider],
  template: `
    <div hellField class="max-w-sm">
      <label hellFieldLabel id="forms-volume-label" for="forms-volume-slider">Volume</label>
      <div class="flex items-center gap-hell-4">
        <hell-slider
          id="forms-volume-slider"
          class="flex-1"
          aria-labelledby="forms-volume-label"
          [formField]="settingsForm.volume"
        />
        <code class="w-12 text-end">{{ settingsForm.volume().value() }}%</code>
      </div>
      <div hellFieldDescription>
        A <code>max(80)</code> rule caps the field; the slider mirrors it as its own
        <code>max</code>, so dragging stops at 80. Touched:
        <code>{{ settingsForm.volume().touched() }}</code>
      </div>
    </div>
  `,
})
export class SliderFormsExample {
  protected readonly settings = signal({ volume: 65 });
  protected readonly settingsForm = form(this.settings, (path) => {
    max(path.volume, 80);
  });
}
