import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellAvatar } from '@hell-ui/angular/avatar';

import { HELL_AVATAR_GROUP_IMPORTS } from './avatar-group';

@Component({
  imports: [...HELL_AVATAR_GROUP_IMPORTS, HellAvatar],
  template: `
    <hell-avatar-group id="colocated-group">
      <hell-avatar id="colocated-item" hellAvatarGroupItem fallback="AP" />
    </hell-avatar-group>
  `,
})
class ColocatedAvatarHost {}

@Component({
  imports: [...HELL_AVATAR_GROUP_IMPORTS],
  template: `
    <hell-avatar-group id="group">
      <span id="item-a" hellAvatarGroupItem>A</span>
      <span id="item-selected" hellAvatarGroupItem selected>B</span>
      <span id="overflow" hellAvatarGroupOverflow>+3</span>
    </hell-avatar-group>
  `,
})
class DefaultGroupHost {}

@Component({
  imports: [...HELL_AVATAR_GROUP_IMPORTS],
  template: `
    <hell-avatar-group id="group" size="lg">
      <span id="item" hellAvatarGroupItem [selected]="itemSelected()">A</span>
    </hell-avatar-group>
  `,
})
class SizedGroupHost {
  readonly itemSelected = signal(false);
}

@Component({
  imports: [...HELL_AVATAR_GROUP_IMPORTS],
  template: `
    <hell-avatar-group
      id="string-group"
      size="lg"
      ui="inline-grid items-start [--_hell-av-size:44px]"
    >
      <span
        id="string-item"
        hellAvatarGroupItem
        selected
        ui="justify-start rounded-hell-md min-h-[44px]"
      >
        A
      </span>
      <button
        id="string-overflow"
        type="button"
        hellAvatarGroupOverflow
        ui="rounded-hell-md border-hell-danger bg-hell-danger text-hell-foreground-inverse"
      >
        +3
      </button>
    </hell-avatar-group>

    <hell-avatar-group id="map-group" [ui]="groupUi">
      <span id="map-item" hellAvatarGroupItem [ui]="itemUi">A</span>
      <span id="map-overflow" hellAvatarGroupOverflow [ui]="overflowUi">+2</span>
    </hell-avatar-group>
  `,
})
class PartStyleHost {
  protected readonly groupUi = {
    root: 'inline-grid items-end',
  };

  protected readonly itemUi = {
    root: 'justify-start rounded-hell-md',
  };

  protected readonly overflowUi = {
    root: 'rounded-hell-md border-hell-info bg-hell-info text-hell-foreground-inverse',
  };
}

describe('HellAvatarGroup Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultGroupHost, SizedGroupHost, PartStyleHost, ColocatedAvatarHost],
    }).compileComponents();
  });

  it('merges avatar and group-item recipes when co-located on one hell-avatar host', () => {
    const fixture = TestBed.createComponent(ColocatedAvatarHost);
    fixture.detectChanges();

    const item = byId(fixture.nativeElement, 'colocated-item');
    const classes = classNames(item);

    // HellAvatar recipe survives alongside the item recipe on the shared host.
    expect(classes).toContain('overflow-hidden');
    expect(classes).toContain('rounded-full');
    // HellAvatarGroupItem recipe lands on the same host.
    expect(classes).toContain('shrink-0');
    expect(classes).toContain('isolate');
    // Both directives declare data-slot="root"; the merged host resolves to root.
    expect(item.getAttribute('data-slot')).toBe('root');
  });

  it('applies root data slots and default recipe classes', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const item = byId(fixture.nativeElement, 'item-a');
    const selected = byId(fixture.nativeElement, 'item-selected');
    const overflow = byId(fixture.nativeElement, 'overflow');

    expect(group.tagName.toLowerCase()).toBe('hell-avatar-group');
    expect(group.getAttribute('data-slot')).toBe('root');
    expect(item.getAttribute('data-slot')).toBe('root');
    expect(selected.getAttribute('data-slot')).toBe('root');
    expect(overflow.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('data-size')).toBe('md');
    expect(item.getAttribute('data-selected')).toBeNull();
    expect(selected.getAttribute('data-selected')).toBe('');

    expect(group.classList.contains('inline-flex')).toBe(true);
    expect(group.classList.contains('items-center')).toBe(true);
    expect(item.classList.contains('inline-flex')).toBe(true);
    expect(item.classList.contains('justify-center')).toBe(true);
    expect(overflow.classList.contains('bg-hell-surface-muted')).toBe(true);
  });

  it('projects item and overflow content into the group', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');

    expect(group.querySelector('#item-a')?.textContent?.trim()).toBe('A');
    expect(group.querySelector('#item-selected')?.textContent?.trim()).toBe('B');
    expect(group.querySelector('#overflow')?.textContent?.trim()).toBe('+3');
  });

  it('reflects the configured size onto the group host', () => {
    const fixture = TestBed.createComponent(SizedGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');

    expect(group.getAttribute('data-size')).toBe('lg');
  });

  it('toggles data-selected when the item selected input changes', () => {
    const fixture = TestBed.createComponent(SizedGroupHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const item = byId(fixture.nativeElement, 'item');
    expect(item.getAttribute('data-selected')).toBeNull();

    host.itemSelected.set(true);
    fixture.detectChanges();
    expect(item.getAttribute('data-selected')).toBe('');

    host.itemSelected.set(false);
    fixture.detectChanges();
    expect(item.getAttribute('data-selected')).toBeNull();
  });

  it('applies ui string shorthand to each root part and lets it win over recipes', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'string-group');
    const item = byId(fixture.nativeElement, 'string-item');
    const overflow = byId(fixture.nativeElement, 'string-overflow');
    const groupClasses = classNames(group);
    const itemClasses = classNames(item);

    expect(group.classList.contains('inline-grid')).toBe(true);
    expect(group.classList.contains('inline-flex')).toBe(false);
    expect(group.classList.contains('items-start')).toBe(true);
    expect(group.classList.contains('items-center')).toBe(false);
    expect(groupClasses).toContain('[--_hell-av-size:44px]');
    expect(groupClasses).not.toContain('[--_hell-av-size:32px]');

    expect(item.classList.contains('justify-start')).toBe(true);
    expect(item.classList.contains('justify-center')).toBe(false);
    expect(item.classList.contains('rounded-hell-md')).toBe(true);
    expect(item.classList.contains('rounded-full')).toBe(false);
    expect(itemClasses).toContain('min-h-[44px]');
    expect(itemClasses).not.toContain('min-h-[var(--_hell-av-size)]');

    expect(overflow.classList.contains('rounded-hell-md')).toBe(true);
    expect(overflow.classList.contains('rounded-full')).toBe(false);
    expect(overflow.classList.contains('border-hell-danger')).toBe(true);
    expect(overflow.classList.contains('border-hell-surface-elevated')).toBe(false);
    expect(overflow.classList.contains('bg-hell-danger')).toBe(true);
    expect(overflow.classList.contains('bg-hell-surface-muted')).toBe(false);
    expect(overflow.classList.contains('text-hell-foreground-inverse')).toBe(true);
    expect(overflow.classList.contains('text-hell-foreground-muted')).toBe(false);
  });

  it('applies ui object maps to each root part and lets them win over recipes', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'map-group');
    const item = byId(fixture.nativeElement, 'map-item');
    const overflow = byId(fixture.nativeElement, 'map-overflow');

    expect(group.classList.contains('inline-grid')).toBe(true);
    expect(group.classList.contains('inline-flex')).toBe(false);
    expect(group.classList.contains('items-end')).toBe(true);
    expect(group.classList.contains('items-center')).toBe(false);

    expect(item.classList.contains('justify-start')).toBe(true);
    expect(item.classList.contains('justify-center')).toBe(false);
    expect(item.classList.contains('rounded-hell-md')).toBe(true);
    expect(item.classList.contains('rounded-full')).toBe(false);

    expect(overflow.classList.contains('rounded-hell-md')).toBe(true);
    expect(overflow.classList.contains('rounded-full')).toBe(false);
    expect(overflow.classList.contains('border-hell-info')).toBe(true);
    expect(overflow.classList.contains('border-hell-surface-elevated')).toBe(false);
    expect(overflow.classList.contains('bg-hell-info')).toBe(true);
    expect(overflow.classList.contains('bg-hell-surface-muted')).toBe(false);
    expect(overflow.classList.contains('text-hell-foreground-inverse')).toBe(true);
    expect(overflow.classList.contains('text-hell-foreground-muted')).toBe(false);
  });

});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function classNames(element: HTMLElement): string[] {
  return element.className.split(/\s+/);
}
