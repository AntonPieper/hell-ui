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

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <button id="label-trigger" hellFlyoutTrigger #labelTrigger="hellFlyoutTrigger" type="button">
      Toggle label
    </button>

    @if (labelTrigger.open()) {
      <div [hellFlyout]="labelTrigger" aria-label="Flyout details">Panel</div>
    }

    <button
      id="labelledby-trigger"
      hellFlyoutTrigger
      #labelledbyTrigger="hellFlyoutTrigger"
      type="button"
    >
      Toggle labelledby
    </button>

    @if (labelledbyTrigger.open()) {
      <div [hellFlyout]="labelledbyTrigger" aria-labelledby="flyout-title">
        <h2 id="flyout-title">Details</h2>
        Panel
      </div>
    }
  `,
})
class LabelledFlyoutHost {}

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <section #boundary id="flyout-boundary">
      <button hellFlyoutTrigger #trigger="hellFlyoutTrigger" type="button">
        Toggle
      </button>
      <button id="boundary-action" type="button">Boundary action</button>

      @if (trigger.open()) {
        <div [hellFlyout]="trigger" [boundary]="boundary">Panel</div>
      }
    </section>

    <button id="outside-action" type="button">Outside</button>
  `,
})
class BoundaryFlyoutHost {}

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <button hellFlyoutTrigger #trigger="hellFlyoutTrigger" type="button">
      Toggle
    </button>

    @if (trigger.open()) {
      <div
        [hellFlyout]="trigger"
        [closeOnOutsideInteraction]="false"
        [closeOnEscape]="false"
      >
        Panel
      </div>
    }
  `,
})
class NonDismissableFlyoutHost {}

describe('HellFlyout outside interaction', () => {
  let focusChecker: { isFocusable: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    focusChecker = { isFocusable: vi.fn(() => true) };

    await TestBed.configureTestingModule({
      imports: [
        FlyoutHost,
        EnabledFlyoutAnchorTriggerHost,
        DisabledFlyoutTriggerHost,
        LabelledFlyoutHost,
        BoundaryFlyoutHost,
        NonDismissableFlyoutHost,
      ],
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

  it('reflects dialog naming attributes on the panel', async () => {
    const fixture = TestBed.createComponent(LabelledFlyoutHost);
    await settle(fixture);

    const labelTrigger = query<HTMLButtonElement>(fixture.nativeElement, '#label-trigger');
    labelTrigger.click();
    await settle(fixture);

    const labelledPanel = query<HTMLElement>(fixture.nativeElement, '[role="dialog"]');
    expect(labelledPanel.getAttribute('role')).toBe('dialog');
    expect(labelledPanel.getAttribute('aria-modal')).toBe('false');
    expect(labelledPanel.getAttribute('aria-label')).toBe('Flyout details');
    expect(labelledPanel.getAttribute('aria-labelledby')).toBeNull();

    labelTrigger.click();
    await settle(fixture);

    const labelledbyTrigger = query<HTMLButtonElement>(fixture.nativeElement, '#labelledby-trigger');
    labelledbyTrigger.click();
    await settle(fixture);

    const referencedPanel = query<HTMLElement>(fixture.nativeElement, '[role="dialog"]');
    expect(referencedPanel.getAttribute('aria-label')).toBeNull();
    expect(referencedPanel.getAttribute('aria-labelledby')).toBe('flyout-title');
  });

  it('writes trigger-anchored floating geometry to CSS variables', async () => {
    const fixture = TestBed.createComponent(FlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    const panel = query<HTMLElement>(fixture.nativeElement, '[role="dialog"]');
    await waitFor(() => panel.style.getPropertyValue('--hell-flyout-x') !== '');

    expect(panel.getAttribute('data-placement')).toBe('bottom-start');
    expect(panel.style.getPropertyValue('--hell-flyout-x')).toMatch(/px$/);
    expect(panel.style.getPropertyValue('--hell-flyout-y')).toMatch(/px$/);
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

  it('treats the configured boundary as inside for click and focus dismissal', async () => {
    const fixture = TestBed.createComponent(BoundaryFlyoutHost);
    await settle(fixture);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '[hellFlyoutTrigger]');
    const boundaryAction = query<HTMLButtonElement>(fixture.nativeElement, '#boundary-action');
    const outsideAction = query<HTMLButtonElement>(fixture.nativeElement, '#outside-action');

    trigger.click();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Panel');

    boundaryAction.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    boundaryAction.click();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Panel');

    outsideAction.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settle(fixture);
    expect(fixture.nativeElement.textContent).not.toContain('Panel');
  });

  it('honors disabled outside-interaction and Escape close policies', async () => {
    const fixture = TestBed.createComponent(NonDismissableFlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Panel');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');
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

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Condition was not met before timeout.');
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
