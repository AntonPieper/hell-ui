import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBolt,
  faSolidLayerGroup,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import {
  type HellSearchField,
  type HellSearchResult,
  type HellSearchSource,
} from '@hell-ui/angular/core';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

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
  imports: [HellIcon, ...HELL_OMNIBAR_DIRECTIVES],
  providers: [provideIcons({ faSolidBolt, faSolidLayerGroup, faSolidXmark })],
  template: `
    <!-- One [ui] map per module refines that module's rendered parts. The
         omnibar root map covers every part it owns; child directives (group,
         item, chip, action, …) carry their own single-part ui. -->
    <hell-omnibar
      class="max-w-90"
      placeholder="Search runbooks"
      ariaLabel="Search runbooks"
      [searchSource]="searchRunbooks"
      [searchFields]="searchFields"
      [searchDebounce]="120"
      [(value)]="query"
      (searchResultsChange)="results.set($any($event))"
      [ui]="{
        control: 'border-hell-primary bg-hell-surface',
        inputWrap: 'gap-hell-2',
        input: 'font-mono text-hell-foreground',
        clear: 'bg-hell-surface-muted text-hell-primary',
        panel: 'border-hell-primary rounded-hell-lg',
        actions: 'bg-hell-primary-soft',
        results: 'gap-hell-2 p-hell-3',
        loading: 'p-hell-3',
        skeletonRow: 'gap-hell-3',
        skeletonText: 'gap-hell-1',
        empty: 'text-hell-primary',
      }"
    >
      <span
        hellOmnibarChip
        hellOmnibarLeading
        [ui]="'border-hell-primary bg-hell-primary-soft text-hell-primary'"
      >
        Prod
        <button
          hellOmnibarChipRemove
          type="button"
          aria-label="Clear scope"
          [ui]="'text-hell-primary hover:bg-hell-primary-soft'"
        >
          <hell-icon name="faSolidXmark" size="10px" />
        </button>
      </span>
      <hell-icon hellOmnibarTrailing name="faSolidBolt" size="12px" class="text-hell-primary" />

      <div hellOmnibarActions aria-label="Runbook filters" [ui]="'gap-hell-2'">
        <button hellOmnibarAction type="button" [pressed]="true" [ui]="'rounded-hell-sm font-semibold'">
          Owned by me
        </button>
      </div>

      <div hellOmnibarPanel [ui]="'flex flex-col gap-hell-2'">
        <div hellOmnibarGroup label="Runbooks" [ui]="'gap-hell-1'">
          <div hellOmnibarGroupLabel [ui]="'text-hell-primary'">Runbooks</div>
          @for (result of results(); track result.item.id) {
            <button hellOmnibarItem type="button" [value]="result.item" [ui]="'rounded-hell-md'">
              <hell-icon
                hellOmnibarItemIcon
                name="faSolidLayerGroup"
                size="13px"
                [ui]="'text-hell-primary'"
              />
              <span hellOmnibarItemText [ui]="'font-medium'">
                {{ result.item.title }}
                <span hellOmnibarItemSubtext [ui]="'text-hell-foreground-subtle'">
                  {{ result.item.owner }}
                </span>
              </span>
              <span hellOmnibarItemTrailing [ui]="'text-hell-primary'">open</span>
            </button>
          }
        </div>
      </div>
    </hell-omnibar>
  `,
})
export class OmnibarStylingExample {
  protected readonly query = signal('');
  protected readonly results = signal<readonly HellSearchResult<Runbook>[]>([]);

  protected readonly searchFields: readonly HellSearchField<Runbook>[] = [
    { name: 'title', weight: 5, get: (runbook) => runbook.title },
    { name: 'owner', weight: 2, get: (runbook) => runbook.owner },
  ];

  // Short delay so the refined loading skeleton parts are visible on the first keystroke.
  protected readonly searchRunbooks: HellSearchSource<Runbook> = ({ signal }) =>
    new Promise((resolve) => {
      const timer = window.setTimeout(() => resolve(RUNBOOKS), 350);
      signal?.addEventListener('abort', () => window.clearTimeout(timer), { once: true });
    });
}
