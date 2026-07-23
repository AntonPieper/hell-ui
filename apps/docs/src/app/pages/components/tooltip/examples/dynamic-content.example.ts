import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellTooltip } from 'hell-ui/tooltip';

@Component({
  selector: 'app-tooltip-dynamic-content-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip],
  template: `
    <div class="flex flex-wrap items-center gap-hell-3">
      <!-- Present-to-present changes update the open surface in place;
           the empty string closes it and disables the interaction. -->
      <button hellButton [hellTooltip]="hint()" type="button" (click)="markOneRead()">
        Mark one as read
      </button>
      <button hellButton variant="ghost" type="button" (click)="unread.set(3)">Reset</button>
    </div>
  `,
})
export class TooltipDynamicContentExample {
  protected readonly unread = signal(3);

  protected readonly hint = computed(() =>
    this.unread() > 0 ? `${this.unread()} unread notifications` : '',
  );

  protected markOneRead(): void {
    this.unread.update((count) => Math.max(0, count - 1));
  }
}
