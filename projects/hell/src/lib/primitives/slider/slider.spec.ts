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
      (valueChange)="valueEvents.push($event)"
    />
  `,
})
class SliderHost {
  readonly value = signal(35);
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

    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 }));
    fixture.detectChanges();

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
