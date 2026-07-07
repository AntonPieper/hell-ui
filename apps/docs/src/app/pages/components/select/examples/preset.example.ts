import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HELL_SELECT_BASIC_DIRECTIVES } from '@hell-ui/angular/select';

const REGIONS = ['eu-central-1', 'eu-west-1', 'us-east-1', 'ap-south-1'];

@Component({
  selector: 'app-select-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_BASIC_DIRECTIVES, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField class="max-w-72">
      <label hellFieldLabel for="deploy-region">Deployment region</label>
      <hell-select-basic
        id="deploy-region"
        placeholder="Pick a region"
        [options]="regions"
        [value]="value()"
        (valueChange)="value.set($event === null ? null : $any($event))"
      />
      <div hellFieldDescription>Data stays inside the selected region.</div>
    </div>
  `,
})
export class SelectPresetExample {
  protected readonly regions = REGIONS;
  protected readonly value = signal<string | null>('eu-central-1');
}
