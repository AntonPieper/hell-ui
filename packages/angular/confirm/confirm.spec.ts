import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHellLabels } from 'hell-ui/core';
import { NgpDialogManager } from 'ng-primitives/dialog';

import {
  HELL_CONFIRM_LABELS,
  injectHellPrompt,
  type HellPromptAction,
} from './confirm';

@Component({
  template: `<button id="opener" type="button">Opener</button>`,
})
class PromptHost {
  readonly prompt = injectHellPrompt();
}

@Component({
  template: `<button id="scoped-opener" type="button">Scoped opener</button>`,
  providers: [
    provideHellLabels(HELL_CONFIRM_LABELS, {
      confirm: 'Scoped confirm',
      cancel: 'Scoped cancel',
      countdown: (remainingSeconds) => ` [${remainingSeconds}]`,
    }),
  ],
})
class ScopedPromptHost {
  readonly prompt = injectHellPrompt();
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

describe('HellPrompt modal presentation', () => {
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
    const promise = host.prompt.confirm('Publish article?', {
      action: { label: 'Publish', variant: 'primary' },
    });
    await settle(fixture);

    expect(dialogTitleText()).toBe('Publish article?');
    expect(confirmButton().textContent?.trim()).toBe('Publish');
    confirmButton().click();
    await settle(fixture);

    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when the cancel action is clicked', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.confirm('Delete record?', {
      action: { label: 'Delete', variant: 'danger' },
    });
    await settle(fixture);

    cancelButton().click();
    await settle(fixture);

    await expect(promise).resolves.toBe(false);
  });

  it('resolves false on backdrop and Escape dismissal', async () => {
    const { fixture, host } = setup();
    const backdropPromise = host.prompt.confirm('Discard changes?');
    await settle(fixture);

    const overlay = query(document.body, '[hellDialogOverlay]');
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(backdropPromise).resolves.toBe(false);

    const escapePromise = host.prompt.confirm('Discard again?');
    await settle(fixture);
    query(document.body, '[role="dialog"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(escapePromise).resolves.toBe(false);
  });

  it('queues confirm and generic choices on one modal queue', async () => {
    const { fixture, host } = setup();
    const first = host.prompt.confirm('First');
    const second = host.prompt.choose('Second', [{ value: 'ok', label: 'OK' }]);
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

    dialogButtons()[0].click();
    await settle(fixture);
    await expect(second).resolves.toBe('ok');
  });

  it('dismisses a destroyed queued caller without blocking later prompts', async () => {
    const first = setup();
    const destroyed = setup();
    const later = setup();

    const firstPromise = first.host.prompt.confirm('First');
    const destroyedPromise = destroyed.host.prompt.confirm('Destroyed before presentation');
    await settle(first.fixture);

    expect(dialogTitleText()).toBe('First');
    destroyed.fixture.destroy();
    await expect(destroyedPromise).resolves.toBe(false);

    const laterPromise = later.host.prompt.confirm('Later');
    expect(dialogTitleText()).toBe('First');

    confirmButton().click();
    await settle(first.fixture);
    await macrotask();
    await settle(later.fixture);

    await expect(firstPromise).resolves.toBe(true);
    expect(dialogTitleText()).toBe('Later');

    confirmButton().click();
    await settle(later.fixture);
    await expect(laterPromise).resolves.toBe(true);
  });

  it('dismisses an active caller on destroy and advances the modal queue', async () => {
    const active = setup();
    const later = setup();
    const activePromise = active.host.prompt.confirm('Active');
    const laterPromise = later.host.prompt.confirm('After active destroy');
    await settle(active.fixture);

    active.fixture.destroy();
    await expect(activePromise).resolves.toBe(false);
    await macrotask();
    await settle(later.fixture);

    expect(dialogTitleText()).toBe('After active destroy');
    confirmButton().click();
    await settle(later.fixture);
    await expect(laterPromise).resolves.toBe(true);
  });

  it('preserves a selected result when its caller is destroyed during delayed close', async () => {
    const exit = deferred();
    vi.spyOn(HTMLElement.prototype, 'getAnimations').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (!this.matches('[hellDialogOverlay], [hellDialog]')) return [];
      return [{ finished: exit.promise } as unknown as Animation];
    });

    const active = setup();
    const later = setup();
    const selectedPromise = active.host.prompt.choose<'selected' | 'dismissed'>(
      'Select before destroy',
      [
        { value: 'selected', label: 'Select' },
        { value: 'dismissed', label: 'Dismiss', dismissEquivalent: true },
      ],
    );
    const laterPromise = later.host.prompt.confirm('After delayed close');
    let selectedResult: 'selected' | 'dismissed' | 'unresolved' | null = 'unresolved';
    void selectedPromise.then((value) => (selectedResult = value));
    await settle(active.fixture);

    dialogButtons()[0].click();
    active.fixture.destroy();
    await macrotask();

    expect.soft(selectedResult).toBe('unresolved');
    expect.soft(document.body.textContent).not.toContain('After delayed close');

    exit.resolve();
    await macrotask();
    await settle(later.fixture);

    await expect(selectedPromise).resolves.toBe('selected');
    expect(dialogTitleText()).toBe('After delayed close');
    confirmButton().click();
    await settle(later.fixture);
    await expect(laterPromise).resolves.toBe(true);
  });

  it('names the dialog from the prompt title and links the description', async () => {
    const { fixture, host } = setup();
    void host.prompt.confirm({
      title: 'Publish this article?',
      description: 'Everyone will see it.',
    });
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

  it('gates a countdown action and never auto-confirms', async () => {
    vi.useRealTimers();
    const { fixture, host } = setup();
    let resolved = false;
    const promise = host.prompt.confirm('Delete everything?', {
      action: { label: 'Delete everything', variant: 'danger', countdownSeconds: 1 },
    });
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
    expect(resolved).toBe(false);

    confirm.click();
    await settle(fixture);
    await expect(promise).resolves.toBe(true);
  });

  it('focuses a safe action instead of a danger or countdown-gated action', async () => {
    const { fixture, host } = setup();
    void host.prompt.confirm('Delete record?', {
      action: { label: 'Delete record', variant: 'danger' },
      cancelAction: { label: 'Keep record', variant: 'default' },
    });
    await settle(fixture);
    await animationFrame();

    expect(confirmButton().getAttribute('data-variant')).toBe('danger');
    expect(document.activeElement).toBe(cancelButton());

    cancelButton().click();
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    void host.prompt.confirm('Publish?', {
      action: { label: 'Publish', variant: 'primary' },
    });
    await settle(fixture);
    await animationFrame();

    expect(document.activeElement).toBe(confirmButton());
  });

  it('uses Label Contract defaults from the factory caller injector', async () => {
    const fixture = TestBed.createComponent(ScopedPromptHost);
    fixture.detectChanges();

    void fixture.componentInstance.prompt.confirm('Scoped labels');
    await settle(fixture);

    expect(confirmButton().textContent?.trim()).toBe('Scoped confirm');
    expect(cancelButton().textContent?.trim()).toBe('Scoped cancel');
  });

  it('keeps each queued request in its caller label scope', async () => {
    const root = setup();
    const scopedFixture = TestBed.createComponent(ScopedPromptHost);
    scopedFixture.detectChanges();

    const first = root.host.prompt.confirm('Root request');
    const second = scopedFixture.componentInstance.prompt.confirm('Scoped request');
    await settle(root.fixture);

    expect(confirmButton().textContent?.trim()).toBe('Confirm');
    confirmButton().click();
    await settle(root.fixture);
    await macrotask();
    await settle(scopedFixture);

    await expect(first).resolves.toBe(true);
    expect(dialogTitleText()).toBe('Scoped request');
    expect(confirmButton().textContent?.trim()).toBe('Scoped confirm');

    cancelButton().click();
    await settle(scopedFixture);
    await expect(second).resolves.toBe(false);
  });

  it('lets a custom cancel action replace the default action', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.confirm('Delete this project?', {
      action: { label: 'Delete project', variant: 'danger' },
      cancelAction: { label: 'Keep project', variant: 'default' },
    });
    await settle(fixture);

    const cancel = cancelButton();
    expect(cancel.textContent?.trim()).toBe('Keep project');
    expect(cancel.getAttribute('data-variant')).toBe('default');

    cancel.click();
    await settle(fixture);
    await expect(promise).resolves.toBe(false);
  });

  it('restores focus to the opener after the modal closes', async () => {
    const { fixture, host } = setup();
    const opener = query<HTMLButtonElement>(fixture.nativeElement, '#opener');
    let promise: Promise<boolean> | undefined;
    opener.addEventListener(
      'click',
      () => {
        promise = host.prompt.confirm('Confirm?');
      },
      { once: true },
    );

    // Safari-style pointer activation does not necessarily focus a button.
    opener.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    confirmButton().click();
    await settle(fixture);
    await promise;
    await animationFrame();

    expect(document.activeElement).toBe(opener);
  });

  it('renders plain generic action objects in order and resolves their values', async () => {
    const { fixture, host } = setup();
    const actions = [
      { value: 'save', label: 'Save and leave', variant: 'primary' },
      { value: 'discard', label: 'Discard changes', variant: 'danger' },
      {
        value: 'stay',
        label: 'Keep editing',
        variant: 'default',
        dismissEquivalent: true,
      },
    ] as const satisfies readonly HellPromptAction<'save' | 'discard' | 'stay'>[];

    const promise = host.prompt.choose<'save' | 'discard' | 'stay'>(
      { title: 'You have unsaved changes' },
      actions,
    );
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

  it('uses the dismiss-equivalent value and safe-focus policy for a generic choice', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.choose<'leave' | 'stay'>('Leave this page?', [
      { value: 'leave', label: 'Leave', variant: 'danger' },
      { value: 'stay', label: 'Stay', dismissEquivalent: true },
    ]);
    await settle(fixture);
    await animationFrame();

    expect(document.activeElement).toBe(dialogButtons()[1]);
    query(document.body, '[role="dialog"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toBe('stay');
  });

  it('resolves null on dismissal without a dismiss-equivalent action', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.choose('Pick one', [
      { value: 'a', label: 'A', variant: 'primary' },
      { value: 'b', label: 'B' },
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

  it('accepts undefined as an action value without treating it as dismissal', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.choose<undefined | 'dismissed'>('Choose undefined', [
      { value: undefined, label: 'Undefined' },
      { value: 'dismissed', label: 'Dismiss', dismissEquivalent: true },
    ]);
    await settle(fixture);

    dialogButtons()[0].click();
    await settle(fixture);
    await expect(promise).resolves.toBeUndefined();
  });

  it('preserves undefined when it is the dismiss-equivalent value', async () => {
    const { fixture, host } = setup();
    const promise = host.prompt.choose<undefined | 'save'>('Choose undefined', [
      { value: undefined, label: 'Dismiss', dismissEquivalent: true },
      { value: 'save', label: 'Save', variant: 'primary' },
    ]);
    await settle(fixture);

    query(document.body, '[role="dialog"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    await macrotask();
    await settle(fixture);

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects an empty action list and duplicate dismiss equivalents', () => {
    const { host } = setup();
    expect(() => host.prompt.choose('Empty', [])).toThrowError(/at least one/);
    expect(() =>
      host.prompt.choose('Twice', [
        { value: 'a', label: 'A', dismissEquivalent: true },
        { value: 'b', label: 'B', dismissEquivalent: true },
      ]),
    ).toThrowError(/at most one/);
  });
});

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<PromptHost>>;
  host: PromptHost;
} {
  const fixture = TestBed.createComponent(PromptHost);
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

function deferred(): { readonly promise: Promise<void>; resolve(): void } {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => (resolve = next));
  return { promise, resolve };
}
