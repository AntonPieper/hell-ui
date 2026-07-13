import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBolt,
  faSolidBoxOpen,
  faSolidFeather,
  faSolidPuzzlePiece,
  faSolidSwatchbook,
  faSolidUniversalAccess,
} from '@ng-icons/font-awesome/solid';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellChip } from '@hell-ui/angular/chip';

const HD_OVERVIEW_ICONS = {
  faSolidBolt,
  faSolidBoxOpen,
  faSolidFeather,
  faSolidPuzzlePiece,
  faSolidSwatchbook,
  faSolidUniversalAccess,
};

interface OverviewFeature {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

interface OverviewSectionLink {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly links: readonly { label: string; path: string }[];
}

const HD_OVERVIEW_FEATURES: readonly OverviewFeature[] = [
  {
    icon: 'faSolidFeather',
    title: 'Dense by default',
    body: 'Neutral surfaces, small radii, compact controls, and clear focus states — tuned for line-of-business screens people use all day.',
  },
  {
    icon: 'faSolidUniversalAccess',
    title: 'Accessibility delegated, not reinvented',
    body: 'Keyboard, focus, and ARIA semantics come from ng-primitives and the CDK underneath stable hell selectors, verified by browser contract tests.',
  },
  {
    icon: 'faSolidSwatchbook',
    title: 'Styling is a contract',
    body: 'Named Public Parts, data-* state attributes, semantic tokens, and one deterministic ui override pipeline — no fighting internal DOM.',
  },
  {
    icon: 'faSolidBoxOpen',
    title: 'Pay only for what you import',
    body: 'Import-path-first entry points keep peer dependencies and CSS attached to the surfaces that need them. The root export is core-only.',
  },
];

const HD_OVERVIEW_SECTIONS: readonly OverviewSectionLink[] = [
  {
    icon: 'faSolidBolt',
    title: 'Buttons & indicators',
    body: 'Buttons, toggles, tags, and loading states for toolbars and status-heavy screens.',
    links: [
      { label: 'Button', path: '/components/button' },
      { label: 'Toggle', path: '/components/toggle' },
      { label: 'Tag', path: '/components/chip' },
      { label: 'Progress', path: '/components/progress' },
    ],
  },
  {
    icon: 'faSolidPuzzlePiece',
    title: 'Forms & input',
    body: 'Fields, selection controls, typed date/time entry, and pickers with parsing and validation built in.',
    links: [
      { label: 'Field', path: '/components/field' },
      { label: 'Select', path: '/components/select' },
      { label: 'Combobox', path: '/components/combobox' },
      { label: 'Date input', path: '/components/date-input' },
    ],
  },
  {
    icon: 'faSolidBoxOpen',
    title: 'Overlays & feedback',
    body: 'Dialogs, menus, popovers, toasts, and a command-palette omnibar with shared dismissal rules.',
    links: [
      { label: 'Dialog', path: '/components/dialog' },
      { label: 'Menu', path: '/components/menu' },
      { label: 'Toast', path: '/components/toast' },
      { label: 'Omnibar', path: '/components/omnibar' },
    ],
  },
  {
    icon: 'faSolidFeather',
    title: 'Navigation & layout',
    body: 'An app shell with topbar/sidenav/secondary panel, plus tabs, breadcrumbs, and resizable panes.',
    links: [
      { label: 'App shell', path: '/components/app-shell' },
      { label: 'Tabs', path: '/components/tabs' },
      { label: 'Resizable', path: '/components/resizable' },
      { label: 'Split view', path: '/components/split-view' },
    ],
  },
  {
    icon: 'faSolidSwatchbook',
    title: 'Tables',
    body: 'Semantic native-table primitives, and a Hell-styled shell around a caller-owned TanStack Table.',
    links: [{ label: 'Table', path: '/components/table' }],
  },
  {
    icon: 'faSolidBolt',
    title: 'Features',
    body: 'CodeMirror editing and pdf.js viewing behind optional, lazy entry points that cost nothing until imported.',
    links: [
      { label: 'Code editor', path: '/components/code-editor' },
      { label: 'PDF viewer', path: '/components/pdf-viewer' },
    ],
  },
];

@Component({
  selector: 'hd-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_OVERVIEW_ICONS)],
  imports: [RouterLink, HellButton, HellIcon, HellChip, ...HELL_CARD_DIRECTIVES],
  template: `
    <div class="hd-landing">
      <section class="hd-hero">
        <span class="hd-hero-logo" aria-hidden="true"></span>
        <span hellChip variant="info">Heinrich Element Library</span>
        <h1>Angular components for dense business software</h1>
        <p class="hd-hero-tagline">
          hell pairs ng-primitives behavior with a restrained Tailwind v4 token layer. You keep
          your markup; the library contributes behavior, accessibility, state attributes, and a
          styling contract you can refine without forking.
        </p>
        <div class="hd-hero-actions">
          <a hellButton variant="primary" routerLink="/getting-started">Get started</a>
          <a hellButton variant="ghost" routerLink="/guide">Read the guide</a>
          <a
            hellButton
            variant="ghost"
            href="https://github.com/AntonPieper/hell-ui"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </section>

      <section aria-labelledby="hd-overview-principles">
        <h2 id="hd-overview-principles" class="hd-landing-section-title">Why hell</h2>
        <div class="hd-landing-grid">
          @for (feature of features; track feature.title) {
            <div hellCard class="hd-landing-card">
              <div hellCardHeader>
                <span class="hd-landing-card-title">
                  <hell-icon [name]="feature.icon" size="14px" />
                  {{ feature.title }}
                </span>
              </div>
              <div hellCardBody class="hd-landing-card-body">{{ feature.body }}</div>
            </div>
          }
        </div>
      </section>

      <section aria-labelledby="hd-overview-explore">
        <h2 id="hd-overview-explore" class="hd-landing-section-title">Explore the components</h2>
        <div class="hd-landing-grid">
          @for (section of componentSections; track section.title) {
            <div hellCard class="hd-landing-card">
              <div hellCardHeader>
                <span class="hd-landing-card-title">
                  <hell-icon [name]="section.icon" size="14px" />
                  {{ section.title }}
                </span>
              </div>
              <div hellCardBody class="hd-landing-card-body">
                {{ section.body }}
                <span class="hd-landing-links">
                  @for (link of section.links; track link.path) {
                    <a hellButton variant="ghost" size="xs" [routerLink]="link.path">
                      {{ link.label }}
                    </a>
                  }
                </span>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class OverviewPage {
  protected readonly features = HD_OVERVIEW_FEATURES;
  protected readonly componentSections = HD_OVERVIEW_SECTIONS;
}
