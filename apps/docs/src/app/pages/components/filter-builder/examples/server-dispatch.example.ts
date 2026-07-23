import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { hellSearchResource } from 'hell-ui/core';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterFieldDescriptor,
} from 'hell-ui/features/filter-builder';

import {
  FilterBuilderDateRangeEditor,
  type CreatedFilter,
} from './date-range-editor';

interface Owner {
  readonly id: string;
  readonly name: string;
}

interface OwnerFilter extends HellFilter<'owner', 'is', Owner> {
  readonly id: string;
}

type WorkOrderFilter = OwnerFilter | CreatedFilter;

interface WorkOrder {
  readonly id: string;
  readonly summary: string;
  readonly ownerId: string;
  readonly owner: string;
  readonly created: string;
}

const OWNERS: readonly Owner[] = [
  { id: 'mara', name: 'Mara Voss' },
  { id: 'jon', name: 'Jon Bell' },
  { id: 'sana', name: 'Sana Iqbal' },
  { id: 'theo', name: 'Theo Martin' },
];

const WORK_ORDERS: readonly WorkOrder[] = [
  {
    id: 'WO-1842',
    summary: 'Reconcile Berlin inventory',
    ownerId: 'mara',
    owner: 'Mara Voss',
    created: '2026-01-18',
  },
  {
    id: 'WO-1910',
    summary: 'Renew compiler build agents',
    ownerId: 'jon',
    owner: 'Jon Bell',
    created: '2026-02-04',
  },
  {
    id: 'WO-2057',
    summary: 'Audit support escalation queue',
    ownerId: 'sana',
    owner: 'Sana Iqbal',
    created: '2026-03-21',
  },
  {
    id: 'WO-2148',
    summary: 'Prepare spring access review',
    ownerId: 'mara',
    owner: 'Mara Voss',
    created: '2026-04-09',
  },
  {
    id: 'WO-2261',
    summary: 'Migrate finance exports',
    ownerId: 'theo',
    owner: 'Theo Martin',
    created: '2026-05-16',
  },
  {
    id: 'WO-2329',
    summary: 'Validate quarter-end retention',
    ownerId: 'mara',
    owner: 'Mara Voss',
    created: '2026-06-28',
  },
];

@Component({
  selector: 'app-filter-builder-server-dispatch-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    ...HELL_COMBOBOX_IMPORTS,
    ...HELL_CONTROL_GROUP_IMPORTS,
    FilterBuilderDateRangeEditor,
  ],
  template: `
    <section aria-labelledby="server-dispatch-heading" class="space-y-hell-4">
      <div>
        <h3 id="server-dispatch-heading" class="m-0 text-sm font-semibold text-hell-foreground">
          Work-order request
        </h3>
        <p class="mt-hell-1 text-xs text-hell-foreground-muted">
          Owner lookup and result dispatch are separate application-owned requests.
        </p>
      </div>

      <hell-filter-builder
        aria-label="Work order filter builder"
        [fields]="fields"
        [value]="filters()"
        [identify]="identifyFilter"
        (valueChange)="dispatch($event)"
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
                placeholder="Search owners… (try “error”)"
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
                    <div hellComboboxOption [value]="owner">{{ owner.name }}</div>
                  } @empty {
                    <div hellComboboxEmpty>No owners match</div>
                  }
                }
              </div>
            </div>
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="createdField" let-editor>
          <app-filter-builder-date-range-editor [editor]="editor" />
        </ng-template>
      </hell-filter-builder>

      <p class="m-0 text-xs text-hell-foreground-muted" role="status" aria-live="polite">
        {{ dispatchStatus() }}
      </p>

      <div class="grid gap-hell-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="server-request-heading" class="min-w-0">
          <h4
            id="server-request-heading"
            class="mb-hell-2 mt-0 text-xs font-semibold uppercase tracking-wide text-hell-foreground-muted"
          >
            POST /api/work-orders/search
          </h4>
          <pre
            data-testid="filter-builder-server-request"
            class="m-0 max-h-64 overflow-auto rounded-hell-md border border-hell-border bg-hell-surface-muted p-hell-3 text-xs text-hell-foreground"
          ><code>{{ requestBody() }}</code></pre>
        </section>

        <section aria-labelledby="server-response-heading" class="min-w-0 overflow-x-auto">
          <h4
            id="server-response-heading"
            class="mb-hell-2 mt-0 text-xs font-semibold uppercase tracking-wide text-hell-foreground-muted"
          >
            Simulated response
          </h4>
          <table class="w-full border-collapse text-left text-xs">
            <caption class="sr-only">Work orders returned by the simulated server</caption>
            <thead>
              <tr class="border-b border-hell-border text-hell-foreground-muted">
                <th class="px-hell-2 py-hell-2 font-medium" scope="col">Order</th>
                <th class="px-hell-2 py-hell-2 font-medium" scope="col">Owner</th>
                <th class="px-hell-2 py-hell-2 font-medium" scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              @for (order of rows(); track order.id) {
                <tr class="border-b border-hell-border/60 text-hell-foreground">
                  <th class="px-hell-2 py-hell-2 font-medium" scope="row">
                    {{ order.id }}
                    <span class="block font-normal text-hell-foreground-muted">
                      {{ order.summary }}
                    </span>
                  </th>
                  <td class="px-hell-2 py-hell-2">{{ order.owner }}</td>
                  <td class="whitespace-nowrap px-hell-2 py-hell-2">{{ order.created }}</td>
                </tr>
              } @empty {
                <tr>
                  <td
                    class="px-hell-2 py-hell-4 text-center text-hell-foreground-muted"
                    colspan="3"
                  >
                    No work orders matched this request.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    </section>
  `,
})
export class FilterBuilderServerDispatchExample {
  private readonly destroyRef = inject(DestroyRef);
  private dispatchTimer: ReturnType<typeof setTimeout> | null = null;
  private requestVersion = 0;
  private nextIdentity = 0;

  protected readonly filters = signal<readonly WorkOrderFilter[]>([]);
  protected readonly rows = signal<readonly WorkOrder[]>(WORK_ORDERS);
  protected readonly dispatchStatus = signal(`${WORK_ORDERS.length} work orders returned.`);
  protected readonly requestBody = computed(() => JSON.stringify({ filters: this.filters() }, null, 2));
  protected readonly ownerQuery = signal('');
  protected readonly ownerSearch = hellSearchResource<Owner>({
    query: this.ownerQuery,
    source: async ({ query, signal: abortSignal }) => {
      await waitForOwnerDirectory(abortSignal);
      if (abortSignal.aborted) return [];
      if (query.trim().toLocaleLowerCase() === 'error') {
        throw new Error('Owner directory unavailable');
      }

      const normalized = query.trim().toLocaleLowerCase();
      return normalized
        ? OWNERS.filter((owner) => owner.name.toLocaleLowerCase().includes(normalized))
        : OWNERS;
    },
    fields: [{ get: (owner) => owner.name }],
    debounce: 120,
  });
  protected readonly ownerOptions = computed(() => [...this.ownerSearch.items()]);
  protected readonly compareOwner = (left: Owner | null, right: Owner | null): boolean =>
    left?.id === right?.id;

  protected readonly ownerField: HellFilterFieldDescriptor<OwnerFilter> = {
    field: 'owner',
    label: 'Owner',
    display: (filter) => `Owner is ${filter.value.name}`,
    validate: (filter) => Boolean(filter.value.id && filter.value.name),
  };
  protected readonly createdField: HellFilterFieldDescriptor<CreatedFilter> = {
    field: 'created',
    label: 'Created',
    display: (filter) =>
      `Created ${filter.value.from ?? 'any time'} – ${filter.value.to ?? 'any time'}`,
    validate: (filter) =>
      Boolean(filter.value.from || filter.value.to) &&
      (!filter.value.from || !filter.value.to || filter.value.from <= filter.value.to),
  };
  protected readonly fields = [this.ownerField, this.createdField] as const;
  protected readonly identifyFilter = (filter: WorkOrderFilter) => filter.id;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.dispatchTimer !== null) clearTimeout(this.dispatchTimer);
    });
  }

  protected selectOwner(
    editor: HellFilterBuilderEditorContext<OwnerFilter>,
    owner: Owner | null,
  ): void {
    if (!owner) return;
    const committed = editor.commit({
      id: editor.filter?.id ?? this.createIdentity('owner'),
      field: 'owner',
      operator: 'is',
      value: owner,
    });
    if (committed) this.ownerSearch.reset();
  }

  protected dispatch(filters: readonly WorkOrderFilter[]): void {
    this.filters.set(filters);
    this.dispatchStatus.set('Dispatching request…');
    const version = ++this.requestVersion;
    if (this.dispatchTimer !== null) clearTimeout(this.dispatchTimer);
    this.dispatchTimer = setTimeout(() => {
      this.dispatchTimer = null;
      if (version !== this.requestVersion) return;
      const rows = filterWorkOrders(filters);
      this.rows.set(rows);
      this.dispatchStatus.set(`${rows.length} work orders returned.`);
    }, 180);
  }

  private createIdentity(field: string): string {
    this.nextIdentity += 1;
    return `${field}-filter-${this.nextIdentity}`;
  }
}

function filterWorkOrders(filters: readonly WorkOrderFilter[]): readonly WorkOrder[] {
  return WORK_ORDERS.filter((order) =>
    filters.every((filter) => {
      if (filter.field === 'owner') return order.ownerId === filter.value.id;
      const afterStart = !filter.value.from || order.created >= filter.value.from;
      const beforeEnd = !filter.value.to || order.created <= filter.value.to;
      return afterStart && beforeEnd;
    }),
  );
}

function waitForOwnerDirectory(abortSignal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 320);
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
