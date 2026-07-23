import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidMoon, faSolidVolumeHigh, faSolidWifi } from '@ng-icons/font-awesome/solid';
import { HellSwitch } from '@hell-ui/angular/switch';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';

@Component({
  selector: 'app-switch-settings-list-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidMoon, faSolidVolumeHigh, faSolidWifi })],
  imports: [HellSwitch, ...HELL_CARD_IMPORTS, ...HELL_FIELD_IMPORTS, HellIcon],
  template: `
    <div hellCard class="max-w-md" [elevation]="0">
      <div hellCardHeader>Device settings</div>
      <div hellCardBody class="grid gap-hell-4">
        <div hellField orientation="horizontal">
          <button
            id="setting-wifi"
            hellSwitch
            [checked]="wifi()"
            (checkedChange)="wifi.set($event)"
          ></button>
          <label hellFieldLabel for="setting-wifi">
            <hell-icon name="faSolidWifi" ui="text-hell-foreground-muted" />
            Wi-Fi
          </label>
          <div hellFieldDescription>Connects automatically to known networks.</div>
        </div>

        <div hellField orientation="horizontal">
          <button
            id="setting-sound"
            hellSwitch
            [checked]="sound()"
            (checkedChange)="sound.set($event)"
          ></button>
          <label hellFieldLabel for="setting-sound">
            <hell-icon name="faSolidVolumeHigh" ui="text-hell-foreground-muted" />
            Sound
          </label>
          <div hellFieldDescription>Plays a tone for calls and notifications.</div>
        </div>

        <div hellField orientation="horizontal">
          <button id="setting-focus" hellSwitch [checked]="true" disabled></button>
          <label hellFieldLabel for="setting-focus">
            <hell-icon name="faSolidMoon" ui="text-hell-foreground-muted" />
            Focus mode
          </label>
          <div hellFieldDescription>Enforced by an active calendar event.</div>
        </div>
      </div>
    </div>
  `,
})
export class SwitchSettingsListExample {
  protected readonly wifi = signal(true);
  protected readonly sound = signal(false);
}
