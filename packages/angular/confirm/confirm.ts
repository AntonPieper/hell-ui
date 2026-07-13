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
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgpDialogManager, injectDialogRef } from 'ng-primitives/dialog';
import type { NgpDialogRef } from 'ng-primitives/dialog';
import { createOverlay } from 'ng-primitives/portal';
import type { Placement } from '@floating-ui/dom';
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
import type { Signal } from '@angular/core';

/**
 * What a confirmation asks: a plain title string, or a title with a supporting
 * description. The title names the surface; the description is linked as its
 * accessible description.
 */
export type HellConfirmPrompt = string | Readonly<{ title: string; description?: string }>;

/**
 * Opaque confirmation action: a button label composed with its appearance
 * (`HellButtonVariant` vocabulary), initial-focus policy, and gating. The shape
 * is not part of the public contract — build values with the combinators
 * (`hellPrimaryAction`, `hellSecondaryAction`, `hellDestructiveAction`) and
 * decorate them with `hellCountdownAction`.
 */
export interface HellConfirmAction {
  /** @internal Structural brand only; the runtime shape is private. */
  readonly ɵconfirmAction: true;
}

/**
 * Opaque keyed action for `injectHellChoice()`: a `HellConfirmAction` bound to
 * the typed key the choice promise resolves with. Build values with
 * `hellChoiceAction`; the shape is not part of the public contract.
 */
export interface HellChoiceAction<K extends string> {
  /** @internal Structural brand carrying the key type; the runtime shape is private. */
  readonly ɵchoiceAction: K;
}

/** Resolved internal shape behind the opaque `HellConfirmAction`. */
interface HellConfirmActionConfig {
  readonly label: string;
  readonly variant: HellButtonVariant;
  readonly destructive: boolean;
  readonly countdownSeconds: number;
}

/** The only runtime carrier of `HellConfirmAction`; combinators are its only constructors. */
class HellConfirmActionValue implements HellConfirmAction {
  declare readonly ɵconfirmAction: true;

  constructor(readonly config: HellConfirmActionConfig) {}
}

/** The only runtime carrier of `HellChoiceAction`; `hellChoiceAction` is its only constructor. */
class HellChoiceActionValue<K extends string> implements HellChoiceAction<K> {
  declare readonly ɵchoiceAction: K;

  constructor(
    readonly key: K,
    readonly config: HellConfirmActionConfig,
    readonly dismissEquivalent: boolean,
  ) {}
}

/** The primary action: the `primary` button variant, focused when the surface opens. */
export function hellPrimaryAction(label: string): HellConfirmAction {
  return new HellConfirmActionValue({
    label,
    variant: 'primary',
    destructive: false,
    countdownSeconds: 0,
  });
}

/** A secondary action: the `default` button variant with no destructive focus policy. */
export function hellSecondaryAction(label: string): HellConfirmAction {
  return new HellConfirmActionValue({
    label,
    variant: 'default',
    destructive: false,
    countdownSeconds: 0,
  });
}

/**
 * A destructive action: the `danger` button variant. Initial focus moves to the
 * safe alternative (the cancel button, or a safe choice action) so an
 * Enter-by-habit cannot destroy data.
 */
export function hellDestructiveAction(label: string): HellConfirmAction {
  return new HellConfirmActionValue({
    label,
    variant: 'danger',
    destructive: true,
    countdownSeconds: 0,
  });
}

/**
 * Decorates an action with a countdown gate: its button stays disabled for
 * `seconds`, showing the remaining time through the Label Contract's
 * `countdown` formatter. The countdown gates enabling only — it never confirms
 * on its own, and initial focus moves off the gated button while it is disabled.
 */
export function hellCountdownAction(seconds: number, action: HellConfirmAction): HellConfirmAction {
  return new HellConfirmActionValue({
    ...hellConfirmActionConfig(action),
    countdownSeconds: Math.max(0, Math.floor(seconds)),
  });
}

/**
 * Binds an action to the typed key an `injectHellChoice()` promise resolves
 * with. Mark at most one action per choice `dismissEquivalent`: Escape and
 * backdrop dismissal then resolve that action's key instead of `null`.
 */
export function hellChoiceAction<K extends string>(
  key: K,
  action: HellConfirmAction,
  options?: { readonly dismissEquivalent?: boolean },
): HellChoiceAction<K> {
  return new HellChoiceActionValue(
    key,
    hellConfirmActionConfig(action),
    options?.dismissEquivalent ?? false,
  );
}

function hellConfirmActionConfig(action: HellConfirmAction): HellConfirmActionConfig {
  if (!(action instanceof HellConfirmActionValue)) {
    throw new Error(
      'Hell UI confirm actions must be built with the hell*Action combinators (hellPrimaryAction, hellSecondaryAction, hellDestructiveAction, hellCountdownAction).',
    );
  }
  return action.config;
}

function hellChoiceActionValue<K extends string>(
  action: HellChoiceAction<K>,
): HellChoiceActionValue<K> {
  if (!(action instanceof HellChoiceActionValue)) {
    throw new Error('Hell UI choice actions must be built with the hellChoiceAction combinator.');
  }
  return action;
}

/** Built-in strings owned by the confirm entry point's Label Contract. */
export interface HellConfirmLabels {
  /** Label of the default primary action used when `confirm()` is called without an action. */
  readonly confirm: string;
  /** Label of the cancel button when no `cancelAction` overrides it. */
  readonly cancel: string;
  /** Formats the remaining-seconds suffix appended to a countdown-gated action label. */
  readonly countdown: (remainingSeconds: number) => string;
}

/** Injection token resolving to the effective confirm labels. */
export const HELL_CONFIRM_LABELS: InjectionToken<HellConfirmLabels> = hellCreateLabels<HellConfirmLabels>('HELL_CONFIRM_LABELS', {
  confirm: 'Confirm',
  cancel: 'Cancel',
  countdown: (remainingSeconds: number) => ` (${remainingSeconds})`,
});

/** Normalized prompt: title plus optional description. */
interface HellConfirmPromptResolved {
  readonly title: string;
  readonly description: string | null;
}

function resolvePrompt(prompt: HellConfirmPrompt): HellConfirmPromptResolved {
  if (typeof prompt === 'string') return { title: prompt, description: null };
  return { title: prompt.title, description: prompt.description ?? null };
}

/** One rendered button of a confirm/choice surface, with its resolution value. */
interface HellConfirmButton {
  readonly label: string;
  readonly variant: HellButtonVariant;
  readonly countdownSeconds: number;
  readonly value: unknown;
}

/** Reactive per-button state: countdown-gated disabling and the suffixed label. */
interface HellConfirmButtonRuntime {
  readonly text: Signal<string>;
  readonly disabled: Signal<boolean>;
}

/**
 * Creates the reactive state for one possibly countdown-gated button. Must run
 * in an injection context; the ticking interval is cleaned up on destroy. The
 * countdown gates enabling only — reaching zero merely enables the button.
 */
function hellConfirmButtonRuntime(
  label: string,
  countdownSeconds: number,
  labels: HellConfirmLabels,
): HellConfirmButtonRuntime {
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

/** Data handed to the internal confirm dialog through the dialog manager. */
interface HellConfirmDialogData {
  readonly prompt: HellConfirmPromptResolved;
  readonly buttons: readonly HellConfirmButton[];
  readonly initialFocusIndex: number;
}

/**
 * Internal modal rendered on the dialog primitive for both `injectHellConfirm`
 * and `injectHellChoice`. Not part of the public surface — callers drive it
 * entirely through the inject functions; clicking a button closes the dialog
 * with that button's resolution value.
 */
@Component({
  selector: 'hell-confirm-dialog',
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
class HellConfirmDialog {
  private readonly ref = injectDialogRef<HellConfirmDialogData, unknown>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly labels = inject(HELL_CONFIRM_LABELS);

  private readonly data = this.ref.data;
  /** Normalized prompt rendered as the dialog title and description. */
  protected readonly prompt = this.data.prompt;
  /** Rendered buttons with their reactive countdown state and resolution values. */
  protected readonly buttons = this.data.buttons.map((button) => ({
    variant: button.variant,
    value: button.value,
    ...hellConfirmButtonRuntime(button.label, button.countdownSeconds, this.labels),
  }));

  private readonly buttonRefs = viewChildren<ElementRef<HTMLButtonElement>>('actionButton');

  constructor() {
    afterNextRender(() => this.focusInitialControl());
  }

  /** Resolve the surface with the clicked button's value. */
  protected choose(button: (typeof this.buttons)[number]): void {
    if (button.disabled()) return;
    void this.ref.close(button.value);
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

interface HellConfirmQueueEntry {
  readonly data: HellConfirmDialogData;
  readonly dismissValue: unknown;
  readonly injector: Injector;
  readonly resolve: (value: unknown) => void;
  readonly opener: HTMLElement | null;
}

/**
 * Internal root queue behind `injectHellConfirm` and `injectHellChoice`. Opens
 * one modal at a time on the dialog primitive; the promise always resolves —
 * Escape and backdrop dismissal resolve the request's dismiss value.
 */
@Injectable({ providedIn: 'root' })
class HellConfirmModalQueue {
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly document = inject(DOCUMENT);

  private readonly queue: HellConfirmQueueEntry[] = [];
  private openRef: NgpDialogRef<HellConfirmDialogData, unknown> | null = null;

  /** Enqueue one modal request and resolve with the chosen value. Never rejects. */
  request(
    data: HellConfirmDialogData,
    dismissValue: unknown,
    injector: Injector,
  ): Promise<unknown> {
    return new Promise<unknown>((resolve) => {
      this.queue.push({ data, dismissValue, injector, resolve, opener: this.activeElement() });
      this.pump();
    });
  }

  private pump(): void {
    if (this.openRef || this.queue.length === 0) return;

    const entry = this.queue[0];
    const ref = this.dialogManager.open<HellConfirmDialogData, unknown>(HellConfirmDialog, {
      data: entry.data,
      injector: entry.injector,
    });
    this.openRef = ref;

    ref.afterClosed.subscribe((result) => {
      this.openRef = null;
      this.queue.shift();
      entry.resolve(result === undefined ? entry.dismissValue : result);
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

function hellDefaultPrimaryConfig(labels: HellConfirmLabels): HellConfirmActionConfig {
  return { label: labels.confirm, variant: 'primary', destructive: false, countdownSeconds: 0 };
}

function hellDefaultCancelConfig(labels: HellConfirmLabels): HellConfirmActionConfig {
  return { label: labels.cancel, variant: 'ghost', destructive: false, countdownSeconds: 0 };
}

/**
 * The confirmation function returned by `injectHellConfirm`: opens one
 * accessible modal for the prompt and resolves whether the user confirmed.
 */
export type HellConfirmFn = (
  prompt: HellConfirmPrompt,
  action?: HellConfirmAction,
  cancelAction?: HellConfirmAction,
) => Promise<boolean>;

/**
 * Injects a promise-based confirmation function backed by the dialog primitive.
 *
 * `await confirm(prompt, action?, cancelAction?)` opens a focus-trapped,
 * labelled modal and resolves `true` only when the user activates the confirm
 * action. The promise always resolves — Escape, backdrop dismissal, and the
 * cancel button resolve `false` — and calls queue: two confirm surfaces never
 * show at once. Without an `action`, the confirm button is the Label
 * Contract's default primary action; `cancelAction` replaces the default
 * cancel button ("Keep project"). Destructive and countdown-gated actions move
 * initial focus to cancel.
 */
export function injectHellConfirm(): HellConfirmFn {
  const queue = inject(HellConfirmModalQueue);
  const injector = inject(Injector);

  return (prompt, action, cancelAction) => {
    const labels = injector.get(HELL_CONFIRM_LABELS);
    const confirm = action ? hellConfirmActionConfig(action) : hellDefaultPrimaryConfig(labels);
    const cancel = cancelAction
      ? hellConfirmActionConfig(cancelAction)
      : hellDefaultCancelConfig(labels);
    const data: HellConfirmDialogData = {
      prompt: resolvePrompt(prompt),
      buttons: [
        {
          label: cancel.label,
          variant: cancel.variant,
          countdownSeconds: cancel.countdownSeconds,
          value: false,
        },
        {
          label: confirm.label,
          variant: confirm.variant,
          countdownSeconds: confirm.countdownSeconds,
          value: true,
        },
      ],
      initialFocusIndex: confirm.destructive || confirm.countdownSeconds > 0 ? 0 : 1,
    };
    return queue.request(data, false, injector) as Promise<boolean>;
  };
}

/**
 * The decision function returned by `injectHellChoice`: opens one accessible
 * modal offering the given actions and resolves the chosen action's key.
 */
export type HellChoiceFn = <K extends string>(
  prompt: HellConfirmPrompt,
  actions: ReadonlyArray<HellChoiceAction<K>>,
) => Promise<K | null>;

/**
 * Injects a promise-based N-way decision function backed by the dialog
 * primitive (modal only).
 *
 * `await choice(prompt, actions)` renders one button per `hellChoiceAction`
 * (in order) and resolves the activated action's key. The promise always
 * resolves: Escape and backdrop dismissal resolve the key of the single action
 * marked `dismissEquivalent`, else `null`. Calls share the confirm queue.
 * When any action is destructive or countdown-gated, initial focus moves to
 * the safe dismiss-equivalent action (or the first safe action).
 */
export function injectHellChoice(): HellChoiceFn {
  const queue = inject(HellConfirmModalQueue);
  const injector = inject(Injector);

  return <K extends string>(
    prompt: HellConfirmPrompt,
    actions: ReadonlyArray<HellChoiceAction<K>>,
  ) => {
    const values = actions.map(hellChoiceActionValue);
    if (values.length === 0) {
      throw new Error('A Hell UI choice needs at least one hellChoiceAction.');
    }
    const dismissEquivalents = values.filter((value) => value.dismissEquivalent);
    if (dismissEquivalents.length > 1) {
      throw new Error('A Hell UI choice may mark at most one action dismissEquivalent.');
    }
    const data: HellConfirmDialogData = {
      prompt: resolvePrompt(prompt),
      buttons: values.map((value) => ({
        label: value.config.label,
        variant: value.config.variant,
        countdownSeconds: value.config.countdownSeconds,
        value: value.key,
      })),
      initialFocusIndex: choiceInitialFocusIndex(values),
    };
    return queue.request(data, dismissEquivalents[0]?.key ?? null, injector) as Promise<K | null>;
  };
}

function choiceInitialFocusIndex(values: readonly HellChoiceActionValue<string>[]): number {
  const isSafe = (value: HellChoiceActionValue<string>) =>
    !value.config.destructive && value.config.countdownSeconds === 0;
  if (values.every(isSafe)) return 0;

  const dismissIndex = values.findIndex((value) => value.dismissEquivalent && isSafe(value));
  if (dismissIndex >= 0) return dismissIndex;

  const safeIndex = values.findIndex(isSafe);
  return safeIndex >= 0 ? safeIndex : 0;
}

/** Everything the internal popconfirm panel needs from its opening call. */
interface HellPopconfirmRequest {
  readonly prompt: HellConfirmPromptResolved;
  readonly action: HellConfirmActionConfig;
  readonly cancelLabel: string;
  confirm(): void;
  cancel(): void;
}

/**
 * Injection token carrying one popconfirm call's request into the panel
 * rendered by the overlay. Internal to the entry point.
 */
const HELL_POPCONFIRM_REQUEST = new InjectionToken<HellPopconfirmRequest>(
  'HELL_POPCONFIRM_REQUEST',
);

/**
 * Internal anchored confirmation panel rendered on the popover primitive by
 * `injectHellPopconfirm`. Not part of the public surface. It registers with
 * any active Hell Floating Scope through `HellPopover`, is named by the prompt
 * title, and mirrors the modal focus policy: destructive or countdown-gated
 * actions start focus on cancel.
 */
@Component({
  selector: 'hell-popconfirm-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [HellPopover],
  imports: [HellButton],
  host: {
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'request.prompt.description !== null ? descriptionId : null',
  },
  template: `
    <div class="flex flex-col gap-hell-3">
      <div class="flex flex-col gap-hell-1">
        <p [id]="titleId" class="text-[13px] text-hell-foreground">{{ request.prompt.title }}</p>
        @if (request.prompt.description !== null) {
          <p [id]="descriptionId" class="text-[13px] text-hell-foreground-muted">
            {{ request.prompt.description }}
          </p>
        }
      </div>
      <div class="flex justify-end gap-hell-2">
        <button
          #cancelButtonEl
          hellButton
          variant="ghost"
          size="sm"
          type="button"
          (click)="request.cancel()"
        >
          {{ request.cancelLabel }}
        </button>
        <button
          #confirmButtonEl
          hellButton
          [variant]="request.action.variant"
          size="sm"
          type="button"
          [disabled]="confirm.disabled()"
          (click)="onConfirm()"
        >
          {{ confirm.text() }}
        </button>
      </div>
    </div>
  `,
})
class HellPopconfirmPanel {
  /** The opening call's prompt, action, and resolution callbacks. */
  protected readonly request = inject(HELL_POPCONFIRM_REQUEST);
  private readonly labels = inject(HELL_CONFIRM_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Stable id linking the prompt title as the panel's accessible name. */
  protected readonly titleId = `hell-popconfirm-${nextPopconfirmId()}`;
  /** Stable id linking the prompt description as the panel's accessible description. */
  protected readonly descriptionId = `${this.titleId}-description`;
  /** Reactive confirm-button state, including any countdown gate. */
  protected readonly confirm = hellConfirmButtonRuntime(
    this.request.action.label,
    this.request.action.countdownSeconds,
    this.labels,
  );

  private readonly confirmButtonRef = viewChild<ElementRef<HTMLButtonElement>>('confirmButtonEl');
  private readonly cancelButtonRef = viewChild<ElementRef<HTMLButtonElement>>('cancelButtonEl');

  constructor() {
    afterNextRender(() => this.focusInitialControl());
  }

  /** Resolve the popconfirm as confirmed unless the countdown still gates it. */
  protected onConfirm(): void {
    if (this.confirm.disabled()) return;
    this.request.confirm();
  }

  private focusInitialControl(): void {
    const target =
      this.request.action.destructive || this.confirm.disabled()
        ? this.cancelButtonRef()
        : this.confirmButtonRef();
    const element = target?.nativeElement;
    if (!element) return;
    // Run after the popover focus trap's mount autofocus so the action focus policy wins.
    const view = this.host.ownerDocument.defaultView;
    if (view) view.requestAnimationFrame(() => element.focus({ preventScroll: true }));
    else element.focus({ preventScroll: true });
  }
}

let popconfirmIdCounter = 0;
function nextPopconfirmId(): number {
  return ++popconfirmIdCounter;
}

/** Handle the single-open registry uses to displace an open popconfirm. */
interface HellPopconfirmHandle {
  dismiss(): void;
}

/**
 * Root registry enforcing one open popconfirm at a time: opening one displaces
 * any other, which resolves `false`. Internal to the entry point.
 */
@Injectable({ providedIn: 'root' })
class HellPopconfirmManager {
  private current: HellPopconfirmHandle | null = null;

  /** Track `handle` as the open popconfirm, dismissing any previously open one. */
  open(handle: HellPopconfirmHandle): void {
    const previous = this.current;
    this.current = handle;
    if (previous) previous.dismiss();
  }

  /** Clear `handle` if it is the currently tracked open popconfirm. */
  release(handle: HellPopconfirmHandle): void {
    if (this.current === handle) this.current = null;
  }
}

/**
 * The popconfirm function returned by `injectHellPopconfirm`: opens one
 * anchored confirmation panel and resolves whether the user confirmed.
 */
export type HellPopconfirmFn = (
  anchor: HTMLElement,
  prompt: HellConfirmPrompt,
  action?: HellConfirmAction,
) => Promise<boolean>;

/**
 * Injects a promise-based anchored confirmation function backed by the popover
 * primitive — the in-context alternative to `injectHellConfirm` for lightweight
 * decisions such as a row delete.
 *
 * `await popconfirm(anchor, prompt, action?)` opens a small panel positioned
 * against `anchor`, moves focus into it, and resolves `true` only when the
 * user activates the confirm action. The promise always resolves — cancel,
 * Escape, an outside click, and another popconfirm opening all resolve `false`.
 * Focus returns to the anchor when the panel closes, one popconfirm is open at
 * a time, and the panel joins the surrounding Hell Floating Scope so nested
 * dismissal keeps working. Must be injected in a component or directive: the
 * panel renders from the caller's view.
 */
export function injectHellPopconfirm(): HellPopconfirmFn {
  const injector = inject(Injector);
  const viewContainerRef = inject(ViewContainerRef);
  const manager = inject(HellPopconfirmManager);

  return (anchor, prompt, action) =>
    new Promise<boolean>((resolve) => {
      const labels = injector.get(HELL_CONFIRM_LABELS);
      const config = action ? hellConfirmActionConfig(action) : hellDefaultPrimaryConfig(labels);

      let result = false;
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        manager.release(handle);
        resolve(result);
      };

      const request: HellPopconfirmRequest = {
        prompt: resolvePrompt(prompt),
        action: config,
        cancelLabel: labels.cancel,
        confirm: () => {
          result = true;
          overlay.hide();
        },
        cancel: () => overlay.hide(),
      };

      const overlay = createOverlay<unknown>({
        content: HellPopconfirmPanel,
        triggerElement: anchor,
        injector,
        viewContainerRef,
        placement: signal<Placement>('bottom'),
        offset: 4,
        closeOnOutsideClick: true,
        closeOnEscape: true,
        restoreFocus: true,
        providers: [{ provide: HELL_POPCONFIRM_REQUEST, useValue: request }],
        onClose: settle,
      });

      const handle: HellPopconfirmHandle = {
        // Displacement skips the user-driven close's focus restore and must
        // also settle a panel dismissed before its open tick, so destroy + settle.
        dismiss: () => {
          overlay.destroy();
          settle();
        },
      };
      manager.open(handle);
      void overlay.show();
    });
}
