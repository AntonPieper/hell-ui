import type { Placement } from '@floating-ui/dom';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  ViewContainerRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { hellCreateLabels } from '@hell-ui/angular/core';
import type { HellButtonVariant } from '@hell-ui/angular/core';
import {
  HellDialog,
  HellDialogDescription,
  HellDialogOverlay,
  HellDialogTitle,
} from '@hell-ui/angular/dialog';
import { HellPopover } from '@hell-ui/angular/popover';
import { NgpDialogManager, injectDialogRef } from 'ng-primitives/dialog';
import type { NgpDialogRef } from 'ng-primitives/dialog';
import { createOverlay } from 'ng-primitives/portal';

type HellPromptContent = string | Readonly<{ title: string; description?: string }>;

/**
 * One typed answer offered by {@link HellPrompt.choose}. The same shape backs
 * the boolean actions that {@link HellPrompt.confirm} creates internally.
 */
export interface HellPromptAction<TValue> {
  /** Value the prompt promise resolves with when this action is activated. */
  readonly value: TValue;
  /** Visible button label. */
  readonly label: string;
  /**
   * Button appearance. `choose()` defaults to `default`. `confirm()` defaults
   * its positive action to `primary`, its omitted cancel action to `ghost`,
   * and an explicitly supplied cancel action without a variant to `default`.
   * `danger` opts into safe-focus policy.
   */
  readonly variant?: HellButtonVariant;
  /** Seconds the action stays disabled. Reaching zero enables only; it never chooses. */
  readonly countdownSeconds?: number;
  /** Whether Escape, backdrop, or outside dismissal resolves this action's value. */
  readonly dismissEquivalent?: boolean;
}

/**
 * One injected prompt Interface for modal and anchored boolean or generic
 * choices. Supplying an `anchor` selects the anchored presentation;
 * otherwise calls use the shared modal queue.
 */
export interface HellPrompt {
  /**
   * Ask a yes/no question. The cancel action and every dismissal resolve
   * `false`; the confirm action resolves `true`. By default the positive
   * action uses `primary`, an omitted cancel action uses `ghost`, and an
   * explicitly supplied cancel action without a variant uses `default`.
   */
  confirm(
    prompt: string | Readonly<{ title: string; description?: string }>,
    options?: Readonly<{
      action?: Omit<HellPromptAction<boolean>, 'value' | 'dismissEquivalent'>;
      cancelAction?: Omit<HellPromptAction<boolean>, 'value' | 'dismissEquivalent'>;
      anchor?: HTMLElement;
      placement?: Placement;
    }>,
  ): Promise<boolean>;

  /**
   * Ask a typed N-way question. Dismissal resolves the single action marked
   * `dismissEquivalent`, or `null` when no action is marked.
   */
  choose<TValue>(
    prompt: string | Readonly<{ title: string; description?: string }>,
    actions: ReadonlyArray<HellPromptAction<TValue>>,
    options?: Readonly<{ anchor?: HTMLElement; placement?: Placement }>,
  ): Promise<TValue | null>;
}

/** Built-in strings owned by the confirm entry point's Label Contract. */
export interface HellConfirmLabels {
  /** Label of the default primary action used by `HellPrompt.confirm()`. */
  readonly confirm: string;
  /** Label of the default cancel action used by `HellPrompt.confirm()`. */
  readonly cancel: string;
  /** Formats the remaining-seconds suffix appended to a countdown-gated action label. */
  readonly countdown: (remainingSeconds: number) => string;
}

/** Injection token resolving to the effective confirm labels. */
export const HELL_CONFIRM_LABELS: InjectionToken<HellConfirmLabels> =
  hellCreateLabels<HellConfirmLabels>('HELL_CONFIRM_LABELS', {
    confirm: 'Confirm',
    cancel: 'Cancel',
    countdown: (remainingSeconds: number) => ` (${remainingSeconds})`,
  });

/** Normalized prompt: title plus optional description. */
interface HellPromptContentResolved {
  readonly title: string;
  readonly description: string | null;
}

function resolvePrompt(prompt: HellPromptContent): HellPromptContentResolved {
  if (typeof prompt === 'string') return { title: prompt, description: null };
  return { title: prompt.title, description: prompt.description ?? null };
}

/** One normalized button in the shared prompt Interaction State Machine. */
interface HellPromptButton {
  readonly label: string;
  readonly variant: HellButtonVariant;
  readonly countdownSeconds: number;
  readonly dismissEquivalent: boolean;
  readonly value: unknown;
}

/** Reactive per-button state: countdown-gated disabling and the suffixed label. */
interface HellPromptButtonRuntime {
  readonly text: Signal<string>;
  readonly disabled: Signal<boolean>;
}

/**
 * Creates the reactive state for one possibly countdown-gated button. Must run
 * in an injection context; the ticking interval is cleaned up on destroy.
 */
function hellPromptButtonRuntime(
  label: string,
  countdownSeconds: number,
  labels: HellConfirmLabels,
): HellPromptButtonRuntime {
  const remaining = signal(countdownSeconds);
  if (countdownSeconds > 0) {
    const timer = setInterval(() => {
      remaining.update((value) => (value > 0 ? value - 1 : 0));
      if (remaining() <= 0) clearInterval(timer);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
  return {
    disabled: computed(() => remaining() > 0),
    text: computed(() => (remaining() > 0 ? `${label}${labels.countdown(remaining())}` : label)),
  };
}

/** Data shared by the modal and anchored prompt presenters. */
interface HellPromptRenderData {
  readonly prompt: HellPromptContentResolved;
  readonly buttons: readonly HellPromptButton[];
  readonly initialFocusIndex: number;
}

/** Distinguishes an action whose value is `undefined` from primitive dismissal. */
interface HellPromptDialogResult {
  readonly value: unknown;
}

/** Internal modal presenter. Public callers interact only with `HellPrompt`. */
@Component({
  selector: 'hell-prompt-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellDialogOverlay, HellDialog, HellDialogTitle, HellDialogDescription],
  template: `
    <div hellDialogOverlay>
      <div hellDialog size="sm">
        <div class="flex flex-col gap-hell-4 p-hell-5">
          <div class="flex flex-col gap-hell-1">
            <h2 hellDialogTitle>{{ prompt.title }}</h2>
            @if (prompt.description !== null) {
              <p hellDialogDescription>{{ prompt.description }}</p>
            }
          </div>

          <div class="mt-hell-1 flex justify-end gap-hell-3">
            @for (button of buttons; track $index) {
              <button
                #actionButton
                hellButton
                [variant]="button.variant"
                size="sm"
                type="button"
                [disabled]="button.disabled()"
                (click)="choose(button)"
              >
                {{ button.text() }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
class HellPromptDialog {
  private readonly ref = injectDialogRef<HellPromptRenderData, HellPromptDialogResult>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly labels = inject(HELL_CONFIRM_LABELS);

  private readonly data = this.ref.data;
  protected readonly prompt = this.data.prompt;
  protected readonly buttons = this.data.buttons.map((button) => ({
    variant: button.variant,
    value: button.value,
    ...hellPromptButtonRuntime(button.label, button.countdownSeconds, this.labels),
  }));

  private readonly buttonRefs = viewChildren<ElementRef<HTMLButtonElement>>('actionButton');

  constructor() {
    afterNextRender(() => this.focusInitialControl());
  }

  protected choose(button: (typeof this.buttons)[number]): void {
    if (button.disabled()) return;
    void this.ref.close({ value: button.value });
  }

  private focusInitialControl(): void {
    const target = this.buttonRefs()[this.data.initialFocusIndex]?.nativeElement;
    if (!target) return;
    // Run after the focus trap's mount autofocus so the action focus policy wins.
    const view = this.host.ownerDocument.defaultView;
    if (view) view.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    else target.focus({ preventScroll: true });
  }
}

interface HellPromptModalQueueEntry {
  readonly data: HellPromptRenderData;
  readonly dismissValue: unknown;
  readonly injector: Injector;
  readonly viewContainerRef: ViewContainerRef;
  readonly callerDestroyRef: DestroyRef;
  readonly resolve: (value: unknown) => void;
  readonly opener: HTMLElement | null;
  settled: boolean;
  closeStarted: boolean;
  closeValue: unknown;
  restoreFocusOnSettle: boolean;
  unregisterCallerDestroy: (() => void) | null;
}

/** Root modal queue shared by every caller's `confirm()` and `choose()` calls. */
@Injectable({ providedIn: 'root' })
class HellPromptModalQueue {
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly queue: HellPromptModalQueueEntry[] = [];
  private openRef: NgpDialogRef<HellPromptRenderData, HellPromptDialogResult> | null = null;
  private interactionOpener: HTMLElement | null = null;
  private interactionOpenerTimer: number | null = null;

  constructor() {
    this.document.addEventListener('pointerdown', this.captureInteractionOpener, true);
    this.document.addEventListener('click', this.captureInteractionOpener, true);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('pointerdown', this.captureInteractionOpener, true);
      this.document.removeEventListener('click', this.captureInteractionOpener, true);
      if (this.interactionOpenerTimer !== null) {
        this.document.defaultView?.clearTimeout(this.interactionOpenerTimer);
      }
    });
  }

  request(
    data: HellPromptRenderData,
    dismissValue: unknown,
    injector: Injector,
    viewContainerRef: ViewContainerRef,
    callerDestroyRef: DestroyRef,
  ): Promise<unknown> {
    if (callerDestroyRef.destroyed) return Promise.resolve(dismissValue);

    return new Promise<unknown>((resolve) => {
      const entry: HellPromptModalQueueEntry = {
        data,
        dismissValue,
        injector,
        viewContainerRef,
        callerDestroyRef,
        resolve,
        opener: this.activeElement(),
        settled: false,
        closeStarted: false,
        closeValue: dismissValue,
        restoreFocusOnSettle: true,
        unregisterCallerDestroy: null,
      };
      entry.unregisterCallerDestroy = callerDestroyRef.onDestroy(() => {
        entry.unregisterCallerDestroy = null;
        this.dismissDestroyedCaller(entry);
      });
      this.queue.push(entry);
      this.pump();
    });
  }

  private pump(): void {
    if (this.openRef) return;

    while (this.queue.length > 0) {
      const entry = this.queue[0];
      if (entry.settled) {
        this.queue.shift();
        continue;
      }
      if (entry.callerDestroyRef.destroyed) {
        this.settleEntry(entry, entry.dismissValue);
        continue;
      }

      this.present(entry);
      return;
    }
  }

  private present(entry: HellPromptModalQueueEntry): void {
    const ref = this.dialogManager.open<HellPromptRenderData, HellPromptDialogResult>(
      HellPromptDialog,
      {
        data: entry.data,
        injector: entry.injector,
        viewContainerRef: entry.viewContainerRef,
      },
    );
    this.openRef = ref;

    // Preserve the immediate result while ng-primitives completes exit/detach.
    ref.closed.subscribe(({ result }) => {
      if (entry.settled) return;
      entry.closeStarted = true;
      entry.closeValue = result === undefined ? entry.dismissValue : result.value;
    });

    ref.afterClosed.subscribe((result) => {
      this.finishPresentedEntry(
        entry,
        ref,
        entry.closeStarted
          ? entry.closeValue
          : result === undefined
            ? entry.dismissValue
            : result.value,
      );
    });
  }

  private dismissDestroyedCaller(entry: HellPromptModalQueueEntry): void {
    if (entry.settled) return;
    entry.restoreFocusOnSettle = false;

    if (this.queue[0] !== entry || !this.openRef) {
      this.settleEntry(entry, entry.dismissValue);
      this.pump();
      return;
    }

    // An active caller owns the presented view context too. Dismiss its dialog
    // immediately, then advance the queue even if teardown makes detach reject.
    const ref = this.openRef;
    if (entry.closeStarted) return;

    void ref.hideImmediate().then(
      () => this.finishPresentedEntry(entry, ref, entry.dismissValue),
      () => this.finishPresentedEntry(entry, ref, entry.dismissValue),
    );
  }

  private finishPresentedEntry(
    entry: HellPromptModalQueueEntry,
    ref: NgpDialogRef<HellPromptRenderData, HellPromptDialogResult>,
    value: unknown,
  ): void {
    if (this.openRef === ref) this.openRef = null;
    this.settleEntry(entry, value);
    this.pump();
  }

  private settleEntry(entry: HellPromptModalQueueEntry, value: unknown): void {
    if (entry.settled) return;
    entry.settled = true;

    const unregister = entry.unregisterCallerDestroy;
    entry.unregisterCallerDestroy = null;
    if (unregister && !entry.callerDestroyRef.destroyed) unregister();

    const index = this.queue.indexOf(entry);
    if (index >= 0) this.queue.splice(index, 1);
    entry.resolve(value);
    if (entry.restoreFocusOnSettle) this.restoreFocus(entry.opener);
  }

  private activeElement(): HTMLElement | null {
    if (this.interactionOpener?.isConnected) return this.interactionOpener;
    const active = this.document.activeElement;
    const HTMLElementCtor = this.document.defaultView?.HTMLElement;
    return HTMLElementCtor && active instanceof HTMLElementCtor ? active : null;
  }

  /**
   * Safari does not focus a button merely because it was clicked. Capture the
   * focusable control for the current event turn so a prompt opened inside its
   * handler can still restore focus to the real opener.
   */
  private readonly captureInteractionOpener = (event: Event): void => {
    const HTMLElementCtor = this.document.defaultView?.HTMLElement;
    if (!HTMLElementCtor) return;

    const opener = event
      .composedPath()
      .find(
        (target): target is HTMLElement =>
          target instanceof HTMLElementCtor &&
          target.matches(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
      );
    if (!opener) return;

    this.interactionOpener = opener;
    if (this.interactionOpenerTimer !== null) {
      this.document.defaultView?.clearTimeout(this.interactionOpenerTimer);
    }
    this.interactionOpenerTimer = this.document.defaultView?.setTimeout(() => {
      if (this.interactionOpener === opener) this.interactionOpener = null;
      this.interactionOpenerTimer = null;
    }, 0) ?? null;
  };

  private restoreFocus(opener: HTMLElement | null): void {
    if (!opener) return;
    this.document.defaultView?.requestAnimationFrame(() => {
      if (opener.isConnected) opener.focus({ preventScroll: true });
    });
  }
}

/** Everything the anchored presenter needs from one choice request. */
interface HellAnchoredPromptRequest {
  readonly data: HellPromptRenderData;
  choose(value: unknown): void;
}

const HELL_ANCHORED_PROMPT_REQUEST = new InjectionToken<HellAnchoredPromptRequest>(
  'HELL_ANCHORED_PROMPT_REQUEST',
);

/** Internal anchored presenter. It renders the same choice buttons as the modal. */
@Component({
  selector: 'hell-anchored-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [HellPopover],
  imports: [HellButton],
  host: {
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'request.data.prompt.description !== null ? descriptionId : null',
  },
  template: `
    <div class="flex flex-col gap-hell-3">
      <div class="flex flex-col gap-hell-1">
        <p [id]="titleId" class="text-[13px] text-hell-foreground">
          {{ request.data.prompt.title }}
        </p>
        @if (request.data.prompt.description !== null) {
          <p [id]="descriptionId" class="text-[13px] text-hell-foreground-muted">
            {{ request.data.prompt.description }}
          </p>
        }
      </div>
      <div class="flex justify-end gap-hell-2">
        @for (button of buttons; track $index) {
          <button
            #actionButton
            hellButton
            [variant]="button.variant"
            size="sm"
            type="button"
            [disabled]="button.disabled()"
            (click)="choose(button)"
          >
            {{ button.text() }}
          </button>
        }
      </div>
    </div>
  `,
})
class HellAnchoredPrompt {
  protected readonly request = inject(HELL_ANCHORED_PROMPT_REQUEST);
  private readonly labels = inject(HELL_CONFIRM_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly titleId = `hell-anchored-prompt-${nextAnchoredPromptId()}`;
  protected readonly descriptionId = `${this.titleId}-description`;
  protected readonly buttons = this.request.data.buttons.map((button) => ({
    variant: button.variant,
    value: button.value,
    ...hellPromptButtonRuntime(button.label, button.countdownSeconds, this.labels),
  }));

  private readonly buttonRefs = viewChildren<ElementRef<HTMLButtonElement>>('actionButton');

  constructor() {
    afterNextRender(() => this.focusInitialControl());
  }

  protected choose(button: (typeof this.buttons)[number]): void {
    if (button.disabled()) return;
    this.request.choose(button.value);
  }

  private focusInitialControl(): void {
    const target = this.buttonRefs()[this.request.data.initialFocusIndex]?.nativeElement;
    if (!target) return;
    // Run after the popover focus trap's mount autofocus so the action focus policy wins.
    const view = this.host.ownerDocument.defaultView;
    if (view) view.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    else target.focus({ preventScroll: true });
  }
}

let anchoredPromptIdCounter = 0;
function nextAnchoredPromptId(): number {
  return ++anchoredPromptIdCounter;
}

interface HellAnchoredPromptHandle {
  dismiss(): void;
}

/** Root registry enforcing one anchored prompt at a time. */
@Injectable({ providedIn: 'root' })
class HellAnchoredPromptManager {
  private current: HellAnchoredPromptHandle | null = null;

  open(handle: HellAnchoredPromptHandle): void {
    const previous = this.current;
    this.current = handle;
    if (previous) previous.dismiss();
  }

  release(handle: HellAnchoredPromptHandle): void {
    if (this.current === handle) this.current = null;
  }
}

function normalizeCountdown(seconds: number | undefined): number {
  if (seconds === undefined || !Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.floor(seconds));
}

function resolveAction<TValue>(
  action: HellPromptAction<TValue>,
  defaultVariant: HellButtonVariant = 'default',
): HellPromptButton {
  return {
    value: action.value,
    label: action.label,
    variant: action.variant ?? defaultVariant,
    countdownSeconds: normalizeCountdown(action.countdownSeconds),
    dismissEquivalent: action.dismissEquivalent ?? false,
  };
}

function isSafeInitialFocus(button: HellPromptButton): boolean {
  return button.variant !== 'danger' && button.countdownSeconds === 0;
}

function choiceInitialFocusIndex(buttons: readonly HellPromptButton[]): number {
  if (buttons.every(isSafeInitialFocus)) return 0;

  const dismissIndex = buttons.findIndex(
    (button) => button.dismissEquivalent && isSafeInitialFocus(button),
  );
  if (dismissIndex >= 0) return dismissIndex;

  const safeIndex = buttons.findIndex(isSafeInitialFocus);
  return safeIndex >= 0 ? safeIndex : 0;
}

function confirmInitialFocusIndex(buttons: readonly HellPromptButton[]): number {
  if (isSafeInitialFocus(buttons[1])) return 1;
  if (isSafeInitialFocus(buttons[0])) return 0;
  return 0;
}

function openAnchoredPrompt(
  data: HellPromptRenderData,
  dismissValue: unknown,
  anchor: HTMLElement,
  placement: Placement,
  injector: Injector,
  viewContainerRef: ViewContainerRef,
  callerDestroyRef: DestroyRef,
  manager: HellAnchoredPromptManager,
): Promise<unknown> {
  if (callerDestroyRef.destroyed) return Promise.resolve(dismissValue);

  return new Promise<unknown>((resolve) => {
    let value = dismissValue;
    let settled = false;
    let unregisterCallerDestroy: (() => void) | null = null;
    const settle = () => {
      if (settled) return;
      settled = true;
      const unregister = unregisterCallerDestroy;
      unregisterCallerDestroy = null;
      if (unregister && !callerDestroyRef.destroyed) unregister();
      manager.release(handle);
      resolve(value);
    };

    const request: HellAnchoredPromptRequest = {
      data,
      choose: (nextValue) => {
        value = nextValue;
        overlay.hide();
      },
    };

    const overlay = createOverlay<unknown>({
      content: HellAnchoredPrompt,
      triggerElement: anchor,
      injector,
      viewContainerRef,
      placement: signal<Placement>(placement),
      offset: 4,
      closeOnOutsideClick: true,
      closeOnEscape: true,
      restoreFocus: true,
      providers: [{ provide: HELL_ANCHORED_PROMPT_REQUEST, useValue: request }],
      onClose: settle,
    });

    const handle: HellAnchoredPromptHandle = {
      // Displacement must not restore focus to the superseded anchor while the
      // replacement prompt is moving focus into its own panel.
      dismiss: () => {
        overlay.destroy();
        settle();
      },
    };
    // A pre-show destroy cancels ng-primitives' deferred mount without onClose.
    unregisterCallerDestroy = callerDestroyRef.onDestroy(() => {
      unregisterCallerDestroy = null;
      overlay.destroy();
      settle();
    });
    manager.open(handle);
    void overlay.show();
  });
}

/**
 * Injects the one public prompt Interface. The caller's `Injector` and
 * `ViewContainerRef` are captured once so scoped labels and Floating Scope are
 * preserved for both modal and anchored presenters.
 */
export function injectHellPrompt(): HellPrompt {
  const modalQueue = inject(HellPromptModalQueue);
  const anchoredManager = inject(HellAnchoredPromptManager);
  const injector = inject(Injector);
  const viewContainerRef = inject(ViewContainerRef);
  const callerDestroyRef = inject(DestroyRef);

  const requestChoice = <TValue>(
    prompt: HellPromptContent,
    actions: ReadonlyArray<HellPromptAction<TValue>>,
    options: Readonly<{ anchor?: HTMLElement; placement?: Placement }> | undefined,
    initialFocus: (buttons: readonly HellPromptButton[]) => number,
  ): Promise<TValue | null> => {
    if (actions.length === 0) {
      throw new Error('A Hell UI prompt choice needs at least one action.');
    }

    const buttons = actions.map((action) => resolveAction(action));
    const dismissEquivalents = buttons.filter((button) => button.dismissEquivalent);
    if (dismissEquivalents.length > 1) {
      throw new Error('A Hell UI prompt choice may mark at most one action dismissEquivalent.');
    }

    const data: HellPromptRenderData = {
      prompt: resolvePrompt(prompt),
      buttons,
      initialFocusIndex: initialFocus(buttons),
    };
    const dismissValue =
      dismissEquivalents.length === 1 ? dismissEquivalents[0].value : null;

    if (options?.anchor) {
      return openAnchoredPrompt(
        data,
        dismissValue,
        options.anchor,
        options.placement ?? 'bottom',
        injector,
        viewContainerRef,
        callerDestroyRef,
        anchoredManager,
      ) as Promise<TValue | null>;
    }
    return modalQueue.request(
      data,
      dismissValue,
      injector,
      viewContainerRef,
      callerDestroyRef,
    ) as Promise<TValue | null>;
  };

  const choose: HellPrompt['choose'] = (prompt, actions, options) =>
    requestChoice(prompt, actions, options, choiceInitialFocusIndex);

  const confirm: HellPrompt['confirm'] = (prompt, options) => {
    const labels = injector.get(HELL_CONFIRM_LABELS);
    const action: HellPromptAction<boolean> = {
      value: true,
      label: options?.action?.label ?? labels.confirm,
      variant: options?.action?.variant ?? 'primary',
      countdownSeconds: options?.action?.countdownSeconds,
    };
    const cancelAction: HellPromptAction<boolean> = {
      value: false,
      label: options?.cancelAction?.label ?? labels.cancel,
      variant: options?.cancelAction?.variant ?? (options?.cancelAction ? 'default' : 'ghost'),
      countdownSeconds: options?.cancelAction?.countdownSeconds,
      dismissEquivalent: true,
    };

    return requestChoice(
      prompt,
      [cancelAction, action],
      { anchor: options?.anchor, placement: options?.placement },
      confirmInitialFocusIndex,
    ) as Promise<boolean>;
  };

  return { confirm, choose };
}
