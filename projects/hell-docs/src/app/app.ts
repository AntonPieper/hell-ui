import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBars,
  faSolidBell,
  faSolidCalendar,
  faSolidCheck,
  faSolidCircleHalfStroke,
  faSolidClock,
  faSolidCode,
  faSolidComment,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidPalette,
  faSolidPenRuler,
  faSolidPenToSquare,
  faSolidPhone,
  faSolidPlay,
  faSolidQuestion,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidStar,
  faSolidTable,
  faSolidTableColumns,
  faSolidTag,
  faSolidToggleOn,
  faSolidUpload,
  faSolidUser,
  faSolidUsers,
  faSolidWindowMaximize,
  faSolidWindowRestore,
} from '@ng-icons/font-awesome/solid';
import {
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellAppSecondary,
  HellAppSecondaryBody,
  HellSidenavToggle,
  HellSecondaryToggle,
  HellButton,
  HellIcon,
  HellToaster,
} from 'hell';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}
interface NavSection {
  heading?: string;
  items: NavItem[];
}

const HD_APP_ICONS = {
  faSolidBars,
  faSolidBell,
  faSolidCalendar,
  faSolidCheck,
  faSolidCircleHalfStroke,
  faSolidClock,
  faSolidCode,
  faSolidComment,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidPalette,
  faSolidPenRuler,
  faSolidPenToSquare,
  faSolidPhone,
  faSolidPlay,
  faSolidQuestion,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidStar,
  faSolidTable,
  faSolidTableColumns,
  faSolidTag,
  faSolidToggleOn,
  faSolidUpload,
  faSolidUser,
  faSolidUsers,
  faSolidWindowMaximize,
  faSolidWindowRestore,
};

@Component({
  selector: 'hd-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_APP_ICONS)],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HellAppShell,
    HellAppTopbar,
    HellAppSidenav,
    HellAppContent,
    HellAppSecondary,
    HellAppSecondaryBody,
    HellSidenavToggle,
    HellSecondaryToggle,
    HellButton,
    HellIcon,
    HellToaster,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly sections: NavSection[] = [
    {
      items: [
        { path: '/', label: 'Overview', icon: 'faSolidHouse', exact: true },
        { path: '/getting-started', label: 'Getting started', icon: 'faSolidRocket' },
        { path: '/theming', label: 'Theming', icon: 'faSolidPalette' },
      ],
    },
    {
      heading: 'Primitives',
      items: [
        { path: '/components/accordion', label: 'Accordion', icon: 'faSolidLayerGroup' },
        { path: '/components/avatar', label: 'Avatar', icon: 'faSolidUser' },
        { path: '/components/breadcrumbs', label: 'Breadcrumbs', icon: 'faSolidSignsPost' },
        { path: '/components/button', label: 'Button', icon: 'faSolidWindowMaximize' },
        { path: '/components/card', label: 'Card', icon: 'faSolidIdCard' },
        { path: '/components/checkbox', label: 'Checkbox', icon: 'faSolidCheck' },
        { path: '/components/date-input', label: 'Date input & picker', icon: 'faSolidCalendar' },
        { path: '/components/dialog', label: 'Dialog', icon: 'faSolidWindowRestore' },
        { path: '/components/field', label: 'Field', icon: 'faSolidPenToSquare' },
        { path: '/components/flyout', label: 'Flyout', icon: 'faSolidComment' },
        { path: '/components/icon', label: 'Icon', icon: 'faSolidStar' },
        { path: '/components/input', label: 'Input', icon: 'faSolidPenRuler' },
        { path: '/components/menu', label: 'Menu', icon: 'faSolidEllipsisVertical' },
        { path: '/components/pagination', label: 'Pagination', icon: 'faSolidTableColumns' },
        { path: '/components/popover', label: 'Popover', icon: 'faSolidComment' },
        { path: '/components/progress', label: 'Progress', icon: 'faSolidSliders' },
        { path: '/components/radio', label: 'Radio', icon: 'faSolidCircleHalfStroke' },
        { path: '/components/separator', label: 'Separator', icon: 'faSolidGripLines' },
        { path: '/components/skeleton', label: 'Skeleton', icon: 'faSolidImage' },
        { path: '/components/slider', label: 'Slider', icon: 'faSolidSliders' },
        { path: '/components/switch', label: 'Switch', icon: 'faSolidToggleOn' },
        { path: '/components/tabs', label: 'Tabs', icon: 'faSolidFolderOpen' },
        { path: '/components/tag', label: 'Tag', icon: 'faSolidTag' },
        { path: '/components/time-input', label: 'Time input', icon: 'faSolidClock' },
        { path: '/components/toggle', label: 'Toggle', icon: 'faSolidToggleOn' },
        { path: '/components/tooltip', label: 'Tooltip', icon: 'faSolidQuestion' },
      ],
    },
    {
      heading: 'Composites',
      items: [
        { path: '/components/app-shell', label: 'App shell', icon: 'faSolidTableColumns' },
        { path: '/components/audio-player', label: 'Audio player', icon: 'faSolidPlay' },
        { path: '/components/avatar-group', label: 'Avatar group', icon: 'faSolidUsers' },
        { path: '/components/dialpad', label: 'Dialpad', icon: 'faSolidPhone' },
        { path: '/components/drop-zone', label: 'Drop zone', icon: 'faSolidUpload' },
        { path: '/components/resizable', label: 'Resizable', icon: 'faSolidGripVertical' },
        { path: '/components/toast', label: 'Toast', icon: 'faSolidBell' },
      ],
    },
    {
      heading: 'Features',
      items: [
        { path: '/components/code-editor', label: 'Code editor', icon: 'faSolidCode' },
        { path: '/components/data-table', label: 'Data table', icon: 'faSolidTable' },
        { path: '/components/pdf-viewer', label: 'PDF viewer', icon: 'faSolidFilePdf' },
      ],
    },
  ];

  /**
   * Per-section collapse state for the sidenav. Defaults to expanded; users
   * click a section heading (which is itself a button) to fold the items
   * underneath. State is keyed by heading text so it survives re-renders.
   * The CSS in `[data-collapsed='true']` on `.hell-nav-section` hides the
   * items list while the chevron in `.hell-nav-section-toggle::after`
   * rotates from down → right.
   */
  private readonly collapsedSections = signal<ReadonlySet<string>>(new Set());

  protected isSectionCollapsed(heading: string): boolean {
    return this.collapsedSections().has(heading);
  }

  protected toggleSection(heading: string): void {
    this.collapsedSections.update(current => {
      const next = new Set(current);
      if (next.has(heading)) next.delete(heading);
      else next.add(heading);
      return next;
    });
  }
}
