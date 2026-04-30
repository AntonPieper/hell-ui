import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowRight,
  faSolidBars,
  faSolidBell,
  faSolidBookOpen,
  faSolidCalendar,
  faSolidCheck,
  faSolidCircleHalfStroke,
  faSolidClock,
  faSolidCode,
  faSolidComment,
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidFilter,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidMagnifyingGlass,
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
  HELL_MENU_DIRECTIVES,
  HELL_OMNIBAR_DIRECTIVES,
  HELL_SELECT_DIRECTIVES,
  type HellSearchField,
  type HellSearchResult,
} from 'hell';
import { HD_DOCS_CODE_USAGES, HD_DOCS_EXAMPLES } from './docs-search';

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

type DocsSearchKind = 'page' | 'example' | 'usage';
type DocsSearchKindFilter = DocsSearchKind | 'all';

interface DocsSearchItem {
  readonly id: string;
  readonly kind: DocsSearchKind;
  readonly title: string;
  readonly path: string;
  readonly icon: string;
  readonly section: string;
  readonly detail: string;
  readonly haystack: string;
}

interface DocsSearchGroup {
  readonly kind: DocsSearchKind;
  readonly label: string;
  readonly items: readonly DocsSearchItem[];
}

const HD_APP_ICONS = {
  faSolidArrowRight,
  faSolidBars,
  faSolidBell,
  faSolidBookOpen,
  faSolidCalendar,
  faSolidCheck,
  faSolidCircleHalfStroke,
  faSolidClock,
  faSolidCode,
  faSolidComment,
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFileLines,
  faSolidFilePdf,
  faSolidFilter,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidGripVertical,
  faSolidHouse,
  faSolidIdCard,
  faSolidImage,
  faSolidLayerGroup,
  faSolidMagnifyingGlass,
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

const HD_DOCS_KIND_LABEL: Record<DocsSearchKind, string> = {
  page: 'Pages',
  example: 'Examples',
  usage: 'Code usage',
};

const HD_DOCS_KIND_FILTER_LABEL: Record<DocsSearchKindFilter, string> = {
  all: 'All types',
  ...HD_DOCS_KIND_LABEL,
};

const HD_DOCS_KIND_ICON: Record<DocsSearchKind, string> = {
  page: 'faSolidBookOpen',
  example: 'faSolidFileLines',
  usage: 'faSolidCode',
};

type ThemePreference = 'system' | 'light' | 'dark';
type Palette = 'slate' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
type Skin =
  | 'default'
  | 'brutalist'
  | 'soft'
  | 'compact'
  | 'mono'
  | 'editorial'
  | 'glass'
  | 'high-contrast'
  | 'playful'
  | 'newspaper'
  | 'aurora';

interface ThemeOption {
  readonly id: string;
  readonly label: string;
  readonly tag?: string;
  readonly palette: Palette;
  readonly skin: Skin;
  readonly swatchLight: string;
  readonly swatchDark: string;
}

const HD_THEME_STORAGE_KEY = 'hell-docs-theme';
const HD_PALETTE_STORAGE_KEY = 'hell-docs-theme-id';
const HD_THEME_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Curated themes shown in the topbar combobox. The first six are pure
 *  palette swaps (skin = default) so devs can compare colour systems against
 *  a stable layout. The remaining five flip the skin axis and pair it with a
 *  palette that flatters the aesthetic — the goal is showing how far the
 *  token system bends without rewriting components. */
const HD_THEMES: readonly ThemeOption[] = [
  { id: 'slate', label: 'Slate', palette: 'slate', skin: 'default',
    swatchLight: '#313a46', swatchDark: '#b8c4dc' },
  { id: 'indigo', label: 'Indigo', palette: 'indigo', skin: 'default',
    swatchLight: '#4f46e5', swatchDark: '#a5b4fc' },
  { id: 'emerald', label: 'Emerald', palette: 'emerald', skin: 'default',
    swatchLight: '#047857', swatchDark: '#6ee7b7' },
  { id: 'rose', label: 'Rose', palette: 'rose', skin: 'default',
    swatchLight: '#be185d', swatchDark: '#fda4af' },
  { id: 'amber', label: 'Amber', palette: 'amber', skin: 'default',
    swatchLight: '#b45309', swatchDark: '#fcd34d' },
  { id: 'violet', label: 'Violet', palette: 'violet', skin: 'default',
    swatchLight: '#7c3aed', swatchDark: '#c4b5fd' },
  { id: 'brutalist', label: 'Brutalist', tag: 'skin', palette: 'slate', skin: 'brutalist',
    swatchLight: '#0f141c', swatchDark: '#e8ecf3' },
  { id: 'soft', label: 'Soft', tag: 'skin', palette: 'indigo', skin: 'soft',
    swatchLight: '#4f46e5', swatchDark: '#a5b4fc' },
  { id: 'compact', label: 'Compact', tag: 'skin', palette: 'slate', skin: 'compact',
    swatchLight: '#313a46', swatchDark: '#b8c4dc' },
  { id: 'mono', label: 'Mono', tag: 'skin', palette: 'emerald', skin: 'mono',
    swatchLight: '#047857', swatchDark: '#6ee7b7' },
  { id: 'editorial', label: 'Editorial', tag: 'skin', palette: 'violet', skin: 'editorial',
    swatchLight: '#7c3aed', swatchDark: '#c4b5fd' },
  { id: 'glass', label: 'Glass', tag: 'skin', palette: 'indigo', skin: 'glass',
    swatchLight: '#4f46e5', swatchDark: '#a5b4fc' },
  { id: 'high-contrast', label: 'High contrast', tag: 'a11y', palette: 'slate', skin: 'high-contrast',
    swatchLight: '#0f141c', swatchDark: '#e8ecf3' },
  { id: 'playful', label: 'Playful', tag: 'skin', palette: 'rose', skin: 'playful',
    swatchLight: '#be185d', swatchDark: '#fda4af' },
  { id: 'newspaper', label: 'Newspaper', tag: 'skin', palette: 'slate', skin: 'newspaper',
    swatchLight: '#0f141c', swatchDark: '#e8ecf3' },
  { id: 'aurora', label: 'Aurora', tag: 'skin', palette: 'violet', skin: 'aurora',
    swatchLight: '#7c3aed', swatchDark: '#c4b5fd' },
];

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
    ...HELL_MENU_DIRECTIVES,
    ...HELL_OMNIBAR_DIRECTIVES,
    ...HELL_SELECT_DIRECTIVES,
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly systemScheme = this.getSystemScheme();

  protected readonly themePreference = signal<ThemePreference>(this.readThemePreference());
  protected readonly themeId = signal<string>(this.readThemeId());
  protected readonly themes = HD_THEMES;
  protected readonly systemTheme = signal<'light' | 'dark'>(
    this.systemScheme?.matches ? 'dark' : 'light',
  );
  protected readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const preference = this.themePreference();
    return preference === 'system' ? this.systemTheme() : preference;
  });
  protected readonly currentTheme = computed<ThemeOption>(
    () => HD_THEMES.find((t) => t.id === this.themeId()) ?? HD_THEMES[0],
  );
  protected readonly currentPaletteSwatch = computed(() => {
    const option = this.currentTheme();
    return this.resolvedTheme() === 'dark' ? option.swatchDark : option.swatchLight;
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
        { path: '/components/combobox', label: 'Combobox', icon: 'faSolidPenRuler' },
        { path: '/components/date-picker', label: 'Date picker', icon: 'faSolidCalendar' },
        { path: '/components/dialog', label: 'Dialog', icon: 'faSolidWindowRestore' },
        { path: '/components/field', label: 'Field', icon: 'faSolidPenToSquare' },
        { path: '/components/flyout', label: 'Flyout', icon: 'faSolidComment' },
        { path: '/components/icon', label: 'Icon', icon: 'faSolidStar' },
        { path: '/components/input', label: 'Input & select', icon: 'faSolidPenRuler' },
        { path: '/components/listbox', label: 'Listbox', icon: 'faSolidBars' },
        { path: '/components/menu', label: 'Menu', icon: 'faSolidEllipsisVertical' },
        { path: '/components/pagination', label: 'Pagination', icon: 'faSolidTableColumns' },
        { path: '/components/popover', label: 'Popover', icon: 'faSolidComment' },
        { path: '/components/progress', label: 'Progress', icon: 'faSolidSliders' },
        { path: '/components/radio', label: 'Radio', icon: 'faSolidCircleHalfStroke' },
        { path: '/components/search', label: 'Search', icon: 'faSolidMagnifyingGlass' },
        { path: '/components/select', label: 'Select', icon: 'faSolidPenRuler' },
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
        { path: '/components/omnibar', label: 'Omnibar', icon: 'faSolidMagnifyingGlass' },
        { path: '/components/resizable', label: 'Resizable', icon: 'faSolidGripVertical' },
        { path: '/components/split-view', label: 'Split view', icon: 'faSolidTableColumns' },
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

  protected readonly docsSearchQuery = signal('');
  protected readonly docsSearchResults = signal<readonly HellSearchResult<DocsSearchItem>[]>([]);
  protected readonly docsKindFilter = signal<DocsSearchKindFilter>('all');
  protected readonly docsSectionFilter = signal<string>('all');
  protected readonly docsSearchLimit = signal<8 | 20 | 40>(20);
  protected readonly docsSearchLimits = [8, 20, 40] as const;
  protected readonly docsMenuOpenTriggers: ('click' | 'enter' | 'arrowkey')[] = [
    'click',
    'enter',
    'arrowkey',
  ];
  protected readonly docsSearchFields: readonly HellSearchField<DocsSearchItem>[] = [
    { name: 'title', weight: 5, get: (item) => item.title },
    { name: 'section', weight: 3, get: (item) => item.section },
    { name: 'kind', weight: 2, get: (item) => HD_DOCS_KIND_LABEL[item.kind] },
    { name: 'path', weight: 2, get: (item) => item.path },
    { name: 'detail', weight: 1.5, get: (item) => item.detail },
    { name: 'content', weight: 1, get: (item) => item.haystack },
  ];
  protected readonly docsSearchItems = computed<readonly DocsSearchItem[]>(() => {
    const kind = this.docsKindFilter();
    const section = this.docsSectionFilter();
    return this.docsSearchIndex().filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (section !== 'all' && item.section !== section) return false;
      return true;
    });
  });
  protected readonly docsSectionOptions = computed(() =>
    [...new Set(this.docsSearchIndex().map((item) => item.section))].sort(),
  );
  protected readonly docsSearchGroups = computed<readonly DocsSearchGroup[]>(() => {
    const rankedResults = this.docsSearchResults().map((result) => result.item);
    const ranked =
      rankedResults.length || this.docsSearchQuery().trim()
        ? rankedResults
        : this.docsSearchItems().slice(0, this.docsSearchLimit());

    return (['page', 'example', 'usage'] as const)
      .map((kind) => ({
        kind,
        label: HD_DOCS_KIND_LABEL[kind],
        items: ranked.filter((item) => item.kind === kind).slice(0, kind === 'page' ? 8 : 6),
      }))
      .filter((group) => group.items.length > 0);
  });
  protected readonly docsSearchCount = computed(() =>
    this.docsSearchGroups().reduce((count, group) => count + group.items.length, 0),
  );
  protected readonly docsSearchEmptyMessage = computed(() =>
    this.docsSearchQuery().trim() ? 'No docs match that query' : 'No docs in this filter',
  );
  protected readonly docsKindLabel = computed(() => HD_DOCS_KIND_FILTER_LABEL[this.docsKindFilter()]);
  protected readonly docsSectionLabel = computed(() =>
    this.docsSectionFilter() === 'all' ? 'All sections' : this.docsSectionFilter(),
  );
  protected readonly docsSearchControlsActive = computed(
    () =>
      this.docsKindFilter() !== 'all' ||
      this.docsSectionFilter() !== 'all' ||
      this.docsSearchLimit() !== 20,
  );
  protected readonly docsSearchIndex = computed<readonly DocsSearchItem[]>(() => {
    const pageItems = this.sections.flatMap((section) => {
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
  });

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
    effect(() => this.applyThemeOption(this.currentTheme()));

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

  protected onPaletteChange(value: string | null): void {
    if (!value) return;
    if (!HD_THEMES.some((t) => t.id === value)) return;
    this.themeId.set(value);
    this.writeThemeId(value);
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

  protected onDocsSearchSelect(item: DocsSearchItem, shell: HellAppShell): void {
    void this.router.navigateByUrl(item.path);
    shell.closeMobilePanels();
    this.docsSearchQuery.set('');
  }

  protected onDocsSearchResults(results: readonly HellSearchResult<unknown>[]): void {
    this.docsSearchResults.set(results as readonly HellSearchResult<DocsSearchItem>[]);
  }

  protected setDocsKindFilter(kind: DocsSearchKindFilter): void {
    this.docsKindFilter.set(kind);
  }

  protected setDocsSectionFilter(section: string): void {
    this.docsSectionFilter.set(section);
  }

  protected setDocsSearchLimit(limit: 8 | 20 | 40): void {
    this.docsSearchLimit.set(limit);
  }

  protected resetDocsSearchControls(): void {
    this.docsKindFilter.set('all');
    this.docsSectionFilter.set('all');
    this.docsSearchLimit.set(20);
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

  private readThemeId(): string {
    if (typeof localStorage === 'undefined') return 'slate';
    const stored = localStorage.getItem(HD_PALETTE_STORAGE_KEY);
    return stored && HD_THEMES.some((t) => t.id === stored) ? stored : 'slate';
  }

  private writeThemeId(value: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HD_PALETTE_STORAGE_KEY, value);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['hellTheme'] = theme;
    document.documentElement.style.colorScheme = theme;
  }

  private applyThemeOption(option: ThemeOption): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['hellPalette'] = option.palette;
    if (option.skin === 'default') {
      delete document.documentElement.dataset['hellSkin'];
    } else {
      document.documentElement.dataset['hellSkin'] = option.skin;
    }
  }
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
