import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  type Signal,
} from '@angular/core';

import { HellStyleable } from '../core/styleable';
import { type HellButtonVariant, type HellSize } from '../core/types';
import { HellButton } from '../primitives/button/button';
import { HellNativeCheckbox } from '../primitives/checkbox/checkbox';
import {
  HellMenu,
  HellMenuItem,
  HellMenuItemCheckbox,
  HellMenuItemIndicator,
  HellMenuItemTrailing,
  HellMenuLabel,
  HellMenuSection,
  HellMenuSeparator,
  HellMenuTrigger,
} from '../primitives/menu/menu';
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

export type HellColumnVisibilitySelectorPlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'right-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end';

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
    this.resolvedColumns().map((column) =>
      columnVisibilityItemFor(column, this.effectiveColumnVisibility(), this.panelId),
    ),
  );

  protected readonly canReset = computed(
    () => !sameVisibility(this.columnVisibility(), this.defaultColumnVisibility()),
  );

  protected setColumnVisible(column: HellTableColumn<TData>, visible: boolean): void {
    setColumnVisible(this.columnVisibility, column, visible);
  }

  protected resetColumnVisibility(): void {
    this.columnVisibility.set({ ...this.defaultColumnVisibility() });
  }
}

/**
 * Menu variant of the column visibility picker for dense table toolbars.
 *
 * Place it inside a `[hellMenuTrigger]` template. Toggleable columns render as
 * `menuitemcheckbox` rows and stay open while users make multiple changes.
 */
@Component({
  selector: 'hell-column-visibility-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellMenu,
    HellMenuItem,
    HellMenuItemCheckbox,
    HellMenuItemIndicator,
    HellMenuItemTrailing,
    HellMenuLabel,
    HellMenuSection,
    HellMenuSeparator,
  ],
  host: {
    '[class.hell-column-visibility-menu-host]': '!unstyled()',
    '[attr.data-hell-column-visibility-menu]': '""',
  },
  template: `
    <div
      hellMenu
      class="hell-column-visibility-menu"
      [unstyled]="unstyled()"
      [attr.aria-label]="label()"
      [attr.aria-description]="description()"
    >
      <div hellMenuSection>
        <div hellMenuLabel>{{ label() }}</div>
        @for (item of items(); track item.column.id) {
          <button
            hellMenuItemCheckbox
            type="button"
            [checked]="item.checked"
            [disabled]="item.disabled"
            (checkedChange)="setColumnVisible(item.column, $event)"
          >
            <span hellMenuItemIndicator></span>
            <span>{{ item.label }}</span>
            @if (item.note) {
              <span hellMenuItemTrailing>{{ item.note }}</span>
            }
          </button>
        } @empty {
          <button hellMenuItem type="button" disabled>{{ empty() }}</button>
        }
      </div>
      <div hellMenuSeparator></div>
      <button hellMenuItem type="button" [disabled]="!canReset()" (click)="resetColumnVisibility()">
        <span hellMenuItemIndicator></span>
        <span>{{ resetLabel() }}</span>
      </button>
    </div>
  `,
})
export class HellColumnVisibilityMenu<TData = unknown> extends HellStyleable {
  /** Column definitions to list. */
  readonly columns = input<HellTableSignalInput<readonly HellColumnDef<TData>[]>>([]);

  /** App-owned column visibility map. Use `[(columnVisibility)]` for two-way binding. */
  readonly columnVisibility = model<HellTableColumnVisibilityState>({});

  /** Accessible menu label. */
  readonly label = input('Columns');

  /** Optional description exposed to assistive technology. */
  readonly description = input<string | null>(null);

  /** Menu item text for restoring definition defaults. */
  readonly resetLabel = input('Restore columns');

  /** Empty text shown when there are no columns. */
  readonly empty = input('No columns available.');

  private readonly resolvedColumns = computed(() => readSignalInput(this.columns()));
  private readonly defaultColumnVisibility = computed(() =>
    hellTableInitialColumnVisibility(this.resolvedColumns()),
  );
  private readonly effectiveColumnVisibility = computed(() => this.columnVisibility());

  protected readonly items = computed<readonly HellColumnVisibilityPanelItem<TData>[]>(() =>
    this.resolvedColumns().map((column) =>
      columnVisibilityItemFor(column, this.effectiveColumnVisibility()),
    ),
  );

  protected readonly canReset = computed(
    () => !sameVisibility(this.columnVisibility(), this.defaultColumnVisibility()),
  );

  protected setColumnVisible(column: HellTableColumn<TData>, visible: boolean): void {
    setColumnVisible(this.columnVisibility, column, visible);
  }

  protected resetColumnVisibility(): void {
    this.columnVisibility.set({ ...this.defaultColumnVisibility() });
  }
}

/**
 * Compact button + menu composition for dense table toolbars.
 *
 * Use this when the table should expose a standard Columns trigger instead of
 * hand-rolling a trigger button around `hell-column-visibility-menu`.
 */
@Component({
  selector: 'hell-column-visibility-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellMenuTrigger, HellColumnVisibilityMenu],
  host: {
    '[class.hell-column-visibility-selector]': '!unstyled()',
    '[attr.data-hell-column-visibility-selector]': '""',
  },
  template: `
    <button
      hellButton
      type="button"
      [size]="buttonSize()"
      [variant]="buttonVariant()"
      [unstyled]="unstyled()"
      [hellMenuTrigger]="columnsMenu"
      [openTriggers]="menuOpenTriggers"
      [placement]="placement()"
    >
      <ng-content select="[hellColumnVisibilitySelectorIcon]" />
      <span>{{ label() }}</span>
    </button>

    <ng-template #columnsMenu>
      <hell-column-visibility-menu
        [columns]="columns()"
        [columnVisibility]="columnVisibility()"
        (columnVisibilityChange)="columnVisibility.set($event)"
        [label]="label()"
        [description]="description()"
        [resetLabel]="resetLabel()"
        [empty]="empty()"
        [unstyled]="unstyled()"
      />
    </ng-template>
  `,
})
export class HellColumnVisibilitySelector<TData = unknown> extends HellStyleable {
  /** Column definitions to list. */
  readonly columns = input<HellTableSignalInput<readonly HellColumnDef<TData>[]>>([]);

  /** App-owned column visibility map. Use `[(columnVisibility)]` for two-way binding. */
  readonly columnVisibility = model<HellTableColumnVisibilityState>({});

  /** Visible button text and accessible menu label. */
  readonly label = input('Columns');

  /** Optional description exposed to assistive technology on the menu. */
  readonly description = input<string | null>(null);

  /** Menu item text for restoring definition defaults. */
  readonly resetLabel = input('Restore');

  /** Empty text shown when there are no columns. */
  readonly empty = input('No columns available.');

  /** Floating menu placement relative to the trigger. */
  readonly placement = input<HellColumnVisibilitySelectorPlacement>('bottom-end');

  /** Hell button variant used by the trigger. */
  readonly buttonVariant = input<HellButtonVariant>('soft');

  /** Hell button size used by the trigger. */
  readonly buttonSize = input<HellSize>('sm');

  protected readonly menuOpenTriggers: ('click' | 'enter' | 'arrowkey')[] = [
    'click',
    'enter',
    'arrowkey',
  ];
}

function readSignalInput<T>(inputValue: HellTableSignalInput<T>): T {
  return typeof inputValue === 'function' ? (inputValue as Signal<T>)() : inputValue;
}

function columnVisibilityItemFor<TData>(
  column: HellTableColumn<TData>,
  columnVisibility: HellTableColumnVisibilityState,
  noteIdPrefix?: string,
): HellColumnVisibilityPanelItem<TData> {
  const mode = hellTableColumnVisibilityMode(column);
  const disabled = !hellTableColumnCanToggleVisibility(column);
  const note = disabled ? 'Required' : mode === 'initially-hidden' ? 'Initially hidden' : null;
  return {
    column,
    label: columnLabel(column),
    checked: hellTableColumnIsVisible(column, columnVisibility),
    disabled,
    note,
    noteId: note && noteIdPrefix ? `${noteIdPrefix}-${domId(column.id)}-note` : null,
  };
}

function setColumnVisible<TData>(
  columnVisibility: {
    update(
      updateFn: (current: HellTableColumnVisibilityState) => HellTableColumnVisibilityState,
    ): void;
  },
  column: HellTableColumn<TData>,
  visible: boolean,
): void {
  if (!hellTableColumnCanToggleVisibility(column)) return;
  columnVisibility.update((current) => ({ ...current, [column.id]: visible }));
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
