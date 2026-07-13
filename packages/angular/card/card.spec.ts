import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_CARD_DIRECTIVES } from './card';

@Component({
  imports: [...HELL_CARD_DIRECTIVES],
  template: `
    <div
      id="custom-card"
      hellCard
      [elevation]="3"
      ui="rounded-hell-pill shadow-none p-hell-4"
    >
      <div id="plain-header" hellCardHeader>Plain header</div>
      <div id="plain-body" hellCardBody>Plain body</div>
      <div id="plain-footer" hellCardFooter>Plain footer</div>
    </div>

    <div id="mapped-card" hellCard [ui]="cardUi">
      <div id="mapped-header" hellCardHeader [ui]="headerUi">Mapped header</div>
      <div id="mapped-body" hellCardBody [ui]="bodyUi">Mapped body</div>
      <div id="mapped-footer" hellCardFooter [ui]="footerUi">Mapped footer</div>
    </div>
  `,
})
class CardHost {
  protected readonly cardUi = {
    root: 'rounded-hell-pill shadow-hell-lg',
  };

  protected readonly headerUi = {
    root: 'px-hell-2 text-hell-danger',
  };

  protected readonly bodyUi = {
    root: 'p-hell-2',
  };

  protected readonly footerUi = {
    root: 'justify-start border-t-0',
  };
}

describe('HellCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardHost] }).compileComponents();
  });

  it('exposes local root Part Style Maps while preserving card state attributes', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    const customCard = query(fixture.nativeElement, '#custom-card');
    const plainHeader = query(fixture.nativeElement, '#plain-header');
    const plainBody = query(fixture.nativeElement, '#plain-body');
    const plainFooter = query(fixture.nativeElement, '#plain-footer');
    const mappedCard = query(fixture.nativeElement, '#mapped-card');
    const mappedHeader = query(fixture.nativeElement, '#mapped-header');
    const mappedBody = query(fixture.nativeElement, '#mapped-body');
    const mappedFooter = query(fixture.nativeElement, '#mapped-footer');

    expect(customCard.getAttribute('data-slot')).toBe('root');
    expect(customCard.getAttribute('data-elevation')).toBe('3');
    expect(customCard.classList.contains('rounded-hell-pill')).toBe(true);
    expect(customCard.classList.contains('rounded-hell-lg')).toBe(false);
    expect(customCard.classList.contains('shadow-none')).toBe(true);
    expect(customCard.classList.contains('shadow-hell-xs')).toBe(false);
    expect(customCard.classList.contains('p-hell-4')).toBe(true);

    expect(plainHeader.getAttribute('data-slot')).toBe('root');
    expect(plainBody.getAttribute('data-slot')).toBe('root');
    expect(plainFooter.getAttribute('data-slot')).toBe('root');
    expect(plainHeader.classList.contains('px-hell-2')).toBe(false);
    expect(plainBody.classList.contains('p-hell-2')).toBe(false);
    expect(plainFooter.classList.contains('justify-start')).toBe(false);

    expect(mappedCard.classList.contains('rounded-hell-pill')).toBe(true);
    expect(mappedCard.classList.contains('shadow-hell-lg')).toBe(true);
    expect(mappedCard.classList.contains('shadow-hell-xs')).toBe(false);
    expect(mappedHeader.classList.contains('px-hell-2')).toBe(true);
    expect(mappedHeader.classList.contains('px-hell-6')).toBe(false);
    expect(mappedHeader.classList.contains('text-hell-danger')).toBe(true);
    expect(mappedBody.classList.contains('p-hell-2')).toBe(true);
    expect(mappedBody.classList.contains('p-hell-6')).toBe(false);
    expect(mappedFooter.classList.contains('justify-start')).toBe(true);
    expect(mappedFooter.classList.contains('justify-end')).toBe(false);
    expect(mappedFooter.classList.contains('border-t-0')).toBe(true);
    expect(mappedFooter.classList.contains('border-t')).toBe(false);
  });
});

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
