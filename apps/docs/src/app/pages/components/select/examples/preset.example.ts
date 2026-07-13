import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSelect } from '@hell-ui/angular/select';

const REGIONS: readonly HellOption<string>[] = [
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'ap-south-1', label: 'AP (Mumbai)' },
];

@Component({
  selector: 'app-select-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSelect, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField class="max-w-72">
      <label hellFieldLabel for="deploy-region">Deployment region</label>
      <hell-select
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
