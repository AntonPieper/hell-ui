import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_IMPORTS } from '@hell-ui/angular/listbox';

@Component({
  selector: 'app-listbox-sections-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_IMPORTS],
  template: `
    <div
      hellListbox
      class="max-w-72"
      aria-label="Jump to region"
      [value]="selected()"
      (valueChange)="selected.set($any($event))"
    >
      <div hellListboxSection>
        <div hellListboxHeader>Americas</div>
        <div hellListboxOption value="us-east">US East</div>
        <div hellListboxOption value="us-west">US West</div>
        <div hellListboxOption value="sao-paulo">Sao Paulo</div>
      </div>
      <div hellListboxSection>
        <div hellListboxHeader>Europe</div>
        <div hellListboxOption value="frankfurt">Frankfurt</div>
        <div hellListboxOption value="dublin" disabled>Dublin (maintenance)</div>
      </div>
    </div>
  `,
})
export class ListboxSectionsExample {
  protected readonly selected = signal<string[]>(['us-east']);
}
