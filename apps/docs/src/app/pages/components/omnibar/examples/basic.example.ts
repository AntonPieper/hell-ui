import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type HellSearchField, type HellSearchResult } from '@hell-ui/angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

interface QuickAction {
  readonly id: string;
  readonly label: string;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { id: 'new-invoice', label: 'Create invoice' },
  { id: 'export', label: 'Export report' },
  { id: 'archive', label: 'Archive project' },
  { id: 'settings', label: 'Open settings' },
];

@Component({
  selector: 'app-omnibar-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Search actions"
      ariaLabel="Search actions"
      [searchItems]="actions"
      [searchFields]="searchFields"
      [(value)]="query"
      (searchResultsChange)="results.set($any($event))"
      (submit)="lastAction.set($any($event.item).id)"
    >
      <div hellOmnibarGroup label="Actions">
        <div hellOmnibarGroupLabel>Actions</div>
        @for (result of results(); track result.item.id) {
          <button hellOmnibarItem type="button" [value]="result.item">
            <span hellOmnibarItemText>{{ result.item.label }}</span>
          </button>
        }
      </div>
    </hell-omnibar>

    @if (lastAction(); as action) {
      <p class="mt-3 text-sm hd-muted">Submitted: {{ action }}</p>
    }
  `,
})
export class OmnibarBasicExample {
  protected readonly query = signal('');
  protected readonly lastAction = signal<string | null>(null);
  protected readonly results = signal<readonly HellSearchResult<QuickAction>[]>([]);

  protected readonly actions = QUICK_ACTIONS;
  protected readonly searchFields: readonly HellSearchField<QuickAction>[] = [
    { name: 'label', weight: 5, get: (action) => action.label },
    { name: 'id', weight: 2, get: (action) => action.id },
  ];
}
