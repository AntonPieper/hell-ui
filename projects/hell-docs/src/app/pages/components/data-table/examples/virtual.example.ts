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
      <div
        class="flex flex-wrap items-center justify-between gap-2 text-xs text-hell-foreground-muted"
      >
        <span
          >TanStack Virtual renders Hell row parts, including an active dynamic-height editor.</span
        >
        <button type="button" hellButton size="sm" variant="ghost" (click)="scrollToActiveRow()">
          Scroll to active row
        </button>
      </div>

      <div hellTableContainer>
        <div class="hell-table-virtual-x-scroll">
          <div class="hell-table-virtual">
            <div
              class="hell-table-virtual-header hell-table-virtual-grid"
              data-testid="tanstack-virtual-header"
            >
              <span class="hell-table-virtual-header-cell">Name</span>
              <span class="hell-table-virtual-header-cell">Role</span>
              <span class="hell-table-virtual-header-cell">Action</span>
            </div>

            <div
              #scrollHost
              class="hell-table-virtual-body-scroll"
              data-testid="tanstack-virtual-scroll"
            >
              <div class="hell-table-virtual-body" [style.height.px]="virtualRows.totalSize()">
                @for (item of virtualRows.virtualItems(); track item.key) {
                  @if (item.part; as part) {
                    <div
                      class="hell-table-virtual-row-part"
                      [style.transform]="'translateY(' + item.start + 'px)'"
                      [hellTableMeasureRow]="part"
                      [hellTableMeasureRowCallback]="measureVirtualRow"
                    >
                      @if (part.kind === 'row') {
                        <div
                          class="hell-table-virtual-row hell-table-virtual-grid"
                          [attr.data-active]="activeRowKey() === part.row.key ? 'true' : null"
                        >
                          <div class="hell-table-virtual-cell">
                            <strong class="hell-table-virtual-primary">{{
                              part.row.original.name
                            }}</strong>
                            <span class="hell-table-virtual-meta">{{ part.key }}</span>
                          </div>
                          <span class="hell-table-virtual-cell">{{ part.row.original.role }}</span>
                          <span class="hell-table-virtual-cell" data-space="action">
                            <button
                              type="button"
                              hellButton
                              size="xs"
                              variant="ghost"
                              (click)="toggleEditor(part.row.key)"
                            >
                              {{ activeRowKey() === part.row.key ? 'Close' : 'Open' }} editor
                            </button>
                          </span>
                        </div>
                      } @else if (part.kind === 'editor') {
                        <div class="hell-table-virtual-editor">
                          <strong>Dynamic editor for {{ part.row.original.name }}</strong>
                          <p>{{ part.row.original.notes }}</p>
                          <textarea
                            [id]="'data-table-virtual-editor-' + part.row.key"
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

  protected readonly measureVirtualRow = (
    measurement: HellTableRowMeasurement<HellVirtualRowPart<Person>>,
  ) => {
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
