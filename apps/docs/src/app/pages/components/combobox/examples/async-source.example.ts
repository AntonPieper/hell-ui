import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { hellRankLocalSearch, type HellOption, type HellSearchSource } from '@hell-ui/angular/core';
import { HellCombobox } from '@hell-ui/angular/combobox';

/** Stand-in for a backend directory; only the source function sees it. */
const CUSTOMERS: readonly HellOption<string>[] = [
  { value: 'cus-1041', label: 'Aldona Logistics GmbH' },
  { value: 'cus-1042', label: 'Bernward & Söhne KG' },
  { value: 'cus-1043', label: 'Cetus Marine Services' },
  { value: 'cus-1044', label: 'Dorstfeld Stahlhandel' },
  { value: 'cus-1045', label: 'Elbe Kontor AG' },
  { value: 'cus-1046', label: 'Falkenrath Spedition' },
];

@Component({
  selector: 'app-combobox-async-source-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCombobox],
  template: `
    <hell-combobox
      class="block max-w-80"
      aria-label="Customer account"
      placeholder="Search customers… (try “fail”)"
      [source]="customerSource"
      [displayWith]="displayWith"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    />
  `,
})
export class ComboboxAsyncSourceExample {
  protected readonly value = signal<string | null>(null);

  /** Picked values stay labelled even when their option left the results. */
  protected readonly displayWith = (value: string): string =>
    CUSTOMERS.find((customer) => customer.value === value)?.label ?? value;

  /**
   * A `HellSearchSource` receives the query, an `AbortSignal` for superseded
   * requests, and returns options (or a pre-ranked `HellSearchResponse`).
   * This one simulates 600ms of network latency and a backend outage when
   * the query is "fail".
   */
  protected readonly customerSource: HellSearchSource<HellOption<string>> = async (request) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (request.signal?.aborted) return [];
    if (request.query.trim().toLowerCase() === 'fail') {
      throw new Error('customer directory unavailable');
    }
    return hellRankLocalSearch(CUSTOMERS, { query: request.query }).map(({ item }) => item);
  };
}
