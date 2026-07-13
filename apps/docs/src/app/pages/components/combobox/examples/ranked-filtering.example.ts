import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  hellRankLocalSearch,
  provideHellSearchRanker,
  type HellOption,
  type HellSearchRanker,
} from '@hell-ui/angular/core';
import { HellCombobox } from '@hell-ui/angular/combobox';

const STATIONS: readonly HellOption<string>[] = [
  { value: 'nord-1', label: 'Nordhafen Terminal' },
  { value: 'hann-2', label: 'Hannover Süd' },
  { value: 'born-3', label: 'Bornheim Depot' },
  { value: 'neuk-4', label: 'Neukölln Ost' },
  { value: 'ober-5', label: 'Oberhausen Nord' },
];

/** Most recent first — in a real app this comes from dispatch history. */
const RECENTLY_DISPATCHED: readonly string[] = ['hann-2'];

/**
 * Recently dispatched stations outrank better text matches; everything else
 * keeps its relevance order from the default ranker. Type "no": the substring
 * hit "Hannover Süd" jumps above the word-prefix matches because the
 * dispatcher just used it.
 */
const recencyRanker: HellSearchRanker = (items, request) => {
  const recency = (item: unknown): number => {
    const index = RECENTLY_DISPATCHED.indexOf((item as HellOption<string>).value);
    return index === -1 ? -1 : RECENTLY_DISPATCHED.length - index;
  };
  return [...hellRankLocalSearch(items, request)].sort(
    (a, b) => recency(b.item) - recency(a.item) || b.score - a.score,
  );
};

@Component({
  selector: 'app-combobox-ranked-filtering-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideHellSearchRanker(recencyRanker)],
  imports: [HellCombobox],
  template: `
    <hell-combobox
      class="block max-w-72"
      aria-label="Dispatch station"
      placeholder="Type “no”…"
      emptyLabel="No matching station"
      [options]="stations"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    />
  `,
})
export class ComboboxRankedFilteringExample {
  protected readonly stations = STATIONS;
  protected readonly value = signal<string | null>(null);
}
