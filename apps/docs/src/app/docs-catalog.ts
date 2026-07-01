import { Routes } from '@angular/router';

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
        routePath: 'guide',
        label: 'Guide',
        icon: 'faSolidBook',
        loadComponent: () => import('./pages/guide/guide.page').then((m) => m.GuidePage),
      },
      {
        routePath: 'theming',
        label: 'Theming',
        icon: 'faSolidPalette',
        loadComponent: () => import('./pages/theming/theming.page').then((m) => m.ThemingPage),
      },
      {
        routePath: 'accessibility',
        label: 'Accessibility matrix',
        icon: 'faSolidCheck',
        loadComponent: () =>
          import('./pages/accessibility/accessibility.page').then((m) => m.AccessibilityPage),
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
        routePath: 'components/dialog',
        label: 'Dialog',
        icon: 'faSolidWindowRestore',
        loadComponent: () =>
          import('./pages/components/dialog/dialog.page').then((m) => m.DialogPage),
      },
      {
        routePath: 'components/drop-zone',
        label: 'Drop zone',
        icon: 'faSolidUpload',
        loadComponent: () =>
          import('./pages/components/drop-zone/drop-zone.page').then((m) => m.DropZonePage),
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
        routePath: 'components/date-picker',
        label: 'Date picker',
        icon: 'faSolidCalendar',
        loadComponent: () =>
          import('./pages/components/date-picker/date-picker.page').then((m) => m.DatePickerPage),
      },
      {
        routePath: 'components/dialpad',
        label: 'Dialpad',
        icon: 'faSolidPhone',
        loadComponent: () =>
          import('./pages/components/dialpad/dialpad.page').then((m) => m.DialpadPage),
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

export function hdDocsSectionForPath(path: string): string | null {
  const normalized = path.replace(/^\//, '');
  for (const section of HD_DOCS_CATALOG_SECTIONS) {
    const item = section.items.find((candidate) => candidate.routePath === normalized);
    if (item) return section.heading ?? 'Guides';
  }
  return null;
}
