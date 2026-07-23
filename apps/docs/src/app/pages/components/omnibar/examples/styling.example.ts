import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBolt,
  faSolidLayerGroup,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import {
  hellSearchResource,
  type HellSearchField,
  type HellSearchResourceSource,
} from 'hell-ui/core';
import { HellChip, HellChipRemove } from 'hell-ui/chip';
import { HellIcon } from 'hell-ui/icon';
import { HELL_OMNIBAR_IMPORTS } from 'hell-ui/omnibar';

interface Runbook {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
}

const RUNBOOKS: readonly Runbook[] = [
  { id: 'incident', title: 'Incident response', owner: 'SRE' },
  { id: 'oncall', title: 'On-call rotation', owner: 'Platform' },
  { id: 'rollback', title: 'Deploy rollback', owner: 'Release' },
];

@Component({
  selector: 'app-omnibar-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChip, HellChipRemove, HellIcon, ...HELL_OMNIBAR_IMPORTS],
  providers: [provideIcons({ faSolidBolt, faSolidLayerGroup, faSolidXmark })],
  template: `
    <!-- One [ui] map per module refines that module's rendered parts. The
         omnibar root map covers every part it owns; child directives (group,
         item, action, …) carry their own single-part ui. Public Chip
         primitives own the projected token and remove affordance. -->
    <hell-omnibar
      class="max-w-90"
      placeholder="Search runbooks"
      ariaLabel="Search runbooks"
      [(query)]="query"
      [ui]="{
        control: 'border-hell-primary bg-hell-surface',
        inputWrap: 'gap-hell-2',
        input: 'font-mono text-hell-foreground',
        clear: 'bg-hell-surface-muted text-hell-primary',
        panel: 'border-hell-primary rounded-hell-lg',
        actions: 'bg-hell-primary-soft',
        results: 'gap-hell-2 p-hell-3',
      }"
    >
      @if (scope(); as label) {
        <span
          hellOmnibarLeading
          hellChip
          [label]="label"
          [ui]="'border-hell-primary bg-hell-primary-soft text-hell-primary'"
          (remove)="scope.set(null)"
        >
          {{ label }}
          <button
            hellChipRemove
            type="button"
            [ui]="'text-hell-primary hover:bg-hell-primary-soft'"
          >
            <hell-icon name="faSolidXmark" size="10px" />
          </button>
        </span>
      }
      <hell-icon hellOmnibarTrailing name="faSolidBolt" size="12px" class="text-hell-primary" />

      <div hellOmnibarActions aria-label="Runbook filters" [ui]="'gap-hell-2'">
        <button hellOmnibarAction type="button" [pressed]="true" [ui]="'rounded-hell-sm font-semibold'">
          Owned by me
        </button>
      </div>

      <div class="flex flex-col gap-hell-2">
        @if (search.status() === 'loading') {
          <div role="status" class="p-hell-3 text-sm text-hell-foreground-muted">
            Loading runbooks…
          </div>
        } @else if (search.status() === 'error') {
          <div role="alert" class="p-hell-3 text-sm text-hell-danger">
            Runbooks could not be loaded.
          </div>
        } @else if (search.items().length === 0) {
          <div class="p-hell-3 text-center text-xs text-hell-primary">No runbooks found</div>
        } @else {
          <div hellOmnibarGroup label="Runbooks" [ui]="'gap-hell-1'">
            <div hellOmnibarGroupLabel [ui]="'text-hell-primary'">Runbooks</div>
            @for (runbook of search.items(); track runbook.id) {
              <button hellOmnibarItem type="button" [value]="runbook" [ui]="'rounded-hell-md'">
                <hell-icon
                  class="inline-flex w-4 shrink-0 items-center justify-center text-hell-primary"
                  name="faSolidLayerGroup"
                  size="13px"
                />
                <span class="flex min-w-0 flex-1 flex-col overflow-hidden font-medium *:truncate">
                  {{ runbook.title }}
                  <span class="text-[11px] text-hell-foreground-subtle">
                    {{ runbook.owner }}
                  </span>
                </span>
                <span class="ms-auto inline-flex items-center text-[11px] text-hell-primary">open</span>
              </button>
            }
          </div>
        }
      </div>
    </hell-omnibar>
  `,
})
export class OmnibarStylingExample {
  protected readonly query = signal('');
  protected readonly scope = signal<string | null>('Prod');

  protected readonly searchFields: readonly HellSearchField<Runbook>[] = [
    { name: 'title', weight: 5, get: (runbook) => runbook.title },
    { name: 'owner', weight: 2, get: (runbook) => runbook.owner },
  ];

  // Short delay keeps the consumer-projected loading chrome visible on a keystroke.
  protected readonly searchRunbooks: HellSearchResourceSource<Runbook> = ({ signal }) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (signal.aborted) return;
        resolve(RUNBOOKS);
      }, 350);
      signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('Search aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  protected readonly search = hellSearchResource({
    query: this.query,
    source: this.searchRunbooks,
    fields: this.searchFields,
    debounce: 120,
  });
}
