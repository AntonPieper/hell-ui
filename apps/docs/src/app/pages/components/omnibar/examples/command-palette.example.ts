import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowRightArrowLeft,
  faSolidChartLine,
  faSolidFileInvoice,
  faSolidGear,
  faSolidPlus,
  faSolidUserPlus,
} from '@ng-icons/font-awesome/solid';
import { hellSearchResource, type HellSearchField } from '@hell-ui/angular/core';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_OMNIBAR_IMPORTS } from '@hell-ui/angular/omnibar';
import { HellKbd } from '@hell-ui/angular/chip';

interface Command {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly section: 'Navigate' | 'Create';
  readonly shortcut: string;
}

const COMMANDS: readonly Command[] = [
  { id: 'go-dashboard', label: 'Go to dashboard', icon: 'faSolidChartLine', section: 'Navigate', shortcut: 'G D' },
  { id: 'go-switch', label: 'Switch workspace', icon: 'faSolidArrowRightArrowLeft', section: 'Navigate', shortcut: 'G W' },
  { id: 'go-settings', label: 'Open settings', icon: 'faSolidGear', section: 'Navigate', shortcut: 'G S' },
  { id: 'new-invoice', label: 'New invoice', icon: 'faSolidFileInvoice', section: 'Create', shortcut: 'C I' },
  { id: 'new-record', label: 'New record', icon: 'faSolidPlus', section: 'Create', shortcut: 'C R' },
  { id: 'invite', label: 'Invite teammate', icon: 'faSolidUserPlus', section: 'Create', shortcut: 'C T' },
];

@Component({
  selector: 'app-omnibar-command-palette-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, HellKbd, ...HELL_OMNIBAR_IMPORTS],
  providers: [
    provideIcons({
      faSolidArrowRightArrowLeft,
      faSolidChartLine,
      faSolidFileInvoice,
      faSolidGear,
      faSolidPlus,
      faSolidUserPlus,
    }),
  ],
  template: `
    <!-- Mimics a topbar command palette: an icon-led searchbox with a kbd hint
         and grouped commands whose trailing slot carries shortcut chips. -->
    <div class="flex items-center justify-between gap-3 rounded-hell-md border border-hell-border bg-hell-surface-subtle px-hell-3 py-hell-2">
      <span class="text-sm font-semibold text-hell-foreground">Acme Console</span>
      <hell-omnibar
        class="max-w-72"
        placeholder="Search commands"
        ariaLabel="Command palette"
        hotkey="mod+k"
        [(query)]="query"
        (submit)="ran.set($any($event.item).label)"
      >
        <hell-icon hellOmnibarLeading name="faSolidChartLine" size="13px" />
        <kbd hellOmnibarTrailing hellKbd>⌘K</kbd>

        @for (group of grouped(); track group.section) {
          <div hellOmnibarGroup [label]="group.section">
            <div hellOmnibarGroupLabel>{{ group.section }}</div>
            @for (command of group.commands; track command.id) {
              <button hellOmnibarItem type="button" [value]="command">
                <hell-icon
                  class="inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle in-data-[active=true]:text-hell-foreground"
                  [name]="command.icon"
                  size="13px"
                />
                <span class="flex min-w-0 flex-1 flex-col overflow-hidden">{{ command.label }}</span>
                <span class="ms-auto inline-flex items-center gap-1">
                  <kbd hellKbd>{{ command.shortcut }}</kbd>
                </span>
              </button>
            }
          </div>
        }
      </hell-omnibar>
    </div>

    @if (ran(); as label) {
      <p class="mt-3 text-sm text-hell-foreground-muted">Ran command: {{ label }}</p>
    }
  `,
})
export class OmnibarCommandPaletteExample {
  protected readonly query = signal('');
  protected readonly ran = signal<string | null>(null);

  protected readonly searchFields: readonly HellSearchField<Command>[] = [
    { name: 'label', weight: 5, get: (command) => command.label },
    { name: 'section', weight: 2, get: (command) => command.section },
  ];
  protected readonly search = hellSearchResource({
    query: this.query,
    items: COMMANDS,
    fields: this.searchFields,
  });

  protected readonly grouped = computed(() => {
    const sections: Command['section'][] = ['Navigate', 'Create'];
    return sections
      .map((section) => ({
        section,
        commands: this.search.items().filter((command) => command.section === section),
      }))
      .filter((group) => group.commands.length > 0);
  });
}
