import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { injectFormFieldState } from 'ng-primitives/form-field';
import {
  NgpSliderRange,
  NgpSliderThumb,
  NgpSliderTrack,
  ngpSlider,
  provideSliderState,
} from 'ng-primitives/slider';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { hellUniqueIdRefs } from '@hell-ui/angular/internal/core';
import { hellPartStyler, type HellOrientation, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

let nextSliderId = 0;

/** Public parts of the HellSlider module, styleable through its Part Style Map. */
export type HellSliderPart = 'root' | 'track' | 'range' | 'thumb';
/** Part Style Map accepted by the HellSlider `ui` input. */
export type HellSliderUi = HellUi<HellSliderPart>;

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
 * arrow keys (Home/End jump to min/max). Emits via `(valueChange)`.
 *
 * Use `<hell-slider [value]="vol()" (valueChange)="vol.set($event)" />`.
 */
@Component({
  selector: 'hell-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgpSliderTrack, NgpSliderRange, NgpSliderThumb],
  providers: [
    provideSliderState(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellSlider),
      multi: true,
    },
  ],
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
export class HellSlider implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSliderPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSliderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SLIDER_RECIPE,
  });

  /** Current slider value. Defaults to `0`. */
  readonly value = input(0, { transform: numberAttribute });
  /** Minimum allowed value. Defaults to `0`. */
  readonly min = input(0, { transform: numberAttribute });
  /** Maximum allowed value. Defaults to `100`. */
  readonly max = input(100, { transform: numberAttribute });
  /** Increment size for keyboard and drag stepping. Defaults to `1`. */
  readonly step = input(1, { transform: numberAttribute });
  /** Whether the slider is disabled. Defaults to `false`. */
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

  /** Emits the new value whenever the user changes it. */
  readonly valueChange = output<number>();

  /** Whether the thumb is currently being dragged. */
  protected readonly activeDrag = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');
  private readonly controlledValue = new HellControlledValueState<number>({
    externalValue: this.value,
    externalDisabled: this.disabled,
    initialValue: 0,
  });
  private readonly valueAccessor = new HellControlValueAccessorBridge<number>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly hostAriaLabel = signal<string | null>(null);
  private readonly hostAriaLabelledby = signal<string | null>(null);
  private readonly hostAriaDescribedby = signal<string | null>(null);
  private readonly sliderId = signal(
    this.host.nativeElement.getAttribute('id') ?? `hell-slider-${nextSliderId++}`,
  );
  private removeActiveDragListeners: (() => void) | null = null;

  private readonly effectiveValue = computed(() => this.coerceValue(this.controlledValue.value()));
  private readonly effectiveDisabled = this.controlledValue.disabled;

  /** Headless slider state and behavior from `ngpSlider`. */
  protected readonly sliderState = ngpSlider({
    id: this.sliderId,
    value: this.effectiveValue,
    min: this.min,
    max: this.max,
    step: this.step,
    orientation: this.orientation,
    disabled: this.effectiveDisabled,
    onValueChange: (value) => {
      this.controlledValue.acceptUserValue(value);
      this.valueChange.emit(value);
      this.valueAccessor.emitValue(value);
    },
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
      this.setNullableAttribute(thumb, 'aria-disabled', this.effectiveDisabled() ? 'true' : null);
    });
    effect((onCleanup) => {
      const thumb = this.thumbRef()?.nativeElement;
      if (!thumb) return;

      const onKeydown = (event: KeyboardEvent) => {
        if (!this.effectiveDisabled()) return;

        event.preventDefault();
        event.stopImmediatePropagation();
      };

      thumb.addEventListener('keydown', onKeydown, { capture: true });
      onCleanup(() => thumb.removeEventListener('keydown', onKeydown, { capture: true }));
    });
  }

  /** Writes a form-driven value onto the slider. */
  writeValue(value: number): void {
    this.controlledValue.writeValue(value);
  }

  /** Registers the callback Angular Forms uses to be notified of value changes. */
  registerOnChange(fn: (value: number) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  /** Registers the callback Angular Forms uses to be notified when the control is touched. */
  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  /** Applies a form-driven disabled state to the slider. */
  setDisabledState(isDisabled: boolean): void {
    this.controlledValue.setDisabledState(isDisabled);
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
    if (this.effectiveDisabled()) return false;

    const thumb = this.thumbRef();
    if (!thumb) return false;
    if (!thumb.nativeElement.isConnected) return false;

    return true;
  }

  /** Marks the control as touched for Angular Forms. */
  protected markControlTouched(): void {
    this.valueAccessor.markTouched();
  }

  private coerceValue(value: number): number {
    const numeric = Number(value);
    const min = this.min();
    const max = this.max();
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
