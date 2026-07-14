import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-popover-non-modal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger, HellSlider],
  template: `
    <div class="flex min-h-[160px] items-start gap-hell-3" #toolbar>
      <button
        hellButton
        variant="ghost"
        [hellPopoverTrigger]="volume"
        [trapFocus]="false"
        [anchor]="toolbar"
        [boundary]="toolbar"
        placement="bottom-start"
        aria-label="Playback volume"
      >
        Volume: {{ level() }}
      </button>
      <button hellButton variant="ghost" (click)="skips.set(skips() + 1)">
        Skip ({{ skips() }})
      </button>
    </div>

    <ng-template #volume>
      <div hellPopover aria-label="Volume" class="w-[220px]">
        <hell-slider
          aria-label="Volume level"
          [value]="level()"
          (valueChange)="level.set($any($event))"
        />
      </div>
    </ng-template>
  `,
})
export class PopoverNonModalExample {
  protected readonly level = signal(40);
  protected readonly skips = signal(0);
}
