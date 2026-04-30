import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HELL_APP_SHELL_DIRECTIVES } from '../../composites/app-shell/app-shell';
import { HELL_CARD_DIRECTIVES } from '../card/card';
import { HELL_DIALOG_DIRECTIVES, HellDialogTrigger } from './dialog';
import { HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE } from './dialog-scope';

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES, ...HELL_CARD_DIRECTIVES, ...HELL_DIALOG_DIRECTIVES],
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
          <div hellCardBody>
            <button type="button" (click)="close()">Close</button>
          </div>
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

  it('uses nearest dialog root when opening a scoped overlay', async () => {
    const fixture = TestBed.createComponent(ScopedDialogHost);
    await settle(fixture);

    const rootStyles = document.documentElement.style;
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    const trigger = fixture.debugElement
      .query(By.directive(HellDialogTrigger))
      .injector.get(HellDialogTrigger) as unknown as { primeScope(): void; clearScope(): void };

    expect(main.getAttribute(HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE)).toBe('true');
    expect(main.getAttribute('data-dialog-root')).toBe('true');

    Object.defineProperty(main, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          left: 24,
          top: 48,
          width: 640,
          height: 320,
          right: 664,
          bottom: 368,
          x: 24,
          y: 48,
          toJSON: () => undefined,
        }) as DOMRect,
    });

    trigger.primeScope();

    expect(rootStyles.getPropertyValue('--hell-dialog-scope-top')).toBe('48px');
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-right')).toBe(
      `${window.innerWidth - 664}px`,
    );
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-bottom')).toBe(
      `${window.innerHeight - 368}px`,
    );
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-left')).toBe('24px');

    trigger.clearScope();

    expect(rootStyles.getPropertyValue('--hell-dialog-scope-top')).toBe('');
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-right')).toBe('');
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-bottom')).toBe('');
    expect(rootStyles.getPropertyValue('--hell-dialog-scope-left')).toBe('');
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
