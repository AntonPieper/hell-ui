import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAnglesRight,
  faSolidArrowRight,
  faSolidBarsProgress,
  faSolidBarsStaggered,
  faSolidBell,
  faSolidBook,
  faSolidBoxOpen,
  faSolidCalendarDay,
  faSolidCalendarDays,
  faSolidCaretDown,
  faSolidCheck,
  faSolidCircleDot,
  faSolidCircleQuestion,
  faSolidClock,
  faSolidCode,
  faSolidCommentDots,
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFilter,
  faSolidFloppyDisk,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidHandPointer,
  faSolidHashtag,
  faSolidHeading,
  faSolidHouse,
  faSolidICursor,
  faSolidIdCard,
  faSolidKeyboard,
  faSolidLayerGroup,
  faSolidLeftRight,
  faSolidListUl,
  faSolidMagnifyingGlass,
  faSolidMessage,
  faSolidMoon,
  faSolidPalette,
  faSolidPhone,
  faSolidPlay,
  faSolidRectangleList,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidSpinner,
  faSolidSquareCheck,
  faSolidStar,
  faSolidSun,
  faSolidTable,
  faSolidTableColumns,
  faSolidTag,
  faSolidTags,
  faSolidTerminal,
  faSolidToggleOff,
  faSolidToggleOn,
  faSolidTriangleExclamation,
  faSolidUniversalAccess,
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
  HellNavItem,
  HellNavItemIcon,
  HellNavItemLabel,
  HellNavSection,
  HellNavSectionItems,
  HellNavSectionToggle,
} from '@hell-ui/angular/app-shell';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { HellTag } from '@hell-ui/angular/tag';
import { HellToaster } from '@hell-ui/angular/toast';
import { type HellSearchField, type HellSearchResult } from '@hell-ui/angular/core';
import {
  HD_DOCS_KIND_FILTER_LABEL,
  HD_DOCS_KIND_FILTER_OPTIONS,
  HD_DOCS_KIND_LABEL,
  HD_DOCS_SECTIONS,
  type DocsSearchGroup,
  type DocsSearchItem,
  type DocsSearchKindFilter,
} from './docs-catalog';

const HD_APP_ICONS = {
  faSolidAnglesRight,
  faSolidArrowRight,
  faSolidBarsProgress,
  faSolidBarsStaggered,
  faSolidBell,
  faSolidBook,
  faSolidBoxOpen,
  faSolidCalendarDay,
  faSolidCalendarDays,
  faSolidCaretDown,
  faSolidCheck,
  faSolidCircleDot,
  faSolidCircleQuestion,
  faSolidClock,
  faSolidCode,
  faSolidCommentDots,
  faSolidDesktop,
  faSolidEllipsisVertical,
  faSolidFilePdf,
  faSolidFilter,
  faSolidFloppyDisk,
  faSolidFolderOpen,
  faSolidGripLines,
  faSolidHandPointer,
  faSolidHashtag,
  faSolidHeading,
  faSolidHouse,
  faSolidICursor,
  faSolidIdCard,
  faSolidKeyboard,
  faSolidLayerGroup,
  faSolidLeftRight,
  faSolidListUl,
  faSolidMagnifyingGlass,
  faSolidMessage,
  faSolidMoon,
  faSolidPalette,
  faSolidPhone,
  faSolidPlay,
  faSolidRectangleList,
  faSolidRocket,
  faSolidSignsPost,
  faSolidSliders,
  faSolidSpinner,
  faSolidSquareCheck,
  faSolidStar,
  faSolidSun,
  faSolidTable,
  faSolidTableColumns,
  faSolidTag,
  faSolidTags,
  faSolidTerminal,
  faSolidToggleOff,
  faSolidToggleOn,
  faSolidTriangleExclamation,
  faSolidUniversalAccess,
  faSolidUpload,
  faSolidUser,
  faSolidUsers,
  faSolidWindowMaximize,
  faSolidWindowRestore,
};

type ThemePreference = 'system' | 'light' | 'dark';
type Palette = 'slate' | 'indigo' | 'emerald' | 'violet';
type Skin = 'default' | 'glass' | 'high-contrast' | 'newspaper' | 'aurora' | 'compact-mono';

interface ThemeOption {
  readonly id: string;
  readonly label: string;
  readonly tag?: string;
  readonly palette: Palette;
  readonly skin: Skin;
  readonly swatchLight: string;
  readonly swatchDark: string;
  readonly adapterHref?: string;
}

const HD_THEME_STORAGE_KEY = 'hell-docs-theme';
const HD_THEME_ID_STORAGE_KEY = 'hell-docs-theme-id';
const HD_THEME_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Curated themes shown in the topbar Docs Theme Picker. */
const HD_THEMES: readonly ThemeOption[] = [
  {
    id: 'slate',
    label: 'Slate',
    palette: 'slate',
    skin: 'default',
    swatchLight: '#313a46',
    swatchDark: '#b8c4dc',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    palette: 'emerald',
    skin: 'default',
    swatchLight: '#047857',
    swatchDark: '#6ee7b7',
  },
  {
    id: 'glass',
    label: 'Glass',
    tag: 'adapter',
    palette: 'indigo',
    skin: 'glass',
    swatchLight: '#4f46e5',
    swatchDark: '#a5b4fc',
    adapterHref: 'hell-ui/themes/glass.css',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    tag: 'adapter',
    palette: 'violet',
    skin: 'aurora',
    swatchLight: '#7c3aed',
    swatchDark: '#c4b5fd',
    adapterHref: 'hell-ui/themes/aurora.css',
  },
  {
    id: 'newspaper',
    label: 'Newspaper',
    tag: 'adapter',
    palette: 'slate',
    skin: 'newspaper',
    swatchLight: '#0f141c',
    swatchDark: '#e8ecf3',
    adapterHref: 'hell-ui/themes/newspaper.css',
  },
  {
    id: 'high-contrast',
    label: 'High contrast',
    tag: 'adapter',
    palette: 'slate',
    skin: 'high-contrast',
    swatchLight: '#0f141c',
    swatchDark: '#e8ecf3',
    adapterHref: 'hell-ui/themes/high-contrast.css',
  },
  {
    id: 'compact-mono',
    label: 'Compact mono',
    tag: 'adapter',
    palette: 'emerald',
    skin: 'compact-mono',
    swatchLight: '#047857',
    swatchDark: '#6ee7b7',
    adapterHref: 'hell-ui/themes/compact-mono.css',
  },
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
    HellNavItem,
    HellNavItemIcon,
    HellNavItemLabel,
    HellNavSection,
    HellNavSectionToggle,
    HellNavSectionItems,
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
  private readonly documentRef = inject(DOCUMENT);
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
  protected readonly currentThemeSwatch = computed(() => {
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

  protected readonly sections = HD_DOCS_SECTIONS;

  protected readonly docsSearchQuery = signal('');
  protected readonly docsSearchResults = signal<readonly HellSearchResult<DocsSearchItem>[]>([]);
  protected readonly docsKindFilter = signal<DocsSearchKindFilter>('all');
  protected readonly docsSectionFilter = signal<string>('all');
  protected readonly docsSearchLimit = signal<8 | 20 | 40>(20);
  protected readonly docsKindFilterOptions = HD_DOCS_KIND_FILTER_OPTIONS;
  protected readonly docsKindFilterLabels = HD_DOCS_KIND_FILTER_LABEL;
  protected readonly docsSearchLimits = [8, 20, 40] as const;
  protected readonly docsSearchIndex = signal<readonly DocsSearchItem[]>([]);
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
    [...new Set(HD_DOCS_SECTIONS.map((section) => section.heading ?? 'Guides'))].sort(),
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
  protected readonly docsKindLabel = computed(
    () => HD_DOCS_KIND_FILTER_LABEL[this.docsKindFilter()],
  );
  protected readonly docsSectionLabel = computed(() =>
    this.docsSectionFilter() === 'all' ? 'All sections' : this.docsSectionFilter(),
  );
  protected readonly docsSearchControlsActive = computed(
    () =>
      this.docsKindFilter() !== 'all' ||
      this.docsSectionFilter() !== 'all' ||
      this.docsSearchLimit() !== 20,
  );
  private docsSearchIndexLoad?: Promise<void>;

  /** Per-section collapse state for the controlled docs sidenav. */
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

  protected onThemeChange(value: string | null): void {
    if (!value) return;
    if (!HD_THEMES.some((t) => t.id === value)) return;
    this.themeId.set(value);
    this.writeThemeId(value);
  }

  protected isSectionCollapsed(heading: string): boolean {
    return this.collapsedSections().has(heading);
  }

  protected setSectionCollapsed(heading: string, collapsed: boolean): void {
    this.collapsedSections.update((current) => {
      const next = new Set(current);
      if (collapsed) next.add(heading);
      else next.delete(heading);
      return next;
    });
  }

  protected onDocsSearchOpenChange(open: boolean): void {
    if (!open) return;
    void this.loadDocsSearchIndex();
  }

  protected onDocsSearchSelect(item: DocsSearchItem, shell: HellAppShell): void {
    void this.router.navigateByUrl(item.path);
    shell.closeMobilePanels();
    this.docsSearchQuery.set('');
  }

  protected onDocsSearchResults(results: readonly HellSearchResult<unknown>[]): void {
    this.docsSearchResults.set(results as readonly HellSearchResult<DocsSearchItem>[]);
  }

  private async loadDocsSearchIndex(): Promise<void> {
    if (this.docsSearchIndex().length) return;
    if (this.docsSearchIndexLoad) {
      await this.docsSearchIndexLoad;
      return;
    }

    this.docsSearchIndexLoad = import('./docs-search-index')
      .then(({ hdBuildDocsSearchIndex }) => {
        this.docsSearchIndex.set(hdBuildDocsSearchIndex());
      })
      .catch((error) => {
        console.error('Failed to load docs search index', error);
      })
      .finally(() => {
        this.docsSearchIndexLoad = undefined;
      });

    await this.docsSearchIndexLoad;
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
    const stored = localStorage.getItem(HD_THEME_ID_STORAGE_KEY);
    return stored && HD_THEMES.some((t) => t.id === stored) ? stored : 'slate';
  }

  private writeThemeId(value: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HD_THEME_ID_STORAGE_KEY, value);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['hellTheme'] = theme;
    document.documentElement.style.colorScheme = theme;
  }

  private applyThemeOption(option: ThemeOption): void {
    if (typeof document === 'undefined') return;
    this.loadThemeAdapter(option);
    document.documentElement.dataset['hellPalette'] = option.palette;
    if (option.skin === 'default') {
      delete document.documentElement.dataset['hellSkin'];
    } else {
      document.documentElement.dataset['hellSkin'] = option.skin;
    }
  }

  private loadThemeAdapter(option: ThemeOption): void {
    if (!option.adapterHref) return;

    const id = `hell-docs-theme-adapter-${option.id}`;
    if (this.documentRef.getElementById(id)) return;

    const link = this.documentRef.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = new URL(option.adapterHref, this.documentRef.baseURI).toString();
    this.documentRef.head.appendChild(link);
  }
}
