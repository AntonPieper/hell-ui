import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilterFieldDescriptor,
} from 'hell-ui/features/filter-builder';

import {
  FilterBuilderDateRangeEditor,
  type CreatedFilter,
} from './date-range-editor';

@Component({
  selector: 'app-filter-builder-date-range-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    FilterBuilderDateRangeEditor,
  ],
  template: `
    <div class="w-full max-w-3xl">
      <hell-filter-builder
        aria-label="Created date filter builder"
        [fields]="fields"
        [value]="filters()"
        [identify]="identifyFilter"
        (valueChange)="filters.set($event)"
      >
        <ng-template [hellFilterBuilderEditor]="createdField" let-editor>
          <app-filter-builder-date-range-editor [editor]="editor" />
        </ng-template>
      </hell-filter-builder>
    </div>
  `,
})
export class FilterBuilderDateRangeExample {
  protected readonly createdField: HellFilterFieldDescriptor<CreatedFilter> = {
    field: 'created',
    label: 'Created date',
    display: (filter) =>
      `Created ${filter.value.from ?? 'any time'} – ${filter.value.to ?? 'any time'}`,
    validate: (filter) =>
      Boolean(filter.value.from || filter.value.to) &&
      (!filter.value.from || !filter.value.to || filter.value.from <= filter.value.to),
  };
  protected readonly fields = [this.createdField] as const;
  protected readonly filters = signal<readonly CreatedFilter[]>([]);
  protected readonly identifyFilter = (filter: CreatedFilter) => filter.id;
}
