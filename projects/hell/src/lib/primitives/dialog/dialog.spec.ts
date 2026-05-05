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
      imports: [ScopedDialogHost],
    }).compileComponents();
  });

  afterEach(async () => {
    await Promise.all(TestBed.inject(NgpDialogManager).openDialogs.map((dialog) => dialog.hideImmediate()));
    document.body.replaceChildren();
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
