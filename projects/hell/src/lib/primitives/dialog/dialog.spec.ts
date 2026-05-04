import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HELL_APP_SHELL_DIRECTIVES } from '../../composites/app-shell/app-shell';
import { HELL_DIALOG_DIRECTIVES, HellDialogTrigger } from './dialog';
import {
  HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE,
  HellDialogScopeCoordinator,
  HellDialogScopedOverlayAdapter,
} from './dialog-scope';

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <div hellAppShell>
      <header hellAppTopbar>Topbar</header>
      <main hellAppContent>
        <button type="button" [hellDialogTrigger]="dialog">Open scoped dialog</button>
      </main>
    </div>

    <ng-template #dialog let-close="close">
      <div hellDialogOverlay scoped>
        <div hellDialog>
          <button type="button" (click)="close()">Close</button>
        </div>
      </div>
    </ng-template>
  `,
})
class ScopedDialogHost {}

describe('HellDialogTrigger scoped overlays', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScopedDialogHost],
    }).compileComponents();
  });

  it('primes the nearest Dialog Scope root without reaching into dialog internals', async () => {
    const fixture = TestBed.createComponent(ScopedDialogHost);
    await settle(fixture);

    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    const trigger = fixture.debugElement
      .query(By.directive(HellDialogTrigger))
      .injector.get(HellDialogTrigger) as unknown as { primeScope(): void };
    const coordinator = TestBed.inject(HellDialogScopeCoordinator);

    expect(main.getAttribute(HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE)).toBe('true');
    expect(main.getAttribute('data-dialog-root')).toBe('true');

    trigger.primeScope();

    expect(coordinator.claimRoot()).toBe(main);
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
