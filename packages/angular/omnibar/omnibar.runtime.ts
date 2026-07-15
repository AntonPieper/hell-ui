import { Injectable, computed, signal } from '@angular/core';

import {
  HellOmnibarActiveItemController,
  type HellOmnibarActiveItemSnapshot,
} from './omnibar.active-item';

export interface HellOmnibarItemRegistration {
  readonly itemId: string;
  readonly closeOnSelect: () => boolean;
  readonly disabled: () => boolean;
  readonly selectValue: () => unknown;
  readonly scrollIntoView: () => void;
}

export interface HellOmnibarActionRegistration {
  readonly focus: () => void;
}

/** Package-local registry and keyboard-navigation runtime for HellOmnibar. */
@Injectable()
export class HellOmnibarRuntime {
  readonly items = signal<HellOmnibarItemRegistration[]>([]);
  readonly actionItems = signal<HellOmnibarActionRegistration[]>([]);

  private readonly activeItemController =
    new HellOmnibarActiveItemController<HellOmnibarItemRegistration>();
  private readonly activeIndexState = signal(0);

  readonly activeIndex = computed(() =>
    this.activeItemController.activeIndex(this.activeSnapshot()),
  );
  readonly activeItemId = computed(() => this.activeItem()?.itemId ?? null);
  readonly hasActions = computed(() => this.actionItems().length > 0);

  resetActive(): void {
    this.activeIndexState.set(this.activeItemController.reset());
  }

  registerItem(item: HellOmnibarItemRegistration): void {
    this.items.update((list) => [...list, item]);
  }

  unregisterItem(item: HellOmnibarItemRegistration): void {
    this.items.update((list) => list.filter((registered) => registered !== item));
  }

  setActive(item: HellOmnibarItemRegistration): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.setActive(snapshot, item);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  isActive(item: HellOmnibarItemRegistration): boolean {
    return this.activeItem() === item;
  }

  activeItem(): HellOmnibarItemRegistration | null {
    return this.activeItemController.activeItem(this.activeSnapshot());
  }

  moveActive(delta: number): void {
    const movement = this.activeItemController.move(this.activeSnapshot(), delta);
    if (!movement.item) return;

    this.activeIndexState.set(movement.activeIndex);
    movement.item.scrollIntoView();
  }

  firstActive(): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.first(snapshot);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  lastActive(): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.last(snapshot);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  registerAction(action: HellOmnibarActionRegistration): void {
    this.actionItems.update((list) => [...list, action]);
  }

  unregisterAction(action: HellOmnibarActionRegistration): void {
    this.actionItems.update((list) => list.filter((registered) => registered !== action));
  }

  focusAdjacentAction(action: HellOmnibarActionRegistration, delta: number): void {
    const actions = this.actionItems();
    const current = actions.indexOf(action);
    if (current < 0 || actions.length === 0) return;

    actions[(current + delta + actions.length) % actions.length]?.focus();
  }

  private activeSnapshot(): HellOmnibarActiveItemSnapshot<HellOmnibarItemRegistration> {
    return { items: this.items(), activeIndex: this.activeIndexState() };
  }
}
