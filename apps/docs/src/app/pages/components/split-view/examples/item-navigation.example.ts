import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';

interface Message {
  readonly id: string;
  readonly subject: string;
  readonly from: string;
}

const MESSAGES: readonly Message[] = [
  { id: 'm-1', subject: 'Q3 budget sign-off', from: 'Ada Lovelace' },
  { id: 'm-2', subject: 'Rollout window moved', from: 'Grace Hopper' },
  { id: 'm-3', subject: 'Access review due', from: 'Katherine Johnson' },
];

@Component({
  selector: 'app-split-view-item-navigation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view
      framed
      [height]="300"
      [detailOpen]="detailOpen()"
      itemNavigation
      itemNavigationLabel="Message navigation"
      previousItemLabel="Previous message"
      nextItemLabel="Next message"
      [previousItemDisabled]="index() === 0"
      [nextItemDisabled]="index() === messages.length - 1"
      (detailOpenChange)="detailOpen.set($event)"
      (previousItem)="move(-1)"
      (nextItem)="move(1)"
    >
      <ng-template hellSplitPrimary>
        <div class="flex flex-1 flex-col gap-hell-1 p-hell-3">
          @for (message of messages; track message.id; let i = $index) {
            <button
              class="rounded-hell-sm px-hell-3 py-hell-2 text-start text-sm text-hell-foreground data-[current=true]:bg-hell-primary-soft data-[current=true]:text-hell-primary-soft-foreground"
              type="button"
              [attr.data-current]="i === index() ? 'true' : null"
              [attr.aria-current]="i === index() ? 'true' : null"
              (click)="open(i)"
            >
              {{ message.subject }}
            </button>
          }
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex flex-1 flex-col gap-hell-2 p-hell-4">
          <strong class="text-sm font-semibold text-hell-foreground">{{ current().subject }}</strong>
          <span class="text-xs text-hell-foreground-muted">From {{ current().from }}</span>
          <span class="text-xs text-hell-foreground-muted">
            {{ index() + 1 }} of {{ messages.length }} — use the prev/next controls to walk the
            list without leaving the detail pane.
          </span>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewItemNavigationExample {
  protected readonly messages = MESSAGES;
  protected readonly index = signal(0);
  protected readonly detailOpen = signal(false);
  protected readonly current = computed(() => MESSAGES[this.index()]);

  protected open(index: number): void {
    this.index.set(index);
    this.detailOpen.set(true);
  }

  protected move(delta: -1 | 1): void {
    const next = Math.min(Math.max(this.index() + delta, 0), MESSAGES.length - 1);
    this.open(next);
  }
}
