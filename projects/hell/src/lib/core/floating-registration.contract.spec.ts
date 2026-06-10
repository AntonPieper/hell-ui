import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { containsNode } from './dom';
import { HELL_FLOATING_SCOPE, type HellFloatingScope } from './floating-scope';
import { HellFloatingElement } from './floating-element';
import { HellFlyout, HellFlyoutTrigger } from '../primitives/flyout/flyout';

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

@Component({
  imports: [
    HellFlyout,
    HellFlyoutTrigger,
  ],
  providers: [FakeFloatingScope, { provide: HELL_FLOATING_SCOPE, useExisting: FakeFloatingScope }],
  template: `
    <button id="flyout-trigger" hellFlyoutTrigger #flyoutTrigger="hellFlyoutTrigger" type="button">
      Toggle
    </button>
    <div id="flyout" [hellFlyout]="flyoutTrigger">
      <button id="flyout-child" type="button">Flyout</button>
    </div>
  `,
})
class BuiltInFloatingRegistrationHost {}

describe('Hell Floating registration contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingRegistrationHost, BuiltInFloatingRegistrationHost],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
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

  it('registers flyout interaction surfaces with the nearest Floating Scope', async () => {
    const fixture = TestBed.createComponent(BuiltInFloatingRegistrationHost);
    await settle(fixture);

    const scope = fixture.debugElement.injector.get(FakeFloatingScope);
    const flyoutChild = query(fixture.nativeElement, '#flyout-child');
    const registeredFlyout = scope.registered.find((element) => element.contains(flyoutChild));

    expect(registeredFlyout).toBeTruthy();
    expect(scope.containsFloatingTarget(flyoutChild)).toBe(true);

    fixture.destroy();

    expect(scope.unregistered).toContain(registeredFlyout);
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function query(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
