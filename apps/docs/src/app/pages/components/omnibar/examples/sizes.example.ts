import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { hellSearchResource, type HellSearchField } from '@hell-ui/angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

interface Command {
  readonly id: string;
  readonly label: string;
}

const COMMANDS: readonly Command[] = [
  { id: 'dashboard', label: 'Go to dashboard' },
  { id: 'orders', label: 'Open orders' },
  { id: 'reports', label: 'View reports' },
];

@Component({
  selector: 'app-omnibar-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <div class="flex max-w-90 flex-col gap-3">
      @for (demo of demos; track demo.size) {
        <hell-omnibar
          [size]="demo.size"
          [placeholder]="'Size ' + demo.size"
          [ariaLabel]="'Search (' + demo.size + ')'"
          [query]="demo.query()"
          (queryChange)="demo.query.set($event)"
        >
          <div hellOmnibarGroup label="Commands">
            @for (command of demo.search.items(); track command.id) {
              <button hellOmnibarItem type="button" [value]="command">
                <span hellOmnibarItemText>{{ command.label }}</span>
              </button>
            }
          </div>
        </hell-omnibar>
      }
    </div>
  `,
})
export class OmnibarSizesExample {
  protected readonly searchFields: readonly HellSearchField<Command>[] = [
    { name: 'label', weight: 5, get: (command) => command.label },
  ];
  protected readonly demos = (['sm', 'md', 'lg'] as const).map((size) => {
    const query = signal('');
    return {
      size,
      query,
      search: hellSearchResource({
        query,
        items: COMMANDS,
        fields: this.searchFields,
      }),
    };
  });
}
