import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { hellCreateLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import type { InjectionToken, OutputEmitterRef } from '@angular/core';

/** Built-in accessibility labels owned by the alert entry point. */
export interface HellAlertLabels {
  /** Accessible label for the alert's dismiss button. */
  readonly dismiss: string;
}

/** Injection token resolving to the effective alert labels. */
export const HELL_ALERT_LABELS: InjectionToken<HellAlertLabels> = hellCreateLabels<HellAlertLabels>('HELL_ALERT_LABELS', {
  dismiss: 'Dismiss',
});

/** Severity of an alert; drives its Semantic Theme Token color scheme and default glyph. */
export type HellAlertVariant = 'info' | 'success' | 'warning' | 'danger';

/** Public parts of the HellAlert module, styleable through its Part Style Map. */
export type HellAlertPart = 'root' | 'icon' | 'content';
/** Part Style Map accepted by the HellAlert `ui` input. */
export type HellAlertUi = HellUi<HellAlertPart>;

const HELL_ALERT_RECIPE = {
  root:
    'flex items-start gap-hell-3 rounded-hell-md border border-solid border-[var(--_hell-alert-border)] bg-[var(--_hell-alert-surface)] p-hell-4 text-sm leading-normal text-hell-foreground ' +
    '[--_hell-alert-surface:var(--color-hell-info-soft)] [--_hell-alert-border:var(--color-hell-info)] [--_hell-alert-accent:var(--color-hell-info-strong)] ' +
    'data-[variant=success]:[--_hell-alert-surface:var(--color-hell-success-soft)] data-[variant=success]:[--_hell-alert-border:var(--color-hell-success)] data-[variant=success]:[--_hell-alert-accent:var(--color-hell-success-strong)] ' +
    'data-[variant=warning]:[--_hell-alert-surface:var(--color-hell-warning-soft)] data-[variant=warning]:[--_hell-alert-border:var(--color-hell-warning)] data-[variant=warning]:[--_hell-alert-accent:var(--color-hell-warning-strong)] ' +
    'data-[variant=danger]:[--_hell-alert-surface:var(--color-hell-danger-soft)] data-[variant=danger]:[--_hell-alert-border:var(--color-hell-danger)] data-[variant=danger]:[--_hell-alert-accent:var(--color-hell-danger-strong)]',
  icon: 'mt-px flex h-5 w-5 flex-none items-center justify-center text-[var(--_hell-alert-accent)] [&>svg]:h-full [&>svg]:w-full',
  content: 'flex min-w-0 flex-1 flex-col gap-hell-1',
} satisfies HellRecipe<HellAlertPart>;

const HELL_ALERT_TITLE_RECIPE = {
  root: 'm-0 text-sm font-semibold text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_ALERT_DESCRIPTION_RECIPE = {
  root: 'm-0 text-sm text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

const HELL_ALERT_ACTIONS_RECIPE = {
  root: 'mt-hell-2 flex flex-wrap items-center gap-hell-2',
} satisfies HellRecipe<'root'>;

const HELL_ALERT_DISMISS_RECIPE = {
  root: '-me-hell-1 -mt-hell-1 ms-auto inline-flex h-hell-6 w-hell-6 flex-none cursor-pointer items-center justify-center rounded-hell-sm border-0 bg-transparent p-0 text-hell-foreground-subtle transition-[color,background-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1',
} satisfies HellRecipe<'root'>;

/**
 * Marker for a custom alert glyph. Place it on any element projected into a
 * `hell-alert` to replace the default per-variant glyph in the icon Public Part.
 */
@Directive({ selector: '[hellAlertIcon]' })
export class HellAlertIcon {}

/**
 * Persistent inline message with severity variants, an optional default glyph,
 * projected title/description/actions, and an optional dismiss button. For a
 * full-bleed app-level banner, refine the root through the Part Style Map:
 * `ui="w-full rounded-none border-x-0"`.
 *
 * The alert carries no live-region semantics by default so pages with several
 * alerts do not produce announcement storms; statically rendered alerts read
 * as ordinary page content. For alerts inserted in response to async events,
 * pass `role="status"` / `role="alert"` through to the host or pair the
 * insertion with the toast announcer.
 *
 *   <hell-alert variant="warning" (dismissed)="hidden = true">
 *     <h3 hellAlertTitle>Storage almost full</h3>
 *     <p hellAlertDescription>Free up space to keep syncing.</p>
 *     <button hellAlertDismiss></button>
 *   </hell-alert>
 */
@Component({
  selector: 'hell-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    @if (showIcon()) {
      <span data-slot="icon" [class]="part('icon')" aria-hidden="true">
        <ng-content select="[hellAlertIcon]" />
        @if (!hasCustomIcon()) {
          @switch (variant()) {
            @case ('success') {
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M5 8.5l2 2 4-4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            }
            @case ('warning') {
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 1.5L15 14H1L8 1.5z" stroke-linejoin="round" />
                <path d="M8 6v3.5M8 11.8v.4" stroke-linecap="round" />
              </svg>
            }
            @case ('danger') {
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 4.5v4M8 11.1v.4" stroke-linecap="round" />
              </svg>
            }
            @default {
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 7v4M8 4.6v.4" stroke-linecap="round" />
              </svg>
            }
          }
        }
      </span>
    }
    <div data-slot="content" [class]="part('content')">
      <ng-content />
    </div>
    <ng-content select="[hellAlertDismiss]" />
  `,
})
export class HellAlert {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellAlertPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellAlertPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ALERT_RECIPE,
  });

  /** Severity of the alert; drives colors and the default glyph. Defaults to `info`. */
  readonly variant = input<HellAlertVariant>('info');
  /**
   * Whether to render the icon slot. Defaults to `true`. Set to `false` to
   * remove the default glyph (and any projected `hellAlertIcon` content).
   */
  readonly showIcon = input(true, { transform: booleanAttribute });

  private readonly projectedIcon = contentChild(HellAlertIcon);
  /** Whether the consumer projected a `hellAlertIcon`, replacing the default glyph. */
  protected readonly hasCustomIcon = computed(() => this.projectedIcon() != null);

  /**
   * Emitted when a projected `hellAlertDismiss` button is activated. The alert
   * never removes itself from the DOM; the consumer owns visibility state.
   */
  readonly dismissed: OutputEmitterRef<void> = output<void>();

  /** Emit the `dismissed` event. Invoked by a projected `hellAlertDismiss` button. */
  dismiss(): void {
    this.dismissed.emit();
  }
}

/** Prominent heading line inside an alert. */
@Directive({
  selector: '[hellAlertTitle]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAlertTitle {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ALERT_TITLE_RECIPE,
  });
}

/** Supporting body copy inside an alert. */
@Directive({
  selector: '[hellAlertDescription]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAlertDescription {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ALERT_DESCRIPTION_RECIPE,
  });
}

/** Region for action controls inside an alert, such as a "Retry" button. */
@Directive({
  selector: '[hellAlertActions]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAlertActions {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ALERT_ACTIONS_RECIPE,
  });
}

/**
 * Opt-in dismiss button for an alert. Renders as a native `<button>`, carries
 * an accessible name from the alert Label Contract, and emits the owning
 * alert's `dismissed` event on activation without removing the alert.
 */
@Directive({
  selector: 'button[hellAlertDismiss]',
  host: {
    type: 'button',
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-label]': 'ariaLabel() ?? labels.dismiss',
    '(click)': 'alert.dismiss()',
  },
})
export class HellAlertDismiss {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ALERT_DISMISS_RECIPE,
  });

  /** The alert this button dismisses. */
  protected readonly alert = inject(HellAlert);
  /** Effective accessibility labels for the alert's controls. */
  protected readonly labels = inject(HELL_ALERT_LABELS);

  /**
   * Accessible name for the button. Defaults to the alert Label Contract's
   * `dismiss` string; set it to override the built-in name per instance.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
}

/** All directives and components of the alert entry point, for bulk `imports`. */
export const HELL_ALERT_IMPORTS = [
  HellAlert,
  HellAlertTitle,
  HellAlertDescription,
  HellAlertActions,
  HellAlertDismiss,
  HellAlertIcon,
] as const;

/**
 * Legacy import tuple name.
 * @alias
 * @deprecated Use HELL_ALERT_IMPORTS.
 */
export const HELL_ALERT_DIRECTIVES = HELL_ALERT_IMPORTS;
