import { Component, signal } from '@angular/core';
import { hellSearchResource } from '@hell-ui/angular/core';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterBuilderUi,
  type HellFilterFieldDescriptor,
} from '@hell-ui/angular/features/filter-builder';

interface IdentifiedFilter<TField extends string, TOperator extends string, TValue>
  extends HellFilter<TField, TOperator, TValue> {
  readonly id: string;
}

interface Owner {
  readonly id: string;
  readonly name: string;
}

type NameFilter = IdentifiedFilter<'name', 'contains' | 'startsWith', string>;
type OwnerFilter = IdentifiedFilter<'owner', 'is', Owner>;
type PackageFilter = NameFilter | OwnerFilter;

// Projected-editor Filter Builder feature with generic expressions and normal
// composite peers: overlay editors mount through the packed feature entry.
@Component({
  selector: 'app-filter-builder',
  imports: [...HELL_FILTER_BUILDER_IMPORTS],
  template: `
    <hell-filter-builder
      aria-label="Package filters"
      [fields]="fields"
      [value]="value()"
      [identify]="identifyFilter"
      [ui]="filterUi"
      (valueChange)="value.set($event)"
    >
      <ng-template [hellFilterBuilderEditor]="nameField" let-editor>
        <input #nameValue aria-label="Name value" [value]="editor.filter?.value ?? ''" />
        <button type="button" (click)="commitName(editor, nameValue.value)">Apply name</button>
        <button type="button" (click)="editor.cancel()">Cancel</button>
      </ng-template>

      <ng-template [hellFilterBuilderEditor]="ownerField" let-editor>
        @for (owner of ownerSearch.items(); track owner.id) {
          <button type="button" (click)="commitOwner(editor, owner)">{{ owner.name }}</button>
        }
      </ng-template>
    </hell-filter-builder>
  `,
})
export class FilterBuilder {
  protected readonly nameField: HellFilterFieldDescriptor<NameFilter> = {
    field: 'name',
    label: 'Name',
    multiple: true,
    display: (filter) => `Name ${filter.operator} ${filter.value}`,
    validate: (filter) => filter.value.trim().length > 0,
  };
  protected readonly ownerField: HellFilterFieldDescriptor<OwnerFilter> = {
    field: 'owner',
    label: 'Owner',
    display: (filter) => `Owner is ${filter.value.name}`,
    validate: (filter) => Boolean(filter.value.id && filter.value.name),
  };
  protected readonly fields = [this.nameField, this.ownerField] as const;
  protected readonly value = signal<readonly PackageFilter[]>([]);
  protected readonly identifyFilter = (filter: PackageFilter) => filter.id;
  protected readonly filterUi = {
    root: 'max-w-[720px]',
    editor: 'min-w-[320px]',
  } satisfies HellFilterBuilderUi;
  protected readonly ownerQuery = signal('');
  protected readonly ownerSearch = hellSearchResource<Owner>({
    query: this.ownerQuery,
    source: async ({ query, signal: abortSignal }) => {
      if (abortSignal.aborted) return [];
      return [{ id: 'grace', name: query ? 'Grace Hopper' : 'Suggested owner' }];
    },
  });
  private nextIdentity = 0;

  protected commitName(editor: HellFilterBuilderEditorContext<NameFilter>, value: string): void {
    const candidate: NameFilter = {
      id: editor.filter?.id ?? this.createIdentity('name'),
      field: 'name',
      operator: editor.filter?.operator ?? 'contains',
      value: value.trim(),
    };
    editor.display(candidate);
    if (editor.validate(candidate)) editor.commit(candidate);
  }

  protected commitOwner(editor: HellFilterBuilderEditorContext<OwnerFilter>, owner: Owner): void {
    editor.commit({
      id: editor.filter?.id ?? this.createIdentity('owner'),
      field: 'owner',
      operator: 'is',
      value: owner,
    });
  }

  private createIdentity(field: string): string {
    this.nextIdentity += 1;
    return `${field}-${this.nextIdentity}`;
  }
}
