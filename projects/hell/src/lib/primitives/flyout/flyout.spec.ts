import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellFlyout, HellFlyoutTrigger } from './flyout';

@Component({
  imports: [HellFlyout, HellFlyoutTrigger],
  template: `
    <button hellFlyoutTrigger #trigger="hellFlyoutTrigger" type="button" (click)="trigger.toggle()">
      Toggle
    </button>

    @if (trigger.open()) {
      <div [hellFlyout]="trigger">Panel</div>
    }
  `,
})
class FlyoutHost {}

describe('HellFlyout outside interaction', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlyoutHost],
    }).compileComponents();
  });

  it('keeps flyout open on outside touch pointerdown but closes on outside click', async () => {
    const fixture = TestBed.createComponent(FlyoutHost);
    await settle(fixture);

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('Panel');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Panel');
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}