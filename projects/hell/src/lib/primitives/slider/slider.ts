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
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { hellUniqueIdRefs } from '../../core/idrefs';
import { HellSize, type HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

let nextSliderId = 0;

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
    '[class.hell-slider]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-thumb]': 'thumb()',
    '[attr.data-grow]': 'grow() ? "true" : null',
    '[attr.data-active-drag]': 'activeDrag() ? "true" : null',
    '[attr.tabindex]': '-1',
    '(pointerdown)': 'markActiveDrag($event)',
    '(focusout)': 'markControlTouched()',
  },
  template: `
    <div ngpSliderTrack class="hell-slider-track" (pointerdown)="continueAsDrag($event)">
      <div ngpSliderRange class="hell-slider-range"></div>
    </div>
    <div
      #thumb
      ngpSliderThumb
      class="hell-slider-thumb"
    ></div>
  `,
})
export class HellSlider extends HellStyleable implements ControlValueAccessor {
  readonly value = input(0, { transform: numberAttribute });
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
  readonly size = input<HellSize>('md');
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

  readonly valueChange = output<number>();

  protected readonly activeDrag = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly thumbRef = viewChild<ElementRef<HTMLElement>>('thumb');
  private readonly controlMode = signal(false);
  private readonly controlValue = signal(0);
  private readonly controlDisabled = signal(false);
  private readonly cva = new HellControlValueAccessorBridge<number>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly hostAriaLabel = signal<string | null>(null);
  private readonly hostAriaLabelledby = signal<string | null>(null);
  private readonly hostAriaDescribedby = signal<string | null>(null);
  private readonly sliderId = signal(
    this.host.nativeElement.getAttribute('id') ?? `hell-slider-${nextSliderId++}`,
  );
  private removeActiveDragListeners: (() => void) | null = null;

  private readonly effectiveValue = computed(() =>
    this.coerceValue(this.controlMode() ? this.controlValue() : this.value()),
  );
  private readonly effectiveDisabled = computed(() => this.disabled() || this.controlDisabled());

  protected readonly sliderState = ngpSlider({
    id: this.sliderId,
    value: this.effectiveValue,
    min: this.min,
    max: this.max,
    step: this.step,
    orientation: this.orientation,
    disabled: this.effectiveDisabled,
    onValueChange: (value) => {
      if (this.controlMode()) this.controlValue.set(value);
      this.valueChange.emit(value);
      this.cva.emitValue(value);
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
    super();
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

  writeValue(value: number): void {
    this.controlMode.set(true);
    this.controlValue.set(value);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
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

  protected markControlTouched(): void {
    this.cva.markTouched();
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
