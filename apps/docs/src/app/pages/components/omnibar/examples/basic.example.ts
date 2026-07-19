import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { hellSearchResource, type HellSearchField } from '@hell-ui/angular/core';
import { HELL_OMNIBAR_IMPORTS } from '@hell-ui/angular/omnibar';

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
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Search actions"
      ariaLabel="Search actions"
      [(query)]="query"
      (submit)="lastAction.set($any($event.item).label)"
    >
      @if (search.status() === 'success' && search.items().length === 0) {
        <div class="px-hell-3 py-hell-4 text-center text-xs text-hell-foreground-muted">
          No actions found
        </div>
      } @else {
        <div hellOmnibarGroup label="Actions">
          <div hellOmnibarGroupLabel>Actions</div>
          @for (action of search.items(); track action.id) {
            <button hellOmnibarItem type="button" [value]="action">
              <span class="flex min-w-0 flex-1 flex-col overflow-hidden">{{ action.label }}</span>
            </button>
          }
        </div>
      }
    </hell-omnibar>

    @if (lastAction(); as action) {
      <p class="mt-3 text-sm text-hell-foreground-muted">Ran: {{ action }}</p>
    }
  `,
})
export class OmnibarBasicExample {
  protected readonly query = signal('');
  protected readonly lastAction = signal<string | null>(null);
  protected readonly searchFields: readonly HellSearchField<QuickAction>[] = [
    { name: 'label', weight: 5, get: (action) => action.label },
    { name: 'id', weight: 2, get: (action) => action.id },
  ];
  protected readonly search = hellSearchResource({
    query: this.query,
    items: QUICK_ACTIONS,
    fields: this.searchFields,
  });
}
