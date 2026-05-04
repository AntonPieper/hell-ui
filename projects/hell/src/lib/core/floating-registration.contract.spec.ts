import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_FLOATING_SCOPE, HellFloatingElement, type HellFloatingScope } from './floating-scope';

@Injectable()
class FakeFloatingScope implements HellFloatingScope {
  readonly registered: HTMLElement[] = [];
  readonly unregistered: HTMLElement[] = [];

  registerFloatingElement(element: HTMLElement): void {
    this.registered.push(element);
  }

  unregisterFloatingElement(element: HTMLElement): void {
    this.unregistered.push(element);
  }

  containsFloatingTarget(target: EventTarget | Node | null): boolean {
    return target instanceof Node && this.registered.some((element) => element.contains(target));
  }
}

@Component({
  imports: [HellFloatingElement],
  providers: [FakeFloatingScope, { provide: HELL_FLOATING_SCOPE, useExisting: FakeFloatingScope }],
  template: `<div id="custom" hellFloatingElement><button id="child">Custom</button></div>`,
})
class FloatingRegistrationHost {}

describe('Hell Floating registration contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingRegistrationHost],
    }).compileComponents();
  });

  it('registers custom floating surfaces with the nearest Floating Scope', () => {
    const fixture = TestBed.createComponent(FloatingRegistrationHost);
    fixture.detectChanges();

    const scope = fixture.debugElement.injector.get(FakeFloatingScope);
    expect(scope.registered.map((element) => element.id)).toEqual(['custom']);
    expect(
      scope.containsFloatingTarget(
        fixture.nativeElement.querySelector('#child') as HTMLButtonElement,
      ),
    ).toBe(true);

    fixture.destroy();

    expect(scope.unregistered.map((element) => element.id)).toEqual(['custom']);
  });
});
