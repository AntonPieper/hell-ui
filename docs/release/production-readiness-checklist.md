# Production-readiness checklist

Status: **blocked for production-ready claims**.

This checklist is a release-claim gate. Until every blocking item below is checked, Hell UI release notes, README copy, npm descriptions, and docs must keep using internal-beta, beta, or experimental language instead of "production ready".

HELL-049 will automate the broader release gate. This document records the current manual release checklist required by HELL-043.

## Accessibility support gate

Source of truth: the docs app **Accessibility matrix** page at `/accessibility`.

Critical primitive/composite coverage is blocked while any row in the matrix is marked `Critical gap`. As of HELL-043, production-ready accessibility claims are blocked by gaps for:

- Accordion keyboard and role/name/state browser coverage.
- Checkbox keyboard, required, disabled, and indeterminate coverage.
- Date picker calendar-grid keyboard and range-selection coverage.
- Flyout public-page naming and non-modal tab-order coverage.
- Listbox full keyboard matrix plus axe/ARIA coverage.
- Popover focus, close behavior, and accessible naming coverage.
- Radio group browser keyboard coverage.
- Slider keyboard, disabled, vertical, and accessible-name coverage.
- Switch keyboard/name/state/native-parity coverage.
- Tabs tablist keyboard and role/name/state snapshots.
- Tooltip description wiring, delay, hoverable content, and Escape coverage.
- Date input picker/label/error/popover-close coverage.
- Omnibar full keyboard, global hotkey, action-strip, and async-state coverage.
- Time input picker keyboard, labels, invalid draft, and popover-close coverage.

Already covered as release evidence:

- Dialog: focus trap, Tab/Shift+Tab wrap, Escape close, focus restore, axe smoke, and ARIA snapshot.
- Menu: keyboard matrix, disabled-item skip, focus restore, axe smoke, and ARIA snapshot.
- Select: keyboard matrix, disabled option skip, selected state, axe smoke, and ARIA snapshots.
- Combobox: keyboard matrix, filtering, disabled option skip, axe smoke, and ARIA snapshots.
- Table utilities: axe smoke, ARIA snapshot, column-resize browser smoke, and row/cell action behavior.
- PDF viewer shell: axe smoke plus keyboard/control smoke, still experimental.

## Release rule

- [ ] No public production-ready accessibility claim while any critical matrix gap remains.
- [ ] Any accepted exception must cite an owner, rationale, evidence file, and follow-up slice.
- [ ] The matrix must be updated in the same slice that adds or removes a public primitive, composite, or feature entry point.
