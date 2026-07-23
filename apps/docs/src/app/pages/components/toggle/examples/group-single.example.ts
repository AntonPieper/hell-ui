import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidAlignCenter, faSolidAlignLeft, faSolidAlignRight } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-group-single-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem, HellIcon],
  providers: [provideIcons({ faSolidAlignCenter, faSolidAlignLeft, faSolidAlignRight })],
  template: `
    <div hellToggleGroup type="single" [(value)]="align" aria-label="Text align">
      <button hellToggleGroupItem value="left" type="button" aria-label="Align left">
        <hell-icon name="faSolidAlignLeft" />
      </button>
      <button hellToggleGroupItem value="center" type="button" aria-label="Align center">
        <hell-icon name="faSolidAlignCenter" />
      </button>
      <button hellToggleGroupItem value="right" type="button" aria-label="Align right">
        <hell-icon name="faSolidAlignRight" />
      </button>
    </div>
    <p class="mt-2 text-sm text-hell-foreground-muted">
      Aligned: <code>{{ align() ?? 'none' }}</code>
    </p>
  `,
})
export class ToggleGroupSingleExample {
  // In type="single" mode the group commits a plain string, or null once the
  // selected item is deselected. Typing the signal as the canonical
  // HellToggleGroupValue union keeps [(value)] direct.
  protected readonly align = signal<HellToggleGroupValue>('left');
}
