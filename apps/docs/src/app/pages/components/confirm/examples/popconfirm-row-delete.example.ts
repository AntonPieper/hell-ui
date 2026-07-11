import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { hellDestructiveAction, injectHellPopconfirm } from '@hell-ui/angular/confirm';

interface Row {
  readonly id: number;
  readonly name: string;
}

@Component({
  selector: 'app-popconfirm-row-delete-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <div class="flex w-full max-w-[360px] flex-col gap-hell-3">
      <ul class="flex flex-col divide-y divide-hell-border rounded-hell-md border border-solid border-hell-border">
        @for (row of rows(); track row.id) {
          <li class="flex items-center justify-between gap-hell-3 px-hell-3 py-hell-2">
            <span class="text-[13px] text-hell-foreground">{{ row.name }}</span>
            <button
              #deleteButton
              hellButton
              variant="ghost"
              size="sm"
              iconOnly
              type="button"
              [attr.aria-label]="'Delete ' + row.name"
              (click)="remove(row, deleteButton)"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M8 6V4h8v2m-9 0v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" />
              </svg>
            </button>
          </li>
        }
      </ul>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>
  `,
})
export class PopconfirmRowDeleteExample {
  private readonly popconfirm = injectHellPopconfirm();

  protected readonly rows = signal<Row[]>([
    { id: 1, name: 'staging-eu-west' },
    { id: 2, name: 'staging-us-east' },
    { id: 3, name: 'prod-canary' },
  ]);
  protected readonly status = signal('Nothing deleted yet.');

  protected async remove(row: Row, anchor: HTMLElement): Promise<void> {
    const confirmed = await this.popconfirm(
      anchor,
      `Delete ${row.name}?`,
      hellDestructiveAction('Delete'),
    );
    if (!confirmed) return;

    this.rows.update((rows) => rows.filter((candidate) => candidate.id !== row.id));
    this.status.set(`Deleted ${row.name}.`);
  }
}
