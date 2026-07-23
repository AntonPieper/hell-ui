import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import {
  hellRankLocalSearch,
  hellSearchResource,
  provideHellSearchRanker,
  type HellSearchRanker,
} from 'hell-ui/core';

interface Station {
  readonly id: string;
  readonly name: string;
}

const STATIONS: readonly Station[] = [
  { id: 'nord-1', name: 'Nordhafen Terminal' },
  { id: 'hann-2', name: 'Hannover Süd' },
  { id: 'born-3', name: 'Bornheim Depot' },
  { id: 'neuk-4', name: 'Neukölln Ost' },
  { id: 'ober-5', name: 'Oberhausen Nord' },
];

/** Most recent first — in a real app this comes from dispatch history. */
const RECENTLY_DISPATCHED: readonly string[] = ['hann-2'];

const recencyRanker: HellSearchRanker = (items, request) => {
  const recency = (item: unknown): number => {
    const index = RECENTLY_DISPATCHED.indexOf((item as Station).id);
    return index === -1 ? -1 : RECENTLY_DISPATCHED.length - index;
  };
  return [...hellRankLocalSearch(items, request)].sort(
    (left, right) => recency(right.item) - recency(left.item) || right.score - left.score,
  );
};

@Component({
  selector: 'app-combobox-ranked-filtering-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideHellSearchRanker(recencyRanker)],
  imports: [...HELL_COMBOBOX_IMPORTS, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div hellControlGroup class="max-w-72">
      <div
        hellCombobox
        ui="h-auto min-h-hell-control-md flex-1 rounded-none border-0 bg-transparent ps-hell-4 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
        [options]="stationOptions()"
        [value]="value()"
        [compareWith]="compareStation"
        (valueChange)="select($any($event))"
      >
        <input
          hellComboboxInput
          aria-label="Dispatch station"
          placeholder="Type “no”…"
          [value]="stationSearch.query()"
          (input)="stationSearch.query.set($any($event.target).value ?? '')"
        />
        <button hellComboboxButton type="button" aria-label="Toggle stations"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (station of stationOptions(); track station.id) {
            <div hellComboboxOption [value]="station">{{ station.name }}</div>
          } @empty {
            <div hellComboboxEmpty>No matching station</div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ComboboxRankedFilteringExample {
  protected readonly value = signal<Station | null>(null);
  protected readonly query = signal('');
  protected readonly stationSearch = hellSearchResource({
    query: this.query,
    items: STATIONS,
    fields: [{ get: (station) => station.name }],
  });
  protected readonly stationOptions = computed(() => [...this.stationSearch.items()]);
  protected readonly compareStation = (
    left: Station | null,
    right: Station | null,
  ): boolean => left?.id === right?.id;

  protected select(station: Station | null): void {
    this.value.set(station);
    this.query.set(station?.name ?? '');
  }
}
