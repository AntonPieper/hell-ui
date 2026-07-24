import { Routes } from '@angular/router';

interface DocsNavItem {
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

export const HD_DOCS_KIND_FILTER_OPTIONS: readonly DocsSearchKindFilter[] = [
  'all',
  'page',
  'example',
  'usage',
];


const HD_DOCS_CATALOG_SECTIONS: readonly DocsCatalogSection[] = [
  {
    items: [
      {
        routePath: '',
        label: 'Overview',
        icon: 'faSolidHouse',
        exact: true,
        loadComponent: () =>
          import('./pages/overview/overview.page').then((m) => m.OverviewPage),
      },
      {
        routePath: 'getting-started',
        label: 'Getting started',
        icon: 'faSolidRocket',
        loadComponent: () =>
          import('./pages/getting-started/getting-started.page').then((m) => m.GettingStartedPage),
      },
      {
        routePath: 'guide',
        label: 'Guide',
        icon: 'faSolidBook',
        loadComponent: () =>
          import('./pages/guide/guide.page').then((m) => m.GuidePage),
      },
      {
        routePath: 'guide/overlays',
        label: 'Overlays',
        icon: 'faSolidLayerGroup',
        loadComponent: () =>
          import('./pages/guide/overlays/overlays.page').then((m) => m.OverlaysPage),
      },
      {
        routePath: 'theming',
        label: 'Theming',
        icon: 'faSolidPalette',
        loadComponent: () =>
          import('./pages/theming/theming.page').then((m) => m.ThemingPage),
      },
      {
        routePath: 'accessibility',
        label: 'Accessibility',
        icon: 'faSolidUniversalAccess',
        loadComponent: () =>
          import('./pages/accessibility/accessibility.page').then((m) => m.AccessibilityPage),
      },
    ],
  },
  {
    heading: 'Buttons & indicators',
    items: [
      {
        routePath: 'components/button',
        label: 'Button',
        icon: 'faSolidHandPointer',
        loadComponent: () =>
          import('./pages/components/button/button.page').then((m) => m.ButtonPage),
      },
      {
        routePath: 'components/toggle',
        label: 'Toggle',
        icon: 'faSolidToggleOn',
        loadComponent: () =>
          import('./pages/components/toggle/toggle.page').then((m) => m.TogglePage),
      },
      {
        routePath: 'components/chip',
        label: 'Chip',
        icon: 'faSolidTags',
        loadComponent: () =>
          import('./pages/components/chip/chip.page').then((m) => m.ChipPage),
      },
      {
        routePath: 'components/progress',
        label: 'Progress',
        icon: 'faSolidBarsProgress',
        loadComponent: () =>
          import('./pages/components/progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        routePath: 'components/skeleton',
        label: 'Skeleton',
        icon: 'faSolidBarsStaggered',
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
    ],
  },
  {
    heading: 'Forms & input',
    items: [
      {
        routePath: 'components/field',
        label: 'Field',
        icon: 'faSolidRectangleList',
        loadComponent: () =>
          import('./pages/components/field/field.page').then((m) => m.FieldPage),
      },
      {
        routePath: 'components/control-group',
        label: 'Control group',
        icon: 'faSolidLayerGroup',
        loadComponent: () =>
          import('./pages/components/control-group/control-group.page').then(
            (m) => m.ControlGroupPage,
          ),
      },
      {
        routePath: 'components/input',
        label: 'Input & select',
        icon: 'faSolidICursor',
        loadComponent: () =>
          import('./pages/components/input/input.page').then((m) => m.InputPage),
      },
      {
        routePath: 'components/checkbox',
        label: 'Checkbox',
        icon: 'faSolidSquareCheck',
        loadComponent: () =>
          import('./pages/components/checkbox/checkbox.page').then((m) => m.CheckboxPage),
      },
      {
        routePath: 'components/radio',
        label: 'Radio',
        icon: 'faSolidCircleDot',
        loadComponent: () =>
          import('./pages/components/radio/radio.page').then((m) => m.RadioPage),
      },
      {
        routePath: 'components/switch',
        label: 'Switch',
        icon: 'faSolidToggleOff',
        loadComponent: () =>
          import('./pages/components/switch/switch.page').then((m) => m.SwitchPage),
      },
      {
        routePath: 'components/slider',
        label: 'Slider',
        icon: 'faSolidSliders',
        loadComponent: () =>
          import('./pages/components/slider/slider.page').then((m) => m.SliderPage),
      },
      {
        routePath: 'components/select',
        label: 'Select',
        icon: 'faSolidCaretDown',
        loadComponent: () =>
          import('./pages/components/select/select.page').then((m) => m.SelectPage),
      },
      {
        routePath: 'components/combobox',
        label: 'Combobox',
        icon: 'faSolidKeyboard',
        loadComponent: () =>
          import('./pages/components/combobox/combobox.page').then((m) => m.ComboboxPage),
      },
      {
        routePath: 'components/listbox',
        label: 'Listbox',
        icon: 'faSolidListUl',
        loadComponent: () =>
          import('./pages/components/listbox/listbox.page').then((m) => m.ListboxPage),
      },
      {
        routePath: 'components/search',
        label: 'Search',
        icon: 'faSolidMagnifyingGlass',
        loadComponent: () =>
          import('./pages/components/search/search.page').then((m) => m.SearchPage),
      },
      {
        routePath: 'components/date-input',
        label: 'Date input',
        icon: 'faSolidCalendarDay',
        loadComponent: () =>
          import('./pages/components/date-input/date-input.page').then((m) => m.DateInputPage),
      },
      {
        routePath: 'components/time-input',
        label: 'Time input',
        icon: 'faSolidClock',
        loadComponent: () =>
          import('./pages/components/time-input/time-input.page').then((m) => m.TimeInputPage),
      },
      {
        routePath: 'components/time-picker',
        label: 'Time picker',
        icon: 'faSolidClock',
        loadComponent: () =>
          import('./pages/components/time-picker/time-picker.page').then((m) => m.TimePickerPage),
      },
      {
        routePath: 'components/number-input',
        label: 'Number input',
        icon: 'faSolidHashtag',
        loadComponent: () =>
          import('./pages/components/number-input/number-input.page').then(
            (m) => m.NumberInputPage,
          ),
      },
      {
        routePath: 'components/date-picker',
        label: 'Date picker',
        icon: 'faSolidCalendarDays',
        loadComponent: () =>
          import('./pages/components/date-picker/date-picker.page').then((m) => m.DatePickerPage),
      },
      {
        routePath: 'components/file-picker',
        label: 'File picker',
        icon: 'faSolidUpload',
        loadComponent: () =>
          import('./pages/components/file-picker/file-picker.page').then(
            (m) => m.FilePickerPage,
          ),
      },
      {
        routePath: 'components/save-bar',
        label: 'Save bar',
        icon: 'faSolidFloppyDisk',
        loadComponent: () =>
          import('./pages/components/save-bar/save-bar.page').then((m) => m.SaveBarPage),
      },
    ],
  },
  {
    heading: 'Overlays & feedback',
    items: [
      {
        routePath: 'components/dialog',
        label: 'Dialog',
        icon: 'faSolidWindowRestore',
        loadComponent: () =>
          import('./pages/components/dialog/dialog.page').then((m) => m.DialogPage),
      },
      {
        routePath: 'components/confirm',
        label: 'Confirm',
        icon: 'faSolidSquareCheck',
        loadComponent: () =>
          import('./pages/components/confirm/confirm.page').then((m) => m.ConfirmPage),
      },
      {
        routePath: 'components/popover',
        label: 'Popover',
        icon: 'faSolidMessage',
        loadComponent: () =>
          import('./pages/components/popover/popover.page').then((m) => m.PopoverPage),
      },
      {
        routePath: 'components/tooltip',
        label: 'Tooltip',
        icon: 'faSolidCircleQuestion',
        loadComponent: () =>
          import('./pages/components/tooltip/tooltip.page').then((m) => m.TooltipPage),
      },
      {
        routePath: 'components/menu',
        label: 'Menu',
        icon: 'faSolidEllipsisVertical',
        loadComponent: () =>
          import('./pages/components/menu/menu.page').then((m) => m.MenuPage),
      },
      {
        routePath: 'components/toast',
        label: 'Toast',
        icon: 'faSolidBell',
        loadComponent: () =>
          import('./pages/components/toast/toast.page').then((m) => m.ToastPage),
      },
      {
        routePath: 'components/alert',
        label: 'Alert',
        icon: 'faSolidTriangleExclamation',
        loadComponent: () =>
          import('./pages/components/alert/alert.page').then((m) => m.AlertPage),
      },
      {
        routePath: 'components/omnibar',
        label: 'Omnibar',
        icon: 'faSolidTerminal',
        loadComponent: () =>
          import('./pages/components/omnibar/omnibar.page').then((m) => m.OmnibarPage),
      },
    ],
  },
  {
    heading: 'Navigation & layout',
    items: [
      {
        routePath: 'components/app-shell',
        label: 'App shell',
        icon: 'faSolidWindowMaximize',
        loadComponent: () =>
          import('./pages/components/app-shell/app-shell.page').then((m) => m.AppShellPage),
      },
      {
        routePath: 'components/breadcrumbs',
        label: 'Breadcrumbs',
        icon: 'faSolidSignsPost',
        loadComponent: () =>
          import('./pages/components/breadcrumbs/breadcrumbs.page').then((m) => m.BreadcrumbsPage),
      },
      {
        routePath: 'components/tabs',
        label: 'Tabs',
        icon: 'faSolidFolderOpen',
        loadComponent: () =>
          import('./pages/components/tabs/tabs.page').then((m) => m.TabsPage),
      },
      {
        routePath: 'components/pagination',
        label: 'Pagination',
        icon: 'faSolidAnglesRight',
        loadComponent: () =>
          import('./pages/components/pagination/pagination.page').then((m) => m.PaginationPage),
      },
      {
        routePath: 'components/accordion',
        label: 'Accordion',
        icon: 'faSolidLayerGroup',
        loadComponent: () =>
          import('./pages/components/accordion/accordion.page').then((m) => m.AccordionPage),
      },
      {
        routePath: 'components/resizable',
        label: 'Resizable',
        icon: 'faSolidLeftRight',
        loadComponent: () =>
          import('./pages/components/resizable/resizable.page').then((m) => m.ResizablePage),
      },
      {
        routePath: 'components/master-detail',
        label: 'Master detail',
        icon: 'faSolidTableColumns',
        loadComponent: () =>
          import('./pages/components/master-detail/master-detail.page').then(
            (m) => m.MasterDetailPage,
          ),
      },
      {
        routePath: 'components/toolbar',
        label: 'Toolbar',
        icon: 'faSolidSliders',
        loadComponent: () =>
          import('./pages/components/toolbar/toolbar.page').then((m) => m.ToolbarPage),
      },
      {
        routePath: 'components/page-header',
        label: 'Page header',
        icon: 'faSolidHeading',
        loadComponent: () =>
          import('./pages/components/page-header/page-header.page').then((m) => m.PageHeaderPage),
      },
    ],
  },
  {
    heading: 'Display & media',
    items: [
      {
        routePath: 'components/avatar',
        label: 'Avatar',
        icon: 'faSolidUser',
        loadComponent: () =>
          import('./pages/components/avatar/avatar.page').then((m) => m.AvatarPage),
      },
      {
        routePath: 'components/avatar-group',
        label: 'Avatar group',
        icon: 'faSolidUsers',
        loadComponent: () =>
          import('./pages/components/avatar-group/avatar-group.page').then((m) => m.AvatarGroupPage),
      },
      {
        routePath: 'components/card',
        label: 'Card',
        icon: 'faSolidIdCard',
        loadComponent: () =>
          import('./pages/components/card/card.page').then((m) => m.CardPage),
      },
      {
        routePath: 'components/empty-state',
        label: 'Empty state',
        icon: 'faSolidBoxOpen',
        loadComponent: () =>
          import('./pages/components/empty-state/empty-state.page').then((m) => m.EmptyStatePage),
      },
      {
        routePath: 'components/icon',
        label: 'Icon',
        icon: 'faSolidStar',
        loadComponent: () =>
          import('./pages/components/icon/icon.page').then((m) => m.IconPage),
      },
      {
        routePath: 'components/separator',
        label: 'Separator',
        icon: 'faSolidGripLines',
        loadComponent: () =>
          import('./pages/components/separator/separator.page').then((m) => m.SeparatorPage),
      },
      {
        routePath: 'components/audio-player',
        label: 'Audio player',
        icon: 'faSolidPlay',
        loadComponent: () =>
          import('./pages/components/audio-player/audio-player.page').then((m) => m.AudioPlayerPage),
      },
    ],
  },
  {
    heading: 'Tables',
    items: [
      {
        routePath: 'components/table',
        label: 'Table',
        icon: 'faSolidTable',
        loadComponent: () =>
          import('./pages/components/table/table.page').then((m) => m.TablePage),
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
        routePath: 'components/dialpad',
        label: 'Dialpad',
        icon: 'faSolidPhone',
        loadComponent: () =>
          import('./pages/components/dialpad/dialpad.page').then((m) => m.DialpadPage),
      },
      {
        routePath: 'components/filter-builder',
        label: 'Filter Builder',
        icon: 'faSolidFilter',
        loadComponent: () =>
          import('./pages/components/filter-builder/filter-builder.page').then(
            (m) => m.FilterBuilderPage,
          ),
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
  // The multi-select menu button recipe was folded into the Menu page (#347);
  // keep the bookmarkable old route alive.
  { path: 'components/multi-select-menu-button', redirectTo: 'components/menu' },
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
