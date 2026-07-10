import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  hellCreateLabels,
  hellPartStyler,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import type { InjectionToken, OutputEmitterRef, Provider } from '@angular/core';

/**
 * Visibility mode of the save bar. `contextual` (default) renders the bar only
 * while `dirty` is true; `persistent` keeps it always visible for
 * always-editable surfaces such as settings pages.
 */
export type HellSaveBarMode = 'contextual' | 'persistent';

/** Built-in strings owned by the save-bar entry point's Label Contract. */
export interface HellSaveBarLabels {
  /** Unsaved-changes message shown while dirty and announced on contextual appearance. */
  readonly message: string;
  /** Label of the built-in save action. */
  readonly save: string;
  /** Label of the built-in discard action. */
  readonly discard: string;
}

const HELL_SAVE_BAR_LABELS_CONTRACT = hellCreateLabels<HellSaveBarLabels>('HELL_SAVE_BAR_LABELS', {
  message: 'You have unsaved changes',
  save: 'Save',
  discard: 'Discard',
});

/** Injection token resolving to the effective save-bar labels. */
export const HELL_SAVE_BAR_LABELS: InjectionToken<HellSaveBarLabels> =
  HELL_SAVE_BAR_LABELS_CONTRACT.token;

/** Override any subset of the save-bar labels for an injector scope. */
export function provideHellSaveBarLabels(overrides: Partial<HellSaveBarLabels>): Provider {
  return HELL_SAVE_BAR_LABELS_CONTRACT.provide(overrides);
}

/** Public parts of the HellSaveBar module, styleable through its Part Style Map. */
export type HellSaveBarPart = 'root' | 'message' | 'actions' | 'save' | 'discard';
/** Part Style Map accepted by the HellSaveBar `ui` input. */
export type HellSaveBarUi = HellUi<HellSaveBarPart>;

const HELL_SAVE_BAR_RECIPE = {
  root: 'sticky bottom-0 z-10 flex w-full flex-wrap items-center justify-between gap-hell-3 border-0 border-t border-solid border-hell-border bg-hell-surface-elevated px-hell-5 py-hell-3',
  message: 'm-0 flex min-w-0 items-center text-[13px] leading-normal text-hell-foreground-muted',
  actions: 'flex flex-wrap items-center gap-hell-3',
  // The built-in buttons render on the button primitive; these entries hold
  // only save-bar refinements, merged into each button's own root recipe.
  save: '',
  discard: '',
} satisfies HellRecipe<HellSaveBarPart>;

/**
 * `hell-save-bar` — a save/discard action bar for edit surfaces.
 *
 * The bar owns no form knowledge: the consumer drives it through `dirty`,
 * `busy`, and `disabled` inputs and handles the `saved`/`discarded` outputs
 * (one-line binding to a reactive form: dirty/invalid/pending). In the default
 * `contextual` mode it stays out of the way until `dirty` is true, then
 * appears in normal flow — sticky to the bottom of the nearest scroll
 * container — without stealing focus, announcing its message politely through
 * the CDK LiveAnnouncer. `persistent` mode keeps the bar always visible; the
 * unsaved-changes message still tracks `dirty`, so the bar doubles as the
 * dirty indicator.
 *
 * `busy` gates both actions while a save is in flight; `disabled` gates Save
 * only (typically bound to form invalidity), leaving Discard operable. Extra
 * consumer actions project into the actions part before the built-in buttons.
 * The Save button is a plain submit-triggering button: inside a `<form>` it
 * also fires native submit, so handle either `(saved)` or `(ngSubmit)`, not
 * both. Message and button labels come from the Label Contract
 * (`provideHellSaveBarLabels`).
 *
 * Usage:
 *   <hell-save-bar
 *     [dirty]="form.dirty"
 *     [disabled]="form.invalid || form.pending"
 *     [busy]="saving()"
 *     (saved)="save()"
 *     (discarded)="form.reset()"
 *   />
 */
@Component({
  selector: 'hell-save-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-mode]': 'mode()',
    '[attr.data-dirty]': "dirty() ? '' : null",
    '[attr.data-busy]': "busy() ? '' : null",
    '[style.display]': "visible() ? null : 'none'",
  },
  template: `
    <p data-slot="message" [class]="part('message')">
      @if (dirty()) {
        {{ labels.message }}
      }
    </p>
    <div data-slot="actions" [class]="part('actions')">
      <ng-content />
      <button
        hellButton
        variant="ghost"
        size="sm"
        type="button"
        data-slot="discard"
        [ui]="part('discard')"
        [disabled]="busy()"
        (click)="onDiscard()"
      >
        {{ labels.discard }}
      </button>
      <button
        hellButton
        variant="primary"
        size="sm"
        type="submit"
        data-slot="save"
        [ui]="part('save')"
        [disabled]="busy() || disabled()"
        (click)="onSave()"
      >
        @if (busy()) {
          <svg
            class="animate-spin motion-reduce:animate-none"
            viewBox="0 0 16 16"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M14.5 8A6.5 6.5 0 1 1 8 1.5" />
          </svg>
        }
        {{ labels.save }}
      </button>
    </div>
  `,
})
export class HellSaveBar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSaveBarPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSaveBarPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SAVE_BAR_RECIPE,
  });

  /**
   * Visibility mode. `contextual` (default) renders the bar only while
   * `dirty`; `persistent` keeps it always visible.
   */
  readonly mode = input<HellSaveBarMode>('contextual');

  /**
   * Whether the consumer's edit surface has unsaved changes. Shows the bar in
   * `contextual` mode and the unsaved-changes message in both modes.
   */
  readonly dirty = input(false, { transform: booleanAttribute });

  /**
   * Whether a save is in flight. Gates both actions and renders a progress
   * glyph in the Save button. The consumer drives it; the bar never assumes a
   * save succeeded.
   */
  readonly busy = input(false, { transform: booleanAttribute });

  /**
   * Whether saving is currently not allowed (typically form invalidity).
   * Gates the Save action only; Discard stays operable.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emitted when the Save action is activated. The consumer performs the mutation. */
  readonly saved: OutputEmitterRef<void> = output<void>();

  /** Emitted when the Discard action is activated. The consumer resets its state. */
  readonly discarded: OutputEmitterRef<void> = output<void>();

  /** Effective labels for the message and built-in actions. */
  protected readonly labels = inject(HELL_SAVE_BAR_LABELS);

  private readonly announcer = inject(LiveAnnouncer);

  /** Whether the bar currently renders: always in `persistent` mode, while dirty in `contextual`. */
  protected readonly visible = computed(() => this.mode() === 'persistent' || this.dirty());

  private wasContextuallyVisible = false;

  constructor() {
    // Announce contextual appearance through the CDK LiveAnnouncer instead of
    // marking the bar itself as a live region: the message reads once, politely,
    // and never interrupts the consumer's focus or typing.
    effect(() => {
      const contextuallyVisible = this.mode() === 'contextual' && this.dirty();
      if (contextuallyVisible && !this.wasContextuallyVisible) {
        void this.announcer.announce(this.labels.message, 'polite');
      }
      this.wasContextuallyVisible = contextuallyVisible;
    });
  }

  /** Emit `saved` unless gated. Invoked by the built-in Save button. */
  protected onSave(): void {
    if (this.busy() || this.disabled()) return;
    this.saved.emit();
  }

  /** Emit `discarded` unless gated. Invoked by the built-in Discard button. */
  protected onDiscard(): void {
    if (this.busy()) return;
    this.discarded.emit();
  }
}
