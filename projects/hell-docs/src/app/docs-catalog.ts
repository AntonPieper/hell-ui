import { Routes } from '@angular/router';
import { hellSearchKey } from 'hell/core';

export interface DocsSearchSeed {
  readonly title: string;
  readonly path: string;
  readonly section: string;
  readonly detail: string;
  readonly terms: string;
}

interface DocsCatalogSearchSeed {
  readonly title: string;
  readonly detail: string;
  readonly terms?: string;
}

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
  readonly examples?: readonly DocsCatalogSearchSeed[];
  readonly usages?: readonly DocsCatalogSearchSeed[];
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

export const HD_DOCS_KIND_FILTER_OPTIONS: readonly DocsSearchKindFilter[] = [
  'all',
  'page',
  'example',
  'usage',
];

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
        examples: [
          {
            title: 'Getting Started: Button Demo',
            detail: 'getting-started/examples/button-demo.example.ts',
            terms:
              'getting-started button-demo getting-started/examples/button-demo.example getting-started install styles hellButton',
          },
        ],
        loadComponent: () =>
          import('./pages/getting-started/getting-started.page').then((m) => m.GettingStartedPage),
      },
      {
        routePath: 'theming',
        label: 'Theming',
        icon: 'faSolidPalette',
        examples: [
          {
            title: 'Theming: Scoped Theme Demo',
            detail: 'theming/examples/scoped-theme-demo.example.ts',
            terms:
              'theming scoped-theme-demo theming/examples/scoped-theme-demo.example theming data-hell-theme data-hell-palette tokens',
          },
        ],
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
        examples: [
          {
            title: 'Accordion: Multiple',
            detail: 'components/accordion/examples/multiple.example.ts',
            terms:
              'accordion multiple components/accordion/examples/multiple.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
          },
          {
            title: 'Accordion: Single Collapsible',
            detail: 'components/accordion/examples/single-collapsible.example.ts',
            terms:
              'accordion single-collapsible components/accordion/examples/single-collapsible.example components/accordion hellAccordion hellAccordionItem hellAccordionTrigger',
          },
        ],
        loadComponent: () =>
          import('./pages/components/accordion/accordion.page').then((m) => m.AccordionPage),
      },
      {
        routePath: 'components/avatar',
        label: 'Avatar',
        icon: 'faSolidUser',
        examples: [
          {
            title: 'Avatar: Sizes',
            detail: 'components/avatar/examples/sizes.example.ts',
            terms:
              'avatar sizes components/avatar/examples/sizes.example components/avatar hell-avatar',
          },
          {
            title: 'Avatar: Square Shape',
            detail: 'components/avatar/examples/square-shape.example.ts',
            terms:
              'avatar square-shape components/avatar/examples/square-shape.example components/avatar hell-avatar',
          },
          {
            title: 'Avatar: With Image',
            detail: 'components/avatar/examples/with-image.example.ts',
            terms:
              'avatar with-image components/avatar/examples/with-image.example components/avatar hell-avatar',
          },
        ],
        loadComponent: () =>
          import('./pages/components/avatar/avatar.page').then((m) => m.AvatarPage),
      },
      {
        routePath: 'components/breadcrumbs',
        label: 'Breadcrumbs',
        icon: 'faSolidSignsPost',
        examples: [
          {
            title: 'Breadcrumbs: Custom Separator',
            detail: 'components/breadcrumbs/examples/custom-separator.example.ts',
            terms:
              'breadcrumbs custom-separator components/breadcrumbs/examples/custom-separator.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbItem',
          },
          {
            title: 'Breadcrumbs: Long Path With Ellipsis',
            detail: 'components/breadcrumbs/examples/long-path-with-ellipsis.example.ts',
            terms:
              'breadcrumbs long-path-with-ellipsis components/breadcrumbs/examples/long-path-with-ellipsis.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbEllipsis',
          },
          {
            title: 'Breadcrumbs: Standard',
            detail: 'components/breadcrumbs/examples/standard.example.ts',
            terms:
              'breadcrumbs standard components/breadcrumbs/examples/standard.example components/breadcrumbs hellBreadcrumbs hellBreadcrumbLink',
          },
          {
            title: 'Breadcrumbs: With Icons',
            detail: 'components/breadcrumbs/examples/with-icons.example.ts',
            terms:
              'breadcrumbs with-icons components/breadcrumbs/examples/with-icons.example components/breadcrumbs hellBreadcrumbs hell-icon',
          },
        ],
        loadComponent: () =>
          import('./pages/components/breadcrumbs/breadcrumbs.page').then((m) => m.BreadcrumbsPage),
      },
      {
        routePath: 'components/button',
        label: 'Button',
        icon: 'faSolidWindowMaximize',
        examples: [
          {
            title: 'Button: Block',
            detail: 'components/button/examples/block.example.ts',
            terms:
              'button block components/button/examples/block.example components/button hellButton',
          },
          {
            title: 'Button: Icon Only',
            detail: 'components/button/examples/icon-only.example.ts',
            terms:
              'button icon-only components/button/examples/icon-only.example components/button hellButton iconOnly',
          },
          {
            title: 'Button: Sizes',
            detail: 'components/button/examples/sizes.example.ts',
            terms:
              'button sizes components/button/examples/sizes.example components/button hellButton size',
          },
          {
            title: 'Button: Variants',
            detail: 'components/button/examples/variants.example.ts',
            terms:
              'button variants components/button/examples/variants.example components/button hellButton variant',
          },
          {
            title: 'Button: With Icons',
            detail: 'components/button/examples/with-icons.example.ts',
            terms:
              'button with-icons components/button/examples/with-icons.example components/button hellButton hell-icon',
          },
        ],
        loadComponent: () =>
          import('./pages/components/button/button.page').then((m) => m.ButtonPage),
      },
      {
        routePath: 'components/card',
        label: 'Card',
        icon: 'faSolidIdCard',
        examples: [
          {
            title: 'Card: Examples',
            detail: 'components/card/examples/examples.example.ts',
            terms:
              'card examples components/card/examples/examples.example components/card hellCard hellCardHeader hellCardBody',
          },
          {
            title: 'Card: With Footer',
            detail: 'components/card/examples/with-footer.example.ts',
            terms:
              'card with-footer components/card/examples/with-footer.example components/card hellCard hellCardFooter',
          },
          {
            title: 'Card: Without Header',
            detail: 'components/card/examples/without-header.example.ts',
            terms:
              'card without-header components/card/examples/without-header.example components/card hellCard',
          },
        ],
        loadComponent: () => import('./pages/components/card/card.page').then((m) => m.CardPage),
      },
      {
        routePath: 'components/checkbox',
        label: 'Checkbox',
        icon: 'faSolidCheck',
        examples: [
          {
            title: 'Checkbox: Examples',
            detail: 'components/checkbox/examples/examples.example.ts',
            terms:
              'checkbox examples components/checkbox/examples/examples.example components/checkbox hellCheckbox',
          },
        ],
        loadComponent: () =>
          import('./pages/components/checkbox/checkbox.page').then((m) => m.CheckboxPage),
      },
      {
        routePath: 'components/combobox',
        label: 'Combobox',
        icon: 'faSolidPenRuler',
        examples: [
          {
            title: 'Combobox: Basic',
            detail: 'components/combobox/examples/basic.example.ts',
            terms:
              'combobox basic components/combobox/examples/basic.example components/combobox hellCombobox hellComboboxInput hellComboboxOption',
          },
          {
            title: 'Combobox: Multiple',
            detail: 'components/combobox/examples/multiple.example.ts',
            terms:
              'combobox multiple components/combobox/examples/multiple.example components/combobox hellCombobox multiple',
          },
        ],
        usages: [
          {
            title: 'Combobox slots',
            detail: 'hellComboboxInput, hellComboboxOption, hellComboboxEmpty',
            terms:
              'HELL_COMBOBOX_DIRECTIVES hellCombobox hellComboboxInput hellComboboxButton hellComboboxDropdown hellComboboxOption hellComboboxEmpty',
          },
        ],
        loadComponent: () =>
          import('./pages/components/combobox/combobox.page').then((m) => m.ComboboxPage),
      },
      {
        routePath: 'components/date-picker',
        label: 'Date picker',
        icon: 'faSolidCalendar',
        examples: [
          {
            title: 'Date Picker: Bounded',
            detail: 'components/date-picker/examples/bounded.example.ts',
            terms:
              'date-picker bounded components/date-picker/examples/bounded.example components/date-picker hell-date-picker min max',
          },
          {
            title: 'Date Picker: Disabled',
            detail: 'components/date-picker/examples/disabled.example.ts',
            terms:
              'date-picker disabled components/date-picker/examples/disabled.example components/date-picker hell-date-picker disabled',
          },
          {
            title: 'Date Picker: Range',
            detail: 'components/date-picker/examples/range.example.ts',
            terms:
              'date-picker range components/date-picker/examples/range.example components/date-picker hell-date-picker range',
          },
          {
            title: 'Date Picker: Single Date',
            detail: 'components/date-picker/examples/single-date.example.ts',
            terms:
              'date-picker single-date components/date-picker/examples/single-date.example components/date-picker hell-date-picker',
          },
        ],
        loadComponent: () =>
          import('./pages/components/date-picker/date-picker.page').then((m) => m.DatePickerPage),
      },
      {
        routePath: 'components/dialog',
        label: 'Dialog',
        icon: 'faSolidWindowRestore',
        examples: [
          {
            title: 'Dialog: Example',
            detail: 'components/dialog/examples/example.example.ts',
            terms:
              'dialog example components/dialog/examples/example.example components/dialog hellDialog hellDialogTrigger hellDialogTitle',
          },
          {
            title: 'Dialog: Scoped To App Shell Content',
            detail: 'components/dialog/examples/scoped-to-app-shell-content.example.ts',
            terms:
              'dialog scoped-to-app-shell-content components/dialog/examples/scoped-to-app-shell-content.example components/dialog hellDialogScope hellAppContent',
          },
        ],
        usages: [
          {
            title: 'Dialog scoping',
            detail: 'hellDialogScope keeps overlays inside app content',
            terms:
              'HELL_DIALOG_DIRECTIVES hellDialogTrigger hellDialogOverlay hellDialogScope hellDialog hellDialogTitle hellDialogDescription',
          },
        ],
        loadComponent: () =>
          import('./pages/components/dialog/dialog.page').then((m) => m.DialogPage),
      },
      {
        routePath: 'components/field',
        label: 'Field',
        icon: 'faSolidPenToSquare',
        examples: [
          {
            title: 'Field: Horizontal',
            detail: 'components/field/examples/horizontal.example.ts',
            terms:
              'field horizontal components/field/examples/horizontal.example components/field hellField hellFieldLabel hellFieldDescription',
          },
          {
            title: 'Field: Vertical Default',
            detail: 'components/field/examples/vertical-default.example.ts',
            terms:
              'field vertical-default components/field/examples/vertical-default.example components/field hellField hellFieldLabel hellFieldError',
          },
        ],
        usages: [
          {
            title: 'Field anatomy',
            detail: 'hellFieldLabel, hellFieldDescription, hellFieldError',
            terms:
              'HELL_FIELD_DIRECTIVES hellField hellFieldLabel hellFieldDescription hellFieldError form field input aria',
          },
        ],
        loadComponent: () => import('./pages/components/field/field.page').then((m) => m.FieldPage),
      },
      {
        routePath: 'components/flyout',
        label: 'Flyout',
        icon: 'faSolidComment',
        examples: [
          {
            title: 'Flyout: Example Boundary Keeps Siblings Interactive',
            detail:
              'components/flyout/examples/example-boundary-keeps-siblings-interactive.example.ts',
            terms:
              'flyout example-boundary-keeps-siblings-interactive components/flyout/examples/example-boundary-keeps-siblings-interactive.example components/flyout hellFlyout hellFlyoutTrigger boundary',
          },
        ],
        loadComponent: () =>
          import('./pages/components/flyout/flyout.page').then((m) => m.FlyoutPage),
      },
      {
        routePath: 'components/icon',
        label: 'Icon',
        icon: 'faSolidStar',
        examples: [
          {
            title: 'Icon: Example',
            detail: 'components/icon/examples/example.example.ts',
            terms:
              'icon example components/icon/examples/example.example components/icon hell-icon',
          },
          {
            title: 'Icon: Registering Icons',
            detail: 'components/icon/examples/registering-icons.example.ts',
            terms:
              'icon registering-icons components/icon/examples/registering-icons.example components/icon provideIcons hell-icon',
          },
          {
            title: 'Icon: Sizes',
            detail: 'components/icon/examples/sizes.example.ts',
            terms:
              'icon sizes components/icon/examples/sizes.example components/icon hell-icon size',
          },
        ],
        loadComponent: () => import('./pages/components/icon/icon.page').then((m) => m.IconPage),
      },
      {
        routePath: 'components/input',
        label: 'Input & select',
        icon: 'faSolidPenRuler',
        examples: [
          {
            title: 'Input: Select',
            detail: 'components/input/examples/select.example.ts',
            terms:
              'input select components/input/examples/select.example components/input hellInput hellNativeSelect',
          },
          {
            title: 'Input: Sizes',
            detail: 'components/input/examples/sizes.example.ts',
            terms:
              'input sizes components/input/examples/sizes.example components/input hellInput size',
          },
          {
            title: 'Input: States',
            detail: 'components/input/examples/states.example.ts',
            terms:
              'input states components/input/examples/states.example components/input hellInput disabled invalid',
          },
          {
            title: 'Input: Textarea',
            detail: 'components/input/examples/textarea.example.ts',
            terms:
              'input textarea components/input/examples/textarea.example components/input hellTextarea',
          },
        ],
        loadComponent: () => import('./pages/components/input/input.page').then((m) => m.InputPage),
      },
      {
        routePath: 'components/listbox',
        label: 'Listbox',
        icon: 'faSolidBars',
        examples: [
          {
            title: 'Listbox: Basic',
            detail: 'components/listbox/examples/basic.example.ts',
            terms:
              'listbox basic components/listbox/examples/basic.example components/listbox HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxHeader valueChange option',
          },
        ],
        usages: [
          {
            title: 'Listbox primitives',
            detail: 'hellListbox, hellListboxOption, hellListboxHeader',
            terms:
              'HELL_LISTBOX_DIRECTIVES hellListbox hellListboxOption hellListboxSection hellListboxHeader value valueChange mode',
          },
        ],
        loadComponent: () =>
          import('./pages/components/listbox/listbox.page').then((m) => m.ListboxPage),
      },
      {
        routePath: 'components/menu',
        label: 'Menu',
        icon: 'faSolidEllipsisVertical',
        examples: [
          {
            title: 'Menu: Basic',
            detail: 'components/menu/examples/basic.example.ts',
            terms:
              'menu basic components/menu/examples/basic.example components/menu hellMenu hellMenuTrigger hellMenuItem',
          },
          {
            title: 'Menu: With Icons Sections Submenus',
            detail: 'components/menu/examples/with-icons-sections-submenus.example.ts',
            terms:
              'menu with-icons-sections-submenus components/menu/examples/with-icons-sections-submenus.example components/menu hellMenu hellSubmenuTrigger hellMenuSection',
          },
        ],
        usages: [
          {
            title: 'Menu and submenu triggers',
            detail: 'hellMenuTrigger, hellSubmenuTrigger, hellMenuItem',
            terms:
              'HELL_MENU_DIRECTIVES hellMenuTrigger hellSubmenuTrigger hellMenu hellMenuItem hellMenuSection hellMenuLabel submenu',
          },
        ],
        loadComponent: () => import('./pages/components/menu/menu.page').then((m) => m.MenuPage),
      },
      {
        routePath: 'components/pagination',
        label: 'Pagination',
        icon: 'faSolidTableColumns',
        examples: [
          {
            title: 'Pagination: Basic',
            detail: 'components/pagination/examples/basic.example.ts',
            terms:
              'pagination basic components/pagination/examples/basic.example components/pagination hell-pagination',
          },
          {
            title: 'Pagination: Larger Window',
            detail: 'components/pagination/examples/larger-window.example.ts',
            terms:
              'pagination larger-window components/pagination/examples/larger-window.example components/pagination hell-pagination',
          },
        ],
        loadComponent: () =>
          import('./pages/components/pagination/pagination.page').then((m) => m.PaginationPage),
      },
      {
        routePath: 'components/popover',
        label: 'Popover',
        icon: 'faSolidComment',
        examples: [
          {
            title: 'Popover: Example',
            detail: 'components/popover/examples/example.example.ts',
            terms:
              'popover example components/popover/examples/example.example components/popover hellPopover hellPopoverTrigger',
          },
        ],
        loadComponent: () =>
          import('./pages/components/popover/popover.page').then((m) => m.PopoverPage),
      },
      {
        routePath: 'components/progress',
        label: 'Progress',
        icon: 'faSolidSliders',
        examples: [
          {
            title: 'Progress: Examples',
            detail: 'components/progress/examples/examples.example.ts',
            terms:
              'progress examples components/progress/examples/examples.example components/progress hellProgress hellProgressBar',
          },
          {
            title: 'Progress: Interactive',
            detail: 'components/progress/examples/interactive.example.ts',
            terms:
              'progress interactive components/progress/examples/interactive.example components/progress hellProgress value',
          },
        ],
        loadComponent: () =>
          import('./pages/components/progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        routePath: 'components/radio',
        label: 'Radio',
        icon: 'faSolidCircleHalfStroke',
        examples: [
          {
            title: 'Radio: Example',
            detail: 'components/radio/examples/example.example.ts',
            terms:
              'radio example components/radio/examples/example.example components/radio hellRadioGroup hellRadio',
          },
          {
            title: 'Radio: Horizontal',
            detail: 'components/radio/examples/horizontal.example.ts',
            terms:
              'radio horizontal components/radio/examples/horizontal.example components/radio hellRadioGroup hellRadio',
          },
        ],
        loadComponent: () => import('./pages/components/radio/radio.page').then((m) => m.RadioPage),
      },
      {
        routePath: 'components/search',
        label: 'Search',
        icon: 'faSolidMagnifyingGlass',
        examples: [
          {
            title: 'Search: Basic',
            detail: 'components/search/examples/basic.example.ts',
            terms:
              'search basic components/search/examples/basic.example components/search HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear clear input local filtering',
          },
        ],
        usages: [
          {
            title: 'Search primitives',
            detail: 'hellSearch, hellSearchClear',
            terms: 'HELL_SEARCH_DIRECTIVES hellSearch hellSearchClear search primitive clear input',
          },
        ],
        loadComponent: () =>
          import('./pages/components/search/search.page').then((m) => m.SearchPage),
      },
      {
        routePath: 'components/select',
        label: 'Select',
        icon: 'faSolidPenRuler',
        examples: [
          {
            title: 'Select: Basic',
            detail: 'components/select/examples/basic.example.ts',
            terms:
              'select basic components/select/examples/basic.example components/select hellSelect hellSelectOption hellSelectDropdown',
          },
        ],
        usages: [
          {
            title: 'Select portal pattern',
            detail: 'hellSelect with hellSelectPortal and hellSelectDropdown',
            terms:
              'HELL_SELECT_DIRECTIVES hellSelect hellSelectValue hellSelectPortal hellSelectDropdown hellSelectOption valueChange',
          },
        ],
        loadComponent: () =>
          import('./pages/components/select/select.page').then((m) => m.SelectPage),
      },
      {
        routePath: 'components/separator',
        label: 'Separator',
        icon: 'faSolidGripLines',
        examples: [
          {
            title: 'Separator: Flush Inside A Card',
            detail: 'components/separator/examples/flush-inside-a-card.example.ts',
            terms:
              'separator flush-inside-a-card components/separator/examples/flush-inside-a-card.example components/separator hellSeparator',
          },
          {
            title: 'Separator: Horizontal',
            detail: 'components/separator/examples/horizontal.example.ts',
            terms:
              'separator horizontal components/separator/examples/horizontal.example components/separator hellSeparator horizontal',
          },
          {
            title: 'Separator: Spacing Options',
            detail: 'components/separator/examples/spacing-options.example.ts',
            terms:
              'separator spacing-options components/separator/examples/spacing-options.example components/separator hellSeparator spacing',
          },
          {
            title: 'Separator: Vertical',
            detail: 'components/separator/examples/vertical.example.ts',
            terms:
              'separator vertical components/separator/examples/vertical.example components/separator hellSeparator vertical',
          },
        ],
        loadComponent: () =>
          import('./pages/components/separator/separator.page').then((m) => m.SeparatorPage),
      },
      {
        routePath: 'components/skeleton',
        label: 'Skeleton',
        icon: 'faSolidImage',
        examples: [
          {
            title: 'Skeleton: Avatar Lines',
            detail: 'components/skeleton/examples/avatar-lines.example.ts',
            terms:
              'skeleton avatar-lines components/skeleton/examples/avatar-lines.example components/skeleton hellSkeleton loading',
          },
          {
            title: 'Skeleton: Card Placeholder',
            detail: 'components/skeleton/examples/card-placeholder.example.ts',
            terms:
              'skeleton card-placeholder components/skeleton/examples/card-placeholder.example components/skeleton hellSkeleton card',
          },
          {
            title: 'Skeleton: Shapes',
            detail: 'components/skeleton/examples/shapes.example.ts',
            terms:
              'skeleton shapes components/skeleton/examples/shapes.example components/skeleton hellSkeleton circle rect',
          },
          {
            title: 'Skeleton: Text Lines',
            detail: 'components/skeleton/examples/text-lines.example.ts',
            terms:
              'skeleton text-lines components/skeleton/examples/text-lines.example components/skeleton hellSkeleton text',
          },
        ],
        loadComponent: () =>
          import('./pages/components/skeleton/skeleton.page').then((m) => m.SkeletonPage),
      },
      {
        routePath: 'components/spinner',
        label: 'Spinner',
        icon: 'faSolidSpinner',
        examples: [
          {
            title: 'Spinner: Colour',
            detail: 'components/spinner/examples/colour.example.ts',
            terms:
              'spinner colour components/spinner/examples/colour.example components/spinner hellSpinner color',
          },
          {
            title: 'Spinner: Inside A Button',
            detail: 'components/spinner/examples/inside-a-button.example.ts',
            terms:
              'spinner inside-a-button components/spinner/examples/inside-a-button.example components/spinner hellSpinner hellButton',
          },
          {
            title: 'Spinner: Sizes',
            detail: 'components/spinner/examples/sizes.example.ts',
            terms:
              'spinner sizes components/spinner/examples/sizes.example components/spinner hellSpinner size',
          },
          {
            title: 'Spinner: Variants',
            detail: 'components/spinner/examples/variants.example.ts',
            terms:
              'spinner variants components/spinner/examples/variants.example components/spinner hellSpinner variant',
          },
        ],
        loadComponent: () =>
          import('./pages/components/spinner/spinner.page').then((m) => m.SpinnerPage),
      },
      {
        routePath: 'components/slider',
        label: 'Slider',
        icon: 'faSolidSliders',
        examples: [
          {
            title: 'Slider: Basic',
            detail: 'components/slider/examples/basic.example.ts',
            terms:
              'slider basic components/slider/examples/basic.example components/slider hell-slider',
          },
          {
            title: 'Slider: Disabled',
            detail: 'components/slider/examples/disabled.example.ts',
            terms:
              'slider disabled components/slider/examples/disabled.example components/slider hell-slider disabled',
          },
          {
            title: 'Slider: Hover Revealed Thumb',
            detail: 'components/slider/examples/hover-revealed-thumb.example.ts',
            terms:
              'slider hover-revealed-thumb components/slider/examples/hover-revealed-thumb.example components/slider hell-slider thumb',
          },
          {
            title: 'Slider: Sizes',
            detail: 'components/slider/examples/sizes.example.ts',
            terms:
              'slider sizes components/slider/examples/sizes.example components/slider hell-slider size',
          },
          {
            title: 'Slider: Vertical',
            detail: 'components/slider/examples/vertical.example.ts',
            terms:
              'slider vertical components/slider/examples/vertical.example components/slider hell-slider vertical',
          },
        ],
        loadComponent: () =>
          import('./pages/components/slider/slider.page').then((m) => m.SliderPage),
      },
      {
        routePath: 'components/switch',
        label: 'Switch',
        icon: 'faSolidToggleOn',
        examples: [
          {
            title: 'Switch: Examples',
            detail: 'components/switch/examples/examples.example.ts',
            terms:
              'switch examples components/switch/examples/examples.example components/switch hellSwitch',
          },
        ],
        loadComponent: () =>
          import('./pages/components/switch/switch.page').then((m) => m.SwitchPage),
      },
      {
        routePath: 'components/tabs',
        label: 'Tabs',
        icon: 'faSolidFolderOpen',
        examples: [
          {
            title: 'Tabs: Example',
            detail: 'components/tabs/examples/example.example.ts',
            terms:
              'tabs example components/tabs/examples/example.example components/tabs hellTabset hellTab hellTabPanel',
          },
          {
            title: 'Tabs: Vertical',
            detail: 'components/tabs/examples/vertical.example.ts',
            terms:
              'tabs vertical components/tabs/examples/vertical.example components/tabs hellTabset vertical',
          },
        ],
        usages: [
          {
            title: 'Tabs anatomy',
            detail: 'hellTabset, hellTabList, hellTab, hellTabPanel',
            terms:
              'HELL_TABS_DIRECTIVES hellTabset hellTabList hellTab hellTabPanel value vertical',
          },
        ],
        loadComponent: () => import('./pages/components/tabs/tabs.page').then((m) => m.TabsPage),
      },
      {
        routePath: 'components/tag',
        label: 'Tag',
        icon: 'faSolidTag',
        examples: [
          {
            title: 'Tag: Badge',
            detail: 'components/tag/examples/badge.example.ts',
            terms:
              'tag badge components/tag/examples/badge.example components/tag hellTag hellBadge',
          },
          {
            title: 'Tag: Keyboard Hint',
            detail: 'components/tag/examples/keyboard-hint.example.ts',
            terms:
              'tag keyboard-hint components/tag/examples/keyboard-hint.example components/tag hellKbd keyboard',
          },
          {
            title: 'Tag: Tag Variants',
            detail: 'components/tag/examples/tag-variants.example.ts',
            terms:
              'tag tag-variants components/tag/examples/tag-variants.example components/tag hellTag variant',
          },
        ],
        loadComponent: () => import('./pages/components/tag/tag.page').then((m) => m.TagPage),
      },
      {
        routePath: 'components/toggle',
        label: 'Toggle',
        icon: 'faSolidToggleOn',
        examples: [
          {
            title: 'Toggle: Disabled',
            detail: 'components/toggle/examples/disabled.example.ts',
            terms:
              'toggle disabled components/toggle/examples/disabled.example components/toggle hellToggle disabled',
          },
          {
            title: 'Toggle: Single Toggle',
            detail: 'components/toggle/examples/single-toggle.example.ts',
            terms:
              'toggle single-toggle components/toggle/examples/single-toggle.example components/toggle hellToggle',
          },
          {
            title: 'Toggle: Toggle Group Multiple',
            detail: 'components/toggle/examples/toggle-group-multiple.example.ts',
            terms:
              'toggle toggle-group-multiple components/toggle/examples/toggle-group-multiple.example components/toggle hellToggleGroup multiple',
          },
          {
            title: 'Toggle: Toggle Group Single',
            detail: 'components/toggle/examples/toggle-group-single.example.ts',
            terms:
              'toggle toggle-group-single components/toggle/examples/toggle-group-single.example components/toggle hellToggleGroup single',
          },
        ],
        loadComponent: () =>
          import('./pages/components/toggle/toggle.page').then((m) => m.TogglePage),
      },
      {
        routePath: 'components/tooltip',
        label: 'Tooltip',
        icon: 'faSolidQuestion',
        examples: [
          {
            title: 'Tooltip: Example',
            detail: 'components/tooltip/examples/example.example.ts',
            terms:
              'tooltip example components/tooltip/examples/example.example components/tooltip hellTooltip hellTooltipTrigger',
          },
          {
            title: 'Tooltip: With Delay',
            detail: 'components/tooltip/examples/with-delay.example.ts',
            terms:
              'tooltip with-delay components/tooltip/examples/with-delay.example components/tooltip hellTooltip delay',
          },
        ],
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
        examples: [
          {
            title: 'App Shell: Live Miniature',
            detail: 'components/app-shell/examples/live-miniature.example.ts',
            terms:
              'app-shell live-miniature components/app-shell/examples/live-miniature.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
          },
          {
            title: 'App Shell: Markup Skeleton',
            detail: 'components/app-shell/examples/markup-skeleton.example.ts',
            terms:
              'app-shell markup-skeleton components/app-shell/examples/markup-skeleton.example components/app-shell hellAppShell hellAppTopbar hellAppSidenav hellAppContent',
          },
        ],
        usages: [
          {
            title: 'App shell slots',
            detail: 'hellAppShell, hellAppTopbar, hellAppSidenav, hellAppContent',
            terms:
              'HELL_APP_SHELL_DIRECTIVES hellAppShell hellAppTopbar hellAppSidenav hellAppContent hellAppSecondary hellSidenavToggle hellSecondaryToggle',
          },
        ],
        loadComponent: () =>
          import('./pages/components/app-shell/app-shell.page').then((m) => m.AppShellPage),
      },
      {
        routePath: 'components/audio-player',
        label: 'Audio player',
        icon: 'faSolidPlay',
        examples: [
          {
            title: 'Audio Player: Live Captions',
            detail: 'components/audio-player/examples/live-captions.example.ts',
            terms:
              'audio-player live-captions components/audio-player/examples/live-captions.example components/audio-player hell-audio-player',
          },
          {
            title: 'Audio Player: Untitled Controls Only',
            detail: 'components/audio-player/examples/untitled-controls-only.example.ts',
            terms:
              'audio-player untitled-controls-only components/audio-player/examples/untitled-controls-only.example components/audio-player hell-audio-player',
          },
          {
            title: 'Audio Player: With Title And Date',
            detail: 'components/audio-player/examples/with-title-and-date.example.ts',
            terms:
              'audio-player with-title-and-date components/audio-player/examples/with-title-and-date.example components/audio-player hell-audio-player',
          },
        ],
        loadComponent: () =>
          import('./pages/components/audio-player/audio-player.page').then(
            (m) => m.AudioPlayerPage,
          ),
      },
      {
        routePath: 'components/avatar-group',
        label: 'Avatar group',
        icon: 'faSolidUsers',
        examples: [
          {
            title: 'Avatar Group: Basic',
            detail: 'components/avatar-group/examples/basic.example.ts',
            terms:
              'avatar-group basic components/avatar-group/examples/basic.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
          },
          {
            title: 'Avatar Group: Interaction Hooks',
            detail: 'components/avatar-group/examples/interaction-hooks.example.ts',
            terms:
              'avatar-group interaction-hooks components/avatar-group/examples/interaction-hooks.example components/avatar-group hellAvatarGroup hellAvatarGroupItem',
          },
          {
            title: 'Avatar Group: Overflow Menu',
            detail: 'components/avatar-group/examples/overflow-menu.example.ts',
            terms:
              'avatar-group overflow-menu components/avatar-group/examples/overflow-menu.example components/avatar-group hellAvatarGroup hellAvatarGroupOverflow',
          },
        ],
        loadComponent: () =>
          import('./pages/components/avatar-group/avatar-group.page').then(
            (m) => m.AvatarGroupPage,
          ),
      },
      {
        routePath: 'components/date-input',
        label: 'Date input',
        icon: 'faSolidCalendar',
        examples: [
          {
            title: 'Date Input: Placeholders And Labels',
            detail: 'components/date-input/examples/placeholders-and-labels.example.ts',
            terms:
              'date-input placeholders-and-labels components/date-input/examples/placeholders-and-labels.example components/date-input hell-date-input',
          },
          {
            title: 'Date Input: Sizes',
            detail: 'components/date-input/examples/sizes.example.ts',
            terms:
              'date-input sizes components/date-input/examples/sizes.example components/date-input hell-date-input size',
          },
          {
            title: 'Date Input: Text Input Calendar Popover',
            detail: 'components/date-input/examples/text-input-calendar-popover.example.ts',
            terms:
              'date-input text-input-calendar-popover components/date-input/examples/text-input-calendar-popover.example components/date-input hell-date-input popover',
          },
        ],
        loadComponent: () =>
          import('./pages/components/date-input/date-input.page').then((m) => m.DateInputPage),
      },
      {
        routePath: 'components/dialpad',
        label: 'Dialpad',
        icon: 'faSolidPhone',
        examples: [
          {
            title: 'Dialpad: Example',
            detail: 'components/dialpad/examples/example.example.ts',
            terms:
              'dialpad example components/dialpad/examples/example.example components/dialpad hell-dialpad',
          },
        ],
        loadComponent: () =>
          import('./pages/components/dialpad/dialpad.page').then((m) => m.DialpadPage),
      },
      {
        routePath: 'components/drop-zone',
        label: 'Drop zone',
        icon: 'faSolidUpload',
        examples: [
          {
            title: 'Drop Zone: Disabled',
            detail: 'components/drop-zone/examples/disabled.example.ts',
            terms:
              'drop-zone disabled components/drop-zone/examples/disabled.example components/drop-zone hellDropzone disabled',
          },
          {
            title: 'Drop Zone: Example',
            detail: 'components/drop-zone/examples/example.example.ts',
            terms:
              'drop-zone example components/drop-zone/examples/example.example components/drop-zone hellDropzone upload file',
          },
          {
            title: 'Drop Zone: Single File Images Only',
            detail: 'components/drop-zone/examples/single-file-images-only.example.ts',
            terms:
              'drop-zone single-file-images-only components/drop-zone/examples/single-file-images-only.example components/drop-zone hellDropzone image accept',
          },
        ],
        loadComponent: () =>
          import('./pages/components/drop-zone/drop-zone.page').then((m) => m.DropZonePage),
      },
      {
        routePath: 'components/omnibar',
        label: 'Omnibar',
        icon: 'faSolidMagnifyingGlass',
        examples: [
          {
            title: 'Omnibar: Async Search',
            detail: 'components/omnibar/examples/async-search.example.ts',
            terms:
              'omnibar async-search components/omnibar/examples/async-search.example components/omnibar hell-omnibar HELL_OMNIBAR_DIRECTIVES command palette backend async search searchSource searchFields ranking debounce',
          },
        ],
        usages: [
          {
            title: 'Omnibar directives',
            detail: 'hell-omnibar, hellOmnibarItem, hellOmnibarAction',
            terms:
              'hell-omnibar HellOmnibar HELL_OMNIBAR_DIRECTIVES hellOmnibar hellOmnibarItem hellOmnibarAction hellOmnibarGroup command palette async search ranking debounce skeleton searchSource',
          },
        ],
        loadComponent: () =>
          import('./pages/components/omnibar/omnibar.page').then((m) => m.OmnibarPage),
      },
      {
        routePath: 'components/resizable',
        label: 'Resizable',
        icon: 'faSolidGripVertical',
        examples: [
          {
            title: 'Resizable: Grip Handle 5',
            detail: 'components/resizable/examples/grip-handle-5.example.ts',
            terms:
              'resizable grip-handle-5 components/resizable/examples/grip-handle-5.example components/resizable hellResizable hellResizablePane hellResizableHandle',
          },
          {
            title: 'Resizable: Grip Handle',
            detail: 'components/resizable/examples/grip-handle.example.ts',
            terms:
              'resizable grip-handle components/resizable/examples/grip-handle.example components/resizable hellResizable hellResizableHandle',
          },
          {
            title: 'Resizable: Horizontal Split',
            detail: 'components/resizable/examples/horizontal-split.example.ts',
            terms:
              'resizable horizontal-split components/resizable/examples/horizontal-split.example components/resizable hellResizable horizontal',
          },
          {
            title: 'Resizable: Three Panes',
            detail: 'components/resizable/examples/three-panes.example.ts',
            terms:
              'resizable three-panes components/resizable/examples/three-panes.example components/resizable hellResizable panes',
          },
          {
            title: 'Resizable: Vertical Split',
            detail: 'components/resizable/examples/vertical-split.example.ts',
            terms:
              'resizable vertical-split components/resizable/examples/vertical-split.example components/resizable hellResizable vertical',
          },
        ],
        usages: [
          {
            title: 'Resizable panes',
            detail: 'hellResizablePane and hellResizableHandle compose split views',
            terms:
              'HELL_RESIZABLE_DIRECTIVES hellResizable hellResizablePane hellResizableHandle horizontal vertical minSize initialFlex',
          },
        ],
        loadComponent: () =>
          import('./pages/components/resizable/resizable.page').then((m) => m.ResizablePage),
      },
      {
        routePath: 'components/split-view',
        label: 'Split view',
        icon: 'faSolidTableColumns',
        examples: [
          {
            title: 'Split View: Master Detail',
            detail: 'components/split-view/examples/master-detail.example.ts',
            terms:
              'split-view master-detail components/split-view/examples/master-detail.example components/split-view hell-split-view HELL_SPLIT_VIEW_DIRECTIVES hellSplitPrimary hellSplitDetail responsive compact back detailOpen resizable',
          },
        ],
        usages: [
          {
            title: 'Split view directives',
            detail: 'hell-split-view, hellSplitPrimary, hellSplitDetail',
            terms:
              'HELL_SPLIT_VIEW_DIRECTIVES hell-split-view hellSplitPrimary hellSplitDetail compactBelow detailOpen detailOpenChange responsive resizable panes',
          },
        ],
        loadComponent: () =>
          import('./pages/components/split-view/split-view.page').then((m) => m.SplitViewPage),
      },
      {
        routePath: 'components/time-input',
        label: 'Time input',
        icon: 'faSolidClock',
        examples: [
          {
            title: 'Time Input: Examples',
            detail: 'components/time-input/examples/examples.example.ts',
            terms:
              'time-input examples components/time-input/examples/examples.example components/time-input hell-time-input',
          },
          {
            title: 'Time Input: Placeholder And Labels',
            detail: 'components/time-input/examples/placeholder-and-labels.example.ts',
            terms:
              'time-input placeholder-and-labels components/time-input/examples/placeholder-and-labels.example components/time-input hell-time-input placeholder label',
          },
          {
            title: 'Time Input: Sizes',
            detail: 'components/time-input/examples/sizes.example.ts',
            terms:
              'time-input sizes components/time-input/examples/sizes.example components/time-input hell-time-input size',
          },
        ],
        loadComponent: () =>
          import('./pages/components/time-input/time-input.page').then((m) => m.TimeInputPage),
      },
      {
        routePath: 'components/toast',
        label: 'Toast',
        icon: 'faSolidBell',
        examples: [
          {
            title: 'Toast: Action',
            detail: 'components/toast/examples/action.example.ts',
            terms:
              'toast action components/toast/examples/action.example components/toast hell-toaster toast action',
          },
          {
            title: 'Toast: Persistent Custom Content',
            detail: 'components/toast/examples/persistent-custom-content.example.ts',
            terms:
              'toast persistent-custom-content components/toast/examples/persistent-custom-content.example components/toast hell-toaster persistent',
          },
          {
            title: 'Toast: Stacking',
            detail: 'components/toast/examples/stacking.example.ts',
            terms:
              'toast stacking components/toast/examples/stacking.example components/toast hell-toaster stacking',
          },
          {
            title: 'Toast: Variants',
            detail: 'components/toast/examples/variants.example.ts',
            terms:
              'toast variants components/toast/examples/variants.example components/toast hell-toaster variant',
          },
        ],
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
        examples: [
          {
            title: 'Code Editor: Code Viewer Demo',
            detail: 'components/code-editor/examples/code-viewer-demo.example.ts',
            terms:
              'code-editor code-viewer-demo components/code-editor/examples/code-viewer-demo.example components/code-editor hell-code-editor readOnly CodeMirror',
          },
          {
            title: 'Code Editor: Editor Demo',
            detail: 'components/code-editor/examples/editor-demo.example.ts',
            terms:
              'code-editor editor-demo components/code-editor/examples/editor-demo.example components/code-editor hell-code-editor CodeMirror',
          },
        ],
        loadComponent: () =>
          import('./pages/components/code-editor/code-editor.page').then((m) => m.CodeEditorPage),
      },
      {
        routePath: 'components/data-table',
        label: 'Data table',
        icon: 'faSolidTable',
        examples: [
          {
            title: 'Data Table: Example',
            detail: 'components/data-table/examples/example.example.ts',
            terms:
              'data-table example components/data-table/examples/example.example components/data-table hellTable hellTableRow hellOmnibar smart search ranking role assignee',
          },
          {
            title: 'Data Table: Row Editor',
            detail: 'components/data-table/examples/row-editor.example.ts',
            terms:
              'data-table row-editor components/data-table/examples/row-editor.example components/data-table hellResizable hellTable hell-code-editor',
          },
        ],
        usages: [
          {
            title: 'Data table directives',
            detail: 'hellTable, hellTableRow, hellTableHeaderCell, hellTableColumnResizer',
            terms:
              'HELL_TABLE_DIRECTIVES hellTableContainer hellTable hellTableHead hellTableBody hellTableRow hellTableHeaderCell hellTableCell hellTableColumnResizer',
          },
        ],
        loadComponent: () =>
          import('./pages/components/data-table/data-table.page').then((m) => m.DataTablePage),
      },
      {
        routePath: 'components/pdf-viewer',
        label: 'PDF viewer',
        icon: 'faSolidFilePdf',
        examples: [
          {
            title: 'Pdf Viewer: Lazy Loading',
            detail: 'components/pdf-viewer/examples/lazy-loading.example.ts',
            terms:
              'pdf-viewer lazy-loading components/pdf-viewer/examples/lazy-loading.example components/pdf-viewer hell-pdf-viewer pdfjs lazy',
          },
          {
            title: 'Pdf Viewer: Live Demo',
            detail: 'components/pdf-viewer/examples/live-demo.example.ts',
            terms:
              'pdf-viewer live-demo components/pdf-viewer/examples/live-demo.example components/pdf-viewer hell-pdf-viewer pdfjs',
          },
        ],
        loadComponent: () =>
          import('./pages/components/pdf-viewer/pdf-viewer.page').then((m) => m.PdfViewerPage),
      },
    ],
  },
];

export const HD_DOCS_EXAMPLES: readonly DocsSearchSeed[] = docsCatalogSearchSeeds('examples');
export const HD_DOCS_CODE_USAGES: readonly DocsSearchSeed[] = docsCatalogSearchSeeds('usages');

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

export function hdDocsSectionForPath(path: string): string | null {
  const normalized = path.replace(/^\//, '');
  for (const section of HD_DOCS_CATALOG_SECTIONS) {
    const item = section.items.find((candidate) => candidate.routePath === normalized);
    if (item) return section.heading ?? 'Guides';
  }
  return null;
}

function docsCatalogSearchSeeds(kind: 'examples' | 'usages'): readonly DocsSearchSeed[] {
  return HD_DOCS_CATALOG_SECTIONS.flatMap((section) => {
    const sectionName = section.heading ?? 'Guides';
    return section.items.flatMap((item) =>
      (item[kind] ?? []).map((seed) => {
        const path = item.routePath ? `/${item.routePath}` : '/';
        return {
          title: seed.title,
          detail: seed.detail,
          terms: docsCatalogSeedTerms(seed, item, sectionName, path),
          path,
          section: sectionName,
        };
      }),
    );
  });
}

export function hdBuildDocsSearchIndex(): readonly DocsSearchItem[] {
  const pageItems = HD_DOCS_CATALOG_SECTIONS.flatMap((section) => {
    const sectionName = section.heading ?? 'Guides';
    return section.items.map((item) => {
      const path = item.routePath ? `/${item.routePath}` : '/';
      return {
        id: `page:${path}`,
        kind: 'page' as const,
        title: item.label,
        path,
        icon: item.icon,
        section: sectionName,
        detail: `${sectionName} page`,
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
    const section = hdDocsSectionForPath(item.path) ?? item.section;
    return {
      id: `${kind}:${kind === 'usage' ? item.title : item.detail}`,
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

function docsCatalogSeedTerms(
  seed: DocsCatalogSearchSeed,
  item: DocsCatalogItem,
  section: string,
  path: string,
): string {
  return searchHaystack(seed.terms ?? '', seed.title, seed.detail, item.label, path, section);
}

function searchHaystack(...parts: readonly string[]): string {
  return parts.map(hellSearchKey).join(' ');
}
