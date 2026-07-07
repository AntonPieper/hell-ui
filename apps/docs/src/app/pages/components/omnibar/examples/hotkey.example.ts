import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type HellSearchField, type HellSearchResult } from '@hell-ui/angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HellKbd } from '@hell-ui/angular/tag';

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
  imports: [HellKbd, ...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Type a command"
      ariaLabel="Command palette"
      hotkey="mod+k"
      [searchItems]="commands"
      [searchFields]="searchFields"
      (searchResultsChange)="results.set($any($event))"
    >
      <kbd hellOmnibarTrailing hellKbd>⌘K</kbd>

      <div hellOmnibarGroup label="Commands">
        @for (result of results(); track result.item.id) {
          <button hellOmnibarItem type="button" [value]="result.item">
            <span hellOmnibarItemText>{{ result.item.label }}</span>
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
  protected readonly commands = COMMANDS;
  protected readonly results = signal<readonly HellSearchResult<Command>[]>([]);
  protected readonly searchFields: readonly HellSearchField<Command>[] = [
    { name: 'label', weight: 5, get: (command) => command.label },
  ];
}
