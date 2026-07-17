import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-menu-checkable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_IMPORTS],
  template: `
    <button hellButton variant="ghost" [hellMenuTrigger]="view" type="button">View</button>

    <ng-template #view>
      <div hellMenu aria-label="View options">
        <div hellMenuSection>
          <div hellMenuLabel>Columns</div>
          <button
            hellMenuItemCheckbox
            [checked]="showOwner()"
            (checkedChange)="showOwner.set($event)"
          >
            <span hellMenuItemIndicator></span>
            <span>Owner</span>
          </button>
          <button
            hellMenuItemCheckbox
            [checked]="showUpdated()"
            (checkedChange)="showUpdated.set($event)"
          >
            <span hellMenuItemIndicator></span>
            <span>Last updated</span>
          </button>
        </div>

        <div hellMenuSeparator></div>

        <div
          hellMenuSection
          hellMenuItemRadioGroup
          [value]="density()"
          (valueChange)="density.set($event)"
        >
          <div hellMenuLabel>Row density</div>
          <button hellMenuItemRadio value="comfortable">
            <span hellMenuItemIndicator></span>
            <span>Comfortable</span>
          </button>
          <button hellMenuItemRadio value="compact">
            <span hellMenuItemIndicator></span>
            <span>Compact</span>
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class MenuCheckableExample {
  protected readonly showOwner = signal(true);
  protected readonly showUpdated = signal(false);
  protected readonly density = signal('comfortable');
}
