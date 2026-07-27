import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { NgpDialogManager } from 'ng-primitives/dialog';

import { type HellSize } from 'hell-ui/core';
import { HELL_DIALOG_IMPORTS } from './dialog';
import {
  HELL_DIALOG_SCOPED_MODALITY_VERSION,
  HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE,
  HellDialogScopedOverlayAdapter,
} from './dialog-scope';
import { sortClasses } from '../spec-helpers';

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
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
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <section id="shared-scope" hellDialogScope>
      <button id="open-first" type="button" [hellDialogTrigger]="first">Open first</button>
      <button id="open-second" type="button" [hellDialogTrigger]="second">Open second</button>
    </section>

    <ng-template #first let-close="close">
      <div id="first-overlay" hellDialogOverlay scoped>
        <div hellDialog><button id="close-first" type="button" (click)="close()">Close</button></div>
      </div>
    </ng-template>

    <ng-template #second let-close="close">
      <div id="second-overlay" hellDialogOverlay scoped>
        <div hellDialog>
          <button id="close-second" type="button" (click)="close()">Close</button>
        </div>
      </div>
    </ng-template>
  `,
})
class SharedScopeDialogHost {}

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <section id="nesting-scope" hellDialogScope>
      <button id="open-outer" type="button" [hellDialogTrigger]="outer">Open outer</button>
    </section>

    <ng-template #outer let-close="close">
      <div id="outer-overlay" hellDialogOverlay scoped>
        <div hellDialog>
          <button id="open-inner" type="button" [hellDialogTrigger]="inner">Open inner</button>
          <button id="close-outer" type="button" (click)="close()">Close outer</button>
        </div>
      </div>
    </ng-template>

    <ng-template #inner let-close="close">
      <div id="inner-overlay" hellDialogOverlay>
        <div hellDialog>
          <button id="close-inner" type="button" (click)="close()">Close inner</button>
        </div>
      </div>
    </ng-template>
  `,
})
class NestedDialogHost {}

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <section id="modality-scope" hellDialogScope>
      <button id="open-scoped" type="button" [hellDialogTrigger]="scoped">Open scoped</button>
    </section>
    <button id="open-page-modal" type="button" [hellDialogTrigger]="pageModal">Open page modal</button>

    <ng-template #scoped let-close="close">
      <div id="modality-overlay" hellDialogOverlay scoped>
        <div hellDialog>
          <button id="close-scoped" type="button" (click)="close()">Close</button>
        </div>
      </div>
    </ng-template>

    <ng-template #pageModal let-close="close">
      <div id="page-modal-overlay" hellDialogOverlay>
        <div hellDialog>
          <button id="close-page-modal" type="button" (click)="close()">Close</button>
        </div>
      </div>
    </ng-template>
  `,
})
class ModalityDialogHost {}

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
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
  imports: [...HELL_DIALOG_IMPORTS],
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
  imports: [...HELL_DIALOG_IMPORTS],
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
  imports: [...HELL_DIALOG_IMPORTS],
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
  imports: [...HELL_DIALOG_IMPORTS],
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

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <button id="open-named" type="button" [hellDialogTrigger]="namedDialog">Open named</button>

    <ng-template #namedDialog>
      <div id="named-overlay" hellDialogOverlay>
        <div hellDialog>
          <h2 hellDialogTitle>Publish this article?</h2>
          <p hellDialogDescription>Once published, the article will be visible to everyone.</p>
          <button type="button">Close</button>
        </div>
      </div>
    </ng-template>
  `,
})
class NamedDialogHost {}

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <button id="open-ui" type="button" [hellDialogTrigger]="uiDialog">Open UI</button>

    <ng-template #uiDialog>
      <div id="ui-overlay" hellDialogOverlay ui="p-0">
        <div id="ui-dialog" hellDialog size="lg" [ui]="dialogUi">
          <h2 id="ui-title" hellDialogTitle [ui]="titleUi">Styled title</h2>
          <p id="ui-description" hellDialogDescription [ui]="descriptionUi">
            Styled description
          </p>
        </div>
      </div>
    </ng-template>
  `,
})
class DialogPartStyleHost {
  readonly overlayUi = { root: 'p-0' };
  readonly dialogUi = { root: 'max-w-[640px] rounded-none shadow-none' };
  readonly titleUi = { root: 'text-hell-danger' };
  readonly descriptionUi = { root: 'mt-0 text-hell-primary' };
}

@Component({
  imports: [...HELL_DIALOG_IMPORTS],
  template: `
    <button id="open-sized" type="button" [hellDialogTrigger]="sizedDialog">Open sized</button>

    <ng-template #sizedDialog>
      <div id="sized-overlay" hellDialogOverlay>
        <div hellDialog [size]="size()">Sized</div>
      </div>
    </ng-template>
  `,
})
class DialogSizeHost {
  readonly size = signal<Exclude<HellSize, 'xs'>>('md');
}

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
        SharedScopeDialogHost,
        NestedDialogHost,
        ModalityDialogHost,
        DisabledDialogTriggerHost,
        EnabledDialogTriggerHost,
        ClosePolicyDialogHost,
        DialogClosedResultHost,
        DialogDataHost,
        NamedDialogHost,
        DialogPartStyleHost,
        DialogSizeHost,
      ],
    }).compileComponents();
  });

  afterEach(async () => {
    await Promise.all(TestBed.inject(NgpDialogManager).openDialogs.map((dialog) => dialog.hideImmediate()));
    document.body.replaceChildren();
    vi.restoreAllMocks();
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

  it('blocks only the Dialog Scope root and leaves the rest of the page perceivable', async () => {
    const fixture = TestBed.createComponent(ModalityDialogHost);
    await settle(fixture);

    const scope = query(fixture.nativeElement, '#modality-scope');
    const appRoot = attachToBody(fixture.nativeElement);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-scoped').click();
    await settle(fixture);
    await microtask();

    expect(scope.hasAttribute('inert')).toBe(true);
    expect(scope.style.overflow).toBe('hidden');
    expect(document.body.getAttribute('data-focus-trap')).toBe('');
    // The dialog manager hides every body child from assistive technology; a
    // scoped dialog puts that back so the surrounding chrome it still hands
    // focus to is not sitting behind an aria-hidden ancestor.
    expect(appRoot.getAttribute('aria-hidden')).toBeNull();

    query<HTMLButtonElement>(document.body, '#close-scoped').click();
    await settleClose(fixture);

    expect(scope.hasAttribute('inert')).toBe(false);
    expect(scope.style.overflow).toBe('');
    expect(document.body.hasAttribute('data-focus-trap')).toBe(false);
  });

  it('keeps a scoped dialog blocked while a dialog opened from inside it comes and goes', async () => {
    const fixture = TestBed.createComponent(NestedDialogHost);
    await settle(fixture);
    const appRoot = attachToBody(fixture.nativeElement);
    await settle(fixture);

    const scope = query(fixture.nativeElement, '#nesting-scope');
    query<HTMLButtonElement>(fixture.nativeElement, '#open-outer').click();
    await settle(fixture);
    await microtask();

    query<HTMLButtonElement>(document.body, '#open-inner').click();
    await settle(fixture);
    await microtask();

    // The inner dialog's trigger is portaled outside the scope, so it opens a
    // page-modal dialog; the outer scope stays blocked and the shell around it
    // stays perceivable for as long as the scoped dialog is open.
    expect(document.body.querySelector('#inner-overlay')).toBeTruthy();
    expect(scope.hasAttribute('inert')).toBe(true);
    expect(appRoot.getAttribute('aria-hidden')).toBeNull();

    query<HTMLButtonElement>(document.body, '#close-inner').click();
    await settleClose(fixture);

    expect(document.body.querySelector('#inner-overlay')).toBeNull();
    expect(document.body.querySelector('#outer-overlay')).toBeTruthy();
    expect(scope.hasAttribute('inert')).toBe(true);
    expect(document.body.getAttribute('data-focus-trap')).toBe('');

    query<HTMLButtonElement>(document.body, '#close-outer').click();
    await settleClose(fixture);

    expect(scope.hasAttribute('inert')).toBe(false);
    expect(document.body.hasAttribute('data-focus-trap')).toBe(false);
  });

  it('names the ng-primitives release its focus-trap escape marker is written against', () => {
    // The marker is a version-bound DOM seam. This records the pairing the
    // tests above exercise; `tools/check-architecture.mjs` owns the exact match
    // against the installed package.
    expect(HELL_DIALOG_SCOPED_MODALITY_VERSION).toMatch(/^ng-primitives@\d+\.\d+\.\d+$/);
  });

  it('keeps page-wide modality for dialogs that are not scoped', async () => {
    const fixture = TestBed.createComponent(ModalityDialogHost);
    await settle(fixture);

    const appRoot = attachToBody(fixture.nativeElement);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-page-modal').click();
    await settle(fixture);
    await microtask();

    expect(appRoot.getAttribute('aria-hidden')).toBe('true');
    expect(document.body.hasAttribute('data-focus-trap')).toBe(false);
    expect(query(fixture.nativeElement, '#modality-scope').hasAttribute('inert')).toBe(false);
  });

  it('reference counts scoped modality so one close does not unblock a shared scope', async () => {
    const fixture = TestBed.createComponent(SharedScopeDialogHost);
    await settle(fixture);

    const scope = query(fixture.nativeElement, '#shared-scope');
    query<HTMLButtonElement>(fixture.nativeElement, '#open-first').click();
    await settle(fixture);
    query<HTMLButtonElement>(fixture.nativeElement, '#open-second').click();
    await settle(fixture);

    expect(scope.hasAttribute('inert')).toBe(true);

    query<HTMLButtonElement>(document.body, '#close-second').click();
    await settleClose(fixture);

    expect(scope.hasAttribute('inert')).toBe(true);
    expect(document.body.getAttribute('data-focus-trap')).toBe('');

    query<HTMLButtonElement>(document.body, '#close-first').click();
    await settleClose(fixture);

    expect(scope.hasAttribute('inert')).toBe(false);
    expect(document.body.hasAttribute('data-focus-trap')).toBe(false);
  });

  it('restores focus to a scoped trigger that was inside the blocked region', async () => {
    const fixture = TestBed.createComponent(ModalityDialogHost);
    await settle(fixture);
    attachToBody(fixture.nativeElement);
    await settle(fixture);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#open-scoped');
    trigger.focus();
    trigger.click();
    await settle(fixture);

    query<HTMLButtonElement>(document.body, '#close-scoped').click();
    await settle(fixture);
    await animationFrame();
    await settle(fixture);

    expect(query(fixture.nativeElement, '#modality-scope').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(trigger);
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

  it('advances Tab through focusable dialog controls even when the browser skips button tabbing', async () => {
    const fixture = TestBed.createComponent(DialogClosedResultHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-result').click();
    await settle(fixture);

    const first = query<HTMLButtonElement>(document.body, '#result-close');
    const second = query<HTMLButtonElement>(document.body, '#result-close-empty');
    mockVisible(first);
    mockVisible(second);
    const interactivityChecker = TestBed.inject(InteractivityChecker);
    vi.spyOn(interactivityChecker, 'isFocusable').mockReturnValue(true);
    vi.spyOn(interactivityChecker, 'isVisible').mockReturnValue(true);

    first.focus();
    const forward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    expect(first.dispatchEvent(forward)).toBe(false);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it('passes dialog data from the trigger input to template context', async () => {
    const fixture = TestBed.createComponent(DialogDataHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-data').click();
    await settle(fixture);

    const payload = query<HTMLElement>(document.body, '#data-payload');
    expect(payload.textContent).toBe('payload');
  });

  it('names dialogs from hellDialogTitle and links hellDialogDescription', async () => {
    const fixture = TestBed.createComponent(NamedDialogHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-named').click();
    await settle(fixture);

    const overlay = query<HTMLElement>(document.body, '#named-overlay');
    const dialog = query<HTMLElement>(overlay, '[role="dialog"]');
    const titleIds = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    const descriptionIds = dialog.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [];

    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(titleIds).toHaveLength(1);
    expect(document.getElementById(titleIds[0])?.textContent?.trim()).toBe(
      'Publish this article?',
    );
    expect(descriptionIds).toHaveLength(1);
    expect(document.getElementById(descriptionIds[0])?.textContent?.trim()).toBe(
      'Once published, the article will be visible to everyone.',
    );
  });

  it('reflects the supported size scale on data-size for recipe and CSS hooks', async () => {
    const fixture = TestBed.createComponent(DialogSizeHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-sized').click();
    await settle(fixture);

    const overlay = query<HTMLElement>(document.body, '#sized-overlay');
    const dialog = query<HTMLElement>(overlay, '[role="dialog"]');
    expect(dialog.getAttribute('data-size')).toBe('md');

    for (const size of ['sm', 'lg', 'xl'] as const) {
      fixture.componentInstance.size.set(size);
      await settle(fixture);
      expect(dialog.getAttribute('data-size')).toBe(size);
    }
  });

  it('applies Part Style Map classes while preserving title and description wiring', async () => {
    const fixture = TestBed.createComponent(DialogPartStyleHost);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#open-ui').click();
    await settle(fixture);

    const overlay = query<HTMLElement>(document.body, '#ui-overlay');
    const dialog = query<HTMLElement>(document.body, '[role="dialog"]');
    const titleIds = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    const descriptionIds = dialog.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [];
    const title = document.getElementById(titleIds[0]);
    const description = document.getElementById(descriptionIds[0]);

    if (!(title instanceof HTMLElement)) throw new Error('Expected rendered dialog title.');
    if (!(description instanceof HTMLElement))
      throw new Error('Expected rendered dialog description.');

    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(overlay.getAttribute('data-slot')).toBe('root');
    expect(overlay.className).toContain('p-0');

    expect(dialog.getAttribute('data-slot')).toBe('root');
    expect(dialog.getAttribute('data-size')).toBe('lg');
    expect(dialog.className).toContain('max-w-[640px]');
    expect(dialog.className).toContain('rounded-none');

    expect(title.getAttribute('data-slot')).toBe('root');
    expect(title.className).toContain('text-hell-danger');
    expect(description.getAttribute('data-slot')).toBe('root');
    expect(description.className).toContain('mt-0');
    expect(description.className).toContain('text-hell-primary');

    expect(title.textContent?.trim()).toBe('Styled title');
    expect(description.textContent?.trim()).toBe('Styled description');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(NamedDialogHost);
      await settle(fixture);

      query<HTMLButtonElement>(fixture.nativeElement, '#open-named').click();
      await settle(fixture);

      const overlay = query<HTMLElement>(document.body, '#named-overlay');
      const dialog = query<HTMLElement>(overlay, '[role="dialog"]');
      const titleIds = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
      const descriptionIds = dialog.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [];
      const title = document.getElementById(titleIds[0]);
      const description = document.getElementById(descriptionIds[0]);

      expect({
        overlay: sortClasses(overlay.className),
        dialog: sortClasses(dialog.className),
        title: sortClasses(title?.className ?? ''),
        description: sortClasses(description?.className ?? ''),
      }).toMatchSnapshot('dialog');
    });
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

function microtask(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(() => resolve()));
}

/** Closing awaits the exit animation and the portal detach before teardown runs. */
async function settleClose(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}): Promise<void> {
  await settle(fixture);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await settle(fixture);
}

/**
 * The body child the dialog manager's assistive-technology pass will hide —
 * the stand-in for an application root around the fixture.
 */
function attachToBody(element: HTMLElement): HTMLElement {
  if (!element.isConnected) {
    const host = document.createElement('div');
    host.append(element);
    document.body.append(host);
    return host;
  }

  let current = element;
  while (current.parentElement && current.parentElement !== document.body) {
    current = current.parentElement;
  }
  return current;
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

function mockVisible(element: HTMLElement): void {
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 80 });
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: 24 });
}

function expectVar(element: HTMLElement, name: string, value: string): void {
  expect(element.style.getPropertyValue(name)).toBe(value);
}
