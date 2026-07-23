import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { injectFormFieldState } from 'ng-primitives/form-field';
import {
  NgpSliderRange,
  NgpSliderThumb,
  NgpSliderTrack,
  ngpSlider,
  provideSliderState,
} from 'ng-primitives/slider';
import { hellUniqueIdRefs } from 'hell-ui/internal/core';
import { hellPartStyler, type HellOrientation, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from 'hell-ui/core';

let nextSliderId = 0;

/** Public parts of the HellSlider module, styleable through its Part Style Map. */
export type HellSliderPart = 'root' | 'track' | 'range' | 'thumb';
/** Part Style Map accepted by the HellSlider `ui` input. */
export type HellSliderUi = HellUi<HellSliderPart>;

/**
 * `FormUiControl` reserves `min`/`max` as `number | undefined` inputs so
 * Signal Forms can reflect `min()`/`max()` validator metadata into the
 * control (and clear it with `undefined` again). Attribute and property
 * bindings keep number coercion; `null`/`undefined` mean "unset".
 */
function hellSliderBoundAttribute(value: unknown): number | undefined {
  return value == null ? undefined : numberAttribute(value);
}

const HELL_SLIDER_RECIPE = {
  root: 'relative inline-flex h-hell-6 w-full cursor-pointer touch-none select-none items-center box-border [--_hell-slider-thumb-clearance:9px] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[orientation=horizontal]:data-[size=sm]:h-hell-5 data-[orientation=horizontal]:data-[size=lg]:h-hell-7 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-[calc(var(--spacing)*24)] data-[orientation=vertical]:max-h-full data-[orientation=vertical]:w-hell-6 data-[orientation=vertical]:flex-col data-[orientation=vertical]:py-[var(--_hell-slider-thumb-clearance)] data-[size=sm]:[--_hell-slider-thumb-clearance:7px] data-[size=lg]:[--_hell-slider-thumb-clearance:11px] data-[orientation=vertical]:[--_hell-slider-thumb-clearance:7px]',
  track: 'relative min-h-0 min-w-0 flex-auto self-stretch bg-transparent',
  range:
    'pointer-events-none absolute rounded-hell-pill bg-hell-primary shadow-[inset_0_-1px_0_rgb(0_0_0_/_0.08)]',
  thumb:
    'absolute block cursor-grab rounded-hell-pill border border-solid border-hell-primary bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.15),0_0_0_0_var(--color-hell-primary)] outline-none transition-[scale,box-shadow,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-press:cursor-grabbing',
} satisfies HellRecipe<HellSliderPart>;

/**
 * Single-value slider built on `ng-primitives/slider`. Drag the thumb,
 * click anywhere on the track (which then continues into a drag), or use
 * arrow keys (Home/End jump to min/max).
 *
 * The `value` model is the slider's one Control Value Authority: bind it
 * one-way (`[value]` plus `(valueChange)`), two-way (`[(value)]`), or through
 * Angular forms — Signal Forms `[formField]` via the `FormValueControl`
 * contract, and `formControl`/`ngModel` via Angular's built-in Signal Forms
 * interoperability. Use `<hell-slider [(value)]="vol" />`.
 */
@Component({
  selector: 'hell-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgpSliderTrack, NgpSliderRange, NgpSliderThumb],
  providers: [provideSliderState()],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-thumb]': 'thumb()',
    '[attr.data-grow]': 'grow() ? "true" : null',
    '[attr.data-active-drag]': 'activeDrag() ? "true" : null',
    '[attr.tabindex]': '-1',
    '(pointerdown)': 'markActiveDrag($event)',
    '(focusout)': 'markControlTouched()',
  },
  template: `
    <div
      ngpSliderTrack
      data-slot="track"
      [class]="part('track')"
      (pointerdown)="continueAsDrag($event)"
    >
      <div ngpSliderRange data-slot="range" [class]="part('range')"></div>
    </div>
    <div
      #thumb
      ngpSliderThumb
      data-slot="thumb"
      [class]="part('thumb')"
    ></div>
  `,
})
export class HellSlider implements FormValueControl<number> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSliderPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSliderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SLIDER_RECIPE,
  });

  /**
   * Committed slider value — the one Control Value Authority. User commits
   * write it exactly once per change and emit `(valueChange)`; external
   * property, two-way, and form writes flow in without re-emitting. Expects a
   * `number` binding (no static-attribute coercion). Defaults to `0`.
   */
  readonly value = model(0);
  /**
   * Minimum allowed value. Defaults to `0`; `undefined` falls back to `0`.
   * Also driven by a bound Signal Forms field's `min` validator metadata.
   */
  readonly min = input(0, { transform: hellSliderBoundAttribute });
  /**
   * Maximum allowed value. Defaults to `100`; `undefined` falls back to `100`.
   * Also driven by a bound Signal Forms field's `max` validator metadata.
   */
  readonly max = input(100, { transform: hellSliderBoundAttribute });
  /** Increment size for keyboard and drag stepping. Defaults to `1`. */
  readonly step = input(1, { transform: numberAttribute });
  /** Whether the slider is disabled. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Layout axis of the slider. Defaults to `'horizontal'`. */
  readonly orientation = input<HellOrientation>('horizontal');
  /** Visual size of the slider; `sm`, `md`, or `lg`. Defaults to `'md'`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Accessible label for the thumb, mirrored from the host's `aria-label` when unset. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /**
   * Thumb visibility. `'always'` (default) keeps the thumb visible; `'hover'`
   * hides it until the slider is hovered, focused, or pressed — useful for
   * media seek bars and other display-leaning sliders.
   */
  readonly thumb = input<'always' | 'hover'>('always');
  /**
   * When `true`, the track expands on hover/focus/press for a more tactile,
   * media-player feel without changing layout (the host height is reserved).
   */
  readonly grow = input(false, { transform: booleanAttribute });

  /**
   * Emits when the user finishes interacting with the slider (focus leaves it
   * or a track drag begins). Angular forms listen to this output to mark the
   * bound field or control as touched.
   */
  readonly touch = output<void>();

  /** Whether the thumb is currently being dragged. */
  protected readonly activeDrag = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');
  private readonly destroyRef = inject(DestroyRef);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly hostAriaLabel = signal<string | null>(null);
  private readonly hostAriaLabelledby = signal<string | null>(null);
  private readonly hostAriaDescribedby = signal<string | null>(null);
  private readonly sliderId = signal(
    this.host.nativeElement.getAttribute('id') ?? `hell-slider-${nextSliderId++}`,
  );
  private removeActiveDragListeners: (() => void) | null = null;

  private readonly effectiveMin = computed(() => this.min() ?? 0);
  private readonly effectiveMax = computed(() => this.max() ?? 100);
  private readonly effectiveValue = computed(() => this.coerceValue(this.value()));

  /** Headless slider state and behavior from `ngpSlider`. */
  protected readonly sliderState = ngpSlider({
    id: this.sliderId,
    value: this.effectiveValue,
    min: this.effectiveMin,
    max: this.effectiveMax,
    step: this.step,
    orientation: this.orientation,
    disabled: this.disabled,
    onValueChange: (value) => this.value.set(value),
  });
  private readonly thumbAriaLabel = computed(() => this.ariaLabel() ?? this.hostAriaLabel());
  private readonly thumbAriaLabelledby = computed(() =>
    this.mergedIdrefs(
      this.hostAriaLabelledby(),
      this.inheritedFormField()?.labels() ?? [],
    ),
  );
  private readonly thumbAriaDescribedby = computed(() =>
    this.mergedIdrefs(
      this.hostAriaDescribedby(),
      this.inheritedFormField()?.descriptions() ?? [],
    ),
  );

  constructor() {
    this.syncHostAriaAttributes();
    const hostElement = this.host.nativeElement;
    const focusThumb = () => this.sliderState.focusThumb('program');
    hostElement.addEventListener('focus', focusThumb);
    this.destroyRef.onDestroy(() => hostElement.removeEventListener('focus', focusThumb));

    const MutationObserverCtor = hostElement.ownerDocument.defaultView?.MutationObserver;
    if (MutationObserverCtor) {
      const observer = new MutationObserverCtor(() => this.syncHostAriaAttributes());
      observer.observe(hostElement, {
        attributes: true,
        attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby'],
      });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    this.destroyRef.onDestroy(() => this.removeActiveDragListeners?.());
    effect(() => {
      const thumb = this.thumbRef()?.nativeElement;
      if (!thumb) return;

      this.setNullableAttribute(thumb, 'aria-label', this.thumbAriaLabel());
      this.setNullableAttribute(thumb, 'aria-labelledby', this.thumbAriaLabelledby());
      this.setNullableAttribute(thumb, 'aria-describedby', this.thumbAriaDescribedby());
      this.setNullableAttribute(thumb, 'aria-disabled', this.disabled() ? 'true' : null);
    });
    effect((onCleanup) => {
      const thumb = this.thumbRef()?.nativeElement;
      if (!thumb) return;

      const onKeydown = (event: KeyboardEvent) => {
        if (!this.disabled()) return;

        event.preventDefault();
        event.stopImmediatePropagation();
      };

      thumb.addEventListener('keydown', onKeydown, { capture: true });
      onCleanup(() => thumb.removeEventListener('keydown', onKeydown, { capture: true }));
    });
  }

  /**
   * ng-primitives' track only sets the value on click; it doesn't initiate
   * a drag. Re-dispatch the pointerdown on the thumb so the user can
   * click-and-drag from anywhere on the track in one fluid motion.
   */
  protected continueAsDrag(e: PointerEvent) {
    if (!this.canContinueTrackDrag(e)) return;

    const thumb = this.thumbRef();
    if (!thumb) return;
    const ownerWindow = this.host.nativeElement.ownerDocument.defaultView;
    const { PointerEvent: PointerEventCtor } = ownerWindow ?? {};

    if (typeof PointerEventCtor !== 'function') return;

    e.preventDefault();
    thumb.nativeElement.dispatchEvent(
      new PointerEventCtor('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        buttons: e.buttons,
        isPrimary: e.isPrimary,
      }),
    );
  }

  /** Starts tracking an active drag from a track pointerdown, clearing on pointerup/cancel. */
  protected markActiveDrag(e: PointerEvent) {
    if (!this.canContinueTrackDrag(e)) return;

    const ownerWindow = this.host.nativeElement.ownerDocument.defaultView;
    if (!ownerWindow) return;

    this.activeDrag.set(true);
    this.markControlTouched();
    this.removeActiveDragListeners?.();

    const clear = () => {
      this.activeDrag.set(false);
      this.removeActiveDragListeners?.();
      this.removeActiveDragListeners = null;
    };

    ownerWindow.addEventListener('pointerup', clear, { once: true });
    ownerWindow.addEventListener('pointercancel', clear, { once: true });
    this.removeActiveDragListeners = () => {
      ownerWindow.removeEventListener('pointerup', clear);
      ownerWindow.removeEventListener('pointercancel', clear);
    };
  }

  private canContinueTrackDrag(event: PointerEvent): boolean {
    if (event.button !== 0) return false;
    if (this.disabled()) return false;

    const thumb = this.thumbRef();
    if (!thumb) return false;
    if (!thumb.nativeElement.isConnected) return false;

    return true;
  }

  /** Emits the `touch` output that marks the slider as touched for Angular forms. */
  protected markControlTouched(): void {
    this.touch.emit();
  }

  private coerceValue(value: number): number {
    const numeric = Number(value);
    const min = this.effectiveMin();
    const max = this.effectiveMax();
    const step = this.step();
    if (!Number.isFinite(numeric)) return min;
    const clamped = Math.min(max, Math.max(min, numeric));
    if (!Number.isFinite(step) || step <= 0) return clamped;
    const stepped = Math.round((clamped - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  }

  private mergedIdrefs(explicit: string | null, inherited: readonly string[]): string | null {
    const ids = Array.from(new Set([...hellUniqueIdRefs(explicit), ...inherited]));
    return ids.length ? ids.join(' ') : null;
  }

  private syncHostAriaAttributes(): void {
    const host = this.host.nativeElement;
    this.hostAriaLabel.set(host.getAttribute('aria-label'));
    this.hostAriaLabelledby.set(host.getAttribute('aria-labelledby'));
    this.hostAriaDescribedby.set(host.getAttribute('aria-describedby'));
  }

  private setNullableAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value) {
      element.setAttribute(name, value);
    } else {
      element.removeAttribute(name);
    }
  }
}
