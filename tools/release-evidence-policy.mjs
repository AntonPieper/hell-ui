export const semverPolicyPath = 'docs/release/semver-policy.md';
export const changelogPath = 'CHANGELOG.md';
export const packageManifestPath = 'packages/angular/package.json';
export const releaseEvidenceDirectory = 'test-results/release-evidence';

export const releaseCandidateConsumerScenarios = [
  {
    name: 'root-core',
    rationale: 'Root entrypoint stays stable core-only with light peers.',
  },
  {
    name: 'core',
    rationale: 'Narrow core entrypoint remains installable with the light peer group.',
  },
  {
    name: 'testing',
    rationale: 'Stable test harness entrypoint remains installable with the light peer group.',
  },
  {
    name: 'button-ui',
    rationale: 'Button Part Style Map compiles without Tailwind or Hell CSS.',
  },
  {
    name: 'button',
    rationale: 'Styled Button CSS ships compiled recipe utilities and semantic tokens.',
  },
  {
    name: 'primitive-icons-css',
    rationale: 'Icon-backed primitive CSS stays isolated to narrow primitive imports.',
  },
  {
    name: 'pagination',
    rationale: 'Pagination Part Style Map controls ship through the narrow primitive entrypoint.',
  },
  {
    name: 'composite-css',
    rationale: 'Composite CSS stays behind narrow composite entrypoints.',
  },
  {
    name: 'app-shell',
    rationale: 'App Shell composite remains installable without feature peers.',
  },
  {
    name: 'resizable',
    rationale: 'Resizable composite Part Style Map roots ship through the narrow entrypoint.',
  },
  {
    name: 'split-view',
    rationale: 'Split View owned anatomy and icon-backed navigation ship through the narrow entrypoint.',
  },
  {
    name: 'audio-player',
    rationale: 'Base audio player stays separate from transcript runtime peers.',
  },
  {
    name: 'audio-transcript',
    rationale: 'Speech transcript is explicit opt-in and does not pull CodeMirror or pdf.js.',
  },
  {
    name: 'table',
    rationale: 'Table primitives stay free of TanStack and heavy feature peers.',
  },
  {
    name: 'table-tanstack',
    rationale: 'TanStack shell owns the optional TanStack Table peer boundary.',
  },
  {
    name: 'table-tanstack-virtual',
    rationale: 'Virtual row strategy owns the optional TanStack Virtual peer boundary.',
  },
  {
    name: 'code-editor',
    rationale: 'CodeMirror peers stay isolated to the code editor feature entrypoint.',
  },
  {
    name: 'pdf-viewer',
    rationale: 'pdf.js peers stay isolated to the PDF viewer feature entrypoint.',
  },
];

export const releaseCandidateConsumerScenarioNames = releaseCandidateConsumerScenarios.map(
  (scenario) => scenario.name,
);

export const apiReportEntrypoints = [
  {
    id: 'root',
    specifier: '@hell-ui/angular',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular.d.ts',
    reportFileName: 'hell-ui-angular.api.md',
    policy: 'stable',
  },
  {
    id: 'core',
    specifier: '@hell-ui/angular/core',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-core.d.ts',
    reportFileName: 'hell-ui-angular-core.api.md',
    policy: 'stable',
  },
  {
    id: 'internal-hotkeys',
    specifier: '@hell-ui/angular/internal/hotkeys',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-internal-hotkeys.d.ts',
    reportFileName: 'hell-ui-angular-internal-hotkeys.api.md',
    policy: 'internal-report-exception',
    rationale:
      'Temporary internal compatibility guard for the hotkey boundary. API Extractor tracks shape so accidental public drift is reviewed, but this entrypoint is not promoted to Stable.',
  },
  {
    id: 'input',
    specifier: '@hell-ui/angular/input',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-input.d.ts',
    reportFileName: 'hell-ui-angular-input.api.md',
    policy: 'stable',
  },
  {
    id: 'dialpad',
    specifier: '@hell-ui/angular/dialpad',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-dialpad.d.ts',
    reportFileName: 'hell-ui-angular-dialpad.api.md',
    policy: 'stable',
  },
  {
    id: 'testing',
    specifier: '@hell-ui/angular/testing',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-testing.d.ts',
    reportFileName: 'hell-ui-angular-testing.api.md',
    policy: 'stable',
  },

  {
    id: 'accordion',
    specifier: '@hell-ui/angular/accordion',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-accordion.d.ts',
    reportFileName: 'hell-ui-angular-accordion.api.md',
    policy: 'stable',
  },
  {
    id: 'app-shell',
    specifier: '@hell-ui/angular/app-shell',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-app-shell.d.ts',
    reportFileName: 'hell-ui-angular-app-shell.api.md',
    policy: 'stable',
  },
  {
    id: 'avatar',
    specifier: '@hell-ui/angular/avatar',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-avatar.d.ts',
    reportFileName: 'hell-ui-angular-avatar.api.md',
    policy: 'stable',
  },
  {
    id: 'avatar-group',
    specifier: '@hell-ui/angular/avatar-group',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-avatar-group.d.ts',
    reportFileName: 'hell-ui-angular-avatar-group.api.md',
    policy: 'stable',
  },
  {
    id: 'breadcrumbs',
    specifier: '@hell-ui/angular/breadcrumbs',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-breadcrumbs.d.ts',
    reportFileName: 'hell-ui-angular-breadcrumbs.api.md',
    policy: 'stable',
  },
  {
    id: 'button',
    specifier: '@hell-ui/angular/button',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-button.d.ts',
    reportFileName: 'hell-ui-angular-button.api.md',
    policy: 'stable',
  },
  {
    id: 'card',
    specifier: '@hell-ui/angular/card',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-card.d.ts',
    reportFileName: 'hell-ui-angular-card.api.md',
    policy: 'stable',
  },
  {
    id: 'checkbox',
    specifier: '@hell-ui/angular/checkbox',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-checkbox.d.ts',
    reportFileName: 'hell-ui-angular-checkbox.api.md',
    policy: 'stable',
  },
  {
    id: 'date-picker',
    specifier: '@hell-ui/angular/date-picker',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-date-picker.d.ts',
    reportFileName: 'hell-ui-angular-date-picker.api.md',
    policy: 'stable',
  },
  {
    id: 'dialog',
    specifier: '@hell-ui/angular/dialog',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-dialog.d.ts',
    reportFileName: 'hell-ui-angular-dialog.api.md',
    policy: 'stable',
  },
  {
    id: 'drop-zone',
    specifier: '@hell-ui/angular/drop-zone',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-drop-zone.d.ts',
    reportFileName: 'hell-ui-angular-drop-zone.api.md',
    policy: 'stable',
  },
  {
    id: 'field',
    specifier: '@hell-ui/angular/field',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-field.d.ts',
    reportFileName: 'hell-ui-angular-field.api.md',
    policy: 'stable',
  },
  {
    id: 'flyout',
    specifier: '@hell-ui/angular/flyout',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-flyout.d.ts',
    reportFileName: 'hell-ui-angular-flyout.api.md',
    policy: 'stable',
  },
  {
    id: 'icon',
    specifier: '@hell-ui/angular/icon',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-icon.d.ts',
    reportFileName: 'hell-ui-angular-icon.api.md',
    policy: 'stable',
  },
  {
    id: 'listbox',
    specifier: '@hell-ui/angular/listbox',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-listbox.d.ts',
    reportFileName: 'hell-ui-angular-listbox.api.md',
    policy: 'stable',
  },
  {
    id: 'menu',
    specifier: '@hell-ui/angular/menu',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-menu.d.ts',
    reportFileName: 'hell-ui-angular-menu.api.md',
    policy: 'stable',
  },
  {
    id: 'omnibar',
    specifier: '@hell-ui/angular/omnibar',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-omnibar.d.ts',
    reportFileName: 'hell-ui-angular-omnibar.api.md',
    policy: 'stable',
  },
  {
    id: 'pagination',
    specifier: '@hell-ui/angular/pagination',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-pagination.d.ts',
    reportFileName: 'hell-ui-angular-pagination.api.md',
    policy: 'stable',
  },
  {
    id: 'popover',
    specifier: '@hell-ui/angular/popover',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-popover.d.ts',
    reportFileName: 'hell-ui-angular-popover.api.md',
    policy: 'stable',
  },
  {
    id: 'progress',
    specifier: '@hell-ui/angular/progress',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-progress.d.ts',
    reportFileName: 'hell-ui-angular-progress.api.md',
    policy: 'stable',
  },
  {
    id: 'radio',
    specifier: '@hell-ui/angular/radio',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-radio.d.ts',
    reportFileName: 'hell-ui-angular-radio.api.md',
    policy: 'stable',
  },
  {
    id: 'resizable',
    specifier: '@hell-ui/angular/resizable',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-resizable.d.ts',
    reportFileName: 'hell-ui-angular-resizable.api.md',
    policy: 'stable',
  },
  {
    id: 'search',
    specifier: '@hell-ui/angular/search',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-search.d.ts',
    reportFileName: 'hell-ui-angular-search.api.md',
    policy: 'stable',
  },
  {
    id: 'separator',
    specifier: '@hell-ui/angular/separator',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-separator.d.ts',
    reportFileName: 'hell-ui-angular-separator.api.md',
    policy: 'stable',
  },
  {
    id: 'skeleton',
    specifier: '@hell-ui/angular/skeleton',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-skeleton.d.ts',
    reportFileName: 'hell-ui-angular-skeleton.api.md',
    policy: 'stable',
  },
  {
    id: 'slider',
    specifier: '@hell-ui/angular/slider',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-slider.d.ts',
    reportFileName: 'hell-ui-angular-slider.api.md',
    policy: 'stable',
  },
  {
    id: 'spinner',
    specifier: '@hell-ui/angular/spinner',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-spinner.d.ts',
    reportFileName: 'hell-ui-angular-spinner.api.md',
    policy: 'stable',
  },
  {
    id: 'split-view',
    specifier: '@hell-ui/angular/split-view',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-split-view.d.ts',
    reportFileName: 'hell-ui-angular-split-view.api.md',
    policy: 'stable',
  },
  {
    id: 'switch',
    specifier: '@hell-ui/angular/switch',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-switch.d.ts',
    reportFileName: 'hell-ui-angular-switch.api.md',
    policy: 'stable',
  },
  {
    id: 'table',
    specifier: '@hell-ui/angular/table',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-table.d.ts',
    reportFileName: 'hell-ui-angular-table.api.md',
    policy: 'stable',
  },
  {
    id: 'tabs',
    specifier: '@hell-ui/angular/tabs',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-tabs.d.ts',
    reportFileName: 'hell-ui-angular-tabs.api.md',
    policy: 'stable',
  },
  {
    id: 'tag',
    specifier: '@hell-ui/angular/tag',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-tag.d.ts',
    reportFileName: 'hell-ui-angular-tag.api.md',
    policy: 'stable',
  },
  {
    id: 'time-input',
    specifier: '@hell-ui/angular/time-input',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-time-input.d.ts',
    reportFileName: 'hell-ui-angular-time-input.api.md',
    policy: 'stable',
  },
  {
    id: 'toast',
    specifier: '@hell-ui/angular/toast',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-toast.d.ts',
    reportFileName: 'hell-ui-angular-toast.api.md',
    policy: 'stable',
  },
  {
    id: 'toggle',
    specifier: '@hell-ui/angular/toggle',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-toggle.d.ts',
    reportFileName: 'hell-ui-angular-toggle.api.md',
    policy: 'stable',
  },
  {
    id: 'tooltip',
    specifier: '@hell-ui/angular/tooltip',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-tooltip.d.ts',
    reportFileName: 'hell-ui-angular-tooltip.api.md',
    policy: 'stable',
  },
];

/**
 * Entry points deliberately NOT under API-report guard yet because
 * @microsoft/api-extractor crashes analyzing their flattened d.ts
 * ("InternalError: Unable to follow symbol") when a followed cross-entry
 * declaration uses a named @angular/core import alongside a namespace import.
 * Re-probe on api-extractor upgrades and move entries back into
 * apiReportEntrypoints as the defect clears.
 */
export const apiReportBlockedEntrypoints = [
  { id: 'audio-player', specifier: '@hell-ui/angular/audio-player' },
  { id: 'combobox', specifier: '@hell-ui/angular/combobox' },
  { id: 'date-input', specifier: '@hell-ui/angular/date-input' },
  { id: 'select', specifier: '@hell-ui/angular/select' },
];
