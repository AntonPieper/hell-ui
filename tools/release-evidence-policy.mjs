export const releaseEvidencePolicyDocPath = 'docs/release/release-evidence-policy.md';
export const productionReadinessChecklistPath =
  'docs/release/production-readiness-checklist.md';
export const semverPolicyPath = 'docs/release/semver-policy.md';
export const changelogPath = 'CHANGELOG.md';
export const packageManifestPath = 'packages/angular/package.json';
export const releaseEvidenceDirectory = 'test-results/release-evidence';
export const productionReadinessStatus = 'internal-beta-until-gate-passes';

export const changelogRequiredPolicyTerms = [
  'alpha',
  'internal beta',
  'public beta',
  'stable',
  'SemVer',
  'CHANGELOG.md',
];

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
    name: 'no-legacy-alias',
    rationale: 'Removed table aliases stay unavailable before beta.',
  },
  {
    name: 'code-editor',
    rationale: 'CodeMirror peers stay isolated to the code editor feature entrypoint.',
  },
  {
    name: 'pdf-viewer',
    rationale:
      'Explicit split-package release evidence for @hell-ui/pdf-viewer; this scenario proves the companion package and is not @hell-ui/angular peer metadata.',
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
];

export const requiredApiReportPaths = apiReportEntrypoints.map(
  (entrypoint) => `etc/api-reports/${entrypoint.reportFileName}`,
);

export const stableApiReportEntrypoints = apiReportEntrypoints.filter(
  (entrypoint) => entrypoint.policy === 'stable',
);

export const apiReportExceptionEntrypoints = apiReportEntrypoints.filter(
  (entrypoint) => entrypoint.policy !== 'stable',
);

export const requiredFullReleaseTasks = [
  'changelog entry',
  'lint',
  'architecture',
  'ci contract',
  'unit',
  'build lib',
  'pack audit',
  'selected package-consumer scenarios',
  'api report',
  'docs build',
];

export const releaseTasksByCategory = {
  'package-consumer': ['selected package-consumer scenarios'],
  api: ['api report'],
  'docs-budgets': ['docs build'],
  'pack-audit': ['pack audit'],
  'release-dry-run': requiredFullReleaseTasks,
};
