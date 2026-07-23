import {
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from 'hell-ui/core';

const HELL_MASTER_DETAIL_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const HELL_MASTER_PANE_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const HELL_MASTER_DETAIL_BACK_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

function renderHiddenState(
  renderer: Renderer2,
  host: HTMLElement,
  hidden: boolean,
): void {
  renderer.setProperty(host, 'hidden', hidden);
  setNullableAttribute(renderer, host, 'aria-hidden', hidden ? 'true' : null);
  setNullableAttribute(renderer, host, 'inert', hidden ? '' : null);
}

function setNullableAttribute(
  renderer: Renderer2,
  host: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value === null) renderer.removeAttribute(host, name);
  else renderer.setAttribute(host, name, value);
}

/**
 * Projection-first Master Detail controller. Consumers own the host, panes,
 * layout, presentation, navigation, and any Resizable composition. The
 * controller owns only container-driven compact state, controlled detail
 * state, pane visibility, back behavior, and focus transfer/restoration.
 */
@Directive({
  selector: '[hellMasterDetail]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-compact]': 'compact() ? "true" : null',
    '[attr.data-detail-open]': 'detailOpen() ? "true" : null',
  },
  exportAs: 'hellMasterDetail',
})
export class HellMasterDetail {
  /** Tailwind class refinements for the consumer-owned root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MASTER_DETAIL_RECIPE,
  });

  /**
   * Controlled compact detail state. Writing the model emits the standard
   * `detailOpenChange` output used by two-way binding.
   */
  readonly detailOpen = model(false);

  /** Inline size in pixels below which only the active pane remains available. */
  readonly compactBelow = input(720, { transform: numberAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly inlineSize = signal(0);
  private destroyed = false;
  private focusRequest = 0;
  private restoreTarget: HTMLElement | null = null;
  private previousCompact = false;
  private previousDetailOpen = false;

  /** Whether the controller is currently below its container breakpoint. */
  readonly compact = computed(() => {
    const breakpoint = this.compactBelow();
    const width = this.inlineSize();
    return breakpoint > 0 && width > 0 && width < breakpoint;
  });

  constructor() {
    this.observeInlineSize();

    effect(() => {
      const compact = this.compact();
      const detailOpen = this.detailOpen();
      const wasCompact = this.previousCompact;
      const wasDetailOpen = this.previousDetailOpen;
      this.previousCompact = compact;
      this.previousDetailOpen = detailOpen;

      if (!compact) {
        const active = this.activeElement();
        if (
          wasCompact &&
          active?.matches('button[hellMasterDetailBack]') &&
          this.ownsElement(active)
        ) {
          this.scheduleFocus(() => this.focusPane('detail', false));
        } else {
          this.cancelPendingFocus();
        }
        return;
      }

      if (wasCompact && detailOpen !== wasDetailOpen) {
        if (detailOpen) {
          this.capturePrimaryFocus();
          this.scheduleFocus(() => this.focusPane('detail', true));
        } else {
          const restoreTarget = this.restoreTarget;
          this.restoreTarget = null;
          this.scheduleFocus(() => {
            if (!this.focusElement(restoreTarget)) this.focusPane('primary', false);
          });
        }
        return;
      }

      if (!wasCompact) {
        const hiddenPane = this.paneElement(detailOpen ? 'primary' : 'detail');
        const active = this.activeElement();
        if (active && hiddenPane?.contains(active)) {
          if (detailOpen) this.restoreTarget = active;
          this.scheduleFocus(() => this.focusPane(detailOpen ? 'detail' : 'primary', detailOpen));
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cancelPendingFocus();
    });
  }

  private observeInlineSize(): void {
    const update = () => {
      if (!this.destroyed) this.inlineSize.set(this.host.clientWidth);
    };
    queueMicrotask(() => {
      if (this.inlineSize() === 0) update();
    });

    const ownerWindow = this.host.ownerDocument.defaultView;
    const ResizeObserverCtor = ownerWindow?.ResizeObserver;
    if (ResizeObserverCtor) {
      const observer = new ResizeObserverCtor((entries: ResizeObserverEntry[]) => {
        if (this.destroyed) return;
        const width = entries[0]?.contentRect.width ?? this.host.clientWidth;
        this.inlineSize.set(width);
      });
      observer.observe(this.host);
      this.destroyRef.onDestroy(() => observer.disconnect());
      return;
    }

    if (!ownerWindow) return;
    ownerWindow.addEventListener('resize', update);
    this.destroyRef.onDestroy(() => ownerWindow.removeEventListener('resize', update));
  }

  private capturePrimaryFocus(): void {
    const active = this.activeElement();
    const primary = this.paneElement('primary');
    if (active && primary?.contains(active)) this.restoreTarget = active;
  }

  private activeElement(): HTMLElement | null {
    const active = this.host.ownerDocument.activeElement;
    return active && typeof (active as HTMLElement).focus === 'function'
      ? (active as HTMLElement)
      : null;
  }

  private paneElement(kind: 'primary' | 'detail'): HTMLElement | null {
    const panes = this.host.querySelectorAll<HTMLElement>(
      `[hellMasterPane][data-pane="${kind}"]`,
    );
    return (
      Array.from(panes).find((pane) => this.ownsElement(pane)) ?? null
    );
  }

  private scheduleFocus(task: () => void): void {
    const request = ++this.focusRequest;
    queueMicrotask(() => {
      if (this.destroyed || request !== this.focusRequest) return;
      task();
    });
  }

  private cancelPendingFocus(): void {
    this.focusRequest += 1;
  }

  private focusPane(kind: 'primary' | 'detail', preferBack: boolean): void {
    const pane = this.paneElement(kind);
    if (!pane || pane.hidden || pane.hasAttribute('inert')) return;

    if (preferBack) {
      const back = pane.querySelector<HTMLElement>('button[hellMasterDetailBack]');
      if (this.focusElement(back)) return;
    }

    for (const candidate of Array.from(pane.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))) {
      if (!preferBack && candidate.matches('button[hellMasterDetailBack]')) continue;
      if (this.focusElement(candidate)) return;
    }

    const previousTabindex = pane.getAttribute('tabindex');
    if (previousTabindex === null) pane.setAttribute('tabindex', '-1');
    pane.focus({ preventScroll: true });
    if (previousTabindex === null) {
      queueMicrotask(() => {
        if (pane.getAttribute('tabindex') === '-1') pane.removeAttribute('tabindex');
      });
    }
  }

  private focusElement(target: HTMLElement | null): boolean {
    if (!this.isSafeFocusCandidate(target)) return false;

    target.focus({ preventScroll: true });
    return this.host.ownerDocument.activeElement === target;
  }

  private isSafeFocusCandidate(target: HTMLElement | null): target is HTMLElement {
    if (
      !target ||
      !target.isConnected ||
      !this.host.contains(target) ||
      !this.ownsElement(target) ||
      target.matches(':disabled') ||
      target.getAttribute('aria-disabled')?.trim().toLowerCase() === 'true' ||
      target.tabIndex < 0 ||
      target.getClientRects().length === 0
    ) {
      return false;
    }

    for (let ancestor: HTMLElement | null = target; ancestor; ancestor = ancestor.parentElement) {
      if (
        ancestor.hidden ||
        ancestor.hasAttribute('inert') ||
        ancestor.getAttribute('aria-hidden')?.trim().toLowerCase() === 'true'
      ) {
        return false;
      }
    }

    return true;
  }

  private ownsElement(target: HTMLElement): boolean {
    return (
      target.ownerDocument === this.host.ownerDocument &&
      target.closest('[hellMasterDetail]') === this.host
    );
  }
}

/** Consumer-owned primary or detail pane coordinated by `[hellMasterDetail]`. */
@Directive({
  selector: '[hellMasterPane]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-pane]': 'hellMasterPane()',
  },
})
export class HellMasterPane {
  /** Semantic pane role. Exactly one primary and one detail pane are expected. */
  readonly hellMasterPane = input.required<'primary' | 'detail'>({ alias: 'hellMasterPane' });

  /** Tailwind class refinements for the consumer-owned pane root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the pane root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MASTER_PANE_RECIPE,
  });

  /** Enclosing Master Detail controller. */
  private readonly controller = inject(HellMasterDetail);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly domRenderer = inject(Renderer2);

  /** Whether this pane is the inactive compact pane. Wide layouts keep both panes available. */
  private readonly hidden = computed(
    () =>
      this.controller.compact() &&
      (this.hellMasterPane() === 'detail') !== this.controller.detailOpen(),
  );
  private readonly stateRenderer = effect(() => {
    const hidden = this.hidden();
    renderHiddenState(this.domRenderer, this.host, hidden);
    setNullableAttribute(
      this.domRenderer,
      this.host,
      'data-active',
      this.controller.compact() ? (hidden ? 'false' : 'true') : null,
    );
  });
}

/** Consumer-rendered compact back button for an enclosing Master Detail controller. */
@Directive({
  selector: 'button[hellMasterDetailBack]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
  },
})
export class HellMasterDetailBack {
  /** Tailwind class refinements for the consumer-owned back button root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the back button root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MASTER_DETAIL_BACK_RECIPE,
  });

  private readonly controller = inject(HellMasterDetail);
  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  private readonly domRenderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  /** Back is available only while the compact detail pane is active. */
  private readonly hidden = computed(
    () => !this.controller.compact() || !this.controller.detailOpen(),
  );
  private readonly stateRenderer = effect(() => {
    renderHiddenState(this.domRenderer, this.host, this.hidden());
  });
  private readonly hostEvents = this.bindHostEvents();

  private bindHostEvents(): void {
    const stopClick = this.domRenderer.listen(this.host, 'click', () => {
      this.controller.detailOpen.set(false);
    });
    this.destroyRef.onDestroy(stopClick);
  }
}

/** Standalone imports for the complete Master Detail controller API. */
export const HELL_MASTER_DETAIL_IMPORTS = [
  HellMasterDetail,
  HellMasterPane,
  HellMasterDetailBack,
] as const;
