import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';

const CURRENCIES = [
  'AUD — Australian Dollar',
  'CAD — Canadian Dollar',
  'CHF — Swiss Franc',
  'CNY — Chinese Yuan',
  'EUR — Euro',
  'GBP — Pound Sterling',
  'JPY — Japanese Yen',
  'NOK — Norwegian Krone',
  'SEK — Swedish Krona',
  'USD — US Dollar',
];

@Component({
  selector: 'app-combobox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      hellCombobox
      class="max-w-72"
      [value]="value()"
      (valueChange)="onValueChange($event)"
      (openChange)="onOpenChange($event)"
    >
      <input
        hellComboboxInput
        aria-label="Settlement currency"
        placeholder="Search currency…"
        [value]="filter()"
        (input)="filter.set($any($event.target).value ?? '')"
      />
      <button hellComboboxButton type="button" aria-label="Toggle currencies"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        @for (option of filtered(); track option) {
          <div hellComboboxOption [value]="option" [disabled]="option === disabledCurrency">
            {{ option }}
          </div>
        } @empty {
          <div hellComboboxEmpty>No currency matches</div>
        }
      </div>
    </div>
  `,
})
export class ComboboxBasicExample {
  protected readonly disabledCurrency = 'CAD — Canadian Dollar';
  protected readonly value = signal<string | null>(null);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    return q ? CURRENCIES.filter((c) => c.toLowerCase().includes(q)) : CURRENCIES;
  });

  protected onValueChange(next: string | null): void {
    this.value.set(next);
    this.filter.set(next ?? '');
  }

  protected onOpenChange(open: boolean): void {
    if (!open) this.filter.set(this.value() ?? '');
  }
}
