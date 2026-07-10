import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import { NgpDialogManager, injectDialogRef } from 'ng-primitives/dialog';
import type { NgpDialogRef } from 'ng-primitives/dialog';
import { hellCreateLabels } from '@hell-ui/angular/core';
import type { HellButtonVariant } from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import {
  HellDialog,
  HellDialogDescription,
  HellDialogOverlay,
  HellDialogTitle,
} from '@hell-ui/angular/dialog';
import type { InjectionToken, Provider, TemplateRef, WritableSignal } from '@angular/core';

/** Severity of a confirmation; `danger` styles the confirm button destructively and focuses cancel. */
export type HellConfirmSeverity = 'default' | 'danger';

/**
 * Template context handed to a confirm dialog's projected `content` template.
 *
 * The `state` signal is seeded with `HellConfirmOptions.contentState` and rides
 * back to the caller in `HellConfirmResult.content` — read it with `state()` and
 * update it with `state.set(...)` from inside your template.
 */
export interface HellConfirmContentContext<TContentState> {
  /** The content state signal (same value as `state`). */
  readonly $implicit: WritableSignal<TContentState>;
  /** The content state signal; call it to read, `.set(...)` to update. */
  readonly state: WritableSignal<TContentState>;
}

/** Options passed to `HellConfirmService.confirm`. */
export interface HellConfirmOptions<TContentState = void> {
  /** Accessible dialog title and heading. */
  readonly title: string;
  /** Optional supporting description linked as the dialog's accessible description. */
  readonly description?: string;
  /** `default` (confirm focused) or `danger` (destructive confirm, cancel focused). Defaults to `default`. */
  readonly severity?: HellConfirmSeverity;
  /** Overrides the confirm button label. Falls back to the Label Contract's `confirm`. */
  readonly confirmLabel?: string;
  /** Overrides the cancel button label. Falls back to the Label Contract's `cancel`. */
  readonly cancelLabel?: string;
  /** Seconds the confirm button stays disabled with a visible countdown. Gating only — it never auto-confirms. */
  readonly countdownSeconds?: number;
  /** Optional template projected into the dialog body; its `state` rides back in the result. */
  readonly content?: TemplateRef<HellConfirmContentContext<TContentState>>;
  /** Initial value of the projected content template's `state` signal. */
  readonly contentState?: TContentState;
}

/**
 * Result of a confirmation. The promise always resolves: Escape, backdrop
 * dismissal, and cancel all resolve `confirmed: false`.
 */
export interface HellConfirmResult<TContentState = void> {
  /** Whether the user confirmed. */
  readonly confirmed: boolean;
  /** Final projected-content state, when a `content` template was supplied. */
  readonly content?: TContentState;
}

/** Built-in strings owned by the confirm entry point's Label Contract. */
export interface HellConfirmLabels {
  /** Default confirm button label. */
  readonly confirm: string;
  /** Default cancel button label. */
  readonly cancel: string;
  /** Formats the remaining-seconds suffix appended to the confirm label while the countdown gates it. */
  readonly countdown: (remainingSeconds: number) => string;
}

const HELL_CONFIRM_LABELS_CONTRACT = hellCreateLabels<HellConfirmLabels>('HELL_CONFIRM_LABELS', {
  confirm: 'Confirm',
  cancel: 'Cancel',
  countdown: (remainingSeconds: number) => ` (${remainingSeconds})`,
});

/** Injection token resolving to the effective confirm labels. */
export const HELL_CONFIRM_LABELS: InjectionToken<HellConfirmLabels> =
  HELL_CONFIRM_LABELS_CONTRACT.token;

/** Override any subset of the confirm labels for an injector scope. */
export function provideHellConfirmLabels(overrides: Partial<HellConfirmLabels>): Provider {
  return HELL_CONFIRM_LABELS_CONTRACT.provide(overrides);
}

/** Data handed to the internal confirm dialog through the dialog manager. */
interface HellConfirmDialogData {
  readonly options: HellConfirmOptions<unknown>;
}

/**
 * Internal modal rendered by `HellConfirmService` on the dialog primitive. Not
 * part of the public surface — callers drive it entirely through the service.
 */
@Component({
  selector: 'hell-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, HellButton, HellDialogOverlay, HellDialog, HellDialogTitle, HellDialogDescription],
  template: `
    <div hellDialogOverlay>
      <div hellDialog size="sm" [attr.data-severity]="severity">
        <div class="flex flex-col gap-hell-4 p-hell-5">
          <div class="flex flex-col gap-hell-1">
            <h2 hellDialogTitle>{{ title }}</h2>
            @if (description) {
              <p hellDialogDescription>{{ description }}</p>
            }
          </div>

          @if (content) {
            <div class="text-[13px] text-hell-foreground">
              <ng-container
                [ngTemplateOutlet]="content"
                [ngTemplateOutletContext]="{ $implicit: state, state }"
              />
            </div>
          }

          <div class="mt-hell-1 flex justify-end gap-hell-3">
            <button
              #cancelButtonEl
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="cancel()"
            >
              {{ cancelLabel }}
            </button>
            <button
              #confirmButtonEl
              hellButton
              [variant]="confirmVariant"
              size="sm"
              type="button"
              [disabled]="confirmDisabled()"
              (click)="onConfirm()"
            >
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
class HellConfirmDialog {
  private readonly ref = injectDialogRef<HellConfirmDialogData, HellConfirmResult<unknown>>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Effective confirm labels for this injector scope. */
  protected readonly labels = inject(HELL_CONFIRM_LABELS);

  private readonly options = this.ref.data.options;
  /** Dialog title text. */
  protected readonly title = this.options.title;
  /** Optional description text, or `null` when omitted. */
  protected readonly description = this.options.description ?? null;
  /** Resolved severity for this confirmation. */
  protected readonly severity: HellConfirmSeverity = this.options.severity ?? 'default';
  /** Resolved cancel button label. */
  protected readonly cancelLabel = this.options.cancelLabel ?? this.labels.cancel;
  /** Projected content template, or `null` when none was supplied. */
  protected readonly content = this.options.content ?? null;
  /** Button variant used for the confirm action. */
  protected readonly confirmVariant: HellButtonVariant =
    this.severity === 'danger' ? 'danger' : 'primary';
  /** Projected content state signal, seeded from `contentState`. */
  protected readonly state: WritableSignal<unknown> = signal(this.options.contentState);

  private readonly baseConfirmLabel = this.options.confirmLabel ?? this.labels.confirm;
  private readonly totalCountdown = Math.max(0, Math.floor(this.options.countdownSeconds ?? 0));
  /** Remaining countdown seconds; `0` once the confirm button is enabled. */
  protected readonly remaining = signal(this.totalCountdown);
  /** Whether the confirm button is currently gated by the countdown. */
  protected readonly confirmDisabled = computed(() => this.remaining() > 0);
  /** Confirm button label, with the countdown suffix appended while gated. */
  protected readonly confirmText = computed(() =>
    this.remaining() > 0
      ? `${this.baseConfirmLabel}${this.labels.countdown(this.remaining())}`
      : this.baseConfirmLabel,
  );

  private readonly confirmButtonRef = viewChild<ElementRef<HTMLButtonElement>>('confirmButtonEl');
  private readonly cancelButtonRef = viewChild<ElementRef<HTMLButtonElement>>('cancelButtonEl');

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (this.totalCountdown > 0) {
      this.countdownTimer = setInterval(() => this.tickCountdown(), 1000);
      inject(DestroyRef).onDestroy(() => this.stopCountdown());
    }
    afterNextRender(() => this.focusInitialControl());
  }

  /** Resolve the confirmation as confirmed, carrying the current content state. */
  protected onConfirm(): void {
    if (this.confirmDisabled()) return;
    void this.ref.close({ confirmed: true, content: this.state() });
  }

  /** Resolve the confirmation as cancelled, carrying the current content state. */
  protected cancel(): void {
    void this.ref.close({ confirmed: false, content: this.state() });
  }

  private tickCountdown(): void {
    this.remaining.update((value) => (value > 0 ? value - 1 : 0));
    if (this.remaining() <= 0) this.stopCountdown();
  }

  private stopCountdown(): void {
    if (this.countdownTimer === null) return;
    clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }

  private focusInitialControl(): void {
    const target =
      this.severity === 'danger' || this.confirmDisabled()
        ? this.cancelButtonRef()
        : this.confirmButtonRef();
    const element = target?.nativeElement;
    if (!element) return;
    // Run after the focus trap's mount autofocus so the confirm/cancel policy wins.
    const view = this.host.ownerDocument.defaultView;
    if (view) view.requestAnimationFrame(() => element.focus({ preventScroll: true }));
    else element.focus({ preventScroll: true });
  }
}

/**
 * Opens accessible confirmation dialogs on the dialog primitive and resolves a
 * promise with the outcome.
 *
 * `confirm` always resolves — Escape, backdrop dismissal, and cancel all resolve
 * `confirmed: false`, so destructive flows can `await` linearly. Calls queue:
 * the service never shows two confirm dialogs at once.
 */
@Injectable({ providedIn: 'root' })
export class HellConfirmService {
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly document = inject(DOCUMENT);

  private readonly queue: HellConfirmQueueEntry[] = [];
  private openRef: NgpDialogRef<HellConfirmDialogData, HellConfirmResult<unknown>> | null = null;

  /**
   * Open a confirmation and resolve with `{ confirmed }` (plus the projected
   * content state when a `content` template is used). Never rejects.
   */
  confirm<TContentState = void>(
    options: HellConfirmOptions<TContentState>,
  ): Promise<HellConfirmResult<TContentState>> {
    return new Promise<HellConfirmResult<TContentState>>((resolve) => {
      this.queue.push({
        options,
        resolve: resolve as (result: HellConfirmResult<unknown>) => void,
        opener: this.activeElement(),
      });
      this.pump();
    });
  }

  private pump(): void {
    if (this.openRef || this.queue.length === 0) return;

    const entry = this.queue[0];
    const data: HellConfirmDialogData = { options: entry.options };
    const ref = this.dialogManager.open<HellConfirmDialogData, HellConfirmResult<unknown>>(
      HellConfirmDialog,
      { data },
    );
    this.openRef = ref;

    ref.afterClosed.subscribe((result) => {
      this.openRef = null;
      this.queue.shift();
      entry.resolve(result ?? { confirmed: false });
      this.restoreFocus(entry.opener);
      this.pump();
    });
  }

  private activeElement(): HTMLElement | null {
    const active = this.document.activeElement;
    return active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(opener: HTMLElement | null): void {
    if (!opener) return;
    this.document.defaultView?.requestAnimationFrame(() => {
      if (opener.isConnected) opener.focus({ preventScroll: true });
    });
  }
}

interface HellConfirmQueueEntry {
  readonly options: HellConfirmOptions<unknown>;
  readonly resolve: (result: HellConfirmResult<unknown>) => void;
  readonly opener: HTMLElement | null;
}
