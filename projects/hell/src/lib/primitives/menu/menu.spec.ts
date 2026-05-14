import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpMenuTrigger } from 'ng-primitives/menu';

import { HELL_MENU_DIRECTIVES } from './menu';

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu>
        <button hellMenuItem type="button" [disabled]="disabled()">Button</button>
        <a hellMenuItem href="#anchor" [disabled]="disabled()">Anchor</a>
        <div hellMenuItem [disabled]="disabled()">Div</div>
      </div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="menu">Open</button>
  `,
})
class MenuHost {
  readonly disabled = signal(true);
  readonly trigger = viewChild.required(NgpMenuTrigger);
}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu><button hellMenuItem type="button">Item</button></div>
    </ng-template>
    <a id="enabled-anchor" href="#menu" [hellMenuTrigger]="menu">Anchor</a>
  `,
})
class EnabledMenuAnchorTriggerHost {}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu><button hellMenuItem type="button">Item</button></div>
    </ng-template>
    <button id="disabled-button" type="button" [hellMenuTrigger]="menu" disabled>Button</button>
    <a id="disabled-anchor" href="#menu" [hellMenuTrigger]="menu" disabled>Anchor</a>
  `,
})
class DisabledMenuTriggerHost {}

const nativeGetAnimations = HTMLElement.prototype.getAnimations;

beforeAll(() => {
  if (!nativeGetAnimations) {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  }
});

afterAll(() => {
  if (!nativeGetAnimations) delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
});

describe('HellMenuItem', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuHost, EnabledMenuAnchorTriggerHost, DisabledMenuTriggerHost],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reflects disabled trigger semantics on buttons and anchors', async () => {
    const fixture = TestBed.createComponent(DisabledMenuTriggerHost);
    await settle(fixture);

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#disabled-button');
    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#disabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
  });

  it('opens from enabled anchor trigger and prevents default navigation', async () => {
    const fixture = TestBed.createComponent(EnabledMenuAnchorTriggerHost);
    await settle(fixture);

    const trigger = query<HTMLAnchorElement>(fixture.nativeElement, '#enabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(trigger.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle(fixture);

    const menuItem = query<HTMLButtonElement>(document.body, 'button[hellMenuItem]');
    expect(menuItem).toBeTruthy();
    expect(menuItem.textContent).toBe('Item');
  });

  it('guards disabled non-native menu items', async () => {
    const fixture = TestBed.createComponent(MenuHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    await settle(fixture);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle(fixture);

    const button = query<HTMLButtonElement>(document.body, 'button[hellMenuItem]');
    const anchor = query<HTMLAnchorElement>(document.body, 'a[hellMenuItem]');
    const div = query<HTMLDivElement>(document.body, 'div[hellMenuItem]');
    const anchorClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const divKey = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(div.getAttribute('aria-disabled')).toBe('true');

    expect(anchor.dispatchEvent(anchorClick)).toBe(false);
    expect(anchorClick.defaultPrevented).toBe(true);
    expect(div.dispatchEvent(divKey)).toBe(false);
    expect(divKey.defaultPrevented).toBe(true);
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
