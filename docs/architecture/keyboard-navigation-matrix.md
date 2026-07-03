# Keyboard navigation matrix: menu, select, combobox

- Date: 2026-05-29
- Evidence sources: `ng-primitives@0.123.0`, Hell docs examples under
  `apps/docs/src/app/pages/components/{menu,select,combobox}`, and
  browser coverage in `e2e/menu-select-combobox-keyboard.spec.ts`.

| Component | Pattern followed | Focus model | Covered keyboard contract | Disabled-item contract |
| --- | --- | --- | --- | --- |
| Menu | WAI-ARIA menu button: trigger opens a `role="menu"` of `role="menuitem"` actions. | Roving tabindex moves DOM focus among menu items; Escape returns focus to the trigger. | `Enter`/`Space` on the trigger open the menu; `ArrowDown`/`ArrowUp` move focus; `Home`/`End` jump to first/last enabled item; `Enter`/`Space` activate focused item; `Escape` closes. | Disabled menu items are native disabled buttons and are skipped by roving focus. |
| Select | Select-only combobox with listbox popup: trigger has `role="combobox"`; popup options have `role="option"`. | DOM focus stays on the trigger; `aria-activedescendant` points at the active option while open. | `ArrowDown` opens/moves next; `ArrowUp` moves previous/wraps; `Home`/`End` move first/last; `Enter` commits the active option; `Space` toggles the popup; `Escape` closes. | Disabled options are not made active by `aria-activedescendant` traversal and cannot be selected. |
| Combobox | Editable combobox with listbox popup: text input has `role="combobox"`; popup options have `role="option"`. | DOM focus stays in the input; `aria-activedescendant` points at the active option while open. | `ArrowDown` opens/moves next; `ArrowUp` moves previous/wraps; `Home`/`End` move first/last when the popup is open; `Enter` commits the active option; `Escape` closes. `Space` remains text input, not option activation. | Disabled filtered options are skipped by active-descendant traversal and cannot be selected. |

## Browser coverage

`pnpm run e2e -- menu-select-combobox-keyboard` runs against the public docs examples. The examples intentionally include disabled items so the matrix tests prove real rendered behavior instead of private controller state.
