import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div hellRadioGroup aria-label="Delivery speed" [formField]="deliveryForm.speed">
      <button hellRadio value="standard" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Standard
      </button>
      <button hellRadio value="express" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Express
      </button>
      <button hellRadio value="overnight" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Overnight
      </button>
    </div>
    <p class="m-0 mt-hell-3 text-hell-sm text-hell-foreground-muted">
      A <code>required()</code> rule marks the field; the group mirrors it as
      <code>aria-required</code>. Selected:
      <code>{{ deliveryForm.speed().value() ?? 'none' }}</code> · Invalid:
      <code>{{ deliveryForm.speed().invalid() }}</code> · Touched:
      <code>{{ deliveryForm.speed().touched() }}</code>
    </p>
  `,
})
export class RadioFormsExample {
  protected readonly delivery = signal<{ speed: string | null }>({ speed: null });
  protected readonly deliveryForm = form(this.delivery, (path) => {
    required(path.speed);
  });
}
