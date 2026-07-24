import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellAvatar } from 'hell-ui/avatar';

import { HELL_AVATAR_GROUP_IMPORTS } from './avatar-group';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Avatar-group specs assert behavior and state attributes. Part-Class
 * Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */
@Component({
  imports: [...HELL_AVATAR_GROUP_IMPORTS, HellAvatar],
  template: `
    <hell-avatar id="plain-avatar" fallback="AP" />
    <hell-avatar-group id="colocated-group">
      <hell-avatar id="colocated-item" hellAvatarGroupItem fallback="AP" />
      <span id="plain-item" hellAvatarGroupItem>A</span>
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

    const colocated = byId(fixture.nativeElement, 'colocated-item');
    const avatarOnly = byId(fixture.nativeElement, 'plain-avatar');
    const itemOnly = byId(fixture.nativeElement, 'plain-item');

    // The shared host renders the union of both directives' default parts.
    expect(sortClasses(colocated.className)).toEqual(
      sortUnion(avatarOnly.className, itemOnly.className),
    );
    // Both directives declare data-slot="root"; the merged host resolves to root.
    expect(colocated.getAttribute('data-slot')).toBe('root');
  });

  it('marks every group part with its public data-slot and reflects state attributes', () => {
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

  it('routes ui string shorthand through the shared Part-Class Pipeline per part', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    const defaults = defaultGroupClasses();
    fixture.detectChanges();

    expectUiRouting(
      defaults.group,
      byId(fixture.nativeElement, 'string-group').className,
      'inline-grid items-start [--_hell-av-size:44px]',
    );
    expectUiRouting(
      defaults.item,
      byId(fixture.nativeElement, 'string-item').className,
      'justify-start rounded-hell-md min-h-[44px]',
    );
    expectUiRouting(
      defaults.overflow,
      byId(fixture.nativeElement, 'string-overflow').className,
      'rounded-hell-md border-hell-danger bg-hell-danger text-hell-foreground-inverse',
    );
  });

  it('routes ui part maps through the shared Part-Class Pipeline per part', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    const defaults = defaultGroupClasses();
    fixture.detectChanges();

    expectUiRouting(
      defaults.group,
      byId(fixture.nativeElement, 'map-group').className,
      'inline-grid items-end',
    );
    expectUiRouting(
      defaults.item,
      byId(fixture.nativeElement, 'map-item').className,
      'justify-start rounded-hell-md',
    );
    expectUiRouting(
      defaults.overflow,
      byId(fixture.nativeElement, 'map-overflow').className,
      'rounded-hell-md border-hell-info bg-hell-info text-hell-foreground-inverse',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const defaults = defaultGroupClasses();

      expect({
        group: sortClasses(defaults.group),
        item: sortClasses(defaults.item),
        overflow: sortClasses(defaults.overflow),
      }).toMatchSnapshot('avatarGroup');
    });
  });
});

function defaultGroupClasses(): { group: string; item: string; overflow: string } {
  const fixture = TestBed.createComponent(DefaultGroupHost);
  fixture.detectChanges();

  return {
    group: byId(fixture.nativeElement, 'group').className,
    item: byId(fixture.nativeElement, 'item-a').className,
    overflow: byId(fixture.nativeElement, 'overflow').className,
  };
}

function sortUnion(...classNames: string[]): string[] {
  return [...new Set(classNames.flatMap((value) => sortClasses(value)))].sort();
}

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
