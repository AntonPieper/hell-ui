import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';
import { HELL_CONTROL_GROUP_DIRECTIVES } from '@hell-ui/angular/control-group';
import { hellSearchResource } from '@hell-ui/angular/core';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterFieldDescriptor,
} from '@hell-ui/angular/features/filter-builder';

interface Owner {
  readonly id: string;
  readonly name: string;
  readonly team: string;
}

interface OwnerFilter extends HellFilter<'owner', 'is', Owner> {
  readonly id: string;
}

const OWNERS: readonly Owner[] = [
  { id: 'owner-1', name: 'Ada Lovelace', team: 'Platform' },
  { id: 'owner-2', name: 'Grace Hopper', team: 'Compiler' },
  { id: 'owner-3', name: 'Linus Torvalds', team: 'Infrastructure' },
  { id: 'owner-4', name: 'Margaret Hamilton', team: 'Reliability' },
  { id: 'owner-5', name: 'Radia Perlman', team: 'Networks' },
];

@Component({
  selector: 'app-filter-builder-async-entity-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    ...HELL_COMBOBOX_DIRECTIVES,
    ...HELL_CONTROL_GROUP_DIRECTIVES,
  ],
  template: `
    <div class="flex w-full max-w-3xl flex-col gap-hell-3">
      <hell-filter-builder
        aria-label="Owner filter builder"
        [fields]="fields"
        [value]="filters()"
        [identify]="identifyFilter"
        (valueChange)="filters.set($event)"
      >
        <ng-template [hellFilterBuilderEditor]="ownerField" let-editor>
          <div hellControlGroup class="min-w-72">
            <div
              hellCombobox
              class="min-w-0 flex-1"
              [options]="ownerOptions()"
              [value]="editor.filter?.value ?? null"
              [compareWith]="compareOwner"
              (valueChange)="selectOwner(editor, $any($event))"
            >
              <input
                hellComboboxInput
                aria-label="Owner directory"
                placeholder="Search owners… (try “fail”)"
                [value]="ownerSearch.query()"
                (input)="ownerSearch.query.set($any($event.target).value ?? '')"
              />
              <button hellComboboxButton type="button" aria-label="Toggle owners"></button>
              <div *hellComboboxPortal hellComboboxDropdown>
                @if (ownerSearch.status() === 'loading') {
                  <div
                    class="px-hell-3 py-hell-2 text-xs text-hell-foreground-subtle"
                    role="status"
                  >
                    Loading owners…
                  </div>
                } @else if (ownerSearch.status() === 'error') {
                  <div class="px-hell-3 py-hell-2 text-xs text-hell-danger" role="alert">
                    Owner directory unavailable. Try another query.
                  </div>
                } @else {
                  @for (owner of ownerOptions(); track owner.id) {
                    <div hellComboboxOption [value]="owner">
                      <strong>{{ owner.name }}</strong>
                      <span class="ms-auto text-xs text-hell-foreground-subtle">
                        {{ owner.team }}
                      </span>
                    </div>
                  } @empty {
                    <div hellComboboxEmpty>No owners match</div>
                  }
                }
              </div>
            </div>
          </div>
        </ng-template>
      </hell-filter-builder>

      <p class="m-0 text-xs text-hell-foreground-muted">
        The example owns query, debounce, source, loading, error, and empty policy. Filter Builder
        receives only the committed expression.
      </p>
    </div>
  `,
})
export class FilterBuilderAsyncEntityExample {
  protected readonly ownerField: HellFilterFieldDescriptor<OwnerFilter> = {
    field: 'owner',
    label: 'Owner',
    display: (filter) => `Owner is ${filter.value.name}`,
    validate: (filter) => Boolean(filter.value.id && filter.value.name),
  };
  protected readonly fields = [this.ownerField] as const;
  protected readonly filters = signal<readonly OwnerFilter[]>([]);
  protected readonly ownerQuery = signal('');
  protected readonly ownerSearch = hellSearchResource<Owner>({
    query: this.ownerQuery,
    source: async ({ query, signal: abortSignal }) => {
      await waitForDirectory(abortSignal);
      if (abortSignal.aborted) return [];
      if (query.trim().toLocaleLowerCase() === 'fail') {
        throw new Error('owner directory unavailable');
      }
      const normalized = query.trim().toLocaleLowerCase();
      return normalized
        ? OWNERS.filter((owner) =>
            `${owner.name} ${owner.team}`.toLocaleLowerCase().includes(normalized),
          )
        : OWNERS;
    },
    fields: [
      { weight: 3, get: (owner) => owner.name },
      { weight: 1, get: (owner) => owner.team },
    ],
    debounce: 120,
  });
  protected readonly ownerOptions = computed(() => [...this.ownerSearch.items()]);
  protected readonly identifyFilter = (filter: OwnerFilter) => filter.id;
  protected readonly compareOwner = (left: Owner | null, right: Owner | null): boolean =>
    left?.id === right?.id;
  private nextIdentity = 0;

  protected selectOwner(
    editor: HellFilterBuilderEditorContext<OwnerFilter>,
    owner: Owner | null,
  ): void {
    if (!owner) return;
    this.nextIdentity += 1;
    const committed = editor.commit({
      id: editor.filter?.id ?? `owner-filter-${this.nextIdentity}`,
      field: 'owner',
      operator: 'is',
      value: owner,
    });
    if (committed) this.ownerSearch.clear();
  }
}

function waitForDirectory(abortSignal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 500);
    abortSignal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}
