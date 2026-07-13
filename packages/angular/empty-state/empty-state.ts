import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import {
  hellCreateLabels,
  hellPartStyler,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import type { InjectionToken } from '@angular/core';

/**
 * Preset situations an empty state can represent. Each preset supplies a
 * default glyph and default title/description strings from the Label Contract.
 */
export type HellEmptyStatePreset = 'noData' | 'noResults' | 'error' | 'forbidden';

/**
 * Heading level the title is promoted to when
 * {@link HellEmptyState.headingLevel} is set. `null` keeps the title as a
 * non-semantic emphasized element.
 */
export type HellEmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** Built-in preset copy owned by the empty-state entry point. */
export interface HellEmptyStateLabels {
  /** Default title for the `noData` preset. */
  readonly noDataTitle: string;
  /** Default description for the `noData` preset. */
  readonly noDataDescription: string;
  /** Default title for the `noResults` preset. */
  readonly noResultsTitle: string;
  /** Default description for the `noResults` preset. */
  readonly noResultsDescription: string;
  /** Default title for the `error` preset. */
  readonly errorTitle: string;
  /** Default description for the `error` preset. */
  readonly errorDescription: string;
  /** Default title for the `forbidden` preset. */
  readonly forbiddenTitle: string;
  /** Default description for the `forbidden` preset. */
  readonly forbiddenDescription: string;
}

/** Injection token resolving to the effective empty-state labels. */
export const HELL_EMPTY_STATE_LABELS: InjectionToken<HellEmptyStateLabels> = hellCreateLabels<HellEmptyStateLabels>(
  'HELL_EMPTY_STATE_LABELS',
  {
    noDataTitle: 'Nothing here yet',
    noDataDescription: 'There is no data to show.',
    noResultsTitle: 'No matches',
    noResultsDescription: 'No results match your current filters.',
    errorTitle: 'Something went wrong',
    errorDescription: 'We could not load this content.',
    forbiddenTitle: 'Access restricted',
    forbiddenDescription: 'You do not have permission to view this.',
  },
);

/** Public parts of the HellEmptyState module, styleable through its Part Style Map. */
export type HellEmptyStatePart = 'root' | 'media' | 'title' | 'description' | 'actions';
/** Part Style Map accepted by the HellEmptyState `ui` input. */
export type HellEmptyStateUi = HellUi<HellEmptyStatePart>;

const HELL_EMPTY_STATE_RECIPE = {
  root: 'flex h-full w-full min-h-0 min-w-0 flex-col items-center justify-center gap-hell-4 p-hell-8 text-center text-hell-foreground',
  media: 'flex items-center justify-center text-4xl leading-none text-hell-foreground-subtle',
  title: 'text-base font-semibold text-hell-foreground',
  description: 'max-w-prose text-sm text-hell-foreground-muted',
  actions: 'mt-hell-2 flex flex-wrap items-center justify-center gap-hell-3',
} satisfies HellRecipe<HellEmptyStatePart>;

/** Marks projected custom media (icon or illustration) for the empty state's `media` part. */
@Directive({ selector: '[hellEmptyStateMedia]' })
export class HellEmptyStateMedia {}

/** Marks projected custom title content for the empty state's `title` part. */
@Directive({ selector: '[hellEmptyStateTitle]' })
export class HellEmptyStateTitle {}

/** Marks projected custom description content for the empty state's `description` part. */
@Directive({ selector: '[hellEmptyStateDescription]' })
export class HellEmptyStateDescription {}

/** Marks projected consumer actions (typically Hell buttons) for the empty state's `actions` part. */
@Directive({ selector: '[hellEmptyStateActions]' })
export class HellEmptyStateActions {}

/**
 * `hell-empty-state` — a centered media/title/description/actions presentation
 * for any content region that has nothing to show.
 *
 * A `preset` (`noData | noResults | error | forbidden`) supplies a default glyph
 * and default title/description strings from the Label Contract. Any region can
 * be overridden by projecting content with `hellEmptyStateMedia`,
 * `hellEmptyStateTitle`, `hellEmptyStateDescription`, or `hellEmptyStateActions`;
 * projected content always wins over the preset default. The component owns
 * container-filling centering, so call sites need no margin hacks.
 *
 * Usage:
 *   <hell-empty-state preset="noResults">
 *     <button hellEmptyStateActions hellButton (click)="clear()">Clear filters</button>
 *   </hell-empty-state>
 */
@Component({
  selector: 'hell-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-preset]': 'preset()',
  },
  template: `
    @if (hasCustomMedia() || preset()) {
      <div data-slot="media" [class]="part('media')">
        @if (hasCustomMedia()) {
          <ng-content select="[hellEmptyStateMedia]" />
        } @else {
          <!-- Preset glyphs are inline SVG so the entry point stays dependency-free
               (table-shell composes it in minimal consumers without icon packages). -->
          @switch (preset()) {
            @case ('noData') {
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            }
            @case ('noResults') {
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
            @case ('error') {
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            }
            @case ('forbidden') {
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          }
        }
      </div>
    }

    @if (hasCustomTitle() || resolvedTitle()) {
      <div
        data-slot="title"
        [class]="part('title')"
        [attr.role]="!hasCustomTitle() && headingLevel() ? 'heading' : null"
        [attr.aria-level]="hasCustomTitle() ? null : headingLevel()"
      >
        @if (hasCustomTitle()) {
          <ng-content select="[hellEmptyStateTitle]" />
        } @else {
          {{ resolvedTitle() }}
        }
      </div>
    }

    @if (hasCustomDescription() || resolvedDescription()) {
      <div data-slot="description" [class]="part('description')">
        @if (hasCustomDescription()) {
          <ng-content select="[hellEmptyStateDescription]" />
        } @else {
          {{ resolvedDescription() }}
        }
      </div>
    }

    @if (hasActions()) {
      <div data-slot="actions" [class]="part('actions')">
        <ng-content select="[hellEmptyStateActions]" />
      </div>
    }
  `,
})
export class HellEmptyState {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellEmptyStatePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellEmptyStatePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_EMPTY_STATE_RECIPE,
  });

  /**
   * Situation this empty state represents. Selects the default glyph and the
   * default title/description strings. Defaults to `null` — with no preset and
   * no projected content the component renders only what is projected.
   */
  readonly preset = input<HellEmptyStatePreset | null>(null);

  /**
   * Heading level the built-in preset title is promoted to. `null` (default)
   * renders the title as a non-semantic emphasized element; a level of `2`–`6`
   * exposes it as a heading with the matching `aria-level` for the page outline.
   * Ignored when a `hellEmptyStateTitle` is projected — a real heading element
   * owns its own semantics, so the wrapper never doubles up `role="heading"`.
   */
  readonly headingLevel = input<HellEmptyStateHeadingLevel | null>(null);

  private readonly labels = inject(HELL_EMPTY_STATE_LABELS);

  private readonly customMedia = contentChild(HellEmptyStateMedia);
  private readonly customTitle = contentChild(HellEmptyStateTitle);
  private readonly customDescription = contentChild(HellEmptyStateDescription);
  private readonly customActions = contentChild(HellEmptyStateActions);

  /** Whether custom media is projected, in which case it replaces the preset glyph. */
  protected readonly hasCustomMedia = computed(() => this.customMedia() != null);
  /** Whether a custom title is projected, in which case it replaces the preset title. */
  protected readonly hasCustomTitle = computed(() => this.customTitle() != null);
  /** Whether a custom description is projected, in which case it replaces the preset description. */
  protected readonly hasCustomDescription = computed(() => this.customDescription() != null);
  /** Whether any actions are projected, gating the `actions` part. */
  protected readonly hasActions = computed(() => this.customActions() != null);

  /** Default title string for the active preset, or `null` when no preset is set. */
  protected readonly resolvedTitle = computed(() => {
    const preset = this.preset();
    return preset ? this.labels[`${preset}Title`] : null;
  });

  /** Default description string for the active preset, or `null` when no preset is set. */
  protected readonly resolvedDescription = computed(() => {
    const preset = this.preset();
    return preset ? this.labels[`${preset}Description`] : null;
  });
}

/** All directives that make up the empty-state entry point, for bulk `imports`. */
export const HELL_EMPTY_STATE_DIRECTIVES = [
  HellEmptyState,
  HellEmptyStateMedia,
  HellEmptyStateTitle,
  HellEmptyStateDescription,
  HellEmptyStateActions,
] as const;
