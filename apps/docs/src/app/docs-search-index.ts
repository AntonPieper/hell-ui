import { hellSearchKey } from '@hell-ui/angular/core';
import { HD_DOCS_SECTIONS, hdDocsSectionForPath, type DocsSearchItem, type DocsSearchKind } from './docs-catalog';

interface DocsSearchSeed {
 readonly title: string;
 readonly path: string;
 readonly detail: string;
 readonly terms: string;
}

const HD_DOCS_EXAMPLES: readonly DocsSearchSeed[] = [
 {
 title:'Accordion: All Parts Styling',
 path:'/components/accordion',
 detail:'components/accordion/examples/all-parts-styling.example.ts',
 terms:
'all-parts-styling ui part style map components/accordion/examples/all-parts-styling.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger hellAccordionContent root theme tokens',
 },
 {
 title:'Accordion: Basic',
 path:'/components/accordion',
 detail:'components/accordion/examples/basic.example.ts',
 terms:
'components/accordion/examples/basic.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger hellAccordionContent single collapsible faq disclosure',
 },
 {
 title:'Accordion: Disabled Item',
 path:'/components/accordion',
 detail:'components/accordion/examples/disabled-item.example.ts',
 terms:
'disabled-item components/accordion/examples/disabled-item.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger hellAccordionContent locked gated plan permission',
 },
 {
 title:'Accordion: Multiple',
 path:'/components/accordion',
 detail:'components/accordion/examples/multiple.example.ts',
 terms:
'components/accordion/examples/multiple.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger hellAccordionContent type=multiple several open',
 },
 {
 title:'Accordion: With Settings Panel',
 path:'/components/accordion',
 detail:'components/accordion/examples/with-settings-panel.example.ts',
 terms:
'with-settings-panel components/accordion/examples/with-settings-panel.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger hellAccordionContent hellCard hellCardHeader hellCardBody hell-icon composite card icon notifications preferences billing',
 },
 {
 title:'Alert: Actions',
 path:'/components/alert',
 detail:'components/alert/examples/actions.example.ts',
 terms:
'alert actions components/alert/examples/actions.example components/alert hell-alert hellAlertTitle hellAlertDescription hellAlertActions hellButton retry action region danger sync failed',
 },
 {
 title:'Alert: Async alerts and roles',
 path:'/components/alert',
 detail:'components/alert/examples/async-role.example.ts',
 terms:
'alert async-role components/alert/examples/async-role.example components/alert hell-alert hellAlertDismiss role alert status aria-live announce dynamic inserted danger recipe hellButton',
 },
 {
 title:'Alert: Banner',
 path:'/components/alert',
 detail:'components/alert/examples/banner.example.ts',
 terms:
'alert banner components/alert/examples/banner.example components/alert hell-alert layout banner full-width app-level unsupported browser flush edges',
 },
 {
 title:'Alert: Basic',
 path:'/components/alert',
 detail:'components/alert/examples/basic.example.ts',
 terms:
'alert basic components/alert/examples/basic.example components/alert hell-alert hellAlertTitle hellAlertDescription info inline message smallest usage',
 },
 {
 title:'Alert: Conditional content',
 path:'/components/alert',
 detail:'components/alert/examples/conditional.example.ts',
 terms:
'alert conditional components/alert/examples/conditional.example components/alert hell-alert hellAlertDismiss ngProjectAs ng-container if control flow conditional projection dismiss slot default content region',
 },
 {
 title:'Alert: Dismissible',
 path:'/components/alert',
 detail:'components/alert/examples/dismissible.example.ts',
 terms:
'alert dismissible components/alert/examples/dismissible.example components/alert hell-alert hellAlertDismiss dismissed event close button visibility signal Label Contract hellButton',
 },
 {
 title:'Alert: Icon',
 path:'/components/alert',
 detail:'components/alert/examples/icon.example.ts',
 terms:
'alert icon components/alert/examples/icon.example components/alert hell-alert hellAlertIcon showIcon replace remove glyph hell-icon provideIcons faSolidBullhorn decorative',
 },
 {
 title:'Alert: Styling (all parts)',
 path:'/components/alert',
 detail:'components/alert/examples/styling.example.ts',
 terms:
'alert styling components/alert/examples/styling.example components/alert hell-alert ui HellAlertUi part style map root icon content compact density tailwind tokens',
 },
 {
 title:'Alert: Validation summary',
 path:'/components/alert',
 detail:'components/alert/examples/validation-summary.example.ts',
 terms:
'alert validation-summary components/alert/examples/validation-summary.example components/alert hell-alert hellAlertTitle hellAlertDescription list field-group warnings errors danger',
 },
 {
 title:'Alert: Variants',
 path:'/components/alert',
 detail:'components/alert/examples/variants.example.ts',
 terms:
'alert variants components/alert/examples/variants.example components/alert hell-alert variant info success warning danger severity semantic theme tokens',
 },
 {
 title:'App Shell: Basic',
 path:'/components/app-shell',
 detail:'components/app-shell/examples/basic.example.ts',
 terms:
'app-shell hellAppShell hellAppTopbar hellSidenavToggle hellAppSidenav hellNavItem hellNavItemIcon hellNavItemLabel hellAppContent hell-icon smallest usage topbar sidenav content collapse rail',
 },
 {
 title:'App Shell: Secondary panel and toggle appearances',
 path:'/components/app-shell',
 detail:'components/app-shell/examples/secondary-panel.example.ts',
 terms:
'app-shell hellAppSecondary hellAppSecondaryBody hellSecondaryToggle hellSidenavToggle appearance header rail activity feed collapse inert',
 },
 {
 title:'App Shell: Sidenav navigation',
 path:'/components/app-shell',
 detail:'components/app-shell/examples/sidenav.example.ts',
 terms:
'app-shell hellAppShell hellAppSidenav hellNavItem hellNavItemIcon hellNavItemLabel hellNavItemTrailing hellNavSection hellNavSectionToggle hellNavSectionItems hellChip hell-icon collapsible section aria-current badge count rail icon-only',
 },
 {
 title:'App Shell: Styling (all parts)',
 path:'/components/app-shell',
 detail:'components/app-shell/examples/styling.example.ts',
 terms:
'app-shell ui part style map hellAppShell hellAppTopbar hellAppSidenav hellNavItem hellNavItemIcon hellNavItemLabel hellNavItemTrailing hellNavSection hellNavSectionToggle hellNavSectionItems hellAppContent hellSidenavToggle hellSecondaryToggle hellAppSecondary hellAppSecondaryBody hell-icon root recipe bg-hell text-hell rounded-hell tokens',
 },
 {
 title:'App Shell: With omnibar, menu, and avatar',
 path:'/components/app-shell',
 detail:'components/app-shell/examples/with-omnibar-menu-avatar.example.ts',
 terms:
'app-shell composite full frame hellAppShell hellAppTopbar hell-omnibar hellOmnibarGroup hellOmnibarGroupLabel hellOmnibarItem hellOmnibarItemText hellMenuTrigger hellMenu hellMenuItem hellMenuItemIcon hellMenuSeparator hell-avatar hellNavItem hellAppContent maxWidth search account aria-current',
 },
 {
 title:'Audio Player: Basic',
 path:'/components/audio-player',
 detail:'components/audio-player/examples/basic.example.ts',
 terms:
'audio-player components/audio-player/examples/basic.example hell-audio-player src smallest minimal controls-only meta-row',
 },
 {
 title:'Audio Player: Speech transcript',
 path:'/components/audio-player',
 detail:'components/audio-player/examples/speech-transcript.example.ts',
 terms:
'audio-player speech-transcript components/audio-player/examples/speech-transcript.example hell-audio-player allowSpeechTranscript provideHellAudioTranscript features/audio-transcript captions recognition experimental',
 },
 {
 title:'Audio Player: Styling (all parts)',
 path:'/components/audio-player',
 detail:'components/audio-player/examples/styling.example.ts',
 terms:
'audio-player components/audio-player/examples/styling.example hell-audio-player ui HellAudioPlayerUi part style map provideHellAudioTranscript allowSpeechTranscript captions tokens',
 },
 {
 title:'Audio Player: With a voicemail inbox',
 path:'/components/audio-player',
 detail:'components/audio-player/examples/voicemail-inbox.example.ts',
 terms:
'audio-player voicemail-inbox components/audio-player/examples/voicemail-inbox.example hell-audio-player hellCard hellCardHeader hellCardBody HELL_CARD_DIRECTIVES hellChip tag card composite unread urgent allowDownload',
 },
 {
 title:'Audio Player: Title and date',
 path:'/components/audio-player',
 detail:'components/audio-player/examples/with-title-and-date.example.ts',
 terms:
'audio-player with-title-and-date components/audio-player/examples/with-title-and-date.example hell-audio-player downloadName meta row recorded call',
 },
 {
 title:'Avatar Group: Basic',
 path:'/components/avatar-group',
 detail:'components/avatar-group/examples/basic.example.ts',
 terms:
'avatar-group hell-avatar-group hellAvatarGroupItem hellAvatarGroupOverflow hell-avatar stack overflow badge smallest usage',
 },
 {
 title:'Avatar Group: Selection',
 path:'/components/avatar-group',
 detail:'components/avatar-group/examples/selection.example.ts',
 terms:
'avatar-group hellAvatarGroupItem selected data-selected toggle filter button aria-pressed multi-select',
 },
 {
 title:'Avatar Group: Sizes',
 path:'/components/avatar-group',
 detail:'components/avatar-group/examples/sizes.example.ts',
 terms:
'avatar-group hell-avatar-group size HellSize xs sm md lg xl hellAvatarGroupItem hellAvatarGroupOverflow scale',
 },
 {
 title:'Avatar Group: Styling',
 path:'/components/avatar-group',
 detail:'components/avatar-group/examples/styling.example.ts',
 terms:
'avatar-group ui Part Style Map root all-parts hell-avatar-group hellAvatarGroupItem hellAvatarGroupOverflow tokens rounded-hell bg-hell text-hell',
 },
 {
 title:'Avatar Group: With Tooltip & Menu',
 path:'/components/avatar-group',
 detail:'components/avatar-group/examples/with-tooltip-menu.example.ts',
 terms:
'avatar-group with-tooltip-menu composite hellTooltipTrigger hellTooltip hellMenuTrigger hellMenu hellMenuItem hellMenuLabel hellAvatarGroupOverflow assignee stack overflow hover',
 },
 {
 title:'Avatar: Basic',
 path:'/components/avatar',
 detail:'components/avatar/examples/basic.example.ts',
 terms:
'components/avatar/examples/basic.example components/avatar hell-avatar image fallback alt smallest simple usage',
 },
 {
 title:'Avatar: Missing and broken images',
 path:'/components/avatar',
 detail:'components/avatar/examples/broken-image.example.ts',
 terms:
'broken-image loading error fallback components/avatar/examples/broken-image.example components/avatar hell-avatar data-status idle loaded 404',
 },
 {
 title:'Avatar: Shape',
 path:'/components/avatar',
 detail:'components/avatar/examples/shape.example.ts',
 terms:
'round square components/avatar/examples/shape.example components/avatar hell-avatar organization entity',
 },
 {
 title:'Avatar: Sizes',
 path:'/components/avatar',
 detail:'components/avatar/examples/sizes.example.ts',
 terms:
'components/avatar/examples/sizes.example components/avatar hell-avatar size xs sm md lg xl',
 },
 {
 title:'Avatar: Styling',
 path:'/components/avatar',
 detail:'components/avatar/examples/styling.example.ts',
 terms:
'components/avatar/examples/styling.example components/avatar hell-avatar ui Part Style Map data-slot root image fallback HellAvatarUi all-parts',
 },
 {
 title:'Avatar: With card and tag',
 path:'/components/avatar',
 detail:'components/avatar/examples/with-card-profile.example.ts',
 terms:
'with-card-profile profile header composite components/avatar/examples/with-card-profile.example components/avatar hell-avatar hellCard hellCardBody hellChip directory people settings',
 },
 {
 title:'Breadcrumbs: All Parts Styling',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/all-parts-styling.example.ts',
 terms:
'all-parts-styling ui Part Style Map hellBreadcrumbs hellBreadcrumbList hellBreadcrumbItem hellBreadcrumbLink hellBreadcrumbPage hellBreadcrumbSeparator hellBreadcrumbEllipsis rounded-hell bg-hell text-hell tokens refine every',
 },
 {
 title:'Breadcrumbs: Basic',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/basic.example.ts',
 terms:
'hellBreadcrumbs hellBreadcrumbList hellBreadcrumbItem hellBreadcrumbLink hellBreadcrumbPage hellBreadcrumbSeparator smallest simple trail',
 },
 {
 title:'Breadcrumbs: Collapsed Ellipsis',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/collapsed-ellipsis.example.ts',
 terms:
'collapsed-ellipsis hellBreadcrumbEllipsis hellMenuTrigger hellMenu hellMenuItem HELL_MENU_DIRECTIVES deep path long trail hidden crumbs menu composite',
 },
 {
 title:'Breadcrumbs: Custom Separator',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/custom-separator.example.ts',
 terms:
'custom-separator hellBreadcrumbSeparator slash divider override chevron',
 },
 {
 title:'Breadcrumbs: With App Shell Topbar',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/with-app-shell-topbar.example.ts',
 terms:
'with-app-shell-topbar hellAppShell hellAppTopbar hellAppContent hell-icon composite product ui navigation location',
 },
 {
 title:'Breadcrumbs: With Icons',
 path:'/components/breadcrumbs',
 detail:'components/breadcrumbs/examples/with-icons.example.ts',
 terms:
'with-icons hellBreadcrumbs hellBreadcrumbLink hellBreadcrumbPage hell-icon HellIcon faSolidHouse faSolidFolderOpen faSolidGear glyph',
 },
 {
 title:'Button: Basic',
 path:'/components/button',
 detail:'components/button/examples/basic.example.ts',
 terms:
'components/button/examples/basic.example components/button hellButton smallest simple usage',
 },
 {
 title:'Button: Block',
 path:'/components/button',
 detail:'components/button/examples/block.example.ts',
 terms:
'components/button/examples/block.example components/button hellButton full width stacked actions',
 },
 {
 title:'Button: With field and input',
 path:'/components/button',
 detail:'components/button/examples/form-actions.example.ts',
 terms:
'form actions components/button/examples/form-actions.example components/button hellButton hellField hellFieldLabel hellFieldDescription hellInput composite row cancel save submit',
 },
 {
 title:'Button: Icons',
 path:'/components/button',
 detail:'components/button/examples/icons.example.ts',
 terms:
'components/button/examples/icons.example components/button hellButton hell-icon iconOnly leading trailing icon-only',
 },
 {
 title:'Button: Sizes',
 path:'/components/button',
 detail:'components/button/examples/sizes.example.ts',
 terms:
'components/button/examples/sizes.example components/button hellButton size xs sm md lg xl',
 },
 {
 title:'Button: Styling',
 path:'/components/button',
 detail:'components/button/examples/styling.example.ts',
 terms:
'components/button/examples/styling.example components/button hellButton ui part style map root tailwind refinement hell tokens',
 },
 {
 title:'Button: Variants',
 path:'/components/button',
 detail:'components/button/examples/variants.example.ts',
 terms:
'components/button/examples/variants.example components/button hellButton variant default primary soft ghost link danger success',
 },
 {
 title:'Card: All Parts Styling',
 path:'/components/card',
 detail:'components/card/examples/all-parts-styling.example.ts',
 terms:
'all-parts hellCard hellCardHeader hellCardBody hellCardFooter ui Part Style Map root rounded-hell-xl bg-hell-primary bg-hell-primary-soft deployment pipeline',
 },
 {
 title:'Card: Basic',
 path:'/components/card',
 detail:'components/card/examples/basic.example.ts',
 terms:
'hellCard hellCardHeader hellCardBody smallest simple invoice minimal usage',
 },
 {
 title:'Card: Elevation',
 path:'/components/card',
 detail:'components/card/examples/elevation.example.ts',
 terms:
'hellCard hellCardHeader hellCardBody shadow depth data-elevation flat raised floating',
 },
 {
 title:'Card: Entity Summary',
 path:'/components/card',
 detail:'components/card/examples/entity-summary.example.ts',
 terms:
'entity-summary hellCard hellCardHeader hellCardBody hellCardFooter hell-avatar hellChip hellButton hell-icon composite account owner overflow menu renewal',
 },
 {
 title:'Card: With Footer',
 path:'/components/card',
 detail:'components/card/examples/with-footer.example.ts',
 terms:
'with-footer hellCard hellCardHeader hellCardBody hellCardFooter hellButton confirmation danger delete action row',
 },
 {
 title:'Card: Without Header',
 path:'/components/card',
 detail:'components/card/examples/without-header.example.ts',
 terms:
'without-header hellCard hellCardBody hellButton composable regions optional footer stat tile',
 },
 {
 title:'Checkbox: Styling (all parts)',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/all-parts-styling.example.ts',
 terms:
'components/checkbox/examples/all-parts-styling.example components/checkbox hellCheckbox hellNativeCheckbox ui Part Style Map HellCheckboxUi root indicator data-slot rounded-hell-pill',
 },
 {
 title:'Checkbox: Basic',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/basic.example.ts',
 terms:
'components/checkbox/examples/basic.example components/checkbox hellCheckbox hellField hellFieldLabel checked checkedChange minimal usage',
 },
 {
 title:'Checkbox: Parent/child group',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/group.example.ts',
 terms:
'indeterminate select all components/checkbox/examples/group.example components/checkbox hellCheckbox hellField hellFieldLabel parent child permissions',
 },
 {
 title:'Checkbox: Native path',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/native.example.ts',
 terms:
'components/checkbox/examples/native.example components/checkbox hellNativeCheckbox hellField hellFieldLabel hellFieldDescription required indeterminate input form',
 },
 {
 title:'Checkbox: With field and card',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/settings-list.example.ts',
 terms:
'settings list components/checkbox/examples/settings-list.example components/checkbox hellCheckbox hellCard hellCardHeader hellCardBody hellField hellFieldLabel hellFieldDescription hell-icon notification preferences composite',
 },
 {
 title:'Checkbox: States',
 path:'/components/checkbox',
 detail:'components/checkbox/examples/states.example.ts',
 terms:
'components/checkbox/examples/states.example components/checkbox hellCheckbox checked indeterminate disabled unchecked',
 },
 {
 title:'Chip: Basic',
 path:'/components/chip',
 detail:'components/chip/examples/basic.example.ts',
 terms:
'components/chip/examples/basic.example components/chip hellChipSet hellChip hellChipRemove remove event roving focus arrow Home End Delete Backspace label removable token assignees',
 },
 {
 title:'Chip: Clickable',
 path:'/components/chip',
 detail:'components/chip/examples/clickable.example.ts',
 terms:
'components/chip/examples/clickable.example components/chip hellChip button anchor link interactive host summary pill copyable filter data-interactive click',
 },
 {
 title:'Chip: Disabled',
 path:'/components/chip',
 detail:'components/chip/examples/disabled.example.ts',
 terms:
'components/chip/examples/disabled.example components/chip hellChipSet hellChip hellChipRemove disabled aria-disabled data-disabled skip roving removal',
 },
 {
 title:'Chip: Sizes',
 path:'/components/chip',
 detail:'components/chip/examples/sizes.example.ts',
 terms:
'components/chip/examples/sizes.example components/chip hellChip size HellSize xs sm md lg xl data-size',
 },
 {
 title:'Chip: Styling',
 path:'/components/chip',
 detail:'components/chip/examples/styling.example.ts',
 terms:
'components/chip/examples/styling.example components/chip hellChipSet hellChip hellChipRemove ui Part Style Map root data-slot rounded-hell-md bg-hell-primary',
 },
 {
 title:'Chip: Variants',
 path:'/components/chip',
 detail:'components/chip/examples/variants.example.ts',
 terms:
'components/chip/examples/variants.example components/chip hellChip variant HellChipVariant default primary info success warning danger data-variant palette tag',
 },
 {
 title:'Code Editor: Basic',
 path:'/components/code-editor',
 detail:'components/code-editor/examples/basic.example.ts',
 terms:
'code-editor hell-code-editor value extensions valueChange ariaLabel javascript CodeMirror editable signal min-h-40 feature-flags',
 },
 {
 title:'Code Editor: With card, select, and buttons',
 path:'/components/code-editor',
 detail:'components/code-editor/examples/config-editor.example.ts',
 terms:
'code-editor config-editor composite hell-code-editor hellCard hellCardHeader hellCardBody hellCardFooter hell-select HELL_CARD_DIRECTIVES HellSelect hellButton language picker dirty reset apply ui root',
 },
 {
 title:'Code Editor: Supplying a language',
 path:'/components/code-editor',
 detail:'components/code-editor/examples/language.example.ts',
 terms:
'code-editor supplying-a-language extensions hell-code-editor hellButton variant size compartment reconfigure javascript typescript jsx tsx computed signal',
 },
 {
 title:'Code Editor: Read-only viewer',
 path:'/components/code-editor',
 detail:'components/code-editor/examples/read-only.example.ts',
 terms:
'code-editor read only hell-code-editor readOnly value extensions ariaLabel aria-readonly generated audit CodeMirror',
 },
 {
 title:'Code Editor: Styling',
 path:'/components/code-editor',
 detail:'components/code-editor/examples/styling.example.ts',
 terms:
'code-editor all-parts part style map hell-code-editor ui HellCodeEditorUi root rounded-hell-xl border-hell-primary bg-hell-surface-elevated shadow-hell-lg min-h-40',
 },
 {
 title:'Combobox: Basic',
 path:'/components/combobox',
 detail:'components/combobox/examples/basic.example.ts',
 terms:
'components/combobox/examples/basic.example components/combobox hellCombobox hellComboboxInput hellComboboxButton hellComboboxPortal hellComboboxDropdown hellComboboxOption hellComboboxEmpty HELL_COMBOBOX_DIRECTIVES single-select filter currency ui data-slot root',
 },
 {
 title:'Combobox: Chips presentation',
 path:'/components/combobox',
 detail:'components/combobox/examples/chips.example.ts',
 terms:
'components/combobox/examples/chips.example components/combobox hellCombobox hellComboboxChips hellComboboxInput hellComboboxButton hellComboboxPortal hellComboboxDropdown hellComboboxOption hellComboboxEmpty hellChip hellChipRemove HellChipSet HellComboboxValue HELL_COMBOBOX_DIRECTIVES multi-select multiple removable chips tokens assign groups keyboard roving focus Arrow Left Right Home End Delete Backspace remove selection state aria-selected displayWith ui data-slot root chip',
 },
 {
 title:'Combobox: Multiple',
 path:'/components/combobox',
 detail:'components/combobox/examples/multiple.example.ts',
 terms:
'components/combobox/examples/multiple.example components/combobox hellCombobox hellComboboxInput hellComboboxButton hellComboboxPortal hellComboboxDropdown hellComboboxOption hellComboboxEmpty hellChip HellComboboxValue HELL_COMBOBOX_DIRECTIVES multi-select array token chips labels ui data-slot root',
 },
 {
 title:'Combobox: Preset',
 path:'/components/combobox',
 detail:'components/combobox/examples/preset.example.ts',
 terms:
'components/combobox/examples/preset.example components/combobox hell-combobox HellCombobox HellCombobox options value valueChange allowDeselect emptyLabel placeholder aria-label convenience warehouse ui data-slot root control input button dropdown option empty',
 },
 {
 title:'Combobox: Styling',
 path:'/components/combobox',
 detail:'components/combobox/examples/styling.example.ts',
 terms:
'components/combobox/examples/styling.example components/combobox hell-combobox HellCombobox HellComboboxUi HellCombobox ui Part Style Map data-slot root control input button dropdown option empty all-parts hell tokens bg-hell text-hell rounded-hell priority',
 },
 {
 title:'Combobox: With field and tag',
 path:'/components/combobox',
 detail:'components/combobox/examples/with-field-tag.example.ts',
 terms:
'components/combobox/examples/with-field-tag.example components/combobox hellCombobox hellComboboxInput hellComboboxButton hellComboboxPortal hellComboboxDropdown hellComboboxOption hellComboboxEmpty hellField hellFieldLabel hellFieldDescription hellChip hellButton hell-icon iconOnly HellComboboxValue HELL_COMBOBOX_DIRECTIVES HELL_FIELD_DIRECTIVES reviewers multi-select removable chips composite ui data-slot root',
 },
 {
 title:'Confirm: Basic',
 path:'/components/confirm',
 detail:'components/confirm/examples/basic.example.ts',
 terms:
'confirm injectHellConfirm hellPrimaryAction prompt action promise await dialog modal boolean publish smallest usage title description accessible focus trap composite',
 },
 {
 title:'Confirm: Destructive',
 path:'/components/confirm',
 detail:'components/confirm/examples/danger.example.ts',
 terms:
'confirm injectHellConfirm hellDestructiveAction hellSecondaryAction cancelAction destructive delete keep project initial focus cancel button variant danger irreversible',
 },
 {
 title:'Confirm: Countdown',
 path:'/components/confirm',
 detail:'components/confirm/examples/countdown.example.ts',
 terms:
'confirm injectHellConfirm hellCountdownAction decorator countdown gate disabled remaining seconds reset database never auto-confirm irreversible Label Contract',
 },
 {
 title:'Confirm: Popconfirm row delete',
 path:'/components/confirm',
 detail:'components/confirm/examples/popconfirm-row-delete.example.ts',
 terms:
'popconfirm injectHellPopconfirm hellDestructiveAction anchor row delete destructive danger anchored popover imperative promise boolean single open one at a time floating dismissal escape outside click focus restore in-context inline',
 },
 {
 title:'Confirm: Choice for unsaved changes',
 path:'/components/confirm',
 detail:'components/confirm/examples/choice-unsaved-changes.example.ts',
 terms:
'choice injectHellChoice hellChoiceAction dismissEquivalent typed key n-way decision save discard keep editing unsaved changes close editor escape resolves stay null modal',
 },
 {
 title:'Date Input: Basic',
 path:'/components/date-input',
 detail:'components/date-input/examples/basic.example.ts',
 terms:
'date-input hell-date-input smallest usage aria-label dateChange minimal simple',
 },
 {
 title:'Date Input: Bounds and Validation',
 path:'/components/date-input',
 detail:'components/date-input/examples/bounds-and-validation.example.ts',
 terms:
'date-input hell-date-input min max invalid disabled outOfRangeDate invalidDateInputDraft',
 },
 {
 title:'Date Input: Reactive Forms',
 path:'/components/date-input',
 detail:'components/date-input/examples/reactive-forms.example.ts',
 terms:
'date-input reactive-forms hell-date-input FormControl ReactiveFormsModule hellField hellFieldLabel hellFieldDescription ControlValueAccessor',
 },
 {
 title:'Date Input: Sizes',
 path:'/components/date-input',
 detail:'components/date-input/examples/sizes.example.ts',
 terms:
'date-input hell-date-input size sm md lg',
 },
 {
 title:'Date Input: Styling',
 path:'/components/date-input',
 detail:'components/date-input/examples/styling.example.ts',
 terms:
'date-input hell-date-input ui HellDateInputUi HellDateInputPart root trigger triggerIcon pickerPanel part style map tailwind tokens',
 },
 {
 title:'Date Input: With Field and Button',
 path:'/components/date-input',
 detail:'components/date-input/examples/with-field-filter-row.example.ts',
 terms:
'date-input with-field-filter-row hell-date-input hellField hellFieldLabel hellButton hell-icon composite filter row from to range clear',
 },
 {
 title:'Date Picker: Basic',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/basic.example.ts',
 terms:
'date-picker hell-date-picker dateChange single calendar signal smallest usage',
 },
 {
 title:'Date Picker: Bounded',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/bounded.example.ts',
 terms:
'date-picker hell-date-picker min max dateChange disabled days constrain range window bounds',
 },
 {
 title:'Date Picker: Disabled',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/disabled.example.ts',
 terms:
'date-picker hell-date-picker hell-date-range-picker disabled state grid navigation aria-disabled',
 },
 {
 title:'Date Picker: Localized',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/localized.example.ts',
 terms:
'date-picker hell-date-picker locale firstDayOfWeek de-DE Monday BCP-47 Intl weekday headers international',
 },
 {
 title:'Date Picker: Range',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/range.example.ts',
 terms:
'date-picker hell-date-range-picker startDate endDate startDateChange endDateChange range-between booking report period',
 },
 {
 title:'Date Picker: Styling',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/styling.example.ts',
 terms:
'date-picker hell-date-range-picker ui HellDateRangePickerUi part style map root header nav navButton label grid weekdayHeader cell dateButton data-selected data-range-between tokens all-parts',
 },
 {
 title:'Date Picker: With popover',
 path:'/components/date-picker',
 detail:'components/date-picker/examples/with-popover.example.ts',
 terms:
'date-picker with-popover composite hell-date-range-picker hellButton hellPopover hellPopoverTrigger hell-icon block placement min ui trip dates booking field',
 },
 {
 title:'Dialog: Basic',
 path:'/components/dialog',
 detail:'components/dialog/examples/basic.example.ts',
 terms:
'hellDialogTrigger hellDialogOverlay hellDialog hellDialogTitle hellDialogDescription hellCardHeader hellCardBody hellCardFooter hellButton close template-context confirm modal smallest usage',
 },
 {
 title:'Dialog: Dismissal',
 path:'/components/dialog',
 detail:'components/dialog/examples/dismissal.example.ts',
 terms:
'closeOnEscape closeOnOutsideClick hellDialogTrigger hellDialogOverlay hellDialog hellButton guard escape outside-click force decision NgpDismissGuard',
 },
 {
 title:'Dialog: With field, input, and button',
 path:'/components/dialog',
 detail:'components/dialog/examples/edit-record.example.ts',
 terms:
'edit-record hellDialogTrigger hellDialogData closed hellDialog hellField hellFieldLabel hellFieldDescription hellInput hellTextarea hellButton hellCardHeader hellCardBody hellCardFooter form submit close result composite edit modal customer record',
 },
 {
 title:'Dialog: Scoped',
 path:'/components/dialog',
 detail:'components/dialog/examples/scoped.example.ts',
 terms:
'hellDialogScope hellDialogOverlay hellDialogTrigger hellDialog hellButton region backdrop app-shell hellAppContent interactive chrome inset',
 },
 {
 title:'Dialog: Sizes',
 path:'/components/dialog',
 detail:'components/dialog/examples/sizes.example.ts',
 terms:
'hellDialog size hellDialogTrigger hellDialogData hellDialogOverlay hellDialogTitle hellDialogDescription hellButton HellSize sm md lg xl max-width ref.data',
 },
 {
 title:'Dialog: Styling',
 path:'/components/dialog',
 detail:'components/dialog/examples/styling.example.ts',
 terms:
'ui part style map hellDialogOverlay hellDialog hellDialogTitle hellDialogDescription root shorthand bg-hell-danger-soft rounded-hell-xl text-hell-danger-strong border-hell-danger tailwind refine',
 },
 {
 title:'Dialpad: Styling (all parts)',
 path:'/components/dialpad',
 detail:'components/dialpad/examples/all-parts-styling.example.ts',
 terms:
'all-parts hell-dialpad ui HellDialpadUi root display displayLabel numberInput controls clearButton backspaceButton grid keyButton digit letters lowerGrid callButton part style map',
 },
 {
 title:'Dialpad: Basic',
 path:'/components/dialpad',
 detail:'components/dialpad/examples/basic.example.ts',
 terms:
'hell-dialpad valueChange call uncontrolled default anatomy',
 },
 {
 title:'Dialpad: With button and card',
 path:'/components/dialpad',
 detail:'components/dialpad/examples/call-console.example.ts',
 terms:
'call-console hell-dialpad hellButton hellCard hellCardHeader hellCardBody hellCardFooter hellChip composite call console dial hang up readOnly',
 },
 {
 title:'Dialpad: States',
 path:'/components/dialpad',
 detail:'components/dialpad/examples/states.example.ts',
 terms:
'hell-dialpad disabled readOnly invalid showCallButton hellToggleGroup hellToggleGroupItem toggle multiple',
 },
 {
 title:'Drop Zone: Basic',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/basic.example.ts',
 terms:
'drop-zone components/drop-zone/examples/basic.example components/drop-zone hellDropzone files upload smallest usage',
 },
 {
 title:'Drop Zone: Disabled',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/disabled.example.ts',
 terms:
'drop-zone components/drop-zone/examples/disabled.example components/drop-zone hellDropzone state',
 },
 {
 title:'Drop Zone: Native Input',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/native-input.example.ts',
 terms:
'drop-zone native-input components/drop-zone/examples/native-input.example components/drop-zone hellDropzone nativeInput HTMLInputElement consumer-owned seam',
 },
 {
 title:'Drop Zone: Restricted',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/restricted.example.ts',
 terms:
'drop-zone single-file images-only components/drop-zone/examples/restricted.example components/drop-zone hellDropzone multiple accept image pdf avatar id-scan',
 },
 {
 title:'Drop Zone: Styling',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/styling.example.ts',
 terms:
'drop-zone all-parts components/drop-zone/examples/styling.example components/drop-zone hellDropzone ui Part Style Map data-slot root tokens',
 },
 {
 title:'Drop Zone: Upload Queue',
 path:'/components/drop-zone',
 detail:'components/drop-zone/examples/upload-queue.example.ts',
 terms:
'drop-zone upload-queue composite components/drop-zone/examples/upload-queue.example components/drop-zone components/progress components/chip hellDropzone hellProgress hellProgressBar hellChip hellButton hellIcon invoices progress status',
 },
 {
 title:'File Upload: Reference integration with a mock upload adapter',
 path:'/components/file-upload',
 detail:'components/file-upload/examples/upload-adapter.example.ts',
 terms:
'file-upload upload-adapter components/file-upload/examples/upload-adapter.example components/file-upload hell-file-upload controlled items HellFileUploadItem filesAdded rejected removed retried status progress uploading done error mock XMLHttpRequest onprogress adapter transport accept maxBytes maxFiles progressbar drag drop browse announce LiveAnnouncer',
 },
 {
 title:'File Upload: Single-file mode',
 path:'/components/file-upload',
 detail:'components/file-upload/examples/single-file.example.ts',
 terms:
'file-upload single-file components/file-upload/examples/single-file.example components/file-upload hell-file-upload maxFiles 1 single multiple avatar fax pdf count rejection one file',
 },
 {
 title:'File Upload: Styling with the Part Style Map',
 path:'/components/file-upload',
 detail:'components/file-upload/examples/styling.example.ts',
 terms:
'file-upload styling all-parts components/file-upload/examples/styling.example components/file-upload hell-file-upload ui Part Style Map HellFileUploadUi data-slot root dropzone browse list item itemIcon itemName itemMeta itemProgress itemError itemRemove itemRetry compact',
 },
 {
 title:'Empty State: No data',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/no-data.example.ts',
 terms:
'empty-state no-data components/empty-state/examples/no-data.example components/empty-state hell-empty-state hellEmptyStateTitle hellEmptyStateDescription hellEmptyStateActions hellButton preset noData create your first invoice glyph media title description actions blank region',
 },
 {
 title:'Empty State: No results',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/no-results.example.ts',
 terms:
'empty-state no-results components/empty-state/examples/no-results.example components/empty-state hell-empty-state hellEmptyStateDescription hellEmptyStateActions hellButton preset noResults clear filters filtered search no matches blank region',
 },
 {
 title:'Empty State: Error',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/error.example.ts',
 terms:
'empty-state error components/empty-state/examples/error.example components/empty-state hell-empty-state hellEmptyStateDescription hellEmptyStateActions hellButton preset error retry failed load in-place recovery',
 },
 {
 title:'Empty State: Forbidden',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/forbidden.example.ts',
 terms:
'empty-state forbidden components/empty-state/examples/forbidden.example components/empty-state hell-empty-state hellEmptyStateDescription hellEmptyStateActions hellButton preset forbidden permission access denied request access',
 },
 {
 title:'Empty State: Custom content',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/custom-content.example.ts',
 terms:
'empty-state custom-content components/empty-state/examples/custom-content.example components/empty-state hell-empty-state hellEmptyStateMedia hellEmptyStateTitle hellEmptyStateDescription hellEmptyStateActions hellButton hell-icon headingLevel projection override illustration HELL_EMPTY_STATE_LABELS label contract',
 },
 {
 title:'Empty State: Conditional content',
 path:'/components/empty-state',
 detail:'components/empty-state/examples/conditional.example.ts',
 terms:
'empty-state conditional components/empty-state/examples/conditional.example components/empty-state hell-empty-state hellEmptyStateActions ngProjectAs ng-container if control flow conditional projection dropped default ng-content retry cta slot',
 },
 {
 title:'Field: All Parts Styling',
 path:'/components/field',
 detail:'components/field/examples/all-parts-styling.example.ts',
 terms:
'all-parts-styling hellField hellFieldLabel hellFieldDescription hellFieldError hellInput ui part style map root every module hell-primary hell-danger-strong',
 },
 {
 title:'Field: Basic',
 path:'/components/field',
 detail:'components/field/examples/basic.example.ts',
 terms:
'hellField hellFieldLabel hellFieldDescription hellInput smallest realistic usage email',
 },
 {
 title:'Field: Orientation',
 path:'/components/field',
 detail:'components/field/examples/orientation.example.ts',
 terms:
'hellField hellFieldLabel hellFieldDescription hellCheckbox hellInput vertical horizontal ui gap',
 },
 {
 title:'Field: Validation',
 path:'/components/field',
 detail:'components/field/examples/validation.example.ts',
 terms:
'hellField hellFieldLabel hellFieldError hellFieldDescription hellInput invalid aria-invalid password error message',
 },
 {
 title:'Field: With Form Section',
 path:'/components/field',
 detail:'components/field/examples/with-form-section.example.ts',
 terms:
'with-form-section hellField hellFieldLabel hellFieldDescription hellCard hellCardHeader hellCardBody hellCheckbox hellInput hellNativeSelect invite teammate composite',
 },
 {
 title:'Flyout: All Parts Styling',
 path:'/components/flyout',
 detail:'components/flyout/examples/all-parts-styling.example.ts',
 terms:
'components/flyout/examples/all-parts-styling.example components/flyout hellFlyout hellFlyoutTrigger ui root Part Style Map data-slot bg-hell-primary-soft border-hell-primary rounded-hell-lg',
 },
 {
 title:'Flyout: Anchor And Boundary',
 path:'/components/flyout',
 detail:'components/flyout/examples/anchor-and-boundary.example.ts',
 terms:
'components/flyout/examples/anchor-and-boundary.example components/flyout hellFlyout hellFlyoutTrigger hellInput sibling input light-dismiss outside-click outside-focus escape',
 },
 {
 title:'Flyout: Basic',
 path:'/components/flyout',
 detail:'components/flyout/examples/basic.example.ts',
 terms:
'components/flyout/examples/basic.example components/flyout hellFlyout hellFlyoutTrigger openChange open show hide toggle non-modal light-dismiss anchored panel',
 },
 {
 title:'Flyout: Placement',
 path:'/components/flyout',
 detail:'components/flyout/examples/placement.example.ts',
 terms:
'components/flyout/examples/placement.example components/flyout hellFlyout hellFlyoutTrigger flip shift floating-ui top right bottom left viewport collision',
 },
 {
 title:'Flyout: With A Filters Panel',
 path:'/components/flyout',
 detail:'components/flyout/examples/with-filters-panel.example.ts',
 terms:
'components/flyout/examples/with-filters-panel.example components/flyout hellFlyout hellFlyoutTrigger hellCheckbox hellField hellFieldLabel hellChip hellButton hell-icon faSolidFilter composite toolbar status active count badge',
 },
 {
 title:'Icon: Basic',
 path:'/components/icon',
 detail:'components/icon/examples/basic.example.ts',
 terms:
'hell-icon HellIcon provideIcons faSolidCircleInfo smallest minimal usage',
 },
 {
 title:'Icon: Colors',
 path:'/components/icon',
 detail:'components/icon/examples/colors.example.ts',
 terms:
'color hell-icon HellIcon currentColor text-hell-success text-hell-info text-hell-warning text-hell-danger input faSolidCircleCheck faSolidCircleInfo faSolidTriangleExclamation faSolidXmark',
 },
 {
 title:'Icon: Sizes',
 path:'/components/icon',
 detail:'components/icon/examples/sizes.example.ts',
 terms:
'hell-icon HellIcon size input CSS length faSolidPhone em scaling',
 },
 {
 title:'Icon: Styling',
 path:'/components/icon',
 detail:'components/icon/examples/styling.example.ts',
 terms:
'all-parts hell-icon HellIcon ui shorthand map root part style pipeline faSolidBell bg-hell-primary-soft rounded-hell-sm text-hell-primary',
 },
 {
 title:'Icon: With Button And Tag',
 path:'/components/icon',
 detail:'components/icon/examples/with-button-and-tag.example.ts',
 terms:
'composite hell-icon HellIcon hellButton hellChip status glyph connection row trunk sip disabled faSolidCircleCheck faSolidPhone faSolidTriangleExclamation',
 },
 {
 title:'Input: All Parts Styling',
 path:'/components/input',
 detail:'components/input/examples/all-parts-styling.example.ts',
 terms:
'components/input/examples/all-parts-styling.example components/input hellInput hellNativeSelect hellTextarea ui data-slot root part style map recipe',
 },
 {
 title:'Input: Auto Grow',
 path:'/components/input',
 detail:'components/input/examples/auto-grow.example.ts',
 terms:
'components/input/examples/auto-grow.example components/input hellTextarea autoGrow auto-grow field-sizing content sizing resize rows max-block-size overflow-y cap grow multiline no javascript measurement progressive enhancement data-auto-grow',
 },
 {
 title:'Input: Basic',
 path:'/components/input',
 detail:'components/input/examples/basic.example.ts',
 terms:
'components/input/examples/basic.example components/input hellInput hellField hellFieldLabel minimal simple usage text field',
 },
 {
 title:'Input: Select',
 path:'/components/input',
 detail:'components/input/examples/select.example.ts',
 terms:
'native components/input/examples/select.example components/input hellNativeSelect size sm md lg invalid disabled dropdown chevron',
 },
 {
 title:'Input: Sizes And States',
 path:'/components/input',
 detail:'components/input/examples/sizes.example.ts',
 terms:
'components/input/examples/sizes.example components/input hellInput size sm md lg invalid disabled aria-invalid',
 },
 {
 title:'Input: Textarea',
 path:'/components/input',
 detail:'components/input/examples/textarea.example.ts',
 terms:
'components/input/examples/textarea.example components/input hellTextarea size sm md lg invalid resize multiline notes',
 },
 {
 title:'Input: With Search Icon',
 path:'/components/input',
 detail:'components/input/examples/with-search-icon.example.ts',
 terms:
'field composite components/input/examples/with-search-icon.example components/input hellInput hellField hellFieldLabel hellFieldDescription hell-icon HellIcon prefix clear button provideIcons faSolidMagnifyingGlass faSolidXmark',
 },
 {
 title:'Listbox: With search and card',
 path:'/components/listbox',
 detail:'components/listbox/examples/assignment-picker.example.ts',
 terms:
'composite assignment picker hellCard hellSearch hellListbox hell-avatar teammate filter client-side',
 },
 {
 title:'Listbox: Basic',
 path:'/components/listbox',
 detail:'components/listbox/examples/basic.example.ts',
 terms:
'hellListbox hellListboxOption single-select assign owner value valueChange aria-labelledby',
 },
 {
 title:'Listbox: Multiple selection',
 path:'/components/listbox',
 detail:'components/listbox/examples/multiple.example.ts',
 terms:
'mode hellListbox hellListboxOption disabled launch checks checklist multi-select',
 },
 {
 title:'Listbox: Sections',
 path:'/components/listbox',
 detail:'components/listbox/examples/sections.example.ts',
 terms:
'hellListboxSection hellListboxHeader grouping region picker role group aria-labelledby',
 },
 {
 title:'Listbox: Styling',
 path:'/components/listbox',
 detail:'components/listbox/examples/styling.example.ts',
 terms:
'ui part style map hellListbox hellListboxOption hellListboxSection hellListboxHeader root data-active refinement tokens',
 },
 {
 title:'Menu: Basic',
 path:'/components/menu',
 detail:'components/menu/examples/basic.example.ts',
 terms:
'hellButton hellMenuTrigger hellMenu hellMenuItem hellMenuSeparator overflow actions row disabled item trigger ng-template',
 },
 {
 title:'Menu: Checkable items',
 path:'/components/menu',
 detail:'components/menu/examples/checkable.example.ts',
 terms:
'hellButton hellMenuTrigger hellMenu hellMenuSection hellMenuLabel hellMenuItemCheckbox hellMenuItemRadioGroup hellMenuItemRadio hellMenuItemIndicator hellMenuSeparator checkbox radio group preferences toggle multi-select single-choice checked valueChange',
 },
 {
 title:'Menu: Data-driven options',
 path:'/components/menu',
 detail:'components/menu/examples/options.example.ts',
 terms:
'options components/menu/examples/options.example components/menu hell-menu-options HellOption hellMenuTrigger hellMenu data-driven checkable options selected selectedChange compareWith disabled selection floor controlled column visibility menuitemcheckbox',
 },
 {
 title:'Menu: With avatar (account menu)',
 path:'/components/menu',
 detail:'components/menu/examples/profile-menu.example.ts',
 terms:
'profile-menu hellMenuTrigger hellMenu hellMenuSection hellMenuSeparator hellMenuItem hellMenuItemIcon hellMenuItemTrailing hell-avatar hell-icon composite bottom-end sign out header aria-label',
 },
 {
 title:'Menu: Icons, sections & submenus',
 path:'/components/menu',
 detail:'components/menu/examples/sections.example.ts',
 terms:
'hellButton hell-icon hellMenuTrigger hellMenu hellMenuSection hellMenuLabel hellMenuItem hellMenuItemIcon hellMenuItemTrailing hellSubmenuTrigger hellMenuSeparator submenu nested shortcut kbd hint grouped',
 },
 {
 title:'Menu: Styling (all parts)',
 path:'/components/menu',
 detail:'components/menu/examples/styling.example.ts',
 terms:
'hellButton hell-icon hellMenuTrigger hellMenu hellMenuSection hellMenuLabel hellMenuItem hellMenuItemIcon hellMenuItemTrailing hellMenuItemCheckbox hellMenuItemIndicator hellMenuItemRadioGroup hellMenuItemRadio hellMenuSeparator hellSubmenuTrigger ui part style map data-hover data-focus-visible bg-hell-primary-soft rounded-hell-lg refine',
 },
 {
 title:'Filter Bar: TanStack Filter Controls',
 path:'/components/filter-bar',
 detail:'components/filter-bar/examples/tanstack.example.ts',
 terms:
'filter bar filter-bar tanstack examples hell-filter-bar HellFilterField HellFilterToken controlled value valueChange text options free text $text columnFilters globalFilter Table Shell toolbar Filter Controls tokens chips combobox listbox popover',
 },
 {
 title:'Filter Bar: Server dispatch',
 path:'/components/filter-bar',
 detail:'components/filter-bar/examples/server-dispatch.example.ts',
 terms:
'filter bar filter-bar server dispatch entity date range dateRange async HellSearchSource abort signal HellFilterEntityOption debounceMs limit searchError loading empty error owner work orders controlled serializable JSON ISO open ended request',
 },
 {
 title:'Multi-Select Menu Button: Basic',
 path:'/components/multi-select-menu-button',
 detail:'components/multi-select-menu-button/examples/basic.example.ts',
 terms:
'multi-select-menu-button recipe basic components/multi-select-menu-button/examples/basic.example components/multi-select-menu-button hellButton hellMenuTrigger hellMenu hell-menu-options HellOption options selected selectedChange reset count badge data-selection-count data-has-selection controlled checkable menuitemcheckbox choose subset channels disabled selection floor',
 },
 {
 title:'Multi-Select Menu Button: TanStack column visibility',
 path:'/components/multi-select-menu-button',
 detail:'components/multi-select-menu-button/examples/tanstack-columns.example.ts',
 terms:
'multi-select-menu-button recipe tanstack-columns components/multi-select-menu-button/examples/tanstack-columns.example components/multi-select-menu-button hellButton hellMenu hell-menu-options TanStack columnVisibility getCanHide enableHiding onColumnVisibilityChange localStorage persistence hellTableShellToolbar hell-tanstack-table Table Shell toolbar recipe visible columns selection floor reset',
 },
 {
 title:'Omnibar: Async search',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/async-search.example.ts',
 terms:
'async-search components/omnibar/examples/async-search.example components/omnibar hell-omnibar searchSource searchFields searchLimit searchDebounce loadingTemplate loadingMessage searchError HellSearchSource HellSearchField abort signal hellOmnibarLeading hellOmnibarActions hellOmnibarAction pressed hellOmnibarGroup hellOmnibarGroupLabel hellOmnibarItem hellOmnibarItemIcon hellOmnibarItemText hellOmnibarItemSubtext hellOmnibarItemTrailing hellOmnibarFooter hell-icon HellIcon disabled item error footer remote backend',
 },
 {
 title:'Omnibar: Basic',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/basic.example.ts',
 terms:
'components/omnibar/examples/basic.example components/omnibar hell-omnibar hellOmnibarGroup hellOmnibarGroupLabel hellOmnibarItem hellOmnibarItemText searchItems searchFields searchResultsChange submit value HELL_OMNIBAR_DIRECTIVES HellSearchField HellSearchResult local ranking command palette smallest usage',
 },
 {
 title:'Omnibar: Command palette with kbd',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/command-palette.example.ts',
 terms:
'command-palette components/omnibar/examples/command-palette.example components/omnibar hell-omnibar hellKbd @hell-ui/angular/chip hotkey mod+k hellOmnibarLeading hellOmnibarTrailing hellOmnibarGroup hellOmnibarGroupLabel hellOmnibarItem hellOmnibarItemIcon hellOmnibarItemText hellOmnibarItemTrailing hell-icon HellIcon topbar grouped commands shortcut chips composite',
 },
 {
 title:'Omnibar: Global hotkey',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/hotkey.example.ts',
 terms:
'components/omnibar/examples/hotkey.example components/omnibar hell-omnibar mod+k shortcut hellOmnibarTrailing hellKbd kbd @hell-ui/angular/chip hellOmnibarGroup hellOmnibarItem hellOmnibarItemText searchItems searchFields command palette',
 },
 {
 title:'Omnibar: Sizes',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/sizes.example.ts',
 terms:
'components/omnibar/examples/sizes.example components/omnibar hell-omnibar size sm md lg data-size hellOmnibarGroup hellOmnibarItem hellOmnibarItemText searchItems searchFields HELL_OMNIBAR_DIRECTIVES control height density',
 },
 {
 title:'Omnibar: Styling all parts',
 path:'/components/omnibar',
 detail:'components/omnibar/examples/styling.example.ts',
 terms:
'components/omnibar/examples/styling.example components/omnibar hell-omnibar ui Part Style Map HellOmnibarUi HellOmnibarPart data-slot control inputWrap input clear panel actions results loading skeletonRow skeletonText empty hellOmnibarPanel hellOmnibarGroup hellOmnibarGroupLabel hellOmnibarItem hellOmnibarItemIcon hellOmnibarItemText hellOmnibarItemSubtext hellOmnibarItemTrailing hellOmnibarChip hellOmnibarChipRemove hellOmnibarActions hellOmnibarAction hell-icon HellIcon searchSource design tokens bg-hell-primary-soft rounded-hell',
 },
 {
 title:'Pagination: Basic',
 path:'/components/pagination',
 detail:'components/pagination/examples/basic.example.ts',
 terms:
'hell-pagination HellPaginationStrip page pageCount pageChange simple usage',
 },
 {
 title:'Pagination: Composing your own layout',
 path:'/components/pagination',
 detail:'components/pagination/examples/composed.example.ts',
 terms:
'composed custom hellPagination hellPageLink directive composition nav aria-label',
 },
 {
 title:'Pagination: Page Jump',
 path:'/components/pagination',
 detail:'components/pagination/examples/jump.example.ts',
 terms:
'mode select hellNativeSelect large set page-jump HellPaginationStrip hell-pagination',
 },
 {
 title:'Pagination: Previous / Next',
 path:'/components/pagination',
 detail:'components/pagination/examples/previous-next.example.ts',
 terms:
'previous-next mode compact status aria-live HellPaginationStrip hell-pagination boundary disabled',
 },
 {
 title:'Pagination: Styling',
 path:'/components/pagination',
 detail:'components/pagination/examples/styling.example.ts',
 terms:
'ui Part Style Map HellPaginationStripUi root control controlGlyph jump jumpLabel jumpSelect jumpTotal status all-parts tokens',
 },
 {
 title:'Pagination: With table and page size',
 path:'/components/pagination',
 detail:'components/pagination/examples/with-table.example.ts',
 terms:
'rows per hellNativeSelect HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTableRoot hellTableHeader hellTableBody hellTableRow hellTableCell composite invoices',
 },
 {
 title:'Pdf Viewer: Basic',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/basic.example.ts',
 terms:
'pdf-viewer hell-pdf-viewer HellPdfViewer src worker fileName smallest usage lazy stylesheet loader document',
 },
 {
 title:'Pdf Viewer: With Split View And Card',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/document-review.example.ts',
 terms:
'pdf-viewer document-review composite hell-pdf-viewer HellPdfViewer hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES hellCard hellCardHeader hellCardBody hellCardFooter HELL_CARD_DIRECTIVES hellButton hell-icon HellIcon hellChip master detail review queue approve invoice',
 },
 {
 title:'Pdf Viewer: Events And Error Handling',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/events.example.ts',
 terms:
'pdf-viewer hell-pdf-viewer HellPdfViewer hellButton loaded pageChange zoomChange totalPages fallback open in new tab outputs',
 },
 {
 title:'Pdf Viewer: Initial View',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/initial-view.example.ts',
 terms:
'pdf-viewer initial-view hell-pdf-viewer HellPdfViewer initialPage initialZoom page-width preset zoom starting page state',
 },
 {
 title:'Pdf Viewer: Lazy Loading',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/lazy-route.example.ts',
 terms:
'pdf-viewer lazy-route hell-pdf-viewer HellPdfViewer RouterOutlet router-outlet Routes loadComponent feature route bundle pdfjs stylesheet on demand',
 },
 {
 title:'Pdf Viewer: Styling',
 path:'/components/pdf-viewer',
 detail:'components/pdf-viewer/examples/styling.example.ts',
 terms:
'pdf-viewer all-parts hell-pdf-viewer HellPdfViewer HellPdfViewerUi ui part style map root toolbar toolbarGroup divider pageInput toolbarText zoomSelect findBar findInput findCount viewport sidebar thumb thumbLabel pageArea',
 },
 {
 title:'Popover: All Parts Styling',
 path:'/components/popover',
 detail:'components/popover/examples/all-parts-styling.example.ts',
 terms:
'ui root part style map recipe refinement',
 },
 {
 title:'Popover: Basic',
 path:'/components/popover',
 detail:'components/popover/examples/basic.example.ts',
 terms:
'hellPopoverTrigger hellPopover simple usage button click status',
 },
 {
 title:'Popover: Dismissal',
 path:'/components/popover',
 detail:'components/popover/examples/dismissal.example.ts',
 terms:
'closeOnOutsideClick closeOnEscape hellSwitch confirmation delete destructive',
 },
 {
 title:'Popover: Placement',
 path:'/components/popover',
 detail:'components/popover/examples/placement.example.ts',
 terms:
'hellPopoverTrigger flip shift top right bottom left NgpPopoverPlacement floating-ui',
 },
 {
 title:'Popover: With Card',
 path:'/components/popover',
 detail:'components/popover/examples/with-card.example.ts',
 terms:
'composite hellCard hellCardBody hellCardFooter hell-avatar hellChip profile summary assignee reassign',
 },
 {
 title:'Progress: All Parts Styling',
 path:'/components/progress',
 detail:'components/progress/examples/all-parts-styling.example.ts',
 terms:
'all-parts hellProgress hellProgressBar ui part style map root bg-hell-success bg-hell-primary-soft h-hell-3 rounded-hell-md deployment',
 },
 {
 title:'Progress: Basic',
 path:'/components/progress',
 detail:'components/progress/examples/basic.example.ts',
 terms:
'hellProgress hellProgressBar determinate track fill upload value max simple',
 },
 {
 title:'Progress: Indeterminate',
 path:'/components/progress',
 detail:'components/progress/examples/indeterminate.example.ts',
 terms:
'hellProgress hellProgressBar null value unknown duration loading connecting data-indeterminate pulse animation',
 },
 {
 title:'Progress: Labeled Value',
 path:'/components/progress',
 detail:'components/progress/examples/labeled-value.example.ts',
 terms:
'labeled-value hellProgress hellProgressBar hellButton aria-labelledby storage used percentage signal stepper interactive text',
 },
 {
 title:'Progress: Thickness',
 path:'/components/progress',
 detail:'components/progress/examples/thickness.example.ts',
 terms:
'sizes hellProgress hellProgressBar ui height h-hell track thin thick',
 },
 {
 title:'Progress: With Job Status Card',
 path:'/components/progress',
 detail:'components/progress/examples/with-job-status-card.example.ts',
 terms:
'composite hellCard hellCardHeader hellCardBody hellProgress hellProgressBar hellChip export nightly running tag',
 },
 {
 title:'Radio: All Parts Styling',
 path:'/components/radio',
 detail:'components/radio/examples/all-parts-styling.example.ts',
 terms:
'ui part style map hellRadioGroup hellRadio hellNativeRadioGroup hellNativeRadio root data-checked tailwind refinement',
 },
 {
 title:'Radio: Basic',
 path:'/components/radio',
 detail:'components/radio/examples/basic.example.ts',
 terms:
'hellRadioGroup hellRadio HellRadioIndicator ngpRadioIndicator digest frequency simplest usage exclusive choice',
 },
 {
 title:'Radio: Orientation and Disabled Options',
 path:'/components/radio',
 detail:'components/radio/examples/horizontal.example.ts',
 terms:
'horizontal hellRadioGroup hellRadio HellRadioIndicator t-shirt size arrow keys roving focus data-orientation',
 },
 {
 title:'Radio: Native Path',
 path:'/components/radio',
 detail:'components/radio/examples/native.example.ts',
 terms:
'hellNativeRadioGroup hellNativeRadio input type=radio priority checkedChange form semantics',
 },
 {
 title:'Radio: With Field and Card (Plan Picker)',
 path:'/components/radio',
 detail:'components/radio/examples/plan-picker.example.ts',
 terms:
'hellRadioGroup hellRadio hellCard hellCardHeader hellCardBody hellCardFooter hellField hellFieldLabel hellFieldDescription hellChip composite pricing tiers required validation',
 },
 {
 title:'Resizable: Basic',
 path:'/components/resizable',
 detail:'components/resizable/examples/basic.example.ts',
 terms:
'hellResizable hellResizablePane hellResizableHandle two-pane divider drag keyboard arrow-keys smallest usage default hairline',
 },
 {
 title:'Resizable: Grip handle',
 path:'/components/resizable',
 detail:'components/resizable/examples/grip-handle.example.ts',
 terms:
'grip-handle hellResizable hellResizablePane hellResizableHandle appearance pill three-dot indicator navigator preview affordance',
 },
 {
 title:'Resizable: With card and table',
 path:'/components/resizable',
 detail:'components/resizable/examples/inspector.example.ts',
 terms:
'inspector hellResizable hellResizablePane hellResizableHandle hellCard hellCardHeader hellCardBody hellTableContainer hellTableRoot hellTableHeader hellTableBody hellTableRow hellTableHeaderCell hellTableCell hellChip aria-controls list detail composite grip appearance selection',
 },
 {
 title:'Resizable: Minimum sizes',
 path:'/components/resizable',
 detail:'components/resizable/examples/min-sizes.example.ts',
 terms:
'min-sizes hellResizable hellResizablePane hellResizableHandle minSize initialFlex three panes sidebar main inspector constrained adjacent rebalance',
 },
 {
 title:'Resizable: Styling',
 path:'/components/resizable',
 detail:'components/resizable/examples/styling.example.ts',
 terms:
'hellResizable hellResizablePane hellResizableHandle ui part style map HellResizableHandleUi root grip all-parts appearance design tokens rounded-hell bg-hell',
 },
 {
 title:'Resizable: Vertical orientation',
 path:'/components/resizable',
 detail:'components/resizable/examples/vertical.example.ts',
 terms:
'hellResizable hellResizablePane hellResizableHandle stacked panes row-resize initialFlex editor console',
 },
 {
 title:'Save Bar: Contextual mode with a reactive form',
 path:'/components/save-bar',
 detail:'components/save-bar/examples/contextual-form.example.ts',
 terms:
'save-bar contextual-form components/save-bar/examples/contextual-form.example components/save-bar hell-save-bar dirty busy disabled saved discarded reactive form FormGroup form.dirty form.invalid form.pending unsaved changes one-line binding save discard announce',
 },
 {
 title:'Save Bar: Form submission and per-instance message',
 path:'/components/save-bar',
 detail:'components/save-bar/examples/form-submit.example.ts',
 terms:
'save-bar form-submit components/save-bar/examples/form-submit.example components/save-bar hell-save-bar saveType submit type button ngSubmit native form submission enter to save message per-instance override label contract size unsent fax LiveAnnouncer',
 },
 {
 title:'Save Bar: Persistent mode for settings',
 path:'/components/save-bar',
 detail:'components/save-bar/examples/persistent-settings.example.ts',
 terms:
'save-bar persistent-settings components/save-bar/examples/persistent-settings.example components/save-bar hell-save-bar mode persistent settings page always visible footer extra actions projected reset to defaults hellButton dirty message',
 },
 {
 title:'Save Bar: Sticky inside a scroll container',
 path:'/components/save-bar',
 detail:'components/save-bar/examples/sticky-scroll.example.ts',
 terms:
'save-bar sticky-scroll components/save-bar/examples/sticky-scroll.example components/save-bar hell-save-bar sticky bottom scroll container normal flow no portal no fixed overflow dock last field visible',
 },
 {
 title:'Save Bar: Discard through the confirm function',
 path:'/components/save-bar',
 detail:'components/save-bar/examples/confirm-discard.example.ts',
 terms:
'save-bar confirm-discard components/save-bar/examples/confirm-discard.example components/save-bar hell-save-bar injectHellConfirm hellDestructiveAction hellSecondaryAction discarded confirm dialog danger discard changes keep editing route guard unsaved changes recoverable',
 },
 {
 title:'Search: Basic',
 path:'/components/search',
 detail:'components/search/examples/basic.example.ts',
 terms:
'hellSearch hellSearchClear hellInput HellButton HELL_SEARCH_DIRECTIVES filter list computed signal input clear',
 },
 {
 title:'Search: Empty State',
 path:'/components/search',
 detail:'components/search/examples/empty-state.example.ts',
 terms:
'empty-state hellSearch hellSearchClear data-empty escape clear icon HellIcon faSolidXmark iconOnly HELL_SEARCH_DIRECTIVES',
 },
 {
 title:'Search: Styling',
 path:'/components/search',
 detail:'components/search/examples/styling.example.ts',
 terms:
'ui part-style-map hellSearch hellSearchClear hellInput rounded-hell-pill bg-hell-surface-subtle rounded-hell-lg text-hell-danger all-parts',
 },
 {
 title:'Search: With Table Filter Toolbar',
 path:'/components/search',
 detail:'components/search/examples/with-table-filter-toolbar.example.ts',
 terms:
'composite hellSearch hellListbox hellListboxOption HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTableRoot hellTableRow hellTableHeaderCell hellTableCell hellChip invoices status',
 },
 {
 title:'Select: Basic',
 path:'/components/select',
 detail:'components/select/examples/basic.example.ts',
 terms:
'hellSelectTrigger hellSelectValue hellSelectPlaceholder hellSelectPortal hellSelectDropdown hellSelectOption HELL_SELECT_DIRECTIVES placeholder disabled option valueChange single-choice dropdown trigger button',
 },
 {
 title:'Select: Multiple',
 path:'/components/select',
 detail:'components/select/examples/multiple.example.ts',
 terms:
'hellSelectTrigger hellSelectValue hellSelectPlaceholder hellSelectPortal hellSelectDropdown hellSelectOption hellChip HELL_SELECT_DIRECTIVES multi-select array selected count tags permissions',
 },
 {
 title:'Select: Preset',
 path:'/components/select',
 detail:'components/select/examples/preset.example.ts',
 terms:
'hell-select HellSelect hellField hellFieldLabel hellFieldDescription HELL_FIELD_DIRECTIVES options value placeholder valueChange form field region',
 },
 {
 title:'Select: Rich options',
 path:'/components/select',
 detail:'components/select/examples/rich-options.example.ts',
 terms:
'rich-options hellSelectTrigger hellSelectValue hellSelectPlaceholder hellSelectPortal hellSelectDropdown hellSelectOption hell-icon HellIcon provideIcons HELL_SELECT_DIRECTIVES compareWith object-values custom option markup icon description status',
 },
 {
 title:'Select: Styling',
 path:'/components/select',
 detail:'components/select/examples/styling.example.ts',
 terms:
'hell-select HellSelect HellSelectUi ui part-style-map root trigger value placeholder dropdown option all-parts refine tokens rounded-hell bg-hell text-hell',
 },
 {
 title:'Select: With field and tag',
 path:'/components/select',
 detail:'components/select/examples/with-field-status.example.ts',
 terms:
'with-field-status hell-select HellSelect hellField hellFieldLabel hellFieldDescription hellFieldError HELL_FIELD_DIRECTIVES hellChip HellChipVariant hellButton composite form review decision status submit error',
 },
 {
 title:'Separator: All Parts Styling',
 path:'/components/separator',
 detail:'components/separator/examples/all-parts-styling.example.ts',
 terms:
'all-parts hellSeparator ui root part shorthand map bg-hell-primary bg-hell-danger rounded-hell-full',
 },
 {
 title:'Separator: Basic',
 path:'/components/separator',
 detail:'components/separator/examples/basic.example.ts',
 terms:
'hellSeparator smallest realistic usage horizontal divider between two sections default spacing md',
 },
 {
 title:'Separator: Orientation',
 path:'/components/separator',
 detail:'components/separator/examples/orientation.example.ts',
 terms:
'hellSeparator horizontal vertical axis self-stretch height ancestor',
 },
 {
 title:'Separator: Spacing',
 path:'/components/separator',
 detail:'components/separator/examples/spacing.example.ts',
 terms:
'hellSeparator none xs sm md lg xl HellSize margin scale main axis',
 },
 {
 title:'Separator: With Card',
 path:'/components/separator',
 detail:'components/separator/examples/with-card.example.ts',
 terms:
'with-card hellSeparator hellCard hellCardHeader hellCardBody HELL_CARD_DIRECTIVES hellButton iconOnly hell-icon notification settings list composite',
 },
 {
 title:'Skeleton: All Parts Styling',
 path:'/components/skeleton',
 detail:'components/skeleton/examples/all-parts-styling.example.ts',
 terms:
'all-parts-styling hellSkeleton ui part style map root',
 },
 {
 title:'Skeleton: Basic',
 path:'/components/skeleton',
 detail:'components/skeleton/examples/basic.example.ts',
 terms:
'hellSkeleton simplest usage placeholder text line',
 },
 {
 title:'Skeleton: Shapes',
 path:'/components/skeleton',
 detail:'components/skeleton/examples/shapes.example.ts',
 terms:
'hellSkeleton shape text circle rect radius',
 },
 {
 title:'Skeleton: Text Block',
 path:'/components/skeleton',
 detail:'components/skeleton/examples/text-block.example.ts',
 terms:
'text-block hellSkeleton paragraph placeholder staggered widths prose',
 },
 {
 title:'Skeleton: With Card Avatar',
 path:'/components/skeleton',
 detail:'components/skeleton/examples/with-card-avatar.example.ts',
 terms:
'with-card-avatar hellSkeleton hellCard hellCardHeader hellCardBody hellCardFooter hell-avatar hellButton HellAvatar loading composite aria-busy',
 },
 {
 title:'Slider: Basic',
 path:'/components/slider',
 detail:'components/slider/examples/basic.example.ts',
 terms:
'components/slider/examples/basic.example components/slider hell-slider hellField hellFieldLabel valueChange volume min max step signal',
 },
 {
 title:'Slider: Disabled',
 path:'/components/slider',
 detail:'components/slider/examples/disabled.example.ts',
 terms:
'components/slider/examples/disabled.example components/slider hell-slider hellField hellFieldLabel',
 },
 {
 title:'Slider: Thumb visibility and grow',
 path:'/components/slider',
 detail:'components/slider/examples/modes.example.ts',
 terms:
'modes hover components/slider/examples/modes.example components/slider hell-slider hellField hellFieldLabel media seek bar tactile',
 },
 {
 title:'Slider: Orientation',
 path:'/components/slider',
 detail:'components/slider/examples/orientation.example.ts',
 terms:
'vertical horizontal components/slider/examples/orientation.example components/slider hell-slider fader',
 },
 {
 title:'Slider: Sizes',
 path:'/components/slider',
 detail:'components/slider/examples/sizes.example.ts',
 terms:
'components/slider/examples/sizes.example components/slider hell-slider size sm md lg aria-label',
 },
 {
 title:'Slider: Styling',
 path:'/components/slider',
 detail:'components/slider/examples/styling.example.ts',
 terms:
'ui Part Style Map data-slot root track range thumb HellSliderPart HellSliderUi components/slider/examples/styling.example components/slider hell-slider quota',
 },
 {
 title:'Slider: With field and input',
 path:'/components/slider',
 detail:'components/slider/examples/with-field-input.example.ts',
 terms:
'with-field-input threshold numeric echo components/slider/examples/with-field-input.example components/slider hell-slider hellField hellFieldLabel hellFieldDescription hellInput CPU alert composite',
 },
 {
 title:'Spinner: Styling all parts',
 path:'/components/spinner',
 detail:'components/spinner/examples/all-parts-styling.example.ts',
 terms:
'hellSpinner ui part style map root text-hell rounded-hell refinement',
 },
 {
 title:'Spinner: Basic',
 path:'/components/spinner',
 detail:'components/spinner/examples/basic.example.ts',
 terms:
'hellSpinner minimal smallest usage span indeterminate loading',
 },
 {
 title:'Spinner: Inside a button',
 path:'/components/spinner',
 detail:'components/spinner/examples/inside-a-button.example.ts',
 terms:
'hellSpinner hellButton disabled saving loading pending icon-only currentColor',
 },
 {
 title:'Spinner: Sizes',
 path:'/components/spinner',
 detail:'components/spinner/examples/sizes.example.ts',
 terms:
'hellSpinner size xs sm md lg xl font-size em custom scale',
 },
 {
 title:'Spinner: Variants',
 path:'/components/spinner',
 detail:'components/spinner/examples/variants.example.ts',
 terms:
'hellSpinner variant ring dots bars pulse animation style',
 },
 {
 title:'Spinner: With card',
 path:'/components/spinner',
 detail:'components/spinner/examples/with-card-pending-action.example.ts',
 terms:
'pending action hellSpinner hellButton hellCard hellCardHeader hellCardBody hellCardFooter HELL_CARD_DIRECTIVES confirm renewal subscription signal composite',
 },
 {
 title:'Split View: All parts styling',
 path:'/components/split-view',
 detail:'components/split-view/examples/all-parts-styling.example.ts',
 terms:
'split-view all-parts-styling hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES ui HellSplitViewUi root resizable screen pane compactHeader backButton detailHeader itemNavigation part style map tokens',
 },
 {
 title:'Split View: Basic',
 path:'/components/split-view',
 detail:'components/split-view/examples/basic.example.ts',
 terms:
'split-view hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES detailOpen detailOpenChange framed height master detail resizable compact smallest usage',
 },
 {
 title:'Split View: Item navigation',
 path:'/components/split-view',
 detail:'components/split-view/examples/item-navigation.example.ts',
 terms:
'split-view item-navigation hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES itemNavigation previousItem nextItem previousItemDisabled nextItemDisabled previousItemLabel nextItemLabel itemNavigationLabel prev next detail',
 },
 {
 title:'Split View: With table and card',
 path:'/components/split-view',
 detail:'components/split-view/examples/master-detail.example.ts',
 terms:
'split-view master-detail hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES hellTableRoot hellTableHeader hellTableBody hellTableRow hellTableHeaderCell hellTableCell hellTableRowAction HELL_TABLE_UTILITIES_DIRECTIVES hellCard hellCardHeader hellCardBody HELL_CARD_DIRECTIVES hellChip itemNavigation active tickets composite master detail',
 },
 {
 title:'Split View: Sizing',
 path:'/components/split-view',
 detail:'components/split-view/examples/sizing.example.ts',
 terms:
'split-view hell-split-view hellSplitPrimary hellSplitDetail HELL_SPLIT_VIEW_DIRECTIVES compactBelow primaryFlex detailFlex primaryMinSize detailMinSize height framed pane ratio breakpoint',
 },
 {
 title:'Switch: Styling (all parts)',
 path:'/components/switch',
 detail:'components/switch/examples/all-parts-styling.example.ts',
 terms:
'all-parts hellSwitch hellNativeSwitch ui HellSwitchUi root thumb part-style-map tailwind bg-hell-danger bg-hell-success rounded-hell-sm',
 },
 {
 title:'Switch: Basic',
 path:'/components/switch',
 detail:'components/switch/examples/basic.example.ts',
 terms:
'hellSwitch button checked checkedChange label notifications toggle immediate',
 },
 {
 title:'Switch: Native path',
 path:'/components/switch',
 detail:'components/switch/examples/native.example.ts',
 terms:
'hellNativeSwitch checkbox role=switch required checkedChange forms auto-renew',
 },
 {
 title:'Switch: With field and card',
 path:'/components/switch',
 detail:'components/switch/examples/settings-list.example.ts',
 terms:
'settings-list hellSwitch hellCard hellCardHeader hellCardBody hellField hellFieldLabel hellFieldDescription hell-icon provideIcons faSolidWifi faSolidVolumeHigh faSolidMoon composite device settings wifi sound focus-mode disabled',
 },
 {
 title:'Switch: States',
 path:'/components/switch',
 detail:'components/switch/examples/states.example.ts',
 terms:
'hellSwitch checked disabled off on disabled-on aria-label',
 },
 {
 title:'Table: Basic',
 path:'/components/table',
 detail:'components/table/examples/basic-table.example.ts',
 terms:
'components/table/examples/basic-table.example components/table hellTableContainer hellTableRoot hellTableHeader hellTableRow hellTableHeaderCell hellTableBody hellTableCell native smallest usage invoices',
 },
 {
 title:'Table: Interactive primitives',
 path:'/components/table',
 detail:'components/table/examples/primitive-table.example.ts',
 terms:
'primitive components/table/examples/primitive-table.example components/table HELL_TABLE_UTILITIES_DIRECTIVES hellTableHeaderCell sortable sort sortToggle hellTableSortTrigger hellTableRow active selected hellTableSelectionCell hellTableRowRadio hellTableRowAction hell-icon selection row action',
 },
 {
 title:'Table: Styling (all parts)',
 path:'/components/table',
 detail:'components/table/examples/styling.example.ts',
 terms:
'components/table/examples/styling.example components/table part style map ui HellTableResizeHandleUi hellTableContainer hellTableRoot hellTableHeader hellTableBody hellTableRow hellTableHeaderCell hellTableSortTrigger hellTableCell hellTableSelectionCell hellTableRowCheckbox hellTableRowAction hellTableResizeHandle grip hell-icon design tokens rounded-hell bg-hell text-hell',
 },
 {
 title:'Table: With TanStack, search, filters, and pagination',
 path:'/components/table',
 detail:'components/table/examples/tanstack-shell.example.ts',
 terms:
'shell composite components/table/examples/tanstack-shell.example components/table hell-tanstack-table HellTanStackTable HellTableStatus hellTableShellCell hellTableShellToolbar hellTableShellFooter hellTableShellLoading hellTableShellEmpty hellTableShellError hell-tanstack-pagination HellTanStackPagination hellTableRowRadio hell-omnibar hellMenu hell-split-view omnibar menu split view master detail sorting server-side manual flexRender columnDef meta hell',
 },
 {
 title:'Table: Virtual rows and expansion',
 path:'/components/table',
 detail:'components/table/examples/tanstack-virtual.example.ts',
 terms:
'tanstack components/table/examples/tanstack-virtual.example components/table @hell-ui/angular/table-tanstack/virtual hellTanStackVirtualRows virtualEstimateRowSize virtualOverscan hellTableShellExpandedRow hellTableShellCell hellTableShellToolbar hell-tanstack-table hell-omnibar hellMenu expanded',
 },
 {
 title:'Tabs: Basic',
 path:'/components/tabs',
 detail:'components/tabs/examples/basic.example.ts',
 terms:
'hellTabset hellTabList hellTab hellTabPanel HELL_TABS_DIRECTIVES account settings general security billing simplest usage',
 },
 {
 title:'Tabs: Disabled Tabs',
 path:'/components/tabs',
 detail:'components/tabs/examples/disabled.example.ts',
 terms:
'hellTab invoice draft sent paid roving focus skip',
 },
 {
 title:'Tabs: Styling (All Parts)',
 path:'/components/tabs',
 detail:'components/tabs/examples/styling.example.ts',
 terms:
'ui Part Style Map hellTabset hellTabList hellTab hellTabPanel root rounded-hell bg-hell text-hell refinement ticket queues',
 },
 {
 title:'Tabs: Vertical Orientation',
 path:'/components/tabs',
 detail:'components/tabs/examples/vertical.example.ts',
 terms:
'activateOnFocus manual activation settings profile notifications integrations arrow keys',
 },
 {
 title:'Tabs: With Card and Tag',
 path:'/components/tabs',
 detail:'components/tabs/examples/with-card.example.ts',
 terms:
'hellCard hellCardHeader hellCardBody hellChip composite server metrics processes logs status detail sections',
 },
 {
 title:'Chip: Badge',
 path:'/components/chip',
 detail:'components/chip/examples/badge.example.ts',
 terms:
'hellBadge counter notification count numeric indicator',
 },
 {
 title:'Chip: Keyboard Hint',
 path:'/components/chip',
 detail:'components/chip/examples/keyboard-hint.example.ts',
 terms:
'keyboard-hint hellKbd kbd shortcut keycap command palette',
 },
 {
 title:'Time Input: Basic',
 path:'/components/time-input',
 detail:'components/time-input/examples/basic.example.ts',
 terms:
'time-input hell-time-input hellField hellFieldLabel hellFieldDescription HellTimeInput smallest realistic usage reminder',
 },
 {
 title:'Time Input: Reactive Forms',
 path:'/components/time-input',
 detail:'components/time-input/examples/reactive-forms.example.ts',
 terms:
'time-input hell-time-input hellField FormControl ReactiveFormsModule ControlValueAccessor HellTimeValue meeting',
 },
 {
 title:'Time Input: Seconds And Validation',
 path:'/components/time-input',
 detail:'components/time-input/examples/seconds-and-validation.example.ts',
 terms:
'time-input hell-time-input hellField hellFieldError hellFieldDescription invalid disabled HellTimeInput HH:mm:ss log timestamp departure locked slot',
 },
 {
 title:'Time Input: Sizes',
 path:'/components/time-input',
 detail:'components/time-input/examples/sizes.example.ts',
 terms:
'time-input hell-time-input size sm md lg HellTimeInput control height',
 },
 {
 title:'Time Input: Styling',
 path:'/components/time-input',
 detail:'components/time-input/examples/styling.example.ts',
 terms:
'time-input hell-time-input ui HellTimeInputUi part style map root trigger triggerIcon pickerPanel pickerHeader pickerReadout pickerUnits pickerUnit pickerUnitLabel pickerUnitControl pickerUnitValue pickerUnitStep minutePresets minutePreset all-parts tailwind hell design tokens',
 },
 {
 title:'Time Input: With Field Schedule Row',
 path:'/components/time-input',
 detail:'components/time-input/examples/with-field-schedule-row.example.ts',
 terms:
'time-input hell-time-input hell-date-input hellField composite scheduling shift start end date',
 },
 {
 title:'Number Input: Basic',
 path:'/components/number-input',
 detail:'components/number-input/examples/basic.example.ts',
 terms:
'number-input hell-number-input HellNumberInput port integer min max step steppers spinbutton valueChange numeric keyboard arrow',
 },
 {
 title:'Number Input: Unit Suffix',
 path:'/components/number-input',
 detail:'components/number-input/examples/duration-seconds.example.ts',
 terms:
'number-input hell-number-input HellNumberInput suffix seconds duration unit interval ms percent rate self-describing',
 },
 {
 title:'Number Input: Sizes',
 path:'/components/number-input',
 detail:'components/number-input/examples/sizes.example.ts',
 terms:'number-input hell-number-input size sm md lg HellNumberInput control height steppers',
 },
 {
 title:'Number Input: Reactive Forms',
 path:'/components/number-input',
 detail:'components/number-input/examples/reactive-forms.example.ts',
 terms:
'number-input hell-number-input hellField FormControl ReactiveFormsModule ControlValueAccessor Validator required min max numberInputMalformed number null port',
 },
 {
 title:'Number Input: Styling',
 path:'/components/number-input',
 detail:'components/number-input/examples/styling.example.ts',
 terms:
'number-input hell-number-input ui HellNumberInputUi HellNumberInputPart root input increment decrement suffix part style map tailwind tokens percent',
 },
 {
 title:'Toast: Action',
 path:'/components/toast',
 detail:'components/toast/examples/action.example.ts',
 terms:
'hellButton HellToastService HellToastAction onClick dismiss undo label duration move to trash restore',
 },
 {
 title:'Toast: Basic',
 path:'/components/toast',
 detail:'components/toast/examples/basic.example.ts',
 terms:
'hellButton hell HellToastService svc.success duration description smallest usage notification feedback',
 },
 {
 title:'Toast: Stacking',
 path:'/components/toast',
 detail:'components/toast/examples/stacking.example.ts',
 terms:
'hellButton HellToastService burst collapse fan-out hover focus pause resume dismiss-all maxVisible duration 0 scrollable viewport deploy log',
 },
 {
 title:'Toast: Styling',
 path:'/components/toast',
 detail:'components/toast/examples/styling.example.ts',
 terms:
'hell-toaster HellToaster HellToastService HellToasterUi ui Part Style Map all parts root region viewport list glyph body title description action close toolbar dismissAll position top-center providers scoped service bg-hell-primary-soft text-hell-primary rounded-hell-xl data-slot',
 },
 {
 title:'Toast: Custom template',
 path:'/components/toast',
 detail:'components/toast/examples/template.example.ts',
 terms:
'hellButton hellToastTemplate HellToastService TemplateRef viewChild announcement duration persistent body let-ctx dismiss id context comment avatar',
 },
 {
 title:'Toast: Variants',
 path:'/components/toast',
 detail:'components/toast/examples/variants.example.ts',
 terms:
'hellButton HellToastService message success info warning error default danger variant data-variant glyph semantic color',
 },
 {
 title:'Toast: With button and progress',
 path:'/components/toast',
 detail:'components/toast/examples/with-upload-progress.example.ts',
 terms:
'with-upload-progress hellButton hellProgress hellProgressBar HellToastService hellToastTemplate TemplateRef viewChild signal id update in place async upload bar disabled success dismissible announcement composite',
 },
 {
 title:'Toggle: Basic',
 path:'/components/toggle',
 detail:'components/toggle/examples/basic.example.ts',
 terms:
'hellToggle standalone mute notify bell icon selected selectedChange aria-label press-toggle',
 },
 {
 title:'Toggle: Group Multiple',
 path:'/components/toggle',
 detail:'components/toggle/examples/group-multiple.example.ts',
 terms:
'hellToggleGroup hellToggleGroupItem type bold italic underline formatting aria-pressed',
 },
 {
 title:'Toggle: Group Single',
 path:'/components/toggle',
 detail:'components/toggle/examples/group-single.example.ts',
 terms:
'hellToggleGroup hellToggleGroupItem type align text alignment radio role aria-checked icon faSolidAlignLeft faSolidAlignCenter faSolidAlignRight',
 },
 {
 title:'Toggle: Sizes',
 path:'/components/toggle',
 detail:'components/toggle/examples/sizes.example.ts',
 terms:
'hellToggle HellSize xs sm md lg xl scale',
 },
 {
 title:'Toggle: Styling',
 path:'/components/toggle',
 detail:'components/toggle/examples/styling.example.ts',
 terms:
'all-parts ui shorthand part style map root rounded-hell bg-hell text-hell border-hell data-selected',
 },
 {
 title:'Toggle: With Tooltip',
 path:'/components/toggle',
 detail:'components/toggle/examples/with-tooltip.example.ts',
 terms:
'composite hellToggleGroup hellToggleGroupItem hellTooltip hellTooltipTrigger formatting toolbar icon-only bold italic underline aria-label',
 },
 {
 title:'Page header: List screen',
 path:'/components/page-header',
 detail:'components/page-header/examples/list.example.ts',
 terms:
'page header page-header components/page-header/examples/list.example hell-page-header hellPageHeaderTitle hellPageHeaderMeta hellPageHeaderDescription hellPageHeaderToolbar HELL_PAGE_HEADER_DIRECTIVES hell-toolbar heading title meta badge tag description toolbar list screen composite chrome',
 },
 {
 title:'Page header: Detail screen',
 path:'/components/page-header',
 detail:'components/page-header/examples/detail.example.ts',
 terms:
'page header page-header components/page-header/examples/detail.example hell-page-header hell-page-header-back HellPageHeaderBack back affordance event breadcrumbs hellBreadcrumbs hellPageHeaderLeading hellPageHeaderToolbar hell-toolbar detail screen leading title composite',
 },
 {
 title:'Page header: Styling',
 path:'/components/page-header',
 detail:'components/page-header/examples/styling.example.ts',
 terms:
'page header styling components/page-header/examples/styling.example hell-page-header ui HellPageHeaderUi HellPageHeaderPart part style map root leading titleGroup title meta description toolbar level heading tokens',
 },
 {
 title:'Toolbar: Basic',
 path:'/components/toolbar',
 detail:'components/toolbar/examples/basic.example.ts',
 terms:
'toolbar components/toolbar/examples/basic.example hell-toolbar hellToolbarAction HELL_TOOLBAR_DIRECTIVES hell-icon priority primary default overflowOnly overflow menu responsive resize actions label activated smallest usage',
 },
 {
 title:'Toolbar: Priorities',
 path:'/components/toolbar',
 detail:'components/toolbar/examples/priorities.example.ts',
 terms:
'toolbar priorities components/toolbar/examples/priorities.example hell-toolbar hellToolbarAction priority primary default overflowOnly never overflows collapse narrow container variant overflow menu more actions',
 },
 {
 title:'Toolbar: Icon-only actions and separators',
 path:'/components/toolbar',
 detail:'components/toolbar/examples/icon-only.example.ts',
 terms:
'toolbar icon-only components/toolbar/examples/icon-only.example hell-toolbar hellToolbarAction hellToolbarSeparator iconOnly aria-label title tooltip separator group divider formatting bold italic align compact square icon button overflow menu label',
 },
 {
 title:'Toolbar: Standalone above a table, with a widget',
 path:'/components/toolbar',
 detail:'components/toolbar/examples/table-toolbar.example.ts',
 terms:
'toolbar table standalone widget components/toolbar/examples/table-toolbar.example hell-toolbar hellToolbarAction hellToolbarSeparator hellToolbarWidget iconOnly search field never collapses HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTableRoot hellTableHeader hellTableBody hellTableRow hellTableCell action bar invite filter export columns overflow composite',
 },
 {
 title:'Toolbar: Styling',
 path:'/components/toolbar',
 detail:'components/toolbar/examples/styling.example.ts',
 terms:
'toolbar styling all-parts components/toolbar/examples/styling.example hell-toolbar hellToolbarAction ui HellToolbarUi HellToolbarPart part style map root action overflowTrigger overflowMenu overflowItem bg-hell-primary-soft rounded-hell tokens',
 },
 {
 title:'Tooltip: Styling',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/all-parts-styling.example.ts',
 terms:
'ui part style map root hellTooltipTrigger hellTooltip hellButton bg-hell-primary rounded-hell-lg',
 },
 {
 title:'Tooltip: Basic',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/basic.example.ts',
 terms:
'hellTooltipTrigger hellTooltip hellButton smallest usage hover',
 },
 {
 title:'Tooltip: Delay',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/delay.example.ts',
 terms:
'showDelay hideDelay hellTooltipTrigger hellTooltip hellButton timing',
 },
 {
 title:'Tooltip: Hoverable content',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/hoverable.example.ts',
 terms:
'hoverableContent hellTooltipTrigger hellTooltip hellButton hover-bridge',
 },
 {
 title:'Tooltip: Placement',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/placements.example.ts',
 terms:
'placements top right bottom left hellTooltipTrigger hellTooltip hellButton floating-ui',
 },
 {
 title:'Tooltip: With icon buttons and shortcuts',
 path:'/components/tooltip',
 detail:'components/tooltip/examples/with-toolbar.example.ts',
 terms:
'toolbar button kbd shortcut hellTooltipTrigger hellTooltip hellButton hellIcon hellKbd iconOnly composite bold italic underline',
 },
 {
 title:'Getting Started: Button Demo',
 path:'/getting-started',
 detail:'getting-started/examples/button-demo.example.ts',
 terms:
'getting-started button-demo getting-started/examples/button-demo.example hellButton',
 },
 {
 title:'Theming: Scoped Theme Demo',
 path:'/theming',
 detail:'theming/examples/scoped-theme-demo.example.ts',
 terms:
'scoped-theme-demo theming/examples/scoped-theme-demo.example hellCard hellCardHeader hellChip hellCardBody hellButton',
 },
];

const HD_DOCS_CODE_USAGES: readonly DocsSearchSeed[] = [
 {
 title:'Configure labels',
 path:'/getting-started',
 detail:'provideHell<Module>Labels, HELL_<MODULE>_LABELS',
 terms:'i18n labels localization aria-label accessibility provideHellLabels HELL_PAGINATION_LABELS HELL_SPINNER_LABELS labels',
 },
 {
 title:'Filter Bar controlled tokens',
 path:'/components/filter-bar',
 detail:'HellFilterBar, HellFilterField, HellFilterToken, valueChange',
 terms:
'filter-bar HellFilterBar HellFilterField HellFilterTextField HellFilterOptionsField HellFilterEntityField HellFilterDateRangeField HellFilterOption HellFilterEntityOption HellFilterEntityValue HellFilterDateRangeValue HellFilterTokenValue HellFilterToken HellFilterEntitySearchError HELL_FILTER_TEXT_KEY controlled serializable operator eq multiple freeTextDebounceMs entityDebounceMs debounceMs limit searchError loading empty error ui HellFilterBarPart HellFilterBarUi Label Contract',
 },
 {
 title:'Combobox slots',
 path:'/components/combobox',
 detail:'hellComboboxInput, hellComboboxOption, hellComboboxEmpty',
 terms:
'HELL_COMBOBOX_DIRECTIVES hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty',
 },
 {
 title:'Dialog scoping',
 path:'/components/dialog',
 detail:'hellDialogScope keeps overlays inside app content',
 terms:
'HELL_DIALOG_DIRECTIVES hellDialogTrigger hellDialogOverlay hellDialogScope hellDialog hellDialogTitle hellDialogDescription',
 },
 {
 title:'Field anatomy',
 path:'/components/field',
 detail:'hellFieldLabel, hellFieldDescription, hellFieldError',
 terms:
'HELL_FIELD_DIRECTIVES hellField hellFieldLabel hellFieldDescription hellFieldError form field input aria',
 },
 {
 title:'Listbox primitives',
 path:'/components/listbox',
 detail:'hellListbox, hellListboxOption, hellListboxHeader',
 terms:
'HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxSection hellListboxHeader value valueChange mode',
 },
 {
 title:'Menu and submenu triggers',
 path:'/components/menu',
 detail:'hellMenuTrigger, hellSubmenuTrigger, hellMenuItem',
 terms:
'HELL_MENU_DIRECTIVES hellMenuTrigger hellSubmenuTrigger hellMenu hellMenuItem hellMenuSection hellMenuLabel submenu',
 },
 {
 title:'Search primitives',
 path:'/components/search',
 detail:'hellSearch, hellSearchClear',
 terms:'HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear search primitive clear input',
 },
 {
 title:'Select portal pattern',
 path:'/components/select',
 detail:'hellSelectTrigger with hellSelectPortal and hellSelectDropdown',
 terms:
'HELL_SELECT_DIRECTIVES hellSelectTrigger hellSelectValue hellSelectPortal hellSelectDropdown hellSelectOption valueChange',
 },
 {
 title:'Tabs anatomy',
 path:'/components/tabs',
 detail:'hellTabset, hellTabList, hellTab, hellTabPanel',
 terms:'HELL_TABS_DIRECTIVES hellTabset hellTabList hellTab hellTabPanel value vertical',
 },
 {
 title:'App shell slots',
 path:'/components/app-shell',
 detail:'hellAppShell, hellAppTopbar, hellAppSidenav, hellAppContent',
 terms:
'HELL_APP_SHELL_DIRECTIVES hellAppShell hellAppTopbar hellAppSidenav hellAppContent hellAppSecondary hellSidenavToggle hellSecondaryToggle',
 },
 {
 title:'Date input adapter',
 path:'/components/date-input',
 detail:'provideHellDateInputAdapter, HELL_DATE_INPUT_ADAPTER',
 terms:
'date-input adapter provideHellDateInputAdapter HELL_DATE_INPUT_ADAPTER parse format locale temporal strict ISO YYYY-MM-DD ui HellDateInputUi',
 },
 {
 title:'Date input forms value',
 path:'/components/date-input',
 detail:'ControlValueAccessor, formControl, Date | null',
 terms:
'date-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms Date null native form submission validation ui HellDateInputUi',
 },
 {
 title:'Omnibar directives',
 path:'/components/omnibar',
 detail:'hell-omnibar, hellOmnibarItem, hellOmnibarAction',
 terms:
'hell-omnibar HellOmnibar HELL_OMNIBAR_DIRECTIVES hellOmnibar hellOmnibarItem hellOmnibarAction hellOmnibarGroup command palette async search ranking debounce skeleton searchSource',
 },
 {
 title:'Resizable panes',
 path:'/components/resizable',
 detail:'hellResizablePane and hellResizableHandle compose split views',
 terms:
'HELL_RESIZABLE_DIRECTIVES hellResizable hellResizablePane hellResizableHandle horizontal vertical minSize initialFlex',
 },
 {
 title:'Split view directives',
 path:'/components/split-view',
 detail:'hell-split-view, hellSplitPrimary, hellSplitDetail',
 terms:
'HELL_SPLIT_VIEW_DIRECTIVES hell-split-view hellSplitPrimary hellSplitDetail compactBelow detailOpen detailOpenChange itemNavigation previousItem nextItem responsive resizable panes',
 },
 {
 title:'Page header directives',
 path:'/components/page-header',
 detail:'hell-page-header, hell-page-header-back, hellPageHeaderTitle',
 terms:
'HELL_PAGE_HEADER_DIRECTIVES hell-page-header hell-page-header-back HellPageHeaderBack hellPageHeaderLeading hellPageHeaderTitle hellPageHeaderMeta hellPageHeaderDescription hellPageHeaderToolbar level heading role aria-level back output HELL_PAGE_HEADER_LABELS HELL_PAGE_HEADER_LABELS HellPageHeaderPart HellPageHeaderUi composite slot chrome breadcrumbs toolbar',
 },
 {
 title:'Toolbar directives',
 path:'/components/toolbar',
 detail:'hell-toolbar, hellToolbarAction, hellResolveToolbarOverflow',
 terms:
'HELL_TOOLBAR_DIRECTIVES hell-toolbar hellToolbarAction hellResolveToolbarOverflow priority primary default overflowOnly overflow menu roving tabindex APG toolbar ResizeObserver activated label disabled variant HellToolbarPart HellToolbarUi',
 },
 {
 title:'Time input adapter',
 path:'/components/time-input',
 detail:'provideHellTimeInputAdapter, HELL_TIME_INPUT_ADAPTER',
 terms:
'time-input adapter provideHellTimeInputAdapter HELL_TIME_INPUT_ADAPTER parse format locale shortcuts HellTimeValue ui HellTimeInputUi',
 },
 {
 title:'Time input forms value',
 path:'/components/time-input',
 detail:'ControlValueAccessor, formControl, HellTimeValue | null',
 terms:
'time-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms HellTimeValue null native form submission validation ui HellTimeInputUi',
 },
 {
 title:'Number input adapter',
 path:'/components/number-input',
 detail:'provideHellNumberInputAdapter, HELL_NUMBER_INPUT_ADAPTER',
 terms:
'number-input adapter provideHellNumberInputAdapter HELL_NUMBER_INPUT_ADAPTER parse format locale comma decimal exponent integer HellNumberInputAdapter ui HellNumberInputUi',
 },
 {
 title:'Number input forms value',
 path:'/components/number-input',
 detail:'ControlValueAccessor, formControl, number | null',
 terms:
'number-input forms ControlValueAccessor Validator formControl ReactiveFormsModule Angular Forms number null required min max numberInputMalformed spinbutton ui HellNumberInputUi',
 },
 {
 title:'Table directives',
 path:'/components/table',
 detail:'hellTable, hell-tanstack-table, hellTanStackVirtualRows',
 terms:
'HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTable hellTableHead hellTableBody hellTableRow hellTableHeaderCell hellTableSortTrigger hellTableCell hellTableResizeHandle HellTanStackTable hell-tanstack-table HellTableStatus hellTableShellCell hellTableShellHeader hellTableShellToolbar hellTableShellFooter hell-tanstack-pagination HellPaginationStrip hellTableShellExpandedRow hellTanStackVirtualRows TanStack Table TanStack Virtual omnibar menu split view',
 },
];

const HD_DOCS_KIND_ICON: Record<DocsSearchKind, string> = {
 page:'faSolidSignsPost',
 example:'faSolidCode',
 usage:'faSolidCode',
};

export { HD_DOCS_EXAMPLES, HD_DOCS_CODE_USAGES };

export function hdBuildDocsSearchIndex(): readonly DocsSearchItem[] {
 const pageItems = HD_DOCS_SECTIONS.flatMap((section) => {
 const sectionName = section.heading ??'Guides';
 return section.items.map((item) => {
 const path = item.path;
 return {
 id:'page:' + path,
 kind:'page' as const,
 title: item.label,
 path,
 icon: item.icon,
 section: sectionName,
 detail: sectionName +' page',
 haystack: searchHaystack(item.label, path, sectionName),
 };
 });
 });
 const exampleItems = docsSearchItemsFor('example', HD_DOCS_EXAMPLES);
 const usageItems = docsSearchItemsFor('usage', HD_DOCS_CODE_USAGES);

 return [...pageItems, ...exampleItems, ...usageItems];
}

function docsSearchItemsFor(
 kind:'example' |'usage',
 seeds: readonly DocsSearchSeed[],
): readonly DocsSearchItem[] {
 return seeds.map((item) => {
 const section = hdDocsSectionForPath(item.path) ??'Guides';
 return {
 id: kind ==='usage' ? kind +':' + item.title : kind +':' + item.detail,
 kind,
 title: item.title,
 path: item.path,
 icon: HD_DOCS_KIND_ICON[kind],
 section,
 detail: item.detail,
 haystack: searchHaystack(item.title, item.path, section, item.detail, item.terms),
 };
 });
}

function searchHaystack(...parts: readonly string[]): string {
 return parts.map(hellSearchKey).join('');
}
