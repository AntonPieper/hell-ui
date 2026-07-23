import { ChangeDetectionStrategy, Component, Directive, computed, contentChild, contentChildren, inject, input, output } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { hellCreateLabels, type HellLabels, hellPartStyler, type HellUi, type HellUiInput } from 'hell-ui/core';
import type { InjectionToken } from '@angular/core';

import { HELL_PAGE_HEADER_BACK_RECIPE, HELL_PAGE_HEADER_LAYOUT_CLASSES, HELL_PAGE_HEADER_RECIPE } from './page-header.recipes';

/** Built-in accessibility labels owned by the page-header entry point. */
export interface HellPageHeaderLabels {
  /** Accessible name for the back affordance button. */
  readonly back: string;
}

/** Injection token resolving to the effective page-header labels. */
export const HELL_PAGE_HEADER_LABELS: InjectionToken<HellLabels<HellPageHeaderLabels>> = hellCreateLabels<HellPageHeaderLabels>(
  'HELL_PAGE_HEADER_LABELS',
  {
    back: 'Go back',
  },
);

/** Heading level the title element is rendered at. Defaults to `1`. */
export type HellPageHeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Public parts of the HellPageHeader module, styleable through its Part Style Map. */
export type HellPageHeaderPart =
  | 'root'
  | 'leading'
  | 'titleGroup'
  | 'title'
  | 'meta'
  | 'description'
  | 'toolbar';
/** Part Style Map accepted by the HellPageHeader `ui` input. */
export type HellPageHeaderUi = HellUi<HellPageHeaderPart>;

/** Marks projected leading content (breadcrumbs, etc.) for the page header's `leading` region. */
@Directive({ selector: '[hellPageHeaderLeading]' })
export class HellPageHeaderLeading {}

/** Marks the projected title content rendered inside the page header's heading element. */
@Directive({ selector: '[hellPageHeaderTitle]' })
export class HellPageHeaderTitle {}

/** Marks projected meta content (status badges, counts) for the page header's `meta` region. */
@Directive({ selector: '[hellPageHeaderMeta]' })
export class HellPageHeaderMeta {}

/** Marks projected description content for the page header's `description` region. */
@Directive({ selector: '[hellPageHeaderDescription]' })
export class HellPageHeaderDescription {}

/** Marks a projected toolbar (or other trailing actions) for the page header's `toolbar` region. */
@Directive({ selector: '[hellPageHeaderToolbar]' })
export class HellPageHeaderToolbar {}

/**
 * The optional back affordance for a page header. Renders a ghost icon button
 * with an inline chevron (no icon-package dependency) and emits `back` when
 * activated — it performs no navigation itself, so routing stays with the app.
 * Its accessible name comes from the page-header Label Contract
 * (`HELL_PAGE_HEADER_LABELS`) and can be overridden per instance with
 * `aria-label`. Place it in the header's leading region; the header projects it
 * automatically without a `hellPageHeaderLeading` marker.
 */
@Component({
  selector: 'hell-page-header-back',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: `
    <button
      hellButton
      type="button"
      iconOnly
      variant="ghost"
      size="sm"
      [attr.aria-label]="resolvedLabel()"
      (click)="back.emit()"
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M10 12 6 8l4-4" />
      </svg>
    </button>
  `,
})
export class HellPageHeaderBack {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGE_HEADER_BACK_RECIPE,
  });

  /** Accessible name override. Defaults to the `back` label from the Label Contract. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Emits when the back affordance is activated. Carries no navigation. */
  readonly back = output<void>();

  private readonly labels = inject(HELL_PAGE_HEADER_LABELS);

  /** Effective accessible name: the per-instance override or the Label Contract default. */
  protected readonly resolvedLabel = computed(() => this.ariaLabel() ?? this.labels.back);
}

/**
 * `hell-page-header` — a slot-based page chrome composite. A developer composes
 * a header from projected content: a leading region (an optional
 * `hell-page-header-back` affordance and/or breadcrumbs), a title group whose
 * heading element carries a configurable `level` (default `1`, exposed as the
 * page's main heading) alongside meta badges, an optional description, and a
 * trailing toolbar region. There is no config-array API — every region is
 * content projection of real Hell components, so the same header anatomy serves
 * dense list screens and detail screens alike, and it is responsive by default.
 *
 * Slots (projected with marker directives, all optional except the title):
 *   - `hell-page-header-back` / `[hellPageHeaderLeading]` → leading region
 *   - `[hellPageHeaderTitle]`       → the heading element's content
 *   - `[hellPageHeaderMeta]`        → status badges beside the title
 *   - `[hellPageHeaderDescription]` → a supporting line under the title
 *   - `[hellPageHeaderToolbar]`     → trailing actions (typically `hell-overflow-toolbar`)
 */
@Component({
  selector: 'hell-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: `
    @if (hasLeading()) {
      <div data-slot="leading" [class]="part('leading')">
        <ng-content select="hell-page-header-back, [hellPageHeaderLeading]" />
      </div>
    }

    <!--
      The row wrappers are private scaffolding, not Public Parts. Their classes
      bind from the shipped recipe module so consumer Tailwind builds can scan
      them without the component implementation shipping.
    -->
    <div [class]="layout.body">
      <div data-slot="titleGroup" [class]="part('titleGroup')">
        <div [class]="layout.titleRow">
          <!--
            A single element carries the heading role plus a matching aria-level
            so the projected title exposes exactly one main heading at the chosen
            level (default 1). Dynamically swapping the native h1–h6 tag is not
            possible without breaking content projection, so the semantics ride
            on role/aria-level, which screen readers and the accessibility tree
            treat as a real heading.
          -->
          <div
            data-slot="title"
            role="heading"
            [attr.aria-level]="level()"
            [class]="part('title')"
          >
            <ng-content select="[hellPageHeaderTitle]" />
          </div>

          @if (hasMeta()) {
            <div data-slot="meta" [class]="part('meta')">
              <ng-content select="[hellPageHeaderMeta]" />
            </div>
          }
        </div>

        @if (hasDescription()) {
          <div data-slot="description" [class]="part('description')">
            <ng-content select="[hellPageHeaderDescription]" />
          </div>
        }
      </div>

      @if (hasToolbar()) {
        <div data-slot="toolbar" [class]="part('toolbar')">
          <ng-content select="[hellPageHeaderToolbar]" />
        </div>
      }
    </div>
  `,
})
export class HellPageHeader {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPageHeaderPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPageHeaderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PAGE_HEADER_RECIPE,
  });

  /** Structural classes of the private row wrappers, from the shipped recipe module. */
  protected readonly layout = HELL_PAGE_HEADER_LAYOUT_CLASSES;

  /**
   * Heading level of the title element (`1`–`6`). Defaults to `1` so the title
   * is the page's main heading; lower it when the header sits under a larger
   * document outline.
   */
  readonly level = input<HellPageHeaderLevel>(1);

  private readonly back = contentChild(HellPageHeaderBack);
  private readonly leadingItems = contentChildren(HellPageHeaderLeading);
  private readonly meta = contentChild(HellPageHeaderMeta);
  private readonly description = contentChild(HellPageHeaderDescription);
  private readonly toolbarItem = contentChild(HellPageHeaderToolbar);

  /** Whether a back affordance or leading content is projected, gating the `leading` region. */
  protected readonly hasLeading = computed(
    () => this.back() != null || this.leadingItems().length > 0,
  );
  /** Whether meta content is projected, gating the `meta` region. */
  protected readonly hasMeta = computed(() => this.meta() != null);
  /** Whether description content is projected, gating the `description` region. */
  protected readonly hasDescription = computed(() => this.description() != null);
  /** Whether a toolbar is projected, gating the `toolbar` region. */
  protected readonly hasToolbar = computed(() => this.toolbarItem() != null);
}

/** All directives that make up the page-header entry point, for bulk `imports`. */
export const HELL_PAGE_HEADER_IMPORTS = [
  HellPageHeader,
  HellPageHeaderBack,
  HellPageHeaderLeading,
  HellPageHeaderTitle,
  HellPageHeaderMeta,
  HellPageHeaderDescription,
  HellPageHeaderToolbar,
] as const;
