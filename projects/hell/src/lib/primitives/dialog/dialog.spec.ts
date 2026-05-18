import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpDialogManager } from 'ng-primitives/dialog';

import { HELL_DIALOG_DIRECTIVES } from './dialog';
import { HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE, HellDialogScopedOverlayAdapter } from './dialog-scope';

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <section id="scope-a" hellDialogScope>
      <button id="open-a" type="button" [hellDialogTrigger]="dialogA">Open A</button>
    </section>
    <section id="scope-b" hellDialogScope>
      <button id="open-b" type="button" [hellDialogTrigger]="dialogB">Open B</button>
    </section>

    <ng-template #dialogA let-close="close">
      <div id="overlay-a" hellDialogOverlay scoped>
        <div hellDialog>
          <button type="button" (click)="close()">Close A</button>
        </div>
      </div>
    </ng-template>

    <ng-template #dialogB let-close="close">
      <div id="overlay-b" hellDialogOverlay scoped>
        <div hellDialog>
          <button type="button" (click)="close()">Close B</button>
        </div>
      </div>
    </ng-template>
  `,
})
class ScopedDialogHost {}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <a id="disabled-dialog" href="#dialog" [hellDialogTrigger]="dialog" disabled>Open</a>
    <ng-template #dialog>
      <div id="disabled-dialog-overlay" hellDialogOverlay>
        <div hellDialog>Blocked</div>
      </div>
    </ng-template>
  `,
})
class DisabledDialogTriggerHost {}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <a id="enabled-dialog" href="#dialog" [hellDialogTrigger]="dialog">Open</a>
    <ng-template #dialog>
      <div id="enabled-dialog-overlay" hellDialogOverlay>
        <div hellDialog>Enabled</div>
      </div>
    </ng-template>
  `,
})
class EnabledDialogTriggerHost {}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <button id="open-default" type="button" [hellDialogTrigger]="defaultDialog" [closeOnOutsideClick]="true">
      Default
    </button>
    <button
      id="open-blocked"
      type="button"
      [hellDialogTrigger]="blockedDialog"
      [closeOnOutsideClick]="false"
    >
      Blocked
    </button>

    <ng-template #defaultDialog>
      <div id="default-overlay" hellDialogOverlay>
        <div hellDialog>Default</div>
      </div>
    </ng-template>

    <ng-template #blockedDialog>
      <div id="blocked-overlay" hellDialogOverlay>
        <div hellDialog>Blocked</div>
      </div>
    </ng-template>
  `,
})
class ClosePolicyDialogHost {}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <button id="open-result" type="button" [hellDialogTrigger]="resultDialog" (closed)="onDialogClosed($any($event))">
      Open
    </button>

    <ng-template #resultDialog let-close="close">
      <div id="result-overlay" hellDialogOverlay>
        <div hellDialog>
          <button id="result-close" type="button" (click)="close('result')">Close</button>
          <button id="result-close-empty" type="button" (click)="close()">Close w/o result</button>
        </div>
      </div>
    </ng-template>
  `,
})
class DialogClosedResultHost {
  readonly results: Array<string | undefined> = [];

  onDialogClosed(result: string | undefined): void {
    this.results.push(result);
  }
}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <button
      id="open-data"
      type="button"
      [hellDialogTrigger]="dataDialog"
      [dialogData]="{ value: 'payload' }"
    >
      Open data
    </button>

    <ng-template #dataDialog let-ref>
      <div id="data-overlay" hellDialogOverlay>
        <div hellDialog>
          <span id="data-payload">{{ ref.data.value }}</span>
        </div>
      </div>
    </ng-template>
  `,
})
class DialogDataHost {}

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

describe('HellDialogTrigger scoped overlays', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScopedDialogHost,
        DisabledDialogTriggerHost,
        EnabledDialogTriggerHost,
        ClosePolicyDialogHost,
        DialogClosedResultHost,
        DialogDataHost,
      ],
    }).compileComponents();
  });

  afterEach(async () => {
    await Promise.all(TestBed.inject(NgpDialogManager).openDialogs.map((dialog) => dialog.hideImmediate()));
    document.body.replaceChildren();
  });

  it('keeps dialogs open when closeOnOutsideClick is false', async () => {
    const fixture = TestBed.createComponent(ClosePolicyDialogHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-blocked').click();
    await settle(fixture);

    const overlay = query(document.body, '#blocked-overlay');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);

    expect(document.body.querySelector('#blocked-overlay')).toBe(overlay);
  });

  it('closes dialogs on outside overlay clicks when closeOnOutsideClick is true', async () => {
    const fixture = TestBed.createComponent(ClosePolicyDialogHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-default').click();
    await settle(fixture);

    const overlay = query(document.body, '#default-overlay');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle(fixture);

    expect(document.body.querySelector('#default-overlay')).toBeNull();
  });

  it('guards disabled anchor triggers', async () => {
    const fixture = TestBed.createComponent(DisabledDialogTriggerHost);
    await settle(fixture);

    const trigger = query<HTMLAnchorElement>(fixture.nativeElement, '#disabled-dialog');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
    expect(trigger.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    expect(document.body.querySelector('#disabled-dialog-overlay')).toBeNull();
  });

  it('prevents enabled anchor default navigation while opening', async () => {
    const fixture = TestBed.createComponent(EnabledDialogTriggerHost);
    await settle(fixture);

    const trigger = query<HTMLAnchorElement>(fixture.nativeElement, '#enabled-dialog');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(trigger.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    await settle(fixture);

    expect(document.body.querySelector('#enabled-dialog-overlay')).toBeTruthy();
  });

  it('carries Dialog Scope roots through each open instead of singleton pending state', async () => {
    const fixture = TestBed.createComponent(ScopedDialogHost);
    await settle(fixture);

    const rootA = query(fixture.nativeElement, '#scope-a');
    const rootB = query(fixture.nativeElement, '#scope-b');
    mockRect(rootA, { left: 10, top: 20, right: 310, bottom: 220 });
    mockRect(rootB, { left: 40, top: 60, right: 240, bottom: 260 });

    expect(rootA.getAttribute(HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE)).toBe('true');
    expect(rootA.getAttribute('data-dialog-root')).toBe('true');
    expect(rootB.getAttribute(HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE)).toBe('true');

    query<HTMLButtonElement>(fixture.nativeElement, '#open-a').click();
    query<HTMLButtonElement>(fixture.nativeElement, '#open-b').click();
    await settle(fixture);

    const overlayA = query(document.body, '#overlay-a');
    const overlayB = query(document.body, '#overlay-b');

    expectVar(rootA, '--hell-dialog-scope-left', '10px');
    expectVar(overlayA, '--hell-dialog-scope-left', '10px');
    expectVar(rootB, '--hell-dialog-scope-left', '40px');
    expectVar(overlayB, '--hell-dialog-scope-left', '40px');
  });

  it('emits dialog close result values that are independent from template data', async () => {
    const fixture = TestBed.createComponent(DialogClosedResultHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-result').click();
    await settle(fixture);

    const closeWithResult = query<HTMLButtonElement>(document.body, '#result-close');
    closeWithResult.click();
    await settle(fixture);
    expect(fixture.componentInstance.results).toEqual(['result']);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-result').click();
    await settle(fixture);

    const closeWithoutResult = query<HTMLButtonElement>(document.body, '#result-close-empty');
    closeWithoutResult.click();
    await settle(fixture);

    expect(fixture.componentInstance.results).toEqual(['result', undefined]);
  });

  it('restores focus to the trigger after close animations finish', async () => {
    const fixture = TestBed.createComponent(DialogClosedResultHost);
    await settle(fixture);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#open-result');
    trigger.focus();
    trigger.click();
    await settle(fixture);

    query<HTMLButtonElement>(document.body, '#result-close-empty').click();
    await settle(fixture);
    await animationFrame();
    await settle(fixture);

    expect(document.activeElement).toBe(trigger);
  });

  it('passes dialog data from the trigger input to template context', async () => {
    const fixture = TestBed.createComponent(DialogDataHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-data').click();
    await settle(fixture);

    const payload = query<HTMLElement>(document.body, '#data-payload');
    expect(payload.textContent).toBe('payload');
  });
});

describe('HellDialogScopedOverlayAdapter', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('copies each Dialog Scope root vars to its own overlay without global overrides', () => {
    const rootA = document.createElement('section');
    const rootB = document.createElement('section');
    const overlayA = document.createElement('div');
    const overlayB = document.createElement('div');
    document.body.append(rootA, rootB, overlayA, overlayB);

    mockRect(rootA, { left: 10, top: 20, right: 310, bottom: 220 });
    mockRect(rootB, { left: 40, top: 60, right: 240, bottom: 260 });

    const adapterA = new HellDialogScopedOverlayAdapter(rootA, overlayA, document);
    const adapterB = new HellDialogScopedOverlayAdapter(rootB, overlayB, document);

    adapterA.connect();
    adapterB.connect();

    expectVar(rootA, '--hell-dialog-scope-left', '10px');
    expectVar(overlayA, '--hell-dialog-scope-left', '10px');
    expectVar(rootB, '--hell-dialog-scope-left', '40px');
    expectVar(overlayB, '--hell-dialog-scope-left', '40px');
    expect(document.documentElement.style.getPropertyValue('--hell-dialog-scope-left')).toBe('');

    adapterA.destroy();

    expectVar(rootA, '--hell-dialog-scope-left', '');
    expectVar(overlayA, '--hell-dialog-scope-left', '');
    expectVar(rootB, '--hell-dialog-scope-left', '40px');
    expectVar(overlayB, '--hell-dialog-scope-left', '40px');

    adapterB.destroy();
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function animationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function mockRect(
  element: HTMLElement,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>,
): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        ...rect,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        x: rect.left,
        y: rect.top,
        toJSON: () => undefined,
      }) as DOMRect,
  });
}

function expectVar(element: HTMLElement, name: string, value: string): void {
  expect(element.style.getPropertyValue(name)).toBe(value);
}
