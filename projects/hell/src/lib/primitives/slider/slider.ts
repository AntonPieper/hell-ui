import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgpSlider, NgpSliderRange, NgpSliderThumb, NgpSliderTrack } from 'ng-primitives/slider';
import { HellSize } from '../../core/types';
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
  hostDirectives: [
    {
      directive: NgpSlider,
      inputs: [
        'ngpSliderValue:value',
        'ngpSliderMin:min',
        'ngpSliderMax:max',
        'ngpSliderStep:step',
        'ngpSliderDisabled:disabled',
        'ngpSliderOrientation:orientation',
      ],
      outputs: ['ngpSliderValueChange:valueChange'],
    },
  ],
  host: {
    '[class.hell-slider]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-thumb]': 'thumb()',
    '[attr.data-grow]': 'grow() ? "true" : null',
    '[attr.data-active-drag]': 'activeDrag() ? "true" : null',
    '(pointerdown)': 'markActiveDrag($event)',
  },
  template: `
    <div ngpSliderTrack class="hell-slider-track" (pointerdown)="continueAsDrag($event)">
      <div ngpSliderRange class="hell-slider-range"></div>
    </div>
    <div #thumb ngpSliderThumb class="hell-slider-thumb" [attr.aria-label]="ariaLabel()"></div>
  `,
})
export class HellSlider extends HellStyleable {
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

  protected readonly activeDrag = signal(false);

  private readonly thumbRef = viewChild.required<ElementRef<HTMLElement>>('thumb');
  private readonly destroyRef = inject(DestroyRef);
  private removeActiveDragListeners: (() => void) | null = null;

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.removeActiveDragListeners?.());
  }

  /**
   * ng-primitives' track only sets the value on click; it doesn't initiate
   * a drag. Re-dispatch the pointerdown on the thumb so the user can
   * click-and-drag from anywhere on the track in one fluid motion.
   */
  protected continueAsDrag(e: PointerEvent) {
    e.preventDefault();
    this.thumbRef().nativeElement.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        buttons: e.buttons,
      }),
    );
  }

  protected markActiveDrag(e: PointerEvent) {
    if (e.button !== 0) return;
    this.activeDrag.set(true);
    this.removeActiveDragListeners?.();

    const targetWindow = this.thumbRef().nativeElement.ownerDocument.defaultView ?? window;
    const clear = () => {
      this.activeDrag.set(false);
      this.removeActiveDragListeners?.();
      this.removeActiveDragListeners = null;
    };

    targetWindow.addEventListener('pointerup', clear, { once: true });
    targetWindow.addEventListener('pointercancel', clear, { once: true });
    this.removeActiveDragListeners = () => {
      targetWindow.removeEventListener('pointerup', clear);
      targetWindow.removeEventListener('pointercancel', clear);
    };
  }
}
