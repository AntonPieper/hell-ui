import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HellCombobox, type HellComboboxUi } from '@hell-ui/angular/combobox';


const PRIORITIES: readonly HellOption<string>[] = (
  ['Blocker', 'Critical', 'High', 'Medium', 'Low'] as const
).map((label) => ({ value: label.toLowerCase(), label }));

@Component({
  selector: 'app-combobox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCombobox],
  template: `
    <!-- HellComboboxPart: root | control | input | button | dropdown | option | empty. -->
    <hell-combobox
      class="block max-w-72"
      aria-label="Priority"
      placeholder="Set priority…"
      emptyLabel="No priority matches"
      [options]="priorities"
      [value]="value()"
      [ui]="ui"
      (valueChange)="value.set($any($event))"
    />
  `,
})
export class ComboboxStylingExample {
  protected readonly priorities = PRIORITIES;
  protected readonly value = signal<string | null>(null);

  protected readonly ui: HellComboboxUi = {
    root: 'font-medium',
    control:
      'h-hell-control-lg rounded-hell-xl border-hell-primary bg-hell-primary-soft data-focus:shadow-[0_0_0_3px_var(--color-hell-primary-soft)]',
    input: 'text-hell-primary-soft-foreground placeholder:text-hell-primary/70',
    button: 'w-hell-control-lg text-hell-primary data-hover:text-hell-primary-hover',
    dropdown: 'gap-hell-1 rounded-hell-xl border-hell-primary bg-hell-surface p-hell-2 shadow-hell-lg',
    option:
      'rounded-hell-lg data-active:bg-hell-primary-soft data-selected:bg-hell-primary data-selected:text-hell-foreground-inverse',
    empty: 'text-hell-danger',
  };
}
