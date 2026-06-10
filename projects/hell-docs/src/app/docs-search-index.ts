import { hellSearchKey } from '@hell-ui/angular/core';
import {
  HD_DOCS_SECTIONS,
  hdDocsSectionForPath,
  type DocsSearchItem,
  type DocsSearchKind,
} from './docs-catalog';

interface DocsSearchSeed {
  readonly title: string;
  readonly path: string;
  readonly detail: string;
  readonly terms: string;
}

const HD_DOCS_EXAMPLES: readonly DocsSearchSeed[] = [
  {
    title: 'Getting Started: Button Demo',
    path: '/getting-started',
    detail: 'getting-started/examples/button-demo.example.ts',
    terms: 'getting-started button-demo getting-started/examples/button-demo.example getting-started install styles hellButton',
  },
  {
    title: 'Theming: Scoped Theme Demo',
    path: '/theming',
    detail: 'theming/examples/scoped-theme-demo.example.ts',
    terms: 'theming scoped-theme-demo theming/examples/scoped-theme-demo.example theming data-hell-theme data-hell-palette tokens',
  },
  {
    title: 'Accordion: Multiple',
    path: '/components/accordion',
    detail: 'components/accordion/examples/multiple.example.ts',
    terms: 'accordion multiple components/accordion/examples/multiple.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
  },
  {
    title: 'Accordion: Single Collapsible',
    path: '/components/accordion',
    detail: 'components/accordion/examples/single-collapsible.example.ts',
    terms: 'accordion single-collapsible components/accordion/examples/single-collapsible.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
  },
  {
    title: 'Avatar: Sizes',
    path: '/components/avatar',
    detail: 'components/avatar/examples/sizes.example.ts',
    terms: 'avatar sizes components/avatar/examples/sizes.example components/avatar hell-avatar',
  },
  {
    title: 'Avatar: Square Shape',
    path: '/components/avatar',
    detail: 'components/avatar/examples/square-shape.example.ts',
    terms: 'avatar square-shape components/avatar/examples/square-shape.example components/avatar hell-avatar',
  },
  {
    title: 'Avatar: With Image',
    path: '/components/avatar',
    detail: 'components/avatar/examples/with-image.example.ts',
    terms: 'avatar with-image components/avatar/examples/with-image.example components/avatar hell-avatar',
  },
  {
    title: 'Breadcrumbs: Custom Separator',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/custom-separator.example.ts',
    terms: 'breadcrumbs custom-separator components/breadcrumbs/examples/custom-separator.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbItem',
  },
  {
    title: 'Breadcrumbs: Long Path With Ellipsis',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/long-path-with-ellipsis.example.ts',
    terms: 'breadcrumbs long-path-with-ellipsis components/breadcrumbs/examples/long-path-with-ellipsis.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbEllipsis',
  },
  {
    title: 'Breadcrumbs: Standard',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/standard.example.ts',
    terms: 'breadcrumbs standard components/breadcrumbs/examples/standard.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbLink',
  },
  {
    title: 'Breadcrumbs: With Icons',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/with-icons.example.ts',
    terms: 'breadcrumbs with-icons components/breadcrumbs/examples/with-icons.example components/breadcrumbs hellBreadcrumbs hell-icon',
  },
  {
    title: 'Button: Block',
    path: '/components/button',
    detail: 'components/button/examples/block.example.ts',
    terms: 'button block components/button/examples/block.example components/button hellButton',
  },
  {
    title: 'Button: Icon Only',
    path: '/components/button',
    detail: 'components/button/examples/icon-only.example.ts',
    terms: 'button icon-only components/button/examples/icon-only.example components/button hellButton iconOnly',
  },
  {
    title: 'Button: Sizes',
    path: '/components/button',
    detail: 'components/button/examples/sizes.example.ts',
    terms: 'button sizes components/button/examples/sizes.example components/button hellButton size',
  },
  {
    title: 'Button: Variants',
    path: '/components/button',
    detail: 'components/button/examples/variants.example.ts',
    terms: 'button variants components/button/examples/variants.example components/button hellButton variant',
  },
  {
    title: 'Button: With Icons',
    path: '/components/button',
    detail: 'components/button/examples/with-icons.example.ts',
    terms: 'button with-icons components/button/examples/with-icons.example components/button hellButton hell-icon',
  },
  {
    title: 'Card: Examples',
    path: '/components/card',
    detail: 'components/card/examples/examples.example.ts',
    terms: 'card examples components/card/examples/examples.example components/card hellCard hellCardHeader hellCardBody',
  },
  {
    title: 'Card: With Footer',
    path: '/components/card',
    detail: 'components/card/examples/with-footer.example.ts',
    terms: 'card with-footer components/card/examples/with-footer.example components/card hellCard hellCardFooter',
  },
  {
    title: 'Card: Without Header',
    path: '/components/card',
    detail: 'components/card/examples/without-header.example.ts',
    terms: 'card without-header components/card/examples/without-header.example components/card hellCard',
  },
  {
    title: 'Checkbox: Examples',
    path: '/components/checkbox',
    detail: 'components/checkbox/examples/examples.example.ts',
    terms: 'checkbox examples components/checkbox/examples/examples.example components/checkbox hellCheckbox',
  },
  {
    title: 'Checkbox: Native',
    path: '/components/checkbox',
    detail: 'components/checkbox/examples/native.example.ts',
    terms: 'checkbox native components/checkbox/examples/native.example components/checkbox hellNativeCheckbox',
  },
  {
    title: 'Combobox: Basic',
    path: '/components/combobox',
    detail: 'components/combobox/examples/basic.example.ts',
    terms: 'combobox basic components/combobox/examples/basic.example components/combobox hellCombobox hellComboboxInput hellComboboxOption',
  },
  {
    title: 'Combobox: Multiple',
    path: '/components/combobox',
    detail: 'components/combobox/examples/multiple.example.ts',
    terms: 'combobox multiple components/combobox/examples/multiple.example components/combobox hellCombobox multiple',
  },
  {
    title: 'Combobox: Preset',
    path: '/components/combobox',
    detail: 'components/combobox/examples/basic-preset.example.ts',
    terms: 'combobox preset components/combobox/examples/basic-preset.example components/combobox hell-combobox-basic',
  },
  {
    title: 'Date Picker: Bounded',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/bounded.example.ts',
    terms: 'date-picker bounded components/date-picker/examples/bounded.example components/date-picker hell-date-picker min max',
  },
  {
    title: 'Date Picker: Disabled',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/disabled.example.ts',
    terms: 'date-picker disabled components/date-picker/examples/disabled.example components/date-picker hell-date-picker disabled',
  },
  {
    title: 'Date Picker: Range',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/range.example.ts',
    terms: 'date-picker range components/date-picker/examples/range.example components/date-picker hell-date-picker range',
  },
  {
    title: 'Date Picker: Single Date',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/single-date.example.ts',
    terms: 'date-picker single-date components/date-picker/examples/single-date.example components/date-picker hell-date-picker',
  },
  {
    title: 'Dialog: Example',
    path: '/components/dialog',
    detail: 'components/dialog/examples/example.example.ts',
    terms: 'dialog example components/dialog/examples/example.example components/dialog hellDialog hellDialogTrigger hellDialogTitle',
  },
  {
    title: 'Dialog: Scoped To App Shell Content',
    path: '/components/dialog',
    detail: 'components/dialog/examples/scoped-to-app-shell-content.example.ts',
    terms: 'dialog scoped-to-app-shell-content components/dialog/examples/scoped-to-app-shell-content.example components/dialog hellDialogScope hellAppContent',
  },
  {
    title: 'Dialog: Unstyled',
    path: '/components/dialog',
    detail: 'components/dialog/examples/unstyled.example.ts',
    terms: 'dialog unstyled components/dialog/examples/unstyled.example components/dialog hellDialog unstyled focus trap',
  },
  {
    title: 'Field: Horizontal',
    path: '/components/field',
    detail: 'components/field/examples/horizontal.example.ts',
    terms: 'field horizontal components/field/examples/horizontal.example components/field hellField hellFieldLabel hellFieldDescription',
  },
  {
    title: 'Field: Vertical Default',
    path: '/components/field',
    detail: 'components/field/examples/vertical-default.example.ts',
    terms: 'field vertical-default components/field/examples/vertical-default.example components/field hellField hellFieldLabel hellFieldError',
  },
  {
    title: 'Flyout: Example Boundary Keeps Siblings Interactive',
    path: '/components/flyout',
    detail: 'components/flyout/examples/example-boundary-keeps-siblings-interactive.example.ts',
    terms: 'flyout example-boundary-keeps-siblings-interactive components/flyout/examples/example-boundary-keeps-siblings-interactive.example components/flyout hellFlyout hellFlyoutTrigger boundary',
  },
  {
    title: 'Icon: Example',
    path: '/components/icon',
    detail: 'components/icon/examples/example.example.ts',
    terms: 'icon example components/icon/examples/example.example components/icon hell-icon',
  },
  {
    title: 'Icon: Registering Icons',
    path: '/components/icon',
    detail: 'components/icon/examples/registering-icons.example.ts',
    terms: 'icon registering-icons components/icon/examples/registering-icons.example components/icon provideIcons hell-icon',
  },
  {
    title: 'Icon: Sizes',
    path: '/components/icon',
    detail: 'components/icon/examples/sizes.example.ts',
    terms: 'icon sizes components/icon/examples/sizes.example components/icon hell-icon size',
  },
  {
    title: 'Input: Select',
    path: '/components/input',
    detail: 'components/input/examples/select.example.ts',
    terms: 'input select components/input/examples/select.example components/input hellInput hellNativeSelect',
  },
  {
    title: 'Input: Sizes',
    path: '/components/input',
    detail: 'components/input/examples/sizes.example.ts',
    terms: 'input sizes components/input/examples/sizes.example components/input hellInput size',
  },
  {
    title: 'Input: States',
    path: '/components/input',
    detail: 'components/input/examples/states.example.ts',
    terms: 'input states components/input/examples/states.example components/input hellInput disabled invalid',
  },
  {
    title: 'Input: Textarea',
    path: '/components/input',
    detail: 'components/input/examples/textarea.example.ts',
    terms: 'input textarea components/input/examples/textarea.example components/input hellTextarea',
  },
  {
    title: 'Listbox: Basic',
    path: '/components/listbox',
    detail: 'components/listbox/examples/basic.example.ts',
    terms: 'listbox basic components/listbox/examples/basic.example components/listbox HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxHeader valueChange option',
  },
  {
    title: 'Menu: Basic',
    path: '/components/menu',
    detail: 'components/menu/examples/basic.example.ts',
    terms: 'menu basic components/menu/examples/basic.example components/menu hellMenu hellMenuTrigger hellMenuItem',
  },
  {
    title: 'Menu: With Icons Sections Submenus',
    path: '/components/menu',
    detail: 'components/menu/examples/with-icons-sections-submenus.example.ts',
    terms: 'menu with-icons-sections-submenus components/menu/examples/with-icons-sections-submenus.example components/menu hellMenu hellSubmenuTrigger hellMenuSection',
  },
  {
    title: 'Pagination: Basic',
    path: '/components/pagination',
    detail: 'components/pagination/examples/basic.example.ts',
    terms: 'pagination basic components/pagination/examples/basic.example components/pagination hell-pagination',
  },
  {
    title: 'Pagination: Larger Window',
    path: '/components/pagination',
    detail: 'components/pagination/examples/larger-window.example.ts',
    terms: 'pagination larger-window components/pagination/examples/larger-window.example components/pagination hell-pagination',
  },
  {
    title: 'Popover: Example',
    path: '/components/popover',
    detail: 'components/popover/examples/example.example.ts',
    terms: 'popover example components/popover/examples/example.example components/popover hellPopover hellPopoverTrigger',
  },
  {
    title: 'Progress: Examples',
    path: '/components/progress',
    detail: 'components/progress/examples/examples.example.ts',
    terms: 'progress examples components/progress/examples/examples.example components/progress hellProgress hellProgressBar',
  },
  {
    title: 'Progress: Interactive',
    path: '/components/progress',
    detail: 'components/progress/examples/interactive.example.ts',
    terms: 'progress interactive components/progress/examples/interactive.example components/progress hellProgress value',
  },
  {
    title: 'Radio: Example',
    path: '/components/radio',
    detail: 'components/radio/examples/example.example.ts',
    terms: 'radio example components/radio/examples/example.example components/radio hellRadioGroup hellRadio',
  },
  {
    title: 'Radio: Horizontal',
    path: '/components/radio',
    detail: 'components/radio/examples/horizontal.example.ts',
    terms: 'radio horizontal components/radio/examples/horizontal.example components/radio hellRadioGroup hellRadio',
  },
  {
    title: 'Radio: Native',
    path: '/components/radio',
    detail: 'components/radio/examples/native.example.ts',
    terms: 'radio native components/radio/examples/native.example components/radio hellNativeRadio hellNativeRadioGroup',
  },
  {
    title: 'Search: Basic',
    path: '/components/search',
    detail: 'components/search/examples/basic.example.ts',
    terms: 'search basic components/search/examples/basic.example components/search HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear clear input local filtering',
  },
  {
    title: 'Select: Basic',
    path: '/components/select',
    detail: 'components/select/examples/basic.example.ts',
    terms: 'select basic components/select/examples/basic.example components/select hellSelect hellSelectOption hellSelectDropdown',
  },
  {
    title: 'Select: Preset',
    path: '/components/select',
    detail: 'components/select/examples/basic-preset.example.ts',
    terms: 'select preset components/select/examples/basic-preset.example components/select hell-select-basic',
  },
  {
    title: 'Separator: Flush Inside A Card',
    path: '/components/separator',
    detail: 'components/separator/examples/flush-inside-a-card.example.ts',
    terms: 'separator flush-inside-a-card components/separator/examples/flush-inside-a-card.example components/separator hellSeparator',
  },
  {
    title: 'Separator: Horizontal',
    path: '/components/separator',
    detail: 'components/separator/examples/horizontal.example.ts',
    terms: 'separator horizontal components/separator/examples/horizontal.example components/separator hellSeparator horizontal',
  },
  {
    title: 'Separator: Spacing Options',
    path: '/components/separator',
    detail: 'components/separator/examples/spacing-options.example.ts',
    terms: 'separator spacing-options components/separator/examples/spacing-options.example components/separator hellSeparator spacing',
  },
  {
    title: 'Separator: Vertical',
    path: '/components/separator',
    detail: 'components/separator/examples/vertical.example.ts',
    terms: 'separator vertical components/separator/examples/vertical.example components/separator hellSeparator vertical',
  },
  {
    title: 'Skeleton: Avatar Lines',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/avatar-lines.example.ts',
    terms: 'skeleton avatar-lines components/skeleton/examples/avatar-lines.example components/skeleton hellSkeleton loading',
  },
  {
    title: 'Skeleton: Card Placeholder',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/card-placeholder.example.ts',
    terms: 'skeleton card-placeholder components/skeleton/examples/card-placeholder.example components/skeleton hellSkeleton card',
  },
  {
    title: 'Skeleton: Shapes',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/shapes.example.ts',
    terms: 'skeleton shapes components/skeleton/examples/shapes.example components/skeleton hellSkeleton circle rect',
  },
  {
    title: 'Skeleton: Text Lines',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/text-lines.example.ts',
    terms: 'skeleton text-lines components/skeleton/examples/text-lines.example components/skeleton hellSkeleton text',
  },
  {
    title: 'Spinner: Colour',
    path: '/components/spinner',
    detail: 'components/spinner/examples/colour.example.ts',
    terms: 'spinner colour components/spinner/examples/colour.example components/spinner hellSpinner color',
  },
  {
    title: 'Spinner: Inside A Button',
    path: '/components/spinner',
    detail: 'components/spinner/examples/inside-a-button.example.ts',
    terms: 'spinner inside-a-button components/spinner/examples/inside-a-button.example components/spinner hellSpinner hellButton',
  },
  {
    title: 'Spinner: Sizes',
    path: '/components/spinner',
    detail: 'components/spinner/examples/sizes.example.ts',
    terms: 'spinner sizes components/spinner/examples/sizes.example components/spinner hellSpinner size',
  },
  {
    title: 'Spinner: Variants',
    path: '/components/spinner',
    detail: 'components/spinner/examples/variants.example.ts',
    terms: 'spinner variants components/spinner/examples/variants.example components/spinner hellSpinner variant',
  },
  {
    title: 'Slider: Basic',
    path: '/components/slider',
    detail: 'components/slider/examples/basic.example.ts',
    terms: 'slider basic components/slider/examples/basic.example components/slider hell-slider',
  },
  {
    title: 'Slider: Disabled',
    path: '/components/slider',
    detail: 'components/slider/examples/disabled.example.ts',
    terms: 'slider disabled components/slider/examples/disabled.example components/slider hell-slider disabled',
  },
  {
    title: 'Slider: Hover Revealed Thumb',
    path: '/components/slider',
    detail: 'components/slider/examples/hover-revealed-thumb.example.ts',
    terms: 'slider hover-revealed-thumb components/slider/examples/hover-revealed-thumb.example components/slider hell-slider thumb',
  },
  {
    title: 'Slider: Sizes',
    path: '/components/slider',
    detail: 'components/slider/examples/sizes.example.ts',
    terms: 'slider sizes components/slider/examples/sizes.example components/slider hell-slider size',
  },
  {
    title: 'Slider: Vertical',
    path: '/components/slider',
    detail: 'components/slider/examples/vertical.example.ts',
    terms: 'slider vertical components/slider/examples/vertical.example components/slider hell-slider vertical',
  },
  {
    title: 'Switch: Examples',
    path: '/components/switch',
    detail: 'components/switch/examples/examples.example.ts',
    terms: 'switch examples components/switch/examples/examples.example components/switch hellSwitch',
  },
  {
    title: 'Switch: Native',
    path: '/components/switch',
    detail: 'components/switch/examples/native.example.ts',
    terms: 'switch native components/switch/examples/native.example components/switch hellNativeSwitch',
  },
  {
    title: 'Tabs: Example',
    path: '/components/tabs',
    detail: 'components/tabs/examples/example.example.ts',
    terms: 'tabs example components/tabs/examples/example.example components/tabs hellTabset hellTab hellTabPanel',
  },
  {
    title: 'Tabs: Vertical',
    path: '/components/tabs',
    detail: 'components/tabs/examples/vertical.example.ts',
    terms: 'tabs vertical components/tabs/examples/vertical.example components/tabs hellTabset vertical',
  },
  {
    title: 'Tag: Badge',
    path: '/components/tag',
    detail: 'components/tag/examples/badge.example.ts',
    terms: 'tag badge components/tag/examples/badge.example components/tag hellTag hellBadge',
  },
  {
    title: 'Tag: Keyboard Hint',
    path: '/components/tag',
    detail: 'components/tag/examples/keyboard-hint.example.ts',
    terms: 'tag keyboard-hint components/tag/examples/keyboard-hint.example components/tag hellKbd keyboard',
  },
  {
    title: 'Tag: Tag Variants',
    path: '/components/tag',
    detail: 'components/tag/examples/tag-variants.example.ts',
    terms: 'tag tag-variants components/tag/examples/tag-variants.example components/tag hellTag variant',
  },
  {
    title: 'Toggle: Disabled',
    path: '/components/toggle',
    detail: 'components/toggle/examples/disabled.example.ts',
    terms: 'toggle disabled components/toggle/examples/disabled.example components/toggle hellToggle disabled',
  },
  {
    title: 'Toggle: Single Toggle',
    path: '/components/toggle',
    detail: 'components/toggle/examples/single-toggle.example.ts',
    terms: 'toggle single-toggle components/toggle/examples/single-toggle.example components/toggle hellToggle',
  },
  {
    title: 'Toggle: Toggle Group Multiple',
    path: '/components/toggle',
    detail: 'components/toggle/examples/toggle-group-multiple.example.ts',
    terms: 'toggle toggle-group-multiple components/toggle/examples/toggle-group-multiple.example components/toggle hellToggleGroup multiple',
  },
  {
    title: 'Toggle: Toggle Group Single',
    path: '/components/toggle',
    detail: 'components/toggle/examples/toggle-group-single.example.ts',
    terms: 'toggle toggle-group-single components/toggle/examples/toggle-group-single.example components/toggle hellToggleGroup single',
  },
  {
    title: 'Tooltip: Example',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/example.example.ts',
    terms: 'tooltip example components/tooltip/examples/example.example components/tooltip hellTooltip hellTooltipTrigger',
  },
  {
    title: 'Tooltip: With Delay',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/with-delay.example.ts',
    terms: 'tooltip with-delay components/tooltip/examples/with-delay.example components/tooltip hellTooltip delay',
  },
  {
    title: 'Tooltip: Hoverable',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/hoverable.example.ts',
    terms: 'tooltip hoverable components/tooltip/examples/hoverable.example components/tooltip hellTooltip hoverableContent',
  },
  {
    title: 'App Shell: Live Miniature',
    path: '/components/app-shell',
    detail: 'components/app-shell/examples/live-miniature.example.ts',
    terms: 'app-shell live-miniature components/app-shell/examples/live-miniature.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
  },
  {
    title: 'App Shell: Markup Skeleton',
    path: '/components/app-shell',
    detail: 'components/app-shell/examples/markup-skeleton.example.ts',
    terms: 'app-shell markup-skeleton components/app-shell/examples/markup-skeleton.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
  },
  {
    title: 'Audio Player: Speech Transcript',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/speech-transcript.example.ts',
    terms: 'audio-player speech-transcript components/audio-player/examples/speech-transcript.example components/audio-player hell-audio-player allowSpeechTranscript provideHellAudioTranscript features/audio-transcript SpeechRecognition captureStream experimental best-effort timed-text accessibility',
  },
  {
    title: 'Audio Player: Untitled Controls Only',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/untitled-controls-only.example.ts',
    terms: 'audio-player untitled-controls-only components/audio-player/examples/untitled-controls-only.example components/audio-player hell-audio-player',
  },
  {
    title: 'Audio Player: With Title And Date',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/with-title-and-date.example.ts',
    terms: 'audio-player with-title-and-date components/audio-player/examples/with-title-and-date.example components/audio-player hell-audio-player',
  },
  {
    title: 'Avatar Group: Basic',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/basic.example.ts',
    terms: 'avatar-group basic components/avatar-group/examples/basic.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
  },
  {
    title: 'Avatar Group: Interaction Hooks',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/interaction-hooks.example.ts',
    terms: 'avatar-group interaction-hooks components/avatar-group/examples/interaction-hooks.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
  },
  {
    title: 'Avatar Group: Overflow Menu',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/overflow-menu.example.ts',
    terms: 'avatar-group overflow-menu components/avatar-group/examples/overflow-menu.example components/avatar-group hellAvatarGroup hellAvatarGroupOverflow',
  },
  {
    title: 'Date Input: Placeholders And Labels',
    path: '/components/date-input',
    detail: 'components/date-input/examples/placeholders-and-labels.example.ts',
    terms: 'date-input placeholders-and-labels components/date-input/examples/placeholders-and-labels.example components/date-input hell-date-input',
  },
  {
    title: 'Date Input: Reactive Forms',
    path: '/components/date-input',
    detail: 'components/date-input/examples/reactive-forms.example.ts',
    terms: 'date-input reactive-forms components/date-input/examples/reactive-forms.example components/date-input hell-date-input formControl ReactiveFormsModule ControlValueAccessor Date null Angular Forms',
  },
  {
    title: 'Date Input: Sizes',
    path: '/components/date-input',
    detail: 'components/date-input/examples/sizes.example.ts',
    terms: 'date-input sizes components/date-input/examples/sizes.example components/date-input hell-date-input size',
  },
  {
    title: 'Date Input: Text Input Calendar Popover',
    path: '/components/date-input',
    detail: 'components/date-input/examples/text-input-calendar-popover.example.ts',
    terms: 'date-input text-input-calendar-popover components/date-input/examples/text-input-calendar-popover.example components/date-input hell-date-input popover',
  },
  {
    title: 'Dialpad: Example',
    path: '/components/dialpad',
    detail: 'components/dialpad/examples/example.example.ts',
    terms: 'dialpad example components/dialpad/examples/example.example components/dialpad hell-dialpad',
  },
  {
    title: 'Drop Zone: Disabled',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/disabled.example.ts',
    terms: 'drop-zone disabled components/drop-zone/examples/disabled.example components/drop-zone hellDropzone disabled',
  },
  {
    title: 'Drop Zone: Example',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/example.example.ts',
    terms: 'drop-zone example components/drop-zone/examples/example.example components/drop-zone hellDropzone upload file',
  },
  {
    title: 'Drop Zone: Native Input Seam',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/native-input.example.ts',
    terms: 'drop-zone nativeInput components/drop-zone/examples/native-input.example.ts components/drop-zone hellDropzone HTMLInputElement',
  },
  {
    title: 'Drop Zone: Single File Images Only',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/single-file-images-only.example.ts',
    terms: 'drop-zone single-file-images-only components/drop-zone/examples/single-file-images-only.example components/drop-zone hellDropzone image accept',
  },
  {
    title: 'Omnibar: Async Search',
    path: '/components/omnibar',
    detail: 'components/omnibar/examples/async-search.example.ts',
    terms: 'omnibar async-search components/omnibar/examples/async-search.example components/omnibar hell-omnibar HELL_OMNIBAR_DIRECTIVES command palette backend async search searchSource searchFields ranking debounce starter hotkey adapter search scope',
  },
  {
    title: 'Resizable: Grip Handle 5',
    path: '/components/resizable',
    detail: 'components/resizable/examples/grip-handle-5.example.ts',
    terms: 'resizable grip-handle-5 components/resizable/examples/grip-handle-5.example components/resizable hellResizable hellResizablePane hellResizableHandle',
  },
  {
    title: 'Resizable: Grip Handle',
    path: '/components/resizable',
    detail: 'components/resizable/examples/grip-handle.example.ts',
    terms: 'resizable grip-handle components/resizable/examples/grip-handle.example components/resizable hellResizable hellResizableHandle',
  },
  {
    title: 'Resizable: Horizontal Split',
    path: '/components/resizable',
    detail: 'components/resizable/examples/horizontal-split.example.ts',
    terms: 'resizable horizontal-split components/resizable/examples/horizontal-split.example components/resizable hellResizable horizontal',
  },
  {
    title: 'Resizable: Three Panes',
    path: '/components/resizable',
    detail: 'components/resizable/examples/three-panes.example.ts',
    terms: 'resizable three-panes components/resizable/examples/three-panes.example components/resizable hellResizable panes',
  },
  {
    title: 'Resizable: Vertical Split',
    path: '/components/resizable',
    detail: 'components/resizable/examples/vertical-split.example.ts',
    terms: 'resizable vertical-split components/resizable/examples/vertical-split.example components/resizable hellResizable vertical',
  },
  {
    title: 'Split View: Master Detail',
    path: '/components/split-view',
    detail: 'components/split-view/examples/master-detail.example.ts',
    terms: 'split-view master-detail components/split-view/examples/master-detail.example components/split-view hell-split-view HELL_SPLIT_VIEW_DIRECTIVES hellSplitPrimary hellSplitDetail responsive compact back detailOpen resizable',
  },
  {
    title: 'Time Input: Examples',
    path: '/components/time-input',
    detail: 'components/time-input/examples/examples.example.ts',
    terms: 'time-input examples components/time-input/examples/examples.example components/time-input hell-time-input',
  },
  {
    title: 'Time Input: Reactive Forms',
    path: '/components/time-input',
    detail: 'components/time-input/examples/reactive-forms.example.ts',
    terms: 'time-input reactive-forms components/time-input/examples/reactive-forms.example components/time-input hell-time-input formControl ReactiveFormsModule ControlValueAccessor HellTimeValue null Angular Forms',
  },
  {
    title: 'Time Input: Placeholder And Labels',
    path: '/components/time-input',
    detail: 'components/time-input/examples/placeholder-and-labels.example.ts',
    terms: 'time-input placeholder-and-labels components/time-input/examples/placeholder-and-labels.example components/time-input hell-time-input placeholder label',
  },
  {
    title: 'Time Input: Sizes',
    path: '/components/time-input',
    detail: 'components/time-input/examples/sizes.example.ts',
    terms: 'time-input sizes components/time-input/examples/sizes.example components/time-input hell-time-input size',
  },
  {
    title: 'Toast: Action',
    path: '/components/toast',
    detail: 'components/toast/examples/action.example.ts',
    terms: 'toast action components/toast/examples/action.example components/toast hell-toaster toast action',
  },
  {
    title: 'Toast: Persistent Custom Content',
    path: '/components/toast',
    detail: 'components/toast/examples/persistent-custom-content.example.ts',
    terms: 'toast persistent-custom-content components/toast/examples/persistent-custom-content.example components/toast hell-toaster persistent',
  },
  {
    title: 'Toast: Stacking',
    path: '/components/toast',
    detail: 'components/toast/examples/stacking.example.ts',
    terms: 'toast stacking components/toast/examples/stacking.example components/toast hell-toaster stacking',
  },
  {
    title: 'Toast: Variants',
    path: '/components/toast',
    detail: 'components/toast/examples/variants.example.ts',
    terms: 'toast variants components/toast/examples/variants.example components/toast hell-toaster variant',
  },
  {
    title: 'Code Editor: Code Viewer Demo',
    path: '/components/code-editor',
    detail: 'components/code-editor/examples/code-viewer-demo.example.ts',
    terms: 'code-editor code-viewer-demo components/code-editor/examples/code-viewer-demo.example components/code-editor hell-code-editor readOnly CodeMirror',
  },
  {
    title: 'Code Editor: Editor Demo',
    path: '/components/code-editor',
    detail: 'components/code-editor/examples/editor-demo.example.ts',
    terms: 'code-editor editor-demo components/code-editor/examples/editor-demo.example components/code-editor hell-code-editor CodeMirror',
  },
  {
    title: 'Data Table: Simple Array Renderer',
    path: '/components/data-table',
    detail: 'components/data-table/examples/simple-renderer.example.ts',
    terms: 'data-table simple-renderer components/data-table/examples/simple-renderer.example components/data-table hell-data-table HellDataTable HellColumnDef hellColumns textColumn array rows native table minimal no projected templates',
  },
  {
    title: 'Data Table: Selectable Rows',
    path: '/components/data-table',
    detail: 'components/data-table/examples/selection.example.ts',
    terms: 'data-table selection selectable rows components/data-table/examples/selection.example components/data-table hell-data-table selectionColumn rowSelection checkbox bulk actions selected checked',
  },
  {
    title: 'Data Table: Custom Renderers',
    path: '/components/data-table',
    detail: 'components/data-table/examples/custom-renderers.example.ts',
    terms: 'data-table custom-renderers components/data-table/examples/custom-renderers.example components/data-table hell-data-table HELL_DATA_TABLE_DIRECTIVES hellCell hellHeaderCell hellRowActions toolbar slots actionColumn custom templates',
  },
  {
    title: 'Data Table: Column Visibility',
    path: '/components/data-table',
    detail: 'components/data-table/examples/column-visibility.example.ts',
    terms: 'data-table column-visibility components/data-table/examples/column-visibility.example components/data-table hell-column-visibility-panel columnVisibility visibility always user-toggleable initially-hidden external persistence localStorage',
  },
  {
    title: 'Data Table: TanStack Table Adapter',
    path: '/components/data-table',
    detail: 'components/data-table/examples/tanstack-table.example.ts',
    terms: 'data-table tanstack-table adapter components/data-table/examples/tanstack-table.example components/data-table table-tanstack hellTanStackTableModel HELL_TANSTACK_TABLE_DIRECTIVES createAngularTable sorting rowSelection columnVisibility flexRender',
  },
  {
    title: 'Data Table: TanStack Virtual Dynamic Rows',
    path: '/components/data-table',
    detail: 'components/data-table/examples/virtual.example.ts',
    terms: 'data-table tanstack-virtual dynamic rows components/data-table/examples/virtual.example components/data-table table-virtual injectHellTanStackVirtualRows hellTableMeasureRow row parts editor dynamic height measureElement virtualizer',
  },
  {
    title: 'Data Table: CDK Skin',
    path: '/components/data-table',
    detail: 'components/data-table/examples/cdk-skin.example.ts',
    terms: 'data-table cdk-skin components/data-table/examples/cdk-skin.example components/data-table table-cdk HELL_CDK_TABLE_DIRECTIVES hellCdkDisplayedColumns cdk-table cdk-header-cell cdk-cell cdk-row columnVisibility displayedColumns fixed-size virtual scroll TanStack Virtual',
  },
  {
    title: 'Data Table: Explicit Grid Mode',
    path: '/components/data-table',
    detail: 'components/data-table/examples/grid-mode.example.ts',
    terms: 'data-table grid mode explicit components/data-table/examples/grid-mode.example components/data-table hellTable semantics grid interactionMode cell-navigation aria-activedescendant rowcount colcount one tab stop',
  },
  {
    title: 'Table Utilities: Master Detail Example',
    path: '/components/data-table',
    detail: 'components/data-table/examples/example.example.ts',
    terms: 'table utilities data-table master detail split editor components/data-table/examples/example.example components/data-table hellTable hellTableRow hellTableRowAction hellTableSortTrigger hellOmnibar activeRowKey rowSelection columnVisibility bulk selection',
  },
  {
    title: 'Pdf Viewer: Lazy Loading',
    path: '/components/pdf-viewer',
    detail: 'components/pdf-viewer/examples/lazy-loading.example.ts',
    terms: 'pdf-viewer lazy-loading components/pdf-viewer/examples/lazy-loading.example components/pdf-viewer hell-pdf-viewer pdfjs lazy loadComponent dynamic import feature route stylesheet experimental beta app-surface recipe',
  },
  {
    title: 'Pdf Viewer: Live Demo',
    path: '/components/pdf-viewer',
    detail: 'components/pdf-viewer/examples/live-demo.example.ts',
    terms: 'pdf-viewer live-demo components/pdf-viewer/examples/live-demo.example components/pdf-viewer hell-pdf-viewer pdfjs experimental beta app-surface recipe',
  },
];

const HD_DOCS_CODE_USAGES: readonly DocsSearchSeed[] = [
  {
    title: 'Configure labels',
    path: '/getting-started',
    detail: 'provideHellLabels, HELL_LABELS, HELL_DEFAULT_LABELS',
    terms: 'i18n labels localization aria-label accessibility provideHellLabels HELL_LABELS',
  },
  {
    title: 'Combobox slots',
    path: '/components/combobox',
    detail: 'hellComboboxInput, hellComboboxOption, hellComboboxEmpty',
    terms: 'HELL_COMBOBOX_DIRECTIVES hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty',
  },
  {
    title: 'Dialog scoping',
    path: '/components/dialog',
    detail: 'hellDialogScope keeps overlays inside app content',
    terms: 'HELL_DIALOG_DIRECTIVES hellDialogTrigger hellDialogOverlay hellDialogScope hellDialog hellDialogTitle hellDialogDescription',
  },
  {
    title: 'Field anatomy',
    path: '/components/field',
    detail: 'hellFieldLabel, hellFieldDescription, hellFieldError',
    terms: 'HELL_FIELD_DIRECTIVES hellField hellFieldLabel hellFieldDescription hellFieldError form field input aria',
  },
  {
    title: 'Listbox primitives',
    path: '/components/listbox',
    detail: 'hellListbox, hellListboxOption, hellListboxHeader',
    terms: 'HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxSection hellListboxHeader value valueChange mode',
  },
  {
    title: 'Menu and submenu triggers',
    path: '/components/menu',
    detail: 'hellMenuTrigger, hellSubmenuTrigger, hellMenuItem',
    terms: 'HELL_MENU_DIRECTIVES hellMenuTrigger hellSubmenuTrigger hellMenu hellMenuItem hellMenuSection hellMenuLabel submenu',
  },
  {
    title: 'Search primitives',
    path: '/components/search',
    detail: 'hellSearch, hellSearchClear',
    terms: 'HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear search primitive clear input',
  },
  {
    title: 'Select portal pattern',
    path: '/components/select',
    detail: 'hellSelect with hellSelectPortal and hellSelectDropdown',
    terms: 'HELL_SELECT_DIRECTIVES hellSelect hellSelectValue hellSelectPortal hellSelectDropdown hellSelectOption valueChange',
  },
  {
    title: 'Tabs anatomy',
    path: '/components/tabs',
    detail: 'hellTabset, hellTabList, hellTab, hellTabPanel',
    terms: 'HELL_TABS_DIRECTIVES hellTabset hellTabList hellTab hellTabPanel value vertical',
  },
  {
    title: 'App shell slots',
    path: '/components/app-shell',
    detail: 'hellAppShell, hellAppTopbar, hellAppSidenav, hellAppContent',
    terms: 'HELL_APP_SHELL_DIRECTIVES hellAppShell hellAppTopbar hellAppSidenav hellAppContent hellAppSecondary hellSidenavToggle hellSecondaryToggle',
  },
  {
    title: 'Date input adapter',
    path: '/components/date-input',
    detail: 'provideHellDateInputAdapter, HELL_DATE_INPUT_ADAPTER',
    terms: 'date-input adapter provideHellDateInputAdapter HELL_DATE_INPUT_ADAPTER parse format locale temporal strict ISO YYYY-MM-DD',
  },
  {
    title: 'Date input forms value',
    path: '/components/date-input',
    detail: 'ControlValueAccessor, formControl, Date | null',
    terms: 'date-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms Date null native form submission validation',
  },
  {
    title: 'Omnibar directives',
    path: '/components/omnibar',
    detail: 'hell-omnibar, hellOmnibarItem, hellOmnibarAction',
    terms: 'hell-omnibar HellOmnibar HELL_OMNIBAR_DIRECTIVES hellOmnibar hellOmnibarItem hellOmnibarAction hellOmnibarGroup command palette async search ranking debounce skeleton searchSource',
  },
  {
    title: 'Resizable panes',
    path: '/components/resizable',
    detail: 'hellResizablePane and hellResizableHandle compose split views',
    terms: 'HELL_RESIZABLE_DIRECTIVES hellResizable hellResizablePane hellResizableHandle horizontal vertical minSize initialFlex',
  },
  {
    title: 'Split view directives',
    path: '/components/split-view',
    detail: 'hell-split-view, hellSplitPrimary, hellSplitDetail',
    terms: 'HELL_SPLIT_VIEW_DIRECTIVES hell-split-view hellSplitPrimary hellSplitDetail compactBelow detailOpen detailOpenChange responsive resizable panes',
  },
  {
    title: 'Time input adapter',
    path: '/components/time-input',
    detail: 'provideHellTimeInputAdapter, HELL_TIME_INPUT_ADAPTER',
    terms: 'time-input adapter provideHellTimeInputAdapter HELL_TIME_INPUT_ADAPTER parse format locale shortcuts HellTimeValue',
  },
  {
    title: 'Time input forms value',
    path: '/components/time-input',
    detail: 'ControlValueAccessor, formControl, HellTimeValue | null',
    terms: 'time-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms HellTimeValue null native form submission validation',
  },
  {
    title: 'Table utility directives',
    path: '/components/data-table',
    detail: 'hellTable, hellTableRow, hellTableHeaderCell, hellTableSortTrigger, hellTableResizeHandle',
    terms: 'HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTable hellTableHead hellTableBody hellTableRow hellTableHeaderCell hellTableSortTrigger hellTableCell hellTableResizeHandle resizeAdapter activeRowKey rowSelection columnVisibility grid semantics TanStack Table TanStack Virtual CDK',
  },
];

const HD_DOCS_KIND_ICON: Record<DocsSearchKind, string> = {
  page: 'faSolidBookOpen',
  example: 'faSolidFileLines',
  usage: 'faSolidCode',
};

export { HD_DOCS_EXAMPLES, HD_DOCS_CODE_USAGES };

export function hdBuildDocsSearchIndex(): readonly DocsSearchItem[] {
  const pageItems = HD_DOCS_SECTIONS.flatMap((section) => {
    const sectionName = section.heading ?? 'Guides';
    return section.items.map((item) => {
      const path = item.path;
      return {
        id: 'page:' + path,
        kind: 'page' as const,
        title: item.label,
        path,
        icon: item.icon,
        section: sectionName,
        detail: sectionName + ' page',
        haystack: searchHaystack(item.label, path, sectionName),
      };
    });
  });
  const exampleItems = docsSearchItemsFor('example', HD_DOCS_EXAMPLES);
  const usageItems = docsSearchItemsFor('usage', HD_DOCS_CODE_USAGES);

  return [...pageItems, ...exampleItems, ...usageItems];
}

function docsSearchItemsFor(kind: 'example' | 'usage', seeds: readonly DocsSearchSeed[]): readonly DocsSearchItem[] {
  return seeds.map((item) => {
    const section = hdDocsSectionForPath(item.path) ?? 'Guides';
    return {
      id: kind === 'usage' ? kind + ':' + item.title : kind + ':' + item.detail,
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
  return parts.map(hellSearchKey).join(' ');
}
