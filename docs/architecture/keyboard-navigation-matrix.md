# Keyboard navigation matrix: menu, select, combobox, time picker

- Date: 2026-05-29
- Updated: 2026-07-27 (time picker columns, #361)
- Evidence sources: `ng-primitives@0.123.0` (originally audited against
  `ng-primitives@0.117.2`), Hell docs examples under
  `apps/docs/src/app/pages/components/{menu,select,combobox,time-picker}`, and
  browser coverage in `e2e/menu-select-combobox-keyboard.spec.ts` and
  `e2e/time-picker-a11y-contracts.spec.ts`.

| Component | Pattern followed | Focus model | Covered keyboard contract | Disabled-item contract |
| --- | --- | --- | --- | --- |
| Menu | WAI-ARIA menu button: trigger opens a `role="menu"` of `role="menuitem"` actions. | Roving tabindex moves DOM focus among menu items; Escape returns focus to the trigger. | `Enter`/`Space` on the trigger open the menu; `ArrowDown`/`ArrowUp` move focus; `Home`/`End` jump to first/last enabled item; `Enter`/`Space` activate focused item; `Escape` closes. | Disabled menu items are native disabled buttons and are skipped by roving focus. |
| Select | Select-only combobox with listbox popup: trigger has `role="combobox"`; popup options have `role="option"`. | DOM focus stays on the trigger; `aria-activedescendant` points at the active option while open. | `ArrowDown` opens/moves next; `ArrowUp` moves previous/wraps; `Home`/`End` move first/last; `Enter` commits the active option; `Space` toggles the popup; `Escape` closes. | Disabled options are not made active by `aria-activedescendant` traversal and cannot be selected. |
| Combobox | Editable combobox with listbox popup: text input has `role="combobox"`; popup options have `role="option"`. | DOM focus stays in the input; `aria-activedescendant` points at the active option while open. | `ArrowDown` opens/moves next; `ArrowUp` moves previous/wraps; `Home`/`End` move first/last when the popup is open; `Enter` commits the active option; `Escape` closes. `Space` remains text input, not option activation. | Disabled filtered options are skipped by active-descendant traversal and cannot be selected. |
| Time Picker | One `role="listbox"` per unit column inside a `role="group"` root; options are `role="option"`. Selection follows focus, so there is no separate activation step. | Roving tabindex moves DOM focus among options; each column is one tab stop, parked on the selected option or the first enabled one. `Tab`/`Shift+Tab` move between columns. | `ArrowDown`/`ArrowUp` move within a column and commit (selection follows focus); `ArrowLeft`/`ArrowRight` move focus to the previous/next column without committing; `Home`/`End` jump to the first/last enabled option; `PageDown`/`PageUp` move by five options. Nothing wraps. Typed digits fill a two-digit accumulator that completes on the second digit, or as soon as no further digit could fit, then snaps to the nearest enabled option and advances to the next column. `Enter`/`Space` do nothing, leaving the surrounding Popover recipe's Escape and Done behavior intact. | Options out of the `min`/`max` bounds carry `aria-disabled`/`data-disabled`, are skipped by arrows, paging, Home/End and typed-digit snapping, and are inert to pointer activation. |

## Browser coverage

`pnpm run e2e -- menu-select-combobox-keyboard` runs against the public docs examples. The examples intentionally include disabled items so the matrix tests prove real rendered behavior instead of private controller state.

`pnpm run e2e -- time-picker-a11y-contracts` covers the Time Picker row the same way: the steps-and-bounds example ships real out-of-bounds options, so tab-stop, arrow, paging, typed-digit, and disabled-option assertions run against rendered DOM.
