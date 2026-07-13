import {
  ChangeDetectionStrategy,
  Component,
  NO_ERRORS_SCHEMA,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import type { InjectionToken, OutputEmitterRef } from '@angular/core';
import type { Placement } from '@floating-ui/dom';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import {
  hellCreateLabels,
  hellPartStyler,
  type HellButtonVariant,
  type HellRecipe,
  type HellSize,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';

/**
 * One selectable option in a Multi-Select Menu Button.
 *
 * `value` is the stable identity carried in the selection array (compared by
 * strict equality); `label` is the human-readable menu-item text.
 */
export interface HellMultiSelectOption<T = string> {
  /** Stable identity emitted in the `selectedChange` array. Compared with `===`. */
  readonly value: T;
  /** Human-readable label rendered as the menu item's text. */
  readonly label: string;
  /** Whether the option can be toggled. Defaults to `false`. */
  readonly disabled?: boolean;
}

/** Built-in strings owned by the multi-select-menu-button entry point's Label Contract. */
export interface HellMultiSelectMenuButtonLabels {
  /** Label of the opt-in reset menu item. */
  readonly reset: string;
}

/** Injection token resolving to the effective multi-select-menu-button labels. */
export const HELL_MULTI_SELECT_MENU_BUTTON_LABELS: InjectionToken<HellMultiSelectMenuButtonLabels> =
  hellCreateLabels<HellMultiSelectMenuButtonLabels>('HELL_MULTI_SELECT_MENU_BUTTON_LABELS', {
    reset: 'Reset to default',
  });

/** Public parts of the HellMultiSelectMenuButton module, styleable through its Part Style Map. */
export type HellMultiSelectMenuButtonPart = 'root' | 'trigger' | 'count';
/** Part Style Map accepted by the HellMultiSelectMenuButton `ui` input. */
export type HellMultiSelectMenuButtonUi = HellUi<HellMultiSelectMenuButtonPart>;

const HELL_MULTI_SELECT_MENU_BUTTON_RECIPE = {
  root: 'inline-flex',
  // The trigger renders on the button primitive; this entry holds only
  // composite refinements, merged into the button's own root recipe.
  trigger: '',
  count:
    'ms-hell-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-hell-pill bg-hell-primary px-hell-1 text-[11px] font-semibold leading-none text-hell-primary-foreground tabular-nums',
} satisfies HellRecipe<HellMultiSelectMenuButtonPart>;

/**
 * `hell-multi-select-menu-button` — a button that opens a menu of checkable
 * options and reflects the selected count on its trigger.
 *
 * Selection is controlled: the consumer binds `options` and `selected` and owns
 * the array. Toggling an option keeps the menu open (menu-item-checkbox
 * semantics) and emits the whole next selection through `selectedChange`; the
 * composite never mutates the consumer's array and emits nothing on first
 * render — the `selected` input is the single source of truth. Escape,
 * arrow-key roving, and typeahead come from the composed menu primitive.
 *
 * `minSelected` (default `0`) is a deselection floor: once the selection is at
 * the floor, the still-selected options are disabled so the selection can never
 * drop below it (a table can never reach zero visible columns). An opt-in
 * `resettable` reset item emits the distinct `reset` event so the consumer can
 * restore its own defaults; its label comes from the Label Contract
 * (`provideHellLabels(HELL_MULTI_SELECT_MENU_BUTTON_LABELS, …)`).
 *
 * The trigger reflects selection through the `count` badge part and the
 * `data-selection-count` / `data-has-selection` attributes. Refine the `root`,
 * `trigger`, and `count` parts through the Part Style Map; the menu, its items,
 * and the check indicator keep the menu entry point's own parts and styling.
 *
 * Usage:
 *   <hell-multi-select-menu-button
 *     label="Columns"
 *     [options]="columnOptions()"
 *     [selected]="visibleColumns()"
 *     [minSelected]="1"
 *     resettable
 *     (selectedChange)="visibleColumns.set($event)"
 *     (reset)="visibleColumns.set(defaultColumns)"
 *   />
 */
@Component({
  selector: 'hell-multi-select-menu-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  // The composed menu directives live in a sibling Package Entry Point, whose
  // metadata the library build's template type-checker cannot see across the
  // entry-point boundary; NO_ERRORS_SCHEMA keeps those bindings from erroring
  // during partial compilation (same pattern as the toolbar overflow menu).
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: `
    <button
      hellButton
      type="button"
      data-slot="trigger"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [ui]="part('trigger')"
      [hellMenuTrigger]="menuTemplate"
      [placement]="placement()"
      [attr.data-selection-count]="selectedCount()"
      [attr.data-has-selection]="selectedCount() > 0 ? '' : null"
    >
      <span class="hell-msmb-label">{{ label() }}</span>
      @if (selectedCount() > 0) {
        <span data-slot="count" aria-hidden="true" [class]="part('count')">{{ selectedCount() }}</span>
      }
      <span class="hell-msmb-chevron" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </span>
    </button>

    <ng-template #menuTemplate>
      <div hellMenu [attr.aria-label]="label() || null">
        @for (option of options(); track option.value) {
          <button
            hellMenuItemCheckbox
            type="button"
            [checked]="isSelected(option)"
            [disabled]="isOptionDisabled(option)"
            (checkedChange)="onToggle(option, $any($event))"
          >
            <span hellMenuItemIndicator></span>
            <span>{{ option.label }}</span>
          </button>
        }
        @if (resettable()) {
          <div hellMenuSeparator></div>
          <button hellMenuItem type="button" (click)="onReset()">{{ labels.reset }}</button>
        }
      </div>
    </ng-template>
  `,
})
export class HellMultiSelectMenuButton<T = string> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMultiSelectMenuButtonPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMultiSelectMenuButtonPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MULTI_SELECT_MENU_BUTTON_RECIPE,
  });

  /** The checkable options, in display order. */
  readonly options = input.required<readonly HellMultiSelectOption<T>[]>();

  /**
   * The currently selected values (controlled). The composite reads this as the
   * single source of truth and never mutates it; the consumer updates it in
   * response to `selectedChange`.
   */
  readonly selected = input<readonly T[]>([]);

  /**
   * Minimum number of selected options. While the selection is at this floor,
   * the still-selected options are disabled so it can never drop below it.
   * Defaults to `0` (no floor).
   */
  readonly minSelected = input(0, { transform: numberAttribute });

  /** Visible trigger text; also the trigger's accessible name and the menu's label. */
  readonly label = input('');

  /** Renders the opt-in reset item at the foot of the menu. Defaults to `false`. */
  readonly resettable = input(false, { transform: booleanAttribute });

  /** Trigger button variant. Defaults to `default`. */
  readonly variant = input<HellButtonVariant>('default');

  /** Trigger button size. Defaults to `sm`. */
  readonly size = input<HellSize>('sm');

  /** Disables the whole control (trigger and menu). Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Menu placement relative to the trigger. Defaults to `bottom-start`. */
  readonly placement = input<Placement>('bottom-start');

  /** Emits the whole next selection array whenever an option is toggled. */
  readonly selectedChange: OutputEmitterRef<T[]> = output<T[]>();

  /** Emits when the opt-in reset item is activated. The consumer restores its own defaults. */
  readonly reset: OutputEmitterRef<void> = output<void>();

  /** Effective label for the built-in reset item. */
  protected readonly labels = inject(HELL_MULTI_SELECT_MENU_BUTTON_LABELS);

  /** Number of selected values, reflected by the trigger badge and data attributes. */
  protected readonly selectedCount = computed(() => this.selected().length);

  /** Whether an option is currently selected. */
  protected isSelected(option: HellMultiSelectOption<T>): boolean {
    return this.selected().some((value) => value === option.value);
  }

  /**
   * Whether an option's checkbox is disabled: either the option opts out, or it
   * is a selected option holding the selection at the `minSelected` floor.
   */
  protected isOptionDisabled(option: HellMultiSelectOption<T>): boolean {
    if (option.disabled) return true;
    return this.isSelected(option) && this.selected().length <= this.minSelected();
  }

  /** Emits the next whole selection for a toggled option, honoring the floor. */
  protected onToggle(option: HellMultiSelectOption<T>, checked: boolean): void {
    const current = this.selected();
    const has = current.some((value) => value === option.value);

    if (checked) {
      if (!has) this.selectedChange.emit([...current, option.value]);
      return;
    }

    if (has && current.length > this.minSelected()) {
      this.selectedChange.emit(current.filter((value) => value !== option.value));
    }
  }

  /** Emits the distinct reset event; the consumer supplies the default state. */
  protected onReset(): void {
    this.reset.emit();
  }
}
