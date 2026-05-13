import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NgpSliderRange,
  NgpSliderThumb,
  NgpSliderTrack,
  ngpSlider,
  provideSliderState,
} from 'ng-primitives/slider';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellSize, type HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

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
    '(pointerdown)': 'markActiveDrag($event)',
    '(focusout)': 'markControlTouched()',
  },
  template: `
    <div ngpSliderTrack class="hell-slider-track" (pointerdown)="continueAsDrag($event)">
      <div ngpSliderRange class="hell-slider-range"></div>
    </div>
    <div #thumb ngpSliderThumb class="hell-slider-thumb" [attr.aria-label]="ariaLabel()"></div>
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
  private removeActiveDragListeners: (() => void) | null = null;

  private readonly effectiveValue = computed(() =>
    this.coerceValue(this.controlMode() ? this.controlValue() : this.value()),
  );
  private readonly effectiveDisabled = computed(() => this.disabled() || this.controlDisabled());

  protected readonly sliderState = ngpSlider({
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

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.removeActiveDragListeners?.());
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
}
