import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellSlider } from './slider';

@Component({
  imports: [HellSlider],
  template: `
    <hell-slider
      aria-label="Volume"
      thumb="hover"
      grow
      [value]="value()"
      [disabled]="disabled()"
      (valueChange)="valueEvents.push($event)"
    />
  `,
})
class SliderHost {
  readonly value = signal(35);
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

describe('HellSlider', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderHost, SliderFormHost],
    }).compileComponents();
  });

  it('redispatches track pointerdown to the thumb and clears active drag on pointerup', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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
    expect(thumbPointerDown).not.toHaveBeenCalled();
    expect(slider.hasAttribute('data-active-drag')).toBe(false);
  });

  it('is a no-op when the thumb is missing or disconnected', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const track = slider.querySelector('.hell-slider-track') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;
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

  it('exposes thumb and grow state without changing the value contract', () => {
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();

    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;

    expect(slider.getAttribute('data-thumb')).toBe('hover');
    expect(slider.getAttribute('data-grow')).toBe('true');
    expect(thumb.getAttribute('aria-label')).toBe('Volume');
    expect(thumb.getAttribute('aria-valuenow')).toBe('35');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SliderFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const slider = fixture.nativeElement.querySelector('hell-slider') as HTMLElement;
    const thumb = slider.querySelector('.hell-slider-thumb') as HTMLElement;

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
