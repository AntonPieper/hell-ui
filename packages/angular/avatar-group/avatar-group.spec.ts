import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_AVATAR_GROUP_DIRECTIVES,
  HellAvatarGroup,
  HellAvatarGroupItem,
  HellAvatarGroupOverflow,
} from './avatar-group';

@Component({
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES],
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
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES],
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
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES],
  template: `
    <hell-avatar-group id="group" unstyled>
      <span id="item" hellAvatarGroupItem unstyled selected>A</span>
      <span id="overflow" hellAvatarGroupOverflow unstyled>+3</span>
    </hell-avatar-group>
  `,
})
class UnstyledGroupHost {}

describe('HellAvatarGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultGroupHost, SizedGroupHost, UnstyledGroupHost],
    }).compileComponents();
  });

  it('applies the group host class and defaults the size to md', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');

    expect(group.tagName.toLowerCase()).toBe('hell-avatar-group');
    expect(group.classList.contains('hell-avatar-group')).toBe(true);
    expect(group.getAttribute('data-size')).toBe('md');
  });

  it('projects item and overflow content into the group', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');

    expect(group.querySelector('#item-a')?.textContent?.trim()).toBe('A');
    expect(group.querySelector('#item-selected')?.textContent?.trim()).toBe('B');
    expect(group.querySelector('#overflow')?.textContent?.trim()).toBe('+3');
  });

  it('applies member and overflow host classes to projected content', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const item = byId(fixture.nativeElement, 'item-a');
    const overflow = byId(fixture.nativeElement, 'overflow');

    expect(item.classList.contains('hell-avatar-group-item')).toBe(true);
    expect(overflow.classList.contains('hell-avatar-group-overflow')).toBe(true);
  });

  it('reflects the selected state through data-selected only when selected', () => {
    const fixture = TestBed.createComponent(DefaultGroupHost);
    fixture.detectChanges();

    const item = byId(fixture.nativeElement, 'item-a');
    const selected = byId(fixture.nativeElement, 'item-selected');

    expect(item.getAttribute('data-selected')).toBeNull();
    expect(selected.getAttribute('data-selected')).toBe('');
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

  it('drops the default host classes but keeps state attributes when unstyled', () => {
    const fixture = TestBed.createComponent(UnstyledGroupHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const item = byId(fixture.nativeElement, 'item');
    const overflow = byId(fixture.nativeElement, 'overflow');

    expect(group.classList.contains('hell-avatar-group')).toBe(false);
    expect(group.getAttribute('data-size')).toBe('md');
    expect(item.classList.contains('hell-avatar-group-item')).toBe(false);
    expect(item.getAttribute('data-selected')).toBe('');
    expect(overflow.classList.contains('hell-avatar-group-overflow')).toBe(false);
  });

  it('bundles every avatar-group directive for bulk imports', () => {
    expect(HELL_AVATAR_GROUP_DIRECTIVES).toEqual([
      HellAvatarGroup,
      HellAvatarGroupItem,
      HellAvatarGroupOverflow,
    ]);
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
