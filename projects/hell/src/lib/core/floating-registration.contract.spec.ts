import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { containsNode } from './dom';
import { HELL_FLOATING_SCOPE, type HellFloatingScope } from './floating-scope';
import { HellFloatingElement } from './floating-element';

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
    return this.registered.some((element) => containsNode(element, target));
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
    const [registered] = scope.registered;
    expect(scope.containsFloatingTarget(registered)).toBe(true);

    fixture.destroy();

    expect(scope.unregistered.map((element) => element.id)).toEqual(['custom']);
  });
});
