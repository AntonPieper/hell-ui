import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-popover-dismissal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger, HellSwitch],
  template: `
    <div class="flex min-h-[160px] flex-col items-start gap-hell-4">
      <div class="flex items-center gap-hell-3 text-sm">
        <button
          id="close-on-outside-click"
          hellSwitch
          [checked]="closeOnOutsideClick()"
          (checkedChange)="closeOnOutsideClick.set($event)"
        ></button>
        <label for="close-on-outside-click">Close on outside click</label>
      </div>

      <button
        hellButton
        variant="danger"
        [hellPopoverTrigger]="confirm"
        [closeOnOutsideClick]="closeOnOutsideClick()"
        placement="bottom-start"
      >
        Delete workspace
      </button>
    </div>

    <ng-template #confirm>
      <div hellPopover aria-labelledby="dismissal-popover-title" class="max-w-[280px]">
        <strong id="dismissal-popover-title">Delete this workspace?</strong>
        <p class="my-2 text-sm">
          This removes all projects and billing history. This cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button hellButton type="button" size="sm" variant="ghost">Cancel</button>
          <button hellButton type="button" size="sm" variant="danger">Delete</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class PopoverDismissalExample {
  protected readonly closeOnOutsideClick = signal(false);
}
