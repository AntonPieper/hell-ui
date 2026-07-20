import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { type HellSize } from '@hell-ui/angular/core';
import { HellSlider, type HellSliderUi } from './slider';

@Component({
  imports: [HellSlider],
  template: `
    <hell-slider
      aria-label="Volume"
      thumb="hover"
      grow
      [value]="value()"
      [size]="size()"
      [disabled]="disabled()"
      (valueChange)="valueEvents.push($event)"
    />
  `,
})
class SliderHost {
  readonly value = signal(35);
  readonly size = signal<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly disabled = signal(false);
  readonly valueEvents: number[] = [];
}

@Component({
  imports: [ReactiveFormsModule, HellSlider],
  template: `
    <hell-slider aria-label="Volume" [formControl]="control" (valueChange)="valueEvents.push($event)" />
  `,
})
class SliderFormHost {
  readonly control = new FormControl(20, { nonNullable: true });
  readonly valueEvents: number[] = [];
}

@Component({
  imports: [...HELL_FIELD_IMPORTS, HellSlider],
  template: `
    <span id="external-slider-label">External volume</span>
    <p id="external-slider-help">Applies to the current output device.</p>
    <div hellField>
      <label hellFieldLabel id="field-slider-label" for="field-slider">Volume</label>
      <p hellFieldDescription id="field-slider-help">Use arrows for fine changes.</p>
      <hell-slider
        id="field-slider"
        [value]="35"
        aria-label="Fallback volume"
        aria-labelledby="external-slider-label"
        aria-describedby="external-slider-help"
      />
    </div>
  `,
})
class SliderFieldHost {}

@Component({
  imports: [HellSlider],
  template: `
    <hell-slider
      id="slider-string"
      aria-label="String slider"
      ui="h-hell-9 cursor-crosshair"
      [value]="10"
    />
    <hell-slider id="slider-map" aria-label="Map slider" [ui]="ui" [value]="25" />
    <hell-slider id="slider-default" aria-label="Plain slider" [value]="5" />
  `,
})
class SliderUiHost {
  readonly ui: HellSliderUi = {
    root: 'h-hell-9 cursor-crosshair',
    track: 'self-center bg-transparent',
    range: 'h-hell-2 bg-hell-danger',
    thumb: 'size-hell-6 border-hell-danger bg-hell-danger-soft',
  };
}

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const sortClasses = (value: string): string[] => value.split(/\s+/).filter(Boolean).sort();
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

describe('HellSlider', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderHost, SliderFormHost, SliderFieldHost, SliderUiHost],
    }).compileComponents();
  });

  it('merges ui string shorthand and object maps across public parts', () => {
    const fixture = TestBed.createComponent(SliderUiHost);
    fixture.detectChanges();

    const stringSlider = fixture.nativeElement.querySelector('#slider-string') as HTMLElement;
    const stringTrack = stringSlider.querySelector('[data-slot="track"]') as HTMLElement;
    const mapSlider = fixture.nativeElement.querySelector('#slider-map') as HTMLElement;
    const mapTrack = mapSlider.querySelector('[data-slot="track"]') as HTMLElement;
    const mapRange = mapSlider.querySelector('[data-slot="range"]') as HTMLElement;
    const mapThumb = mapSlider.querySelector('[data-slot="thumb"]') as HTMLElement;

    const defaultSlider = fixture.nativeElement.querySelector('#slider-default') as HTMLElement;
    const defaults = {
      root: defaultSlider.className,
      track: defaultSlider.querySelector('[data-slot="track"]')?.getAttribute('class') ?? '',
      range: defaultSlider.querySelector('[data-slot="range"]')?.getAttribute('class') ?? '',
      thumb: defaultSlider.querySelector('[data-slot="thumb"]')?.getAttribute('class') ?? '',
    };

    expect(stringSlider.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.root, stringSlider.className, 'h-hell-9 cursor-crosshair');
    // String shorthand routes to the root part only; the track stays default.
    expectUiRouting(defaults.track, stringTrack.className, '');

    expectUiRouting(defaults.root, mapSlider.className, 'h-hell-9 cursor-crosshair');
    expectUiRouting(defaults.track, mapTrack.className, 'self-center bg-transparent');
    expectUiRouting(defaults.range, mapRange.className, 'h-hell-2 bg-hell-danger');
    expectUiRouting(defaults.thumb, mapThumb.className, 'size-hell-6 border-hell-danger bg-hell-danger-soft');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(SliderUiHost);
      fixture.detectChanges();
      const slider = fixture.nativeElement.querySelector('#slider-default') as HTMLElement;
      const sortClasses = (value: string): string[] =>
        value.split(/\s+/).filter(Boolean).sort();
      const partClasses = (slot: string): string[] =>
        sortClasses(slider.querySelector(`[data-slot="${slot}"]`)?.getAttribute('class') ?? '');

      expect({
        root: sortClasses(slider.className),
        track: partClasses('track'),
        range: partClasses('range'),
        thumb: partClasses('thumb'),
      }).toMatchSnapshot('slider');
    });
  });

  it('redispatches track pointerdown to the thumb and clears active drag on pointerup', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const thumbPointerDown = vi.fn();
    thumb.addEventListener('pointerdown', thumbPointerDown);

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 48,
      clientY: 4,
    });
    track.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(pointerDown.defaultPrevented).toBe(true);
    expect(thumbPointerDown).toHaveBeenCalledOnce();
    expect(slider.getAttribute('data-active-drag')).toBe('true');

    slider.ownerDocument.defaultView?.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 }));
    fixture.detectChanges();

    expect(slider.hasAttribute('data-active-drag')).toBe(false);
  });

  it('uses the slider owner window PointerEvent constructor for redispatch', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const ownerWindow = slider.ownerDocument.defaultView as Window & typeof globalThis;
    const OriginalOwnerPointerEvent = ownerWindow.PointerEvent;
    const constructed = vi.fn();
    class OwnerPointerEvent extends OriginalOwnerPointerEvent {
      constructor(type: string, init?: PointerEventInit) {
        constructed(type, init);
        super(type, init);
      }
    }
    Object.defineProperty(ownerWindow, 'PointerEvent', {
      configurable: true,
      value: OwnerPointerEvent,
    });

    try {
      const pointerDown = new OriginalOwnerPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pointerId: 8,
        pointerType: 'mouse',
        clientX: 52,
        clientY: 6,
      });
      const thumbPointerDown = vi.fn();
      thumb.addEventListener('pointerdown', thumbPointerDown);

      track.dispatchEvent(pointerDown);
      fixture.detectChanges();

      expect(constructed).toHaveBeenCalledWith(
        'pointerdown',
        expect.objectContaining({ pointerId: 8, clientX: 52, clientY: 6 }),
      );
      expect(thumbPointerDown).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(ownerWindow, 'PointerEvent', {
        configurable: true,
        value: OriginalOwnerPointerEvent,
      });
    }
  });

  it('does not redispatch when the owner window lacks PointerEvent support', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const ownerWindow = slider.ownerDocument.defaultView as Window & typeof globalThis;
    const OriginalOwnerPointerEvent = ownerWindow.PointerEvent;
    const thumbPointerDown = vi.fn();
    thumb.addEventListener('pointerdown', thumbPointerDown);

    Object.defineProperty(ownerWindow, 'PointerEvent', {
      configurable: true,
      value: undefined,
    });

    try {
      const pointerDown = new OriginalOwnerPointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pointerId: 10,
        pointerType: 'mouse',
        clientX: 52,
        clientY: 6,
      });

      track.dispatchEvent(pointerDown);
      fixture.detectChanges();

      expect(thumbPointerDown).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(ownerWindow, 'PointerEvent', {
        configurable: true,
        value: OriginalOwnerPointerEvent,
      });
    }
  });

  it('does not redispatch right-click pointerdowns to the thumb', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const thumbPointerDown = vi.fn();
    const thumbDispatchSpy = vi.spyOn(thumb, 'dispatchEvent');
    thumb.addEventListener('pointerdown', thumbPointerDown);

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 2,
      buttons: 2,
      pointerId: 9,
      pointerType: 'mouse',
      clientX: 48,
      clientY: 4,
    });
    track.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(thumbPointerDown).not.toHaveBeenCalled();
    expect(thumbDispatchSpy).not.toHaveBeenCalled();
    expect(slider.hasAttribute('data-active-drag')).toBe(false);
  });

  it('does not continue drag when disabled', () => {
    const fixture = TestBed.createComponent(SliderHost);
    const host = fixture.componentInstance;
    host.disabled.set(true);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const thumbPointerDown = vi.fn();
    thumb.addEventListener('pointerdown', thumbPointerDown);

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      pointerId: 11,
      pointerType: 'mouse',
      clientX: 48,
      clientY: 4,
    });
    track.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(thumb.hasAttribute('data-disabled')).toBe(true);
    expect(thumb.getAttribute('aria-disabled')).toBe('true');

    const keydown = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    thumb.dispatchEvent(keydown);
    fixture.detectChanges();

    expect(keydown.defaultPrevented).toBe(true);
    expect(host.value()).toBe(35);
    expect(host.valueEvents).toEqual([]);
    expect(thumb.getAttribute('aria-valuenow')).toBe('35');
    expect(thumbPointerDown).not.toHaveBeenCalled();
    expect(slider.hasAttribute('data-active-drag')).toBe(false);
  });

  it('is a no-op when the thumb is missing or disconnected', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('[data-slot="track"]') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;
    const thumbDispatchSpy = vi.spyOn(thumb, 'dispatchEvent');
    thumb.remove();

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      pointerId: 13,
      pointerType: 'mouse',
      clientX: 48,
      clientY: 4,
    });
    track.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(thumbDispatchSpy).not.toHaveBeenCalled();
    expect(slider.hasAttribute('data-active-drag')).toBe(false);
  });

  it('reflects the supported size scale on data-size for recipe and CSS hooks', () => {
    const fixture = TestBed.createComponent(SliderHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    expect(slider.getAttribute('data-size')).toBe('md');

    for (const size of ['sm', 'lg'] as const) {
      host.size.set(size);
      fixture.detectChanges();
      expect(slider.getAttribute('data-size')).toBe(size);
    }
  });

  it('exposes thumb and grow state without changing the value contract', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;

    expect(slider.getAttribute('data-thumb')).toBe('hover');
    expect(slider.getAttribute('data-grow')).toBe('true');
    expect(thumb.getAttribute('aria-label')).toBe('Volume');
    expect(thumb.getAttribute('aria-valuenow')).toBe('35');
  });

  it('forwards explicit and inherited label and description references to the thumb', () => {
    const fixture = TestBed.createComponent(SliderFieldHost);
    fixture.detectChanges();

    const thumb = fixture.nativeElement.querySelector('[data-slot="thumb"]') as HTMLElement;
    const label = fixture.nativeElement.querySelector('label[hellFieldLabel]') as HTMLLabelElement;
    const description = fixture.nativeElement.querySelector(
      '[hellFieldDescription]',
    ) as HTMLElement;

    expect(thumb.getAttribute('aria-label')).toBe('Fallback volume');
    expect(thumb.getAttribute('aria-labelledby')).toBe(`external-slider-label ${label.id}`);
    expect(thumb.getAttribute('aria-describedby')).toBe(
      `external-slider-help ${description.id}`,
    );
    expect(label.getAttribute('for')).toBe('field-slider');

    label.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(thumb);
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SliderFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const thumb = slider.querySelector('[data-slot="thumb"]') as HTMLElement;

    expect(thumb.getAttribute('aria-valuenow')).toBe('20');

    host.control.setValue(130);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(thumb.getAttribute('aria-valuenow')).toBe('100');
    expect(host.valueEvents).toEqual([]);

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    slider.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe(99);
    expect(host.control.touched).toBe(true);
    expect(host.valueEvents).toEqual([99]);

    host.control.disable();
    fixture.detectChanges();

    expect(thumb.hasAttribute('data-disabled')).toBe(true);
  });
});
