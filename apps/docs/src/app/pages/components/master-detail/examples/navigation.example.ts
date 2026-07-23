import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_MASTER_DETAIL_IMPORTS } from 'hell-ui/master-detail';
import { HellPageLink, HellPagination } from 'hell-ui/pagination';
import { HellToolbar, HellToolbarItem } from 'hell-ui/toolbar';

interface Message {
  readonly id: string;
  readonly subject: string;
  readonly owner: string;
}

const MESSAGES: readonly Message[] = [
  { id: 'M-104', subject: 'Q3 budget sign-off', owner: 'Ada Lovelace' },
  { id: 'M-109', subject: 'Rollout window moved', owner: 'Grace Hopper' },
  { id: 'M-118', subject: 'Access review due', owner: 'Katherine Johnson' },
];

@Component({
  selector: 'app-master-detail-navigation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellPagination,
    HellPageLink,
    HellToolbar,
    HellToolbarItem,
    ...HELL_MASTER_DETAIL_IMPORTS,
  ],
  template: `
    <div
      hellMasterDetail
      data-testid="master-detail-navigation"
      [compactBelow]="640"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      ui="grid h-[380px] min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-hell-lg border border-hell-border bg-hell-surface data-[compact=true]:grid-cols-1"
    >
      <section hellMasterPane="primary" ui="min-w-0 overflow-auto border-e border-hell-border p-hell-3">
        <div class="grid gap-hell-1">
          @for (message of messages; track message.id; let index = $index) {
            <button
              hellButton
              class="justify-start"
              variant="ghost"
              size="sm"
              type="button"
              [attr.aria-current]="index === selectedIndex() ? 'true' : null"
              [attr.data-testid]="'master-detail-message-' + index"
              (click)="open(index)"
            >
              {{ message.subject }}
            </button>
          }
        </div>
      </section>

      <section hellMasterPane="detail" ui="flex min-w-0 flex-col overflow-auto">
        <div class="flex flex-wrap items-center gap-hell-2 border-b border-hell-border p-hell-2">
          <button
            hellMasterDetailBack
            hellButton
            data-testid="master-detail-navigation-back"
            variant="ghost"
            size="sm"
            type="button"
          >
            Back to messages
          </button>

          <div hellToolbar label="Message actions" class="min-w-0 flex-1 justify-end">
            <button hellToolbarItem hellButton variant="ghost" size="sm" type="button">Assign</button>
            <button hellToolbarItem hellButton variant="ghost" size="sm" type="button">Archive</button>
          </div>
        </div>

        <div class="grid flex-1 content-start gap-hell-3 p-hell-4">
          <strong data-testid="master-detail-navigation-title" class="text-sm font-semibold text-hell-foreground">
            {{ current().subject }}
          </strong>
          <span class="text-xs text-hell-foreground-muted">Owner: {{ current().owner }}</span>
          <label class="grid gap-hell-1 text-xs font-semibold text-hell-foreground">
            Reply draft
            <textarea
              data-testid="master-detail-navigation-draft"
              class="min-h-20 rounded-hell-sm border border-hell-border bg-hell-surface p-hell-2 text-sm"
            >Consumer-owned draft survives compact back/open transitions.</textarea>
          </label>
        </div>

        <nav
          hellPagination
          class="justify-between border-t border-hell-border p-hell-2"
          aria-label="Message navigation"
          [page]="selectedIndex() + 1"
          [pageCount]="messages.length"
          (pageChange)="openPage($event)"
        >
          <button hellPageLink="previous" type="button" aria-label="Previous message">Previous</button>
          <span class="text-xs text-hell-foreground-muted">
            {{ selectedIndex() + 1 }} of {{ messages.length }}
          </span>
          <button hellPageLink="next" type="button" aria-label="Next message">Next</button>
        </nav>
      </section>
    </div>
  `,
})
export class MasterDetailNavigationExample {
  protected readonly messages = MESSAGES;
  protected readonly selectedIndex = signal(0);
  protected readonly detailOpen = signal(false);
  protected readonly current = computed(() => this.messages[this.selectedIndex()]);

  protected open(index: number): void {
    this.selectedIndex.set(index);
    this.detailOpen.set(true);
  }

  protected openPage(page: number): void {
    this.open(page - 1);
  }
}
