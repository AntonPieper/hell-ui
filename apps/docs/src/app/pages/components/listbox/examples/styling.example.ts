import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_DIRECTIVES } from '@hell-ui/angular/listbox';

@Component({
  selector: 'app-listbox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <!-- hellListbox, hellListboxSection, hellListboxHeader, and hellListboxOption each
         expose a single root Public Part. -->
    <div
      hellListbox
      class="max-w-72"
      aria-label="Environment"
      ui="rounded-hell-lg border-hell-primary bg-hell-surface-subtle"
      [value]="env()"
      (valueChange)="env.set($any($event))"
    >
      <div hellListboxSection [ui]="{ root: 'gap-hell-1' }">
        <div hellListboxHeader ui="rounded-hell-sm bg-hell-primary-soft text-hell-primary-soft-foreground">
          Non-production
        </div>
        <div hellListboxOption value="dev" ui="rounded-hell-md data-active:bg-hell-primary-soft">
          Development
        </div>
        <div hellListboxOption value="stage" ui="rounded-hell-md data-active:bg-hell-primary-soft">
          Staging
        </div>
      </div>
      <div hellListboxSection>
        <div hellListboxHeader ui="rounded-hell-sm bg-hell-danger-soft text-hell-danger">
          Production
        </div>
        <div
          hellListboxOption
          value="prod"
          [ui]="{ root: 'rounded-hell-md font-semibold text-hell-danger data-active:bg-hell-danger/10' }"
        >
          Production
        </div>
      </div>
    </div>
  `,
})
export class ListboxStylingExample {
  protected readonly env = signal<string[]>(['dev']);
}
