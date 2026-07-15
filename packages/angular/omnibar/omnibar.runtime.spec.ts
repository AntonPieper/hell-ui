import { TestBed } from '@angular/core/testing';

import {
  HellOmnibarActiveItemController,
  type HellOmnibarActiveItemOption,
} from './omnibar.active-item';
import {
  HellOmnibarRuntime,
  type HellOmnibarActionRegistration,
  type HellOmnibarItemRegistration,
} from './omnibar.runtime';

describe('HellOmnibarRuntime', () => {
  it('keeps item and action registration behind the package-local runtime', () => {
    TestBed.configureTestingModule({ providers: [HellOmnibarRuntime] });
    const runtime = TestBed.inject(HellOmnibarRuntime);
    const alpha = omnibarRegistration('alpha');
    const action: HellOmnibarActionRegistration = { focus: vi.fn() };

    runtime.registerItem(alpha);
    runtime.registerAction(action);

    expect(runtime.items()).toEqual([alpha]);
    expect(runtime.actionItems()).toEqual([action]);
    expect(runtime.hasActions()).toBe(true);

    runtime.unregisterItem(alpha);
    runtime.unregisterAction(action);

    expect(runtime.items()).toEqual([]);
    expect(runtime.actionItems()).toEqual([]);
    expect(runtime.hasActions()).toBe(false);
  });

  it('moves through enabled items and keeps scrolling inside the item registration', () => {
    TestBed.configureTestingModule({ providers: [HellOmnibarRuntime] });
    const runtime = TestBed.inject(HellOmnibarRuntime);
    const disabled = omnibarRegistration('disabled', true);
    const alpha = omnibarRegistration('alpha');
    const beta = omnibarRegistration('beta');

    runtime.registerItem(disabled);
    runtime.registerItem(alpha);
    runtime.registerItem(beta);

    expect(runtime.activeItem()).toBe(alpha);
    runtime.moveActive(1);

    expect(runtime.activeItem()).toBe(beta);
    expect(beta.scrollIntoView).toHaveBeenCalledOnce();
    expect(disabled.scrollIntoView).not.toHaveBeenCalled();
  });

  it('wraps registered action focus without exposing action methods on HellOmnibar', () => {
    TestBed.configureTestingModule({ providers: [HellOmnibarRuntime] });
    const runtime = TestBed.inject(HellOmnibarRuntime);
    const first: HellOmnibarActionRegistration = { focus: vi.fn() };
    const second: HellOmnibarActionRegistration = { focus: vi.fn() };
    runtime.registerAction(first);
    runtime.registerAction(second);

    runtime.focusAdjacentAction(first, -1);
    runtime.focusAdjacentAction(second, 1);

    expect(first.focus).toHaveBeenCalledOnce();
    expect(second.focus).toHaveBeenCalledOnce();
  });
});

describe('HellOmnibarActiveItemController', () => {
  const controller = new HellOmnibarActiveItemController<TestOmnibarActiveItem>();

  it('projects active state through enabled items only', () => {
    const disabled = omnibarItem('disabled', true);
    const alpha = omnibarItem('alpha');
    const beta = omnibarItem('beta');
    const snapshot = { items: [disabled, alpha, beta], activeIndex: 99 };

    expect(controller.activeIndex(snapshot)).toBe(1);
    expect(controller.activeItem(snapshot)).toBe(beta);
    expect(controller.first(snapshot)).toBe(0);
    expect(controller.last(snapshot)).toBe(1);
  });

  it('wraps keyboard movement across enabled items', () => {
    const alpha = omnibarItem('alpha');
    const disabled = omnibarItem('disabled', true);
    const beta = omnibarItem('beta');
    const items = [alpha, disabled, beta];

    expect(controller.move({ items, activeIndex: 0 }, -1)).toEqual({
      activeIndex: 1,
      item: beta,
    });
    expect(controller.move({ items, activeIndex: 1 }, 1)).toEqual({
      activeIndex: 0,
      item: alpha,
    });
  });

  it('does not activate disabled or unregistered items', () => {
    const alpha = omnibarItem('alpha');
    const disabled = omnibarItem('disabled', true);
    const beta = omnibarItem('beta');
    const unregistered = omnibarItem('unregistered');
    const snapshot = { items: [alpha, disabled, beta], activeIndex: 0 };

    expect(controller.setActive(snapshot, disabled)).toBe(0);
    expect(controller.setActive(snapshot, unregistered)).toBe(0);
    expect(controller.setActive(snapshot, beta)).toBe(1);
  });

  it('leaves empty item lists inert', () => {
    const snapshot = { items: [], activeIndex: 4 };

    expect(controller.activeIndex(snapshot)).toBe(-1);
    expect(controller.activeItem(snapshot)).toBeNull();
    expect(controller.move(snapshot, 1)).toEqual({ activeIndex: 4, item: null });
    expect(controller.first(snapshot)).toBe(4);
    expect(controller.last(snapshot)).toBe(4);
  });
});

interface TestOmnibarActiveItem extends HellOmnibarActiveItemOption {
  readonly id: string;
}

function omnibarItem(id: string, disabled = false): TestOmnibarActiveItem {
  return {
    id,
    disabled: () => disabled,
  };
}

function omnibarRegistration(id: string, disabled = false): HellOmnibarItemRegistration {
  return {
    itemId: id,
    closeOnSelect: () => true,
    disabled: () => disabled,
    selectValue: () => id,
    scrollIntoView: vi.fn(),
  };
}
