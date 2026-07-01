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
    terms:
      'getting-started button-demo getting-started/examples/button-demo.example getting-started install styles hellButton',
  },
  {
    title: 'Theming: Scoped Theme Demo',
    path: '/theming',
    detail: 'theming/examples/scoped-theme-demo.example.ts',
    terms:
      'theming scoped-theme-demo theming/examples/scoped-theme-demo.example theming data-hell-theme data-hell-palette data-hell-skin tokens theme adapter stylesheets glass high contrast aurora newspaper compact mono',
  },
  {
    title: 'Accordion: Multiple',
    path: '/components/accordion',
    detail: 'components/accordion/examples/multiple.example.ts',
    terms:
      'accordion multiple components/accordion/examples/multiple.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
  },
  {
    title: 'Accordion: Single Collapsible',
    path: '/components/accordion',
    detail: 'components/accordion/examples/single-collapsible.example.ts',
    terms:
      'accordion single-collapsible components/accordion/examples/single-collapsible.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
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
    terms:
      'avatar square-shape components/avatar/examples/square-shape.example components/avatar hell-avatar',
  },
  {
    title: 'Avatar: With Image',
    path: '/components/avatar',
    detail: 'components/avatar/examples/with-image.example.ts',
    terms:
      'avatar with-image components/avatar/examples/with-image.example components/avatar hell-avatar',
  },
  {
    title: 'Breadcrumbs: Custom Separator',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/custom-separator.example.ts',
    terms:
      'breadcrumbs custom-separator components/breadcrumbs/examples/custom-separator.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbItem',
  },
  {
    title: 'Breadcrumbs: Long Path With Ellipsis',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/long-path-with-ellipsis.example.ts',
    terms:
      'breadcrumbs long-path-with-ellipsis components/breadcrumbs/examples/long-path-with-ellipsis.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbEllipsis',
  },
  {
    title: 'Breadcrumbs: Standard',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/standard.example.ts',
    terms:
      'breadcrumbs standard components/breadcrumbs/examples/standard.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbLink',
  },
  {
    title: 'Breadcrumbs: With Icons',
    path: '/components/breadcrumbs',
    detail: 'components/breadcrumbs/examples/with-icons.example.ts',
    terms:
      'breadcrumbs with-icons components/breadcrumbs/examples/with-icons.example components/breadcrumbs hellBreadcrumbs hell-icon',
  },
  {
    title: 'Button: Block',
    path: '/components/button',
    detail: 'components/button/examples/block.example.ts',
    terms: 'button block components/button/examples/block.example components/button hellButton',
  },
  {
    title: 'Button: Customization',
    path: '/components/button',
    detail: 'components/button/examples/customization.example.ts',
    terms:
      'button customization components/button/examples/customization.example components/button hellButton ui part style map',
  },
  {
    title: 'Button: Icon Only',
    path: '/components/button',
    detail: 'components/button/examples/icon-only.example.ts',
    terms:
      'button icon-only components/button/examples/icon-only.example components/button hellButton iconOnly',
  },
  {
    title: 'Button: Sizes',
    path: '/components/button',
    detail: 'components/button/examples/sizes.example.ts',
    terms:
      'button sizes components/button/examples/sizes.example components/button hellButton size',
  },
  {
    title: 'Button: Variants',
    path: '/components/button',
    detail: 'components/button/examples/variants.example.ts',
    terms:
      'button variants components/button/examples/variants.example components/button hellButton variant',
  },
  {
    title: 'Button: With Icons',
    path: '/components/button',
    detail: 'components/button/examples/with-icons.example.ts',
    terms:
      'button with-icons components/button/examples/with-icons.example components/button hellButton hell-icon',
  },
  {
    title: 'Card: Examples',
    path: '/components/card',
    detail: 'components/card/examples/examples.example.ts',
    terms:
      'card examples components/card/examples/examples.example components/card hellCard hellCardHeader hellCardBody',
  },
  {
    title: 'Card: With Footer',
    path: '/components/card',
    detail: 'components/card/examples/with-footer.example.ts',
    terms:
      'card with-footer components/card/examples/with-footer.example components/card hellCard hellCardFooter',
  },
  {
    title: 'Card: Without Header',
    path: '/components/card',
    detail: 'components/card/examples/without-header.example.ts',
    terms:
      'card without-header components/card/examples/without-header.example components/card hellCard',
  },
  {
    title: 'Checkbox: Examples',
    path: '/components/checkbox',
    detail: 'components/checkbox/examples/examples.example.ts',
    terms:
      'checkbox examples components/checkbox/examples/examples.example components/checkbox hellCheckbox HellCheckboxUi ui part style map',
  },
  {
    title: 'Checkbox: Native',
    path: '/components/checkbox',
    detail: 'components/checkbox/examples/native.example.ts',
    terms:
      'checkbox native components/checkbox/examples/native.example components/checkbox hellNativeCheckbox HellNativeCheckboxUi ui part style map',
  },
  {
    title: 'Combobox: Basic',
    path: '/components/combobox',
    detail: 'components/combobox/examples/basic.example.ts',
    terms:
      'combobox basic components/combobox/examples/basic.example components/combobox hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty HellComboboxUi HellComboboxInputUi HellComboboxButtonUi HellComboboxDropdownUi HellComboboxOptionUi HellComboboxEmptyUi ui Part Style Map data-slot root',
  },
  {
    title: 'Combobox: Multiple',
    path: '/components/combobox',
    detail: 'components/combobox/examples/multiple.example.ts',
    terms:
      'combobox multiple components/combobox/examples/multiple.example components/combobox hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty multiple HellComboboxUi HellComboboxInputUi HellComboboxButtonUi HellComboboxDropdownUi HellComboboxOptionUi HellComboboxEmptyUi ui Part Style Map data-slot root',
  },
  {
    title: 'Combobox: Preset',
    path: '/components/combobox',
    detail: 'components/combobox/examples/basic-preset.example.ts',
    terms:
      'combobox preset components/combobox/examples/basic-preset.example components/combobox hell-combobox-basic HellComboboxBasic HellComboboxBasicUi ui Part Style Map data-slot root control input button dropdown option empty',
  },
  {
    title: 'Date Picker: Bounded',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/bounded.example.ts',
    terms:
      'date-picker bounded components/date-picker/examples/bounded.example components/date-picker hell-date-picker min max ui HellDatePickerUi navButton dateButton data-slot',
  },
  {
    title: 'Date Picker: Disabled',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/disabled.example.ts',
    terms:
      'date-picker disabled components/date-picker/examples/disabled.example components/date-picker hell-date-picker disabled ui HellDatePickerUi data-slot',
  },
  {
    title: 'Date Picker: Range',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/range.example.ts',
    terms:
      'date-picker range components/date-picker/examples/range.example components/date-picker hell-date-range-picker range ui HellDateRangePickerUi dateButton data-range data-slot',
  },
  {
    title: 'Date Picker: Single Date',
    path: '/components/date-picker',
    detail: 'components/date-picker/examples/single-date.example.ts',
    terms:
      'date-picker single-date components/date-picker/examples/single-date.example components/date-picker hell-date-picker ui HellDatePickerUi root header navButton label grid weekdayHeader cell dateButton data-slot',
  },
  {
    title: 'Dialog: Example',
    path: '/components/dialog',
    detail: 'components/dialog/examples/example.example.ts',
    terms:
      'dialog example components/dialog/examples/example.example components/dialog hellDialog hellDialogTrigger hellDialogTitle ui Part Style Map HellDialogUi HellDialogOverlayUi root overlay panel title description data-slot',
  },
  {
    title: 'Dialog: Scoped To App Shell Content',
    path: '/components/dialog',
    detail: 'components/dialog/examples/scoped-to-app-shell-content.example.ts',
    terms:
      'dialog scoped-to-app-shell-content components/dialog/examples/scoped-to-app-shell-content.example components/dialog hellDialogScope hellAppContent ui Part Style Map HellDialogUi HellDialogOverlayUi scoped overlay data-slot',
  },
  {
    title: 'Field: Horizontal',
    path: '/components/field',
    detail: 'components/field/examples/horizontal.example.ts',
    terms:
      'field horizontal components/field/examples/horizontal.example components/field hellField hellFieldLabel hellFieldDescription',
  },
  {
    title: 'Field: Vertical Default',
    path: '/components/field',
    detail: 'components/field/examples/vertical-default.example.ts',
    terms:
      'field vertical-default components/field/examples/vertical-default.example components/field hellField hellFieldLabel hellFieldError',
  },
  {
    title: 'Flyout: Example Boundary Keeps Siblings Interactive',
    path: '/components/flyout',
    detail: 'components/flyout/examples/example-boundary-keeps-siblings-interactive.example.ts',
    terms:
      'flyout example-boundary-keeps-siblings-interactive components/flyout/examples/example-boundary-keeps-siblings-interactive.example components/flyout hellFlyout hellFlyoutTrigger boundary HellFlyoutUi ui Part Style Map data-slot root',
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
    terms:
      'icon registering-icons components/icon/examples/registering-icons.example components/icon provideIcons hell-icon',
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
    terms:
      'input select components/input/examples/select.example components/input hellInput hellNativeSelect',
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
    terms:
      'input states components/input/examples/states.example components/input hellInput disabled invalid',
  },
  {
    title: 'Input: Customization',
    path: '/components/input',
    detail: 'components/input/examples/customization.example.ts',
    terms:
      'input customization components/input/examples/customization.example components/input hellInput hellNativeSelect hellTextarea ui HellInputUi HellNativeSelectUi HellTextareaUi data-slot root',
  },
  {
    title: 'Input: Textarea',
    path: '/components/input',
    detail: 'components/input/examples/textarea.example.ts',
    terms:
      'input textarea components/input/examples/textarea.example components/input hellTextarea',
  },
  {
    title: 'Listbox: Basic',
    path: '/components/listbox',
    detail: 'components/listbox/examples/basic.example.ts',
    terms:
      'listbox basic components/listbox/examples/basic.example components/listbox HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxHeader HellListboxUi HellListboxOptionUi HellListboxSectionUi HellListboxHeaderUi valueChange option ui Part Style Map data-slot root',
  },
  {
    title: 'Menu: Basic',
    path: '/components/menu',
    detail: 'components/menu/examples/basic.example.ts',
    terms:
      'menu basic components/menu/examples/basic.example components/menu hellMenu hellMenuTrigger hellMenuItem hellMenuSeparator HellMenuUi HellMenuItemUi HellMenuSeparatorUi HellSubmenuTriggerUi ui Part Style Map data-slot root',
  },
  {
    title: 'Menu: With Icons Sections Submenus',
    path: '/components/menu',
    detail: 'components/menu/examples/with-icons-sections-submenus.example.ts',
    terms:
      'menu with-icons-sections-submenus components/menu/examples/with-icons-sections-submenus.example components/menu hellMenu hellSubmenuTrigger hellMenuSection hellMenuItemCheckbox hellMenuItemRadio hellMenuItemIndicator HellMenuUi HellMenuItemUi HellSubmenuTriggerUi HellMenuItemCheckboxUi HellMenuItemRadioUi HellMenuItemIndicatorUi HellMenuSectionUi HellMenuLabelUi HellMenuItemIconUi HellMenuItemTrailingUi HellMenuSeparatorUi ui Part Style Map data-slot root',
  },
  {
    title: 'Pagination: Basic',
    path: '/components/pagination',
    detail: 'components/pagination/examples/basic.example.ts',
    terms:
      'pagination basic components/pagination/examples/basic.example components/pagination hell-pagination',
  },
  {
    title: 'Pagination: Larger Window',
    path: '/components/pagination',
    detail: 'components/pagination/examples/larger-window.example.ts',
    terms:
      'pagination larger-window components/pagination/examples/larger-window.example components/pagination hell-pagination',
  },
  {
    title: 'Pagination: Previous Next',
    path: '/components/pagination',
    detail: 'components/pagination/examples/previous-next.example.ts',
    terms:
      'pagination previous-next previous next components/pagination/examples/previous-next.example components/pagination hell-pagination mode',
  },
  {
    title: 'Pagination: Jump',
    path: '/components/pagination',
    detail: 'components/pagination/examples/jump.example.ts',
    terms:
      'pagination jump select page jump components/pagination/examples/jump.example components/pagination hell-pagination mode',
  },
  {
    title: 'Popover: Example',
    path: '/components/popover',
    detail: 'components/popover/examples/example.example.ts',
    terms:
      'popover example components/popover/examples/example.example components/popover hellPopover hellPopoverTrigger HellPopoverUi ui Part Style Map data-slot root',
  },
  {
    title: 'Progress: Examples',
    path: '/components/progress',
    detail: 'components/progress/examples/examples.example.ts',
    terms:
      'progress examples components/progress/examples/examples.example components/progress hellProgress hellProgressBar',
  },
  {
    title: 'Progress: Interactive',
    path: '/components/progress',
    detail: 'components/progress/examples/interactive.example.ts',
    terms:
      'progress interactive components/progress/examples/interactive.example components/progress hellProgress value',
  },
  {
    title: 'Radio: Example',
    path: '/components/radio',
    detail: 'components/radio/examples/example.example.ts',
    terms:
      'radio example components/radio/examples/example.example components/radio hellRadioGroup hellRadio HellRadioGroupUi HellRadioUi ui part style map',
  },
  {
    title: 'Radio: Horizontal',
    path: '/components/radio',
    detail: 'components/radio/examples/horizontal.example.ts',
    terms:
      'radio horizontal components/radio/examples/horizontal.example components/radio hellRadioGroup hellRadio HellRadioGroupUi HellRadioUi ui part style map',
  },
  {
    title: 'Radio: Native',
    path: '/components/radio',
    detail: 'components/radio/examples/native.example.ts',
    terms:
      'radio native components/radio/examples/native.example components/radio hellNativeRadio hellNativeRadioGroup HellNativeRadioUi HellNativeRadioGroupUi ui part style map',
  },
  {
    title: 'Search: Basic',
    path: '/components/search',
    detail: 'components/search/examples/basic.example.ts',
    terms:
      'search basic components/search/examples/basic.example components/search HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear clear input local filtering',
  },
  {
    title: 'Select: Basic',
    path: '/components/select',
    detail: 'components/select/examples/basic.example.ts',
    terms:
      'select basic components/select/examples/basic.example components/select hellSelect hellSelectValue hellSelectDropdown hellSelectOption HellSelectUi HellSelectValueUi HellSelectPlaceholderUi HellSelectDropdownUi HellSelectOptionUi ui Part Style Map data-slot root',
  },
  {
    title: 'Select: Preset',
    path: '/components/select',
    detail: 'components/select/examples/basic-preset.example.ts',
    terms:
      'select preset components/select/examples/basic-preset.example components/select hell-select-basic HellSelectBasic HellSelectBasicUi ui Part Style Map data-slot root trigger value placeholder dropdown option',
  },
  {
    title: 'Separator: Flush Inside A Card',
    path: '/components/separator',
    detail: 'components/separator/examples/flush-inside-a-card.example.ts',
    terms:
      'separator flush-inside-a-card components/separator/examples/flush-inside-a-card.example components/separator hellSeparator',
  },
  {
    title: 'Separator: Horizontal',
    path: '/components/separator',
    detail: 'components/separator/examples/horizontal.example.ts',
    terms:
      'separator horizontal components/separator/examples/horizontal.example components/separator hellSeparator horizontal',
  },
  {
    title: 'Separator: Spacing Options',
    path: '/components/separator',
    detail: 'components/separator/examples/spacing-options.example.ts',
    terms:
      'separator spacing-options components/separator/examples/spacing-options.example components/separator hellSeparator spacing',
  },
  {
    title: 'Separator: Vertical',
    path: '/components/separator',
    detail: 'components/separator/examples/vertical.example.ts',
    terms:
      'separator vertical components/separator/examples/vertical.example components/separator hellSeparator vertical',
  },
  {
    title: 'Skeleton: Avatar Lines',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/avatar-lines.example.ts',
    terms:
      'skeleton avatar-lines components/skeleton/examples/avatar-lines.example components/skeleton hellSkeleton loading',
  },
  {
    title: 'Skeleton: Card Placeholder',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/card-placeholder.example.ts',
    terms:
      'skeleton card-placeholder components/skeleton/examples/card-placeholder.example components/skeleton hellSkeleton card',
  },
  {
    title: 'Skeleton: Shapes',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/shapes.example.ts',
    terms:
      'skeleton shapes components/skeleton/examples/shapes.example components/skeleton hellSkeleton circle rect',
  },
  {
    title: 'Skeleton: Text Lines',
    path: '/components/skeleton',
    detail: 'components/skeleton/examples/text-lines.example.ts',
    terms:
      'skeleton text-lines components/skeleton/examples/text-lines.example components/skeleton hellSkeleton text',
  },
  {
    title: 'Spinner: Colour',
    path: '/components/spinner',
    detail: 'components/spinner/examples/colour.example.ts',
    terms:
      'spinner colour components/spinner/examples/colour.example components/spinner hellSpinner color',
  },
  {
    title: 'Spinner: Inside A Button',
    path: '/components/spinner',
    detail: 'components/spinner/examples/inside-a-button.example.ts',
    terms:
      'spinner inside-a-button components/spinner/examples/inside-a-button.example components/spinner hellSpinner hellButton',
  },
  {
    title: 'Spinner: Sizes',
    path: '/components/spinner',
    detail: 'components/spinner/examples/sizes.example.ts',
    terms:
      'spinner sizes components/spinner/examples/sizes.example components/spinner hellSpinner size',
  },
  {
    title: 'Spinner: Variants',
    path: '/components/spinner',
    detail: 'components/spinner/examples/variants.example.ts',
    terms:
      'spinner variants components/spinner/examples/variants.example components/spinner hellSpinner variant',
  },
  {
    title: 'Slider: Basic',
    path: '/components/slider',
    detail: 'components/slider/examples/basic.example.ts',
    terms:
      'slider basic components/slider/examples/basic.example components/slider hell-slider HellSliderUi ui part style map',
  },
  {
    title: 'Slider: Disabled',
    path: '/components/slider',
    detail: 'components/slider/examples/disabled.example.ts',
    terms:
      'slider disabled components/slider/examples/disabled.example components/slider hell-slider disabled HellSliderUi ui part style map',
  },
  {
    title: 'Slider: Hover Revealed Thumb',
    path: '/components/slider',
    detail: 'components/slider/examples/hover-revealed-thumb.example.ts',
    terms:
      'slider hover-revealed-thumb components/slider/examples/hover-revealed-thumb.example components/slider hell-slider thumb HellSliderUi ui part style map',
  },
  {
    title: 'Slider: Sizes',
    path: '/components/slider',
    detail: 'components/slider/examples/sizes.example.ts',
    terms:
      'slider sizes components/slider/examples/sizes.example components/slider hell-slider size HellSliderUi ui part style map',
  },
  {
    title: 'Slider: Vertical',
    path: '/components/slider',
    detail: 'components/slider/examples/vertical.example.ts',
    terms:
      'slider vertical components/slider/examples/vertical.example components/slider hell-slider vertical HellSliderUi ui part style map',
  },
  {
    title: 'Switch: Examples',
    path: '/components/switch',
    detail: 'components/switch/examples/examples.example.ts',
    terms:
      'switch examples components/switch/examples/examples.example components/switch hellSwitch HellSwitchUi ui part style map',
  },
  {
    title: 'Switch: Native',
    path: '/components/switch',
    detail: 'components/switch/examples/native.example.ts',
    terms:
      'switch native components/switch/examples/native.example components/switch hellNativeSwitch HellNativeSwitchUi ui part style map',
  },
  {
    title: 'Tabs: Example',
    path: '/components/tabs',
    detail: 'components/tabs/examples/example.example.ts',
    terms:
      'tabs example components/tabs/examples/example.example components/tabs hellTabset hellTab hellTabPanel',
  },
  {
    title: 'Tabs: Vertical',
    path: '/components/tabs',
    detail: 'components/tabs/examples/vertical.example.ts',
    terms:
      'tabs vertical components/tabs/examples/vertical.example components/tabs hellTabset vertical',
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
    terms:
      'tag keyboard-hint components/tag/examples/keyboard-hint.example components/tag hellKbd keyboard',
  },
  {
    title: 'Tag: Tag Variants',
    path: '/components/tag',
    detail: 'components/tag/examples/tag-variants.example.ts',
    terms:
      'tag tag-variants components/tag/examples/tag-variants.example components/tag hellTag variant',
  },
  {
    title: 'Toggle: Disabled',
    path: '/components/toggle',
    detail: 'components/toggle/examples/disabled.example.ts',
    terms:
      'toggle disabled components/toggle/examples/disabled.example components/toggle hellToggle disabled HellToggleUi ui part style map',
  },
  {
    title: 'Toggle: Single Toggle',
    path: '/components/toggle',
    detail: 'components/toggle/examples/single-toggle.example.ts',
    terms:
      'toggle single-toggle components/toggle/examples/single-toggle.example components/toggle hellToggle HellToggleUi ui part style map',
  },
  {
    title: 'Toggle: Toggle Group Multiple',
    path: '/components/toggle',
    detail: 'components/toggle/examples/toggle-group-multiple.example.ts',
    terms:
      'toggle toggle-group-multiple components/toggle/examples/toggle-group-multiple.example components/toggle hellToggleGroup multiple HellToggleGroupUi HellToggleGroupItemUi ui part style map',
  },
  {
    title: 'Toggle: Toggle Group Single',
    path: '/components/toggle',
    detail: 'components/toggle/examples/toggle-group-single.example.ts',
    terms:
      'toggle toggle-group-single components/toggle/examples/toggle-group-single.example components/toggle hellToggleGroup single HellToggleGroupUi HellToggleGroupItemUi ui part style map',
  },
  {
    title: 'Tooltip: Example',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/example.example.ts',
    terms:
      'tooltip example components/tooltip/examples/example.example components/tooltip hellTooltip hellTooltipTrigger HellTooltipUi ui Part Style Map data-slot root',
  },
  {
    title: 'Tooltip: With Delay',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/with-delay.example.ts',
    terms:
      'tooltip with-delay components/tooltip/examples/with-delay.example components/tooltip hellTooltip delay HellTooltipUi ui Part Style Map data-slot root',
  },
  {
    title: 'Tooltip: Hoverable',
    path: '/components/tooltip',
    detail: 'components/tooltip/examples/hoverable.example.ts',
    terms:
      'tooltip hoverable components/tooltip/examples/hoverable.example components/tooltip hellTooltip hoverableContent HellTooltipUi ui Part Style Map data-slot root',
  },
  {
    title: 'App Shell: Live Miniature',
    path: '/components/app-shell',
    detail: 'components/app-shell/examples/live-miniature.example.ts',
    terms:
      'app-shell live-miniature components/app-shell/examples/live-miniature.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
  },
  {
    title: 'App Shell: Markup Skeleton',
    path: '/components/app-shell',
    detail: 'components/app-shell/examples/markup-skeleton.example.ts',
    terms:
      'app-shell markup-skeleton components/app-shell/examples/markup-skeleton.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
  },
  {
    title: 'Audio Player: Speech Transcript',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/speech-transcript.example.ts',
    terms:
      'audio-player speech-transcript components/audio-player/examples/speech-transcript.example components/audio-player hell-audio-player ui Part Style Map HellAudioPlayerUi captions captionsBar captionsStatus captionsDot captionsBody captionsError captionsInterim captionsEmpty allowSpeechTranscript provideHellAudioTranscript features/audio-transcript SpeechRecognition captureStream experimental best-effort timed-text accessibility',
  },
  {
    title: 'Audio Player: Untitled Controls Only',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/untitled-controls-only.example.ts',
    terms:
      'audio-player untitled-controls-only components/audio-player/examples/untitled-controls-only.example components/audio-player hell-audio-player ui Part Style Map HellAudioPlayerUi root controls transport playButton time seek actions muteButton volume downloadButton data-time data-slot',
  },
  {
    title: 'Audio Player: With Title And Date',
    path: '/components/audio-player',
    detail: 'components/audio-player/examples/with-title-and-date.example.ts',
    terms:
      'audio-player with-title-and-date components/audio-player/examples/with-title-and-date.example components/audio-player hell-audio-player ui Part Style Map HellAudioPlayerUi meta title date controls transport data-slot',
  },
  {
    title: 'Avatar Group: Basic',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/basic.example.ts',
    terms:
      'avatar-group basic components/avatar-group/examples/basic.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
  },
  {
    title: 'Avatar Group: Interaction Hooks',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/interaction-hooks.example.ts',
    terms:
      'avatar-group interaction-hooks components/avatar-group/examples/interaction-hooks.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
  },
  {
    title: 'Avatar Group: Overflow Menu',
    path: '/components/avatar-group',
    detail: 'components/avatar-group/examples/overflow-menu.example.ts',
    terms:
      'avatar-group overflow-menu components/avatar-group/examples/overflow-menu.example components/avatar-group hellAvatarGroup hellAvatarGroupOverflow',
  },
  {
    title: 'Date Input: Placeholders And Labels',
    path: '/components/date-input',
    detail: 'components/date-input/examples/placeholders-and-labels.example.ts',
    terms:
      'date-input placeholders-and-labels components/date-input/examples/placeholders-and-labels.example components/date-input hell-date-input ui HellDateInputUi input trigger pickerPanel data-slot',
  },
  {
    title: 'Date Input: Reactive Forms',
    path: '/components/date-input',
    detail: 'components/date-input/examples/reactive-forms.example.ts',
    terms:
      'date-input reactive-forms components/date-input/examples/reactive-forms.example components/date-input hell-date-input formControl ReactiveFormsModule ControlValueAccessor Date null Angular Forms ui HellDateInputUi',
  },
  {
    title: 'Date Input: Sizes',
    path: '/components/date-input',
    detail: 'components/date-input/examples/sizes.example.ts',
    terms:
      'date-input sizes components/date-input/examples/sizes.example components/date-input hell-date-input size ui HellDateInputUi root input trigger',
  },
  {
    title: 'Date Input: Text Input Calendar Popover',
    path: '/components/date-input',
    detail: 'components/date-input/examples/text-input-calendar-popover.example.ts',
    terms:
      'date-input text-input-calendar-popover components/date-input/examples/text-input-calendar-popover.example components/date-input hell-date-input popover ui HellDateInputUi pickerPanel triggerIcon data-slot',
  },
  {
    title: 'Dialpad: Example',
    path: '/components/dialpad',
    detail: 'components/dialpad/examples/example.example.ts',
    terms:
      'dialpad example components/dialpad/examples/example.example components/dialpad hell-dialpad ui part style map numberInput clearButton backspaceButton callButton keyButton keyboard Backspace Delete Enter disabled readOnly readonly invalid clear call digit valueChange',
  },
  {
    title: 'Drop Zone: Disabled',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/disabled.example.ts',
    terms:
      'drop-zone disabled components/drop-zone/examples/disabled.example components/drop-zone hellDropzone disabled',
  },
  {
    title: 'Drop Zone: Example',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/example.example.ts',
    terms:
      'drop-zone example components/drop-zone/examples/example.example components/drop-zone hellDropzone upload file',
  },
  {
    title: 'Drop Zone: Native Input Seam',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/native-input.example.ts',
    terms:
      'drop-zone nativeInput components/drop-zone/examples/native-input.example.ts components/drop-zone hellDropzone HTMLInputElement',
  },
  {
    title: 'Drop Zone: Single File Images Only',
    path: '/components/drop-zone',
    detail: 'components/drop-zone/examples/single-file-images-only.example.ts',
    terms:
      'drop-zone single-file-images-only components/drop-zone/examples/single-file-images-only.example components/drop-zone hellDropzone image accept',
  },
  {
    title: 'Omnibar: Async Search',
    path: '/components/omnibar',
    detail: 'components/omnibar/examples/async-search.example.ts',
    terms:
      'omnibar async-search components/omnibar/examples/async-search.example components/omnibar hell-omnibar HELL_OMNIBAR_DIRECTIVES command palette backend async search searchSource searchFields ranking debounce starter hotkey adapter search scope ui Part Style Map HellOmnibarUi panel actions results loading skeletonRow skeletonText empty data-slot',
  },
  {
    title: 'Resizable: Grip Handle 5',
    path: '/components/resizable',
    detail: 'components/resizable/examples/grip-handle-5.example.ts',
    terms:
      'resizable grip-handle-5 components/resizable/examples/grip-handle-5.example components/resizable hellResizable hellResizablePane hellResizableHandle',
  },
  {
    title: 'Resizable: Grip Handle',
    path: '/components/resizable',
    detail: 'components/resizable/examples/grip-handle.example.ts',
    terms:
      'resizable grip-handle components/resizable/examples/grip-handle.example components/resizable hellResizable hellResizableHandle',
  },
  {
    title: 'Resizable: Horizontal Split',
    path: '/components/resizable',
    detail: 'components/resizable/examples/horizontal-split.example.ts',
    terms:
      'resizable horizontal-split components/resizable/examples/horizontal-split.example components/resizable hellResizable horizontal',
  },
  {
    title: 'Resizable: Three Panes',
    path: '/components/resizable',
    detail: 'components/resizable/examples/three-panes.example.ts',
    terms:
      'resizable three-panes components/resizable/examples/three-panes.example components/resizable hellResizable panes',
  },
  {
    title: 'Resizable: Vertical Split',
    path: '/components/resizable',
    detail: 'components/resizable/examples/vertical-split.example.ts',
    terms:
      'resizable vertical-split components/resizable/examples/vertical-split.example components/resizable hellResizable vertical',
  },
  {
    title: 'Split View: Master Detail',
    path: '/components/split-view',
    detail: 'components/split-view/examples/master-detail.example.ts',
    terms:
      'split-view master-detail components/split-view/examples/master-detail.example components/split-view hell-split-view HELL_SPLIT_VIEW_DIRECTIVES hellSplitPrimary hellSplitDetail responsive compact back detailOpen resizable',
  },
  {
    title: 'Time Input: Examples',
    path: '/components/time-input',
    detail: 'components/time-input/examples/examples.example.ts',
    terms:
      'time-input examples components/time-input/examples/examples.example components/time-input hell-time-input ui HellTimeInputUi pickerPanel pickerUnit minutePreset data-slot',
  },
  {
    title: 'Time Input: Reactive Forms',
    path: '/components/time-input',
    detail: 'components/time-input/examples/reactive-forms.example.ts',
    terms:
      'time-input reactive-forms components/time-input/examples/reactive-forms.example components/time-input hell-time-input formControl ReactiveFormsModule ControlValueAccessor HellTimeValue null Angular Forms ui HellTimeInputUi',
  },
  {
    title: 'Time Input: Placeholder And Labels',
    path: '/components/time-input',
    detail: 'components/time-input/examples/placeholder-and-labels.example.ts',
    terms:
      'time-input placeholder-and-labels components/time-input/examples/placeholder-and-labels.example components/time-input hell-time-input placeholder label ui HellTimeInputUi input trigger',
  },
  {
    title: 'Time Input: Sizes',
    path: '/components/time-input',
    detail: 'components/time-input/examples/sizes.example.ts',
    terms:
      'time-input sizes components/time-input/examples/sizes.example components/time-input hell-time-input size ui HellTimeInputUi root input trigger',
  },
  {
    title: 'Toast: Action',
    path: '/components/toast',
    detail: 'components/toast/examples/action.example.ts',
    terms:
      'toast action components/toast/examples/action.example components/toast hell-toaster toast action ui Part Style Map HellToasterUi root viewport toast body title description glyph close toolbar dismissAll data-slot',
  },
  {
    title: 'Toast: Persistent Custom Content',
    path: '/components/toast',
    detail: 'components/toast/examples/persistent-custom-content.example.ts',
    terms:
      'toast persistent-custom-content components/toast/examples/persistent-custom-content.example components/toast hell-toaster persistent ui Part Style Map HellToasterUi toast body action close data-slot',
  },
  {
    title: 'Toast: Stacking',
    path: '/components/toast',
    detail: 'components/toast/examples/stacking.example.ts',
    terms:
      'toast stacking components/toast/examples/stacking.example components/toast hell-toaster stacking ui Part Style Map HellToasterUi viewport list toolbar dismissAll expanded pause resume data-state data-slot',
  },
  {
    title: 'Toast: Variants',
    path: '/components/toast',
    detail: 'components/toast/examples/variants.example.ts',
    terms:
      'toast variants components/toast/examples/variants.example components/toast hell-toaster variant ui Part Style Map HellToasterUi glyph title description data-variant data-slot',
  },
  {
    title: 'Code Editor: Code Viewer Demo',
    path: '/components/code-editor',
    detail: 'components/code-editor/examples/code-viewer-demo.example.ts',
    terms:
      'code-editor code-viewer-demo components/code-editor/examples/code-viewer-demo.example components/code-editor hell-code-editor readOnly CodeMirror ui Part Style Map HellCodeEditorUi root editor data-readonly data-slot',
  },
  {
    title: 'Code Editor: Editor Demo',
    path: '/components/code-editor',
    detail: 'components/code-editor/examples/editor-demo.example.ts',
    terms:
      'code-editor editor-demo components/code-editor/examples/editor-demo.example components/code-editor hell-code-editor CodeMirror ui Part Style Map HellCodeEditorUi root editor value readOnly data-readonly data-slot',
  },
  {
    title: 'Table: Primitive Table',
    path: '/components/table',
    detail: 'components/table/examples/primitive-table.example.ts',
    terms:
      'table primitive components/table/examples/primitive-table.example components/table hellTable HELL_TABLE_UTILITIES_DIRECTIVES native table sort trigger resize handle row action selection controls',
  },
  {
    title: 'Table: TanStack Shell',
    path: '/components/table',
    detail: 'components/table/examples/tanstack-shell.example.ts',
    terms:
      'table tanstack shell components/table/examples/tanstack-shell.example components/table hell-tanstack-table HellTanStackTable HellTableStatus hellTableShellCell hellTableShellToolbar hellTableShellFooter hell-tanstack-pagination HellPaginationStrip omnibar menu filters sort split view master detail pagination filtering flexRender',
  },
  {
    title: 'Table: TanStack Virtual Rows',
    path: '/components/table',
    detail: 'components/table/examples/tanstack-virtual.example.ts',
    terms:
      'table tanstack virtual rows components/table/examples/tanstack-virtual.example components/table @hell-ui/angular/table-tanstack/virtual hellTanStackVirtualRows HellTanStackVirtualRows hellTableShellExpandedRow omnibar menu filters sort expanded rows TanStack Virtual',
  },
  {
    title: 'Pdf Viewer: Lazy Loading',
    path: '/components/pdf-viewer',
    detail: 'components/pdf-viewer/examples/lazy-loading.example.ts',
    terms:
      'pdf-viewer lazy-loading components/pdf-viewer/examples/lazy-loading.example components/pdf-viewer hell-pdf-viewer pdfjs lazy loadComponent dynamic import feature route stylesheet experimental beta app-surface recipe',
  },
  {
    title: 'Pdf Viewer: Live Demo',
    path: '/components/pdf-viewer',
    detail: 'components/pdf-viewer/examples/live-demo.example.ts',
    terms:
      'pdf-viewer live-demo components/pdf-viewer/examples/live-demo.example components/pdf-viewer hell-pdf-viewer pdfjs experimental beta app-surface recipe',
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
    terms:
      'HELL_COMBOBOX_DIRECTIVES hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty',
  },
  {
    title: 'Dialog scoping',
    path: '/components/dialog',
    detail: 'hellDialogScope keeps overlays inside app content',
    terms:
      'HELL_DIALOG_DIRECTIVES hellDialogTrigger hellDialogOverlay hellDialogScope hellDialog hellDialogTitle hellDialogDescription',
  },
  {
    title: 'Field anatomy',
    path: '/components/field',
    detail: 'hellFieldLabel, hellFieldDescription, hellFieldError',
    terms:
      'HELL_FIELD_DIRECTIVES hellField hellFieldLabel hellFieldDescription hellFieldError form field input aria',
  },
  {
    title: 'Listbox primitives',
    path: '/components/listbox',
    detail: 'hellListbox, hellListboxOption, hellListboxHeader',
    terms:
      'HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxSection hellListboxHeader value valueChange mode',
  },
  {
    title: 'Menu and submenu triggers',
    path: '/components/menu',
    detail: 'hellMenuTrigger, hellSubmenuTrigger, hellMenuItem',
    terms:
      'HELL_MENU_DIRECTIVES hellMenuTrigger hellSubmenuTrigger hellMenu hellMenuItem hellMenuSection hellMenuLabel submenu',
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
    terms:
      'HELL_SELECT_DIRECTIVES hellSelect hellSelectValue hellSelectPortal hellSelectDropdown hellSelectOption valueChange',
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
    terms:
      'HELL_APP_SHELL_DIRECTIVES hellAppShell hellAppTopbar hellAppSidenav hellAppContent hellAppSecondary hellSidenavToggle hellSecondaryToggle',
  },
  {
    title: 'Date input adapter',
    path: '/components/date-input',
    detail: 'provideHellDateInputAdapter, HELL_DATE_INPUT_ADAPTER',
    terms:
      'date-input adapter provideHellDateInputAdapter HELL_DATE_INPUT_ADAPTER parse format locale temporal strict ISO YYYY-MM-DD ui HellDateInputUi',
  },
  {
    title: 'Date input forms value',
    path: '/components/date-input',
    detail: 'ControlValueAccessor, formControl, Date | null',
    terms:
      'date-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms Date null native form submission validation ui HellDateInputUi',
  },
  {
    title: 'Omnibar directives',
    path: '/components/omnibar',
    detail: 'hell-omnibar, hellOmnibarItem, hellOmnibarAction',
    terms:
      'hell-omnibar HellOmnibar HELL_OMNIBAR_DIRECTIVES hellOmnibar hellOmnibarItem hellOmnibarAction hellOmnibarGroup command palette async search ranking debounce skeleton searchSource',
  },
  {
    title: 'Resizable panes',
    path: '/components/resizable',
    detail: 'hellResizablePane and hellResizableHandle compose split views',
    terms:
      'HELL_RESIZABLE_DIRECTIVES hellResizable hellResizablePane hellResizableHandle horizontal vertical minSize initialFlex',
  },
  {
    title: 'Split view directives',
    path: '/components/split-view',
    detail: 'hell-split-view, hellSplitPrimary, hellSplitDetail',
    terms:
      'HELL_SPLIT_VIEW_DIRECTIVES hell-split-view hellSplitPrimary hellSplitDetail compactBelow detailOpen detailOpenChange itemNavigation previousItem nextItem responsive resizable panes',
  },
  {
    title: 'Time input adapter',
    path: '/components/time-input',
    detail: 'provideHellTimeInputAdapter, HELL_TIME_INPUT_ADAPTER',
    terms:
      'time-input adapter provideHellTimeInputAdapter HELL_TIME_INPUT_ADAPTER parse format locale shortcuts HellTimeValue ui HellTimeInputUi',
  },
  {
    title: 'Time input forms value',
    path: '/components/time-input',
    detail: 'ControlValueAccessor, formControl, HellTimeValue | null',
    terms:
      'time-input forms ControlValueAccessor formControl ReactiveFormsModule Angular Forms HellTimeValue null native form submission validation ui HellTimeInputUi',
  },
  {
    title: 'Table directives',
    path: '/components/table',
    detail: 'hellTable, hell-tanstack-table, hellTanStackVirtualRows',
    terms:
      'HELL_TABLE_UTILITIES_DIRECTIVES hellTableContainer hellTable hellTableHead hellTableBody hellTableRow hellTableHeaderCell hellTableSortTrigger hellTableCell hellTableResizeHandle HellTanStackTable hell-tanstack-table HellTableStatus hellTableShellCell hellTableShellHeader hellTableShellToolbar hellTableShellFooter hell-tanstack-pagination HellPaginationStrip hellTableShellExpandedRow hellTanStackVirtualRows TanStack Table TanStack Virtual omnibar menu split view',
  },
];

const HD_DOCS_KIND_ICON: Record<DocsSearchKind, string> = {
  page: 'faSolidSignsPost',
  example: 'faSolidCode',
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

function docsSearchItemsFor(
  kind: 'example' | 'usage',
  seeds: readonly DocsSearchSeed[],
): readonly DocsSearchItem[] {
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
