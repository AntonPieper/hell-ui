import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

import { HellButton } from '@hell-ui/angular/button';
import {
  HellTableContainer,
  HellTableMeasureRow,
  hellTableRowsFromData,
  hellTableVirtualRowPartsFromRows,
  type HellTableRowMeasurement,
  type HellVirtualRowPart,
} from '@hell-ui/angular/table';
import { injectHellTanStackVirtualRows } from '@hell-ui/angular/table-virtual';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly notes: string;
}

const PEOPLE: readonly Person[] = Array.from({ length: 80 }, (_, index) => ({
  id: `person-${index + 1}`,
  name: `Person ${index + 1}`,
  role: index % 3 === 0 ? 'Admin' : index % 3 === 1 ? 'Editor' : 'Viewer',
  notes:
    index % 4 === 0
      ? 'Longer dynamic detail copy. ResizeObserver reports the measured editor row height back into TanStack Virtual through hellTableMeasureRow.'
      : 'Short dynamic detail copy.',
}));

@Component({
  selector: 'app-data-table-virtual-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTableContainer, HellTableMeasureRow],
  template: `
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-hell-foreground-muted">
        <span>TanStack Virtual renders Hell row parts, including an active dynamic-height editor.</span>
        <button type="button" hellButton size="sm" variant="ghost" (click)="scrollToActiveRow()">
          Scroll to active row
        </button>
      </div>

      <div hellTableContainer class="overflow-hidden">
        <div class="grid min-w-[560px] grid-cols-[minmax(12rem,1fr)_8rem_9rem] gap-3 border-b border-hell-border bg-hell-surface-subtle px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-hell-foreground-muted">
          <span>Name</span>
          <span>Role</span>
          <span>Action</span>
        </div>

        <div #scrollHost class="relative h-[420px] overflow-auto bg-hell-surface-elevated">
          <div class="relative min-w-[560px]" [style.height.px]="virtualRows.totalSize()">
            @for (item of virtualRows.virtualItems(); track item.key) {
              @if (item.part; as part) {
                <div
                  class="absolute w-full border-b border-hell-border bg-hell-surface-elevated"
                  [style.transform]="'translateY(' + item.start + 'px)'"
                  [hellTableMeasureRow]="part"
                  [hellTableMeasureRowCallback]="measureVirtualRow"
                >
                  @if (part.kind === 'row') {
                    <div class="grid min-h-14 grid-cols-[minmax(12rem,1fr)_8rem_9rem] items-center gap-3 px-3 py-2 text-sm">
                      <div class="min-w-0">
                        <strong class="block truncate">{{ part.row.original.name }}</strong>
                        <div class="truncate text-xs text-hell-foreground-muted">{{ part.key }}</div>
                      </div>
                      <span>{{ part.row.original.role }}</span>
                      <button
                        type="button"
                        hellButton
                        size="xs"
                        variant="ghost"
                        (click)="toggleEditor(part.row.key)"
                      >
                        {{ activeRowKey() === part.row.key ? 'Close' : 'Open' }} editor
                      </button>
                    </div>
                  } @else if (part.kind === 'editor') {
                    <div class="bg-hell-primary-soft px-3 py-3 text-sm text-hell-primary">
                      <strong>Dynamic editor for {{ part.row.original.name }}</strong>
                      <p class="mt-2">{{ part.row.original.notes }}</p>
                      <textarea
                        [id]="'data-table-virtual-editor-' + part.row.key"
                        class="mt-2 w-full resize-none rounded border border-hell-border bg-hell-surface-subtle p-2 text-hell-foreground"
                        [value]="part.row.original.notes"
                        aria-label="Dynamic editor content"
                      ></textarea>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DataTableVirtualExample {
  private readonly scrollElement = signal<HTMLElement | null>(null);

  @ViewChild('scrollHost')
  set scrollHost(ref: ElementRef<HTMLElement> | undefined) {
    this.scrollElement.set(ref?.nativeElement ?? null);
  }

  protected readonly rows = signal(PEOPLE);
  protected readonly activeRowKey = signal<string | null>('person-5');
  protected readonly normalizedRows = computed(() =>
    hellTableRowsFromData(this.rows(), (row) => row.id),
  );
  protected readonly rowParts = computed(() =>
    hellTableVirtualRowPartsFromRows({
      rows: this.normalizedRows(),
      activeEditorRowKey: this.activeRowKey(),
    }),
  );

  protected readonly virtualRows = injectHellTanStackVirtualRows<
    HellVirtualRowPart<Person>,
    HTMLElement,
    HTMLElement
  >({
    rowParts: this.rowParts,
    scrollElement: this.scrollElement,
    estimateSize: ({ part }) => (part.kind === 'editor' ? 150 : 58),
    overscan: 4,
    initialRect: { width: 720, height: 420 },
  });

  protected readonly measureVirtualRow = (measurement: HellTableRowMeasurement<HellVirtualRowPart<Person>>) => {
    this.virtualRows.measureRow(measurement);
  };

  protected toggleEditor(rowKey: string): void {
    this.activeRowKey.update((current) => (current === rowKey ? null : rowKey));
  }

  protected scrollToActiveRow(): void {
    const key = this.activeRowKey();
    if (key) this.virtualRows.scrollToRow(key, { align: 'center', partKind: 'editor' });
  }
}
