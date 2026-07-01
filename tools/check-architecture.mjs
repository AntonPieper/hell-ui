import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

import {
  entrypointCategories,
  entrypointMetadataFileName,
  entrypointPublicApiFiles,
  entrypointStyleExports,
  libraryRoot,
  packageExportPath,
  renderNgPackageFile,
  renderPackageJsonExports,
  renderPublicApiFile,
  secondaryPackageEntrypoints,
  sourcePackageCondition,
} from './entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const docsExampleImportBoundaryDocPath = 'docs/architecture/docs-example-import-boundaries.md';

const allowedDocsLazyRouteCrossImports = [
  {
    from: 'apps/docs/src/app/pages/components/flyout/flyout.page.ts',
    to: 'apps/docs/src/app/pages/testing/floating-dismissal-harness.page.ts',
    rationale:
      'Flyout exposes the query-param-only floating dismissal browser harness; it is deliberately bundled only with the lazy flyout route, not the docs shell.',
  },
];

const docsHeavyLazyRoutePolicies = [
  {
    id: 'pdf-viewer-docs',
    label: 'PDF viewer docs examples',
    routePath: '/components/pdf-viewer',
    boundary: 'components/pdf-viewer',
    packageSpecifiers: ['@hell-ui/pdf-viewer', 'pdfjs-dist'],
    sourceFragments: [
      '@hell-ui/pdf-viewer/styles',
      'hell-ui/pdf-viewer/styles/pdf-viewer.css',
      'pdfjs/pdf_viewer.css',
    ],
  },
  {
    id: 'code-editor-docs',
    label: 'Code editor docs examples',
    routePath: '/components/code-editor',
    boundary: 'components/code-editor',
    packageSpecifiers: ['@hell-ui/angular/features/code-editor', '@codemirror/'],
    sourceFragments: ['@hell-ui/angular/features/code-editor/styles.css'],
  },
  {
    id: 'audio-player-docs',
    label: 'Audio player docs examples',
    routePath: '/components/audio-player',
    boundary: 'components/audio-player',
    packageSpecifiers: [
      '@hell-ui/angular/audio-player',
      '@hell-ui/angular/features/audio-transcript',
    ],
    sourceFragments: [],
  },
];

const codeEditorEntrypointSpecifier = '@hell-ui/angular/features/code-editor';
const docsCodePreviewLazyWrapperPath = 'apps/docs/src/app/shared/docs-code-viewer.ts';
const codeMirrorPackageSpecifierPrefixes = ['@codemirror/', '@lezer/'];
const audioTranscriptEntrypointSpecifier = '@hell-ui/angular/features/audio-transcript';
const audioTranscriptRuntimeTerms = [
  { label: 'SpeechRecognition', pattern: /\bSpeechRecognition\b|\bwebkitSpeechRecognition\b/ },
  { label: 'captureStream()', pattern: /\bcaptureStream\b/ },
];

// Explicit not-yet-migrated allowlist for the legacy Style Opt-Out base.
// Remove a symbol here as soon as it migrates to HellPartStyleable; new public
// modules must not extend HellStyleable.
const legacyStyleableAllowlist = new Set([
  'HellAvatarGroup',
  'HellAvatarGroupItem',
  'HellAvatarGroupOverflow',
]);

const migratedPartStyleMapModules = [
  {
    className: 'HellAccordion',
    partType: 'HellAccordionPart',
    uiType: 'HellAccordionUi',
    entrypointId: 'accordion',
    sourcePath: 'packages/angular/accordion/accordion.ts',
    publicApiPath: 'packages/angular/accordion/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-accordion',
    componentVariablePrefix: '--hell-accordion-',
  },
  {
    className: 'HellAccordionItem',
    partType: 'HellAccordionItemPart',
    uiType: 'HellAccordionItemUi',
    entrypointId: 'accordion',
    sourcePath: 'packages/angular/accordion/accordion.ts',
    publicApiPath: 'packages/angular/accordion/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-accordion-item',
    componentVariablePrefix: '--hell-accordion-item-',
  },
  {
    className: 'HellAccordionTrigger',
    partType: 'HellAccordionTriggerPart',
    uiType: 'HellAccordionTriggerUi',
    entrypointId: 'accordion',
    sourcePath: 'packages/angular/accordion/accordion.ts',
    publicApiPath: 'packages/angular/accordion/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-accordion-trigger',
    componentVariablePrefix: '--hell-accordion-trigger-',
  },
  {
    className: 'HellAccordionContent',
    partType: 'HellAccordionContentPart',
    uiType: 'HellAccordionContentUi',
    entrypointId: 'accordion',
    sourcePath: 'packages/angular/accordion/accordion.ts',
    publicApiPath: 'packages/angular/accordion/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-accordion-content',
    componentVariablePrefix: '--hell-accordion-content-',
  },
  {
    className: 'HellButton',
    partType: 'HellButtonPart',
    uiType: 'HellButtonUi',
    entrypointId: 'button',
    sourcePath: 'packages/angular/button/button.ts',
    publicApiPath: 'packages/angular/button/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-button',
    componentVariablePrefix: '--hell-button-',
  },
  {
    className: 'HellCard',
    partType: 'HellCardPart',
    uiType: 'HellCardUi',
    entrypointId: 'card',
    sourcePath: 'packages/angular/card/card.ts',
    publicApiPath: 'packages/angular/card/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-card',
    componentVariablePrefix: '--hell-card-',
  },
  {
    className: 'HellCardHeader',
    partType: 'HellCardHeaderPart',
    uiType: 'HellCardHeaderUi',
    entrypointId: 'card',
    sourcePath: 'packages/angular/card/card.ts',
    publicApiPath: 'packages/angular/card/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-card-header',
    componentVariablePrefix: '--hell-card-header-',
  },
  {
    className: 'HellCardBody',
    partType: 'HellCardBodyPart',
    uiType: 'HellCardBodyUi',
    entrypointId: 'card',
    sourcePath: 'packages/angular/card/card.ts',
    publicApiPath: 'packages/angular/card/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-card-body',
    componentVariablePrefix: '--hell-card-body-',
  },
  {
    className: 'HellCardFooter',
    partType: 'HellCardFooterPart',
    uiType: 'HellCardFooterUi',
    entrypointId: 'card',
    sourcePath: 'packages/angular/card/card.ts',
    publicApiPath: 'packages/angular/card/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-card-footer',
    componentVariablePrefix: '--hell-card-footer-',
  },
  {
    className: 'HellField',
    partType: 'HellFieldPart',
    uiType: 'HellFieldUi',
    entrypointId: 'field',
    sourcePath: 'packages/angular/field/field.ts',
    publicApiPath: 'packages/angular/field/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-field',
    componentVariablePrefix: '--hell-field-',
  },
  {
    className: 'HellFieldLabel',
    partType: 'HellFieldLabelPart',
    uiType: 'HellFieldLabelUi',
    entrypointId: 'field',
    sourcePath: 'packages/angular/field/field.ts',
    publicApiPath: 'packages/angular/field/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-field-label',
    componentVariablePrefix: '--hell-field-label-',
  },
  {
    className: 'HellFieldDescription',
    partType: 'HellFieldDescriptionPart',
    uiType: 'HellFieldDescriptionUi',
    entrypointId: 'field',
    sourcePath: 'packages/angular/field/field.ts',
    publicApiPath: 'packages/angular/field/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-field-description',
    componentVariablePrefix: '--hell-field-description-',
  },
  {
    className: 'HellFieldError',
    partType: 'HellFieldErrorPart',
    uiType: 'HellFieldErrorUi',
    entrypointId: 'field',
    sourcePath: 'packages/angular/field/field.ts',
    publicApiPath: 'packages/angular/field/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-field-error',
    componentVariablePrefix: '--hell-field-error-',
  },
  {
    className: 'HellTabset',
    partType: 'HellTabsetPart',
    uiType: 'HellTabsetUi',
    entrypointId: 'tabs',
    sourcePath: 'packages/angular/tabs/tabs.ts',
    publicApiPath: 'packages/angular/tabs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tabs',
    componentVariablePrefix: '--hell-tabs-',
  },
  {
    className: 'HellTabList',
    partType: 'HellTabListPart',
    uiType: 'HellTabListUi',
    entrypointId: 'tabs',
    sourcePath: 'packages/angular/tabs/tabs.ts',
    publicApiPath: 'packages/angular/tabs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tab-list',
    componentVariablePrefix: '--hell-tab-list-',
  },
  {
    className: 'HellTab',
    partType: 'HellTabPart',
    uiType: 'HellTabUi',
    entrypointId: 'tabs',
    sourcePath: 'packages/angular/tabs/tabs.ts',
    publicApiPath: 'packages/angular/tabs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tab',
    componentVariablePrefix: '--hell-tab-',
  },
  {
    className: 'HellTabPanel',
    partType: 'HellTabPanelPart',
    uiType: 'HellTabPanelUi',
    entrypointId: 'tabs',
    sourcePath: 'packages/angular/tabs/tabs.ts',
    publicApiPath: 'packages/angular/tabs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tab-panel',
    componentVariablePrefix: '--hell-tab-panel-',
  },
  {
    className: 'HellInput',
    partType: 'HellInputPart',
    uiType: 'HellInputUi',
    entrypointId: 'input',
    sourcePath: 'packages/angular/input/input.ts',
    publicApiPath: 'packages/angular/input/public-api.ts',
    apiReportFiles: ['hell-ui-angular-input.api.md'],
    legacyClass: 'hell-input',
    componentVariablePrefix: '--hell-input-',
  },
  {
    className: 'HellNativeSelect',
    partType: 'HellNativeSelectPart',
    uiType: 'HellNativeSelectUi',
    entrypointId: 'input',
    sourcePath: 'packages/angular/input/input.ts',
    publicApiPath: 'packages/angular/input/public-api.ts',
    apiReportFiles: ['hell-ui-angular-input.api.md'],
    legacyClass: 'hell-native-select',
    componentVariablePrefix: '--hell-native-select-',
  },
  {
    className: 'HellTextarea',
    partType: 'HellTextareaPart',
    uiType: 'HellTextareaUi',
    entrypointId: 'input',
    sourcePath: 'packages/angular/input/input.ts',
    publicApiPath: 'packages/angular/input/public-api.ts',
    apiReportFiles: ['hell-ui-angular-input.api.md'],
    legacyClass: 'hell-textarea',
    componentVariablePrefix: '--hell-textarea-',
  },
  {
    className: 'HellCheckbox',
    partType: 'HellCheckboxPart',
    uiType: 'HellCheckboxUi',
    entrypointId: 'checkbox',
    sourcePath: 'packages/angular/checkbox/checkbox.ts',
    publicApiPath: 'packages/angular/checkbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-checkbox',
    componentVariablePrefix: '--hell-checkbox-',
  },
  {
    className: 'HellNativeCheckbox',
    partType: 'HellNativeCheckboxPart',
    uiType: 'HellNativeCheckboxUi',
    entrypointId: 'checkbox',
    sourcePath: 'packages/angular/checkbox/checkbox.ts',
    publicApiPath: 'packages/angular/checkbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-checkbox',
    componentVariablePrefix: '--hell-checkbox-',
  },
  {
    className: 'HellRadioGroup',
    partType: 'HellRadioGroupPart',
    uiType: 'HellRadioGroupUi',
    entrypointId: 'radio',
    sourcePath: 'packages/angular/radio/radio.ts',
    publicApiPath: 'packages/angular/radio/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-radio-group',
    componentVariablePrefix: '--hell-radio-group-',
  },
  {
    className: 'HellRadio',
    partType: 'HellRadioPart',
    uiType: 'HellRadioUi',
    entrypointId: 'radio',
    sourcePath: 'packages/angular/radio/radio.ts',
    publicApiPath: 'packages/angular/radio/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-radio',
    componentVariablePrefix: '--hell-radio-',
  },
  {
    className: 'HellNativeRadioGroup',
    partType: 'HellNativeRadioGroupPart',
    uiType: 'HellNativeRadioGroupUi',
    entrypointId: 'radio',
    sourcePath: 'packages/angular/radio/radio.ts',
    publicApiPath: 'packages/angular/radio/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-radio-group',
    componentVariablePrefix: '--hell-radio-group-',
  },
  {
    className: 'HellNativeRadio',
    partType: 'HellNativeRadioPart',
    uiType: 'HellNativeRadioUi',
    entrypointId: 'radio',
    sourcePath: 'packages/angular/radio/radio.ts',
    publicApiPath: 'packages/angular/radio/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-radio',
    componentVariablePrefix: '--hell-radio-',
  },
  {
    className: 'HellSwitch',
    partType: 'HellSwitchPart',
    uiType: 'HellSwitchUi',
    entrypointId: 'switch',
    sourcePath: 'packages/angular/switch/switch.ts',
    publicApiPath: 'packages/angular/switch/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-switch',
    componentVariablePrefix: '--hell-switch-',
  },
  {
    className: 'HellNativeSwitch',
    partType: 'HellNativeSwitchPart',
    uiType: 'HellNativeSwitchUi',
    entrypointId: 'switch',
    sourcePath: 'packages/angular/switch/switch.ts',
    publicApiPath: 'packages/angular/switch/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-switch',
    componentVariablePrefix: '--hell-switch-',
  },
  {
    className: 'HellToggle',
    partType: 'HellTogglePart',
    uiType: 'HellToggleUi',
    entrypointId: 'toggle',
    sourcePath: 'packages/angular/toggle/toggle.ts',
    publicApiPath: 'packages/angular/toggle/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-toggle',
    componentVariablePrefix: '--hell-toggle-',
  },
  {
    className: 'HellToggleGroup',
    partType: 'HellToggleGroupPart',
    uiType: 'HellToggleGroupUi',
    entrypointId: 'toggle',
    sourcePath: 'packages/angular/toggle/toggle.ts',
    publicApiPath: 'packages/angular/toggle/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-toggle-group',
    componentVariablePrefix: '--hell-toggle-group-',
  },
  {
    className: 'HellToggleGroupItem',
    partType: 'HellToggleGroupItemPart',
    uiType: 'HellToggleGroupItemUi',
    entrypointId: 'toggle',
    sourcePath: 'packages/angular/toggle/toggle.ts',
    publicApiPath: 'packages/angular/toggle/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-toggle',
    componentVariablePrefix: '--hell-toggle-',
  },
  {
    className: 'HellSlider',
    partType: 'HellSliderPart',
    uiType: 'HellSliderUi',
    entrypointId: 'slider',
    sourcePath: 'packages/angular/slider/slider.ts',
    publicApiPath: 'packages/angular/slider/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-slider',
    componentVariablePrefix: '--hell-slider-',
  },
  {
    className: 'HellDialpad',
    partType: 'HellDialpadPart',
    uiType: 'HellDialpadUi',
    entrypointId: 'dialpad',
    sourcePath: 'packages/angular/dialpad/dialpad.ts',
    publicApiPath: 'packages/angular/dialpad/public-api.ts',
    apiReportFiles: ['hell-ui-angular-dialpad.api.md'],
    legacyClass: 'hell-dialpad',
    componentVariablePrefix: '--hell-dialpad-',
  },
  {
    className: 'HellDialogOverlay',
    partType: 'HellDialogOverlayPart',
    uiType: 'HellDialogOverlayUi',
    entrypointId: 'dialog',
    sourcePath: 'packages/angular/dialog/dialog.ts',
    publicApiPath: 'packages/angular/dialog/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-dialog-overlay',
  },
  {
    className: 'HellDialog',
    partType: 'HellDialogPart',
    uiType: 'HellDialogUi',
    entrypointId: 'dialog',
    sourcePath: 'packages/angular/dialog/dialog.ts',
    publicApiPath: 'packages/angular/dialog/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-dialog',
  },
  {
    className: 'HellDialogTitle',
    partType: 'HellDialogTitlePart',
    uiType: 'HellDialogTitleUi',
    entrypointId: 'dialog',
    sourcePath: 'packages/angular/dialog/dialog.ts',
    publicApiPath: 'packages/angular/dialog/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-dialog-title',
  },
  {
    className: 'HellDialogDescription',
    partType: 'HellDialogDescriptionPart',
    uiType: 'HellDialogDescriptionUi',
    entrypointId: 'dialog',
    sourcePath: 'packages/angular/dialog/dialog.ts',
    publicApiPath: 'packages/angular/dialog/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-dialog-description',
  },
  {
    className: 'HellToaster',
    partType: 'HellToasterPart',
    uiType: 'HellToasterUi',
    entrypointId: 'toast',
    sourcePath: 'packages/angular/toast/toast.ts',
    publicApiPath: 'packages/angular/toast/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-toaster',
  },
  {
    className: 'HellAudioPlayer',
    partType: 'HellAudioPlayerPart',
    uiType: 'HellAudioPlayerUi',
    entrypointId: 'audio-player',
    sourcePath: 'packages/angular/audio-player/audio-player.ts',
    publicApiPath: 'packages/angular/audio-player/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-audio',
  },
  {
    className: 'HellOmnibar',
    partType: 'HellOmnibarPart',
    uiType: 'HellOmnibarUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar',
  },
  {
    className: 'HellOmnibarPanel',
    partType: 'HellOmnibarPanelPart',
    uiType: 'HellOmnibarPanelUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-panel-content',
  },
  {
    className: 'HellOmnibarGroup',
    partType: 'HellOmnibarGroupPart',
    uiType: 'HellOmnibarGroupUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-group',
  },
  {
    className: 'HellOmnibarGroupLabel',
    partType: 'HellOmnibarGroupLabelPart',
    uiType: 'HellOmnibarGroupLabelUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-group-label',
  },
  {
    className: 'HellOmnibarItem',
    partType: 'HellOmnibarItemPart',
    uiType: 'HellOmnibarItemUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-item',
  },
  {
    className: 'HellOmnibarItemIcon',
    partType: 'HellOmnibarItemIconPart',
    uiType: 'HellOmnibarItemIconUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-item-icon',
  },
  {
    className: 'HellOmnibarItemText',
    partType: 'HellOmnibarItemTextPart',
    uiType: 'HellOmnibarItemTextUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-item-text',
  },
  {
    className: 'HellOmnibarItemSubtext',
    partType: 'HellOmnibarItemSubtextPart',
    uiType: 'HellOmnibarItemSubtextUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-item-subtext',
  },
  {
    className: 'HellOmnibarItemTrailing',
    partType: 'HellOmnibarItemTrailingPart',
    uiType: 'HellOmnibarItemTrailingUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-item-trailing',
  },
  {
    className: 'HellOmnibarChip',
    partType: 'HellOmnibarChipPart',
    uiType: 'HellOmnibarChipUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-chip',
  },
  {
    className: 'HellOmnibarChipRemove',
    partType: 'HellOmnibarChipRemovePart',
    uiType: 'HellOmnibarChipRemoveUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-chip-remove',
  },
  {
    className: 'HellOmnibarActionsStrip',
    partType: 'HellOmnibarActionsStripPart',
    uiType: 'HellOmnibarActionsStripUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-actions-strip',
  },
  {
    className: 'HellOmnibarAction',
    partType: 'HellOmnibarActionPart',
    uiType: 'HellOmnibarActionUi',
    entrypointId: 'omnibar',
    sourcePath: 'packages/angular/omnibar/omnibar.ts',
    publicApiPath: 'packages/angular/omnibar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-omnibar-action',
  },
  {
    className: 'HellCodeEditor',
    partType: 'HellCodeEditorPart',
    uiType: 'HellCodeEditorUi',
    entrypointId: 'code-editor',
    sourcePath: 'packages/angular/features/code-editor/code-editor.ts',
    publicApiPath: 'packages/angular/features/code-editor/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-code',
  },
  {
    className: 'HellDateInput',
    partType: 'HellDateInputPart',
    uiType: 'HellDateInputUi',
    entrypointId: 'date-input',
    sourcePath: 'packages/angular/date-input/date-input.ts',
    publicApiPath: 'packages/angular/date-input/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-date-input',
    componentVariablePrefix: '--hell-date-input-',
  },
  {
    className: 'HellTimeInput',
    partType: 'HellTimeInputPart',
    uiType: 'HellTimeInputUi',
    entrypointId: 'time-input',
    sourcePath: 'packages/angular/time-input/time-input.ts',
    publicApiPath: 'packages/angular/time-input/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-time-input',
    componentVariablePrefix: '--hell-time-input-',
  },
  {
    className: 'HellDatePicker',
    partType: 'HellDatePickerPart',
    uiType: 'HellDatePickerUi',
    entrypointId: 'date-picker',
    sourcePath: 'packages/angular/date-picker/date-picker.ts',
    publicApiPath: 'packages/angular/date-picker/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-date-picker',
    componentVariablePrefix: '--hell-date-picker-',
  },
  {
    className: 'HellDateRangePicker',
    partType: 'HellDateRangePickerPart',
    uiType: 'HellDateRangePickerUi',
    entrypointId: 'date-picker',
    sourcePath: 'packages/angular/date-picker/date-picker.ts',
    publicApiPath: 'packages/angular/date-picker/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-date-picker',
    componentVariablePrefix: '--hell-date-picker-',
  },
  {
    className: 'HellAvatar',
    partType: 'HellAvatarPart',
    uiType: 'HellAvatarUi',
    entrypointId: 'avatar',
    sourcePath: 'packages/angular/avatar/avatar.ts',
    publicApiPath: 'packages/angular/avatar/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-avatar',
    componentVariablePrefix: '--hell-avatar-',
  },
  {
    className: 'HellBreadcrumbs',
    partType: 'HellBreadcrumbsPart',
    uiType: 'HellBreadcrumbsUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs',
  },
  {
    className: 'HellBreadcrumbList',
    partType: 'HellBreadcrumbListPart',
    uiType: 'HellBreadcrumbListUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumb-list',
  },
  {
    className: 'HellBreadcrumbItem',
    partType: 'HellBreadcrumbItemPart',
    uiType: 'HellBreadcrumbItemUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs-item',
  },
  {
    className: 'HellBreadcrumbLink',
    partType: 'HellBreadcrumbLinkPart',
    uiType: 'HellBreadcrumbLinkUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs-link',
  },
  {
    className: 'HellBreadcrumbPage',
    partType: 'HellBreadcrumbPagePart',
    uiType: 'HellBreadcrumbPageUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs-page',
  },
  {
    className: 'HellBreadcrumbSeparator',
    partType: 'HellBreadcrumbSeparatorPart',
    uiType: 'HellBreadcrumbSeparatorUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs-separator',
  },
  {
    className: 'HellBreadcrumbEllipsis',
    partType: 'HellBreadcrumbEllipsisPart',
    uiType: 'HellBreadcrumbEllipsisUi',
    entrypointId: 'breadcrumbs',
    sourcePath: 'packages/angular/breadcrumbs/breadcrumbs.ts',
    publicApiPath: 'packages/angular/breadcrumbs/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-breadcrumbs-ellipsis',
  },
  {
    className: 'HellIcon',
    partType: 'HellIconPart',
    uiType: 'HellIconUi',
    entrypointId: 'icon',
    sourcePath: 'packages/angular/icon/icon.ts',
    publicApiPath: 'packages/angular/icon/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-icon',
  },
  {
    className: 'HellSkeleton',
    partType: 'HellSkeletonPart',
    uiType: 'HellSkeletonUi',
    entrypointId: 'skeleton',
    sourcePath: 'packages/angular/skeleton/skeleton.ts',
    publicApiPath: 'packages/angular/skeleton/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-skeleton',
    componentVariablePrefix: '--hell-skeleton-',
  },
  {
    className: 'HellSpinner',
    partType: 'HellSpinnerPart',
    uiType: 'HellSpinnerUi',
    entrypointId: 'skeleton',
    sourcePath: 'packages/angular/skeleton/skeleton.ts',
    publicApiPath: 'packages/angular/skeleton/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-spinner',
    componentVariablePrefix: '--hell-spinner-',
  },
  {
    className: 'HellTag',
    partType: 'HellTagPart',
    uiType: 'HellTagUi',
    entrypointId: 'tag',
    sourcePath: 'packages/angular/tag/tag.ts',
    publicApiPath: 'packages/angular/tag/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tag',
    componentVariablePrefix: '--hell-tag-',
  },
  {
    className: 'HellBadge',
    partType: 'HellBadgePart',
    uiType: 'HellBadgeUi',
    entrypointId: 'tag',
    sourcePath: 'packages/angular/tag/tag.ts',
    publicApiPath: 'packages/angular/tag/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-badge',
    componentVariablePrefix: '--hell-badge-',
  },
  {
    className: 'HellKbd',
    partType: 'HellKbdPart',
    uiType: 'HellKbdUi',
    entrypointId: 'tag',
    sourcePath: 'packages/angular/tag/tag.ts',
    publicApiPath: 'packages/angular/tag/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-kbd',
    componentVariablePrefix: '--hell-kbd-',
  },
  {
    className: 'HellSeparator',
    partType: 'HellSeparatorPart',
    uiType: 'HellSeparatorUi',
    entrypointId: 'separator',
    sourcePath: 'packages/angular/separator/separator.ts',
    publicApiPath: 'packages/angular/separator/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-separator',
    componentVariablePrefix: '--hell-separator-',
  },
  {
    className: 'HellProgress',
    partType: 'HellProgressPart',
    uiType: 'HellProgressUi',
    entrypointId: 'progress',
    sourcePath: 'packages/angular/progress/progress.ts',
    publicApiPath: 'packages/angular/progress/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-progress',
    componentVariablePrefix: '--hell-progress-',
  },
  {
    className: 'HellProgressBar',
    partType: 'HellProgressBarPart',
    uiType: 'HellProgressBarUi',
    entrypointId: 'progress',
    sourcePath: 'packages/angular/progress/progress.ts',
    publicApiPath: 'packages/angular/progress/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-progress-bar',
    componentVariablePrefix: '--hell-progress-bar-',
  },
  {
    className: 'HellSearch',
    partType: 'HellSearchPart',
    uiType: 'HellSearchUi',
    entrypointId: 'search',
    sourcePath: 'packages/angular/search/search.ts',
    publicApiPath: 'packages/angular/search/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-search',
  },
  {
    className: 'HellSearchClear',
    partType: 'HellSearchClearPart',
    uiType: 'HellSearchClearUi',
    entrypointId: 'search',
    sourcePath: 'packages/angular/search/search.ts',
    publicApiPath: 'packages/angular/search/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-search-clear',
  },
  {
    className: 'HellDropZone',
    partType: 'HellDropZonePart',
    uiType: 'HellDropZoneUi',
    entrypointId: 'drop-zone',
    sourcePath: 'packages/angular/drop-zone/drop-zone.ts',
    publicApiPath: 'packages/angular/drop-zone/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-dropzone',
    componentVariablePrefix: '--hell-dropzone-',
  },
  {
    className: 'HellPagination',
    partType: 'HellPaginationPart',
    uiType: 'HellPaginationUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination',
  },
  {
    className: 'HellPaginationFirst',
    partType: 'HellPaginationFirstPart',
    uiType: 'HellPaginationFirstUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination-first',
  },
  {
    className: 'HellPaginationPrev',
    partType: 'HellPaginationPrevPart',
    uiType: 'HellPaginationPrevUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination-prev',
  },
  {
    className: 'HellPaginationNext',
    partType: 'HellPaginationNextPart',
    uiType: 'HellPaginationNextUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination-next',
  },
  {
    className: 'HellPaginationLast',
    partType: 'HellPaginationLastPart',
    uiType: 'HellPaginationLastUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination-last',
  },
  {
    className: 'HellPaginationButton',
    partType: 'HellPaginationButtonPart',
    uiType: 'HellPaginationButtonUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-pagination-item',
  },
  {
    className: 'HellPaginationStrip',
    partType: 'HellPaginationStripPart',
    uiType: 'HellPaginationStripUi',
    entrypointId: 'pagination',
    sourcePath: 'packages/angular/pagination/pagination.ts',
    publicApiPath: 'packages/angular/pagination/public-api.ts',
    apiReportFiles: [],
  },
  {
    className: 'HellAppShell',
    partType: 'HellAppShellPart',
    uiType: 'HellAppShellUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-shell',
  },
  {
    className: 'HellAppTopbar',
    partType: 'HellAppTopbarPart',
    uiType: 'HellAppTopbarUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-topbar',
  },
  {
    className: 'HellAppSidenav',
    partType: 'HellAppSidenavPart',
    uiType: 'HellAppSidenavUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-sidenav',
  },
  {
    className: 'HellNavItem',
    partType: 'HellNavItemPart',
    uiType: 'HellNavItemUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-item',
  },
  {
    className: 'HellNavItemIcon',
    partType: 'HellNavItemIconPart',
    uiType: 'HellNavItemIconUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-icon',
  },
  {
    className: 'HellNavItemLabel',
    partType: 'HellNavItemLabelPart',
    uiType: 'HellNavItemLabelUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-label',
  },
  {
    className: 'HellNavItemTrailing',
    partType: 'HellNavItemTrailingPart',
    uiType: 'HellNavItemTrailingUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-trailing',
  },
  {
    className: 'HellNavSection',
    partType: 'HellNavSectionPart',
    uiType: 'HellNavSectionUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-section',
  },
  {
    className: 'HellNavSectionToggle',
    partType: 'HellNavSectionTogglePart',
    uiType: 'HellNavSectionToggleUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-section-toggle',
  },
  {
    className: 'HellNavSectionItems',
    partType: 'HellNavSectionItemsPart',
    uiType: 'HellNavSectionItemsUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-nav-section-items',
  },
  {
    className: 'HellAppContent',
    partType: 'HellAppContentPart',
    uiType: 'HellAppContentUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-content',
  },
  {
    className: 'HellSidenavToggle',
    partType: 'HellSidenavTogglePart',
    uiType: 'HellSidenavToggleUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
  },
  {
    className: 'HellSecondaryToggle',
    partType: 'HellSecondaryTogglePart',
    uiType: 'HellSecondaryToggleUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
  },
  {
    className: 'HellAppSecondary',
    partType: 'HellAppSecondaryPart',
    uiType: 'HellAppSecondaryUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-secondary',
  },
  {
    className: 'HellAppSecondaryBody',
    partType: 'HellAppSecondaryBodyPart',
    uiType: 'HellAppSecondaryBodyUi',
    entrypointId: 'app-shell',
    sourcePath: 'packages/angular/app-shell/app-shell.ts',
    publicApiPath: 'packages/angular/app-shell/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-secondary-body',
  },
  {
    className: 'HellResizable',
    partType: 'HellResizablePart',
    uiType: 'HellResizableUi',
    entrypointId: 'resizable',
    sourcePath: 'packages/angular/resizable/resizable.ts',
    publicApiPath: 'packages/angular/resizable/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-resizable',
  },
  {
    className: 'HellResizablePane',
    partType: 'HellResizablePanePart',
    uiType: 'HellResizablePaneUi',
    entrypointId: 'resizable',
    sourcePath: 'packages/angular/resizable/resizable.ts',
    publicApiPath: 'packages/angular/resizable/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-resizable-pane',
  },
  {
    className: 'HellResizableHandle',
    partType: 'HellResizableHandlePart',
    uiType: 'HellResizableHandleUi',
    entrypointId: 'resizable',
    sourcePath: 'packages/angular/resizable/resizable.ts',
    publicApiPath: 'packages/angular/resizable/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-resizable-handle',
  },
  {
    className: 'HellSplitView',
    partType: 'HellSplitViewPart',
    uiType: 'HellSplitViewUi',
    entrypointId: 'split-view',
    sourcePath: 'packages/angular/split-view/split-view.ts',
    publicApiPath: 'packages/angular/split-view/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-split-view',
  },
  {
    className: 'HellTableContainer',
    partType: 'HellTableContainerPart',
    uiType: 'HellTableContainerUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-container',
  },
  {
    className: 'HellTable',
    partType: 'HellTablePart',
    uiType: 'HellTableUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table',
  },
  {
    className: 'HellTableHead',
    partType: 'HellTableHeadPart',
    uiType: 'HellTableHeadUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-head',
  },
  {
    className: 'HellTableBody',
    partType: 'HellTableBodyPart',
    uiType: 'HellTableBodyUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-body',
  },
  {
    className: 'HellTableRow',
    partType: 'HellTableRowPart',
    uiType: 'HellTableRowUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-row',
  },
  {
    className: 'HellTableRowAction',
    partType: 'HellTableRowActionPart',
    uiType: 'HellTableRowActionUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-row-action',
  },
  {
    className: 'HellTableSelectionCell',
    partType: 'HellTableSelectionCellPart',
    uiType: 'HellTableSelectionCellUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-selection-cell',
  },
  {
    className: 'HellTableRowCheckbox',
    partType: 'HellTableRowCheckboxPart',
    uiType: 'HellTableRowCheckboxUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-row-checkbox',
  },
  {
    className: 'HellTableRowRadio',
    partType: 'HellTableRowRadioPart',
    uiType: 'HellTableRowRadioUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-row-radio',
  },
  {
    className: 'HellTableHeaderCell',
    partType: 'HellTableHeaderCellPart',
    uiType: 'HellTableHeaderCellUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-header-cell',
  },
  {
    className: 'HellTableSortTrigger',
    partType: 'HellTableSortTriggerPart',
    uiType: 'HellTableSortTriggerUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-sort-trigger',
  },
  {
    className: 'HellTableCell',
    partType: 'HellTableCellPart',
    uiType: 'HellTableCellUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-cell',
  },
  {
    className: 'HellTableResizeHandle',
    partType: 'HellTableResizeHandlePart',
    uiType: 'HellTableResizeHandleUi',
    entrypointId: 'table',
    sourcePath: 'packages/angular/table/table-utilities.ts',
    publicApiPath: 'packages/angular/table/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-table-resize-handle',
  },
  {
    className: 'HellCombobox',
    partType: 'HellComboboxPart',
    uiType: 'HellComboboxUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox',
  },
  {
    className: 'HellComboboxBasic',
    partType: 'HellComboboxBasicPart',
    uiType: 'HellComboboxBasicUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-basic',
  },
  {
    className: 'HellComboboxButton',
    partType: 'HellComboboxButtonPart',
    uiType: 'HellComboboxButtonUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-button',
  },
  {
    className: 'HellComboboxDropdown',
    partType: 'HellComboboxDropdownPart',
    uiType: 'HellComboboxDropdownUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-dropdown',
  },
  {
    className: 'HellComboboxEmpty',
    partType: 'HellComboboxEmptyPart',
    uiType: 'HellComboboxEmptyUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-empty',
  },
  {
    className: 'HellComboboxInput',
    partType: 'HellComboboxInputPart',
    uiType: 'HellComboboxInputUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-input',
  },
  {
    className: 'HellComboboxOption',
    partType: 'HellComboboxOptionPart',
    uiType: 'HellComboboxOptionUi',
    entrypointId: 'combobox',
    sourcePath: 'packages/angular/combobox/combobox.ts',
    publicApiPath: 'packages/angular/combobox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-combobox-option',
  },
  {
    className: 'HellFlyout',
    partType: 'HellFlyoutPart',
    uiType: 'HellFlyoutUi',
    entrypointId: 'flyout',
    sourcePath: 'packages/angular/flyout/flyout.ts',
    publicApiPath: 'packages/angular/flyout/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-flyout',
  },
  {
    className: 'HellListbox',
    partType: 'HellListboxPart',
    uiType: 'HellListboxUi',
    entrypointId: 'listbox',
    sourcePath: 'packages/angular/listbox/listbox.ts',
    publicApiPath: 'packages/angular/listbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-listbox',
  },
  {
    className: 'HellListboxHeader',
    partType: 'HellListboxHeaderPart',
    uiType: 'HellListboxHeaderUi',
    entrypointId: 'listbox',
    sourcePath: 'packages/angular/listbox/listbox.ts',
    publicApiPath: 'packages/angular/listbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-listbox-header',
  },
  {
    className: 'HellListboxOption',
    partType: 'HellListboxOptionPart',
    uiType: 'HellListboxOptionUi',
    entrypointId: 'listbox',
    sourcePath: 'packages/angular/listbox/listbox.ts',
    publicApiPath: 'packages/angular/listbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-listbox-option',
  },
  {
    className: 'HellListboxSection',
    partType: 'HellListboxSectionPart',
    uiType: 'HellListboxSectionUi',
    entrypointId: 'listbox',
    sourcePath: 'packages/angular/listbox/listbox.ts',
    publicApiPath: 'packages/angular/listbox/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-listbox-section',
  },
  {
    className: 'HellMenu',
    partType: 'HellMenuPart',
    uiType: 'HellMenuUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu',
  },
  {
    className: 'HellMenuItem',
    partType: 'HellMenuItemPart',
    uiType: 'HellMenuItemUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item',
  },
  {
    className: 'HellMenuItemCheckbox',
    partType: 'HellMenuItemCheckboxPart',
    uiType: 'HellMenuItemCheckboxUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item-checkbox',
  },
  {
    className: 'HellMenuItemIcon',
    partType: 'HellMenuItemIconPart',
    uiType: 'HellMenuItemIconUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item-icon',
  },
  {
    className: 'HellMenuItemIndicator',
    partType: 'HellMenuItemIndicatorPart',
    uiType: 'HellMenuItemIndicatorUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item-indicator',
  },
  {
    className: 'HellMenuItemRadio',
    partType: 'HellMenuItemRadioPart',
    uiType: 'HellMenuItemRadioUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item-radio',
  },
  {
    className: 'HellMenuItemTrailing',
    partType: 'HellMenuItemTrailingPart',
    uiType: 'HellMenuItemTrailingUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-item-trailing',
  },
  {
    className: 'HellMenuLabel',
    partType: 'HellMenuLabelPart',
    uiType: 'HellMenuLabelUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-label',
  },
  {
    className: 'HellMenuSection',
    partType: 'HellMenuSectionPart',
    uiType: 'HellMenuSectionUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-section',
  },
  {
    className: 'HellMenuSeparator',
    partType: 'HellMenuSeparatorPart',
    uiType: 'HellMenuSeparatorUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-menu-separator',
  },
  {
    className: 'HellPopover',
    partType: 'HellPopoverPart',
    uiType: 'HellPopoverUi',
    entrypointId: 'popover',
    sourcePath: 'packages/angular/popover/popover.ts',
    publicApiPath: 'packages/angular/popover/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-popover',
  },
  {
    className: 'HellSelect',
    partType: 'HellSelectPart',
    uiType: 'HellSelectUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select',
  },
  {
    className: 'HellSelectBasic',
    partType: 'HellSelectBasicPart',
    uiType: 'HellSelectBasicUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select-basic',
  },
  {
    className: 'HellSelectDropdown',
    partType: 'HellSelectDropdownPart',
    uiType: 'HellSelectDropdownUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select-dropdown',
  },
  {
    className: 'HellSelectOption',
    partType: 'HellSelectOptionPart',
    uiType: 'HellSelectOptionUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select-option',
  },
  {
    className: 'HellSelectPlaceholder',
    partType: 'HellSelectPlaceholderPart',
    uiType: 'HellSelectPlaceholderUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select-placeholder',
  },
  {
    className: 'HellSelectValue',
    partType: 'HellSelectValuePart',
    uiType: 'HellSelectValueUi',
    entrypointId: 'select',
    sourcePath: 'packages/angular/select/select.ts',
    publicApiPath: 'packages/angular/select/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-select-value',
  },
  {
    className: 'HellSubmenuTrigger',
    partType: 'HellSubmenuTriggerPart',
    uiType: 'HellSubmenuTriggerUi',
    entrypointId: 'menu',
    sourcePath: 'packages/angular/menu/menu.ts',
    publicApiPath: 'packages/angular/menu/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-submenu-trigger',
  },
  {
    className: 'HellTooltip',
    partType: 'HellTooltipPart',
    uiType: 'HellTooltipUi',
    entrypointId: 'tooltip',
    sourcePath: 'packages/angular/tooltip/tooltip.ts',
    publicApiPath: 'packages/angular/tooltip/public-api.ts',
    apiReportFiles: [],
    legacyClass: 'hell-tooltip',
  },
];

const migratedPartStyleMapClassNames = new Set(
  migratedPartStyleMapModules.map((module) => module.className),
);

function main() {
  checkDocsExamples();
  checkDocsLazyRouteImportGraphContract();
  checkDocsRootImportContract();
  checkDocsShellNarrowEntrypointContract();
  checkDocsCodeEditorIsolationContract();
  checkDocsPdfViewerIsolationContract();
  checkPackageEntryPoints();
  checkCodeMirrorEntrypointIsolationContract();
  checkAudioTranscriptEntrypointIsolationContract();
  checkApiReportContract();
  checkApiStabilityContract();
  checkPackageDependencyContract();
  checkStyleEntryPoints();
  checkNgClassCustomizationContract();
  checkAngularHostMetadataContract();
  checkAppShellBreakpointContract();
  checkBehaviorSentinelContract();
  checkComponentContract();
  checkPartStyleMapContract();
  checkLabelContract();
  checkCodeEditorRuntimeContract();
  checkExperimentalFeatureContract();
  checkFormsContract();
  checkDateTimeAdapterContract();
  checkSearchContract();
  checkHotkeyContract();
  checkNativeButtonSelectorContract();
  checkInteractiveTriggerSelectorContract();
  checkTableUtilityContract();
  checkTableSemanticsContract();
  checkTableSortTriggerContract();
  checkTableResizeHandleContract();
  checkTableLegacyRemovalContract();
  checkTableAdapterBoundaryContract();
  checkTableSemanticDefaultGuardContract();
  checkFloatingRegistrationContract();
  checkFloatingAdapterContract();
  checkBrowserGlobalContract();
  checkNgpStateWriterContract();

  if (failures.length) {
    console.error('Architecture checks failed:\n');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Architecture checks passed.');
}

function checkDocsExamples() {
  const catalogPath = join(root, 'apps/docs/src/app/docs-catalog.ts');
  const searchIndexPath = join(root, 'apps/docs/src/app/docs-search-index.ts');
  const catalog = readFile(catalogPath);
  const searchIndex = readFile(searchIndexPath);
  const routePaths = catalogRoutePaths(catalog);
  const examples = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_EXAMPLES');
  const usages = docsSearchIndexSeeds(searchIndex, 'HD_DOCS_CODE_USAGES');
  const pagesRoot = join(root, 'apps/docs/src/app/pages');

  checkDocsCatalogExampleSeam(catalog);
  checkMigratedFloatingListDocsSearchTerms(examples);

  const indexedDetails = new Set(examples.map((example) => example.detail));
  const actualExamples = walk(pagesRoot)
    .filter((file) => file.endsWith('.example.ts'))
    .map((file) => file.slice(pagesRoot.length + 1));
  for (const detail of actualExamples) {
    if (!indexedDetails.has(detail)) failures.push(`Docs Example file is not indexed: ${detail}`);
  }

  const seenOwnerDetail = new Set();
  const seenDetail = new Set();
  for (const example of examples) {
    const key = `${example.path}:${example.detail}`;
    if (seenOwnerDetail.has(key)) failures.push(`Duplicate Docs Example entry: ${key}`);
    seenOwnerDetail.add(key);

    if (seenDetail.has(example.detail)) {
      failures.push(`Duplicate Docs Example detail: ${example.detail}`);
    }
    seenDetail.add(example.detail);

    const detailRoute = docsExampleRouteFromDetail(example.detail, example.title);
    if (detailRoute && detailRoute !== example.path) {
      failures.push(
        `Docs Example "${example.title}" is registered on ${example.path} but detail belongs to ${detailRoute}`,
      );
    }

    if (!routePaths.has(example.path)) {
      failures.push(`Docs Example "${example.title}" points at missing route ${example.path}`);
    }

    const examplePath = join(pagesRoot, example.detail);
    if (!existsSync(examplePath)) {
      failures.push(`Docs Example "${example.title}" points at missing file ${example.detail}`);
      continue;
    }

    const pagePath = pagePathForRoute(example.path);
    if (!existsSync(pagePath)) {
      failures.push(`Docs Example "${example.title}" has no page file for ${example.path}`);
      continue;
    }

    const exampleSource = readFile(examplePath);
    const pageSource = readFile(pagePath);
    const meta = docsExampleComponentMeta(example, exampleSource);
    if (!meta) continue;

    checkDocsExamplePageBinding(example, pageSource, meta);
  }

  const seenUsages = new Set();
  for (const usage of usages) {
    const key = `${usage.path}:${usage.title}`;
    if (seenUsages.has(key)) {
      failures.push(`Duplicate Docs Usage entry: ${key}`);
    }
    seenUsages.add(key);

    if (!routePaths.has(usage.path)) {
      failures.push(`Docs Usage "${usage.title}" points at missing route ${usage.path}`);
    }
  }
}

function checkMigratedFloatingListDocsSearchTerms(examples) {
  const requiredEntries = [
    {
      detail: 'components/combobox/examples/basic.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellComboboxUi',
        'HellComboboxInputUi',
        'HellComboboxButtonUi',
        'HellComboboxDropdownUi',
        'HellComboboxOptionUi',
        'HellComboboxEmptyUi',
      ],
    },
    {
      detail: 'components/combobox/examples/multiple.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellComboboxUi',
        'HellComboboxInputUi',
        'HellComboboxButtonUi',
        'HellComboboxDropdownUi',
        'HellComboboxOptionUi',
        'HellComboboxEmptyUi',
      ],
    },
    {
      detail: 'components/combobox/examples/basic-preset.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellComboboxBasicUi'],
    },
    {
      detail: 'components/flyout/examples/example-boundary-keeps-siblings-interactive.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellFlyoutUi'],
    },
    {
      detail: 'components/listbox/examples/basic.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellListboxUi',
        'HellListboxOptionUi',
        'HellListboxSectionUi',
        'HellListboxHeaderUi',
      ],
    },
    {
      detail: 'components/menu/examples/basic.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellMenuUi',
        'HellMenuItemUi',
        'HellMenuSeparatorUi',
      ],
    },
    {
      detail: 'components/menu/examples/with-icons-sections-submenus.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellMenuUi',
        'HellMenuItemUi',
        'HellSubmenuTriggerUi',
        'HellMenuItemCheckboxUi',
        'HellMenuItemIndicatorUi',
        'HellMenuSectionUi',
        'HellMenuSeparatorUi',
        'HellMenuItemIconUi',
        'HellMenuItemTrailingUi',
      ],
    },
    {
      detail: 'components/popover/examples/example.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellPopoverUi'],
    },
    {
      detail: 'components/select/examples/basic.example.ts',
      terms: [
        'ui',
        'Part Style Map',
        'data-slot',
        'HellSelectUi',
        'HellSelectValueUi',
        'HellSelectPlaceholderUi',
        'HellSelectDropdownUi',
        'HellSelectOptionUi',
      ],
    },
    {
      detail: 'components/select/examples/basic-preset.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellSelectBasicUi'],
    },
    {
      detail: 'components/tooltip/examples/example.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellTooltipUi'],
    },
    {
      detail: 'components/tooltip/examples/with-delay.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellTooltipUi'],
    },
    {
      detail: 'components/tooltip/examples/hoverable.example.ts',
      terms: ['ui', 'Part Style Map', 'data-slot', 'HellTooltipUi'],
    },
  ];

  for (const entry of requiredEntries) {
    const seed = examples.find((example) => example.detail === entry.detail);
    if (!seed) continue;
    for (const term of entry.terms) {
      if (!seed.terms.includes(term)) {
        failures.push(
          `Docs Search Index ${entry.detail} must include migrated Part Style Map search term "${term}"`,
        );
      }
    }
  }
}

function checkDocsLazyRouteImportGraphContract() {
  const docsRoot = join(root, 'apps/docs/src/app');
  const pagesRoot = join(docsRoot, 'pages');
  const catalogPath = join(docsRoot, 'docs-catalog.ts');
  const docPath = join(root, docsExampleImportBoundaryDocPath);
  const routeEntries = docsLazyRouteEntries(catalogPath, pagesRoot);
  const routeEntriesByBoundary = docsRouteEntriesByBoundary(routeEntries);

  checkDocsExampleImportBoundaryDocs(docPath);

  for (const policy of docsHeavyLazyRoutePolicies) {
    const routeEntry = routeEntries.find(
      (entry) => entry.boundary === policy.boundary && entry.routePaths.includes(policy.routePath),
    );
    if (!routeEntry) {
      failures.push(
        `Docs Lazy Route Import Graph policy ${policy.id} must be backed by lazy route ${policy.routePath} in apps/docs/src/app/docs-catalog.ts`,
      );
    }
  }

  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));
  const moduleImports = docsFiles.flatMap((file) => moduleImportSpecifiers(file));

  const unusedAllowances = new Set(
    allowedDocsLazyRouteCrossImports.map((allowance) => `${allowance.from}->${allowance.to}`),
  );

  for (const importHit of moduleImports) {
    const target = resolveRelativeModuleFile(importHit.file, importHit.specifier);
    if (!target || !isWithinDirectory(target, pagesRoot)) continue;
    if (isDocsCatalogLazyRouteImport(importHit, target, catalogPath, routeEntries)) continue;

    const fromRel = relPath(importHit.file);
    const toRel = relPath(target);

    if (!isWithinDirectory(importHit.file, pagesRoot)) {
      failures.push(
        `Docs Lazy Route Import Graph ${fromRel}:${importHit.line} imports ${importHit.specifier} -> ${toRel}; ` +
          'docs shell/shared/search files must not eagerly reference lazy page or example code. Move shared code to apps/docs/src/app/shared or add a documented narrow allowance.',
      );
      continue;
    }

    const fromBoundary = docsPageBoundary(importHit.file, pagesRoot, routeEntriesByBoundary);
    const toBoundary = docsPageBoundary(target, pagesRoot, routeEntriesByBoundary);
    if (fromBoundary.boundary === toBoundary.boundary) continue;

    const allowanceKey = `${fromRel}->${toRel}`;
    if (unusedAllowances.has(allowanceKey)) {
      unusedAllowances.delete(allowanceKey);
      continue;
    }

    failures.push(
      `Docs Lazy Route Import Graph ${fromRel}:${importHit.line} imports ${importHit.specifier} -> ${toRel}; ` +
        `${fromBoundary.label} must not eagerly reference ${toBoundary.label}. Move shared code to apps/docs/src/app/shared or add a documented narrow allowance.`,
    );
  }

  for (const allowanceKey of unusedAllowances) {
    const allowance = allowedDocsLazyRouteCrossImports.find(
      (candidate) => `${candidate.from}->${candidate.to}` === allowanceKey,
    );
    failures.push(
      `Docs Lazy Route Import Graph allowance is stale: ${allowance.from} no longer imports ${allowance.to}`,
    );
  }

  for (const importHit of moduleImports) {
    for (const policy of docsHeavyLazyRoutePolicies) {
      if (!matchesDocsHeavyPackagePolicy(importHit.specifier, policy)) continue;
      if (isFileInDocsBoundary(importHit.file, pagesRoot, policy.boundary)) continue;
      if (policy.id === 'code-editor-docs' && isDocsCodePreviewLazyWrapper(importHit.file))
        continue;

      failures.push(
        `Docs Lazy Route Import Graph ${relPath(importHit.file)}:${importHit.line} imports ${importHit.specifier}; ` +
          `${policy.label} imports must stay inside lazy route ${policy.routePath} (${policy.boundary}).`,
      );
    }
  }

  for (const file of docsFiles) {
    const source = readFile(file);
    for (const policy of docsHeavyLazyRoutePolicies) {
      for (const fragment of policy.sourceFragments) {
        if (!source.includes(fragment)) continue;
        if (isFileInDocsBoundary(file, pagesRoot, policy.boundary)) continue;
        if (policy.id === 'code-editor-docs' && isDocsCodePreviewLazyWrapper(file)) continue;

        failures.push(
          `Docs Lazy Route Import Graph ${relPath(file)} references ${fragment}; ` +
            `${policy.label} stylesheet/runtime references must stay inside lazy route ${policy.routePath} (${policy.boundary}).`,
        );
      }
    }
  }
}

function checkDocsExampleImportBoundaryDocs(docPath) {
  if (!existsSync(docPath)) {
    failures.push(`Docs Lazy Route Import Graph missing ${docsExampleImportBoundaryDocPath}`);
    return;
  }

  const docs = readFile(docPath);
  const requiredParts = [
    'docs-example-import-boundaries',
    'tools/check-architecture.mjs',
    'apps/docs/src/app/docs-catalog.ts',
    'apps/docs/src/app/pages/<route>/examples/',
    'apps/docs/src/app/shared/',
  ];
  for (const part of requiredParts) {
    if (!docs.includes(part)) {
      failures.push(`Docs Lazy Route Import Graph note is missing ${part}`);
    }
  }

  for (const policy of docsHeavyLazyRoutePolicies) {
    const missingPolicyParts = [
      policy.id,
      policy.routePath,
      policy.boundary,
      ...policy.packageSpecifiers,
      ...policy.sourceFragments,
    ].filter((part) => !docs.includes(part));
    if (missingPolicyParts.length) {
      failures.push(
        `Docs Lazy Route Import Graph note is missing ${policy.id}: ${missingPolicyParts.join(', ')}`,
      );
    }
  }

  for (const allowance of allowedDocsLazyRouteCrossImports) {
    const missingAllowanceParts = [
      allowance.from,
      allowance.to,
      allowance.rationale,
    ].filter((part) => !docs.includes(part));
    if (missingAllowanceParts.length) {
      failures.push(
        `Docs Lazy Route Import Graph note is missing allowance ${allowance.from} -> ${allowance.to}: ${missingAllowanceParts.join(', ')}`,
      );
    }
  }
}

function docsLazyRouteEntries(catalogPath, pagesRoot) {
  const catalog = readFile(catalogPath);
  const entries = [];
  const seen = new Set();
  const routeImportRegex =
    /(?:routePath|path):\s*'([^']*)'[\s\S]*?loadComponent:\s*\(\)\s*=>\s*import\(\s*'([^']+)'\s*\)/g;

  for (const match of catalog.matchAll(routeImportRegex)) {
    const routePath = match[1] ? `/${match[1]}` : '/';
    const modulePath = resolveRelativeModuleFile(catalogPath, match[2]);
    if (!modulePath || !isWithinDirectory(modulePath, pagesRoot)) continue;

    const boundary = relPathFrom(pagesRoot, dirname(modulePath));
    const key = `${routePath}:${boundary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ routePath, routePaths: [routePath], boundary, modulePath });
  }

  return mergeDocsRouteEntries(entries);
}

function mergeDocsRouteEntries(entries) {
  const byBoundary = new Map();
  for (const entry of entries) {
    const existing = byBoundary.get(entry.boundary);
    if (!existing) {
      byBoundary.set(entry.boundary, { ...entry });
      continue;
    }

    existing.routePaths.push(entry.routePath);
  }

  return [...byBoundary.values()].map((entry) => ({
    ...entry,
    routePaths: [...new Set(entry.routePaths)].sort(),
  }));
}

function isDocsCatalogLazyRouteImport(importHit, target, catalogPath, routeEntries) {
  return (
    importHit.file === catalogPath &&
    importHit.kind === 'dynamic' &&
    routeEntries.some((entry) => entry.modulePath === target)
  );
}

function docsRouteEntriesByBoundary(entries) {
  return new Map(entries.map((entry) => [entry.boundary, entry]));
}

function docsPageBoundary(file, pagesRoot, routeEntriesByBoundary) {
  const rel = relPathFrom(pagesRoot, file);
  const routeEntry = [...routeEntriesByBoundary.values()]
    .sort((a, b) => b.boundary.length - a.boundary.length)
    .find((entry) => rel === entry.boundary || rel.startsWith(`${entry.boundary}/`));

  if (routeEntry) {
    return {
      boundary: routeEntry.boundary,
      label: `${routeEntry.routePaths.join(' or ')} lazy route boundary`,
    };
  }

  const parts = rel.split('/');
  const examplesIndex = parts.indexOf('examples');
  const boundary =
    examplesIndex > 0 ? parts.slice(0, examplesIndex).join('/') : parts.slice(0, -1).join('/');
  return { boundary, label: `${boundary} unrouted docs page boundary` };
}

function isFileInDocsBoundary(file, pagesRoot, boundary) {
  if (!isWithinDirectory(file, pagesRoot)) return false;
  const rel = relPathFrom(pagesRoot, file);
  return rel === boundary || rel.startsWith(`${boundary}/`);
}

function isDocsCodePreviewLazyWrapper(file) {
  return relPath(file) === docsCodePreviewLazyWrapperPath;
}

function matchesDocsHeavyPackagePolicy(specifier, policy) {
  return policy.packageSpecifiers.some((prefix) => {
    if (prefix.endsWith('/')) return specifier.startsWith(prefix);
    return specifier === prefix || specifier.startsWith(`${prefix}/`);
  });
}

function moduleImportSpecifiers(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports = [];

  function pushImport(node, specifier, kind) {
    const line = sourceFile.getLineAndCharacterOfPosition(specifier.getStart(sourceFile)).line + 1;
    imports.push({ file, kind, line, specifier: specifier.text });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (!isTypeOnlyImportDeclaration(node)) pushImport(node, node.moduleSpecifier, 'static');
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (!isTypeOnlyExportDeclaration(node)) pushImport(node, node.moduleSpecifier, 'export');
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      pushImport(node, node.arguments[0], 'dynamic');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

function moduleSpecifierReferences(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const references = [];

  function pushReference(specifier, kind) {
    const line = sourceFile.getLineAndCharacterOfPosition(specifier.getStart(sourceFile)).line + 1;
    references.push({ file, kind, line, specifier: specifier.text });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      pushReference(node.moduleSpecifier, 'import');
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      pushReference(node.moduleSpecifier, 'export');
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      pushReference(node.arguments[0], 'dynamic');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function isTypeOnlyImportDeclaration(node) {
  if (!node.importClause) return false;
  if (node.importClause.isTypeOnly) return true;
  if (node.importClause.name) return false;

  const bindings = node.importClause.namedBindings;
  if (!bindings || ts.isNamespaceImport(bindings)) return false;

  return bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
}

function isTypeOnlyExportDeclaration(node) {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  if (!clause || !ts.isNamedExports(clause)) return false;
  return clause.elements.length > 0 && clause.elements.every((element) => element.isTypeOnly);
}

function resolveRelativeModuleFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;

  const withoutQuery = specifier.replace(/[?#].*$/, '');
  const basePath = resolve(dirname(fromFile), withoutQuery);
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, join(basePath, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function isWithinDirectory(file, directory) {
  const rel = relative(directory, file);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\'));
}

function relPathFrom(basePath, file) {
  return relative(basePath, file).replaceAll('\\', '/');
}

function relPath(file) {
  return relPathFrom(root, file);
}

function catalogRoutePaths(catalog) {
  return new Set(
    [...catalog.matchAll(/routePath:\s*'([^']*)'/g)].map((match) =>
      match[1] ? `/${match[1]}` : '/',
    ),
  );
}

function docsSearchIndexSeeds(searchIndex, variable) {
  const declaration = new RegExp(`const\\s+${variable}[^=]*=\\s*\\[`).exec(searchIndex);
  if (!declaration) {
    failures.push(`Docs Search Index missing ${variable}`);
    return [];
  }

  const bodyStart = declaration.index + declaration[0].length;
  const bodyEnd = searchIndex.indexOf('];', bodyStart);
  if (bodyEnd < 0) {
    failures.push(`Docs Search Index block for ${variable} is malformed`);
    return [];
  }

  const body = searchIndex.slice(bodyStart, bodyEnd);
  const seeds = [];
  for (const match of body.matchAll(
    /\{\s*title:\s*'([^']+)'\s*,\s*path:\s*'([^']+)'\s*,\s*detail:\s*'([^']+)'\s*,\s*terms:\s*'([^']*)'/g,
  )) {
    seeds.push({
      title: match[1],
      path: match[2],
      detail: match[3],
      terms: match[4],
    });
  }

  return seeds;
}

function checkDocsCatalogExampleSeam(catalog) {
  const staticExampleImport =
    /(?:^|\n)\s*import\s+(?:[^'"]+\s+from\s+)?['"]\.\/pages\/[^'"]*\/examples\//;
  const dynamicExampleImport = /import\(\s*['"]\.\/pages\/[^'"]*\/examples\//;
  if (staticExampleImport.test(catalog) || dynamicExampleImport.test(catalog)) {
    failures.push('Docs Catalog must not eagerly import Docs Example implementations');
  }
}

function docsExampleRouteFromDetail(detail, title) {
  if (detail.startsWith('/') || detail.includes('..')) {
    failures.push(`Docs Example "${title}" has unsafe detail path ${detail}`);
    return null;
  }

  const match = /^(.+)\/examples\/[^/]+\.example\.ts$/.exec(detail);
  if (!match) {
    failures.push(`Docs Example "${title}" detail must point at a .example.ts file: ${detail}`);
    return null;
  }

  return `/${match[1]}`;
}

function docsExampleComponentMeta(example, source) {
  if (docsExampleCodeOnly(source)) {
    return { codeOnly: true, stem: basename(example.detail, '.ts') };
  }

  const selector = source.match(/selector:\s*'([^']+)'/)?.[1] ?? null;
  if (!selector) {
    failures.push(`Docs Example "${example.title}" has no Angular selector in ${example.detail}`);
    return null;
  }

  const className = source.match(/export\s+class\s+([A-Za-z0-9_]+)/)?.[1] ?? null;
  if (!className) {
    failures.push(`Docs Example "${example.title}" has no exported class in ${example.detail}`);
    return null;
  }

  return { selector, className, stem: basename(example.detail, '.ts') };
}

function checkDocsExamplePageBinding(example, pageSource, meta) {
  const stemPattern = escapeRegExp(meta.stem);
  if (!meta.codeOnly) {
    const classImport = new RegExp(
      `import\\s+\\{[^}]*\\b${escapeRegExp(meta.className)}\\b[^}]*\\}\\s+from\\s+['"]\\.\\/examples\\/${stemPattern}['"]`,
    );
    if (!classImport.test(pageSource)) {
      failures.push(`Docs Example "${example.title}" is indexed but not imported by its page`);
    }
  }

  const rawImport = new RegExp(
    `import\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]\\.\\/examples\\/${stemPattern}\\.ts\\?raw['"][^;]*?with\\s*\\{[^}]*?loader:\\s*['"]text['"][^}]*?\\}\\s*;`,
  ).exec(pageSource);
  if (!rawImport) {
    failures.push(
      `Docs Example "${example.title}" is indexed but its raw source is not imported with loader: 'text'`,
    );
    return;
  }

  const codeField = new RegExp(
    `readonly\\s+([A-Za-z0-9_]+)\\s*=\\s*${escapeRegExp(rawImport[1])}\\s*;`,
  ).exec(pageSource)?.[1];
  if (!codeField) {
    failures.push(`Docs Example "${example.title}" raw source is not exposed through a code field`);
    return;
  }

  const exampleTabs = pageSource.match(/<hd-example-tabs\b[\s\S]*?<\/hd-example-tabs>/g) ?? [];
  const matchingTabs = exampleTabs.filter((block) => {
    if (!block.includes(`[code]="${codeField}"`)) return false;
    return meta.codeOnly || block.includes(`<${meta.selector}`);
  });
  if (matchingTabs.length !== 1) {
    const requirement = meta.codeOnly
      ? `bind ${codeField} in exactly one code-only hd-example-tabs block`
      : `bind ${codeField} and render <${meta.selector}> in exactly one hd-example-tabs block`;
    failures.push(`Docs Example "${example.title}" must ${requirement}`);
  }
}

function docsExampleCodeOnly(source) {
  return source.includes('@hell-docs-code-only');
}

function checkDocsRootImportContract() {
  const docsRoot = join(root, 'apps/docs/src/app');
  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));

  for (const file of docsFiles) {
    const source = readFile(file);
    if (/(?:from|import\()\s*['\"]hell(?:\/|['\"])/.test(source)) {
      failures.push(
        `Docs app file ${file.slice(root.length + 1)} imports legacy unscoped hell root or hell/* subpath`,
      );
    }
    if (/(?:from|import\()\s*['\"]@hell-ui\/angular['\"]/.test(source)) {
      failures.push(
        `Docs app file ${file.slice(root.length + 1)} imports the root @hell-ui/angular entry point`,
      );
    }
  }
}

function checkDocsShellNarrowEntrypointContract() {
  const shellFiles = [
    'apps/docs/src/app/app.ts',
    'apps/docs/src/app/shared/code-block.ts',
    'apps/docs/src/app/shared/example-tabs.ts',
  ];

  for (const file of shellFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs shell narrow-entrypoint check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (/(?:from|import\()\s*['"]@hell-ui\/angular\/(?:primitives|composites)['"]/.test(source)) {
      failures.push(
        `Docs shell file ${file} must import component-specific @hell-ui/angular/* entry points instead of aggregate primitives/composites`,
      );
    }
  }
}

function checkDocsCodeEditorIsolationContract() {
  const directSharedFiles = [
    'apps/docs/src/app/shared/code-block.ts',
    'apps/docs/src/app/shared/example-tabs.ts',
    'apps/docs/src/app/shared/code-tools.ts',
  ];
  const deferredSharedFiles = [
    'apps/docs/src/app/shared/code-block.ts',
    'apps/docs/src/app/shared/example-tabs.ts',
  ];

  for (const file of directSharedFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs architecture check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (
      source.includes('@codemirror/') ||
      source.includes('@hell-ui/angular/features/code-editor')
    ) {
      failures.push(
        `Docs shared file ${file} must not import CodeMirror or @hell-ui/angular/features/code-editor directly; use the deferred docs code viewer wrapper`,
      );
    }
    if (/<pre\b/.test(source)) {
      failures.push(
        `Docs shared file ${file} must not render raw <pre> code blocks for shared code previews`,
      );
    }
  }

  for (const file of deferredSharedFiles) {
    const source = readFile(join(root, file));
    if (!source.includes("import('./docs-code-viewer')") || !source.includes('ngComponentOutlet')) {
      failures.push(
        `Docs shared file ${file} must lazy-load shared docs code previews through the docs-code-viewer dynamic component`,
      );
    }
  }

  const wrapperPath = join(root, docsCodePreviewLazyWrapperPath);
  if (!existsSync(wrapperPath)) {
    failures.push(
      `Docs architecture check references missing file ${docsCodePreviewLazyWrapperPath}`,
    );
  } else {
    const wrapperSource = readFile(wrapperPath);
    if (!wrapperSource.includes('@hell-ui/angular/features/code-editor')) {
      failures.push(
        'Docs code viewer wrapper must be the only shared file that imports @hell-ui/angular/features/code-editor',
      );
    }
    if (!wrapperSource.includes('@hell-ui/angular/features/code-editor/styles.css')) {
      failures.push(
        'Docs code viewer wrapper must lazy-load the code-editor feature stylesheet with the viewer',
      );
    }
    if (/<pre\b/.test(wrapperSource)) {
      failures.push(
        'Docs code viewer wrapper must render HellCodeEditor instead of raw <pre> code blocks',
      );
    }
  }

  const docsPagesRoot = join(root, 'apps/docs/src/app/pages');
  const docsPages = walk(docsPagesRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsPages) {
    if (file.includes('/components/code-editor/')) continue;
    if (/\bcode-editor\b/i.test(file)) continue;

    const source = readFile(file);
    if (
      source.includes('@codemirror/') ||
      source.includes('@hell-ui/angular/features/code-editor')
    ) {
      failures.push(
        `Docs page ${file.replace(root + '/', '')} must keep CodeMirror imports within /components/code-editor`,
      );
    }
  }
}

function checkDocsPdfViewerIsolationContract() {
  const heavyImports = ['@hell-ui/pdf-viewer', 'pdfjs-dist'];
  const globalDocsFiles = [
    'apps/docs/src/app/app.routes.ts',
    'apps/docs/src/app/docs-catalog.ts',
    'apps/docs/src/app/docs-search-index.ts',
  ];
  const sharedFiles = [
    'apps/docs/src/app/shared/code-block.ts',
    'apps/docs/src/app/shared/example-tabs.ts',
    'apps/docs/src/app/shared/code-tools.ts',
  ];

  for (const file of globalDocsFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs architecture check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(
        `Docs global catalog/search file ${file} must not import pdf.js or @hell-ui/pdf-viewer`,
      );
    }
    if (hasStaticImportFrom(source, 'pages/components/pdf-viewer')) {
      failures.push(
        `Docs global catalog/search file ${file} must lazy-load the PDF viewer page instead of statically importing it`,
      );
    }
    if (hasDynamicImportFrom(source, 'pages/components/pdf-viewer/examples')) {
      failures.push(
        `Docs global catalog/search file ${file} must not import PDF viewer demo code; keep examples behind the PDF page boundary`,
      );
    }
  }

  for (const file of sharedFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      failures.push(`Docs architecture check references missing file ${file}`);
      continue;
    }

    const source = readFile(path);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(`Docs shared file ${file} must not import pdf.js or @hell-ui/pdf-viewer`);
    }
  }

  const docsPagesRoot = join(root, 'apps/docs/src/app/pages');
  const docsPages = walk(docsPagesRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsPages) {
    if (file.includes('/components/pdf-viewer/')) continue;

    const source = readFile(file);
    if (hasPackageImport(source, heavyImports)) {
      failures.push(
        `Docs page ${file.replace(root + '/', '')} must keep pdf.js imports within /components/pdf-viewer`,
      );
    }
  }

  const pdfViewerPagePath = join(
    root,
    'apps/docs/src/app/pages/components/pdf-viewer/pdf-viewer.page.ts',
  );
  const pdfViewerPage = readFile(pdfViewerPagePath);
  if (
    /styles\s*:\s*\[[\s\S]*(?:@hell-ui\/angular\/styles\/features\/pdf-viewer|@hell-ui\/pdf-viewer\/styles)/.test(
      pdfViewerPage,
    )
  ) {
    failures.push(
      'PDF viewer docs page must load feature CSS as a lazy external asset, not an Angular component style',
    );
  }
}

function hasPackageImport(source, specifiers) {
  return specifiers.some((specifier) => {
    const escaped = escapeRegExp(specifier);
    const pattern = new RegExp(
      `(?:from\\s*['"]${escaped}(?:/[^'"]*)?['"]|import\\s*(?:\\(\\s*)?['"]${escaped}(?:/[^'"]*)?['"])`,
    );
    return pattern.test(source);
  });
}

function hasStaticImportFrom(source, pathFragment) {
  return source.split('\n').some((line) => {
    const trimmed = line.trimStart();
    return (
      trimmed.startsWith('import ') && !trimmed.startsWith('import(') && line.includes(pathFragment)
    );
  });
}

function hasDynamicImportFrom(source, pathFragment) {
  const escaped = escapeRegExp(pathFragment);
  return new RegExp(`import\\s*\\(\\s*['"][^'"]*${escaped}[^'"]*['"]`).test(source);
}

function checkPackageEntryPoints() {
  const publicApiFiles = entrypointPublicApiFiles();
  const rootPublicApi = publicApiFiles.find((entrypoint) => entrypoint.id === 'root');
  const rootApiPath = join(root, rootPublicApi.publicApiPath);
  const rootApi = readFile(rootApiPath);
  const secondaryApis = publicApiFiles.filter((entrypoint) => entrypoint.id !== 'root');

  const disallowedRootExports = exportPaths(rootApi).filter(
    (path) =>
      path.includes('public-api-primitives') ||
      path.includes('public-api-primitive-') ||
      path.includes('public-api-composites') ||
      path.includes('public-api-feature') ||
      path.includes('/primitives/') ||
      path.includes('/features/') ||
      path.includes('/composites/'),
  );
  if (disallowedRootExports.length) {
    failures.push(
      `Light Root Entry Point exports composites/features from packages/angular/public-api.ts: ${disallowedRootExports.join(', ')}`,
    );
  }

  const internalCoreExports = new Set(['floating-dismissal', 'floating-scope', 'resize-behavior']);
  for (const [api, source] of [
    [rootPublicApi.publicApiPath, rootApi],
    ...secondaryApis
      .filter((entrypoint) => entrypoint.category !== entrypointCategories.INTERNAL)
      .filter((entrypoint) => existsSync(join(root, entrypoint.publicApiPath)))
      .map((entrypoint) => [
        entrypoint.publicApiPath,
        readFile(join(root, entrypoint.publicApiPath)),
      ]),
  ]) {
    for (const exportPath of exportPaths(source)) {
      const module = basename(exportPath);
      if (internalCoreExports.has(module)) {
        failures.push(`Package Entry Point ${api} exports internal core module ${module}`);
      }
    }
  }

  const requiredRootApiExports = new Set(rootPublicApi.exports);
  for (const requiredExport of requiredRootApiExports) {
    if (!rootApi.includes(`'${requiredExport}'`) && !rootApi.includes(`"${requiredExport}"`)) {
      failures.push(`Root Package Entry Point is missing ${requiredExport}`);
    }
  }

  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  if (tsconfig.compilerOptions?.paths) {
    failures.push(
      'Root tsconfig.json must not define Hell package path aliases; package exports with @heinrich/source are the local source-resolution contract',
    );
  }

  const tsconfigBase = parseJsonWithComments(readFile(join(root, 'tsconfig.base.json')));
  const customConditions = tsconfigBase.compilerOptions?.customConditions ?? [];
  if (!customConditions.includes(sourcePackageCondition)) {
    failures.push(`tsconfig.base.json must include custom condition ${sourcePackageCondition}`);
  }

  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const packageExports = packageJson.exports ?? {};
  const expectedPackageExports = renderPackageJsonExports();
  if (JSON.stringify(packageExports) !== JSON.stringify(expectedPackageExports)) {
    failures.push(
      'Package Entry Point exports in packages/angular/package.json are stale (run pnpm run generate:entrypoints)',
    );
  }

  const angularWorkspace = parseJsonWithComments(readFile(join(root, 'packages/angular/angular.json')));
  const angularSourceRoot = angularWorkspace.projects?.hell?.sourceRoot;
  if (angularSourceRoot !== '.') {
    failures.push(
      `@hell-ui/angular Angular project sourceRoot must be "." for import-path-first package layout; found ${angularSourceRoot ?? 'missing'}`,
    );
  }
  for (const entrypoint of publicApiFiles) {
    const exportPath = packageExportPath(entrypoint.specifier);
    const expectedSource = expectedPackageExports[exportPath]?.[sourcePackageCondition];
    if (packageExports[exportPath]?.[sourcePackageCondition] !== expectedSource) {
      failures.push(
        `Package Entry Point ${entrypoint.specifier} export ${exportPath} must resolve ${sourcePackageCondition} to ${expectedSource}`,
      );
    }
  }

  const manifestSpecifiers = new Set(publicApiFiles.map((entrypoint) => entrypoint.specifier));
  for (const specifier of [
    '@hell-ui/angular/table',
    '@hell-ui/angular/table-tanstack',
    '@hell-ui/angular/table-tanstack/virtual',
  ]) {
    if (!manifestSpecifiers.has(specifier))
      failures.push(`Entrypoint metadata is missing table entry point ${specifier}`);
  }
  for (const specifier of [
    '@hell-ui/angular/primitives',
    '@hell-ui/angular/composites',
    '@hell-ui/angular/data-table',
    '@hell-ui/angular/table-virtual',
    '@hell-ui/angular/table-cdk',
    '@hell-ui/angular/features/data-table',
    '@hell-ui/angular/features/table-utilities',
  ]) {
    if (manifestSpecifiers.has(specifier) || packageExports[packageExportPath(specifier)]) {
      failures.push(
        `Legacy table entry point must be removed from manifest/package exports: ${specifier}`,
      );
    }
  }

  const packagePaths = secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packagePath);

  for (const packagePath of packagePaths) {
    if (!existsSync(join(root, packagePath))) {
      failures.push(`Package Entry Point is missing ${packagePath}`);
    }
  }

  checkEntrypointManifestSourceCoverage();
  checkGeneratedEntrypointFiles();
}

function checkCodeMirrorEntrypointIsolationContract() {
  const codeEditorPublicApiPath = 'packages/angular/features/code-editor/public-api.ts';
  const codeEditorPublicApi = readFile(join(root, codeEditorPublicApiPath));
  if (!codeEditorPublicApi.includes('Kept optional CodeMirror feature entry point')) {
    failures.push(
      'Code Editor entry point public API must state it is a kept optional CodeMirror feature entry point',
    );
  }
  if (!codeEditorPublicApi.includes('lazy/client-only')) {
    failures.push(
      'Code Editor entry point public API must require lazy/client-only browser boundaries',
    );
  }

  const codeEditorEntrypoint = entrypointPublicApiFiles().find(
    (entrypoint) => entrypoint.specifier === codeEditorEntrypointSpecifier,
  );
  if (!codeEditorEntrypoint) {
    failures.push(`Entrypoint metadata is missing ${codeEditorEntrypointSpecifier}`);
    return;
  }
  if (codeEditorEntrypoint.category !== entrypointCategories.FEATURE) {
    failures.push(`${codeEditorEntrypointSpecifier} must be categorized as a feature entry point`);
  }

  const nonCodeEditorEntrypointPaths = [
    ...entrypointPublicApiFiles()
      .filter((entrypoint) => entrypoint.specifier !== codeEditorEntrypointSpecifier)
      .map((entrypoint) => entrypoint.publicApiPath),
    ...libraryProductionTsFiles().filter(
      (file) => !isEntrypointSourcePath(file, codeEditorEntrypoint),
    ),
  ];

  const boundaries = [
    { label: 'non-code-editor package entrypoint', paths: nonCodeEditorEntrypointPaths },
  ];

  for (const boundary of boundaries) {
    for (const rel of [...new Set(boundary.paths)].sort()) {
      const file = join(root, rel);
      if (!existsSync(file)) continue;

      const hits = moduleSpecifierReferences(file).filter((hit) =>
        isCodeMirrorBoundarySpecifier(hit.specifier),
      );
      for (const hit of hits) {
        failures.push(
          `CodeMirror Optional Entrypoint ${boundary.label} boundary ${rel}:${hit.line} references ${hit.specifier}; ` +
            'CodeMirror exports/imports must stay inside @hell-ui/angular/features/code-editor.',
        );
      }
    }
  }
}

function productionTsFilesUnder(relDir) {
  const dir = join(root, relDir);
  if (!existsSync(dir)) return [];

  return walk(dir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'))
    .map(relPath);
}

function libraryPackageFiles() {
  const files = [join(root, 'packages/angular/public-api.ts')];
  for (const dir of new Set(secondaryPackageEntrypoints().map((entrypoint) => entrypoint.packageDir))) {
    const fullDir = join(root, dir);
    if (existsSync(fullDir)) files.push(...walk(fullDir));
  }
  return [...new Set(files)].filter((file) => !relPath(file).includes('/node_modules/'));
}

function libraryProductionTsFiles() {
  return libraryPackageFiles()
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'))
    .map(relPath);
}

function isEntrypointSourcePath(relPath, entrypoint) {
  return relPath === entrypoint.publicApiPath || relPath.startsWith(`${entrypoint.packageDir}/`);
}

function isCodeMirrorBoundarySpecifier(specifier) {
  return (
    specifier === codeEditorEntrypointSpecifier ||
    specifier.startsWith(`${codeEditorEntrypointSpecifier}/`) ||
    /(?:^|\/)code-editor(?:\/|$)/.test(specifier) ||
    specifier.includes('features/code-editor') ||
    codeMirrorPackageSpecifierPrefixes.some((prefix) => specifier.startsWith(prefix))
  );
}

function checkAudioTranscriptEntrypointIsolationContract() {
  const audioTranscriptPublicApiPath =
    'packages/angular/features/audio-transcript/public-api.ts';
  const audioTranscriptPublicApi = readFile(join(root, audioTranscriptPublicApiPath));
  if (!/@experimental\b/.test(audioTranscriptPublicApi)) {
    failures.push(
      'Audio Transcript feature entry point must carry @experimental in its public API comment',
    );
  }
  if (!audioTranscriptPublicApi.includes('Optional browser transcript provider')) {
    failures.push(
      'Audio Transcript feature entry point must describe itself as an optional provider seam',
    );
  }

  const audioTranscriptSourcePath =
    'packages/angular/features/audio-transcript/audio-transcript.ts';
  const audioTranscriptSource = readFile(join(root, audioTranscriptSourcePath));
  for (const symbol of [
    'provideHellAudioTranscript',
    'hellAudioSpeechSupported',
    'HellAudioSpeechTranscriptRuntime',
  ]) {
    if (!hasTaggedApiSymbol(audioTranscriptSource, 'experimental', symbol)) {
      failures.push(`${audioTranscriptSourcePath} ${symbol} must carry @experimental API JSDoc`);
    }
  }

  const libraryProductionPaths = [
    'packages/angular/public-api.ts',
    ...entrypointPublicApiFiles().map((entrypoint) => entrypoint.publicApiPath),
    ...libraryProductionTsFiles(),
  ];

  for (const rel of [...new Set(libraryProductionPaths)].sort()) {
    if (isAudioTranscriptFeatureSeamPath(rel)) continue;
    const file = join(root, rel);
    if (!existsSync(file)) continue;

    const source = readFile(file);
    for (const term of audioTranscriptRuntimeTerms) {
      if (term.pattern.test(source)) {
        failures.push(
          `Audio Transcript Optional Entrypoint boundary ${rel} references ${term.label}; ` +
            'browser transcript runtime must stay inside @hell-ui/angular/features/audio-transcript.',
        );
      }
    }

    const hits = moduleSpecifierReferences(file).filter((hit) =>
      isAudioTranscriptFeatureSpecifier(hit.specifier),
    );
    for (const hit of hits) {
      failures.push(
        `Audio Transcript Optional Entrypoint boundary ${rel}:${hit.line} references ${hit.specifier}; ` +
          'base audio-player and composites must not import the transcript feature seam.',
      );
    }
  }
}

function isAudioTranscriptFeatureSeamPath(rel) {
  return (
    rel === 'packages/angular/features/audio-transcript/public-api.ts' ||
    rel.includes('/features/audio-transcript/')
  );
}

function isAudioTranscriptFeatureSpecifier(specifier) {
  return (
    specifier === audioTranscriptEntrypointSpecifier ||
    specifier.startsWith(`${audioTranscriptEntrypointSpecifier}/`) ||
    specifier.includes('features/audio-transcript')
  );
}

function checkApiReportContract() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'package.json')));
  const script = readFile(join(root, 'tools/check-api-reports.mjs'));
  const policy = readFile(join(root, 'tools/release-evidence-policy.mjs'));
  const expectedEntrypoints = [
    ['@hell-ui/angular', 'hell-ui-angular.api.md'],
    ['@hell-ui/angular/core', 'hell-ui-angular-core.api.md'],
    ['@hell-ui/angular/internal/hotkeys', 'hell-ui-angular-internal-hotkeys.api.md'],
    ['@hell-ui/angular/input', 'hell-ui-angular-input.api.md'],
    ['@hell-ui/angular/dialpad', 'hell-ui-angular-dialpad.api.md'],
    ['@hell-ui/angular/testing', 'hell-ui-angular-testing.api.md'],
  ];
  const forbiddenExperimentalApiReports = [
    '@hell-ui/angular/features/code-editor',
    'hell-ui-angular-features-code-editor.api.md',
  ];

  if (packageJson.scripts?.['test:api-report'] !== 'node tools/check-api-reports.mjs') {
    failures.push('API Report contract must expose pnpm run test:api-report');
  }
  if (packageJson.scripts?.['api-report:update'] !== 'node tools/check-api-reports.mjs --local') {
    failures.push(
      'API Report contract must expose pnpm run api-report:update for baseline approval',
    );
  }
  if (!packageJson.scripts?.['ci:build']?.includes('pnpm run test:api-report')) {
    failures.push('API Report contract must run from ci:build after the library package is built');
  }
  if (!script.includes('apiReportEntrypoints')) {
    failures.push('API Report script must use the shared release evidence policy membership');
  }

  for (const [specifier, reportFileName] of expectedEntrypoints) {
    if (!policy.includes(specifier)) {
      failures.push(`API Report policy is missing stable entry point ${specifier}`);
    }
    if (!policy.includes(reportFileName)) {
      failures.push(`API Report policy is missing report file ${reportFileName}`);
    }

    const reportPath = join(root, 'etc/api-reports', reportFileName);
    if (!existsSync(reportPath)) {
      failures.push(`API Report baseline is missing etc/api-reports/${reportFileName}`);
    }
  }

  for (const forbidden of forbiddenExperimentalApiReports) {
    if (policy.includes(forbidden) || script.includes(forbidden)) {
      failures.push(
        `API Report contract must keep Code Editor out of stable API reports until API report policy deliberately promotes it: ${forbidden}`,
      );
    }
  }
}

function checkApiStabilityContract() {
  const readme = readFile(join(root, 'packages/angular/README.md'));
  const requiredPolicyText = [
    '### Stability category policy',
    '`Stable`',
    '`Experimental`',
    '`Deprecated`',
    '`Internal`',
    'Public API files must not export from `/internal/`, `/adapters/`, or metadata-declared internal directories',
  ];
  for (const text of requiredPolicyText) {
    if (!readme.includes(text)) failures.push(`API Stability policy is missing ${text}`);
  }

  const experimentalEntrypoints = [
    {
      name: 'Code editor',
      publicApiPath: 'packages/angular/features/code-editor/public-api.ts',
      sourcePath: 'packages/angular/features/code-editor/code-editor.ts',
      docsPath: 'apps/docs/src/app/pages/components/code-editor/code-editor.page.ts',
    },
    {
      name: 'PDF viewer',
      publicApiPath: 'packages/pdf-viewer/src/public-api.ts',
      sourcePath: 'packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts',
      docsPath: 'apps/docs/src/app/pages/components/pdf-viewer/pdf-viewer.page.ts',
    },
  ];

  for (const entrypoint of experimentalEntrypoints) {
    const publicApi = readFile(join(root, entrypoint.publicApiPath));
    if (!/@experimental\b/.test(publicApi)) {
      failures.push(
        `${entrypoint.name} feature entry point must carry @experimental in its public API comment`,
      );
    }

    const source = readFile(join(root, entrypoint.sourcePath));
    if (!/@experimental\b/.test(source)) {
      failures.push(`${entrypoint.name} feature source must carry @experimental API JSDoc`);
    }

    const docs = readFile(join(root, entrypoint.docsPath));
    if (!new RegExp(`${escapeRegExp(entrypoint.name)} is experimental`, 'i').test(docs)) {
      failures.push(`${entrypoint.name} docs must disclose experimental status`);
    }
  }

  const tableEntrypointStatuses = [
    {
      name: 'Table primitives',
      publicApiPath: 'packages/angular/table/public-api.ts',
      tag: 'beta',
    },
    {
      name: 'TanStack Table shell',
      publicApiPath: 'packages/angular/table-tanstack/public-api.ts',
      tag: 'experimental',
    },
  ];
  for (const entrypoint of tableEntrypointStatuses) {
    const publicApi = readFile(join(root, entrypoint.publicApiPath));
    const tagPattern = new RegExp(`@${entrypoint.tag}\\b`);
    if (!tagPattern.test(publicApi)) {
      failures.push(
        `${entrypoint.name} table entry point must carry @${entrypoint.tag} in its public API comment`,
      );
    }
  }

  const experimentalApiSymbols = [
    ['packages/angular/features/code-editor/code-editor.ts', 'HellCodeEditorRuntimeFactory'],
    [
      'packages/angular/features/code-editor/code-editor.ts',
      'HELL_CODE_EDITOR_RUNTIME_FACTORY',
    ],
    ['packages/angular/features/code-editor/code-editor.ts', 'HellCodeEditor'],
    [
      'packages/angular/features/code-editor/code-editor.runtime.ts',
      'HellCodeEditorRuntimeAccessibilityOptions',
    ],
    [
      'packages/angular/features/code-editor/code-editor.runtime.ts',
      'HellCodeEditorRuntimeOptions',
    ],
    [
      'packages/angular/features/code-editor/code-editor.runtime.ts',
      'HellCodeEditorRuntimePort',
    ],
    [
      'packages/angular/features/code-editor/code-editor.runtime.ts',
      'hellCodeEditorSetupFactory',
    ],
    ['packages/angular/features/code-editor/code-editor.runtime.ts', 'hellCodeEditorSetup'],
    ['packages/angular/features/code-editor/code-editor.runtime.ts', 'hellCodeEditorTheme'],
    ['packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HellPdfRuntimeFactory'],
    ['packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HELL_PDF_RUNTIME_FACTORY'],
    ['packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts', 'HellPdfViewer'],
    ['packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.adapter.ts', 'HellPdfWorkerSource'],
  ];
  for (const [sourcePath, symbol] of experimentalApiSymbols) {
    const source = readFile(join(root, sourcePath));
    if (!hasTaggedApiSymbol(source, 'experimental', symbol)) {
      failures.push(`${sourcePath} ${symbol} must carry @experimental API JSDoc`);
    }
  }

  const tableUtilitiesSource = readFile(
    join(root, 'packages/angular/table/table-utilities.ts'),
  );
  for (const removed of [
    'HELL_TABLE_UTILITY_DIRECTIVES',
    'HELL_TABLE_DIRECTIVES',
    'selectionSemantics',
  ]) {
    if (tableUtilitiesSource.includes(removed)) {
      failures.push(`${removed} legacy table API must be removed, not deprecated`);
    }
  }
  if (/readonly\s+interactive\b/.test(tableUtilitiesSource)) {
    failures.push('HellTableRow interactive legacy input must be removed, not deprecated');
  }

  const audioSource = readFile(
    join(root, 'packages/angular/audio-player/audio-player.ts'),
  );
  if (!hasTaggedApiSymbol(audioSource, 'deprecated', 'allowLiveCaptions')) {
    failures.push('allowLiveCaptions compatibility alias must carry @deprecated API JSDoc');
  }

  const codeEditorRuntimeSource = readFile(
    join(root, 'packages/angular/features/code-editor/code-editor.runtime.ts'),
  );
  if (!hasTaggedApiSymbol(codeEditorRuntimeSource, 'deprecated', 'hellCodeEditorSetup')) {
    failures.push('hellCodeEditorSetup compatibility alias must carry @deprecated API JSDoc');
  }

  const audioDocs = readFile(
    join(root, 'apps/docs/src/app/pages/components/audio-player/audio-player.page.ts'),
  );
  if (!/allowLiveCaptions[\s\S]{0,200}deprecated compatibility alias/i.test(audioDocs)) {
    failures.push(
      'Audio Player docs must disclose allowLiveCaptions as a deprecated compatibility alias',
    );
  }

  const codeEditorDocs = readFile(
    join(root, 'apps/docs/src/app/pages/components/code-editor/code-editor.page.ts'),
  );
  if (
    !/hellCodeEditorSetup[\s\S]{0,200}deprecated browser-global legacy compatibility/i.test(
      codeEditorDocs,
    )
  ) {
    failures.push(
      'Code Editor docs must disclose hellCodeEditorSetup as a deprecated compatibility alias',
    );
  }
  for (const requiredCodeEditorDocText of [
    '@hell-ui/angular/features/code-editor',
    'kept optional entry point',
    'lazy/client-only',
    'API report policy deliberately promotes it',
  ]) {
    if (!codeEditorDocs.includes(requiredCodeEditorDocText)) {
      failures.push(`Code Editor docs must state ${requiredCodeEditorDocText}`);
    }
  }

  checkPublicApiInternalExportContract();
}

function hasTaggedApiSymbol(source, tag, symbol) {
  const pattern = new RegExp(
    `@${escapeRegExp(tag)}\\b[\\s\\S]{0,1800}(?:export\\s+(?:abstract\\s+)?(?:class|const|type|interface|function)\\s+${escapeRegExp(symbol)}\\b|readonly\\s+${escapeRegExp(symbol)}\\b)`,
  );
  return pattern.test(source);
}

function checkPublicApiInternalExportContract() {
  const internalDirectoryNames = new Set(['internal', 'adapters', 'ng-primitives']);

  const allowedPublicInternalExports = new Set([
    // Format: `${publicApiPath} -> ${exportPath}`. Each exception must include a release-policy rationale.
  ]);

  for (const entrypoint of entrypointPublicApiFiles()) {
    if (entrypoint.category === entrypointCategories.INTERNAL) continue;

    const publicApiPath = entrypoint.publicApiPath;
    const fullPath = join(root, publicApiPath);
    if (!existsSync(fullPath)) continue;

    const source = readFile(fullPath);
    for (const exportPath of exportPaths(source)) {
      const exportKey = `${publicApiPath} -> ${exportPath}`;
      if (allowedPublicInternalExports.has(exportKey)) continue;

      const resolvedPath = resolvePublicExportPath(publicApiPath, exportPath);
      const segments = resolvedPath.split('/').filter(Boolean);
      const internalSegment = segments.find((segment) => internalDirectoryNames.has(segment));
      if (internalSegment) {
        failures.push(
          `Public API ${publicApiPath} exports ${exportPath} from internal directory "${internalSegment}" without an explicit architecture allowlist entry`,
        );
      }
    }
  }
}

function resolvePublicExportPath(publicApiPath, exportPath) {
  if (!exportPath.startsWith('.')) return exportPath;
  return join(dirname(publicApiPath), exportPath).replaceAll('\\', '/');
}

function checkPackageDependencyContract() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const workspaceCatalog = readWorkspaceCatalog();
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `Package dependency contract uses optionalDependencies instead of optional peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceFiles = libraryProductionTsFiles().map((file) => join(root, file));
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};
  const importedPackages = new Set(
    sourceFiles
      .flatMap((file) => externalImportPackages(readFile(file)))
      .filter((dependency) => dependency !== packageJson.name),
  );

  const lightStackPeers = new Set([
    '@angular/cdk',
    '@angular/common',
    '@angular/core',
    '@angular/forms',
    '@floating-ui/dom',
    '@ng-icons/core',
    'ng-primitives',
    'rxjs',
  ]);
  const iconOnlyPeers = new Set(['@ng-icons/font-awesome']);
  const transitiveOnlyPeers = new Set(['@angular/router']);
  const featureOnlyPeers = new Set([
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/highlight',
  ]);
  const adapterOnlyPeers = new Set(['@tanstack/angular-table', '@tanstack/virtual-core']);
  const styleOnlyPeers = new Set(['tailwindcss']);

  for (const dependency of importedPackages) {
    if (!peerDependencies[dependency] && !dependencies[dependency]) {
      failures.push(`Package dependency contract is missing dependency for imported ${dependency}`);
    }
  }

  const nonTsPeerDependencies = new Set([
    // CSS entry points depend on Tailwind theme variables.
    'tailwindcss',
    // ng-primitives exposes these as strict peers consumed by primitive wrappers.
    '@angular/cdk',
    '@floating-ui/dom',
    // ng-primitives/dialog imports Router even though Hell only exposes it via dialog surfaces.
    '@angular/router',
  ]);
  for (const dependency of Object.keys(peerDependencies)) {
    if (!importedPackages.has(dependency) && !nonTsPeerDependencies.has(dependency)) {
      failures.push(`Package dependency contract declares unused peer dependency ${dependency}`);
    }

    if (!peerDependencies[dependency]) continue;
    if (lightStackPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional === true) {
      failures.push(
        `Package dependency contract must keep ${dependency} required because it is part of the light root/primitives stack`,
      );
    }

    if (featureOnlyPeers.has(dependency) && peerDependenciesMeta[dependency]?.optional !== true) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for feature-only consumers`,
      );
    } else if (
      adapterOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for adapter-only consumers`,
      );
    } else if (
      styleOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for style-only consumers`,
      );
    } else if (
      iconOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for icon-only consumers`,
      );
    } else if (
      transitiveOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional !== true
    ) {
      failures.push(
        `Package dependency contract must keep ${dependency} optional for transitive-only consumers`,
      );
    }
  }

  for (const dependency of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract has peerDependenciesMeta for undeclared ${dependency}`,
      );
    } else if (
      !featureOnlyPeers.has(dependency) &&
      !adapterOnlyPeers.has(dependency) &&
      !styleOnlyPeers.has(dependency) &&
      !iconOnlyPeers.has(dependency) &&
      !transitiveOnlyPeers.has(dependency) &&
      peerDependenciesMeta[dependency]?.optional
    ) {
      failures.push(
        `Package dependency contract marks ${dependency} optional but it is not a known feature-only, adapter-only, icon-only, style-only, or transitive-only peer`,
      );
    }
  }

  for (const dependency of lightStackPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing required light peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of featureOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional feature peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of adapterOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional adapter peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of styleOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional style peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of iconOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional icon peer dependency ${dependency}`,
      );
    }
  }

  for (const dependency of transitiveOnlyPeers) {
    if (!peerDependencies[dependency]) {
      failures.push(
        `Package dependency contract is missing optional transitive peer dependency ${dependency}`,
      );
    }
  }

  const tanStackImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-tanstack/'))
    .filter((file) => relPath(file) !== 'packages/angular/table-tanstack/public-api.ts')
    .filter((file) => readFile(file).includes('@tanstack/angular-table'))
    .map(relPath);
  if (tanStackImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/angular-table inside @hell-ui/angular/table-tanstack: ${tanStackImportOffenders.join(', ')}`,
    );
  }

  const tanStackVirtualImportOffenders = sourceFiles
    .filter((file) => !relPath(file).includes('/table-tanstack/virtual/'))
    .filter((file) => readFile(file).includes('@tanstack/virtual-core'))
    .map(relPath);
  if (tanStackVirtualImportOffenders.length) {
    failures.push(
      `Package dependency contract must keep @tanstack/virtual-core inside @hell-ui/angular/table-tanstack virtual strategy files: ${tanStackVirtualImportOffenders.join(', ')}`,
    );
  }

  if (peerDependencies['pdfjs-dist'] || peerDependenciesMeta['pdfjs-dist']) {
    failures.push(
      'Main @hell-ui/angular package must not advertise pdfjs-dist after the PDF viewer split',
    );
  }

  checkPdfViewerPackageDependencyContract(workspaceCatalog);

  const rootNgPackage = parseJsonWithComments(
    readFile(join(root, 'packages/angular/ng-package.json')),
  );
  if (JSON.stringify(rootNgPackage.assets ?? []).includes('pdf.worker')) {
    failures.push(
      'Root package assets must not copy pdf.worker.mjs; PDF viewer requires an app-provided worker source',
    );
  }
}

function checkPdfViewerPackageDependencyContract(workspaceCatalog) {
  const packageJson = parseJsonWithComments(
    readFile(join(root, 'packages/pdf-viewer/package.json')),
  );
  const mainPackageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const optionalDependencies = Object.keys(packageJson.optionalDependencies ?? {});
  if (optionalDependencies.length) {
    failures.push(
      `PDF package dependency contract uses optionalDependencies instead of peer dependencies: ${optionalDependencies.join(', ')}`,
    );
  }

  const sourceRoot = join(root, 'packages/pdf-viewer/src/lib');
  const sourceFiles = walk(sourceRoot).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
  );
  const importedPackages = new Set(
    sourceFiles.flatMap((file) => externalImportPackages(readFile(file))),
  );
  const peerDependencies = packageJson.peerDependencies ?? {};
  const peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
  const dependencies = packageJson.dependencies ?? {};

  for (const dependency of importedPackages) {
    if (!peerDependencies[dependency] && !dependencies[dependency]) {
      failures.push(
        `PDF package dependency contract is missing dependency for imported ${dependency}`,
      );
    }
  }

  const requiredPeers = new Set([
    '@angular/common',
    '@angular/core',
    '@hell-ui/angular',
    '@ng-icons/core',
    '@ng-icons/font-awesome',
    'pdfjs-dist',
  ]);
  for (const peer of requiredPeers) {
    if (!peerDependencies[peer])
      failures.push(`PDF package dependency contract is missing required peer ${peer}`);
    if (peerDependenciesMeta[peer]?.optional === true) {
      failures.push(`PDF package dependency contract must keep ${peer} required`);
    }
  }
  if (peerDependencies['pdfjs-dist'] !== workspaceCatalog['pdfjs-dist']) {
    failures.push(
      `PDF package dependency contract must pin pdfjs-dist peer to workspace catalog version ${workspaceCatalog['pdfjs-dist']}`,
    );
  }
  if (peerDependencies['@hell-ui/angular'] !== mainPackageJson.version) {
    failures.push(
      `PDF package dependency contract must peer @hell-ui/angular@${mainPackageJson.version}`,
    );
  }
  if (!peerDependencies.tailwindcss || peerDependenciesMeta.tailwindcss?.optional !== true) {
    failures.push(
      'PDF package dependency contract must declare optional tailwindcss for CSS entry points',
    );
  }
  for (const metaPeer of Object.keys(peerDependenciesMeta)) {
    if (!peerDependencies[metaPeer]) {
      failures.push(
        `PDF package dependency contract has peerDependenciesMeta for undeclared ${metaPeer}`,
      );
    }
  }

  const packageExports = packageJson.exports ?? {};
  for (const exportPath of ['./styles', './styles/pdf-viewer']) {
    const styleExport = packageExports[exportPath];
    if (!styleExport?.style) {
      failures.push(
        `PDF package style export ${exportPath} is missing from packages/pdf-viewer/package.json`,
      );
      continue;
    }
    if (styleExport[sourcePackageCondition] !== styleExport.style) {
      failures.push(
        `PDF package style export ${exportPath} must use the same local source CSS path for style and ${sourcePackageCondition}`,
      );
    }
    const sourceStylePath = packageStylePathToSourcePath(styleExport.style);
    if (!existsSync(join(root, 'packages/pdf-viewer', sourceStylePath))) {
      failures.push(`PDF package style export ${exportPath} points at missing ${styleExport.style}`);
    }
  }
  for (const exportPath of Object.keys(packageExports)) {
    if (exportPath.startsWith('./styles/components/')) {
      failures.push(`PDF package must not export legacy component style path ${exportPath}`);
    }
  }
  for (const relPath of [
    'packages/pdf-viewer/src/lib/styles/pdf-viewer.css',
    'packages/pdf-viewer/src/lib/styles/components/pdf-viewer.css',
  ]) {
    if (existsSync(join(root, relPath))) {
      failures.push(`PDF viewer CSS must be co-located; remove central style file: ${relPath}`);
    }
  }
  const ngPackage = parseJsonWithComments(
    readFile(join(root, 'packages/pdf-viewer/ng-package.json')),
  );
  if (JSON.stringify(ngPackage.assets ?? []).includes('pdf.worker')) {
    failures.push(
      'PDF package must document worker setup instead of copying pdf.worker.mjs into the package tarball',
    );
  }
  const readme = readFile(join(root, 'packages/pdf-viewer/README.md'));
  for (const text of [
    'pdfjs-dist@5.6.205',
    'pdf.worker.mjs',
    'worker',
    'node_modules/pdfjs-dist/build',
  ]) {
    if (!readme.includes(text))
      failures.push(`PDF package README is missing worker/dependency guidance: ${text}`);
  }
}

function checkStyleEntryPoints() {
  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const exportsMap = packageJson.exports ?? {};
  for (const exportPath of Object.keys(exportsMap)) {
    if (exportPath === './styles' || exportPath.startsWith('./styles/')) {
      failures.push(`Legacy category CSS package export must be removed: ${exportPath}`);
    }
  }

  const expectedStyleExports = entrypointStyleExports();

  for (const { exportPath, sourcePath } of expectedStyleExports) {
    const styleExport = exportsMap[exportPath];
    const style = styleExport?.style;
    if (!style) {
      failures.push(
        `Style Package Entry Point ${exportPath} is missing from packages/angular/package.json`,
      );
      continue;
    }

    if (style !== sourcePath || styleExport[sourcePackageCondition] !== sourcePath) {
      failures.push(
        `Style Package Entry Point ${exportPath} must resolve style and ${sourcePackageCondition} to ${sourcePath}`,
      );
    }

    if (!existsSync(join(root, libraryRoot, sourcePath.slice(2)))) {
      failures.push(`Style Package Entry Point ${exportPath} points at missing ${style}`);
    }
  }

  for (const relPath of [
    'packages/angular/styles/features/data-table.css',
    'packages/angular/styles/features/table-utilities.css',
    'packages/angular/styles/components/data-table.css',
    'packages/angular/styles/components/table-utilities.css',
    'packages/angular/styles/components/table-renderer.css',
  ]) {
    if (existsSync(join(root, relPath)))
      failures.push(`Legacy table CSS alias file must be removed: ${relPath}`);
  }

  const legacyStyleDirs = [
    'packages/angular/styles',
    'packages/angular/primitives/styles.css',
    'packages/angular/composites/styles.css',
  ];
  for (const rel of legacyStyleDirs) {
    if (existsSync(join(root, rel))) {
      failures.push(`Legacy category style artifact must be removed: ${rel}`);
    }
  }
}

function packageStylePathToSourcePath(packageStylePath) {
  if (packageStylePath.startsWith('./src/lib/styles/')) {
    return packageStylePath.slice(2);
  }
  if (packageStylePath.startsWith('./styles/')) {
    return packageStylePath.replace(/^\.\/styles/, 'src/lib/styles');
  }
  return packageStylePath;
}

function checkNgClassCustomizationContract() {
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    const ngClassImportFromCommon =
      /import\s+[^;]*@angular\/common[^;]*/.test(source) &&
      /\bNgClass\b/.test(source.match(/import\s+[^;]*@angular\/common[^;]*/)?.[0] ?? '');
    const ngClassTemplateBinding = /\[\s*ngClass\s*\]/.test(source);

    if (ngClassImportFromCommon || ngClassTemplateBinding) {
      failures.push(
        `${file.slice(root.length + 1)} uses NgClass or [ngClass]; style customization must use data attrs/CSS vars`,
      );
    }
  }
}

function checkAngularHostMetadataContract() {
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    if (!/\bHostBinding\b|\bHostListener\b|@HostBinding|@HostListener/.test(source)) continue;

    failures.push(
      `${file.slice(root.length + 1)} uses @HostBinding/@HostListener; use Angular host metadata instead`,
    );
  }
}

function checkBehaviorSentinelContract() {
  const files = libraryProductionTsFiles().map((file) => join(root, file));
  const styleSelectorPatterns = [
    /\.classList\.contains\(\s*['"]hell-/,
    /\.closest\(\s*['"]\.hell-/,
    /\.matches\(\s*['"]\.hell-/,
    /\.querySelector(?:All)?\(\s*['"]\.hell-/,
  ];

  for (const file of files) {
    const source = readFile(file);
    if (!styleSelectorPatterns.some((pattern) => pattern.test(source))) continue;

    failures.push(
      `${file.slice(root.length + 1)} uses .hell-* style classes as behavior sentinels; use data attributes or element refs`,
    );
  }
}

function checkAppShellBreakpointContract() {
  const shellSource = readFile(
    join(root, 'packages/angular/app-shell/app-shell.ts'),
  );
  const shellStyles = readFile(join(root, 'packages/angular/app-shell/styles.css'));
  const desktopMin = Number(
    /HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX\s*=\s*(\d+)/.exec(shellSource)?.[1],
  );

  if (!Number.isFinite(desktopMin)) {
    failures.push('App Shell breakpoint contract must expose HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX');
    return;
  }

  if (
    !shellSource.includes(
      'HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX = HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX - 1',
    )
  ) {
    failures.push(
      'App Shell mobile matchMedia breakpoint must derive from the desktop CSS breakpoint',
    );
  }

  if (!shellStyles.includes(`@media (min-width: ${desktopMin}px)`)) {
    failures.push(
      `App Shell CSS breakpoint must match HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX (${desktopMin}px)`,
    );
  }
}

function checkComponentContract() {
  const files = libraryProductionTsFiles()
    .map((file) => join(root, file))
    .filter((file) => !file.includes('/core/'));
  const publicStyleableModules = new Map();

  for (const file of files) {
    const source = readFile(file);
    const styleableClasses = exportedStyleableClasses(source);
    if (!styleableClasses.length) continue;

    const rel = file.slice(root.length + 1);
    for (const { className, classSource, moduleSource } of styleableClasses) {
      if (publicStyleableModules.has(className)) {
        failures.push(`Duplicate public styled Module ${className} in ${rel}`);
      }
      publicStyleableModules.set(className, rel);

      if (moduleSource.includes('extends HellPartStyleable')) {
        if (legacyStyleableAllowlist.has(className)) {
          failures.push(
            `${rel} ${className} migrated to HellPartStyleable but remains in the legacy HellStyleable allowlist`,
          );
        }
        if (!moduleSource.includes('part(') || !moduleSource.includes('recipe')) {
          failures.push(
            `${rel} ${className} extends HellPartStyleable but does not use the Part-Class Pipeline`,
          );
        }
        if (moduleSource.includes('unstyled')) {
          failures.push(`${rel} ${className} extends HellPartStyleable but keeps Style Opt-Out`);
        }
      } else if (extendsMigratedPartStyleMapBase(classSource)) {
        if (moduleSource.includes('unstyled')) {
          failures.push(`${rel} ${className} inherits a Part Style Map base but keeps Style Opt-Out`);
        }
      } else {
        if (!legacyStyleableAllowlist.has(className)) {
          failures.push(
            `${rel} ${className} extends legacy HellStyleable but is not in the not-yet-migrated allowlist`,
          );
        }
        if (!moduleSource.includes('!unstyled()')) {
          failures.push(
            `${rel} ${className} extends HellStyleable but does not gate default styling with Style Opt-Out`,
          );
        }
      }
    }

    for (const booleanInput of source.matchAll(
      /readonly\s+([A-Za-z0-9_]+)\s*=\s*input\(\s*(true|false)\s*,\s*\{[^}]*booleanAttribute/g,
    )) {
      const name = booleanInput[1];
      if (/preset/i.test(name)) {
        failures.push(
          `${rel} exposes boolean input "${name}" as a preset instead of a Customization Surface`,
        );
      }
    }
  }

  const contractSpec = readFile(join(root, 'packages/angular/component-contract.spec.ts'));
  const manifestSymbols = [...contractSpec.matchAll(/symbol:\s*'([A-Za-z0-9_]+)'/g)].map(
    (match) => match[1],
  );
  const manifestSet = new Set();
  for (const symbol of manifestSymbols) {
    if (manifestSet.has(symbol)) {
      failures.push(`Component Contract manifest declares ${symbol} more than once`);
    }
    manifestSet.add(symbol);
  }

  for (const [className, rel] of publicStyleableModules) {
    if (!manifestSet.has(className)) {
      failures.push(
        `${rel} exports styled Module ${className} but component-contract.spec.ts does not declare its Component Contract`,
      );
    }
  }

  for (const symbol of manifestSymbols) {
    if (!publicStyleableModules.has(symbol)) {
      failures.push(
        `component-contract.spec.ts declares ${symbol}, but no exported styled Module was found`,
      );
    }
  }

  for (const symbol of legacyStyleableAllowlist) {
    if (!publicStyleableModules.has(symbol)) {
      failures.push(
        `Legacy HellStyleable allowlist declares ${symbol}, but no exported styled Module was found; remove stale migrated/deleted symbols`,
      );
    }
  }
}

function extendsMigratedPartStyleMapBase(classSource) {
  const baseClass = /extends\s+([A-Za-z0-9_]+)/.exec(classSource)?.[1];
  return !!baseClass && migratedPartStyleMapClassNames.has(baseClass);
}

function checkPartStyleMapContract() {
  const styleableSource = readFile(join(root, 'packages/angular/core/styleable.ts'));
  const styleableCompact = compactSource(styleableSource);
  const mergeSource = readFile(join(root, 'packages/angular/core/part-style-merge.ts'));
  const packageConsumer = readFile(join(root, 'tools/check-package-consumer.mjs'));
  const releaseDryRun = readFile(join(root, 'tools/release-dry-run.mjs'));
  const productionReadyCheck = readFile(join(root, 'tools/production-ready-check.mjs'));
  const releaseEvidencePolicy = readFile(join(root, 'tools/release-evidence-policy.mjs'));
  const productionReadinessChecklist = readFile(
    join(root, 'docs/release/production-readiness-checklist.md'),
  );
  const entrypointPackageDirs = new Set(
    entrypointPublicApiFiles().map((entrypoint) => entrypoint.packageDir),
  );

  for (const symbol of ['HellUi', 'HellUiInput', 'HellRecipe', 'HellPartStyleable']) {
    if (
      !styleableSource.includes(
        `export ${symbol === 'HellPartStyleable' ? 'abstract class' : 'type'} ${symbol}`,
      )
    ) {
      failures.push(`Part Style Map core contract must export ${symbol}`);
    }
  }
  if (
    !/export\s+type\s+HellUiInput<Part extends string>\s*=\s*string\s*\|\s*HellUi<Part>\s*\|\s*null\s*\|\s*undefined/.test(
      styleableCompact,
    )
  ) {
    failures.push('HellUiInput must keep the string/default-part shorthand shape');
  }
  if (
    !/readonly\s+ui\s*=\s*input<\s*HellUiInput<Part>\s*>\(\s*undefined\s*,\s*\{\s*alias:\s*['"]ui['"]\s*\}\s*\)/.test(
      styleableCompact,
    )
  ) {
    failures.push('HellPartStyleable must own the public [ui] signal input');
  }
  if (/@Input\(\{\s*alias:\s*['"]ui['"]/.test(styleableCompact)) {
    failures.push('HellPartStyleable must not keep a decorator-based [ui] compatibility input');
  }
  if (/\b(?:set\s+ui|uiSignal)\b/.test(styleableCompact)) {
    failures.push('HellPartStyleable must not keep a parallel ui compatibility path');
  }
  if (!styleableSource.includes('const ui = this.ui()')) {
    failures.push('HellPartStyleable must read ui through its signal input');
  }
  if (!styleableSource.includes('protected abstract readonly defaultUiPart: Part')) {
    failures.push('HellPartStyleable must own a default public part for string shorthand');
  }
  if (!styleableSource.includes('hellTwMerge(this.recipe[part], this.uiClassForPart(part))')) {
    failures.push('HellPartStyleable must use the configured hellTwMerge Part-Class Pipeline');
  }
  if (
    !mergeSource.includes('extendTailwindMerge') ||
    !mergeSource.includes('export const hellTwMerge')
  ) {
    failures.push('Configured hellTwMerge must be built with tailwind-merge extendTailwindMerge');
  }

  const rootApiReport = readApiReport('hell-ui-angular.api.md');
  const coreApiReport = readApiReport('hell-ui-angular-core.api.md');
  for (const symbol of [
    'HellUi',
    'HellUiInput',
    'HellRecipe',
    'HellPartStyleable',
    'hellTwMerge',
  ]) {
    if (!rootApiReport.includes(symbol)) {
      failures.push(`Root API report must cover Part Style Map core export ${symbol}`);
    }
    if (!coreApiReport.includes(symbol)) {
      failures.push(`Core API report must cover Part Style Map core export ${symbol}`);
    }
  }
  for (const [label, report] of [
    ['Root', rootApiReport],
    ['Core', coreApiReport],
  ]) {
    if (!report.includes('readonly ui: i0.InputSignal<HellUiInput<Part>>')) {
      failures.push(`${label} API report must expose HellPartStyleable.ui as an InputSignal`);
    }
    if (
      !report.includes(
        '"ui": { "alias": "ui"; "required": false; "isSignal": true; }',
      )
    ) {
      failures.push(`${label} API report must expose HellPartStyleable ui metadata as signal input`);
    }
  }

  for (const module of migratedPartStyleMapModules) {
    checkMigratedPartStyleMapModule(module, entrypointPackageDirs);
  }
  checkBasicFloatingListStructuralAffordances();
  checkLegacyPartStyleCompatibilityHelpers();

  if (packageConsumer.includes('button-unstyled')) {
    failures.push('Package-consumer scenarios must use button-ui, not legacy button-unstyled');
  }
  if (!packageConsumer.includes("name: 'button-ui'")) {
    failures.push('Package-consumer scenarios must include button-ui for ui shorthand without CSS');
  }
  if (!packageConsumer.includes("name: 'button'")) {
    failures.push('Package-consumer scenarios must include styled button for compiled CSS proof');
  }
  if (!packageConsumer.includes('ui="') || !packageConsumer.includes('[ui]="')) {
    failures.push(
      'Package-consumer scenarios must compile ui string shorthand and part-map inputs',
    );
  }
  if (!packageConsumer.includes('--color-hell-primary:#3452ff')) {
    failures.push('Package-consumer button scenario must prove semantic token runtime theming');
  }
  if (functionBody(packageConsumer, 'buttonConsumerStylesCss')?.includes('@source')) {
    failures.push(
      'Button package-consumer CSS must prove shipped compiled CSS without consumer @source scanning',
    );
  }
  if (
    !packageConsumer.includes('HELL_PACKAGE_CONSUMER_RUNTIME_STYLE_CHECK') ||
    !packageConsumer.includes('runtimeStyleAssertions') ||
    !releaseDryRun.includes('HELL_PACKAGE_CONSUMER_RUNTIME_STYLE_CHECK')
  ) {
    failures.push(
      'Full release dry-run package-consumer evidence must compute semantic token runtime styles',
    );
  }
  if (
    !packageConsumer.includes(
      'built CSS contains Part Style Map compiled-CSS proof and semantic token output',
    )
  ) {
    failures.push('Package-consumer CSS assertion must name the Part Style Map compiled-CSS proof');
  }
  if (
    !releaseDryRun.includes('releaseCandidateConsumerScenarioNames') ||
    !releaseEvidencePolicy.includes("'button-ui'") ||
    !releaseEvidencePolicy.includes("'button'") ||
    releaseEvidencePolicy.includes('button-unstyled')
  ) {
    failures.push(
      'Release dry-run must include button-ui and styled button, and must not reference button-unstyled',
    );
  }
  if (
    !productionReadyCheck.includes('releaseCandidateConsumerScenarioNames') ||
    !productionReadinessChecklist.includes('"button-ui"') ||
    !productionReadinessChecklist.includes('"button"')
  ) {
    failures.push('Production-readiness package-consumer gate must require button-ui and button');
  }

  const migrationGuide = readFile(join(root, 'docs/release/first-beta-consumer-guide.md'));
  const readme = readFile(join(root, 'README.md'));
  const requiredMigrationGuideTerms = [
    'Part Style Maps replace Style Opt-Out',
    'HellButton',
    'HellInput',
    'HellNativeSelect',
    'HellTextarea',
    'HellDialpad',
    'ui="..."',
    '[ui]="{ ... }"',
    'class',
    'MUST replace',
    'legacyStyleableAllowlist',
    'consumer',
    '@source',
  ];
  for (const term of requiredMigrationGuideTerms) {
    if (!migrationGuide.includes(term)) {
      failures.push(`First beta migration guide must document Part Style Map policy term: ${term}`);
    }
  }
  if (!readme.includes('legacyStyleableAllowlist') || !readme.includes('MUST replace')) {
    failures.push(
      'README Component Contract must point to the not-yet-migrated allowlist with MUST replace wording',
    );
  }
}

function checkMigratedPartStyleMapModule(module, entrypointPackageDirs) {
  const source = readFile(join(root, module.sourcePath));
  const rel = module.sourcePath;
  const partNames = literalUnionMembers(source, module.partType);
  const moduleInfo = decoratedClassModules(source).find(
    (candidate) => candidate.className === module.className,
  );

  if (!partNames.length) {
    failures.push(`${rel} must export literal union ${module.partType}`);
  }
  if (!source.includes(`export type ${module.uiType} = HellUi<${module.partType}>`)) {
    failures.push(`${rel} must export ${module.uiType} = HellUi<${module.partType}>`);
  }
  if (!moduleInfo) {
    failures.push(`${rel} must export decorated class ${module.className}`);
    return;
  }

  const moduleSource = moduleInfo.moduleSource;
  if (!moduleInfo.classSource.includes(`extends HellPartStyleable<${module.partType}>`)) {
    failures.push(`${rel} ${module.className} must extend HellPartStyleable<${module.partType}>`);
  }
  if (/\bHellStyleable\b/.test(moduleSource)) {
    failures.push(`${rel} ${module.className} must not keep legacy HellStyleable`);
  }
  if (moduleSource.includes('unstyled')) {
    failures.push(`${rel} ${module.className} must not keep Style Opt-Out`);
  }
  if (!moduleSource.includes("part('") || !moduleSource.includes('recipe')) {
    failures.push(
      `${rel} ${module.className} must use the Part-Class Pipeline for rendered classes`,
    );
  }
  if (
    !source.includes(`satisfies HellRecipe<${module.partType}>`) &&
    !moduleSource.includes(`HellRecipe<${module.partType}>`)
  ) {
    failures.push(`${rel} must type its default recipe as HellRecipe<${module.partType}>`);
  }

  const defaultUiPart = /defaultUiPart\s*=\s*['"]([^'"]+)['"]/.exec(moduleSource)?.[1];
  if (!defaultUiPart) {
    failures.push(`${rel} ${module.className} must declare defaultUiPart for ui string shorthand`);
  } else if (!partNames.includes(defaultUiPart)) {
    failures.push(
      `${rel} ${module.className} defaultUiPart "${defaultUiPart}" is not in ${module.partType}`,
    );
  }

  if (/['"]\[attr\.data-slot\]['"]\s*:/.test(moduleSource)) {
    failures.push(
      `${rel} ${module.className} must not compute data-slot dynamically; it must match public parts`,
    );
  }
  const literalSlots = literalDataSlots(partStyleTemplateSource(source, moduleSource));
  for (const slot of literalSlots) {
    if (!partNames.includes(slot)) {
      failures.push(
        `${rel} ${module.className} renders data-slot="${slot}" outside ${module.partType}`,
      );
    }
  }
  for (const part of partNames) {
    if (!literalSlots.includes(part)) {
      failures.push(`${rel} ${module.className} public part "${part}" has no matching data-slot`);
    }
  }

  const forbiddenPatterns = [
    ['[ui].class', /\bui\s*\.\s*class\b|\[ui\]\.class/],
    ['omit map', /\bomit\b/i],
    ['public visual layers', /\b(?:visualLayers?|layers?)\b/],
    [
      'component-local merge helper',
      /\b(?:HellPartClassMerger|mergePartClasses|clsx|cva|tailwindVariants|twMerge|cn\()/,
    ],
    ['behavior sentinel in recipe classes', /\bdata-\[(?:action|key|value|role|control)[^\]]*\]/],
  ];
  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(moduleSource)) {
      failures.push(`${rel} ${module.className} must not expose ${label}`);
    }
  }
  if (module.legacyClass && legacyClassAppliedPattern(module.legacyClass).test(moduleSource)) {
    failures.push(
      `${rel} ${module.className} must not apply legacy .${module.legacyClass} default styling`,
    );
  }
  if (module.componentVariablePrefix && moduleSource.includes(module.componentVariablePrefix)) {
    failures.push(
      `${rel} ${module.className} must not introduce component-specific theme variables`,
    );
  }
  for (const offender of componentVariablePrefixOffenders(module)) {
    failures.push(
      `${offender.file}:${offender.line} must not expose migrated ${module.className} component-specific theme variable prefix ${module.componentVariablePrefix}`,
    );
  }

  const publicApi = readFile(join(root, module.publicApiPath));
  if (/\bHellStyleable\b/.test(publicApi)) {
    failures.push(
      `${module.publicApiPath} must not re-export legacy HellStyleable for migrated ${module.className}`,
    );
  }
  const expectedExport = `./${relative(dirname(module.publicApiPath), module.sourcePath)
    .replace(/\.ts$/, '')
    .replaceAll('\\', '/')}`;
  if (!publicApi.includes(expectedExport)) {
    failures.push(`${module.publicApiPath} must export ${expectedExport}`);
  }
  if (!entrypointPackageDirs.has(dirname(module.publicApiPath))) {
    failures.push(
      `Entrypoint metadata must include ${module.entrypointId} for ${module.className}`,
    );
  }

  for (const reportFile of module.apiReportFiles) {
    const report = readApiReport(reportFile);
    if (
      report.includes('export abstract class HellStyleable') ||
      report.includes('readonly unstyled:')
    ) {
      failures.push(
        `${reportFile} must not expose legacy HellStyleable for migrated ${module.className}`,
      );
    }
    for (const symbol of [module.className, module.partType, module.uiType]) {
      if (!report.includes(symbol)) {
        failures.push(`${reportFile} must cover migrated Part Style Map export ${symbol}`);
      }
    }
  }
}

function checkLegacyPartStyleCompatibilityHelpers() {
  const buttonCssPath = join(root, 'packages/angular/button/styles.css');
  const buttonCss = readFile(buttonCssPath);
  if (
    !buttonCss.includes('Legacy button-like helper') ||
    !buttonCss.includes('not migrated to Part') ||
    !buttonCss.includes('`ui` Part Style Map input')
  ) {
    failures.push(
      'Legacy .hell-button CSS helper must document that migrated Button customization belongs to ui',
    );
  }

  const sourceFiles = libraryProductionTsFiles().map((file) => join(root, file));
  for (const file of sourceFiles) {
    const rel = file.slice(root.length + 1);
    for (const module of decoratedClassModules(readFile(file))) {
      if (!legacyClassAppliedPattern('hell-button').test(module.moduleSource)) continue;
      if (!legacyStyleableAllowlist.has(module.className)) {
        failures.push(
          `${rel} ${module.className} applies legacy .hell-button outside legacyStyleableAllowlist`,
        );
      }
    }
  }
}

function checkBasicFloatingListStructuralAffordances() {
  const selectStyles = readFile(join(root, 'packages/angular/select/styles.css'));
  if (
    !selectStyles.includes("hell-select-basic [hellSelect][data-slot='trigger']::after") ||
    !selectStyles.includes("hell-select-basic [hellSelect][data-slot='trigger'][data-open]::after")
  ) {
    failures.push(
      'SelectBasic trigger part must keep the shipped select chevron structural CSS',
    );
  }

  const comboboxStyles = readFile(join(root, 'packages/angular/combobox/styles.css'));
  if (
    !comboboxStyles.includes(
      "hell-combobox-basic [hellComboboxButton][data-slot='button']::after",
    ) ||
    !comboboxStyles.includes(
      "hell-combobox-basic [hellCombobox][data-slot='control'][data-open] [hellComboboxButton][data-slot='button']::after",
    )
  ) {
    failures.push(
      'ComboboxBasic button part must keep the shipped combobox chevron structural CSS',
    );
  }
}

function componentVariablePrefixOffenders(module) {
  if (!module.componentVariablePrefix) return [];

  const files = libraryPackageFiles().filter(
    (file) =>
      (file.endsWith('.ts') || file.endsWith('.css')) &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts'),
  );
  const offenders = [];
  for (const file of files) {
    const source = readFile(file);
    if (!source.includes(module.componentVariablePrefix)) continue;
    const rel = file.slice(root.length + 1);
    for (const [index, line] of source.split(/\r?\n/).entries()) {
      if (line.includes(module.componentVariablePrefix)) {
        offenders.push({ file: rel, line: index + 1 });
      }
    }
  }
  return offenders;
}

function literalUnionMembers(source, typeName) {
  const match = new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`).exec(source);
  if (!match) return [];

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((candidate) => candidate[1]);
}

function literalDataSlots(source) {
  const patterns = [
    /\bdata-slot\s*=\s*"([^"]+)"/g,
    /\bdata-slot\s*=\s*'([^']+)'/g,
    /['"]data-slot['"]\s*:\s*['"]([^'"]+)['"]/g,
  ];
  return [
    ...new Set(
      patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((candidate) => candidate[1])),
    ),
  ];
}

function partStyleTemplateSource(source, moduleSource) {
  const templateRef = /template\s*:\s*([A-Za-z0-9_]+)/.exec(moduleSource)?.[1];
  if (!templateRef) return moduleSource;

  const pattern = new RegExp(`const\\s+${escapeRegExp(templateRef)}\\s*=\\s*\`([\\s\\S]*?)\`;`);
  const template = pattern.exec(source)?.[1];
  return template ? `${moduleSource}\n${template}` : moduleSource;
}

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start === -1) return null;

  const open = source.indexOf('{', start);
  if (open === -1) return null;

  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }

  return null;
}

function readApiReport(fileName) {
  return readFile(join(root, 'etc/api-reports', fileName));
}

function legacyClassAppliedPattern(className) {
  const escaped = escapeRegExp(className);
  return new RegExp(
    `\\[class\\.${escaped}\\]|class\\s*=\\s*["'][^"']*\\b${escaped}\\b|classList\\.add\\(\\s*["']${escaped}["']`,
  );
}

function compactSource(source) {
  return source.replace(/\s+/g, ' ').trim();
}

function checkLabelContract() {
  const labelsSource = readFile(join(root, 'packages/angular/core/labels.ts'));
  for (const symbol of ['HELL_LABELS', 'HELL_DEFAULT_LABELS', 'provideHellLabels']) {
    if (!labelsSource.includes(symbol)) failures.push(`Label Contract is missing ${symbol}`);
  }

  const rootApi = readFile(join(root, 'packages/angular/public-api.ts'));
  const coreApi = readFile(join(root, 'packages/angular/core/public-api.ts'));
  const rootApiExportsCoreAggregate =
    rootApi.includes('./lib/public-api-core') ||
    rootApi.includes('./public-api-core') ||
    rootApi.includes('./core/public-api');

  for (const [api, source] of [
    ['packages/angular/public-api.ts', rootApi],
    ['packages/angular/core/public-api.ts', coreApi],
  ]) {
    const sourceExportsLabelContract =
      source.includes('./lib/core/labels') ||
      source.includes('./core/labels') ||
      source.includes('./labels') ||
      (api === 'packages/angular/public-api.ts' && rootApiExportsCoreAggregate);
    if (!sourceExportsLabelContract) {
      failures.push(`Label Contract is not exported from ${api}`);
    }
  }

  const spinnerSource = readFile(
    join(root, 'packages/angular/skeleton/skeleton.ts'),
  );
  if (!spinnerSource.includes('HELL_LABELS') || spinnerSource.includes("'aria-label': 'Loading'")) {
    failures.push('HellSpinner must read its default aria-label from the Label Contract');
  }

  const paginationSource = readFile(
    join(root, 'packages/angular/pagination/pagination.ts'),
  );
  for (const hardcoded of [
    'aria-label="First page"',
    'aria-label="Previous page"',
    "'Page ' + p",
  ]) {
    if (paginationSource.includes(hardcoded)) {
      failures.push('HellPaginationStrip must read built-in labels from the Label Contract');
    }
  }

  const labelConsumers = [
    [
      'packages/angular/app-shell/app-shell.ts',
      ['Expand sidebar', 'Collapse sidebar'],
    ],
    [
      'packages/angular/audio-player/audio-player.ts',
      ['Show live captions', 'Copy transcript', '>Live<', '>Paused<'],
    ],
    ['packages/angular/breadcrumbs/breadcrumbs.ts', ['Show hidden navigation']],
    ['packages/angular/date-input/date-input.ts', ['Choose date']],
    ['packages/angular/resizable/resizable.ts', ['Resize panels']],
    [
      'packages/angular/time-input/time-input.ts',
      ['Choose time', 'Subtract 5 minutes'],
    ],
    [
      'packages/angular/toast/toast.ts',
      ['aria-label="Notifications"', 'aria-label="Dismiss"'],
    ],
    ['packages/angular/table/table-utilities.ts', ['Resize column']],
    [
      'packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.html',
      ['Find in document', 'Zoom level'],
    ],
    [
      'packages/angular/date-picker/date-picker.ts',
      ['Previous year', 'Previous month'],
    ],
  ];

  for (const [file, hardcodedLabels] of labelConsumers) {
    const source = readFile(join(root, file));
    if (!source.includes('labels.')) {
      failures.push(`${file} must consume the Label Contract for built-in text`);
    }
    for (const label of hardcodedLabels) {
      if (source.includes(label)) {
        failures.push(`${file} hardcodes "${label}" instead of using the Label Contract`);
      }
    }
  }
}

function exportedStyleableClasses(source) {
  const styleableBases = new Set([
    'HellNativeCheckbox',
    'HellNativeRadio',
    ...[
      ...source.matchAll(
        /(?:abstract\s+)?class\s+([A-Za-z0-9_]+)[^{]*extends\s+(?:HellStyleable|HellPartStyleable|HellNativeInteractiveDisabledGuard)\b/g,
      ),
    ].map((match) => match[1]),
  ]);

  return decoratedClassModules(source).filter((module) => {
    if (
      module.classSource.includes('extends HellStyleable') ||
      module.classSource.includes('extends HellPartStyleable')
    ) {
      return true;
    }

    const base = /extends\s+([A-Za-z0-9_]+)/.exec(module.classSource)?.[1];
    return !!base && styleableBases.has(base);
  });
}

function decoratedClassModules(source) {
  const matches = [
    ...source.matchAll(/export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)(?:<[^>{}]*>)?[\s\S]*?\{/g),
  ];
  const moduleStarts = matches.map((match, index) => {
    const classStart = match.index;
    const previousClassStart = index === 0 ? 0 : matches[index - 1].index;
    const directiveStart = source.lastIndexOf('@Directive', classStart);
    const componentStart = source.lastIndexOf('@Component', classStart);
    const decoratorStart = Math.max(directiveStart, componentStart);
    return decoratorStart > previousClassStart ? decoratorStart : classStart;
  });

  return matches.map((match, index) => ({
    className: match[1],
    classSource: match[0],
    moduleSource: source.slice(moduleStarts[index], moduleStarts[index + 1] ?? source.length),
  }));
}

function checkCodeEditorRuntimeContract() {
  const source = readFile(
    join(root, 'packages/angular/features/code-editor/code-editor.runtime.ts'),
  );

  if (source.includes('innerHTML')) {
    failures.push('Code Editor Runtime must build fold gutter markers without innerHTML');
  }

  if (!source.includes('createElementNS')) {
    failures.push('Code Editor Runtime must create SVG fold markers through DOM APIs');
  }
}

function checkExperimentalFeatureContract() {
  const audioSource = readFile(
    join(root, 'packages/angular/audio-player/audio-player.ts'),
  );
  if (!/allowSpeechTranscript\s*=\s*input\(false/.test(audioSource)) {
    failures.push('Audio speech transcript must remain explicitly opt-in while experimental');
  }
  if (!/allowLiveCaptions\s*=\s*input\(false/.test(audioSource)) {
    failures.push('Audio live captions compatibility alias must remain explicitly opt-in');
  }
  if (!audioSource.includes('@experimental Browser speech transcripts')) {
    failures.push(
      'HellAudioPlayer must mark browser speech transcript experimental in its public JSDoc',
    );
  }

  const audioDocs = readFile(
    join(root, 'apps/docs/src/app/pages/components/audio-player/audio-player.page.ts'),
  );
  if (
    !/speech transcript is experimental/i.test(audioDocs) ||
    !/default <code>false<\/code>/.test(audioDocs)
  ) {
    failures.push('Audio Player docs must disclose experimental opt-in speech transcript');
  }

  const pdfSource = readFile(
    join(root, 'packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts'),
  );
  if (!pdfSource.includes('@experimental This feature wraps pdf.js')) {
    failures.push('HellPdfViewer must mark the pdf.js wrapper experimental in its public JSDoc');
  }

  const pdfFeatureApi = readFile(join(root, 'packages/pdf-viewer/src/public-api.ts'));
  if (!/HellPdfWorkerSource/.test(pdfFeatureApi)) {
    failures.push(
      'PDF Viewer package entry point must export the public HellPdfWorkerSource worker input type',
    );
  }

  const pdfDocs = readFile(
    join(root, 'apps/docs/src/app/pages/components/pdf-viewer/pdf-viewer.page.ts'),
  );
  if (!/PDF viewer is experimental/.test(pdfDocs)) {
    failures.push('PDF Viewer docs must disclose experimental status');
  }
  if (!/worker[^.]*package does not copy\s+a worker into either package tarball/s.test(pdfDocs)) {
    failures.push('PDF Viewer docs must disclose that apps provide the pdf.js worker source');
  }
}

function checkFormsContract() {
  const cvaModules = [
    ['packages/angular/checkbox/checkbox.ts', 'HellCheckbox'],
    ['packages/angular/switch/switch.ts', 'HellSwitch'],
    ['packages/angular/radio/radio.ts', 'HellRadioGroup'],
    ['packages/angular/select/select.ts', 'HellSelect'],
    ['packages/angular/combobox/combobox.ts', 'HellCombobox'],
    ['packages/angular/slider/slider.ts', 'HellSlider'],
    ['packages/angular/toggle/toggle.ts', 'HellToggleGroup'],
    ['packages/angular/date-input/date-input.ts', 'HellDateInput'],
    ['packages/angular/time-input/time-input.ts', 'HellTimeInput'],
    ['packages/angular/features/code-editor/code-editor.ts', 'HellCodeEditor'],
  ];

  for (const [file, className] of cvaModules) {
    const source = readFile(join(root, file));
    const classDecl = new RegExp(
      `class\\s+${className}\\b[^{]*implements[^{]*ControlValueAccessor`,
    ).test(source);
    if (!classDecl || !source.includes('NG_VALUE_ACCESSOR')) {
      failures.push(`${file} ${className} must implement ControlValueAccessor`);
    }
  }
}

function checkDateTimeAdapterContract() {
  const checks = [
    {
      sourcePath: 'packages/angular/date-input/date-input.ts',
      docsPath: 'apps/docs/src/app/pages/components/date-input/date-input.page.ts',
      tokens: ['HELL_DATE_INPUT_ADAPTER', 'provideHellDateInputAdapter', 'HellDateInputAdapter'],
    },
    {
      sourcePath: 'packages/angular/time-input/time-input.ts',
      docsPath: 'apps/docs/src/app/pages/components/time-input/time-input.page.ts',
      tokens: ['HELL_TIME_INPUT_ADAPTER', 'provideHellTimeInputAdapter', 'HellTimeInputAdapter'],
    },
  ];

  for (const check of checks) {
    const source = readFile(join(root, check.sourcePath));
    const docs = readFile(join(root, check.docsPath));
    for (const token of check.tokens) {
      if (!source.includes(token)) failures.push(`${check.sourcePath} must expose ${token}`);
      if (!docs.includes(token)) failures.push(`${check.docsPath} must document ${token}`);
    }
  }
}

function checkSearchContract() {
  const source = readFile(join(root, 'packages/angular/core/search.ts'));
  for (const symbol of ['HELL_SEARCH_RANKER', 'provideHellSearchRanker', 'hellRankLocalSearch']) {
    if (!source.includes(symbol)) failures.push(`Search Core is missing ${symbol}`);
  }

  const docs = readFile(
    join(root, 'apps/docs/src/app/pages/components/omnibar/omnibar.page.ts'),
  );
  if (!docs.includes('provideHellSearchRanker') || !docs.includes('Fuse.js')) {
    failures.push(
      'Omnibar docs must direct serious search through a ranker Adapter or async source',
    );
  }
}

function checkHotkeyContract() {
  const hotkeySource = readFile(join(root, 'packages/angular/internal/hotkeys/hotkeys.ts'));
  if (!hotkeySource.includes('HellGlobalKeydownService')) {
    failures.push('Internal Hotkeys must provide a shared global keydown listener service');
  }
  if (!hotkeySource.includes('HellGlobalPointerdownService')) {
    failures.push('Internal Hotkeys must provide a shared global pointer listener service');
  }

  const coreApi = readFile(join(root, 'packages/angular/core/public-api.ts'));
  if (coreApi.includes('hotkeys')) {
    failures.push('Core Package Entry Point must keep hotkey listener internals private');
  }

  const hotkeyPublicSymbols = [
    'matchHotkey',
    'hellShouldHandleGlobalHotkey',
    'HellGlobalKeydownService',
    'HellGlobalPointerdownService',
    'HellGlobalKeydownHandler',
    'HellGlobalPointerdownHandler',
  ];
  const publicHotkeySurfaces = [
    ['Core Package Entry Point', coreApi],
    [
      'Omnibar Package Entry Point',
      readFile(join(root, 'packages/angular/omnibar/omnibar.ts')),
    ],
  ];
  for (const [label, source] of publicHotkeySurfaces) {
    const leaked = hotkeyPublicSymbols.filter((symbol) => exportedSymbolNames(source).has(symbol));
    if (leaked.length) {
      failures.push(`${label} must not export hotkey internals: ${leaked.join(', ')}`);
    }
  }

  const internalHotkeysApi = readFile(
    join(root, 'packages/angular/internal/hotkeys/public-api.ts'),
  );
  const internalHotkeyExports = exportedSymbolNames(hotkeySource);
  const allowedInternalHotkeyExports = new Set([
    'HellGlobalKeydownHandler',
    'HellGlobalKeydownService',
    'HellGlobalPointerdownHandler',
    'HellGlobalPointerdownService',
    'hellShouldHandleGlobalHotkey',
    'matchHotkey',
  ]);
  for (const symbol of allowedInternalHotkeyExports) {
    if (!internalHotkeyExports.has(symbol)) {
      failures.push(
        `Internal Hotkeys Entry Point must export shared listener owner symbol ${symbol}`,
      );
    }
  }
  const unexpectedInternalHotkeyExports = [...internalHotkeyExports].filter(
    (symbol) => !allowedInternalHotkeyExports.has(symbol),
  );
  if (unexpectedInternalHotkeyExports.length) {
    failures.push(
      `Internal Hotkeys Entry Point must only export shared listener owner symbols: ${unexpectedInternalHotkeyExports.join(
        ', ',
      )}`,
    );
  }
  if (!internalHotkeysApi.includes("export * from './hotkeys';")) {
    failures.push('Internal Hotkeys Entry Point must re-export the hotkeys module');
  }

  const omnibarSource = readFile(join(root, 'packages/angular/omnibar/omnibar.ts'));
  if (omnibarSource.includes('document.addEventListener')) {
    failures.push('HellOmnibar must register global hotkeys through HellGlobalKeydownService');
  }

  const pdfSource = readFile(
    join(root, 'packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts'),
  );
  if (pdfSource.includes('window:keydown') || pdfSource.includes('window:pointerdown')) {
    failures.push('HellPdfViewer must register global shortcuts through shared listener services');
  }
}

function checkNativeButtonSelectorContract() {
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    for (const module of decoratedClassModules(source)) {
      if (!/\btype:\s*['"]button['"]/.test(module.moduleSource)) continue;

      const selector = /selector:\s*['"]([^'"]+)['"]/.exec(module.moduleSource)?.[1];
      if (!selector) continue;

      const unsafeArms = selector
        .split(',')
        .map((arm) => arm.trim())
        .filter((arm) => !/^button(?:\b|\[|\.|#|:)/.test(arm));

      if (unsafeArms.length) {
        failures.push(
          `${rel} ${module.className} sets type=button but selector allows non-button hosts: ${unsafeArms.join(', ')}`,
        );
      }
    }
  }
}

function checkInteractiveTriggerSelectorContract() {
  const nativeInteractiveTriggers = new Set([
    'hellDialogTrigger',
    'hellPopoverTrigger',
    'hellTooltipTrigger',
    'hellMenuTrigger',
    'hellFlyoutTrigger',
  ]);
  const files = libraryProductionTsFiles().map((file) => join(root, file));

  for (const file of files) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    for (const module of decoratedClassModules(source)) {
      const selector = /selector:\s*['"]([^'"]+)['"]/.exec(module.moduleSource)?.[1];
      if (!selector) continue;
      const trigger = [...nativeInteractiveTriggers].find((name) => selector.includes(name));
      if (!trigger) continue;

      const unsafeArms = selector
        .split(',')
        .map((arm) => arm.trim())
        .filter((arm) => !/^(?:button|a)(?:\b|\[|\.|#|:)/.test(arm));

      if (unsafeArms.length) {
        failures.push(
          `${rel} ${module.className} exposes ${trigger} on non-native interactive hosts: ${unsafeArms.join(', ')}`,
        );
      }
    }
  }
}

function checkTableUtilityContract() {
  const source = readFile(
    join(root, 'packages/angular/table/table-utilities.ts'),
  );
  if (!source.includes('HELL_TABLE_UTILITIES_DIRECTIVES')) {
    failures.push(
      'Table primitives must expose HELL_TABLE_UTILITIES_DIRECTIVES as their standalone import list',
    );
  }
  for (const selector of [
    'hellTableRoot',
    'hellTableHeader',
    'hellTableBody',
    'hellTableRow',
    'hellTableHeaderCell',
    'hellTableCell',
    'hellTableResizeHandle',
  ]) {
    if (!source.includes(selector)) {
      failures.push(`Table primitives must expose host-agnostic selector ${selector}`);
    }
  }
  for (const dataAttr of [
    'data-hell-table-root',
    'data-hell-table-header',
    'data-hell-table-body',
    'data-hell-table-row',
    'data-hell-table-header-cell',
    'data-hell-table-cell',
  ]) {
    if (!source.includes(dataAttr)) {
      failures.push(`Table primitives must stamp ${dataAttr} for host-agnostic testing/styling`);
    }
  }
  if (!source.includes('hellTableInferredRoleForHost')) {
    failures.push(
      'Table primitives must keep host-agnostic role inference centralized and SSR-safe',
    );
  }
  for (const removed of [
    'HELL_TABLE_UTILITY_DIRECTIVES',
    'HELL_TABLE_DIRECTIVES',
    'selectionSemantics',
  ]) {
    if (source.includes(removed)) failures.push(`${removed} legacy table API must be removed`);
  }
  if (/readonly\s+interactive\b/.test(source)) {
    failures.push('HellTableRow interactive legacy input must be removed');
  }

  const tableHarness = readFile(join(root, 'packages/angular/testing/table-harness.ts'));
  if (/\binteractive\?\s*:|\bisInteractive\b/.test(tableHarness)) {
    failures.push('Testing table harness must not expose interactive legacy row aliases');
  }

  const tableFacade = readFile(join(root, 'packages/angular/table/table.ts'));
  if (!tableFacade.includes('./table-utilities')) {
    failures.push('Modern @hell-ui/angular/table facade must own the table utilities export');
  }

  const docs = readFile(
    join(root, 'apps/docs/src/app/pages/components/table/table.page.ts'),
  );
  const docsRoot = join(root, 'apps/docs/src/app');
  const docsGlobalStyles = readFile(join(root, 'apps/docs/src/styles.css'));
  if (!docsGlobalStyles.includes("@import '@hell-ui/angular/table/styles.css';")) {
    failures.push(
      'Docs app must load table CSS from the global stylesheet so production routes are styled',
    );
  }
  const routeTableStyleImports = walk(docsRoot)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) =>
      moduleImportSpecifiers(file).filter(
        (importHit) => importHit.specifier === '@hell-ui/angular/table/styles.css',
      ),
    );
  for (const importHit of routeTableStyleImports) {
    failures.push(
      `Docs table routes must not rely on TypeScript side-effect imports for table CSS: ${relPath(
        importHit.file,
      )}:${importHit.line}`,
    );
  }
  const tableStyleSource = readFile(
    join(root, 'packages/angular/table/styles.css'),
  );
  for (const forbidden of [
    'button.hell-table-row-action:not(.hell-button)',
    'a.hell-table-row-action:not(.hell-button)',
    '.hell-table-row-checkbox.hell-checkbox',
    '.hell-table-row-radio.hell-radio',
    '.hell-column-visibility-panel .hell-checkbox',
    '.hell-column-visibility-panel .hell-button',
  ]) {
    if (tableStyleSource.includes(forbidden)) {
      failures.push(`Table styles must compose primitives instead of special-casing ${forbidden}`);
    }
  }
  if (/\baccent-color\s*:/.test(tableStyleSource)) {
    failures.push(
      'Table styles must not override native checkbox/radio accent-color; compose checkbox/radio primitives instead',
    );
  }
  for (const text of [
    'Hell supports two table paths',
    '@hell-ui/angular/table',
    '@hell-ui/angular/table-tanstack',
    'TanStack owns columns, rows, sorting, filtering, pagination, selection, pinning, sizing',
  ]) {
    if (!docs.includes(text)) {
      failures.push('Table docs must present the two-path primitive/TanStack ownership boundary');
      break;
    }
  }
  const offenders = walk(docsRoot)
    .filter((file) => /\.(?:ts|html|md)$/.test(file))
    .filter((file) =>
      /@hell-ui\/angular\/features\/(?:data-table|table-utilities)\b/.test(readFile(file)),
    )
    .map((file) => file.slice(root.length + 1));
  if (offenders.length) {
    failures.push(
      `Docs must not reference legacy table feature entrypoints: ${offenders.join(', ')}`,
    );
  }
}

function checkTableSemanticsContract() {
  const tableSourcePath = join(
    root,
    'packages/angular/table/table-utilities.ts',
  );
  const tableSource = readFile(tableSourcePath);
  const tableModule = decoratedClassModules(tableSource).find(
    (module) => module.className === 'HellTable',
  );
  const rowModule = decoratedClassModules(tableSource).find(
    (module) => module.className === 'HellTableRow',
  );

  if (!tableModule) {
    failures.push('Table semantics contract must be owned by HellTable');
  } else {
    if (!tableModule.moduleSource.includes("[attr.role]': 'role()")) {
      failures.push('HellTable must keep host role inference through role()');
    }
    for (const forbidden of [
      'aria-activedescendant',
      'aria-rowcount',
      'aria-colcount',
      '(keydown)',
      'tabindex',
    ]) {
      if (tableModule.moduleSource.includes(forbidden)) {
        failures.push(`HellTable primitive root must not own grid/focus behavior: ${forbidden}`);
      }
    }
  }

  if (!rowModule) {
    failures.push('Table semantics contract must include HellTableRow');
  } else {
    for (const forbidden of [
      '[attr.tabindex]',
      '(click)',
      '(keydown',
      'aria-selected',
      'aria-activedescendant',
    ]) {
      if (rowModule.moduleSource.includes(forbidden)) {
        failures.push(`HellTableRow must stay passive in primitive table mode: ${forbidden}`);
      }
    }
  }

  for (const [specPath, required] of [
    [
      'packages/angular/table/table.spec.ts',
      'uses native table markup without adding redundant ARIA or row-as-button behavior',
    ],
    ['packages/angular/table/table.spec.ts', "native-root').getAttribute('role')).toBeNull()"],
    ['packages/angular/table/table.spec.ts', "native-cell').getAttribute('role')).toBeNull()"],
    [
      'packages/angular/table/table.spec.ts',
      "native-root').hasAttribute('tabindex')).toBe(false)",
    ],
    [
      'packages/angular/table/table.spec.ts',
      "native-root').hasAttribute('aria-activedescendant')).toBe(false)",
    ],
  ]) {
    if (!readFile(join(root, specPath)).includes(required)) {
      failures.push(`Table semantics contract test is missing: ${specPath} ${required}`);
    }
  }

  for (const forbidden of [
    'HellTableSemantics',
    'HellTableGridInteractionMode',
    'interactionMode',
    'isGridMode',
    'gridActiveDescendant',
    'aria-activedescendant',
  ]) {
    if (tableSource.includes(forbidden)) {
      failures.push(`Table primitives must not expose Hell-owned grid mode: ${forbidden}`);
    }
  }
}

function checkTableSortTriggerContract() {
  const tableSourcePath = join(
    root,
    'packages/angular/table/table-utilities.ts',
  );
  const tableSource = readFile(tableSourcePath);
  const headerModule = decoratedClassModules(tableSource).find(
    (module) => module.className === 'HellTableHeaderCell',
  );

  if (!headerModule) {
    failures.push('Table utilities must declare HellTableHeaderCell');
    return;
  }

  if (headerModule.moduleSource.includes('[attr.tabindex]')) {
    failures.push('HellTableHeaderCell must not make the <th> focusable for sorting');
  }

  if (/(?:'|\")\(keydown\.|(?:'|\")\(click\)/.test(headerModule.moduleSource)) {
    failures.push(
      'HellTableHeaderCell must delegate sort activation to button[hellTableSortTrigger]',
    );
  }

  if (!/export\s+class\s+HellTableSortTrigger\b/.test(tableSource)) {
    failures.push('Table utilities must expose button[hellTableSortTrigger] for sortable headers');
  }

  if (!/selector:\s*'button\[hellTableSortTrigger\]'/.test(tableSource)) {
    failures.push('hellTableSortTrigger must only match native button hosts');
  }

  if (/hellTableSortButton|HellTableSortButton|hell-table-sort-button/.test(tableSource)) {
    failures.push('Legacy hellTableSortButton API must not remain in table utilities');
  }

  const docsRoot = join(root, 'apps/docs/src/app/pages/components/table');
  const docsFiles = walk(docsRoot).filter((file) => file.endsWith('.ts'));
  for (const file of docsFiles) {
    const source = readFile(file);
    for (const match of source.matchAll(
      /<th\b(?=[^>]*\bhellTableHeaderCell\b)(?=[^>]*\bsortable\b)[^>]*>[\s\S]*?<\/th>/g,
    )) {
      if (!match[0].includes('hellTableSortTrigger')) {
        failures.push(
          `${file.slice(root.length + 1)} has a sortable table header without button[hellTableSortTrigger]`,
        );
      }
    }
  }
}

function checkTableResizeHandleContract() {
  const tableSourcePath = join(
    root,
    'packages/angular/table/table-utilities.ts',
  );
  const tableSource = readFile(tableSourcePath);

  if (!/export\s+class\s+HellTableResizeHandle\b/.test(tableSource)) {
    failures.push('Table utilities must expose HellTableResizeHandle for modern column resizing');
  }

  if (!/selector:\s*'\[hellTableResizeHandle\]'/.test(tableSource)) {
    failures.push('Table resize primitive must use the hellTableResizeHandle selector');
  }

  if (!tableSource.includes('resizeAdapter = input<HellTableResizeAdapter | null>')) {
    failures.push(
      'HellTableResizeHandle must delegate sizing through HellTableResizeAdapter input',
    );
  }

  if (
    /hellTableColumnResizer|HellTableColumnResizer|hell-table-column-resizer|HellTableColumnResizeRuntime|data-table-column-resize/.test(
      tableSource,
    )
  ) {
    failures.push('Legacy hellTableColumnResizer API must not remain in table utilities');
  }

  const styleSource = readFile(join(root, 'packages/angular/table/styles.css'));
  if (!styleSource.includes("[hellTableResizeHandle][data-slot='root']")) {
    failures.push('Table resize handle styles must use hellTableResizeHandle root part selectors');
  }
  if (/hell-table-column-resizer/.test(styleSource)) {
    failures.push('Legacy hell-table-column-resizer class must be removed from table styles');
  }

  const tableHarness = readFile(join(root, 'packages/angular/testing/table-harness.ts'));
  if (
    !tableHarness.includes('HellTableResizeHandleHarness') ||
    !tableHarness.includes('getResizeHandle')
  ) {
    failures.push(
      'Testing table harness must expose HellTableResizeHandleHarness and getResizeHandle',
    );
  }
  if (/HellTableColumnResizerHarness|getColumnResizer|hellTableColumnResizer/.test(tableHarness)) {
    failures.push('Testing table harness must not expose legacy column-resizer APIs');
  }

  const docsRoot = join(root, 'apps/docs/src/app');
  const docsOffenders = walk(docsRoot)
    .filter((file) => /\.(?:ts|html|md)$/.test(file))
    .filter((file) => {
      const source = readFile(file);
      return /hellTableColumnResizer|HellTableColumnResizer|columnResize/.test(
        sourceWithoutAllowedTableMigrationNote(source),
      );
    })
    .map((file) => file.slice(root.length + 1));
  if (docsOffenders.length) {
    failures.push(
      `Docs must use hellTableResizeHandle instead of legacy resizer APIs: ${docsOffenders.join(', ')}`,
    );
  }
}

function sourceWithoutAllowedTableMigrationNote(source) {
  return source.replace(/<h2>Migration note<\/h2>[\s\S]*?<h2>API<\/h2>/, '<h2>API</h2>');
}

function checkTableLegacyRemovalContract() {
  const legacyEntrypointSpecifiers = [
    '@hell-ui/angular/features/data-table',
    '@hell-ui/angular/features/table-utilities',
  ];
  const legacyStyleSpecifiers = [
    '@hell-ui/angular/styles/features/data-table',
    '@hell-ui/angular/styles/features/table-utilities',
  ];
  const legacyEntrypointFiles = [
    'packages/angular/features/data-table/ng-package.json',
    'packages/angular/features/table-utilities/ng-package.json',
    'packages/angular/public-api-feature-data-table.ts',
    'packages/angular/public-api-feature-table-utilities.ts',
  ];
  const legacyStyleFiles = [
    'packages/angular/styles/features/data-table.css',
    'packages/angular/styles/features/table-utilities.css',
    'packages/angular/styles/components/data-table.css',
    'packages/angular/styles/components/table-utilities.css',
  ];

  const manifestSpecifiers = new Set(
    entrypointPublicApiFiles().map((entrypoint) => entrypoint.specifier),
  );
  const packageJson = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const tsconfig = parseJsonWithComments(readFile(join(root, 'tsconfig.json')));
  const tsconfigPaths = tsconfig.compilerOptions?.paths ?? {};
  const exportsMap = packageJson.exports ?? {};

  for (const specifier of legacyEntrypointSpecifiers) {
    if (manifestSpecifiers.has(specifier)) {
      failures.push(`Legacy table entry point must be absent from the manifest: ${specifier}`);
    }
    if (tsconfigPaths[specifier]) {
      failures.push(`Legacy table entry point must be absent from tsconfig paths: ${specifier}`);
    }
  }

  for (const exportPath of ['./features/data-table', './features/table-utilities']) {
    if (exportsMap[exportPath]) {
      failures.push(`Legacy table package export must be removed: ${exportPath}`);
    }
  }

  for (const exportPath of ['./styles/features/data-table', './styles/features/table-utilities']) {
    if (exportsMap[exportPath]) {
      failures.push(`Legacy table CSS package export must be removed: ${exportPath}`);
    }
  }

  for (const rel of [...legacyEntrypointFiles, ...legacyStyleFiles]) {
    if (existsSync(join(root, rel)))
      failures.push(`Legacy table alias file must be removed: ${rel}`);
  }

  const importRoots = ['packages/angular', 'apps/docs/src/app'];
  const legacyModuleSpecifiers = [...legacyEntrypointSpecifiers, ...legacyStyleSpecifiers];
  const importFiles = importRoots
    .filter((rel) => existsSync(join(root, rel)))
    .flatMap((rel) => walk(join(root, rel)))
    .filter((file) => file.endsWith('.ts'));
  for (const file of importFiles) {
    for (const hit of moduleSpecifierReferences(file)) {
      const matched = legacyModuleSpecifiers.find(
        (specifier) => hit.specifier === specifier || hit.specifier.startsWith(`${specifier}/`),
      );
      if (!matched) continue;
      failures.push(
        `Legacy table entry/style import ${relPath(file)}:${hit.line} references ${hit.specifier}; use @hell-ui/angular/table, @hell-ui/angular/table-tanstack, or table/styles.css.`,
      );
    }
  }

  const productionFiles = libraryProductionTsFiles().map((file) => join(root, file));
  const legacySymbols = [
    { label: 'HELL_TABLE_DIRECTIVES', pattern: /\bHELL_TABLE_DIRECTIVES\b/ },
    { label: 'HELL_TABLE_UTILITY_DIRECTIVES', pattern: /\bHELL_TABLE_UTILITY_DIRECTIVES\b/ },
    { label: 'selectionSemantics', pattern: /\bselectionSemantics\b/ },
    {
      label: 'hellTableSortButton',
      pattern: /\bhellTableSortButton\b|\bHellTableSortButton\b|\bhell-table-sort-button\b/,
    },
    {
      label: 'hellTableColumnResizer',
      pattern:
        /\bhellTableColumnResizer\b|\bHellTableColumnResizer\b|\bhell-table-column-resizer\b|\bHellTableColumnResizeRuntime\b|\bdata-table-column-resize\b/,
    },
  ];
  for (const file of productionFiles) {
    const source = readFile(file);
    for (const symbol of legacySymbols) {
      if (symbol.pattern.test(source)) {
        failures.push(`Legacy table API ${symbol.label} must not appear in ${relPath(file)}`);
      }
    }
  }

  const tableSource = readFile(
    join(root, 'packages/angular/table/table-utilities.ts'),
  );
  const rowModule = decoratedClassModules(tableSource).find(
    (module) => module.className === 'HellTableRow',
  );
  if (!rowModule) {
    failures.push('Legacy table removal contract could not inspect HellTableRow');
  } else if (
    /\breadonly\s+interactive\b|\binteractive\s*=\s*input\b|\bHellTableRow\.interactive\b/.test(
      rowModule.moduleSource,
    )
  ) {
    failures.push('HellTableRow.interactive legacy input must be removed from table primitives');
  }

  const styleEntrypointSources = [
    'packages/angular/table/styles.css',
  ];
  for (const rel of styleEntrypointSources) {
    const source = readFile(join(root, rel));
    if (
      /styles\/features\/data-table|\.\/features\/data-table\.css|features\/data-table\.css/.test(
        source,
      )
    ) {
      failures.push(`Legacy styles/features/data-table reference must be removed from ${rel}`);
    }
  }
}

function checkTableAdapterBoundaryContract() {
  const coreTableBoundaryDirs = [
    'packages/angular/table',
  ];
  const coreTableBoundaryFiles = [
    ...coreTableBoundaryDirs.flatMap((rel) => walk(join(root, rel))),
    join(root, 'packages/angular/table/public-api.ts'),
  ].filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'));
  const adapterDirs = ['packages/angular/table-tanstack'];
  const adapterFiles = adapterDirs
    .flatMap((rel) => walk(join(root, rel)))
    .filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts'),
    );
  const policies = [
    {
      label: 'TanStack Table',
      matches: (specifier) =>
        specifier.startsWith('@tanstack/angular-table') || specifier.startsWith('@tanstack/table'),
      allowedDir: 'packages/angular/table-tanstack',
    },
    {
      label: 'TanStack Virtual',
      matches: (specifier) => specifier.startsWith('@tanstack/virtual'),
      allowedDir: 'packages/angular/table-tanstack/virtual',
    },
    {
      label: 'Angular CDK table adapter',
      matches: (specifier) => specifier.startsWith('@angular/cdk/'),
      allowedDir: 'FORBIDDEN',
    },
  ];
  const adapterSourceDirs = new Set(adapterDirs);

  for (const file of [...coreTableBoundaryFiles, ...adapterFiles]) {
    const rel = relPath(file);
    const hits = moduleSpecifierReferences(file);
    for (const hit of hits) {
      for (const policy of policies) {
        if (!policy.matches(hit.specifier)) continue;
        if (rel === policy.allowedDir || rel.startsWith(`${policy.allowedDir}/`)) continue;
        failures.push(
          `Table adapter boundary ${rel}:${hit.line} imports ${hit.specifier}; ${policy.label} imports must stay inside ${policy.allowedDir}.`,
        );
      }

      const target = resolveRelativeModuleFile(file, hit.specifier);
      if (!target) continue;
      const targetRel = relPath(target);
      const adapterDir = [...adapterSourceDirs].find(
        (dir) => targetRel === dir || targetRel.startsWith(`${dir}/`),
      );
      if (adapterDir && !rel.startsWith(`${adapterDir}/`)) {
        failures.push(
          `Table adapter boundary ${rel}:${hit.line} imports ${hit.specifier} -> ${targetRel}; core table primitives must not depend on adapter entrypoints.`,
        );
      }
    }
  }

  const tanStackShellSource = readFile(
    join(root, 'packages/angular/table-tanstack/table-tanstack.ts'),
  );
  const publicLookingBodyConnectorBindings = [
    'hellTanStackBodyScrollport',
    'hellTanStackBody',
    'hellTanStackBodyItemConnector',
    'hellTanStackBodyItem',
  ];
  for (const binding of publicLookingBodyConnectorBindings) {
    if (
      tanStackShellSource.includes(`selector: '[${binding}`) ||
      tanStackShellSource.includes(`selector: "[${binding}`) ||
      tanStackShellSource.includes(`alias: '${binding}'`) ||
      tanStackShellSource.includes(`alias: "${binding}"`)
    ) {
      failures.push(
        `TanStack shell body-strategy connector binding ${binding} must stay internal under a ɵ-prefixed alias/selector.`,
      );
    }
  }

  const forbiddenRowSelectionShortcuts = [
    { label: 'data-selected', pattern: /data-selected/ },
    { label: 'aria-selected', pattern: /aria-selected/ },
    { label: 'row.getIsSelected()', pattern: /\bgetIsSelected\s*\(/ },
  ];
  for (const shortcut of forbiddenRowSelectionShortcuts) {
    if (shortcut.pattern.test(tanStackShellSource)) {
      failures.push(
        `TanStack shell must not reflect row selection semantics with ${shortcut.label}; selected visuals belong in caller rowClass passthrough.`,
      );
    }
  }
}

function checkTableSemanticDefaultGuardContract() {
  const tableSource = readFile(
    join(root, 'packages/angular/table/table-utilities.ts'),
  );
  const modules = new Map(
    decoratedClassModules(tableSource).map((module) => [module.className, module]),
  );
  const tableModule = modules.get('HellTable');
  const passiveRoleModules = [
    ['HellTableHead', 'rowgroup'],
    ['HellTableBody', 'rowgroup'],
    ['HellTableRow', 'row'],
    ['HellTableHeaderCell', 'columnheader'],
    ['HellTableCell', 'cell'],
  ];

  if (!tableModule) {
    failures.push('Table semantic default guard could not inspect HellTable');
  } else {
    for (const forbidden of [
      'isGridMode',
      'gridTabIndex',
      'gridActiveDescendant',
      'aria-activedescendant',
    ]) {
      if (tableModule.moduleSource.includes(forbidden)) {
        failures.push(`HellTable semantic defaults must not own grid behavior: ${forbidden}`);
      }
    }
  }

  const passiveRoleNativeConstants = new Map([
    ['HellTableHead', 'HELL_TABLE_HEADER_NATIVE_ELEMENTS'],
    ['HellTableBody', 'HELL_TABLE_BODY_NATIVE_ELEMENTS'],
    ['HellTableRow', 'HELL_TABLE_ROW_NATIVE_ELEMENTS'],
    ['HellTableHeaderCell', 'HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS'],
    ['HellTableCell', 'HELL_TABLE_CELL_NATIVE_ELEMENTS'],
  ]);

  for (const [className, role] of passiveRoleModules) {
    const module = modules.get(className);
    if (!module) {
      failures.push(`Table semantic default guard could not inspect ${className}`);
      continue;
    }
    const nativeConstant = passiveRoleNativeConstants.get(className);
    const roleSupportPattern = new RegExp(
      `injectHellTableRoleSupport\\(\\s*${nativeConstant}\\s*,\\s*['"]${role}['"]\\s*,?\\s*\\)`,
    );
    if (
      !module.moduleSource.includes(`protected override readonly inferredRole = '${role}'`) &&
      !roleSupportPattern.test(module.moduleSource)
    ) {
      failures.push(`${className} must keep passive inferred role ${role}`);
    }
    for (const forbidden of ['isGridMode', 'gridRole', 'aria-activedescendant']) {
      if (module.moduleSource.includes(forbidden)) {
        failures.push(`${className} must not gate or own Hell grid behavior: ${forbidden}`);
      }
    }
  }

  const rowModule = modules.get('HellTableRow');
  if (rowModule) {
    for (const forbidden of [
      { label: 'tabindex', pattern: /\[attr\.tabindex\]|tabindex\s*:/ },
      { label: 'row click handler', pattern: /\(click\)/ },
      { label: 'row keydown handler', pattern: /\(keydown/ },
      { label: 'aria-activedescendant', pattern: /aria-activedescendant/ },
    ]) {
      if (forbidden.pattern.test(rowModule.moduleSource)) {
        failures.push(
          `HellTableRow must not add row roving-focus behavior in table mode: ${forbidden.label}`,
        );
      }
    }
  }
}

function checkFloatingRegistrationContract() {
  const floatingSurfaces = [
    {
      file: 'packages/angular/popover/popover.ts',
      className: 'HellPopover',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'packages/angular/tooltip/tooltip.ts',
      className: 'HellTooltip',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'packages/angular/menu/menu.ts',
      className: 'HellMenu',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'packages/angular/select/select.ts',
      className: 'HellSelectDropdown',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'packages/angular/combobox/combobox.ts',
      className: 'HellComboboxDropdown',
      registration: /hellRegisterFloatingHost\(\);/,
    },
    {
      file: 'packages/angular/flyout/flyout.ts',
      className: 'HellFlyout',
      registration: /new\s+HellFloatingInteractionController[\s\S]*?scope:\s*this\.floatingScope/,
    },
  ];

  for (const surface of floatingSurfaces) {
    const source = readFile(join(root, surface.file));
    const classBody = source.match(
      new RegExp(
        `export\\s+class\\s+${surface.className}\\b[\\s\\S]*?(?=\\nexport\\s+class|\\nexport\\s+const|$)`,
      ),
    )?.[0];
    if (!classBody || !surface.registration.test(classBody)) {
      failures.push(
        `${surface.file} ${surface.className} must register its Floating Interaction surface with the nearest Floating Scope`,
      );
    }
  }

  const touchedContainmentOwners = [
    {
      file: 'packages/angular/select/select.ts',
      className: 'HellSelect',
    },
    {
      file: 'packages/angular/combobox/combobox.ts',
      className: 'HellCombobox',
    },
  ];

  for (const owner of touchedContainmentOwners) {
    const source = readFile(join(root, owner.file));
    const classBody = source.match(
      new RegExp(
        `export\\s+class\\s+${owner.className}\\b[\\s\\S]*?(?=\\nexport\\s+class|\\nexport\\s+const|$)`,
      ),
    )?.[0];

    if (!classBody || !/hellContainsFloatingTarget\(/.test(classBody)) {
      failures.push(
        `${owner.file} ${owner.className} must route touched containment through the shared floating-scope helper`,
      );
      continue;
    }

    if (
      /dropdowns\s*=\s*new\s+Set<HTMLElement>\s*\(/.test(classBody) ||
      /for\s*\(\s*const\s+dropdown\s+of\s+this\.dropdowns\s*\)/.test(classBody)
    ) {
      failures.push(
        `${owner.file} ${owner.className} must not maintain a parallel dropdown Set containment policy`,
      );
    }
  }
}

function checkNgpStateWriterContract() {
  const adapterRelPath = 'packages/angular/internal/ng-primitives/ngp-state-adapters.ts';
  const adapterPath = join(root, adapterRelPath);
  const adapterSource = readFile(adapterPath);
  const ngpPackage = parseJsonWithComments(
    readFile(join(root, 'packages/angular/node_modules/ng-primitives/package.json')),
  );
  const workspaceCatalog = readWorkspaceCatalog();
  const libraryPackage = parseJsonWithComments(readFile(join(root, 'packages/angular/package.json')));
  const expectedVersion = `ng-primitives@${ngpPackage.version}`;

  if (!adapterSource.includes(`HELL_NGP_STATE_WRITER_VERSION = '${expectedVersion}'`)) {
    failures.push(`ng-primitives state writer version must match installed ${expectedVersion}`);
  }

  if (workspaceCatalog['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `workspace ng-primitives catalog entry must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  if (libraryPackage.peerDependencies?.['ng-primitives'] !== ngpPackage.version) {
    failures.push(
      `ng-primitives peer dependency must be pinned to ${ngpPackage.version} while the state writer fallback is version-bound`,
    );
  }

  const allowedBridgeFiles = new Set([
    adapterRelPath,
    'packages/angular/internal/ng-primitives/public-api.ts',
    'packages/angular/internal/ng-primitives/ngp-state-adapters.spec.ts',
    'packages/angular/select/select.ts',
    'packages/angular/combobox/combobox.ts',
    'packages/angular/radio/radio.ts',
  ]);
  const stateWriterTokens = [
    'HELL_NGP_STATE_WRITER_VERSION',
    'HELL_NGP_STATE_WRITER_UPGRADE_PATH',
    'writeSelectStateValue',
    'writeSelectStateDisabled',
    'writeComboboxStateValue',
    'writeComboboxStateDisabled',
    'writeRadioGroupStateValue',
    'writeRadioGroupStateDisabled',
    'writeRovingFocusActiveItem',
  ];
  const retiredPrivateBridgeTokens = [
    'HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION',
    'writeSelectPrivateValue',
    'writeSelectPrivateDisabled',
    'writeComboboxPrivateValue',
    'writeComboboxPrivateDisabled',
    'writeRadioGroupPrivateValue',
    'writeRadioGroupPrivateDisabled',
  ];
  const indexedStateWritePatterns = [
    {
      token: 'state[\'value\'].set(...) or state["value"].set(...)',
      pattern: /\bstate\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'state[\'disabled\'].set(...) or state["disabled"].set(...)',
      pattern: /\bstate\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'state[\'activeItem\'].set(...) or state["activeItem"].set(...)',
      pattern: /\bstate\[['"]activeItem['"]\]\.set\(/,
    },
    {
      token: 'state()[\'value\'].set(...) or state()["value"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'state()[\'disabled\'].set(...) or state()["disabled"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'state()[\'activeItem\'].set(...) or state()["activeItem"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*\(\)\[['"]activeItem['"]\]\.set\(/,
    },
  ];
  const directStateChannelWritePatterns = [
    {
      token: 'State<T>.value.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.value\.set\(/,
    },
    {
      token: 'State<T>.disabled.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.disabled\.set\(/,
    },
    {
      token: 'State<T>.activeItem.set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\.activeItem\.set\(/,
    },
    {
      token: 'State<T>[\'value\'].set(...) or State<T>["value"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]value['"]\]\.set\(/,
    },
    {
      token: 'State<T>[\'disabled\'].set(...) or State<T>["disabled"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]disabled['"]\]\.set\(/,
    },
    {
      token: 'State<T>[\'activeItem\'].set(...) or State<T>["activeItem"].set(...)',
      pattern: /\b(?:this\.)?[A-Za-z_$][\w$]*(?:\(\))?\[['"]activeItem['"]\]\.set\(/,
    },
  ];
  const directPrimitiveStateAccessPattern = /\b(?:this\.)?[A-Za-z_$][\w$]*\.state\b/;
  const guardedFormStateTokens = [
    'NgpSelect',
    'NgpCombobox',
    'NgpRadioGroup',
    'NgpRovingFocusGroup',
    'injectSelectState',
    'injectComboboxState',
    'injectRadioGroupState',
    'injectRovingFocusGroupState',
    'State<NgpSelect',
    'State<NgpCombobox',
    'State<NgpRadioGroup',
    'NgpRovingFocusGroupState',
  ];
  const sourceFiles = libraryPackageFiles().filter((file) => file.endsWith('.ts'));

  for (const file of sourceFiles) {
    const source = readFile(file);
    const rel = file.slice(root.length + 1);
    const isSpec = rel.endsWith('.spec.ts');
    const isAdapter = rel === adapterRelPath;
    const usesGuardedFormState = guardedFormStateTokens.some((token) => source.includes(token));

    if (!isSpec) {
      for (const { token, pattern } of indexedStateWritePatterns) {
        if (pattern.test(source)) {
          failures.push(
            `Ad hoc ng-primitives State<T> channel write ${token} is not allowed in ${rel}; use ${adapterRelPath}`,
          );
        }
      }

      if (usesGuardedFormState && !isAdapter) {
        for (const { token, pattern } of directStateChannelWritePatterns) {
          if (pattern.test(source)) {
            failures.push(
              `Ad hoc ng-primitives ${token} is not allowed in ${rel}; use ${adapterRelPath}`,
            );
          }
        }

        if (directPrimitiveStateAccessPattern.test(source)) {
          failures.push(
            `Direct ng-primitives primitive .state access is not allowed in ${rel}; use injected State<T> through ${adapterRelPath}`,
          );
        }
      }
    }
    if (retiredPrivateBridgeTokens.some((token) => source.includes(token))) {
      failures.push(`Retired ng-primitives private bridge token is still used in ${rel}`);
    }
    if (/\bngp[A-Za-z0-9_]*\.state\b/.test(source)) {
      failures.push(
        `Direct ng-primitives instance state access is not allowed in ${rel}; use injected State<T> adapter seam`,
      );
    }
    if (allowedBridgeFiles.has(rel)) continue;
    const usesStateWriter =
      source.includes('ngp-state-adapters') ||
      stateWriterTokens.some((token) => source.includes(token));
    if (usesStateWriter) {
      failures.push(`ng-primitives state writer usage is not approved in ${rel}`);
    }
  }

  const adaptersBarrel = readFile(
    join(root, 'packages/angular/internal/ng-primitives/adapters.ts'),
  );
  if (
    /export\s+\*\s+from/.test(adaptersBarrel) ||
    stateWriterTokens.some((token) => adaptersBarrel.includes(token))
  ) {
    failures.push('ng-primitives state writer must not be re-exported through the adapters barrel');
  }

  for (const token of [
    'writeToggleGroupValue',
    'writeToggleGroupDisabled',
    'ToggleGroupStateMutation',
  ]) {
    if (adapterSource.includes(token)) {
      failures.push(
        `Toggle group must use public ng-primitives setters, not state-writer token ${token}`,
      );
    }
  }
}

function checkFloatingAdapterContract() {
  const coreApi = readFile(join(root, 'packages/angular/core/public-api.ts'));
  const popoverAdapterRelPath =
    'packages/angular/internal/ng-primitives/ngp-popover-close-adapter.ts';
  const popoverAdapterSource = readFile(join(root, popoverAdapterRelPath));
  const ngpPackage = parseJsonWithComments(
    readFile(join(root, 'packages/angular/node_modules/ng-primitives/package.json')),
  );
  const expectedPopoverAdapterVersion = `ng-primitives@${ngpPackage.version}`;

  if (!coreApi.includes("export * from './floating-element'")) {
    failures.push('Core Package Entry Point must export ./floating-element');
  }

  const popoverOverlayReachIns = libraryProductionTsFiles()
    .map((file) => join(root, file))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .filter((file) => relPath(file) !== popoverAdapterRelPath)
    .filter((file) => /\boverlay\s*\(\s*\)|\bupdateConfig\s*\(/.test(readFile(file)))
    .map(relPath);
  if (popoverOverlayReachIns.length) {
    failures.push(
      `Private ng-primitives popover overlay handling must stay quarantined in ${popoverAdapterRelPath}: ${popoverOverlayReachIns.join(', ')}`,
    );
  }

  if (
    !popoverAdapterSource.includes(
      `HELL_NGP_POPOVER_CLOSE_ADAPTER_VERSION = '${expectedPopoverAdapterVersion}'`,
    )
  ) {
    failures.push(
      `ng-primitives popover close adapter version must match installed ${expectedPopoverAdapterVersion}`,
    );
  }

  if (!popoverAdapterSource.includes('NG0953')) {
    failures.push(
      'ng-primitives popover close adapter must document the destroyed OutputRef warning it guards.',
    );
  }
}

const browserGlobalSeamDocPath = 'docs/architecture/browser-global-seams.md';
const allowedBrowserGlobalSeams = [
  {
    id: 'audio-transcript-window-probe',
    file: 'packages/angular/features/audio-transcript/audio-transcript.ts',
    globals: ['window'],
    lines: [
      "if (typeof window === 'undefined') return null;",
      'const w = window as unknown as {',
      "typeof window !== 'undefined' &&",
    ],
  },
  {
    id: 'resizable-pane-resize-observer',
    file: 'packages/angular/resizable/resizable.ts',
    globals: ['ResizeObserver'],
    lines: [
      "if (typeof ResizeObserver === 'undefined') return;",
      'const observer = new ResizeObserver(() => this.scheduleFitPanesToAvailableSize());',
    ],
  },
  {
    id: 'split-view-resize-observer',
    file: 'packages/angular/split-view/split-view.ts',
    globals: ['ResizeObserver'],
    lines: [
      "if (typeof ResizeObserver === 'undefined') return;",
      'const observer = new ResizeObserver((entries) => {',
    ],
  },
  {
    id: 'toast-viewport-resize-observer',
    file: 'packages/angular/toast/toast.ts',
    globals: ['ResizeObserver'],
    lines: [
      "if (this.destroyed || typeof ResizeObserver === 'undefined') return;",
      'this.ro = new ResizeObserver((entries) => {',
    ],
  },
  {
    id: 'floating-dismissal-document-fallback',
    file: 'packages/angular/internal/core/floating-dismissal.ts',
    globals: ['document'],
    lines: ["return typeof document === 'undefined' ? null : document;"],
  },
  {
    id: 'floating-scope-resize-observer',
    file: 'packages/angular/internal/core/floating-scope.ts',
    globals: ['ResizeObserver'],
    lines: [
      "if (typeof ResizeObserver === 'undefined') return;",
      'this.resizeObserver = new ResizeObserver(this.syncScope);',
    ],
  },
  {
    id: 'code-editor-legacy-document-setup',
    file: 'packages/angular/features/code-editor/code-editor.runtime.ts',
    globals: ['document'],
    lines: ["typeof document === 'undefined' ? [] : hellCodeEditorSetupFactory(document);"],
  },
];

const browserGlobalNames = new Set([
  'document',
  'window',
  'ResizeObserver',
  'IntersectionObserver',
]);

function checkBrowserGlobalContract() {
  const docPath = join(root, browserGlobalSeamDocPath);
  if (!existsSync(docPath)) {
    failures.push(`Browser Global Contract missing ${browserGlobalSeamDocPath}`);
  } else {
    const docs = readFile(docPath);
    for (const seam of allowedBrowserGlobalSeams) {
      const missingDocParts = [
        seam.id,
        seam.file,
        ...seam.globals.map((global) => `\`${global}\``),
      ].filter((part) => !docs.includes(part));
      if (missingDocParts.length) {
        failures.push(
          `Browser Global Contract docs for ${seam.id} are missing: ${missingDocParts.join(', ')}`,
        );
      }
    }
  }

  const sourceFiles = libraryProductionTsFiles().map((file) => join(root, file));
  const hits = sourceFiles.flatMap((file) => browserGlobalHits(file));
  const unusedAllowances = allowedBrowserGlobalSeams.flatMap((seam) =>
    seam.lines.flatMap((line) =>
      seam.globals.map((global) => ({
        id: seam.id,
        file: seam.file,
        global,
        line,
      })),
    ),
  );

  for (const hit of hits) {
    const allowanceIndex = unusedAllowances.findIndex(
      (allowance) =>
        allowance.file === hit.file &&
        allowance.global === hit.global &&
        allowance.line === hit.source.trim(),
    );

    if (allowanceIndex >= 0) {
      unusedAllowances.splice(allowanceIndex, 1);
      continue;
    }

    failures.push(
      `Browser Global Contract ${hit.file}:${hit.line} uses direct ${hit.global}; move it behind an allowed browser seam or add a documented follow-up before allowlisting it`,
    );
  }

  for (const allowance of unusedAllowances) {
    const filePath = join(root, allowance.file);
    if (!existsSync(filePath)) {
      failures.push(`Browser Global Contract allowlist references missing file ${allowance.file}`);
      continue;
    }

    failures.push(
      `Browser Global Contract allowlist entry ${allowance.id} is stale: expected ${allowance.file} to contain direct ${allowance.global} line "${allowance.line}"`,
    );
  }
}

function browserGlobalHits(file) {
  const source = readFile(file);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const original = source.split('\n');
  const rel = file.slice(root.length + 1).replaceAll('\\', '/');
  const seen = new Set();
  const hits = [];

  function visit(node) {
    if (ts.isIdentifier(node) && isDirectBrowserGlobalIdentifier(node)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const key = `${node.text}:${line}`;
      if (!seen.has(key)) {
        seen.add(key);
        hits.push({
          file: rel,
          line,
          global: node.text,
          source: original[line - 1] ?? '',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

function isDirectBrowserGlobalIdentifier(node) {
  if (!browserGlobalNames.has(node.text)) return false;
  if (isTypeOnlyIdentifier(node)) return false;
  if (isDeclarationIdentifier(node)) return false;
  if (isPropertyNameIdentifier(node)) return false;
  return true;
}

function isTypeOnlyIdentifier(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isTypeNode(current)) return true;
    if (ts.isExpression(current) || ts.isStatement(current) || ts.isSourceFile(current))
      return false;
  }

  return false;
}

function isDeclarationIdentifier(node) {
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;
  if (ts.isClassDeclaration(parent) && parent.name === node) return true;
  if (ts.isInterfaceDeclaration(parent) && parent.name === node) return true;
  if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return true;
  if (ts.isImportClause(parent) && parent.name === node) return true;
  if (ts.isNamespaceImport(parent) && parent.name === node) return true;
  if (ts.isImportSpecifier(parent) && parent.name === node) return true;
  if (ts.isImportSpecifier(parent) && parent.propertyName === node) return true;
  if (ts.isExportSpecifier(parent) && parent.name === node) return true;
  if (ts.isExportSpecifier(parent) && parent.propertyName === node) return true;
  return false;
}

function isPropertyNameIdentifier(node) {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return !(ts.isIdentifier(parent.expression) && parent.expression.text === 'globalThis');
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isPropertyDeclaration(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isMethodSignature(parent) && parent.name === node) return true;
  if (ts.isGetAccessor(parent) && parent.name === node) return true;
  if (ts.isSetAccessor(parent) && parent.name === node) return true;
  return false;
}

function checkEntrypointManifestSourceCoverage() {
  const discoveredMetadataPaths = new Set();
  for (const entrypoint of entrypointPublicApiFiles()) {
    if (!existsSync(join(root, entrypoint.packageDir))) {
      failures.push(
        `Entrypoint Metadata ${entrypoint.id} references missing package directory ${entrypoint.packageDir}`,
      );
    }
    discoveredMetadataPaths.add(entrypoint.metadataPath);
    if (!entrypoint.metadataPath || !existsSync(join(root, entrypoint.metadataPath))) {
      failures.push(
        `Entrypoint Metadata ${entrypoint.id} is missing ${entrypointMetadataFileName} in ${entrypoint.packageDir}`,
      );
    }
    if (!entrypoint.category) {
      failures.push(`Entrypoint Metadata ${entrypoint.id} is missing category metadata`);
    }
  }

  const packageMetadataPaths = walk(join(root, libraryRoot))
    .filter((path) => basename(path) === 'ng-package.json')
    .map((path) => `${relative(root, dirname(path))}/${entrypointMetadataFileName}`);
  for (const metadataPath of packageMetadataPaths) {
    if (!existsSync(join(root, metadataPath))) {
      failures.push(`Package Entry Point is missing entrypoint metadata ${metadataPath}`);
    } else if (!discoveredMetadataPaths.has(metadataPath)) {
      failures.push(`Entrypoint Metadata is not discoverable: ${metadataPath}`);
    }
  }

  for (const legacyDir of ['packages/angular/src', 'packages/angular/primitives', 'packages/angular/composites']) {
    if (existsSync(join(root, legacyDir))) {
      failures.push(`Legacy category/source directory must be removed: ${legacyDir}`);
    }
  }
}

function checkGeneratedEntrypointFiles() {
  for (const entrypoint of entrypointPublicApiFiles()) {
    const filePath = join(root, entrypoint.publicApiPath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint generated public API is missing ${entrypoint.publicApiPath}`);
      continue;
    }

    const expected = renderPublicApiFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint generated public API is stale: ${entrypoint.publicApiPath} (run pnpm run generate:entrypoints)`,
      );
    }
  }

  for (const entrypoint of secondaryPackageEntrypoints()) {
    const filePath = join(root, entrypoint.packagePath);
    if (!existsSync(filePath)) {
      failures.push(`Entrypoint generated ng-package is missing ${entrypoint.packagePath}`);
      continue;
    }

    const expected = renderNgPackageFile(entrypoint);
    if (readFile(filePath) !== expected) {
      failures.push(
        `Entrypoint generated ng-package is stale: ${entrypoint.packagePath} (run pnpm run generate:entrypoints)`,
      );
    }
  }
}

function externalImportPackages(source) {
  const packages = [];
  const importRegex =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^.'"/][^'"]*)['"]/g;
  for (const match of source.matchAll(importRegex)) {
    packages.push(packageNameFromSpecifier(match[1]));
  }

  const dynamicImportRegex = /import\(\s*['"]([^.'"/][^'"]*)['"]\s*\)/g;
  for (const match of source.matchAll(dynamicImportRegex)) {
    packages.push(packageNameFromSpecifier(match[1]));
  }

  return packages;
}

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

function pagePathForRoute(routePath) {
  if (routePath === '/') {
    return join(root, 'apps/docs/src/app/pages/overview/overview.page.ts');
  }

  const route = routePath.replace(/^\//, '');
  return join(root, 'apps/docs/src/app/pages', route, `${basename(route)}.page.ts`);
}

function exportPaths(source) {
  return [...source.matchAll(/export\s+[^;]*?\s+from\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
}

function exportedSymbolNames(source) {
  const names = new Set();
  const declarationPattern =
    /\bexport\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|function|const|let|var|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  for (const match of source.matchAll(declarationPattern)) {
    names.add(match[1]);
  }

  for (const match of source.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of match[1].split(',')) {
      const tokens = part
        .trim()
        .split(/\s+as\s+/i)
        .map((token) => token.trim());
      for (const token of tokens) {
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(token)) names.add(token);
      }
    }
  }

  return names;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonWithComments(source) {
  let json = '';
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        json += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      json += char;
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      json += char;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    json += char;
  }

  return JSON.parse(json);
}

function readFile(path) {
  return readFileSync(path, 'utf8');
}

function readWorkspaceCatalog() {
  const source = readFile(join(root, 'pnpm-workspace.yaml'));
  const catalog = {};
  let inCatalog = false;

  for (const line of source.split(/\r?\n/)) {
    if (/^\S/.test(line)) inCatalog = line === 'catalog:';
    if (!inCatalog || !line.startsWith('  ')) continue;

    const match = line.match(/^\s+(['"]?)([^'":]+)\1:\s+(['"]?)([^'"]+)\3\s*$/);
    if (match) catalog[match[2]] = match[4];
  }

  return catalog;
}

function primitiveDirectories() {
  return childDirectories(join(root, 'packages/angular/primitives')).filter(
    (primitive) => primitive !== 'adapters',
  );
}

function compositeDirectories() {
  return childDirectories(join(root, 'packages/angular/composites'));
}

function featureDirectories() {
  const internalFeatureDirs = new Set(['assets', 'table-utilities']);
  return childDirectories(join(root, 'packages/angular/features')).filter(
    (feature) => !internalFeatureDirs.has(feature),
  );
}

function childDirectories(path) {
  return readdirSync(path)
    .filter((name) => {
      const fullPath = join(path, name);
      return statSync(fullPath).isDirectory();
    })
    .sort();
}

function walk(path) {
  const out = [];
  for (const name of readdirSync(path)) {
    const fullPath = join(path, name);
    if (statSync(fullPath).isDirectory()) out.push(...walk(fullPath));
    else out.push(fullPath);
  }
  return out;
}

main();
