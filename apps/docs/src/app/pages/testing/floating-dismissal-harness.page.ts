import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { hellSearchResource, type HellSearchField } from '@hell-ui/angular/core';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

interface HarnessSearchItem {
  readonly id: string;
  readonly label: string;
}

type HarnessLayer = 'primary' | 'parent' | 'child' | 'omnibar';

const INITIAL_CLOSE_COUNTS: Record<HarnessLayer, number> = {
  primary: 0,
  parent: 0,
  child: 0,
  omnibar: 0,
};

@Component({
  selector: 'hd-floating-dismissal-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPopover, HellPopoverTrigger, ...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <section
      class="harness"
      aria-label="Floating dismissal harness"
      data-testid="floating-dismissal-harness"
    >
      <h1>Floating dismissal harness</h1>

      <section aria-label="Primary non-modal popover dismissal harness" data-testid="primary-region">
        <button
          data-testid="primary-trigger"
          [hellPopoverTrigger]="primaryPanel"
          [trapFocus]="false"
          type="button"
          [disabled]="primaryTriggerDisabled()"
          (openChange)="recordOpenChange('primary', $event)"
        >
          Primary popover
        </button>

        <ng-template #primaryPanel>
          <div hellPopover aria-label="Primary floating panel" data-testid="primary-panel">
            <p>Primary floating panel</p>
            <button data-testid="inside-action" type="button">Inside action</button>
            <button
              data-testid="disable-primary-trigger"
              type="button"
              (click)="primaryTriggerDisabled.set(true)"
            >
              Disable trigger while open
            </button>
          </div>
        </ng-template>
      </section>

      <section aria-label="Nested popover dismissal harness" data-testid="nested-region">
        <button
          data-testid="parent-trigger"
          [hellPopoverTrigger]="parentPanel"
          [trapFocus]="false"
          type="button"
          (openChange)="recordOpenChange('parent', $event)"
        >
          Parent popover
        </button>

        <ng-template #parentPanel>
          <div hellPopover aria-label="Parent floating panel" data-testid="parent-panel">
            <p>Parent floating panel</p>
            <button data-testid="parent-inside-action" type="button">Parent inside action</button>
            <button
              data-testid="child-trigger"
              [hellPopoverTrigger]="childPanel"
              [trapFocus]="false"
              type="button"
              (openChange)="recordOpenChange('child', $event)"
            >
              Child popover
            </button>

            <ng-template #childPanel>
              <div hellPopover aria-label="Child floating panel" data-testid="child-panel">
                <p>Child floating panel</p>
                <button data-testid="child-inside-action" type="button">Child inside action</button>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </section>

      <section aria-label="Portaled floating scope harness" data-testid="portaled-region">
        <hell-omnibar
          data-testid="scoped-omnibar"
          placeholder="Scoped command search"
          ariaLabel="Scoped command search"
          [query]="omnibarQuery()"
          (queryChange)="omnibarQuery.set($event)"
          [open]="omnibarOpen()"
          (openChange)="omnibarOpen.set($event); recordOpenChange('omnibar', $event)"
        >
          <div hellOmnibarActions>
            <button data-testid="omnibar-panel-action" hellOmnibarAction type="button">
              Panel action
            </button>
          </div>

          <div hellOmnibarGroup label="Harness results">
            <div hellOmnibarGroupLabel>Harness results</div>
            @for (item of omnibarSearch.items(); track item.id) {
              <button hellOmnibarItem type="button" [value]="item" [closeOnSelect]="false">
                <span hellOmnibarItemText>{{ item.label }}</span>
              </button>
            }
          </div>
        </hell-omnibar>
      </section>

      <div data-testid="outside-pointer-target">Outside pointer target</div>
      <button data-testid="outside-focus-target" type="button">Outside focus target</button>
      <div data-testid="nested-outside-target">Nested outside target</div>

      <dl data-testid="close-counts">
        <dt>Primary closes</dt>
        <dd data-testid="primary-close-count">{{ closeCount('primary') }}</dd>
        <dt>Parent closes</dt>
        <dd data-testid="parent-close-count">{{ closeCount('parent') }}</dd>
        <dt>Child closes</dt>
        <dd data-testid="child-close-count">{{ closeCount('child') }}</dd>
        <dt>Omnibar closes</dt>
        <dd data-testid="omnibar-close-count">{{ closeCount('omnibar') }}</dd>
      </dl>

      <pre data-testid="harness-log">{{ log().join('\n') }}</pre>
    </section>
  `,
  styles: `
    .harness {
      display: grid;
      gap: 1rem;
      padding: 2rem;
    }

    [data-testid='outside-pointer-target'],
    [data-testid='nested-outside-target'] {
      width: max-content;
      padding: 0.75rem;
      border: 1px dashed CanvasText;
    }

    [data-testid='outside-pointer-target'] {
      margin-block-start: 8rem;
    }
  `,
})
export class FloatingDismissalHarnessPage {
  protected readonly primaryTriggerDisabled = signal(false);
  protected readonly closeCounts = signal<Record<HarnessLayer, number>>({ ...INITIAL_CLOSE_COUNTS });
  protected readonly log = signal<string[]>([]);
  protected readonly omnibarQuery = signal('');
  protected readonly omnibarOpen = signal(false);

  protected readonly commands: readonly HarnessSearchItem[] = [
    { id: 'alpha', label: 'Alpha command' },
    { id: 'bravo', label: 'Bravo command' },
    { id: 'charlie', label: 'Charlie command' },
  ];

  protected readonly searchFields: readonly HellSearchField<HarnessSearchItem>[] = [
    { name: 'label', weight: 1, get: (item) => item.label },
  ];
  protected readonly omnibarSearch = hellSearchResource({
    query: this.omnibarQuery,
    items: this.commands,
    fields: this.searchFields,
    limit: 3,
  });

  protected closeCount(layer: HarnessLayer): number {
    return this.closeCounts()[layer];
  }

  protected recordOpenChange(layer: HarnessLayer, open: boolean): void {
    if (!open) {
      this.closeCounts.update((counts) => ({ ...counts, [layer]: counts[layer] + 1 }));
    }

    this.record(`harness:${layer}:${open ? 'open' : 'closed'}`);
  }

  private record(entry: string): void {
    this.log.update((entries) => [...entries, entry]);
    (globalThis as { __hellFloatingHarnessLog?: string[] }).__hellFloatingHarnessLog?.push(entry);
  }
}
