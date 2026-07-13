import { ApplicationRef, Component } from '@angular/core';
import { provideHellLabels } from '@hell-ui/angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpDialogManager } from 'ng-primitives/dialog';

import { HELL_CONFIRM_LABELS, hellChoiceAction, hellCountdownAction, hellDestructiveAction, hellPrimaryAction, hellSecondaryAction, injectHellChoice, injectHellConfirm, type HellConfirmAction } from './confirm';

@Component({
  template: `<button id="opener" type="button">Opener</button>`,
})
class ConfirmHost {
  readonly confirm = injectHellConfirm();
  readonly choice = injectHellChoice();
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

describe('injectHellConfirm', () => {
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

  it('resolves true when the confirm action is clicked', async () => {
    const { fixture, host } = setup();
    const promise = host.confirm('Publish article?', hellPrimaryAction('Publish'));
    await settle(fixture);

    expect(dialogTitleText()).toBe('Publish article?');
    expect(confirmButton().textContent?.trim()).toBe('Publish');
    confirmButton().click();
    await settle(fixture);

    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when the cancel button is clicked', async () => {
    const { fixture, host } = setup();
    const promise = host.confirm('Delete record?', hellDestructiveAction('Delete'));
    await settle(fixture);

    cancelButton().click();
    await settle(fixture);

    await expect(promise).resolves.toBe(false);
  });

  it('resolves false on backdrop dismissal', async () => {
    const { fixture, host } = setup();
    const promise = host.confirm('Discard changes?');
    await settle(fixture);

    const overlay = query(document.body, '[hellDialogOverlay]');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when Escape dismisses the dialog', async () => {
    const { fixture, host } = setup();
    const promise = host.confirm('Discard changes?');
    await settle(fixture);

    const dialog = query(document.body, '[role="dialog"]');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    await expect(promise).resolves.toBe(false);
  });

  it('queues calls and never shows two confirm surfaces at once', async () => {
    const { fixture, host } = setup();
    const first = host.confirm('First');
    const second = host.confirm('Second');
    await settle(fixture);

    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialogTitleText()).toBe('First');

    confirmButton().click();
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(first).resolves.toBe(true);
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialogTitleText()).toBe('Second');

    cancelButton().click();
    await settle(fixture);
    await expect(second).resolves.toBe(false);
  });

  it('names the dialog from the prompt title and links the description', async () => {
    const { fixture, host } = setup();
    void host.confirm({ title: 'Publish this article?', description: 'Everyone will see it.' });
    await settle(fixture);

    const dialog = query(document.body, '[role="dialog"]');
    const labelledBy = dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    const describedBy = dialog.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? [];

    expect(document.getElementById(labelledBy[0])?.textContent?.trim()).toBe(
      'Publish this article?',
    );
    expect(document.getElementById(describedBy[0])?.textContent?.trim()).toBe(
      'Everyone will see it.',
    );
  });

  it('gates a countdown action with a visible countdown that never auto-confirms', async () => {
    vi.useRealTimers();
    const { fixture, host } = setup();
    let resolved = false;
    const promise = host.confirm(
      'Delete everything?',
      hellCountdownAction(1, hellDestructiveAction('Delete everything')),
    );
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
    expect(resolved).toBe(false); // countdown enables only — it never auto-confirms

    confirm.click();
    await settle(fixture);
    await expect(promise).resolves.toBe(true);
  });

  it('uses the destructive variant and focuses cancel for destructive actions', async () => {
    const { fixture, host } = setup();
    void host.confirm('Delete record?', hellDestructiveAction('Delete record'));
    await settle(fixture);
    await animationFrame();

    expect(confirmButton().getAttribute('data-variant')).toBe('danger');
    expect(document.activeElement).toBe(cancelButton());
  });

  it('focuses the confirm button for non-destructive actions', async () => {
    const { fixture, host } = setup();
    void host.confirm('Publish?', hellPrimaryAction('Publish'));
    await settle(fixture);
    await animationFrame();

    expect(confirmButton().getAttribute('data-variant')).toBe('primary');
    expect(document.activeElement).toBe(confirmButton());
  });

  it('falls back to the Label Contract default primary action without an action', async () => {
    TestBed.configureTestingModule({
      providers: [provideHellLabels(HELL_CONFIRM_LABELS, { confirm: 'Ja', cancel: 'Nein' })],
    });
    const { fixture, host } = setup();

    void host.confirm('Default labels');
    await settle(fixture);
    expect(confirmButton().textContent?.trim()).toBe('Ja');
    expect(confirmButton().getAttribute('data-variant')).toBe('primary');
    expect(cancelButton().textContent?.trim()).toBe('Nein');

    expect(TestBed.inject(HELL_CONFIRM_LABELS).confirm).toBe('Ja');
  });

  it('lets a cancelAction override the cancel button', async () => {
    const { fixture, host } = setup();
    const promise = host.confirm(
      'Delete this project?',
      hellDestructiveAction('Delete project'),
      hellSecondaryAction('Keep project'),
    );
    await settle(fixture);

    const cancel = cancelButton();
    expect(cancel.textContent?.trim()).toBe('Keep project');
    expect(cancel.getAttribute('data-variant')).toBe('default');

    cancel.click();
    await settle(fixture);
    await expect(promise).resolves.toBe(false);
  });

  it('rejects actions that were not built with the combinators', () => {
    const { host } = setup();
    expect(() => host.confirm('Nope', {} as HellConfirmAction)).toThrowError(/combinators/);
  });

  it('restores focus to the opener after the dialog closes', async () => {
    const { fixture, host } = setup();
    const opener = query<HTMLButtonElement>(fixture.nativeElement, '#opener');
    opener.focus();

    const promise = host.confirm('Confirm?');
    await settle(fixture);
    confirmButton().click();
    await settle(fixture);
    await promise;
    await animationFrame();

    expect(document.activeElement).toBe(opener);
  });
});

describe('injectHellChoice', () => {
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

  it('renders one button per action in order and resolves the clicked key', async () => {
    const { fixture, host } = setup();
    const promise = host.choice({ title: 'You have unsaved changes' }, [
      hellChoiceAction('save', hellPrimaryAction('Save and leave')),
      hellChoiceAction('discard', hellDestructiveAction('Discard changes')),
      hellChoiceAction('stay', hellSecondaryAction('Keep editing'), { dismissEquivalent: true }),
    ]);
    await settle(fixture);

    const buttons = dialogButtons();
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Save and leave',
      'Discard changes',
      'Keep editing',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-variant'))).toEqual([
      'primary',
      'danger',
      'default',
    ]);

    buttons[1].click();
    await settle(fixture);
    await expect(promise).resolves.toBe('discard');
  });

  it('resolves the dismissEquivalent key on Escape', async () => {
    const { fixture, host } = setup();
    const promise = host.choice('Leave this page?', [
      hellChoiceAction('leave', hellPrimaryAction('Leave')),
      hellChoiceAction('stay', hellSecondaryAction('Stay'), { dismissEquivalent: true }),
    ]);
    await settle(fixture);

    const dialog = query(document.body, '[role="dialog"]');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toBe('stay');
  });

  it('resolves null on dismissal when no action is dismissEquivalent', async () => {
    const { fixture, host } = setup();
    const promise = host.choice('Pick one', [
      hellChoiceAction('a', hellPrimaryAction('A')),
      hellChoiceAction('b', hellSecondaryAction('B')),
    ]);
    await settle(fixture);

    const overlay = query(document.body, '[hellDialogOverlay]');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toBeNull();
  });

  it('focuses the safe dismiss-equivalent action when a destructive action is present', async () => {
    const { fixture, host } = setup();
    void host.choice('You have unsaved changes', [
      hellChoiceAction('save', hellPrimaryAction('Save and leave')),
      hellChoiceAction('discard', hellDestructiveAction('Discard changes')),
      hellChoiceAction('stay', hellSecondaryAction('Keep editing'), { dismissEquivalent: true }),
    ]);
    await settle(fixture);
    await animationFrame();

    expect(document.activeElement).toBe(dialogButtons()[2]);
  });

  it('focuses the first action when every action is safe', async () => {
    const { fixture, host } = setup();
    void host.choice('Pick one', [
      hellChoiceAction('a', hellPrimaryAction('A')),
      hellChoiceAction('b', hellSecondaryAction('B')),
    ]);
    await settle(fixture);
    await animationFrame();

    expect(document.activeElement).toBe(dialogButtons()[0]);
  });

  it('queues behind confirm calls on the shared modal queue', async () => {
    const { fixture, host } = setup();
    const first = host.confirm('First');
    const second = host.choice('Second', [hellChoiceAction('ok', hellPrimaryAction('OK'))]);
    await settle(fixture);

    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialogTitleText()).toBe('First');

    confirmButton().click();
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(first).resolves.toBe(true);
    expect(dialogTitleText()).toBe('Second');

    dialogButtons()[0].click();
    await settle(fixture);
    await expect(second).resolves.toBe('ok');
  });

  it('rejects an empty action list and duplicate dismiss equivalents', () => {
    const { host } = setup();
    expect(() => host.choice('Empty', [])).toThrowError(/at least one/);
    expect(() =>
      host.choice('Twice', [
        hellChoiceAction('a', hellPrimaryAction('A'), { dismissEquivalent: true }),
        hellChoiceAction('b', hellSecondaryAction('B'), { dismissEquivalent: true }),
      ]),
    ).toThrowError(/at most one/);
  });
});

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<ConfirmHost>>;
  host: ConfirmHost;
} {
  const fixture = TestBed.createComponent(ConfirmHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance };
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
  return dialogButton('ghost', 'default');
}

function dialogButton(...variants: string[]): HTMLButtonElement {
  const dialog = query(document.body, '[role="dialog"]');
  for (const variant of variants) {
    const button = dialog.querySelector<HTMLButtonElement>(`button[data-variant="${variant}"]`);
    if (button) return button;
  }
  throw new Error(`Expected a dialog button with variant ${variants.join(' or ')}.`);
}

function dialogButtons(): HTMLButtonElement[] {
  const dialog = query(document.body, '[role="dialog"]');
  return Array.from(dialog.querySelectorAll<HTMLButtonElement>('button[data-variant]'));
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
