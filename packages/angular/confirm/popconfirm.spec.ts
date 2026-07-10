import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellButton } from '@hell-ui/angular/button';

import { HELL_CONFIRM_LABELS, HellPopconfirm, HellPopconfirmPanel, provideHellConfirmLabels } from './confirm';

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
  imports: [HellButton, HellPopconfirm, HellPopconfirmPanel],
  template: `
    <button
      id="trigger-a"
      hellButton
      variant="danger"
      [hellPopconfirm]="panelA"
      [container]="container"
      (confirmed)="events.push('confirmed-a')"
      (dismissed)="events.push('dismissed-a')"
    >
      Delete A
    </button>
    <ng-template #panelA>
      <hell-popconfirm-panel
        [message]="message"
        [severity]="severity"
        [confirmLabel]="confirmLabel"
        [cancelLabel]="cancelLabel"
      />
    </ng-template>

    <button
      id="trigger-b"
      hellButton
      [hellPopconfirm]="panelB"
      [container]="container"
      (confirmed)="events.push('confirmed-b')"
      (dismissed)="events.push('dismissed-b')"
    >
      Delete B
    </button>
    <ng-template #panelB>
      <hell-popconfirm-panel message="Second row?" />
    </ng-template>

    <button id="outside" type="button">Outside</button>
    <div id="popconfirm-container" #container></div>
  `,
})
class PopconfirmHost {
  readonly events: string[] = [];
  message: string | undefined = 'Delete this row?';
  severity: 'default' | 'danger' = 'danger';
  confirmLabel: string | undefined;
  cancelLabel: string | undefined;
}

describe('HellPopconfirm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PopconfirmHost] }).compileComponents();
  });

  afterEach(() => {
    for (const element of Array.from(document.body.querySelectorAll('hell-popconfirm-panel'))) {
      element.remove();
    }
  });

  it('emits confirmed and closes when the confirm button is clicked', async () => {
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#trigger-a');
    trigger.click();
    const panel = await waitForPanel(fixture);
    expect(panel.textContent).toContain('Delete this row?');

    confirmButton(panel).click();
    await waitForNoPanel(fixture);

    expect(fixture.componentInstance.events).toEqual(['confirmed-a']);
  }, POPCONFIRM_TEST_CASE_TIMEOUT_MS);

  it('emits dismissed and closes when the cancel button is clicked', async () => {
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#trigger-a');
    trigger.click();
    const panel = await waitForPanel(fixture);

    cancelButton(panel).click();
    await waitForNoPanel(fixture);

    expect(fixture.componentInstance.events).toEqual(['dismissed-a']);
  }, POPCONFIRM_TEST_CASE_TIMEOUT_MS);

  it('uses the destructive variant for danger severity', async () => {
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture.nativeElement, '#trigger-a').click();
    const panel = await waitForPanel(fixture);

    expect(confirmButton(panel).getAttribute('data-variant')).toBe('danger');
  }, POPCONFIRM_TEST_CASE_TIMEOUT_MS);

  it('enforces a single open popconfirm — opening one dismisses another', async () => {
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture.nativeElement, '#trigger-a').click();
    await waitForPanel(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '#trigger-b').click();
    await waitForPanelText(fixture, 'Second row?');

    expect(document.body.querySelectorAll('hell-popconfirm-panel')).toHaveLength(1);
    expect(fixture.componentInstance.events).toContain('dismissed-a');
    expect(fixture.componentInstance.events).not.toContain('confirmed-a');
  }, POPCONFIRM_TEST_CASE_TIMEOUT_MS);

  it('applies per-panel label overrides and Label Contract defaults', async () => {
    TestBed.configureTestingModule({
      providers: [provideHellConfirmLabels({ confirm: 'Ja', cancel: 'Nein' })],
    });
    const fixture = TestBed.createComponent(PopconfirmHost);
    fixture.componentInstance.severity = 'default';
    fixture.componentInstance.message = undefined; // exercise the default message label
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture.nativeElement, '#trigger-a').click();
    const panel = await waitForPanel(fixture);

    expect(panel.textContent).toContain('Are you sure?');
    expect(confirmButton(panel).textContent?.trim()).toBe('Ja');
    expect(cancelButton(panel).textContent?.trim()).toBe('Nein');
    expect(TestBed.inject(HELL_CONFIRM_LABELS).popconfirmMessage).toBe('Are you sure?');
  }, POPCONFIRM_TEST_CASE_TIMEOUT_MS);
});

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
  whenStable(): Promise<unknown>;
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
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
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

async function waitForNoPanel(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}): Promise<void> {
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

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
