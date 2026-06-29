import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type HellSearchField } from '@hell-ui/angular/core';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
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
  imports: [HellFlyout, HellFlyoutTrigger, ...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <section
      class="harness"
      aria-label="Floating dismissal harness"
      data-testid="floating-dismissal-harness"
    >
      <h1>Floating dismissal harness</h1>

      <section aria-label="Primary flyout dismissal harness" data-testid="primary-region">
        <button
          data-testid="primary-trigger"
          hellFlyoutTrigger
          #primary="hellFlyoutTrigger"
          type="button"
          [disabled]="primaryTriggerDisabled()"
          (openChange)="recordOpenChange('primary', $event)"
        >
          Primary flyout
        </button>

        @if (primary.open()) {
          <div [hellFlyout]="primary" aria-label="Primary floating panel" data-testid="primary-panel">
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
        }
      </section>

      <section aria-label="Nested flyout dismissal harness" data-testid="nested-region">
        <button
          data-testid="parent-trigger"
          hellFlyoutTrigger
          #parent="hellFlyoutTrigger"
          type="button"
          (openChange)="recordOpenChange('parent', $event)"
        >
          Parent flyout
        </button>

        @if (parent.open()) {
          <div [hellFlyout]="parent" aria-label="Parent floating panel" data-testid="parent-panel">
            <p>Parent floating panel</p>
            <button data-testid="parent-inside-action" type="button">Parent inside action</button>
            <button
              data-testid="child-trigger"
              hellFlyoutTrigger
              #child="hellFlyoutTrigger"
              type="button"
              (openChange)="recordOpenChange('child', $event)"
            >
              Child flyout
            </button>

            @if (child.open()) {
              <div [hellFlyout]="child" aria-label="Child floating panel" data-testid="child-panel">
                <p>Child floating panel</p>
                <button data-testid="child-inside-action" type="button">Child inside action</button>
              </div>
            }
          </div>
        }
      </section>

      <section aria-label="Portaled floating scope harness" data-testid="portaled-region">
        <hell-omnibar
          #scopedOmnibar="hellOmnibar"
          data-testid="scoped-omnibar"
          placeholder="Scoped command search"
          ariaLabel="Scoped command search"
          [searchItems]="searchItems"
          [searchFields]="searchFields"
          [searchDebounce]="0"
          [searchLimit]="3"
          (openChange)="recordOpenChange('omnibar', $event)"
        >
          <div hellOmnibarActions>
            <button data-testid="omnibar-panel-action" hellOmnibarAction type="button">
              Panel action
            </button>
          </div>

          <div hellOmnibarGroup label="Harness results">
            <div hellOmnibarGroupLabel>Harness results</div>
            @for (result of scopedOmnibar.searchResults(); track result.item.id) {
              <button hellOmnibarItem type="button" [value]="result.item" [closeOnSelect]="false">
                <span hellOmnibarItemText>{{ result.item.label }}</span>
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

    [data-hell-flyout] {
      display: grid;
      gap: 0.5rem;
      width: max-content;
      max-width: 20rem;
      margin-block-start: 0.5rem;
      padding: 1rem;
      border: 1px solid CanvasText;
      background: Canvas;
      box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 20%);
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

  protected readonly searchItems: readonly HarnessSearchItem[] = [
    { id: 'alpha', label: 'Alpha command' },
    { id: 'bravo', label: 'Bravo command' },
    { id: 'charlie', label: 'Charlie command' },
  ];

  protected readonly searchFields: readonly HellSearchField<HarnessSearchItem>[] = [
    { name: 'label', weight: 1, get: (item) => item.label },
  ];

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
