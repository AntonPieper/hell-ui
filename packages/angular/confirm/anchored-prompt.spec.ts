import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellButton } from '@hell-ui/angular/button';
import { provideHellLabels } from '@hell-ui/angular/core';

import {
  HELL_FLOATING_SCOPE,
  type HellFloatingScope,
} from '../internal/core/floating-scope';
import { HELL_CONFIRM_LABELS, injectHellPrompt } from './confirm';

const ANCHORED_PROMPT_TEST_TIMEOUT_MS = 15_000;
const ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS = 30_000;

beforeAll(() => {
  const elementPrototype = Element.prototype as Element & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
});

@Component({
  selector: 'hell-anchored-prompt-host',
  imports: [HellButton],
  template: `
    <button id="anchor-a" hellButton variant="danger" type="button">Delete A</button>
    <button id="anchor-b" hellButton type="button">Delete B</button>
    <button id="outside" type="button">Outside</button>
  `,
})
class AnchoredPromptHost {
  readonly prompt = injectHellPrompt();
}

@Injectable()
class FakeFloatingScope implements HellFloatingScope {
  readonly registered = new Set<HTMLElement>();

  registerFloatingElement(element: HTMLElement): void {
    this.registered.add(element);
  }

  unregisterFloatingElement(element: HTMLElement): void {
    this.registered.delete(element);
  }

  containsFloatingTarget(target: EventTarget | Node | null): boolean {
    return Array.from(this.registered).some(
      (element) => target instanceof Node && element.contains(target),
    );
  }
}

@Component({
  selector: 'hell-scoped-anchored-prompt-host',
  imports: [HellButton],
  providers: [
    FakeFloatingScope,
    { provide: HELL_FLOATING_SCOPE, useExisting: FakeFloatingScope },
    provideHellLabels(HELL_CONFIRM_LABELS, {
      confirm: 'Scoped confirm',
      cancel: 'Scoped cancel',
    }),
  ],
  template: `<button id="scoped-anchor" hellButton type="button">Scoped anchor</button>`,
})
class ScopedAnchoredPromptHost {
  readonly prompt = injectHellPrompt();
}

describe('HellPrompt anchored presentation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnchoredPromptHost, ScopedAnchoredPromptHost],
    }).compileComponents();
  });

  afterEach(() => {
    for (const element of Array.from(document.body.querySelectorAll('hell-anchored-prompt'))) {
      element.remove();
    }
  });

  it(
    'resolves true when the confirm action is clicked',
    async () => {
      const { fixture, host } = setup();
      const promise = host.prompt.confirm('Delete this row?', {
        anchor: anchor(fixture, '#anchor-a'),
        action: { label: 'Delete', variant: 'danger' },
      });
      const panel = await waitForPanel(fixture);
      expect(panel.textContent).toContain('Delete this row?');

      actionButton(panel, 'Delete').click();
      await waitForNoPanel(fixture);

      await expect(promise).resolves.toBe(true);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'resolves false when the cancel action is clicked',
    async () => {
      const { fixture, host } = setup();
      const promise = host.prompt.confirm('Delete this row?', {
        anchor: anchor(fixture, '#anchor-a'),
        action: { label: 'Delete', variant: 'danger' },
      });
      const panel = await waitForPanel(fixture);

      actionButton(panel, 'Cancel').click();
      await waitForNoPanel(fixture);

      await expect(promise).resolves.toBe(false);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'names the panel from the prompt and links the description',
    async () => {
      const { fixture, host } = setup();
      void host.prompt.confirm(
        { title: 'Delete this row?', description: 'This cannot be undone.' },
        { anchor: anchor(fixture, '#anchor-a') },
      );
      const panel = await waitForPanel(fixture);

      const labelledBy = panel.getAttribute('aria-labelledby') ?? '';
      const describedBy = panel.getAttribute('aria-describedby') ?? '';
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(document.getElementById(labelledBy)?.textContent?.trim()).toBe('Delete this row?');
      expect(document.getElementById(describedBy)?.textContent?.trim()).toBe(
        'This cannot be undone.',
      );

      actionButton(panel, 'Cancel').click();
      await waitForNoPanel(fixture);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'uses placement and focuses a safe action instead of a danger action',
    async () => {
      const { fixture, host } = setup();
      void host.prompt.confirm('Delete this row?', {
        anchor: anchor(fixture, '#anchor-a'),
        placement: 'bottom-start',
        action: { label: 'Delete', variant: 'danger' },
      });
      const panel = await waitForPanel(fixture);
      await nextFrame();

      expect(actionButton(panel, 'Delete').getAttribute('data-variant')).toBe('danger');
      expect(document.activeElement).toBe(actionButton(panel, 'Cancel'));
      expect(panel.getAttribute('data-placement')).toBe('bottom-start');

      actionButton(panel, 'Cancel').click();
      await waitForNoPanel(fixture);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'gates a countdown action without auto-confirming',
    async () => {
      const { fixture, host } = setup();
      let resolved = false;
      const promise = host.prompt.confirm('Reset this device?', {
        anchor: anchor(fixture, '#anchor-a'),
        action: { label: 'Reset', variant: 'danger', countdownSeconds: 1 },
      });
      void promise.then(() => (resolved = true));
      const panel = await waitForPanel(fixture);

      const confirm = actionButton(panel, /Reset/);
      expect(confirm.disabled).toBe(true);
      expect(confirm.textContent).toContain('(1)');

      await delay(1150);
      await settle(fixture);

      expect(confirm.disabled).toBe(false);
      expect(resolved).toBe(false);

      confirm.click();
      await waitForNoPanel(fixture);
      await expect(promise).resolves.toBe(true);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'enforces one anchored prompt and resolves the displaced request by dismissal policy',
    async () => {
      const { fixture, host } = setup();
      const first = host.prompt.choose<'first' | 'stay'>('First row?', [
        { value: 'first', label: 'First' },
        { value: 'stay', label: 'Stay', dismissEquivalent: true },
      ], { anchor: anchor(fixture, '#anchor-a') });
      await waitForPanel(fixture);

      const second = host.prompt.confirm('Second row?', {
        anchor: anchor(fixture, '#anchor-b'),
      });
      await waitForPanelText(fixture, 'Second row?');

      expect(document.body.querySelectorAll('hell-anchored-prompt')).toHaveLength(1);
      await expect(first).resolves.toBe('stay');

      actionButton(query(document.body, 'hell-anchored-prompt'), 'Confirm').click();
      await waitForNoPanel(fixture);
      await expect(second).resolves.toBe(true);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'supports generic anchored choices and resolves their typed value',
    async () => {
      const { fixture, host } = setup();
      const promise = host.prompt.choose<'save' | 'discard' | 'stay'>(
        'Unsaved changes',
        [
          { value: 'save', label: 'Save', variant: 'primary' },
          { value: 'discard', label: 'Discard', variant: 'danger' },
          { value: 'stay', label: 'Stay', dismissEquivalent: true },
        ],
        { anchor: anchor(fixture, '#anchor-a'), placement: 'bottom-end' },
      );
      const panel = await waitForPanel(fixture);

      expect(panelButtons(panel).map((button) => button.textContent?.trim())).toEqual([
        'Save',
        'Discard',
        'Stay',
      ]);
      actionButton(panel, 'Save').click();
      await waitForNoPanel(fixture);

      await expect(promise).resolves.toBe('save');
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'resolves dismissal and restores focus after Escape and outside click',
    async () => {
      const { fixture, host } = setup();
      const opener = anchor(fixture, '#anchor-a');
      opener.focus();
      const escapePromise = host.prompt.confirm('Escape?', { anchor: opener });
      const escapePanel = await waitForPanel(fixture);

      escapePanel.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await waitForNoPanel(fixture);
      await expect(escapePromise).resolves.toBe(false);
      await nextFrame();
      expect(document.activeElement).toBe(opener);

      const outsidePromise = host.prompt.confirm('Outside?', { anchor: opener });
      await waitForPanel(fixture);
      const outside = anchor(fixture, '#outside');
      outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));
      await waitForNoPanel(fixture);

      await expect(outsidePromise).resolves.toBe(false);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'preserves caller-scoped labels and Floating Scope registration',
    async () => {
      const fixture = TestBed.createComponent(ScopedAnchoredPromptHost);
      fixture.detectChanges();
      const scope = fixture.debugElement.injector.get(FakeFloatingScope);

      void fixture.componentInstance.prompt.confirm('Scoped?', {
        anchor: anchor(fixture, '#scoped-anchor'),
      });
      const panel = await waitForPanel(fixture);

      expect(actionButton(panel, 'Scoped confirm')).toBeTruthy();
      expect(actionButton(panel, 'Scoped cancel')).toBeTruthy();
      expect(scope.registered.has(panel)).toBe(true);

      actionButton(panel, 'Scoped cancel').click();
      await waitForNoPanel(fixture);
      expect(scope.registered.has(panel)).toBe(false);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'resolves dismissal when its caller is destroyed before deferred presentation',
    async () => {
      const destroyed = setup();
      const promise = destroyed.host.prompt.confirm('Never mounted', {
        anchor: anchor(destroyed.fixture, '#anchor-a'),
      });
      let result: boolean | 'unresolved' = 'unresolved';
      void promise.then((value) => (result = value));

      destroyed.fixture.destroy();
      await Promise.resolve();
      const resultImmediatelyAfterDestroy = result;

      const later = setup();
      const laterPromise = later.host.prompt.confirm('Later anchored prompt', {
        anchor: anchor(later.fixture, '#anchor-b'),
      });
      const panel = await waitForPanel(later.fixture);
      actionButton(panel, 'Confirm').click();
      await waitForNoPanel(later.fixture);

      expect(resultImmediatelyAfterDestroy).toBe(false);
      await expect(promise).resolves.toBe(false);
      await expect(laterPromise).resolves.toBe(true);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'resolves dismissal when its caller is destroyed after presentation',
    async () => {
      const destroyed = setup();
      const promise = destroyed.host.prompt.confirm('Mounted before destroy', {
        anchor: anchor(destroyed.fixture, '#anchor-a'),
      });
      let result: boolean | 'unresolved' = 'unresolved';
      void promise.then((value) => (result = value));
      await waitForPanel(destroyed.fixture);

      destroyed.fixture.destroy();
      await Promise.resolve();
      await nextFrame();
      const resultImmediatelyAfterDestroy = result;

      const later = setup();
      const laterPromise = later.host.prompt.confirm('After mounted destroy', {
        anchor: anchor(later.fixture, '#anchor-b'),
      });
      const panel = await waitForPanel(later.fixture);
      actionButton(panel, 'Confirm').click();
      await waitForNoPanel(later.fixture);

      expect(resultImmediatelyAfterDestroy).toBe(false);
      await expect(promise).resolves.toBe(false);
      await expect(laterPromise).resolves.toBe(true);
    },
    ANCHORED_PROMPT_TEST_CASE_TIMEOUT_MS,
  );
});

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<AnchoredPromptHost>>;
  host: AnchoredPromptHost;
} {
  const fixture = TestBed.createComponent(AnchoredPromptHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance };
}

function anchor(
  fixture: { nativeElement: HTMLElement },
  selector: string,
): HTMLButtonElement {
  return query<HTMLButtonElement>(fixture.nativeElement, selector);
}

function actionButton(panel: HTMLElement, name: string | RegExp): HTMLButtonElement {
  const button = panelButtons(panel).find((candidate) => {
    const label = candidate.textContent?.trim() ?? '';
    return typeof name === 'string' ? label === name : name.test(label);
  });
  if (!button) throw new Error(`Expected an anchored prompt button named ${String(name)}.`);
  return button;
}

function panelButtons(panel: HTMLElement): HTMLButtonElement[] {
  return Array.from(panel.querySelectorAll<HTMLButtonElement>('button[data-variant]'));
}

async function waitForPanel(fixture: { detectChanges(): void }): Promise<HTMLElement> {
  const timeout = Date.now() + ANCHORED_PROMPT_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    const panel = document.body.querySelector<HTMLElement>('hell-anchored-prompt');
    if (panel) return panel;
    await nextFrame();
  }
  throw new Error('Expected an anchored prompt to be shown.');
}

async function waitForPanelText(
  fixture: { detectChanges(): void },
  text: string,
): Promise<void> {
  const timeout = Date.now() + ANCHORED_PROMPT_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    const panels = Array.from(document.body.querySelectorAll('hell-anchored-prompt'));
    if (panels.length === 1 && panels[0].textContent?.includes(text)) return;
    await nextFrame();
  }
  throw new Error(`Expected exactly one anchored prompt containing ${text}.`);
}

async function waitForNoPanel(fixture: { detectChanges(): void }): Promise<void> {
  const timeout = Date.now() + ANCHORED_PROMPT_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (!document.body.querySelector('hell-anchored-prompt')) return;
    await nextFrame();
  }
  throw new Error('Expected the anchored prompt to close.');
}

async function settle(fixture: { detectChanges(): void }): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  await nextFrame();
  fixture.detectChanges();
}

async function nextFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  await Promise.resolve();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
