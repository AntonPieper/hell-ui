import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';

import { HellFlyout, HellFlyoutTrigger } from './flyout';

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <button hellFlyoutTrigger #trigger="hellFlyoutTrigger" type="button">
      Toggle
    </button>

    @if (trigger.open()) {
      <div [hellFlyout]="trigger">Panel</div>
    }
  `,
})
class FlyoutHost {}

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <a id="enabled-anchor" #trigger="hellFlyoutTrigger" href="#flyout" hellFlyoutTrigger>
      Enabled
    </a>

    @if (trigger.open()) {
      <div [hellFlyout]="trigger">Panel</div>
    }
  `,
})
class EnabledFlyoutAnchorTriggerHost {}

@Component({
  imports: [HellFlyoutTrigger],
  template: `
    <button id="disabled-button" hellFlyoutTrigger type="button" disabled>Button</button>
    <a id="disabled-anchor" hellFlyoutTrigger href="#flyout" disabled>Anchor</a>
  `,
})
class DisabledFlyoutTriggerHost {}

describe('HellFlyout outside interaction', () => {
  let focusChecker: { isFocusable: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    focusChecker = { isFocusable: vi.fn(() => true) };

    await TestBed.configureTestingModule({
      imports: [FlyoutHost, EnabledFlyoutAnchorTriggerHost, DisabledFlyoutTriggerHost],
      providers: [{ provide: InteractivityChecker, useValue: focusChecker }],
    }).compileComponents();
  });

  it('reflects disabled trigger semantics on buttons and anchors', async () => {
    const fixture = TestBed.createComponent(DisabledFlyoutTriggerHost);
    await settle(fixture);

    const button = fixture.nativeElement.querySelector('#disabled-button') as HTMLButtonElement;
    const anchor = fixture.nativeElement.querySelector('#disabled-anchor') as HTMLAnchorElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
  });

  it('prevents enabled anchor default navigation while toggling', async () => {
    const fixture = TestBed.createComponent(EnabledFlyoutAnchorTriggerHost);
    await settle(fixture);

    const trigger = query<HTMLAnchorElement>(fixture.nativeElement, '#enabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(trigger.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    const secondClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(trigger.dispatchEvent(secondClick)).toBe(false);
    expect(secondClick.defaultPrevented).toBe(true);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Panel');
  });

  it('toggles on click and closes on second click', async () => {
    const fixture = TestBed.createComponent(FlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    trigger.click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Panel');
  });

  it('keeps flyout open on outside touch pointerdown but closes on outside click', async () => {
    const fixture = TestBed.createComponent(FlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Panel');
  });

  it('passes CDK interactivity checks into Escape focus restoration', async () => {
    const fixture = TestBed.createComponent(FlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Panel');

    focusChecker.isFocusable.mockReturnValue(false);
    const focusSpy = vi.spyOn(trigger, 'focus');

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Panel');
    expect(focusChecker.isFocusable).toHaveBeenCalledWith(trigger);
    expect(focusSpy).not.toHaveBeenCalled();

    focusSpy.mockRestore();
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
