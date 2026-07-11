import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpMenuTrigger } from 'ng-primitives/menu';

import { HELL_MENU_DIRECTIVES } from './menu';

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu>
        <button hellMenuItem type="button" [disabled]="disabled()">Button</button>
        <a hellMenuItem href="#anchor" [disabled]="disabled()">Anchor</a>
        <div hellMenuItem [disabled]="disabled()">Div</div>
      </div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="menu">Open</button>
  `,
})
class MenuHost {
  readonly disabled = signal(true);
  readonly trigger = viewChild.required(NgpMenuTrigger);
}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu ui="rounded-hell-pill bg-hell-primary">
        <button
          hellMenuItem
          type="button"
          [ui]="{ root: 'py-hell-5 text-hell-danger' }"
        >
          Rename
        </button>
        <button hellMenuItemCheckbox type="button" [checked]="true">
          <span hellMenuItemIndicator ui="text-hell-success-strong"></span>
          <span>Show archived</span>
        </button>
      </div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="menu">Open styled</button>
  `,
})
class MenuUiHost {
  readonly trigger = viewChild.required(NgpMenuTrigger);
}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <div #menuContainer></div>
    <ng-template #menu>
      <div hellMenu><button hellMenuItem type="button">Item</button></div>
    </ng-template>
    <a id="enabled-anchor" href="#menu" [hellMenuTrigger]="menu" [container]="menuContainer">
      Anchor
    </a>
  `,
})
class EnabledMenuAnchorTriggerHost {}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu><button hellMenuItem type="button">Item</button></div>
    </ng-template>
    <button id="disabled-button" type="button" [hellMenuTrigger]="menu" disabled>Button</button>
    <a id="disabled-anchor" href="#menu" [hellMenuTrigger]="menu" disabled>Anchor</a>
  `,
})
class DisabledMenuTriggerHost {}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu>
        <button
          hellMenuItemCheckbox
          type="button"
          [checked]="checked()"
          (checkedChange)="checked.set($event)"
        >
          <span hellMenuItemIndicator></span>
          <span>Show archived</span>
        </button>
        <div hellMenuItemRadioGroup [value]="density()" (valueChange)="density.set($event)">
          <button hellMenuItemRadio type="button" value="comfortable">
            <span hellMenuItemIndicator></span>
            <span>Comfortable</span>
          </button>
          <button hellMenuItemRadio type="button" value="compact">
            <span hellMenuItemIndicator></span>
            <span>Compact</span>
          </button>
        </div>
      </div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="menu">Preferences</button>
  `,
})
class CheckableMenuHost {
  readonly checked = signal(false);
  readonly density = signal('comfortable');
  readonly trigger = viewChild.required(NgpMenuTrigger);
}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #rootMenu>
      <div hellMenu>
        <button
          hellMenuItem
          type="button"
          data-testid="submenu-item"
          [hellSubmenuTrigger]="subMenu"
        >
          More
        </button>
      </div>
    </ng-template>
    <ng-template #subMenu>
      <div hellMenu><button hellMenuItem type="button">Child</button></div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="rootMenu">Open</button>
  `,
})
class SubmenuHost {
  readonly trigger = viewChild.required(NgpMenuTrigger);
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

describe('HellMenuItem', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MenuHost,
        MenuUiHost,
        EnabledMenuAnchorTriggerHost,
        DisabledMenuTriggerHost,
        CheckableMenuHost,
        SubmenuHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellMenu]');
  });

  it('reflects disabled trigger semantics on buttons and anchors', async () => {
    const fixture = TestBed.createComponent(DisabledMenuTriggerHost);
    await settle(fixture);

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#disabled-button');
    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#disabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
  });

  it('opens from enabled anchor trigger and prevents default navigation', async () => {
    const fixture = TestBed.createComponent(EnabledMenuAnchorTriggerHost);
    await settle(fixture);

    const trigger = query<HTMLAnchorElement>(fixture.nativeElement, '#enabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(trigger.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);

    const menuItem = await waitForOverlayElement<HTMLButtonElement>(
      fixture,
      fixture.nativeElement,
      'button[hellMenuItem]',
    );
    expect(menuItem).toBeTruthy();
    expect(menuItem.textContent).toBe('Item');
  });

  it('merges local root part styles while preserving menu item state attributes', async () => {
    const fixture = TestBed.createComponent(MenuUiHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    const menu = await waitForOverlayElement<HTMLElement>(fixture, document.body, '[hellMenu]');
    const item = query<HTMLButtonElement>(menu, 'button[hellMenuItem]');
    const checkbox = query<HTMLButtonElement>(menu, 'button[hellMenuItemCheckbox]');
    const indicator = query<HTMLElement>(menu, '[hellMenuItemIndicator]');

    expect(menu.getAttribute('data-slot')).toBe('root');
    expect(menu.className).toContain('rounded-hell-pill');
    expect(menu.className).not.toContain('rounded-hell-md');
    expect(menu.className).toContain('bg-hell-primary');

    expect(item.getAttribute('data-slot')).toBe('root');
    expect(item.className).toContain('py-hell-5');
    expect(item.className).toContain('text-hell-danger');

    expect(checkbox.getAttribute('data-slot')).toBe('root');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(indicator.getAttribute('data-slot')).toBe('root');
    expect(indicator.getAttribute('data-checked')).toBe('');
    expect(indicator.className).toContain('text-hell-success-strong');
  });

  it('keeps checkbox and radio menu items open while updating checked state', async () => {
    const fixture = TestBed.createComponent(CheckableMenuHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    const checkbox = await waitForOverlayElement<HTMLButtonElement>(
      fixture,
      document.body,
      '[role="menuitemcheckbox"]',
    );
    const compact = query<HTMLButtonElement>(
      document.body,
      '[role="menuitemradio"][value="compact"]',
    );

    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(compact.getAttribute('aria-checked')).toBe('false');

    checkbox.click();
    await settle(fixture);

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();

    compact.click();
    await settle(fixture);

    expect(fixture.componentInstance.density()).toBe('compact');
    expect(compact.getAttribute('aria-checked')).toBe('true');
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();
  });

  it('moves focus by printable-key typeahead and cycles repeated initials', async () => {
    const fixture = TestBed.createComponent(CheckableMenuHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    const checkbox = await waitForOverlayElement<HTMLButtonElement>(
      fixture,
      document.body,
      '[role="menuitemcheckbox"]',
    );
    const comfortable = query<HTMLButtonElement>(
      document.body,
      '[role="menuitemradio"][value="comfortable"]',
    );
    const compact = query<HTMLButtonElement>(
      document.body,
      '[role="menuitemradio"][value="compact"]',
    );

    checkbox.focus();
    const first = new KeyboardEvent('keydown', {
      key: 'c',
      bubbles: true,
      cancelable: true,
    });
    checkbox.dispatchEvent(first);

    expect(first.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(comfortable);

    const repeated = new KeyboardEvent('keydown', {
      key: 'c',
      bubbles: true,
      cancelable: true,
    });
    comfortable.dispatchEvent(repeated);

    expect(repeated.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(compact);
  });

  it('joins the browser top-most rendering context when the Popover API exists', async () => {
    // Overlay panes (e.g. the Omnibar panel through CDK) render via the
    // Popover API and paint above all z-indexed content; menus must join the
    // same context so a menu opened from such a pane paints above it.
    const showPopover = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });

    try {
      const fixture = TestBed.createComponent(MenuHost);
      await settle(fixture);

      fixture.componentInstance.trigger().show();
      const menu = await waitForOverlayElement<HTMLElement>(fixture, document.body, '[hellMenu]');

      expect(menu.getAttribute('popover')).toBe('manual');
      expect(showPopover).toHaveBeenCalled();
    } finally {
      delete (HTMLElement.prototype as { showPopover?: () => void }).showPopover;
    }
  });

  it('marks property-bound submenu triggers with a static styling hook', async () => {
    const fixture = TestBed.createComponent(SubmenuHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    const item = await waitForOverlayElement<HTMLButtonElement>(
      fixture,
      document.body,
      '[data-testid="submenu-item"]',
    );

    // `[hellSubmenuTrigger]="tpl"` is a property binding, so no selector
    // attribute lands in the DOM. The static marker is what the stylesheet
    // keys the submenu chevron on — without it the chevron disappears.
    expect(item.hasAttribute('data-hell-submenu-trigger')).toBe(true);
    expect(item.getAttribute('aria-haspopup')).toBe('true');
  });

  it('guards disabled non-native menu items', async () => {
    const fixture = TestBed.createComponent(MenuHost);
    await settle(fixture);

    fixture.componentInstance.trigger().show();
    await waitForOverlayElement<HTMLButtonElement>(fixture, document.body, 'button[hellMenuItem]');

    const button = query<HTMLButtonElement>(document.body, 'button[hellMenuItem]');
    const anchor = query<HTMLAnchorElement>(document.body, 'a[hellMenuItem]');
    const div = query<HTMLDivElement>(document.body, 'div[hellMenuItem]');
    const anchorClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const divKey = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(div.getAttribute('aria-disabled')).toBe('true');

    expect(anchor.dispatchEvent(anchorClick)).toBe(false);
    expect(anchorClick.defaultPrevented).toBe(true);
    expect(div.dispatchEvent(divKey)).toBe(false);
    expect(divKey.defaultPrevented).toBe(true);
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

async function waitForOverlayElement<T extends HTMLElement>(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  root: ParentNode,
  selector: string,
): Promise<T> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const element = queryOptional<T>(root, selector);
    if (element) {
      return element;
    }
    await nextFrame();
    fixture.detectChanges();
  }

  throw new Error(`Expected ${selector}.`);
}

async function nextFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }

  await Promise.resolve();
}

function queryOptional<T extends HTMLElement>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of Array.from(document.body.querySelectorAll(selector))) {
    element.remove();
  }
}
