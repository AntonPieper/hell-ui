import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';

interface AccessibilityMatrixRow {
  readonly kind: 'Primitive' | 'Composite' | 'Feature';
  readonly name: string;
  readonly path: string;
  readonly rolePattern: string;
  readonly keyboardCoverage: string;
  readonly automatedCoverage: string;
  readonly knownGaps: string;
  readonly criticalGap?: boolean;
}

const A11Y_MATRIX: readonly AccessibilityMatrixRow[] = [
  {
    kind: 'Primitive',
    name: 'Accordion',
    path: '/components/accordion',
    rolePattern:
      'Disclosure/accordion: heading-wrapped native buttons expose aria-expanded/controls and named panel regions through ng-primitives.',
    keyboardCoverage:
      'Browser contract covers Enter, Space, Tab order, single-collapsible behavior, and multiple-panel state.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshot, and dedicated browser interaction coverage exercise the public accordion examples.',
    knownGaps:
      'No critical gap recorded; large accordions still need consumer review for region proliferation because ng-primitives emits region panels.',
  },
  {
    kind: 'Primitive',
    name: 'Avatar',
    path: '/components/avatar',
    rolePattern:
      'Image with fallback initials; decorative only when consumers provide empty alt text intentionally.',
    keyboardCoverage: 'None required for the avatar surface itself.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Consumer docs still need stronger guidance for meaningful image alt text versus decorative avatars.',
  },
  {
    kind: 'Primitive',
    name: 'Breadcrumbs',
    path: '/components/breadcrumbs',
    rolePattern:
      'Navigation landmark with ordered/list items, links, aria-current page, and optional ellipsis button.',
    keyboardCoverage: 'Native link/button keyboard only.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Hidden-crumb menu behavior is consumer-owned and not covered by a Hell browser contract.',
  },
  {
    kind: 'Primitive',
    name: 'Button',
    path: '/components/button',
    rolePattern: 'Native button or anchor styling; Hell does not replace platform semantics.',
    keyboardCoverage: 'Native Enter/Space for buttons and Enter for links.',
    automatedCoverage: 'Axe docs smoke covers the public button page.',
    knownGaps:
      'No dedicated browser contract beyond platform behavior; icon-only buttons still require consumer names.',
  },
  {
    kind: 'Primitive',
    name: 'Card',
    path: '/components/card',
    rolePattern: 'Semantic-neutral layout container with header/body/footer slots.',
    keyboardCoverage: 'None required unless projected content is interactive.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps: 'Consumers own headings, landmarks, and interactive descendants.',
  },
  {
    kind: 'Primitive',
    name: 'Checkbox',
    path: '/components/checkbox',
    rolePattern:
      'Custom role=checkbox button with required, checked, mixed, and disabled ARIA state plus native input[type=checkbox] variant.',
    keyboardCoverage:
      'Browser contract covers Space toggling, Enter no-op for the custom ARIA checkbox, disabled behavior, and native Space toggling from an indeterminate required state.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshots, browser behavior smoke, and dedicated browser contract cover the public checkbox examples.',
    knownGaps:
      'No critical gap recorded; custom button checkboxes still are not native form constraint controls, so required form semantics belong on input[hellNativeCheckbox].',
  },
  {
    kind: 'Primitive',
    name: 'Combobox',
    path: '/components/combobox',
    rolePattern:
      'Editable combobox with listbox popup and role=option rows; focus stays on the input via aria-activedescendant.',
    keyboardCoverage:
      'Browser matrix covers ArrowUp/Down, Home/End, Enter, Escape, filtering, and disabled option skip.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshots, browser behavior smoke, and dedicated keyboard matrix test cover public examples.',
    knownGaps:
      'Multiple-selection behavior and async option loading are not yet covered by browser tests.',
  },
  {
    kind: 'Primitive',
    name: 'Date picker',
    path: '/components/date-picker',
    rolePattern:
      'Calendar grid/table with month/year navigation buttons and date buttons from ng-primitives.',
    keyboardCoverage:
      'Browser contract covers Arrow/Home/End/PageUp/PageDown navigation, Enter/Space date selection, month/year navigation buttons, disabled bounds, and range reselection.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshots, unit coverage for Hell year-nav disabled state, and a dedicated browser contract cover the public date picker examples.',
    knownGaps:
      'No critical gap recorded for the standalone picker; date input remains a separate composite gap for popover, parsing, and field wiring.',
  },
  {
    kind: 'Primitive',
    name: 'Dialog',
    path: '/components/dialog',
    rolePattern:
      'Modal dialog with title/description wiring, overlay, focus trap, Escape close, outside-click close, and focus restore.',
    keyboardCoverage:
      'Browser contract covers initial focus, Tab/Shift+Tab wrap, Escape close, and trigger focus restore in styled and unstyled modes.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshot, and browser focus-trap contract cover public examples.',
    knownGaps:
      'No critical gap recorded; nested/stacked dialogs remain outside the current contract.',
  },
  {
    kind: 'Primitive',
    name: 'Field',
    path: '/components/field',
    rolePattern:
      'Form-field shell that wires label, description, and error ids to the nested control.',
    keyboardCoverage: 'None required on the shell; nested controls own keyboard behavior.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Consumer can still omit an actual label; docs examples cover the happy path but no browser assertion enforces it.',
  },
  {
    kind: 'Primitive',
    name: 'Flyout',
    path: '/components/flyout',
    rolePattern:
      'Anchored non-modal dialog surface with aria-haspopup/expanded/controls on the trigger and aria-modal=false on the panel.',
    keyboardCoverage:
      'Public browser contract covers trigger relationships, named non-modal dialog state, natural Tab order through boundary and panel controls, outside-focus dismissal, and Escape focus restoration.',
    automatedCoverage:
      'Browser floating-dismissal contract covers runtime dismissal; public docs contract, ARIA snapshot, and axe smoke cover the documented flyout example.',
    knownGaps:
      'No critical gap recorded for the primitive; consumers remain responsible for naming any custom flyout content they provide.',
  },
  {
    kind: 'Primitive',
    name: 'Icon',
    path: '/components/icon',
    rolePattern:
      'Decorative aria-hidden icon by default; optional role=img with aria-label for meaningful standalone icons.',
    keyboardCoverage: 'None required.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Consumers can misuse meaningful icons without labels; no automated example checks that guidance.',
  },
  {
    kind: 'Primitive',
    name: 'Input and native select',
    path: '/components/input',
    rolePattern: 'Native input, textarea, and select elements with invalid-state styling.',
    keyboardCoverage: 'Platform keyboard behavior only.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Relies on Field or consumer labels; no docs axe page currently proves the combined labeled forms story.',
  },
  {
    kind: 'Primitive',
    name: 'Listbox',
    path: '/components/listbox',
    rolePattern: 'role=listbox with role=option children through ng-primitives listbox.',
    keyboardCoverage:
      'Browser matrix covers focus ownership, ArrowDown disabled-option skip, Home, End, Enter, Space, single-select replacement, and multiple-mode toggling.',
    automatedCoverage:
      'Browser behavior smoke, dedicated Listbox keyboard matrix, ARIA snapshot, and docs axe smoke cover the public example.',
    knownGaps:
      'No critical gap recorded; typeahead remains delegated to ng-primitives and is not claimed in the public support matrix.',
  },
  {
    kind: 'Primitive',
    name: 'Menu',
    path: '/components/menu',
    rolePattern:
      'Menu button with role=menu, menuitem rows, groups, separators, and submenu triggers.',
    keyboardCoverage:
      'Browser matrix covers Enter/Space open/activate, ArrowUp/Down, Home/End, disabled skip, Escape, submenu open, and focus restore.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshot, browser behavior smoke, and dedicated keyboard matrix test cover public examples.',
    knownGaps: 'No critical gap recorded; typeahead is not claimed or covered.',
  },
  {
    kind: 'Primitive',
    name: 'Pagination',
    path: '/components/pagination',
    rolePattern:
      'Navigation landmark with native page/first/previous/next/last buttons and current-page labels.',
    keyboardCoverage: 'Native button keyboard only.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'No browser assertion for aria-labels, disabled edge buttons, or current page announcement.',
  },
  {
    kind: 'Primitive',
    name: 'Popover',
    path: '/components/popover',
    rolePattern:
      'Anchored non-modal dialog surface delegated to ng-primitives; documented examples provide consumer-owned aria-labelledby naming.',
    keyboardCoverage:
      'Browser contract covers trigger open, initial focus movement, Tab and Shift+Tab wrapping, Escape close with focus restore, and outside-click close.',
    automatedCoverage:
      'Dedicated browser contract, ARIA snapshots, and docs axe smoke cover the public Popover example.',
    knownGaps:
      'No critical gap recorded; consumers remain responsible for naming custom popover content and testing nested or long-form interactions.',
  },
  {
    kind: 'Primitive',
    name: 'Progress',
    path: '/components/progress',
    rolePattern:
      'role=progressbar with value/max state delegated to ng-primitives and visible labels in examples.',
    keyboardCoverage: 'None required.',
    automatedCoverage:
      'ARIA snapshot covers labeled values on the public docs examples. No axe/browser interaction test yet.',
    knownGaps:
      'No critical gap recorded; indeterminate/labeled edge cases are not in browser evidence.',
  },
  {
    kind: 'Primitive',
    name: 'Radio',
    path: '/components/radio',
    rolePattern: 'Radiogroup with custom button radios plus native radio-group/input variants.',
    keyboardCoverage:
      'Browser contract covers custom radio ArrowRight/ArrowDown next movement, ArrowLeft/ArrowUp previous movement, disabled skip, Home/End movement, checked tab stop, and required group state.',
    automatedCoverage:
      'ARIA snapshots cover named groups and checked state; Playwright assertions cover required state and disabled options. Docs axe smoke and dedicated browser keyboard coverage run in Playwright.',
    knownGaps:
      'No critical gap recorded; consumers still need to provide concise group names and should choose hellNativeRadio when native form semantics are the priority.',
  },
  {
    kind: 'Primitive',
    name: 'Search',
    path: '/components/search',
    rolePattern: 'Native search input styling plus clear button primitive.',
    keyboardCoverage: 'Platform search input and native button keyboard only.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Clear-button accessible name and focus behavior are not browser-covered outside the Omnibar composite.',
  },
  {
    kind: 'Primitive',
    name: 'Select',
    path: '/components/select',
    rolePattern:
      'Select-only combobox trigger with listbox popup and role=option rows; active option via aria-activedescendant.',
    keyboardCoverage:
      'Browser matrix covers ArrowUp/Down, Home/End, Enter, Space, Escape, disabled skip, and selected state.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshots, browser behavior smoke, and dedicated keyboard matrix test cover public examples.',
    knownGaps: 'Multiple selection and form-field error announcement are not yet browser-covered.',
  },
  {
    kind: 'Primitive',
    name: 'Separator',
    path: '/components/separator',
    rolePattern: 'role=separator with horizontal/vertical orientation through ng-primitives.',
    keyboardCoverage: 'None required for static separators.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps: 'Low-risk static primitive; no critical gap recorded.',
  },
  {
    kind: 'Primitive',
    name: 'Skeleton',
    path: '/components/skeleton',
    rolePattern: 'Pure loading placeholder that is aria-hidden by default.',
    keyboardCoverage: 'None required.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Low-risk visual primitive; consumers still need real loading text when state must be announced.',
  },
  {
    kind: 'Primitive',
    name: 'Spinner',
    path: '/components/spinner',
    rolePattern: 'Indeterminate role=status indicator with a configurable loading label.',
    keyboardCoverage: 'None required.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Status naming is unit-level only; the public spinner docs route does not have axe/ARIA evidence.',
  },
  {
    kind: 'Primitive',
    name: 'Slider',
    path: '/components/slider',
    rolePattern:
      'Single-value role=slider through ng-primitives with aria-label, aria-labelledby, or inherited hellField label idrefs supplied by the consumer.',
    keyboardCoverage:
      'Browser contract covers horizontal and vertical ArrowLeft/ArrowRight/ArrowUp/ArrowDown plus Home/End value changes, and proves disabled sliders are not tabbable or keyboard-mutable.',
    automatedCoverage:
      'ARIA snapshots cover labelled, disabled, and vertical slider states; Playwright browser contract covers keyboard and disabled behavior; docs axe smoke includes the Slider page.',
    knownGaps:
      'Touch assistive-technology operation is not release-certified; use native range inputs when a touch-primary production flow needs platform-native slider behavior.',
  },
  {
    kind: 'Primitive',
    name: 'Switch',
    path: '/components/switch',
    rolePattern:
      'Custom button role=switch plus native input[type=checkbox][role=switch] variant; both examples use visible labels as the accessible name.',
    keyboardCoverage:
      'Browser contract covers visible-label activation, custom Space/Enter toggling, native Space toggling, checked state updates, and disabled custom switches.',
    automatedCoverage:
      'ARIA snapshots cover custom checked/disabled states and native labelled state; Playwright browser contract covers keyboard/name/state parity; docs axe smoke includes the Switch page.',
    knownGaps:
      'No critical gap recorded; native input remains preferred when form validity, browser autofill, or platform checkbox behavior is required.',
  },
  {
    kind: 'Primitive',
    name: 'Tabs',
    path: '/components/tabs',
    rolePattern:
      'Named horizontal and vertical tablists with tab buttons linked to tab panels through aria-controls/aria-labelledby via ng-primitives.',
    keyboardCoverage:
      'Browser contract covers automatic horizontal ArrowLeft/Right/Home/End focus and selection plus manual vertical ArrowDown/Home/End focus with Enter/Space activation.',
    automatedCoverage:
      'ARIA snapshots cover tablist names, selected tab state, and linked panels; Playwright browser contract covers keyboard focus/selection behavior; docs axe smoke includes the Tabs page.',
    knownGaps:
      'No critical gap recorded; roving focus does not wrap at list ends in the current ng-primitives Tabset integration.',
  },
  {
    kind: 'Primitive',
    name: 'Tag, badge, and kbd',
    path: '/components/tag',
    rolePattern: 'Semantic-neutral badge/tag styling and native kbd hint styling.',
    keyboardCoverage: 'None required unless used as projected interactive content.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Consumers must not use visual tags as fake buttons without real interactive elements.',
  },
  {
    kind: 'Primitive',
    name: 'Toggle',
    path: '/components/toggle',
    rolePattern: 'Pressed toggle button and role=group toggle groups through ng-primitives.',
    keyboardCoverage: 'Native button Enter/Space; group roving behavior is not browser-covered.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'No browser assertion for aria-pressed/selected state, disabled items, or single versus multiple groups.',
  },
  {
    kind: 'Primitive',
    name: 'Tooltip',
    path: '/components/tooltip',
    rolePattern:
      'role=tooltip floating content delegated to ng-primitives; trigger description relationship is delegated/consumer-dependent.',
    keyboardCoverage: 'Show/hide on focus/hover is not covered by a Hell browser test.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Critical gap: accessible description wiring, delay, hoverable content, and Escape behavior are not release evidence.',
    criticalGap: true,
  },
  {
    kind: 'Composite',
    name: 'App shell',
    path: '/components/app-shell',
    rolePattern:
      'Application layout slots: topbar, sidenav, main content, optional secondary panel, and mobile panel focus trap.',
    keyboardCoverage:
      'Escape/pointer dismissal exists in source for mobile panels; no browser contract covers responsive focus trapping.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Mobile focus trap, restore target, and landmark guidance need browser coverage before broad app-shell claims.',
  },
  {
    kind: 'Composite',
    name: 'Audio player',
    path: '/components/audio-player',
    rolePattern:
      'Native audio element with custom buttons, seek/volume sliders, download link, and optional non-modal transcript flyout from the audio-transcript feature provider.',
    keyboardCoverage:
      'Buttons/sliders use native/Hell primitives; no dedicated browser test covers player keyboard flow.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Speech transcript is explicitly best-effort and not accessibility captions or timed text.',
  },
  {
    kind: 'Composite',
    name: 'Avatar group',
    path: '/components/avatar-group',
    rolePattern: 'Visual stacked-avatar layout; projected controls own semantics.',
    keyboardCoverage: 'None required unless projected content is interactive.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Overflow menus and selection affordances are consumer-composed and not covered here.',
  },
  {
    kind: 'Composite',
    name: 'Date input',
    path: '/components/date-input',
    rolePattern: 'Text input with calendar popover trigger and embedded date picker.',
    keyboardCoverage:
      'Enter commits typed text; picker/popover keyboard behavior lacks browser evidence.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Critical composite gap: invalid draft, picker navigation, field label/error wiring, and popover close are not covered.',
    criticalGap: true,
  },
  {
    kind: 'Composite',
    name: 'Dialpad',
    path: '/components/dialpad',
    rolePattern:
      'role=group with focusable keypad container, native digit/backspace/call buttons, and polite output.',
    keyboardCoverage:
      'Source handles digit keys and Backspace on the focused dialpad; no browser test covers it.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Needs browser coverage for keyboard digit entry, live output, and call/backspace button names.',
  },
  {
    kind: 'Composite',
    name: 'Drop zone',
    path: '/components/drop-zone',
    rolePattern: 'Focusable role=button drop target backed by a native file input seam.',
    keyboardCoverage:
      'Enter/Space/click path is source-backed; browser smoke covers click file selection and drag state stability.',
    automatedCoverage:
      'Browser behavior smoke covers public docs example. No axe smoke or ARIA snapshot yet.',
    knownGaps:
      'No browser assertion for Space key, disabled state, accept/multiple constraints, or error messaging.',
  },
  {
    kind: 'Composite',
    name: 'Omnibar',
    path: '/components/omnibar',
    rolePattern:
      'Command/search combobox with listbox results, aria-activedescendant, optional actions strip, and global hotkey.',
    keyboardCoverage:
      'ARIA snapshot covers expanded input/results; floating-dismissal harness covers portaled F6 panel focus and outside focus close.',
    automatedCoverage:
      'ARIA snapshots and floating-dismissal browser contract cover key state. No axe smoke or full keyboard matrix yet.',
    knownGaps:
      'Critical composite gap: global hotkey, disabled skip, action-strip traversal, submit, and async error states lack browser matrix coverage.',
    criticalGap: true,
  },
  {
    kind: 'Composite',
    name: 'Resizable',
    path: '/components/resizable',
    rolePattern:
      'role=separator handles with aria-orientation, aria-valuemin/max/now, aria-controls, and pane size changes.',
    keyboardCoverage: 'Browser behavior smoke covers focus and ArrowRight value changes.',
    automatedCoverage: 'Browser behavior smoke exists. No axe smoke or ARIA snapshot yet.',
    knownGaps:
      'No browser coverage for vertical, RTL, Home/End, constrained/disabled handles, or pointer drag.',
  },
  {
    kind: 'Composite',
    name: 'Split view',
    path: '/components/split-view',
    rolePattern:
      'Master/detail composition that embeds Resizable handles on wide layouts and a Back button on compact layouts.',
    keyboardCoverage:
      'Inherits Resizable keyboard on wide layout; compact Back button is native. No split-view-specific browser test.',
    automatedCoverage: 'No axe smoke, ARIA snapshot, or browser interaction test yet.',
    knownGaps:
      'Compact breakpoint navigation and detail-open state are not covered by browser tests.',
  },
  {
    kind: 'Composite',
    name: 'Time input',
    path: '/components/time-input',
    rolePattern:
      'Text input with clock popover, segmented spinbutton picker, visible unit labels, and minute preset buttons.',
    keyboardCoverage:
      'Browser contract covers label wiring, invalid drafts, Escape focus restore, spinbutton Arrow/Home/Page keys, and minute presets.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshot, browser behavior smoke, and dedicated time-input contract cover public examples.',
    knownGaps:
      'No critical gap recorded; locale-specific 12-hour display and pointer-drag style interactions are outside the current contract.',
  },
  {
    kind: 'Composite',
    name: 'Toast',
    path: '/components/toast',
    rolePattern:
      'Labeled notification region plus CDK LiveAnnouncer announcements; visible stack is not a live region.',
    keyboardCoverage:
      'Action/close buttons are native. Browser smoke covers region semantics after opening a toast.',
    automatedCoverage:
      'Browser behavior smoke includes an axe check on the notification region. No ARIA snapshot yet.',
    knownGaps:
      'No browser assertion for pausing, persistent toasts, action focus, or custom-template announcement text.',
  },
  {
    kind: 'Feature',
    name: 'Code editor',
    path: '/components/code-editor',
    rolePattern:
      'CodeMirror textbox/editor or read-only viewer with caller-supplied accessible name and read-only state.',
    keyboardCoverage:
      'CodeMirror owns editor editing keys; browser behavior covers tab focus into docs code viewers and copy control focus order.',
    automatedCoverage:
      'Browser behavior smoke covers shared docs code tabs, copy action state, focus, accessible name, and aria-readonly.',
    knownGaps:
      'Experimental/browser-only feature. Do not claim production accessibility beyond the documented CodeMirror role/name/read-only smoke coverage.',
  },
  {
    kind: 'Feature',
    name: 'PDF viewer',
    path: '/components/pdf-viewer',
    rolePattern:
      'Experimental pdf.js viewer shell with toolbar buttons, find searchbox, page spinbutton, zoom select, and thumbnail overview.',
    keyboardCoverage:
      'Browser smoke covers Ctrl/Cmd+F find, Escape close, overview toggle, thumbnail activation, and page spinbutton smoke.',
    automatedCoverage:
      'Axe docs smoke covers the viewer shell. Browser behavior smoke covers key controls. No ARIA snapshot yet.',
    knownGaps:
      'Experimental app-surface recipe: PDF text-layer reading, worker compatibility, printing, and document-level shortcuts are not production proof.',
  },
  {
    kind: 'Feature',
    name: 'Table primitives',
    path: '/components/data-table',
    rolePattern:
      'Native table markup with passive active/selected row highlights, row action buttons/links, checkbox/radio selection controls, sortable header buttons, and role=separator resize handles.',
    keyboardCoverage:
      'Browser behavior covers resize-handle ArrowRight and native row action/selection controls without row-as-button behavior.',
    automatedCoverage:
      'Axe docs smoke, ARIA snapshot, and browser behavior smoke cover public docs examples.',
    knownGaps:
      'Not a data grid. Modern data-table, grid navigation, multi-row selection model, and adapter coverage are deferred to HELL-063 child slices.',
  },
];

@Component({
  selector: 'hd-accessibility',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ...HELL_TABLE_UTILITIES_DIRECTIVES],
  styles: [
    `
      :host {
        display: block;
      }

      .hd-a11y-summary {
        display: grid;
        gap: var(--spacing-hell-3);
        margin-block: var(--spacing-hell-4);
        padding: var(--spacing-hell-4);
        border: 1px solid var(--color-hell-border);
        border-radius: var(--radius-hell-lg);
        background: var(--color-hell-surface);
      }

      .hd-a11y-table-hint {
        display: none;
        margin: 0 0 var(--spacing-hell-2);
        font-size: var(--text-xs);
        color: var(--color-hell-foreground-muted);
      }

      .hd-a11y-table-wrap {
        max-width: 100%;
        overflow: auto;
        margin-block: var(--spacing-hell-4);
      }

      @media (max-width: 640px) {
        .hd-a11y-table-hint {
          display: block;
        }

        .hd-a11y-table-wrap {
          border: 1px solid var(--color-hell-border);
          border-radius: var(--radius-hell-lg);
          padding-block-end: var(--spacing-hell-2);
        }
      }

      .hd-a11y-table {
        min-width: 1120px;
        font-size: var(--text-sm);
        line-height: var(--leading-normal);
      }

      .hd-a11y-col-kind {
        width: 8%;
      }

      .hd-a11y-col-surface {
        width: 14%;
      }

      .hd-a11y-col-role {
        width: 23%;
      }

      .hd-a11y-col-keyboard {
        width: 20%;
      }

      .hd-a11y-col-coverage {
        width: 20%;
      }

      .hd-a11y-col-gaps {
        width: 15%;
      }

      .hd-a11y-table .hell-table-header-cell,
      .hd-a11y-table .hell-table-cell {
        vertical-align: top;
        padding: var(--spacing-hell-3);
        overflow: visible;
        overflow-wrap: break-word;
        white-space: normal;
        word-break: normal;
      }

      .hd-a11y-kind {
        white-space: nowrap;
      }

      .hd-a11y-name {
        font-weight: 700;
      }

      .hd-a11y-critical .hd-a11y-gap,
      .hd-a11y-blocked {
        color: var(--color-hell-danger);
        font-weight: 700;
      }
    `,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Accessibility support matrix</h1>
        <p>
          This matrix is the support claim for public Hell primitives, composites, and feature entry
          points. It is intentionally conservative: a component is marked covered only when a
          browser, axe, or ARIA snapshot test exists in the repository.
        </p>

        <div class="hd-a11y-summary" aria-label="Accessibility release status">
          <p>
            <strong class="hd-a11y-blocked"
              >Production-ready accessibility claim is blocked.</strong
            >
            {{ criticalGapCount }} public surfaces still have critical coverage gaps. Release notes,
            package README copy, and package registry descriptions must stay at internal beta /
            experimental language until the release checklist is green.
          </p>
          <p>
            Evidence sources: <code>docs-axe-smoke.spec.ts</code>,
            <code>aria-snapshots.spec.ts</code>, component-specific
            <code>*-a11y-contracts.spec.ts</code> files such as
            <code>tabs-a11y-contracts.spec.ts</code>, <code>ui-behavior.spec.ts</code>,
            <code>menu-select-combobox-keyboard.spec.ts</code>, and
            <code>floating-dismissal.spec.ts</code>.
          </p>
        </div>
      </div>

      <p id="hd-a11y-table-hint" class="hd-a11y-table-hint">
        Scroll horizontally to view role, keyboard, coverage, and known-gap columns.
      </p>
      <div
        hellTableContainer
        class="hd-a11y-table-wrap"
        role="region"
        aria-label="Component accessibility support matrix"
        aria-describedby="hd-a11y-table-hint"
        tabindex="0"
      >
        <table hellTable contentWidth class="hd-a11y-table">
          <colgroup>
            <col class="hd-a11y-col-kind" />
            <col class="hd-a11y-col-surface" />
            <col class="hd-a11y-col-role" />
            <col class="hd-a11y-col-keyboard" />
            <col class="hd-a11y-col-coverage" />
            <col class="hd-a11y-col-gaps" />
          </colgroup>

          <thead hellTableHead>
            <tr hellTableRow>
              <th hellTableHeaderCell scope="col">Type</th>
              <th hellTableHeaderCell scope="col">Surface</th>
              <th hellTableHeaderCell scope="col">Role pattern</th>
              <th hellTableHeaderCell scope="col">Keyboard coverage</th>
              <th hellTableHeaderCell scope="col">Axe / ARIA / browser-test coverage</th>
              <th hellTableHeaderCell scope="col">Known gaps</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (row of matrix; track row.kind + ':' + row.name) {
              <tr hellTableRow [class.hd-a11y-critical]="row.criticalGap">
                <td hellTableCell class="hd-a11y-kind">{{ row.kind }}</td>
                <td hellTableCell>
                  <a class="hd-a11y-name" [routerLink]="row.path">{{ row.name }}</a>
                </td>
                <td hellTableCell>{{ row.rolePattern }}</td>
                <td hellTableCell>{{ row.keyboardCoverage }}</td>
                <td hellTableCell>{{ row.automatedCoverage }}</td>
                <td hellTableCell class="hd-a11y-gap">{{ row.knownGaps }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="hd-prose">
        <h2>How to read this</h2>
        <ul>
          <li>
            <strong>Native</strong> means Hell is intentionally relying on the browser element's
            built-in keyboard behavior instead of reimplementing it.
          </li>
          <li>
            <strong>Delegated</strong> means the role/keyboard contract comes from ng-primitives,
            CDK, CodeMirror, or pdf.js, but Hell still needs browser evidence before it becomes a
            production support claim.
          </li>
          <li>
            <strong>Critical gap</strong> means release copy must not say production-ready for that
            primitive/composite until the gap has a browser test or an explicit accepted exception.
          </li>
        </ul>
      </div>
    </article>
  `,
})
export class AccessibilityPage {
  protected readonly matrix = A11Y_MATRIX;
  protected readonly criticalGapCount = A11Y_MATRIX.filter((row) => row.criticalGap).length;
}
