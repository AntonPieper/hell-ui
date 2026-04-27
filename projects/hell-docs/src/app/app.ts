import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidMoon,
  faSolidPalette,
  faSolidPenRuler,
  faSolidPenToSquare,
  faSolidPhone,
  faSolidPlay,
  faSolidQuestion,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidSpinner,
  faSolidStar,
  faSolidSun,
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
  HellTag,
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
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidMoon,
  faSolidPalette,
  faSolidPenRuler,
  faSolidPenToSquare,
  faSolidPhone,
  faSolidPlay,
  faSolidQuestion,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidSpinner,
  faSolidStar,
  faSolidSun,
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

type ThemePreference = 'system' | 'light' | 'dark';

const HD_THEME_STORAGE_KEY = 'hell-docs-theme';
const HD_THEME_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

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
    HellTag,
    HellToaster,
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemScheme = this.getSystemScheme();

  protected readonly themePreference = signal<ThemePreference>(this.readThemePreference());
  protected readonly systemTheme = signal<'light' | 'dark'>(
    this.systemScheme?.matches ? 'dark' : 'light',
  );
  protected readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const preference = this.themePreference();
    return preference === 'system' ? this.systemTheme() : preference;
  });
  protected readonly themeIcon = computed(() => {
    const preference = this.themePreference();
    if (preference === 'system') return 'faSolidDesktop';
    return preference === 'dark' ? 'faSolidMoon' : 'faSolidSun';
  });
  protected readonly themeLabel = computed(() => {
    const preference = this.themePreference();
    const resolved = this.resolvedTheme();
    return preference === 'system' ? `Theme: system (${resolved})` : `Theme: ${preference}`;
  });

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
        { path: '/components/date-picker', label: 'Date picker', icon: 'faSolidCalendar' },
        { path: '/components/dialog', label: 'Dialog', icon: 'faSolidWindowRestore' },
        { path: '/components/field', label: 'Field', icon: 'faSolidPenToSquare' },
        { path: '/components/flyout', label: 'Flyout', icon: 'faSolidComment' },
        { path: '/components/icon', label: 'Icon', icon: 'faSolidStar' },
        { path: '/components/input', label: 'Input & select', icon: 'faSolidPenRuler' },
        { path: '/components/menu', label: 'Menu', icon: 'faSolidEllipsisVertical' },
        { path: '/components/pagination', label: 'Pagination', icon: 'faSolidTableColumns' },
        { path: '/components/popover', label: 'Popover', icon: 'faSolidComment' },
        { path: '/components/progress', label: 'Progress', icon: 'faSolidSliders' },
        { path: '/components/radio', label: 'Radio', icon: 'faSolidCircleHalfStroke' },
        { path: '/components/separator', label: 'Separator', icon: 'faSolidGripLines' },
        { path: '/components/skeleton', label: 'Skeleton', icon: 'faSolidImage' },
        { path: '/components/spinner', label: 'Spinner', icon: 'faSolidSpinner' },
        { path: '/components/slider', label: 'Slider', icon: 'faSolidSliders' },
        { path: '/components/switch', label: 'Switch', icon: 'faSolidToggleOn' },
        { path: '/components/tabs', label: 'Tabs', icon: 'faSolidFolderOpen' },
        { path: '/components/tag', label: 'Tag', icon: 'faSolidTag' },
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
        { path: '/components/date-input', label: 'Date input', icon: 'faSolidCalendar' },
        { path: '/components/dialpad', label: 'Dialpad', icon: 'faSolidPhone' },
        { path: '/components/drop-zone', label: 'Drop zone', icon: 'faSolidUpload' },
        { path: '/components/resizable', label: 'Resizable', icon: 'faSolidGripVertical' },
        { path: '/components/time-input', label: 'Time input', icon: 'faSolidClock' },
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

  constructor() {
    effect(() => this.applyTheme(this.resolvedTheme()));

    const systemScheme = this.systemScheme;
    if (!systemScheme) return;

    const onSchemeChange = (event: MediaQueryListEvent) => {
      this.systemTheme.set(event.matches ? 'dark' : 'light');
    };
    systemScheme.addEventListener('change', onSchemeChange);
    this.destroyRef.onDestroy(() => systemScheme.removeEventListener('change', onSchemeChange));
  }

  protected cycleTheme(): void {
    const current = this.themePreference();
    const next = HD_THEME_ORDER[(HD_THEME_ORDER.indexOf(current) + 1) % HD_THEME_ORDER.length];
    this.themePreference.set(next);
    this.writeThemePreference(next);
  }

  protected isSectionCollapsed(heading: string): boolean {
    return this.collapsedSections().has(heading);
  }

  protected toggleSection(heading: string): void {
    this.collapsedSections.update((current) => {
      const next = new Set(current);
      if (next.has(heading)) next.delete(heading);
      else next.add(heading);
      return next;
    });
  }

  private getSystemScheme(): MediaQueryList | null {
    if (typeof window === 'undefined' || !window.matchMedia) return null;
    return window.matchMedia('(prefers-color-scheme: dark)');
  }

  private readThemePreference(): ThemePreference {
    if (typeof localStorage === 'undefined') return 'system';

    const stored = localStorage.getItem(HD_THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  private writeThemePreference(preference: ThemePreference): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HD_THEME_STORAGE_KEY, preference);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['hellTheme'] = theme;
    document.documentElement.style.colorScheme = theme;
  }
}
