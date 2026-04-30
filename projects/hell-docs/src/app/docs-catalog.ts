import { Routes } from '@angular/router';

export interface DocsSearchSeed {
  readonly title: string;
  readonly path: string;
  readonly section: string;
  readonly detail: string;
  readonly terms: string;
}

export const HD_DOCS_EXAMPLES: readonly DocsSearchSeed[] = [
  { title: 'Accordion: Multiple', path: '/components/accordion', section: 'Components', detail: 'components/accordion/examples/multiple.example.ts', terms: 'accordion multiple components/accordion/examples/multiple.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger' },
  { title: 'Accordion: Single Collapsible', path: '/components/accordion', section: 'Components', detail: 'components/accordion/examples/single-collapsible.example.ts', terms: 'accordion single-collapsible components/accordion/examples/single-collapsible.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger' },
  { title: 'App Shell: Live Miniature', path: '/components/app-shell', section: 'Components', detail: 'components/app-shell/examples/live-miniature.example.ts', terms: 'app-shell live-miniature components/app-shell/examples/live-miniature.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent' },
  { title: 'App Shell: Markup Skeleton', path: '/components/app-shell', section: 'Components', detail: 'components/app-shell/examples/markup-skeleton.example.ts', terms: 'app-shell markup-skeleton components/app-shell/examples/markup-skeleton.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent' },
  { title: 'Audio Player: Live Captions', path: '/components/audio-player', section: 'Components', detail: 'components/audio-player/examples/live-captions.example.ts', terms: 'audio-player live-captions components/audio-player/examples/live-captions.example components/audio-player hell-audio-player' },
  { title: 'Audio Player: Untitled Controls Only', path: '/components/audio-player', section: 'Components', detail: 'components/audio-player/examples/untitled-controls-only.example.ts', terms: 'audio-player untitled-controls-only components/audio-player/examples/untitled-controls-only.example components/audio-player hell-audio-player' },
  { title: 'Audio Player: With Title And Date', path: '/components/audio-player', section: 'Components', detail: 'components/audio-player/examples/with-title-and-date.example.ts', terms: 'audio-player with-title-and-date components/audio-player/examples/with-title-and-date.example components/audio-player hell-audio-player' },
  { title: 'Avatar Group: Basic', path: '/components/avatar-group', section: 'Components', detail: 'components/avatar-group/examples/basic.example.ts', terms: 'avatar-group basic components/avatar-group/examples/basic.example components/avatar-group hellAvatarGroup hellAvatarGroupItem' },
  { title: 'Avatar Group: Interaction Hooks', path: '/components/avatar-group', section: 'Components', detail: 'components/avatar-group/examples/interaction-hooks.example.ts', terms: 'avatar-group interaction-hooks components/avatar-group/examples/interaction-hooks.example components/avatar-group hellAvatarGroup hellAvatarGroupItem' },
  { title: 'Avatar Group: Overflow Menu', path: '/components/avatar-group', section: 'Components', detail: 'components/avatar-group/examples/overflow-menu.example.ts', terms: 'avatar-group overflow-menu components/avatar-group/examples/overflow-menu.example components/avatar-group hellAvatarGroup hellAvatarGroupOverflow' },
  { title: 'Avatar: Sizes', path: '/components/avatar', section: 'Components', detail: 'components/avatar/examples/sizes.example.ts', terms: 'avatar sizes components/avatar/examples/sizes.example components/avatar hell-avatar' },
  { title: 'Avatar: Square Shape', path: '/components/avatar', section: 'Components', detail: 'components/avatar/examples/square-shape.example.ts', terms: 'avatar square-shape components/avatar/examples/square-shape.example components/avatar hell-avatar' },
  { title: 'Avatar: With Image', path: '/components/avatar', section: 'Components', detail: 'components/avatar/examples/with-image.example.ts', terms: 'avatar with-image components/avatar/examples/with-image.example components/avatar hell-avatar' },
  { title: 'Breadcrumbs: Custom Separator', path: '/components/breadcrumbs', section: 'Components', detail: 'components/breadcrumbs/examples/custom-separator.example.ts', terms: 'breadcrumbs custom-separator components/breadcrumbs/examples/custom-separator.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbItem' },
  { title: 'Breadcrumbs: Long Path With Ellipsis', path: '/components/breadcrumbs', section: 'Components', detail: 'components/breadcrumbs/examples/long-path-with-ellipsis.example.ts', terms: 'breadcrumbs long-path-with-ellipsis components/breadcrumbs/examples/long-path-with-ellipsis.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbEllipsis' },
  { title: 'Breadcrumbs: Standard', path: '/components/breadcrumbs', section: 'Components', detail: 'components/breadcrumbs/examples/standard.example.ts', terms: 'breadcrumbs standard components/breadcrumbs/examples/standard.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbLink' },
  { title: 'Breadcrumbs: With Icons', path: '/components/breadcrumbs', section: 'Components', detail: 'components/breadcrumbs/examples/with-icons.example.ts', terms: 'breadcrumbs with-icons components/breadcrumbs/examples/with-icons.example components/breadcrumbs hellBreadcrumbs hell-icon' },
  { title: 'Button: Block', path: '/components/button', section: 'Components', detail: 'components/button/examples/block.example.ts', terms: 'button block components/button/examples/block.example components/button hellButton' },
  { title: 'Button: Icon Only', path: '/components/button', section: 'Components', detail: 'components/button/examples/icon-only.example.ts', terms: 'button icon-only components/button/examples/icon-only.example components/button hellButton iconOnly' },
  { title: 'Button: Sizes', path: '/components/button', section: 'Components', detail: 'components/button/examples/sizes.example.ts', terms: 'button sizes components/button/examples/sizes.example components/button hellButton size' },
  { title: 'Button: Variants', path: '/components/button', section: 'Components', detail: 'components/button/examples/variants.example.ts', terms: 'button variants components/button/examples/variants.example components/button hellButton variant' },
  { title: 'Button: With Icons', path: '/components/button', section: 'Components', detail: 'components/button/examples/with-icons.example.ts', terms: 'button with-icons components/button/examples/with-icons.example components/button hellButton hell-icon' },
  { title: 'Card: Examples', path: '/components/card', section: 'Components', detail: 'components/card/examples/examples.example.ts', terms: 'card examples components/card/examples/examples.example components/card hellCard hellCardHeader hellCardBody' },
  { title: 'Card: With Footer', path: '/components/card', section: 'Components', detail: 'components/card/examples/with-footer.example.ts', terms: 'card with-footer components/card/examples/with-footer.example components/card hellCard hellCardFooter' },
  { title: 'Card: Without Header', path: '/components/card', section: 'Components', detail: 'components/card/examples/without-header.example.ts', terms: 'card without-header components/card/examples/without-header.example components/card hellCard' },
  { title: 'Checkbox: Examples', path: '/components/checkbox', section: 'Components', detail: 'components/checkbox/examples/examples.example.ts', terms: 'checkbox examples components/checkbox/examples/examples.example components/checkbox hellCheckbox' },
  { title: 'Code Editor: Code Viewer Demo', path: '/components/code-editor', section: 'Components', detail: 'components/code-editor/examples/code-viewer-demo.example.ts', terms: 'code-editor code-viewer-demo components/code-editor/examples/code-viewer-demo.example components/code-editor hell-code-editor readOnly CodeMirror' },
  { title: 'Code Editor: Editor Demo', path: '/components/code-editor', section: 'Components', detail: 'components/code-editor/examples/editor-demo.example.ts', terms: 'code-editor editor-demo components/code-editor/examples/editor-demo.example components/code-editor hell-code-editor CodeMirror' },
  { title: 'Combobox: Basic', path: '/components/combobox', section: 'Components', detail: 'components/combobox/examples/basic.example.ts', terms: 'combobox basic components/combobox/examples/basic.example components/combobox hellCombobox hellComboboxInput hellComboboxOption' },
  { title: 'Combobox: Multiple', path: '/components/combobox', section: 'Components', detail: 'components/combobox/examples/multiple.example.ts', terms: 'combobox multiple components/combobox/examples/multiple.example components/combobox hellCombobox multiple' },
  { title: 'Data Table: Example', path: '/components/data-table', section: 'Components', detail: 'components/data-table/examples/example.example.ts', terms: 'data-table example components/data-table/examples/example.example components/data-table hellTable hellTableRow hellOmnibar smart search ranking role assignee' },
  { title: 'Data Table: Row Editor', path: '/components/data-table', section: 'Components', detail: 'components/data-table/examples/row-editor.example.ts', terms: 'data-table row-editor components/data-table/examples/row-editor.example components/data-table hellResizable hellTable hell-code-editor' },
  { title: 'Date Input: Placeholders And Labels', path: '/components/date-input', section: 'Components', detail: 'components/date-input/examples/placeholders-and-labels.example.ts', terms: 'date-input placeholders-and-labels components/date-input/examples/placeholders-and-labels.example components/date-input hell-date-input' },
  { title: 'Date Input: Sizes', path: '/components/date-input', section: 'Components', detail: 'components/date-input/examples/sizes.example.ts', terms: 'date-input sizes components/date-input/examples/sizes.example components/date-input hell-date-input size' },
  { title: 'Date Input: Text Input Calendar Popover', path: '/components/date-input', section: 'Components', detail: 'components/date-input/examples/text-input-calendar-popover.example.ts', terms: 'date-input text-input-calendar-popover components/date-input/examples/text-input-calendar-popover.example components/date-input hell-date-input popover' },
  { title: 'Date Picker: Bounded', path: '/components/date-picker', section: 'Components', detail: 'components/date-picker/examples/bounded.example.ts', terms: 'date-picker bounded components/date-picker/examples/bounded.example components/date-picker hell-date-picker min max' },
  { title: 'Date Picker: Disabled', path: '/components/date-picker', section: 'Components', detail: 'components/date-picker/examples/disabled.example.ts', terms: 'date-picker disabled components/date-picker/examples/disabled.example components/date-picker hell-date-picker disabled' },
  { title: 'Date Picker: Range', path: '/components/date-picker', section: 'Components', detail: 'components/date-picker/examples/range.example.ts', terms: 'date-picker range components/date-picker/examples/range.example components/date-picker hell-date-picker range' },
  { title: 'Date Picker: Single Date', path: '/components/date-picker', section: 'Components', detail: 'components/date-picker/examples/single-date.example.ts', terms: 'date-picker single-date components/date-picker/examples/single-date.example components/date-picker hell-date-picker' },
  { title: 'Dialog: Example', path: '/components/dialog', section: 'Components', detail: 'components/dialog/examples/example.example.ts', terms: 'dialog example components/dialog/examples/example.example components/dialog hellDialog hellDialogTrigger hellDialogTitle' },
  { title: 'Dialog: Scoped To App Shell Content', path: '/components/dialog', section: 'Components', detail: 'components/dialog/examples/scoped-to-app-shell-content.example.ts', terms: 'dialog scoped-to-app-shell-content components/dialog/examples/scoped-to-app-shell-content.example components/dialog hellDialogScope hellAppContent' },
  { title: 'Dialpad: Example', path: '/components/dialpad', section: 'Components', detail: 'components/dialpad/examples/example.example.ts', terms: 'dialpad example components/dialpad/examples/example.example components/dialpad hell-dialpad' },
  { title: 'Drop Zone: Disabled', path: '/components/drop-zone', section: 'Components', detail: 'components/drop-zone/examples/disabled.example.ts', terms: 'drop-zone disabled components/drop-zone/examples/disabled.example components/drop-zone hellDropzone disabled' },
  { title: 'Drop Zone: Example', path: '/components/drop-zone', section: 'Components', detail: 'components/drop-zone/examples/example.example.ts', terms: 'drop-zone example components/drop-zone/examples/example.example components/drop-zone hellDropzone upload file' },
  { title: 'Drop Zone: Single File Images Only', path: '/components/drop-zone', section: 'Components', detail: 'components/drop-zone/examples/single-file-images-only.example.ts', terms: 'drop-zone single-file-images-only components/drop-zone/examples/single-file-images-only.example components/drop-zone hellDropzone image accept' },
  { title: 'Field: Horizontal', path: '/components/field', section: 'Components', detail: 'components/field/examples/horizontal.example.ts', terms: 'field horizontal components/field/examples/horizontal.example components/field hellField hellFieldLabel hellFieldDescription' },
  { title: 'Field: Vertical Default', path: '/components/field', section: 'Components', detail: 'components/field/examples/vertical-default.example.ts', terms: 'field vertical-default components/field/examples/vertical-default.example components/field hellField hellFieldLabel hellFieldError' },
  { title: 'Flyout: Example Boundary Keeps Siblings Interactive', path: '/components/flyout', section: 'Components', detail: 'components/flyout/examples/example-boundary-keeps-siblings-interactive.example.ts', terms: 'flyout example-boundary-keeps-siblings-interactive components/flyout/examples/example-boundary-keeps-siblings-interactive.example components/flyout hellFlyout hellFlyoutTrigger boundary' },
  { title: 'Icon: Example', path: '/components/icon', section: 'Components', detail: 'components/icon/examples/example.example.ts', terms: 'icon example components/icon/examples/example.example components/icon hell-icon' },
  { title: 'Icon: Registering Icons', path: '/components/icon', section: 'Components', detail: 'components/icon/examples/registering-icons.example.ts', terms: 'icon registering-icons components/icon/examples/registering-icons.example components/icon provideIcons hell-icon' },
  { title: 'Icon: Sizes', path: '/components/icon', section: 'Components', detail: 'components/icon/examples/sizes.example.ts', terms: 'icon sizes components/icon/examples/sizes.example components/icon hell-icon size' },
  { title: 'Input: Select', path: '/components/input', section: 'Components', detail: 'components/input/examples/select.example.ts', terms: 'input select components/input/examples/select.example components/input hellInput hellNativeSelect' },
  { title: 'Input: Sizes', path: '/components/input', section: 'Components', detail: 'components/input/examples/sizes.example.ts', terms: 'input sizes components/input/examples/sizes.example components/input hellInput size' },
  { title: 'Input: States', path: '/components/input', section: 'Components', detail: 'components/input/examples/states.example.ts', terms: 'input states components/input/examples/states.example components/input hellInput disabled invalid' },
  { title: 'Input: Textarea', path: '/components/input', section: 'Components', detail: 'components/input/examples/textarea.example.ts', terms: 'input textarea components/input/examples/textarea.example components/input hellTextarea' },
  { title: 'Listbox: Basic', path: '/components/listbox', section: 'Components', detail: 'components/listbox/examples/basic.example.ts', terms: 'listbox basic components/listbox/examples/basic.example components/listbox HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxHeader valueChange option' },
  { title: 'Menu: Basic', path: '/components/menu', section: 'Components', detail: 'components/menu/examples/basic.example.ts', terms: 'menu basic components/menu/examples/basic.example components/menu hellMenu hellMenuTrigger hellMenuItem' },
  { title: 'Menu: With Icons Sections Submenus', path: '/components/menu', section: 'Components', detail: 'components/menu/examples/with-icons-sections-submenus.example.ts', terms: 'menu with-icons-sections-submenus components/menu/examples/with-icons-sections-submenus.example components/menu hellMenu hellSubmenuTrigger hellMenuSection' },
  { title: 'Omnibar: Async Search', path: '/components/omnibar', section: 'Components', detail: 'components/omnibar/examples/async-search.example.ts', terms: 'omnibar async-search components/omnibar/examples/async-search.example components/omnibar hell-omnibar HELL_OMNIBAR_DIRECTIVES command palette backend async search searchSource searchFields ranking debounce' },
  { title: 'Pagination: Basic', path: '/components/pagination', section: 'Components', detail: 'components/pagination/examples/basic.example.ts', terms: 'pagination basic components/pagination/examples/basic.example components/pagination hell-pagination' },
  { title: 'Pagination: Larger Window', path: '/components/pagination', section: 'Components', detail: 'components/pagination/examples/larger-window.example.ts', terms: 'pagination larger-window components/pagination/examples/larger-window.example components/pagination hell-pagination' },
  { title: 'Pdf Viewer: Lazy Loading', path: '/components/pdf-viewer', section: 'Components', detail: 'components/pdf-viewer/examples/lazy-loading.example.ts', terms: 'pdf-viewer lazy-loading components/pdf-viewer/examples/lazy-loading.example components/pdf-viewer hell-pdf-viewer pdfjs lazy' },
  { title: 'Pdf Viewer: Live Demo', path: '/components/pdf-viewer', section: 'Components', detail: 'components/pdf-viewer/examples/live-demo.example.ts', terms: 'pdf-viewer live-demo components/pdf-viewer/examples/live-demo.example components/pdf-viewer hell-pdf-viewer pdfjs' },
  { title: 'Popover: Example', path: '/components/popover', section: 'Components', detail: 'components/popover/examples/example.example.ts', terms: 'popover example components/popover/examples/example.example components/popover hellPopover hellPopoverTrigger' },
  { title: 'Progress: Examples', path: '/components/progress', section: 'Components', detail: 'components/progress/examples/examples.example.ts', terms: 'progress examples components/progress/examples/examples.example components/progress hellProgress hellProgressBar' },
  { title: 'Progress: Interactive', path: '/components/progress', section: 'Components', detail: 'components/progress/examples/interactive.example.ts', terms: 'progress interactive components/progress/examples/interactive.example components/progress hellProgress value' },
  { title: 'Radio: Example', path: '/components/radio', section: 'Components', detail: 'components/radio/examples/example.example.ts', terms: 'radio example components/radio/examples/example.example components/radio hellRadioGroup hellRadio' },
  { title: 'Radio: Horizontal', path: '/components/radio', section: 'Components', detail: 'components/radio/examples/horizontal.example.ts', terms: 'radio horizontal components/radio/examples/horizontal.example components/radio hellRadioGroup hellRadio' },
  { title: 'Search: Basic', path: '/components/search', section: 'Components', detail: 'components/search/examples/basic.example.ts', terms: 'search basic components/search/examples/basic.example components/search HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear clear input local filtering' },
  { title: 'Resizable: Grip Handle 5', path: '/components/resizable', section: 'Components', detail: 'components/resizable/examples/grip-handle-5.example.ts', terms: 'resizable grip-handle-5 components/resizable/examples/grip-handle-5.example components/resizable hellResizable hellResizablePane hellResizableHandle' },
  { title: 'Resizable: Grip Handle', path: '/components/resizable', section: 'Components', detail: 'components/resizable/examples/grip-handle.example.ts', terms: 'resizable grip-handle components/resizable/examples/grip-handle.example components/resizable hellResizable hellResizableHandle' },
  { title: 'Resizable: Horizontal Split', path: '/components/resizable', section: 'Components', detail: 'components/resizable/examples/horizontal-split.example.ts', terms: 'resizable horizontal-split components/resizable/examples/horizontal-split.example components/resizable hellResizable horizontal' },
  { title: 'Resizable: Three Panes', path: '/components/resizable', section: 'Components', detail: 'components/resizable/examples/three-panes.example.ts', terms: 'resizable three-panes components/resizable/examples/three-panes.example components/resizable hellResizable panes' },
  { title: 'Resizable: Vertical Split', path: '/components/resizable', section: 'Components', detail: 'components/resizable/examples/vertical-split.example.ts', terms: 'resizable vertical-split components/resizable/examples/vertical-split.example components/resizable hellResizable vertical' },
  { title: 'Select: Basic', path: '/components/select', section: 'Components', detail: 'components/select/examples/basic.example.ts', terms: 'select basic components/select/examples/basic.example components/select hellSelect hellSelectOption hellSelectDropdown' },
  { title: 'Separator: Flush Inside A Card', path: '/components/separator', section: 'Components', detail: 'components/separator/examples/flush-inside-a-card.example.ts', terms: 'separator flush-inside-a-card components/separator/examples/flush-inside-a-card.example components/separator hellSeparator' },
  { title: 'Separator: Horizontal', path: '/components/separator', section: 'Components', detail: 'components/separator/examples/horizontal.example.ts', terms: 'separator horizontal components/separator/examples/horizontal.example components/separator hellSeparator horizontal' },
  { title: 'Separator: Spacing Options', path: '/components/separator', section: 'Components', detail: 'components/separator/examples/spacing-options.example.ts', terms: 'separator spacing-options components/separator/examples/spacing-options.example components/separator hellSeparator spacing' },
  { title: 'Separator: Vertical', path: '/components/separator', section: 'Components', detail: 'components/separator/examples/vertical.example.ts', terms: 'separator vertical components/separator/examples/vertical.example components/separator hellSeparator vertical' },
  { title: 'Skeleton: Avatar Lines', path: '/components/skeleton', section: 'Components', detail: 'components/skeleton/examples/avatar-lines.example.ts', terms: 'skeleton avatar-lines components/skeleton/examples/avatar-lines.example components/skeleton hellSkeleton loading' },
  { title: 'Skeleton: Card Placeholder', path: '/components/skeleton', section: 'Components', detail: 'components/skeleton/examples/card-placeholder.example.ts', terms: 'skeleton card-placeholder components/skeleton/examples/card-placeholder.example components/skeleton hellSkeleton card' },
  { title: 'Skeleton: Shapes', path: '/components/skeleton', section: 'Components', detail: 'components/skeleton/examples/shapes.example.ts', terms: 'skeleton shapes components/skeleton/examples/shapes.example components/skeleton hellSkeleton circle rect' },
  { title: 'Skeleton: Text Lines', path: '/components/skeleton', section: 'Components', detail: 'components/skeleton/examples/text-lines.example.ts', terms: 'skeleton text-lines components/skeleton/examples/text-lines.example components/skeleton hellSkeleton text' },
  { title: 'Split View: Master Detail', path: '/components/split-view', section: 'Components', detail: 'components/split-view/examples/master-detail.example.ts', terms: 'split-view master-detail components/split-view/examples/master-detail.example components/split-view hell-split-view HELL_SPLIT_VIEW_DIRECTIVES hellSplitPrimary hellSplitDetail responsive compact back detailOpen resizable' },
  { title: 'Slider: Basic', path: '/components/slider', section: 'Components', detail: 'components/slider/examples/basic.example.ts', terms: 'slider basic components/slider/examples/basic.example components/slider hell-slider' },
  { title: 'Slider: Disabled', path: '/components/slider', section: 'Components', detail: 'components/slider/examples/disabled.example.ts', terms: 'slider disabled components/slider/examples/disabled.example components/slider hell-slider disabled' },
  { title: 'Slider: Hover Revealed Thumb', path: '/components/slider', section: 'Components', detail: 'components/slider/examples/hover-revealed-thumb.example.ts', terms: 'slider hover-revealed-thumb components/slider/examples/hover-revealed-thumb.example components/slider hell-slider thumb' },
  { title: 'Slider: Sizes', path: '/components/slider', section: 'Components', detail: 'components/slider/examples/sizes.example.ts', terms: 'slider sizes components/slider/examples/sizes.example components/slider hell-slider size' },
  { title: 'Slider: Vertical', path: '/components/slider', section: 'Components', detail: 'components/slider/examples/vertical.example.ts', terms: 'slider vertical components/slider/examples/vertical.example components/slider hell-slider vertical' },
  { title: 'Spinner: Colour', path: '/components/spinner', section: 'Components', detail: 'components/spinner/examples/colour.example.ts', terms: 'spinner colour components/spinner/examples/colour.example components/spinner hellSpinner color' },
  { title: 'Spinner: Inside A Button', path: '/components/spinner', section: 'Components', detail: 'components/spinner/examples/inside-a-button.example.ts', terms: 'spinner inside-a-button components/spinner/examples/inside-a-button.example components/spinner hellSpinner hellButton' },
  { title: 'Spinner: Sizes', path: '/components/spinner', section: 'Components', detail: 'components/spinner/examples/sizes.example.ts', terms: 'spinner sizes components/spinner/examples/sizes.example components/spinner hellSpinner size' },
  { title: 'Spinner: Variants', path: '/components/spinner', section: 'Components', detail: 'components/spinner/examples/variants.example.ts', terms: 'spinner variants components/spinner/examples/variants.example components/spinner hellSpinner variant' },
  { title: 'Switch: Examples', path: '/components/switch', section: 'Components', detail: 'components/switch/examples/examples.example.ts', terms: 'switch examples components/switch/examples/examples.example components/switch hellSwitch' },
  { title: 'Tabs: Example', path: '/components/tabs', section: 'Components', detail: 'components/tabs/examples/example.example.ts', terms: 'tabs example components/tabs/examples/example.example components/tabs hellTabset hellTab hellTabPanel' },
  { title: 'Tabs: Vertical', path: '/components/tabs', section: 'Components', detail: 'components/tabs/examples/vertical.example.ts', terms: 'tabs vertical components/tabs/examples/vertical.example components/tabs hellTabset vertical' },
  { title: 'Tag: Badge', path: '/components/tag', section: 'Components', detail: 'components/tag/examples/badge.example.ts', terms: 'tag badge components/tag/examples/badge.example components/tag hellTag hellBadge' },
  { title: 'Tag: Keyboard Hint', path: '/components/tag', section: 'Components', detail: 'components/tag/examples/keyboard-hint.example.ts', terms: 'tag keyboard-hint components/tag/examples/keyboard-hint.example components/tag hellKbd keyboard' },
  { title: 'Tag: Tag Variants', path: '/components/tag', section: 'Components', detail: 'components/tag/examples/tag-variants.example.ts', terms: 'tag tag-variants components/tag/examples/tag-variants.example components/tag hellTag variant' },
  { title: 'Time Input: Examples', path: '/components/time-input', section: 'Components', detail: 'components/time-input/examples/examples.example.ts', terms: 'time-input examples components/time-input/examples/examples.example components/time-input hell-time-input' },
  { title: 'Time Input: Placeholder And Labels', path: '/components/time-input', section: 'Components', detail: 'components/time-input/examples/placeholder-and-labels.example.ts', terms: 'time-input placeholder-and-labels components/time-input/examples/placeholder-and-labels.example components/time-input hell-time-input placeholder label' },
  { title: 'Time Input: Sizes', path: '/components/time-input', section: 'Components', detail: 'components/time-input/examples/sizes.example.ts', terms: 'time-input sizes components/time-input/examples/sizes.example components/time-input hell-time-input size' },
  { title: 'Toast: Action', path: '/components/toast', section: 'Components', detail: 'components/toast/examples/action.example.ts', terms: 'toast action components/toast/examples/action.example components/toast hell-toaster toast action' },
  { title: 'Toast: Persistent Custom Content', path: '/components/toast', section: 'Components', detail: 'components/toast/examples/persistent-custom-content.example.ts', terms: 'toast persistent-custom-content components/toast/examples/persistent-custom-content.example components/toast hell-toaster persistent' },
  { title: 'Toast: Stacking', path: '/components/toast', section: 'Components', detail: 'components/toast/examples/stacking.example.ts', terms: 'toast stacking components/toast/examples/stacking.example components/toast hell-toaster stacking' },
  { title: 'Toast: Variants', path: '/components/toast', section: 'Components', detail: 'components/toast/examples/variants.example.ts', terms: 'toast variants components/toast/examples/variants.example components/toast hell-toaster variant' },
  { title: 'Toggle: Disabled', path: '/components/toggle', section: 'Components', detail: 'components/toggle/examples/disabled.example.ts', terms: 'toggle disabled components/toggle/examples/disabled.example components/toggle hellToggle disabled' },
  { title: 'Toggle: Single Toggle', path: '/components/toggle', section: 'Components', detail: 'components/toggle/examples/single-toggle.example.ts', terms: 'toggle single-toggle components/toggle/examples/single-toggle.example components/toggle hellToggle' },
  { title: 'Toggle: Toggle Group Multiple', path: '/components/toggle', section: 'Components', detail: 'components/toggle/examples/toggle-group-multiple.example.ts', terms: 'toggle toggle-group-multiple components/toggle/examples/toggle-group-multiple.example components/toggle hellToggleGroup multiple' },
  { title: 'Toggle: Toggle Group Single', path: '/components/toggle', section: 'Components', detail: 'components/toggle/examples/toggle-group-single.example.ts', terms: 'toggle toggle-group-single components/toggle/examples/toggle-group-single.example components/toggle hellToggleGroup single' },
  { title: 'Tooltip: Example', path: '/components/tooltip', section: 'Components', detail: 'components/tooltip/examples/example.example.ts', terms: 'tooltip example components/tooltip/examples/example.example components/tooltip hellTooltip hellTooltipTrigger' },
  { title: 'Tooltip: With Delay', path: '/components/tooltip', section: 'Components', detail: 'components/tooltip/examples/with-delay.example.ts', terms: 'tooltip with-delay components/tooltip/examples/with-delay.example components/tooltip hellTooltip delay' },
  { title: 'Getting Started: Button Demo', path: '/getting-started', section: 'Getting Started', detail: 'getting-started/examples/button-demo.example.ts', terms: 'getting-started button-demo getting-started/examples/button-demo.example getting-started install styles hellButton' },
  { title: 'Theming: Scoped Theme Demo', path: '/theming', section: 'Theming', detail: 'theming/examples/scoped-theme-demo.example.ts', terms: 'theming scoped-theme-demo theming/examples/scoped-theme-demo.example theming data-hell-theme data-hell-palette tokens' },
];

export const HD_DOCS_CODE_USAGES: readonly DocsSearchSeed[] = [
  { title: 'Omnibar directives', path: '/components/omnibar', section: 'Composites', detail: 'hell-omnibar, hellOmnibarItem, hellOmnibarAction', terms: 'hell-omnibar HellOmnibar HELL_OMNIBAR_DIRECTIVES hellOmnibar hellOmnibarItem hellOmnibarAction hellOmnibarGroup command palette async search ranking debounce skeleton searchSource' },
  { title: 'Search primitives', path: '/components/search', section: 'Primitives', detail: 'hellSearch, hellSearchClear', terms: 'HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear search primitive clear input' },
  { title: 'Listbox primitives', path: '/components/listbox', section: 'Primitives', detail: 'hellListbox, hellListboxOption, hellListboxHeader', terms: 'HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxSection hellListboxHeader value valueChange mode' },
  { title: 'Split view directives', path: '/components/split-view', section: 'Composites', detail: 'hell-split-view, hellSplitPrimary, hellSplitDetail', terms: 'HELL_SPLIT_VIEW_DIRECTIVES hell-split-view hellSplitPrimary hellSplitDetail compactBelow detailOpen detailOpenChange responsive resizable panes' },
  { title: 'Data table directives', path: '/components/data-table', section: 'Features', detail: 'hellTable, hellTableRow, hellTableHeaderCell, hellTableColumnResizer', terms: 'HELL_TABLE_DIRECTIVES hellTableContainer hellTable hellTableHead hellTableBody hellTableRow hellTableHeaderCell hellTableCell hellTableColumnResizer' },
  { title: 'App shell slots', path: '/components/app-shell', section: 'Composites', detail: 'hellAppShell, hellAppTopbar, hellAppSidenav, hellAppContent', terms: 'HELL_APP_SHELL_DIRECTIVES hellAppShell hellAppTopbar hellAppSidenav hellAppContent hellAppSecondary hellSidenavToggle hellSecondaryToggle' },
  { title: 'Menu and submenu triggers', path: '/components/menu', section: 'Primitives', detail: 'hellMenuTrigger, hellSubmenuTrigger, hellMenuItem', terms: 'HELL_MENU_DIRECTIVES hellMenuTrigger hellSubmenuTrigger hellMenu hellMenuItem hellMenuSection hellMenuLabel submenu' },
  { title: 'Select portal pattern', path: '/components/select', section: 'Primitives', detail: 'hellSelect with hellSelectPortal and hellSelectDropdown', terms: 'HELL_SELECT_DIRECTIVES hellSelect hellSelectValue hellSelectPortal hellSelectDropdown hellSelectOption valueChange' },
  { title: 'Combobox slots', path: '/components/combobox', section: 'Primitives', detail: 'hellComboboxInput, hellComboboxOption, hellComboboxEmpty', terms: 'HELL_COMBOBOX_DIRECTIVES hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty' },
  { title: 'Dialog scoping', path: '/components/dialog', section: 'Primitives', detail: 'hellDialogScope keeps overlays inside app content', terms: 'HELL_DIALOG_DIRECTIVES hellDialogTrigger hellDialogOverlay hellDialogScope hellDialog hellDialogTitle hellDialogDescription' },
  { title: 'Resizable panes', path: '/components/resizable', section: 'Composites', detail: 'hellResizablePane and hellResizableHandle compose split views', terms: 'HELL_RESIZABLE_DIRECTIVES hellResizable hellResizablePane hellResizableHandle horizontal vertical minSize initialFlex' },
  { title: 'Field anatomy', path: '/components/field', section: 'Primitives', detail: 'hellFieldLabel, hellFieldDescription, hellFieldError', terms: 'HELL_FIELD_DIRECTIVES hellField hellFieldLabel hellFieldDescription hellFieldError form field input aria' },
  { title: 'Tabs anatomy', path: '/components/tabs', section: 'Primitives', detail: 'hellTabset, hellTabList, hellTab, hellTabPanel', terms: 'HELL_TABS_DIRECTIVES hellTabset hellTabList hellTab hellTabPanel value vertical' },
];


export interface DocsNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly exact?: boolean;
}

export interface DocsNavSection {
  readonly heading?: string;
  readonly items: readonly DocsNavItem[];
}

export type DocsSearchKind = 'page' | 'example' | 'usage';
export type DocsSearchKindFilter = DocsSearchKind | 'all';

export interface DocsSearchItem {
  readonly id: string;
  readonly kind: DocsSearchKind;
  readonly title: string;
  readonly path: string;
  readonly icon: string;
  readonly section: string;
  readonly detail: string;
  readonly haystack: string;
}

export interface DocsSearchGroup {
  readonly kind: DocsSearchKind;
  readonly label: string;
  readonly items: readonly DocsSearchItem[];
}

interface DocsCatalogItem {
  readonly routePath: string;
  readonly label: string;
  readonly icon: string;
  readonly exact?: boolean;
  readonly loadComponent: NonNullable<Routes[number]['loadComponent']>;
}

interface DocsCatalogSection {
  readonly heading?: string;
  readonly items: readonly DocsCatalogItem[];
}

export const HD_DOCS_KIND_LABEL: Record<DocsSearchKind, string> = {
  page: 'Pages',
  example: 'Examples',
  usage: 'Code usage',
};

export const HD_DOCS_KIND_FILTER_LABEL: Record<DocsSearchKindFilter, string> = {
  all: 'All types',
  ...HD_DOCS_KIND_LABEL,
};

const HD_DOCS_KIND_ICON: Record<DocsSearchKind, string> = {
  page: 'faSolidBookOpen',
  example: 'faSolidFileLines',
  usage: 'faSolidCode',
};

const HD_DOCS_CATALOG_SECTIONS: readonly DocsCatalogSection[] = [
  {
    items: [
      {
        routePath: '',
        label: 'Overview',
        icon: 'faSolidHouse',
        exact: true,
        loadComponent: () => import('./pages/overview/overview.page').then((m) => m.OverviewPage),
      },
      {
        routePath: 'getting-started',
        label: 'Getting started',
        icon: 'faSolidRocket',
        loadComponent: () =>
          import('./pages/getting-started/getting-started.page').then((m) => m.GettingStartedPage),
      },
      {
        routePath: 'theming',
        label: 'Theming',
        icon: 'faSolidPalette',
        loadComponent: () => import('./pages/theming/theming.page').then((m) => m.ThemingPage),
      },
    ],
  },
  {
    heading: 'Primitives',
    items: [
      {
        routePath: 'components/accordion',
        label: 'Accordion',
        icon: 'faSolidLayerGroup',
        loadComponent: () =>
          import('./pages/components/accordion/accordion.page').then((m) => m.AccordionPage),
      },
      {
        routePath: 'components/avatar',
        label: 'Avatar',
        icon: 'faSolidUser',
        loadComponent: () =>
          import('./pages/components/avatar/avatar.page').then((m) => m.AvatarPage),
      },
      {
        routePath: 'components/breadcrumbs',
        label: 'Breadcrumbs',
        icon: 'faSolidSignsPost',
        loadComponent: () =>
          import('./pages/components/breadcrumbs/breadcrumbs.page').then((m) => m.BreadcrumbsPage),
      },
      {
        routePath: 'components/button',
        label: 'Button',
        icon: 'faSolidWindowMaximize',
        loadComponent: () =>
          import('./pages/components/button/button.page').then((m) => m.ButtonPage),
      },
      {
        routePath: 'components/card',
        label: 'Card',
        icon: 'faSolidIdCard',
        loadComponent: () => import('./pages/components/card/card.page').then((m) => m.CardPage),
      },
      {
        routePath: 'components/checkbox',
        label: 'Checkbox',
        icon: 'faSolidCheck',
        loadComponent: () =>
          import('./pages/components/checkbox/checkbox.page').then((m) => m.CheckboxPage),
      },
      {
        routePath: 'components/combobox',
        label: 'Combobox',
        icon: 'faSolidPenRuler',
        loadComponent: () =>
          import('./pages/components/combobox/combobox.page').then((m) => m.ComboboxPage),
      },
      {
        routePath: 'components/date-picker',
        label: 'Date picker',
        icon: 'faSolidCalendar',
        loadComponent: () =>
          import('./pages/components/date-picker/date-picker.page').then((m) => m.DatePickerPage),
      },
      {
        routePath: 'components/dialog',
        label: 'Dialog',
        icon: 'faSolidWindowRestore',
        loadComponent: () =>
          import('./pages/components/dialog/dialog.page').then((m) => m.DialogPage),
      },
      {
        routePath: 'components/field',
        label: 'Field',
        icon: 'faSolidPenToSquare',
        loadComponent: () => import('./pages/components/field/field.page').then((m) => m.FieldPage),
      },
      {
        routePath: 'components/flyout',
        label: 'Flyout',
        icon: 'faSolidComment',
        loadComponent: () =>
          import('./pages/components/flyout/flyout.page').then((m) => m.FlyoutPage),
      },
      {
        routePath: 'components/icon',
        label: 'Icon',
        icon: 'faSolidStar',
        loadComponent: () => import('./pages/components/icon/icon.page').then((m) => m.IconPage),
      },
      {
        routePath: 'components/input',
        label: 'Input & select',
        icon: 'faSolidPenRuler',
        loadComponent: () => import('./pages/components/input/input.page').then((m) => m.InputPage),
      },
      {
        routePath: 'components/listbox',
        label: 'Listbox',
        icon: 'faSolidBars',
        loadComponent: () =>
          import('./pages/components/listbox/listbox.page').then((m) => m.ListboxPage),
      },
      {
        routePath: 'components/menu',
        label: 'Menu',
        icon: 'faSolidEllipsisVertical',
        loadComponent: () => import('./pages/components/menu/menu.page').then((m) => m.MenuPage),
      },
      {
        routePath: 'components/pagination',
        label: 'Pagination',
        icon: 'faSolidTableColumns',
        loadComponent: () =>
          import('./pages/components/pagination/pagination.page').then((m) => m.PaginationPage),
      },
      {
        routePath: 'components/popover',
        label: 'Popover',
        icon: 'faSolidComment',
        loadComponent: () =>
          import('./pages/components/popover/popover.page').then((m) => m.PopoverPage),
      },
      {
        routePath: 'components/progress',
        label: 'Progress',
        icon: 'faSolidSliders',
        loadComponent: () =>
          import('./pages/components/progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        routePath: 'components/radio',
        label: 'Radio',
        icon: 'faSolidCircleHalfStroke',
        loadComponent: () => import('./pages/components/radio/radio.page').then((m) => m.RadioPage),
      },
      {
        routePath: 'components/search',
        label: 'Search',
        icon: 'faSolidMagnifyingGlass',
        loadComponent: () =>
          import('./pages/components/search/search.page').then((m) => m.SearchPage),
      },
      {
        routePath: 'components/select',
        label: 'Select',
        icon: 'faSolidPenRuler',
        loadComponent: () =>
          import('./pages/components/select/select.page').then((m) => m.SelectPage),
      },
      {
        routePath: 'components/separator',
        label: 'Separator',
        icon: 'faSolidGripLines',
        loadComponent: () =>
          import('./pages/components/separator/separator.page').then((m) => m.SeparatorPage),
      },
      {
        routePath: 'components/skeleton',
        label: 'Skeleton',
        icon: 'faSolidImage',
        loadComponent: () =>
          import('./pages/components/skeleton/skeleton.page').then((m) => m.SkeletonPage),
      },
      {
        routePath: 'components/spinner',
        label: 'Spinner',
        icon: 'faSolidSpinner',
        loadComponent: () =>
          import('./pages/components/spinner/spinner.page').then((m) => m.SpinnerPage),
      },
      {
        routePath: 'components/slider',
        label: 'Slider',
        icon: 'faSolidSliders',
        loadComponent: () =>
          import('./pages/components/slider/slider.page').then((m) => m.SliderPage),
      },
      {
        routePath: 'components/switch',
        label: 'Switch',
        icon: 'faSolidToggleOn',
        loadComponent: () =>
          import('./pages/components/switch/switch.page').then((m) => m.SwitchPage),
      },
      {
        routePath: 'components/tabs',
        label: 'Tabs',
        icon: 'faSolidFolderOpen',
        loadComponent: () => import('./pages/components/tabs/tabs.page').then((m) => m.TabsPage),
      },
      {
        routePath: 'components/tag',
        label: 'Tag',
        icon: 'faSolidTag',
        loadComponent: () => import('./pages/components/tag/tag.page').then((m) => m.TagPage),
      },
      {
        routePath: 'components/toggle',
        label: 'Toggle',
        icon: 'faSolidToggleOn',
        loadComponent: () =>
          import('./pages/components/toggle/toggle.page').then((m) => m.TogglePage),
      },
      {
        routePath: 'components/tooltip',
        label: 'Tooltip',
        icon: 'faSolidQuestion',
        loadComponent: () =>
          import('./pages/components/tooltip/tooltip.page').then((m) => m.TooltipPage),
      },
    ],
  },
  {
    heading: 'Composites',
    items: [
      {
        routePath: 'components/app-shell',
        label: 'App shell',
        icon: 'faSolidTableColumns',
        loadComponent: () =>
          import('./pages/components/app-shell/app-shell.page').then((m) => m.AppShellPage),
      },
      {
        routePath: 'components/audio-player',
        label: 'Audio player',
        icon: 'faSolidPlay',
        loadComponent: () =>
          import('./pages/components/audio-player/audio-player.page').then(
            (m) => m.AudioPlayerPage,
          ),
      },
      {
        routePath: 'components/avatar-group',
        label: 'Avatar group',
        icon: 'faSolidUsers',
        loadComponent: () =>
          import('./pages/components/avatar-group/avatar-group.page').then(
            (m) => m.AvatarGroupPage,
          ),
      },
      {
        routePath: 'components/date-input',
        label: 'Date input',
        icon: 'faSolidCalendar',
        loadComponent: () =>
          import('./pages/components/date-input/date-input.page').then((m) => m.DateInputPage),
      },
      {
        routePath: 'components/dialpad',
        label: 'Dialpad',
        icon: 'faSolidPhone',
        loadComponent: () =>
          import('./pages/components/dialpad/dialpad.page').then((m) => m.DialpadPage),
      },
      {
        routePath: 'components/drop-zone',
        label: 'Drop zone',
        icon: 'faSolidUpload',
        loadComponent: () =>
          import('./pages/components/drop-zone/drop-zone.page').then((m) => m.DropZonePage),
      },
      {
        routePath: 'components/omnibar',
        label: 'Omnibar',
        icon: 'faSolidMagnifyingGlass',
        loadComponent: () =>
          import('./pages/components/omnibar/omnibar.page').then((m) => m.OmnibarPage),
      },
      {
        routePath: 'components/resizable',
        label: 'Resizable',
        icon: 'faSolidGripVertical',
        loadComponent: () =>
          import('./pages/components/resizable/resizable.page').then((m) => m.ResizablePage),
      },
      {
        routePath: 'components/split-view',
        label: 'Split view',
        icon: 'faSolidTableColumns',
        loadComponent: () =>
          import('./pages/components/split-view/split-view.page').then((m) => m.SplitViewPage),
      },
      {
        routePath: 'components/time-input',
        label: 'Time input',
        icon: 'faSolidClock',
        loadComponent: () =>
          import('./pages/components/time-input/time-input.page').then((m) => m.TimeInputPage),
      },
      {
        routePath: 'components/toast',
        label: 'Toast',
        icon: 'faSolidBell',
        loadComponent: () => import('./pages/components/toast/toast.page').then((m) => m.ToastPage),
      },
    ],
  },
  {
    heading: 'Features',
    items: [
      {
        routePath: 'components/code-editor',
        label: 'Code editor',
        icon: 'faSolidCode',
        loadComponent: () =>
          import('./pages/components/code-editor/code-editor.page').then((m) => m.CodeEditorPage),
      },
      {
        routePath: 'components/data-table',
        label: 'Data table',
        icon: 'faSolidTable',
        loadComponent: () =>
          import('./pages/components/data-table/data-table.page').then((m) => m.DataTablePage),
      },
      {
        routePath: 'components/pdf-viewer',
        label: 'PDF viewer',
        icon: 'faSolidFilePdf',
        loadComponent: () =>
          import('./pages/components/pdf-viewer/pdf-viewer.page').then((m) => m.PdfViewerPage),
      },
    ],
  },
];

export const HD_DOCS_SECTIONS: readonly DocsNavSection[] = HD_DOCS_CATALOG_SECTIONS.map(
  (section) => ({
    ...(section.heading ? { heading: section.heading } : {}),
    items: section.items.map((item) => ({
      path: item.routePath ? `/${item.routePath}` : '/',
      label: item.label,
      icon: item.icon,
      ...(item.exact ? { exact: item.exact } : {}),
    })),
  }),
);

export const HD_DOCS_ROUTES: Routes = [
  ...HD_DOCS_CATALOG_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      path: item.routePath,
      loadComponent: item.loadComponent,
    })),
  ),
  { path: '**', redirectTo: '' },
];

export function hdBuildDocsSearchIndex(
  sections: readonly DocsNavSection[] = HD_DOCS_SECTIONS,
): readonly DocsSearchItem[] {
  const pageItems = sections.flatMap((section) => {
    const sectionName = section.heading ?? 'Guides';
    return section.items.map((item) => ({
      id: `page:${item.path}`,
      kind: 'page' as const,
      title: item.label,
      path: item.path,
      icon: item.icon,
      section: sectionName,
      detail: `${sectionName} page`,
      haystack: searchHaystack(item.label, item.path, sectionName),
    }));
  });
  const exampleItems = HD_DOCS_EXAMPLES.map((item) => ({
    id: `example:${item.detail}`,
    kind: 'example' as const,
    title: item.title,
    path: item.path,
    icon: HD_DOCS_KIND_ICON.example,
    section: item.section,
    detail: item.detail,
    haystack: searchHaystack(item.title, item.path, item.section, item.detail, item.terms),
  }));
  const usageItems = HD_DOCS_CODE_USAGES.map((item) => ({
    id: `usage:${item.title}`,
    kind: 'usage' as const,
    title: item.title,
    path: item.path,
    icon: HD_DOCS_KIND_ICON.usage,
    section: item.section,
    detail: item.detail,
    haystack: searchHaystack(item.title, item.path, item.section, item.detail, item.terms),
  }));

  return [...pageItems, ...exampleItems, ...usageItems];
}

function searchHaystack(...parts: readonly string[]): string {
  return parts.map(searchKey).join(' ');
}

function searchKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
