import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import { NgpDialogManager, injectDialogRef } from 'ng-primitives/dialog';
import type { NgpDialogRef } from 'ng-primitives/dialog';
import { NgpPopoverTrigger } from 'ng-primitives/popover';
import { hellCreateLabels } from '@hell-ui/angular/core';
import type { HellButtonVariant } from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import {
  HellDialog,
  HellDialogDescription,
  HellDialogOverlay,
  HellDialogTitle,
} from '@hell-ui/angular/dialog';
import { HellPopover } from '@hell-ui/angular/popover';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';
import type { OutputEmitterRef, Provider, TemplateRef, WritableSignal } from '@angular/core';

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
  /** Default confirm button label, shared by the service dialog and the popconfirm. */
  readonly confirm: string;
  /** Default cancel button label, shared by the service dialog and the popconfirm. */
  readonly cancel: string;
  /** Formats the remaining-seconds suffix appended to the confirm label while the countdown gates it. */
  readonly countdown: (remainingSeconds: number) => string;
  /** Default popconfirm message shown when a panel supplies no `message`. */
  readonly popconfirmMessage: string;
}

const HELL_CONFIRM_LABELS_CONTRACT = hellCreateLabels<HellConfirmLabels>('HELL_CONFIRM_LABELS', {
  confirm: 'Confirm',
  cancel: 'Cancel',
  countdown: (remainingSeconds: number) => ` (${remainingSeconds})`,
  popconfirmMessage: 'Are you sure?',
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

/** Bridge a popconfirm panel invokes to resolve its owning trigger. */
interface HellPopconfirmController {
  /** Emit `confirmed` on the trigger and close the popconfirm. */
  confirm(): void;
  /** Close the popconfirm; the trigger emits `dismissed` as it closes. */
  dismiss(): void;
}

/**
 * Injection token a `HellPopconfirmPanel` resolves to reach its owning trigger
 * through the popover overlay's parent injector. Internal to the entry point.
 */
const HELL_POPCONFIRM = new InjectionToken<HellPopconfirmController>('HELL_POPCONFIRM');

/**
 * Root registry that enforces one open popconfirm at a time: opening one closes
 * any other. Internal — the trigger drives it from its open-state changes.
 */
@Injectable({ providedIn: 'root' })
class HellPopconfirmManager {
  private current: HellPopconfirm | null = null;

  /** Record `trigger` as the open popconfirm, closing any previously open one. */
  open(trigger: HellPopconfirm): void {
    if (this.current && this.current !== trigger) this.current.dismiss();
    this.current = trigger;
  }

  /** Clear `trigger` if it is the currently tracked open popconfirm. */
  release(trigger: HellPopconfirm): void {
    if (this.current === trigger) this.current = null;
  }
}

/**
 * Declarative confirmation popover anchored to its trigger. Attach it to any
 * destructive control and pair it with a `HellPopconfirmPanel` in a template:
 *
 * ```html
 * <button hellButton variant="danger" [hellPopconfirm]="confirmDelete" (confirmed)="deleteRow(row)">
 *   Delete
 * </button>
 * <ng-template #confirmDelete>
 *   <hell-popconfirm-panel message="Delete this row?" severity="danger" confirmLabel="Delete" />
 * </ng-template>
 * ```
 *
 * Built on the popover primitive, so focus moves into the panel on open and
 * returns to the trigger on dismiss, and Escape or an outside click dismiss it
 * through the shared Floating Dismissal rules. Opening one popconfirm closes any
 * other. There is no promise API on the declarative form: it emits `confirmed`
 * or `dismissed` and leaves the action itself to app code.
 */
@Directive({
  selector: 'button[hellPopconfirm], a[hellPopconfirm]',
  exportAs: 'hellPopconfirm',
  hostDirectives: [
    {
      directive: NgpPopoverTrigger,
      inputs: [
        'ngpPopoverTrigger:hellPopconfirm',
        'ngpPopoverTriggerPlacement:placement',
        'ngpPopoverTriggerOffset:offset',
        'ngpPopoverTriggerFlip:flip',
        'ngpPopoverTriggerShift:shift',
        'ngpPopoverTriggerContainer:container',
        'ngpPopoverTriggerDisabled:disabled',
      ],
    },
  ],
  providers: [{ provide: HELL_POPCONFIRM, useExisting: forwardRef(() => HellPopconfirm) }],
  host: {
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(trigger.disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(trigger.disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(trigger.disabled())',
    '(click)': 'preventActionAnchorNavigation($event, trigger.disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, trigger.disabled())',
  },
})
export class HellPopconfirm
  extends HellNativeInteractiveDisabledGuard
  implements HellPopconfirmController
{
  /** Underlying ng-primitives popover trigger state. */
  protected readonly trigger = inject(NgpPopoverTrigger);
  private readonly manager = inject(HellPopconfirmManager);

  /** Emits when the user confirms; wire the destructive action here. */
  readonly confirmed: OutputEmitterRef<void> = output<void>();
  /** Emits when the popconfirm closes without confirming (cancel, Escape, outside click, or another opening). */
  readonly dismissed: OutputEmitterRef<void> = output<void>();

  private confirmedThisCycle = false;

  constructor() {
    super();
    const subscription = this.trigger.openChange.subscribe((open: boolean) =>
      this.onOpenChange(open),
    );
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  /** Emit `confirmed` and close the popconfirm. */
  confirm(): void {
    this.confirmedThisCycle = true;
    this.confirmed.emit();
    void this.trigger.hide('program');
  }

  /** Close the popconfirm; `dismissed` fires as it closes. */
  dismiss(): void {
    void this.trigger.hide('program');
  }

  private onOpenChange(open: boolean): void {
    if (open) {
      this.confirmedThisCycle = false;
      this.manager.open(this);
      return;
    }
    this.manager.release(this);
    if (!this.confirmedThisCycle) this.dismissed.emit();
    this.confirmedThisCycle = false;
  }
}

/**
 * Panel for a `HellPopconfirm` trigger: a small confirmation popover with a
 * message and confirm/cancel buttons. Place it inside the trigger's template.
 *
 * It renders on the popover primitive (focus trap, `role="dialog"`, shared
 * Floating Dismissal) and wires its buttons back to the owning trigger, which
 * owns the `confirmed` / `dismissed` outputs. Danger severity mirrors the
 * confirm service: the confirm button takes the destructive variant and initial
 * focus starts on cancel.
 */
@Component({
  selector: 'hell-popconfirm-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [HellPopover],
  imports: [HellButton],
  host: {
    '[attr.aria-labelledby]': 'messageId',
    '[attr.data-severity]': 'severity()',
  },
  template: `
    <div class="flex flex-col gap-hell-3">
      <p [id]="messageId" class="text-[13px] text-hell-foreground">{{ resolvedMessage() }}</p>
      <div class="flex justify-end gap-hell-2">
        <button
          #cancelButtonEl
          hellButton
          variant="ghost"
          size="sm"
          type="button"
          (click)="onDismiss()"
        >
          {{ cancelText() }}
        </button>
        <button
          #confirmButtonEl
          hellButton
          [variant]="confirmVariant()"
          size="sm"
          type="button"
          (click)="onConfirm()"
        >
          {{ confirmText() }}
        </button>
      </div>
    </div>
  `,
})
export class HellPopconfirmPanel {
  /** Confirmation message. Falls back to the Label Contract's `popconfirmMessage`. */
  readonly message = input<string>();
  /** `default` (confirm focused) or `danger` (destructive confirm, cancel focused). Defaults to `default`. */
  readonly severity = input<HellConfirmSeverity>('default');
  /** Overrides the confirm button label. Falls back to the Label Contract's `confirm`. */
  readonly confirmLabel = input<string>();
  /** Overrides the cancel button label. Falls back to the Label Contract's `cancel`. */
  readonly cancelLabel = input<string>();

  private readonly labels = inject(HELL_CONFIRM_LABELS);
  private readonly controller = inject(HELL_POPCONFIRM);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Stable id linking the message paragraph as the dialog's accessible name. */
  protected readonly messageId = `hell-popconfirm-${nextPopconfirmId()}`;
  /** Resolved confirmation message. */
  protected readonly resolvedMessage = computed(() => this.message() ?? this.labels.popconfirmMessage);
  /** Resolved confirm button label. */
  protected readonly confirmText = computed(() => this.confirmLabel() ?? this.labels.confirm);
  /** Resolved cancel button label. */
  protected readonly cancelText = computed(() => this.cancelLabel() ?? this.labels.cancel);
  /** Button variant used for the confirm action. */
  protected readonly confirmVariant = computed<HellButtonVariant>(() =>
    this.severity() === 'danger' ? 'danger' : 'primary',
  );

  private readonly confirmButtonRef = viewChild<ElementRef<HTMLButtonElement>>('confirmButtonEl');
  private readonly cancelButtonRef = viewChild<ElementRef<HTMLButtonElement>>('cancelButtonEl');

  constructor() {
    afterNextRender(() => this.focusInitialControl());
  }

  /** Confirm the action through the owning trigger. */
  protected onConfirm(): void {
    this.controller.confirm();
  }

  /** Dismiss the popconfirm through the owning trigger. */
  protected onDismiss(): void {
    this.controller.dismiss();
  }

  private focusInitialControl(): void {
    const target = this.severity() === 'danger' ? this.cancelButtonRef() : this.confirmButtonRef();
    const element = target?.nativeElement;
    if (!element) return;
    // Run after the popover focus trap's mount autofocus so the danger/default policy wins.
    const view = this.host.ownerDocument.defaultView;
    if (view) view.requestAnimationFrame(() => element.focus({ preventScroll: true }));
    else element.focus({ preventScroll: true });
  }
}

let popconfirmIdCounter = 0;
function nextPopconfirmId(): number {
  return ++popconfirmIdCounter;
}
