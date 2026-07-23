import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { hellSearchResource, type HellSearchField } from 'hell-ui/core';
import { HELL_OMNIBAR_IMPORTS } from 'hell-ui/omnibar';
import { HellKbd } from 'hell-ui/chip';

interface Command {
  readonly id: string;
  readonly label: string;
}

const COMMANDS: readonly Command[] = [
  { id: 'new-order', label: 'Create order' },
  { id: 'find-customer', label: 'Find customer' },
  { id: 'run-report', label: 'Run report' },
  { id: 'invite', label: 'Invite teammate' },
];

@Component({
  selector: 'app-omnibar-hotkey-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellKbd, ...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Type a command"
      ariaLabel="Command palette"
      hotkey="mod+k"
      [(query)]="query"
    >
      <kbd hellOmnibarTrailing hellKbd>⌘K</kbd>

      <div hellOmnibarGroup label="Commands">
        @for (command of search.items(); track command.id) {
          <button hellOmnibarItem type="button" [value]="command">
            <span class="flex min-w-0 flex-1 flex-col overflow-hidden">{{ command.label }}</span>
          </button>
        }
      </div>
    </hell-omnibar>

    <p class="mt-3 text-sm text-hell-foreground-muted">
      Press <kbd hellKbd>⌘</kbd>/<kbd hellKbd>Ctrl</kbd> + <kbd hellKbd>K</kbd> anywhere on this
      page to focus the palette.
    </p>
  `,
})
export class OmnibarHotkeyExample {
  protected readonly query = signal('');
  protected readonly searchFields: readonly HellSearchField<Command>[] = [
    { name: 'label', weight: 5, get: (command) => command.label },
  ];
  protected readonly search = hellSearchResource({
    query: this.query,
    items: COMMANDS,
    fields: this.searchFields,
  });
}
