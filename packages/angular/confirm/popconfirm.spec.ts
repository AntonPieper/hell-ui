import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellButton } from '@hell-ui/angular/button';

import {
  hellCountdownAction,
  hellDestructiveAction,
  injectHellPopconfirm,
  provideHellConfirmLabels,
} from './confirm';

const POPCONFIRM_TEST_TIMEOUT_MS = 15000;
const POPCONFIRM_TEST_CASE_TIMEOUT_MS = 30000;

beforeAll(() => {
  const elementPrototype = Element.prototype as Element & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
});

@Component({
  selector: 'hell-popconfirm-host',
  imports: [HellButton],
  template: `
    <button id="anchor-a" hellButton variant="danger" type="button">Delete A</button>
    <button id="anchor-b" hellButton type="button">Delete B</button>
    <button id="outside" type="button">Outside</button>
  `,
})
class PopconfirmHost {
  readonly popconfirm = injectHellPopconfirm();
}

describe('injectHellPopconfirm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PopconfirmHost] }).compileComponents();
  });

  afterEach(() => {
    for (const element of Array.from(document.body.querySelectorAll('hell-popconfirm-panel'))) {
      element.remove();
    }
  });

  it(
    'resolves true and closes when the confirm button is clicked',
    async () => {
      const { fixture, host } = setup();
      const promise = host.popconfirm(
        anchor(fixture, '#anchor-a'),
        'Delete this row?',
        hellDestructiveAction('Delete'),
      );
      const panel = await waitForPanel(fixture);
      expect(panel.textContent).toContain('Delete this row?');

      confirmButton(panel).click();
      await waitForNoPanel(fixture);

      await expect(promise).resolves.toBe(true);
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'resolves false and closes when the cancel button is clicked',
    async () => {
      const { fixture, host } = setup();
      const promise = host.popconfirm(
        anchor(fixture, '#anchor-a'),
        'Delete this row?',
        hellDestructiveAction('Delete'),
      );
      const panel = await waitForPanel(fixture);

      cancelButton(panel).click();
      await waitForNoPanel(fixture);

      await expect(promise).resolves.toBe(false);
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'names the panel from the prompt and links the description',
    async () => {
      const { fixture, host } = setup();
      void host.popconfirm(anchor(fixture, '#anchor-a'), {
        title: 'Delete this row?',
        description: 'This cannot be undone.',
      });
      const panel = await waitForPanel(fixture);

      const labelledBy = panel.getAttribute('aria-labelledby') ?? '';
      const describedBy = panel.getAttribute('aria-describedby') ?? '';
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(document.getElementById(labelledBy)?.textContent?.trim()).toBe('Delete this row?');
      expect(document.getElementById(describedBy)?.textContent?.trim()).toBe(
        'This cannot be undone.',
      );
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'uses the destructive variant for destructive actions',
    async () => {
      const { fixture, host } = setup();
      void host.popconfirm(
        anchor(fixture, '#anchor-a'),
        'Delete this row?',
        hellDestructiveAction('Delete'),
      );
      const panel = await waitForPanel(fixture);

      expect(confirmButton(panel).getAttribute('data-variant')).toBe('danger');
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'gates a countdown action without auto-confirming',
    async () => {
      const { fixture, host } = setup();
      let resolved = false;
      const promise = host.popconfirm(
        anchor(fixture, '#anchor-a'),
        'Reset this device?',
        hellCountdownAction(1, hellDestructiveAction('Reset')),
      );
      void promise.then(() => (resolved = true));
      const panel = await waitForPanel(fixture);

      const confirm = confirmButton(panel);
      expect(confirm.disabled).toBe(true);
      expect(confirm.textContent).toContain('(1)');

      await delay(1150);
      await settle(fixture);

      expect(confirm.disabled).toBe(false);
      expect(resolved).toBe(false); // countdown enables only — it never auto-confirms

      confirm.click();
      await waitForNoPanel(fixture);
      await expect(promise).resolves.toBe(true);
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'enforces a single open popconfirm — opening one resolves the other false',
    async () => {
      const { fixture, host } = setup();
      const first = host.popconfirm(anchor(fixture, '#anchor-a'), 'First row?');
      await waitForPanel(fixture);

      const second = host.popconfirm(anchor(fixture, '#anchor-b'), 'Second row?');
      await waitForPanelText(fixture, 'Second row?');

      expect(document.body.querySelectorAll('hell-popconfirm-panel')).toHaveLength(1);
      await expect(first).resolves.toBe(false);

      confirmButton(query(document.body, 'hell-popconfirm-panel')).click();
      await waitForNoPanel(fixture);
      await expect(second).resolves.toBe(true);
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );

  it(
    'applies Label Contract defaults to the action and cancel labels',
    async () => {
      TestBed.configureTestingModule({
        providers: [provideHellConfirmLabels({ confirm: 'Ja', cancel: 'Nein' })],
      });
      const { fixture, host } = setup();

      void host.popconfirm(anchor(fixture, '#anchor-a'), 'Are you sure?');
      const panel = await waitForPanel(fixture);

      expect(confirmButton(panel).textContent?.trim()).toBe('Ja');
      expect(confirmButton(panel).getAttribute('data-variant')).toBe('primary');
      expect(cancelButton(panel).textContent?.trim()).toBe('Nein');
    },
    POPCONFIRM_TEST_CASE_TIMEOUT_MS,
  );
});

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<PopconfirmHost>>;
  host: PopconfirmHost;
} {
  const fixture = TestBed.createComponent(PopconfirmHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance };
}

function anchor(
  fixture: { nativeElement: HTMLElement },
  selector: string,
): HTMLButtonElement {
  return query<HTMLButtonElement>(fixture.nativeElement, selector);
}

function confirmButton(panel: HTMLElement): HTMLButtonElement {
  return panelButton(panel, 'primary', 'danger');
}

function cancelButton(panel: HTMLElement): HTMLButtonElement {
  return panelButton(panel, 'ghost');
}

function panelButton(panel: HTMLElement, ...variants: string[]): HTMLButtonElement {
  for (const variant of variants) {
    const button = panel.querySelector<HTMLButtonElement>(`button[data-variant="${variant}"]`);
    if (button) return button;
  }
  throw new Error(`Expected a panel button with variant ${variants.join(' or ')}.`);
}

async function waitForPanel(fixture: {
  detectChanges(): void;
}): Promise<HTMLElement> {
  const timeout = Date.now() + POPCONFIRM_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    const panel = document.body.querySelector<HTMLElement>('hell-popconfirm-panel');
    if (panel) return panel;
    await nextFrame();
  }
  throw new Error('Expected a popconfirm panel to be shown.');
}

async function waitForPanelText(
  fixture: { detectChanges(): void },
  text: string,
): Promise<void> {
  const timeout = Date.now() + POPCONFIRM_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    const panels = Array.from(document.body.querySelectorAll('hell-popconfirm-panel'));
    if (panels.length === 1 && panels[0].textContent?.includes(text)) return;
    await nextFrame();
  }
  throw new Error(`Expected exactly one popconfirm panel containing ${text}.`);
}

async function waitForNoPanel(fixture: { detectChanges(): void }): Promise<void> {
  const timeout = Date.now() + POPCONFIRM_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (!document.body.querySelector('hell-popconfirm-panel')) return;
    await nextFrame();
  }
  throw new Error('Expected the popconfirm panel to close.');
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
