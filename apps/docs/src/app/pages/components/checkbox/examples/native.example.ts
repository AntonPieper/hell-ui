import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeCheckbox } from '@hell-ui/angular/checkbox';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  selector: 'app-checkbox-native-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeCheckbox, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField orientation="horizontal">
      <input
        id="native-terms"
        type="checkbox"
        hellNativeCheckbox
        required
        aria-label="Accept terms"
        [checked]="value() === true"
        [indeterminate]="value() === null"
        (checkedChange)="value.set($event)"
      />
      <label hellFieldLabel for="native-terms">Accept terms</label>
      <div hellFieldDescription>Required before you can continue.</div>
    </div>
    <p>State: {{ stateText() }}</p>
  `,
})
export class CheckboxNativeExample {
  protected readonly value = signal<boolean | null>(null);

  protected stateText(): string {
    if (this.value() === null) return 'indeterminate';
    return this.value() ? 'checked' : 'unchecked';
  }
}
