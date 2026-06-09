import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  type Signal,
} from '@angular/core';

import { HellStyleable } from '../core/styleable';
import { HellButton } from '../primitives/button/button';
import { HellNativeCheckbox } from '../primitives/checkbox/checkbox';
import {
  hellTableColumnCanToggleVisibility,
  hellTableColumnIsVisible,
  hellTableColumnVisibilityMode,
  hellTableInitialColumnVisibility,
  type HellColumnDef,
  type HellTableColumn,
  type HellTableColumnVisibilityState,
  type HellTableSignalInput,
} from './table-model';

interface HellColumnVisibilityPanelItem<TData> {
  readonly column: HellTableColumn<TData>;
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly note: string | null;
  readonly noteId: string | null;
}

let nextColumnVisibilityPanelId = 0;

/**
 * Accessible app-owned column visibility picker for Hell table columns.
 *
 * The panel emits a `Record<columnId, boolean>` visibility map. It does not
 * persist preferences; bind `[(columnVisibility)]` to app state and store that
 * state wherever the application needs it.
 */
@Component({
  selector: 'hell-column-visibility-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellNativeCheckbox],
  host: {
    '[class.hell-column-visibility-panel]': '!unstyled()',
    '[attr.data-hell-column-visibility-panel]': '""',
  },
  template: `
    <fieldset
      role="group"
      [attr.aria-labelledby]="legendId"
      [attr.aria-describedby]="description() ? descriptionId : null"
    >
      <div data-slot="header">
        <div data-slot="heading">
          <legend [id]="legendId">{{ label() }}</legend>
          @if (description(); as text) {
            <p [id]="descriptionId" data-slot="description">{{ text }}</p>
          }
        </div>

        <button
          hellButton
          type="button"
          data-slot="reset"
          size="xs"
          variant="ghost"
          [disabled]="!canReset()"
          (click)="resetColumnVisibility()"
        >
          {{ resetLabel() }}
        </button>
      </div>

      <ul data-slot="list">
        @for (item of items(); track item.column.id) {
          <li
            data-slot="item"
            [attr.data-visible]="item.checked ? 'true' : null"
            [attr.data-required]="item.disabled ? 'true' : null"
          >
            <label data-slot="option">
              <input
                hellNativeCheckbox
                type="checkbox"
                [attr.aria-label]="item.label"
                [attr.aria-describedby]="item.noteId"
                [checked]="item.checked"
                [disabled]="item.disabled"
                (checkedChange)="setColumnVisible(item.column, $event)"
              />
              <span data-slot="label">{{ item.label }}</span>
              @if (item.note) {
                <span [id]="item.noteId" data-slot="note">{{ item.note }}</span>
              }
            </label>
          </li>
        } @empty {
          <li data-slot="empty">{{ empty() }}</li>
        }
      </ul>
    </fieldset>
  `,
})
export class HellColumnVisibilityPanel<TData = unknown> extends HellStyleable {
  /** Column definitions to list. */
  readonly columns = input<HellTableSignalInput<readonly HellColumnDef<TData>[]>>([]);

  /** App-owned column visibility map. Use `[(columnVisibility)]` for two-way binding. */
  readonly columnVisibility = model<HellTableColumnVisibilityState>({});

  /** Accessible group label rendered as the fieldset legend. */
  readonly label = input('Column visibility');

  /** Optional helper text for the checkbox group. */
  readonly description = input<string | null>(null);

  /** Button text for restoring definition defaults. */
  readonly resetLabel = input('Reset columns');

  /** Empty text shown when there are no columns. */
  readonly empty = input('No columns available.');

  protected readonly panelId = `hell-column-visibility-panel-${nextColumnVisibilityPanelId++}`;
  protected readonly legendId = `${this.panelId}-legend`;
  protected readonly descriptionId = `${this.panelId}-description`;

  private readonly resolvedColumns = computed(() => readSignalInput(this.columns()));
  private readonly defaultColumnVisibility = computed(() =>
    hellTableInitialColumnVisibility(this.resolvedColumns()),
  );
  private readonly effectiveColumnVisibility = computed(() => this.columnVisibility());

  protected readonly items = computed<readonly HellColumnVisibilityPanelItem<TData>[]>(() =>
    this.resolvedColumns().map((column) => this.itemFor(column)),
  );

  protected readonly canReset = computed(
    () => !sameVisibility(this.columnVisibility(), this.defaultColumnVisibility()),
  );

  protected setColumnVisible(column: HellTableColumn<TData>, visible: boolean): void {
    if (!hellTableColumnCanToggleVisibility(column)) return;
    this.columnVisibility.update((current) => ({ ...current, [column.id]: visible }));
  }

  protected resetColumnVisibility(): void {
    this.columnVisibility.set({ ...this.defaultColumnVisibility() });
  }

  private itemFor(column: HellTableColumn<TData>): HellColumnVisibilityPanelItem<TData> {
    const mode = hellTableColumnVisibilityMode(column);
    const disabled = !hellTableColumnCanToggleVisibility(column);
    const note = disabled ? 'Required' : mode === 'initially-hidden' ? 'Initially hidden' : null;
    return {
      column,
      label: columnLabel(column),
      checked: hellTableColumnIsVisible(column, this.effectiveColumnVisibility()),
      disabled,
      note,
      noteId: note ? `${this.panelId}-${domId(column.id)}-note` : null,
    };
  }
}

function readSignalInput<T>(inputValue: HellTableSignalInput<T>): T {
  return typeof inputValue === 'function' ? (inputValue as Signal<T>)() : inputValue;
}

function columnLabel(column: Pick<HellTableColumn, 'id' | 'header'>): string {
  if (typeof column.header === 'string' || typeof column.header === 'number') {
    const label = String(column.header).trim();
    if (label.length) return label;
  }
  return column.id;
}

function domId(value: string): string {
  const id = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
  return id.length ? id : 'column';
}

function sameVisibility(
  a: HellTableColumnVisibilityState,
  b: HellTableColumnVisibilityState,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
