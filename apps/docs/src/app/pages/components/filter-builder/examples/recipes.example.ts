import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';
import { hellRankLocalSearch } from '@hell-ui/angular/core';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterFieldDescriptor,
} from '@hell-ui/angular/features/filter-builder';
import { HellInput } from '@hell-ui/angular/input';

interface IdentifiedFilter<
  TField extends string,
  TOperator extends string,
  TValue,
> extends HellFilter<TField, TOperator, TValue> {
  readonly id: string;
}

type NameFilter = IdentifiedFilter<'name', 'contains' | 'startsWith', string>;
type StatusFilter = IdentifiedFilter<'status', 'is' | 'isNot', 'active' | 'paused'>;
type PriorityFilter = IdentifiedFilter<'priority', 'atLeast', number>;
type PeopleFilter = NameFilter | StatusFilter | PriorityFilter;

interface StatusOption {
  readonly value: StatusFilter['value'];
  readonly label: string;
}

const STATUS_OPTIONS: readonly StatusOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

@Component({
  selector: 'app-filter-builder-recipes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    ...HELL_COMBOBOX_DIRECTIVES,
    HellButton,
    HellInput,
    JsonPipe,
  ],
  template: `
    <div class="flex w-full max-w-3xl flex-col gap-hell-4">
      <hell-filter-builder
        aria-label="People filter builder"
        [fields]="fields"
        [value]="filters()"
        [identify]="identifyFilter"
        (valueChange)="filters.set($event)"
      >
        <ng-template [hellFilterBuilderEditor]="nameField" let-editor>
          <div class="flex flex-wrap items-end gap-hell-2">
            <label class="grid min-w-52 flex-1 gap-hell-1 text-xs font-medium">
              Name text
              <input
                #nameValue
                hellInput
                aria-label="Name text"
                placeholder="e.g. Ada"
                [value]="editor.filter?.value ?? ''"
                (keydown.enter)="editor.commit(nameCandidate(editor, nameValue.value))"
              />
            </label>
            <button
              hellButton
              type="button"
              variant="soft"
              (click)="editor.commit(nameCandidate(editor, nameValue.value))"
            >
              Apply
            </button>
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="statusField" let-editor>
          <div
            hellCombobox
            class="min-w-64"
            [value]="null"
            [options]="statusOptions()"
            [wrapNavigation]="false"
            (valueChange)="selectStatus(editor, $any($event))"
          >
            <input
              hellComboboxInput
              aria-label="Status option"
              placeholder="Choose status…"
              [value]="statusQuery()"
              (input)="statusQuery.set($any($event.target).value ?? '')"
            />
            <button hellComboboxButton type="button" aria-label="Toggle status options"></button>
            <div *hellComboboxPortal hellComboboxDropdown>
              @for (option of statusOptions(); track option.value) {
                <div hellComboboxOption [value]="option">{{ option.label }}</div>
              }
            </div>
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="priorityField" let-editor>
          <div class="flex flex-wrap items-end gap-hell-2">
            <label class="grid min-w-44 gap-hell-1 text-xs font-medium">
              Minimum priority
              <input
                #priorityValue
                hellInput
                type="number"
                min="1"
                max="5"
                aria-label="Minimum priority"
                [value]="editor.filter?.value ?? 3"
                (keydown.enter)="editor.commit(priorityCandidate(editor, priorityValue.valueAsNumber))"
              />
            </label>
            <button
              hellButton
              type="button"
              variant="soft"
              (click)="editor.commit(priorityCandidate(editor, priorityValue.valueAsNumber))"
            >
              Apply ≥
            </button>
          </div>
        </ng-template>
      </hell-filter-builder>

      <div class="rounded-hell-md border border-hell-border bg-hell-surface-subtle p-hell-3">
        <strong class="text-xs uppercase tracking-wide text-hell-foreground-muted">
          Controlled value
        </strong>
        <pre class="mt-hell-2 overflow-x-auto text-xs" data-testid="recipe-filter-value">{{
          filters() | json
        }}</pre>
      </div>
    </div>
  `,
})
export class FilterBuilderRecipesExample {
  protected readonly nameField: HellFilterFieldDescriptor<NameFilter> = {
    field: 'name',
    label: 'Name',
    multiple: true,
    display: (filter) =>
      `Name ${filter.operator === 'startsWith' ? 'starts with' : 'contains'} “${filter.value}”`,
    validate: (filter) => filter.value.trim().length > 0,
  };
  protected readonly statusField: HellFilterFieldDescriptor<StatusFilter> = {
    field: 'status',
    label: 'Status',
    display: (filter) =>
      `Status ${filter.operator === 'isNot' ? 'is not' : 'is'} ${filter.value}`,
    validate: (filter) => STATUS_OPTIONS.some((option) => option.value === filter.value),
  };
  protected readonly priorityField: HellFilterFieldDescriptor<PriorityFilter> = {
    field: 'priority',
    label: 'Priority ≥',
    display: (filter) => `Priority ≥ ${filter.value}`,
    validate: (filter) => Number.isInteger(filter.value) && filter.value >= 1 && filter.value <= 5,
  };
  protected readonly fields = [this.nameField, this.statusField, this.priorityField] as const;
  protected readonly filters = signal<readonly PeopleFilter[]>([]);
  protected readonly statusQuery = signal('');
  protected readonly statusOptions = computed(() =>
    hellRankLocalSearch(STATUS_OPTIONS, {
      query: this.statusQuery(),
      fields: [{ get: (option) => option.label }],
    }).map(({ item }) => item),
  );
  protected readonly identifyFilter = (filter: PeopleFilter) => filter.id;
  private nextIdentity = 0;

  protected nameCandidate(
    editor: HellFilterBuilderEditorContext<NameFilter>,
    value: string,
  ): NameFilter {
    return {
      id: editor.filter?.id ?? this.createIdentity('name'),
      field: 'name',
      operator: editor.filter?.operator ?? 'contains',
      value: value.trim(),
    };
  }

  protected selectStatus(
    editor: HellFilterBuilderEditorContext<StatusFilter>,
    option: StatusOption | null,
  ): void {
    if (!option) return;
    editor.commit({
      id: editor.filter?.id ?? this.createIdentity('status'),
      field: 'status',
      operator: editor.filter?.operator ?? 'is',
      value: option.value,
    });
    this.statusQuery.set('');
  }

  protected priorityCandidate(
    editor: HellFilterBuilderEditorContext<PriorityFilter>,
    value: number,
  ): PriorityFilter {
    return {
      id: editor.filter?.id ?? this.createIdentity('priority'),
      field: 'priority',
      operator: 'atLeast',
      value,
    };
  }

  private createIdentity(field: string): string {
    this.nextIdentity += 1;
    return `${field}-${this.nextIdentity}`;
  }
}
