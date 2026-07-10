import { Component, TemplateRef, viewChild } from '@angular/core';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpDialogManager } from 'ng-primitives/dialog';

import {
  HELL_CONFIRM_LABELS,
  HellConfirmService,
  provideHellConfirmLabels,
  type HellConfirmContentContext,
} from './confirm';

interface AcceptState {
  accepted: boolean;
}

@Component({
  template: `
    <button id="opener" type="button">Opener</button>
    <ng-template #content let-state>
      <label>
        <input
          id="accept"
          type="checkbox"
          [checked]="state().accepted"
          (change)="state.set({ accepted: $any($event.target).checked })"
        />
        Also delete imported groups
      </label>
    </ng-template>
  `,
})
class ConfirmHost {
  readonly content =
    viewChild.required<TemplateRef<HellConfirmContentContext<AcceptState>>>('content');
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

describe('HellConfirmService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(async () => {
    await Promise.all(
      TestBed.inject(NgpDialogManager).openDialogs.map((dialog) => dialog.hideImmediate()),
    );
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('resolves confirmed:true when the confirm button is clicked', async () => {
    const { fixture, svc } = setup();
    const promise = svc.confirm({ title: 'Publish article?' });
    await settle(fixture);

    confirmButton().click();
    await settle(fixture);

    await expect(promise).resolves.toEqual({ confirmed: true, content: undefined });
  });

  it('resolves confirmed:false when the cancel button is clicked', async () => {
    const { fixture, svc } = setup();
    const promise = svc.confirm({ title: 'Delete record?' });
    await settle(fixture);

    cancelButton().click();
    await settle(fixture);

    await expect(promise).resolves.toEqual({ confirmed: false, content: undefined });
  });

  it('resolves confirmed:false on backdrop dismissal', async () => {
    const { fixture, svc } = setup();
    const promise = svc.confirm({ title: 'Discard changes?' });
    await settle(fixture);

    const overlay = query(document.body, '[hellDialogOverlay]');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toEqual({ confirmed: false });
  });

  it('resolves confirmed:false when Escape dismisses the dialog', async () => {
    const { fixture, svc } = setup();
    const promise = svc.confirm({ title: 'Discard changes?' });
    await settle(fixture);

    const dialog = query(document.body, '[role="dialog"]');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    await expect(promise).resolves.toEqual({ confirmed: false });
  });

  it('queues calls and never shows two confirm dialogs at once', async () => {
    const { fixture, svc } = setup();
    const first = svc.confirm({ title: 'First' });
    const second = svc.confirm({ title: 'Second' });
    await settle(fixture);

    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialogTitleText()).toBe('First');

    confirmButton().click();
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(first).resolves.toEqual({ confirmed: true, content: undefined });
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialogTitleText()).toBe('Second');

    cancelButton().click();
    await settle(fixture);
    await expect(second).resolves.toEqual({ confirmed: false, content: undefined });
  });

  it('names the dialog from title and links the description', async () => {
    const { fixture, svc } = setup();
    void svc.confirm({ title: 'Publish this article?', description: 'Everyone will see it.' });
    await settle(fixture);

    const dialog = query(document.body, '[role="dialog"]');
    const labelledBy = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    const describedBy = dialog.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [];

    expect(document.getElementById(labelledBy[0])?.textContent?.trim()).toBe(
      'Publish this article?',
    );
    expect(document.getElementById(describedBy[0])?.textContent?.trim()).toBe('Everyone will see it.');
  });

  it('gates the confirm button with a visible countdown that never auto-confirms', async () => {
    vi.useRealTimers();
    const { fixture, svc } = setup();
    let resolved = false;
    const promise = svc.confirm({ title: 'Delete everything?', countdownSeconds: 1 });
    void promise.then(() => (resolved = true));
    await settle(fixture);

    const confirm = confirmButton();
    expect(confirm.disabled).toBe(true);
    expect(confirm.textContent).toContain('(1)');

    await delay(1150);
    flush();
    await settle(fixture);

    expect(confirm.disabled).toBe(false);
    await macrotask();
    expect(resolved).toBe(false); // countdown enabled only — it never auto-confirms

    confirm.click();
    await settle(fixture);
    await expect(promise).resolves.toEqual({ confirmed: true, content: undefined });
  });

  it('uses the destructive variant and focuses cancel for danger severity', async () => {
    const { fixture, svc } = setup();
    void svc.confirm({ title: 'Delete record?', severity: 'danger' });
    await settle(fixture);
    await animationFrame();

    expect(confirmButton().getAttribute('data-variant')).toBe('danger');
    expect(document.activeElement).toBe(cancelButton());
  });

  it('focuses the confirm button for the default severity', async () => {
    const { fixture, svc } = setup();
    void svc.confirm({ title: 'Publish?' });
    await settle(fixture);
    await animationFrame();

    expect(confirmButton().getAttribute('data-variant')).toBe('primary');
    expect(document.activeElement).toBe(confirmButton());
  });

  it('applies per-call label overrides and Label Contract defaults', async () => {
    TestBed.configureTestingModule({
      providers: [provideHellConfirmLabels({ confirm: 'Ja', cancel: 'Nein' })],
    });
    const { fixture, svc } = setup();

    void svc.confirm({ title: 'Default labels' });
    await settle(fixture);
    expect(confirmButton().textContent?.trim()).toBe('Ja');
    expect(cancelButton().textContent?.trim()).toBe('Nein');
    cancelButton().click();
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    void svc.confirm({ title: 'Custom labels', confirmLabel: 'Delete', cancelLabel: 'Keep' });
    await settle(fixture);
    expect(confirmButton().textContent?.trim()).toBe('Delete');
    expect(cancelButton().textContent?.trim()).toBe('Keep');

    expect(TestBed.inject(HELL_CONFIRM_LABELS).confirm).toBe('Ja');
  });

  it('rides projected content template state back in the result', async () => {
    const { fixture, svc } = setup();
    const promise = svc.confirm<AcceptState>({
      title: 'Delete customer?',
      content: fixture.componentInstance.content(),
      contentState: { accepted: false },
    });
    await settle(fixture);

    const checkbox = query<HTMLInputElement>(document.body, '#accept');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(fixture);

    confirmButton().click();
    await settle(fixture);

    await expect(promise).resolves.toEqual({ confirmed: true, content: { accepted: true } });
  });

  it('restores focus to the opener after the dialog closes', async () => {
    const { fixture, svc } = setup();
    const opener = query<HTMLButtonElement>(fixture.nativeElement, '#opener');
    opener.focus();

    const promise = svc.confirm({ title: 'Confirm?' });
    await settle(fixture);
    confirmButton().click();
    await settle(fixture);
    await promise;
    await animationFrame();

    expect(document.activeElement).toBe(opener);
  });
});

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<ConfirmHost>>;
  svc: HellConfirmService;
} {
  const fixture = TestBed.createComponent(ConfirmHost);
  fixture.detectChanges();
  return { fixture, svc: TestBed.inject(HellConfirmService) };
}

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function flush(): void {
  TestBed.inject(ApplicationRef).tick();
}

function confirmButton(): HTMLButtonElement {
  return dialogButton('primary', 'danger');
}

function cancelButton(): HTMLButtonElement {
  return dialogButton('ghost');
}

function dialogButton(...variants: string[]): HTMLButtonElement {
  const dialog = query(document.body, '[role="dialog"]');
  for (const variant of variants) {
    const button = dialog.querySelector<HTMLButtonElement>(`button[data-variant="${variant}"]`);
    if (button) return button;
  }
  throw new Error(`Expected a dialog button with variant ${variants.join(' or ')}.`);
}

function dialogTitleText(): string | undefined {
  const dialog = query(document.body, '[role="dialog"]');
  const labelledBy = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
  return document.getElementById(labelledBy[0])?.textContent?.trim();
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function animationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function macrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
