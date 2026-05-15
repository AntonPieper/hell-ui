import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeCheckbox } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-checkbox-native-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeCheckbox],
  template: `
    <label>
      <input
        type="checkbox"
        hellNativeCheckbox
        [checked]="value()"
        [required]="true"
        [indeterminate]="value() === null"
        (checkedChange)="onCheckedChange($event)"
      />
      <span>Accept terms</span>
    </label>
    <p>State: {{ valueText() }}</p>
  `,
})
export class CheckboxNativeExample {
  protected readonly value = signal<boolean | null>(null);

  protected valueText(): string {
    if (this.value() === null) return 'indeterminate';
    return this.value() ? 'checked' : 'unchecked';
  }

  protected onCheckedChange(next: boolean): void {
    this.value.set(next);
  }
}
