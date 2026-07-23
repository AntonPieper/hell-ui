import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBell } from '@ng-icons/font-awesome/solid';
import { HellIcon } from 'hell-ui/icon';
import { HellToggle } from 'hell-ui/toggle';

@Component({
  selector: 'app-toggle-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle, HellIcon],
  providers: [provideIcons({ faSolidBell })],
  template: `
    <button
      hellToggle
      type="button"
      [selected]="muted()"
      (selectedChange)="muted.set($event)"
      [attr.aria-label]="muted() ? 'Unmute notifications' : 'Mute notifications'"
    >
      <hell-icon name="faSolidBell" />
      {{ muted() ? 'Muted' : 'Notify' }}
    </button>
    <button hellToggle type="button" disabled>Disabled</button>
  `,
})
export class ToggleBasicExample {
  protected readonly muted = signal(false);
}
