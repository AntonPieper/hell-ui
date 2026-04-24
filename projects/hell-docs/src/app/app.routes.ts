import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/overview/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'getting-started',
    loadComponent: () =>
      import('./pages/getting-started/getting-started.page').then((m) => m.GettingStartedPage),
  },
  {
    path: 'theming',
    loadComponent: () => import('./pages/theming/theming.page').then((m) => m.ThemingPage),
  },

  // Primitives
  { path: 'components/accordion', loadComponent: () => import('./pages/components/accordion.page').then((m) => m.AccordionPage) },
  { path: 'components/avatar', loadComponent: () => import('./pages/components/avatar.page').then((m) => m.AvatarPage) },
  { path: 'components/breadcrumbs', loadComponent: () => import('./pages/components/breadcrumbs.page').then((m) => m.BreadcrumbsPage) },
  { path: 'components/button', loadComponent: () => import('./pages/components/button.page').then((m) => m.ButtonPage) },
  { path: 'components/card', loadComponent: () => import('./pages/components/card.page').then((m) => m.CardPage) },
  { path: 'components/checkbox', loadComponent: () => import('./pages/components/checkbox.page').then((m) => m.CheckboxPage) },
  { path: 'components/date-input', loadComponent: () => import('./pages/components/date-input.page').then((m) => m.DateInputPage) },
  { path: 'components/date-picker', loadComponent: () => import('./pages/components/date-picker.page').then((m) => m.DatePickerPage) },
  { path: 'components/dialog', loadComponent: () => import('./pages/components/dialog.page').then((m) => m.DialogPage) },
  { path: 'components/field', loadComponent: () => import('./pages/components/field.page').then((m) => m.FieldPage) },
  { path: 'components/flyout', loadComponent: () => import('./pages/components/flyout.page').then((m) => m.FlyoutPage) },
  { path: 'components/icon', loadComponent: () => import('./pages/components/icon.page').then((m) => m.IconPage) },
  { path: 'components/input', loadComponent: () => import('./pages/components/input.page').then((m) => m.InputPage) },
  { path: 'components/menu', loadComponent: () => import('./pages/components/menu.page').then((m) => m.MenuPage) },
  { path: 'components/pagination', loadComponent: () => import('./pages/components/pagination.page').then((m) => m.PaginationPage) },
  { path: 'components/popover', loadComponent: () => import('./pages/components/popover.page').then((m) => m.PopoverPage) },
  { path: 'components/progress', loadComponent: () => import('./pages/components/progress.page').then((m) => m.ProgressPage) },
  { path: 'components/radio', loadComponent: () => import('./pages/components/radio.page').then((m) => m.RadioPage) },
  { path: 'components/separator', loadComponent: () => import('./pages/components/separator.page').then((m) => m.SeparatorPage) },
  { path: 'components/skeleton', loadComponent: () => import('./pages/components/skeleton.page').then((m) => m.SkeletonPage) },
  { path: 'components/slider', loadComponent: () => import('./pages/components/slider.page').then((m) => m.SliderPage) },
  { path: 'components/switch', loadComponent: () => import('./pages/components/switch.page').then((m) => m.SwitchPage) },
  { path: 'components/tabs', loadComponent: () => import('./pages/components/tabs.page').then((m) => m.TabsPage) },
  { path: 'components/time-input', loadComponent: () => import('./pages/components/time-input.page').then((m) => m.TimeInputPage) },
  { path: 'components/tag', loadComponent: () => import('./pages/components/tag.page').then((m) => m.TagPage) },
  { path: 'components/toggle', loadComponent: () => import('./pages/components/toggle.page').then((m) => m.TogglePage) },
  { path: 'components/tooltip', loadComponent: () => import('./pages/components/tooltip.page').then((m) => m.TooltipPage) },

  // Composites
  { path: 'components/app-shell', loadComponent: () => import('./pages/components/app-shell.page').then((m) => m.AppShellPage) },
  { path: 'components/audio-player', loadComponent: () => import('./pages/components/audio-player.page').then((m) => m.AudioPlayerPage) },
  { path: 'components/avatar-group', loadComponent: () => import('./pages/components/avatar-group.page').then((m) => m.AvatarGroupPage) },
  { path: 'components/dialpad', loadComponent: () => import('./pages/components/dialpad.page').then((m) => m.DialpadPage) },
  { path: 'components/drop-zone', loadComponent: () => import('./pages/components/drop-zone.page').then((m) => m.DropZonePage) },
  { path: 'components/resizable', loadComponent: () => import('./pages/components/resizable.page').then((m) => m.ResizablePage) },
  { path: 'components/toast', loadComponent: () => import('./pages/components/toast.page').then((m) => m.ToastPage) },

  // Features
  { path: 'components/code-editor', loadComponent: () => import('./pages/components/code-editor.page').then((m) => m.CodeEditorPage) },
  { path: 'components/data-table', loadComponent: () => import('./pages/components/data-table.page').then((m) => m.DataTablePage) },
  { path: 'components/pdf-viewer', loadComponent: () => import('./pages/components/pdf-viewer.page').then((m) => m.PdfViewerPage) },

  { path: '**', redirectTo: '' },
];
