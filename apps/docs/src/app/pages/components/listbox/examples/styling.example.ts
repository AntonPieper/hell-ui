import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_DIRECTIVES } from '@hell-ui/angular/listbox';

@Component({
  selector: 'app-listbox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <!-- Listbox and options each expose a root Public Part. -->
    <div
      hellListbox
      aria-label="Environment"
      class="max-w-72"
      ui="border-hell-primary"
      [value]="env()"
      (valueChange)="env.set($any($event))"
    >
      <div hellListboxOption value="dev" ui="data-active:bg-hell-primary-soft">Development</div>
      <div hellListboxOption value="stage" ui="data-active:bg-hell-primary-soft">Staging</div>
      <div
        hellListboxOption
        value="prod"
        [ui]="{ root: 'font-semibold text-hell-danger data-active:bg-hell-danger/10' }"
      >
        Production
      </div>
    </div>
  `,
})
export class ListboxStylingExample {
  protected readonly env = signal<string[]>(['dev']);
}
