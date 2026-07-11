import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { type HellSearchSource } from '@hell-ui/angular/core';
import {
  HellFilterBar,
  type HellFilterEntityOption,
  type HellFilterField,
  type HellFilterToken,
} from '@hell-ui/angular/filter-bar';

interface WorkOrder {
  readonly id: string;
  readonly summary: string;
  readonly ownerId: string;
  readonly owner: string;
  readonly created: string;
}

const OWNERS: readonly HellFilterEntityOption[] = [
  { id: 'mara', label: 'Mara Voss' },
  { id: 'jon', label: 'Jon Bell' },
  { id: 'sana', label: 'Sana Iqbal' },
  { id: 'theo', label: 'Theo Martin' },
];

const WORK_ORDERS: readonly WorkOrder[] = [
  { id: 'WO-1842', summary: 'Reconcile Berlin inventory', ownerId: 'mara', owner: 'Mara Voss', created: '2026-01-18' },
  { id: 'WO-1910', summary: 'Renew compiler build agents', ownerId: 'jon', owner: 'Jon Bell', created: '2026-02-04' },
  { id: 'WO-2057', summary: 'Audit support escalation queue', ownerId: 'sana', owner: 'Sana Iqbal', created: '2026-03-21' },
  { id: 'WO-2148', summary: 'Prepare spring access review', ownerId: 'mara', owner: 'Mara Voss', created: '2026-04-09' },
  { id: 'WO-2261', summary: 'Migrate finance exports', ownerId: 'theo', owner: 'Theo Martin', created: '2026-05-16' },
  { id: 'WO-2329', summary: 'Validate quarter-end retention', ownerId: 'mara', owner: 'Mara Voss', created: '2026-06-28' },
];

@Component({
  selector: 'app-filter-bar-server-dispatch-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilterBar],
  template: `
    <section aria-labelledby="server-dispatch-heading" class="space-y-hell-4">
      <div>
        <h3 id="server-dispatch-heading" class="m-0 text-sm font-semibold text-hell-foreground">
          Work-order request
        </h3>
        <p class="mt-hell-1 text-xs text-hell-foreground-muted">
          Entity lookup and result dispatch are delayed to behave like separate backend calls.
        </p>
      </div>

      <hell-filter-bar
        aria-label="Work order filters"
        [fields]="fields"
        [value]="filters()"
        (valueChange)="dispatch($event)"
        (searchError)="handleSearchError($event)"
      />

      @if (searchError(); as message) {
        <p class="m-0 text-sm text-hell-danger">{{ message }}</p>
      }

      <p class="m-0 text-xs text-hell-foreground-muted" role="status" aria-live="polite">
        {{ dispatchStatus() }}
      </p>

      <div class="grid gap-hell-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="server-request-heading" class="min-w-0">
          <h4 id="server-request-heading" class="mb-hell-2 mt-0 text-xs font-semibold uppercase tracking-wide text-hell-foreground-muted">
            POST /api/work-orders/search
          </h4>
          <pre
            data-testid="filter-server-request"
            class="m-0 max-h-64 overflow-auto rounded-hell-md border border-hell-border bg-hell-surface-muted p-hell-3 text-xs text-hell-foreground"
          ><code>{{ requestBody() }}</code></pre>
        </section>

        <section aria-labelledby="server-response-heading" class="min-w-0 overflow-x-auto">
          <h4 id="server-response-heading" class="mb-hell-2 mt-0 text-xs font-semibold uppercase tracking-wide text-hell-foreground-muted">
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
                    <span class="block font-normal text-hell-foreground-muted">{{ order.summary }}</span>
                  </th>
                  <td class="px-hell-2 py-hell-2">{{ order.owner }}</td>
                  <td class="whitespace-nowrap px-hell-2 py-hell-2">{{ order.created }}</td>
                </tr>
              } @empty {
                <tr>
                  <td class="px-hell-2 py-hell-4 text-center text-hell-foreground-muted" colspan="3">
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
export class FilterBarServerDispatchExample {
  private readonly destroyRef = inject(DestroyRef);
  private dispatchTimer: ReturnType<typeof setTimeout> | null = null;
  private requestVersion = 0;

  protected readonly filters = signal<readonly HellFilterToken[]>([]);
  protected readonly rows = signal<readonly WorkOrder[]>(WORK_ORDERS);
  protected readonly dispatchStatus = signal(`${WORK_ORDERS.length} work orders returned.`);
  protected readonly searchError = signal<string | null>(null);
  protected readonly requestBody = computed(() => JSON.stringify({ filters: this.filters() }, null, 2));

  protected readonly searchOwners: HellSearchSource<HellFilterEntityOption> = ({ query, signal }) => {
    this.searchError.set(null);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (signal?.aborted) return;
        if (query.trim().toLocaleLowerCase() === 'error') {
          reject(new Error('Owner directory unavailable'));
          return;
        }

        const normalized = query.trim().toLocaleLowerCase();
        resolve(
          normalized
            ? OWNERS.filter((owner) => owner.label.toLocaleLowerCase().includes(normalized))
            : OWNERS,
        );
      }, 320);

      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Owner lookup superseded', 'AbortError'));
        },
        { once: true },
      );
    });
  };

  protected readonly fields: readonly HellFilterField[] = [
    {
      key: 'owner',
      label: 'Owner',
      kind: 'entity',
      search: this.searchOwners,
      debounceMs: 120,
      limit: 5,
    },
    {
      key: 'created',
      label: 'Created',
      kind: 'dateRange',
      min: '2026-01-01',
      max: '2026-12-31',
    },
  ];

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.dispatchTimer !== null) clearTimeout(this.dispatchTimer);
    });
  }

  protected dispatch(filters: readonly HellFilterToken[]): void {
    this.filters.set(filters);
    this.searchError.set(null);
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

  protected handleSearchError(_event: unknown): void {
    this.searchError.set('Owner lookup failed. Try again.');
  }
}

function filterWorkOrders(filters: readonly HellFilterToken[]): readonly WorkOrder[] {
  return WORK_ORDERS.filter((order) => filters.every((token) => {
    if (token.key === 'owner' && typeof token.value !== 'string' && token.value.kind === 'entity') {
      return order.ownerId === token.value.id;
    }
    if (
      token.key === 'created' &&
      typeof token.value !== 'string' &&
      token.value.kind === 'dateRange'
    ) {
      const afterStart = !token.value.from || order.created >= token.value.from;
      const beforeEnd = !token.value.to || order.created <= token.value.to;
      return afterStart && beforeEnd;
    }
    return true;
  }));
}
