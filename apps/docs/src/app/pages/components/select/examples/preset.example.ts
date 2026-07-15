import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';

interface Region {
  readonly id: string;
  readonly label: string;
}

const REGIONS: readonly Region[] = [
  { id: 'eu-central-1', label: 'EU (Frankfurt)' },
  { id: 'eu-west-1', label: 'EU (Ireland)' },
  { id: 'us-east-1', label: 'US East (N. Virginia)' },
  { id: 'ap-south-1', label: 'AP (Mumbai)' },
];

@Component({
  selector: 'app-select-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_DIRECTIVES, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField class="max-w-72">
      <label hellFieldLabel for="deploy-region">Deployment region</label>
      <button
        id="deploy-region"
        hellSelect
        type="button"
        [value]="value()"
        [compareWith]="compareById"
        (valueChange)="value.set($any($event))"
      >
        @if (value(); as current) {
          <span hellSelectValue>{{ current.label }}</span>
        } @else {
          <span hellSelectPlaceholder>Pick a region</span>
        }
        <ng-template hellSelectPortal>
          <div hellSelectDropdown>
            @for (region of regions; track region.id) {
              <div hellSelectOption [value]="region">{{ region.label }}</div>
            }
          </div>
        </ng-template>
      </button>
      <div hellFieldDescription>Data stays inside the selected region.</div>
    </div>
  `,
})
export class SelectPresetExample {
  protected readonly regions = REGIONS;
  protected readonly value = signal<Region | null>(REGIONS[0] ?? null);
  protected readonly compareById = (a: Region, b: Region): boolean => a.id === b.id;
}
