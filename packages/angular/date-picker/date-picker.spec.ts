import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellDatePicker,
  HellDateRangePicker,
  type HellDatePickerUi,
  type HellDateRangePickerUi,
} from './date-picker';
import { expectUiRouting, sortClasses } from '../spec-helpers';

@Component({
  imports: [HellDatePicker],
  template: `
    <hell-date-picker
      [date]="date()"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [locale]="locale()"
      [firstDayOfWeek]="firstDayOfWeek()"
      [ui]="ui()"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DatePickerHost {
  readonly date = signal<Date | undefined>(undefined);
  readonly locale = signal<string | null>(null);
  readonly firstDayOfWeek = signal<1 | 2 | 3 | 4 | 5 | 6 | 7>(7);
  readonly min = signal<Date | undefined>(undefined);
  readonly max = signal<Date | undefined>(undefined);
  readonly disabled = signal(false);
  readonly ui = signal<string | HellDatePickerUi | undefined>(undefined);
  readonly dates: Array<Date | undefined> = [];
}

@Component({
  imports: [HellDateRangePicker],
  template: `
    <hell-date-range-picker
      [startDate]="startDate()"
      [endDate]="endDate()"
      [ui]="ui()"
    />
  `,
})
class DateRangePickerHost {
  readonly startDate = signal<Date | undefined>(new Date(2026, 10, 24));
  readonly endDate = signal<Date | undefined>(new Date(2027, 0, 2));
  readonly ui = signal<string | HellDateRangePickerUi | undefined>(undefined);
}

describe('HellDatePicker', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerHost],
    }).compileComponents();
  });

  it('uses localized month labels and weekday headers', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.locale.set('fr-FR');
    fixture.componentInstance.firstDayOfWeek.set(1);
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('avril 2026');
    expect(grid(fixture.nativeElement).getAttribute('aria-label')).toBe('avril 2026');
    expect(weekdayHeaders(fixture.nativeElement).map((header) => header.abbr)).toEqual([
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
      'dimanche',
    ]);
  });

  it('merges ui classes into root, navigation, label, and repeated date button parts', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();
    const defaults = {
      root: datePicker(fixture.nativeElement).className,
      navButton: button(fixture.nativeElement, 'Previous year').className,
      label: labelElement(fixture.nativeElement).className,
      dateButton: dateButtons(fixture.nativeElement)[0].className,
    };

    fixture.componentInstance.ui.set({
      root: 'w-[22rem] border-hell-danger',
      navButton: 'bg-hell-surface-subtle text-hell-danger',
      label: 'text-hell-danger',
      dateButton: 'rounded-hell-pill text-lg',
    });
    fixture.detectChanges();

    const picker = datePicker(fixture.nativeElement);
    const navButton = button(fixture.nativeElement, 'Previous year');
    const firstDateButton = dateButtons(fixture.nativeElement)[0];

    expect(picker.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.root, picker.className, 'w-[22rem] border-hell-danger');
    expect(labelElement(fixture.nativeElement).getAttribute('data-slot')).toBe('label');
    expectUiRouting(
      defaults.label,
      labelElement(fixture.nativeElement).className,
      'text-hell-danger',
    );
    expect(navButton.getAttribute('data-slot')).toBe('navButton');
    expect(navButton.getAttribute('data-direction')).toBe('previous');
    expect(navButton.getAttribute('data-step')).toBe('year');
    expectUiRouting(defaults.navButton, navButton.className, 'bg-hell-surface-subtle text-hell-danger');
    expect(firstDateButton.getAttribute('data-slot')).toBe('dateButton');
    expectUiRouting(defaults.dateButton, firstDateButton.className, 'rounded-hell-pill text-lg');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      vi.setSystemTime(new Date(2026, 3, 30));
      const fixture = TestBed.createComponent(DatePickerHost);
      fixture.detectChanges();

      expect({
        root: sortClasses(datePicker(fixture.nativeElement).className),
        navButton: sortClasses(button(fixture.nativeElement, 'Previous year').className),
        label: sortClasses(labelElement(fixture.nativeElement).className),
        monthTrigger: sortClasses(trigger(fixture.nativeElement, 'month').className),
        yearTrigger: sortClasses(trigger(fixture.nativeElement, 'year').className),
        dateButton: sortClasses(dateButtons(fixture.nativeElement)[0].className),
      }).toMatchSnapshot('datePicker');
    });

    it('keeps the default drill-down part classes stable', () => {
      vi.setSystemTime(new Date(2026, 3, 30));
      const fixture = TestBed.createComponent(DatePickerHost);
      fixture.detectChanges();
      trigger(fixture.nativeElement, 'month').click();
      fixture.detectChanges();

      expect({
        panel: sortClasses(panel(fixture.nativeElement).className),
        panelCell: sortClasses(panelCells(fixture.nativeElement)[0].className),
        panelOption: sortClasses(panelOptions(fixture.nativeElement)[0].className),
      }).toMatchSnapshot('datePickerPanel');
    });
  });

  it('drills from the month trigger into a month grid and back to the chosen month', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    const monthTrigger = trigger(fixture.nativeElement, 'month');
    expect(monthTrigger.textContent?.trim()).toBe('April');
    expect(monthTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(label(fixture.nativeElement)).toBe('April 2026');

    monthTrigger.click();
    fixture.detectChanges();

    const grid = panel(fixture.nativeElement);
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('data-view')).toBe('month');
    expect(grid.getAttribute('aria-label')).toBe('Choose a month');
    expect(trigger(fixture.nativeElement, 'month').getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture.nativeElement, 'month').getAttribute('aria-controls')).toBe(grid.id);
    expect(panelOptions(fixture.nativeElement).map((option) => option.textContent?.trim())).toEqual(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    );
    // WCAG 2.5.3: the accessible name extends the visible text, never replaces it.
    expect(panelOptions(fixture.nativeElement)[3].getAttribute('aria-label')).toBe('Apr 2026');
    expect(panelOptions(fixture.nativeElement)[3].hasAttribute('data-selected')).toBe(true);
    expect(panelOptions(fixture.nativeElement)[3].getAttribute('tabindex')).toBe('0');
    // The whole month nav collapses to the year step while a panel is open.
    expect(fixture.nativeElement.querySelector('button[aria-label="Previous month"]')).toBeNull();

    panelOptions(fixture.nativeElement)[8].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="panel"]')).toBeNull();
    expect(label(fixture.nativeElement)).toBe('September 2026');
    expect(dateButtons(fixture.nativeElement).length).toBeGreaterThan(0);
  });

  it('drills from the year trigger into a paged year grid centred on the focused year', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'year').click();
    fixture.detectChanges();

    expect(panel(fixture.nativeElement).getAttribute('data-view')).toBe('year');
    expect(panel(fixture.nativeElement).getAttribute('aria-label')).toBe('Choose a year');
    const firstPage = panelOptions(fixture.nativeElement).map((option) =>
      option.textContent?.trim(),
    );
    expect(firstPage).toHaveLength(24);
    expect(firstPage[0]).toBe('2015');
    expect(firstPage.at(-1)).toBe('2038');
    expect(panelOptions(fixture.nativeElement)[11].hasAttribute('data-selected')).toBe(true);

    button(fixture.nativeElement, 'Next years').click();
    fixture.detectChanges();

    expect(panelOptions(fixture.nativeElement)[0].textContent?.trim()).toBe('2039');

    button(fixture.nativeElement, 'Previous years').click();
    fixture.detectChanges();

    // 2031 is on the page the panel opened with, so a distant year is one click away.
    const option2031 = panelOptions(fixture.nativeElement).find(
      (candidate) => candidate.textContent?.trim() === '2031',
    );
    option2031?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="panel"]')).toBeNull();
    expect(label(fixture.nativeElement)).toBe('April 2031');
  });

  it('moves the roving tab stop with grid keys and leaves the panel on Escape', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();

    expect(activeIndex(fixture.nativeElement)).toBe(3);

    pressPanelKey(fixture.nativeElement, 'ArrowRight');
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(4);

    pressPanelKey(fixture.nativeElement, 'ArrowDown');
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(7);

    pressPanelKey(fixture.nativeElement, 'Home');
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(0);

    pressPanelKey(fixture.nativeElement, 'End');
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(11);

    // Rolling off the last month steps the panel onto the next year.
    pressPanelKey(fixture.nativeElement, 'ArrowRight');
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(0);
    expect(label(fixture.nativeElement)).toBe('April 2027');

    pressPanelKey(fixture.nativeElement, 'PageUp');
    fixture.detectChanges();
    expect(label(fixture.nativeElement)).toBe('April 2026');

    pressPanelKey(fixture.nativeElement, 'Escape');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="panel"]')).toBeNull();
    expect(trigger(fixture.nativeElement, 'month').getAttribute('aria-expanded')).toBe('false');
  });

  it('disables out-of-range drill-down options and locks the triggers when disabled', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.min.set(new Date(2026, 3, 1));
    fixture.componentInstance.max.set(new Date(2026, 11, 31));
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();

    const disabledMonths = panelOptions(fixture.nativeElement)
      .filter((option) => option.disabled)
      .map((option) => option.textContent?.trim());
    expect(disabledMonths).toEqual(['Jan', 'Feb', 'Mar']);

    trigger(fixture.nativeElement, 'year').click();
    fixture.detectChanges();

    const enabledYears = panelOptions(fixture.nativeElement)
      .filter((option) => !option.disabled)
      .map((option) => option.textContent?.trim());
    expect(enabledYears).toEqual(['2026']);
    expect(button(fixture.nativeElement, 'Previous years').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Next years').disabled).toBe(true);

    fixture.componentInstance.min.set(undefined);
    fixture.componentInstance.max.set(undefined);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(trigger(fixture.nativeElement, 'month').disabled).toBe(true);
    expect(trigger(fixture.nativeElement, 'month').getAttribute('data-disabled')).toBe('');
    expect(trigger(fixture.nativeElement, 'year').disabled).toBe(true);
  });

  it('keeps locale unit markers inside the trigger they belong to', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    // ja-JP formats as "2026年4月": the unit markers are separate literal parts,
    // so a verbatim render would name the month trigger "4".
    fixture.componentInstance.locale.set('ja-JP');
    fixture.detectChanges();
    expect(label(fixture.nativeElement)).toBe('2026年4月');
    expect(trigger(fixture.nativeElement, 'year').textContent).toBe('2026年');
    expect(trigger(fixture.nativeElement, 'month').textContent).toBe('4月');

    fixture.componentInstance.locale.set('ko-KR');
    fixture.detectChanges();
    expect(trigger(fixture.nativeElement, 'year').textContent).toBe('2026년');
    expect(trigger(fixture.nativeElement, 'month').textContent).toBe('4월');

    // Trailing unit words fold backwards too, keeping the narrow no-break
    // space ru-RU puts before the year suffix inside the trigger.
    fixture.componentInstance.locale.set('ru-RU');
    fixture.detectChanges();
    expect(trigger(fixture.nativeElement, 'year').textContent).toBe('2026 г.');
    expect(trigger(fixture.nativeElement, 'month').textContent).toBe('апрель');

    fixture.componentInstance.locale.set('hu-HU');
    fixture.detectChanges();
    expect(trigger(fixture.nativeElement, 'year').textContent).toBe('2026');
    expect(trigger(fixture.nativeElement, 'month').textContent).toBe('április');

    fixture.componentInstance.locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture.nativeElement, 'year').textContent).toBe('2026');
    expect(trigger(fixture.nativeElement, 'month').textContent).toBe('April');
    expect(label(fixture.nativeElement)).toBe('April 2026');
  });

  it('does not paint an out-of-range month in view as the selected one', () => {
    // Bounds that exclude today: ng-primitives leaves focusedDate on today, so
    // the month in view is both "selected" and unavailable.
    vi.setSystemTime(new Date(2026, 6, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.min.set(new Date(2026, 3, 6));
    fixture.componentInstance.max.set(new Date(2026, 4, 15));
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();

    const july = panelOptions(fixture.nativeElement)[6];
    expect(july.textContent?.trim()).toBe('Jul');
    expect(july.hasAttribute('data-selected')).toBe(true);
    expect(july.hasAttribute('data-disabled')).toBe(true);
    expect(july.disabled).toBe(true);
    // The filled treatment is scoped out of the disabled state, so the
    // unavailable month cannot out-rank the two selectable ones.
    expect(july.className).toContain('not-data-[disabled]:data-[selected]:bg-hell-primary');
    expect(july.className).not.toContain(' data-[selected]:bg-hell-primary');
    // The roving tab stop moves to the nearest month the user can choose.
    expect(activeIndex(fixture.nativeElement)).toBe(4);
  });

  it('opens the drill-down on a page with something selectable when bounds exclude today', () => {
    // ng-primitives leaves focusedDate on today, which is years before `min`:
    // opening on 2026 would show twelve disabled months and no tab stop.
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.min.set(new Date(2028, 0, 1));
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('January 2028');
    expect(panelOptions(fixture.nativeElement).every((option) => option.disabled)).toBe(false);
    expect(activeIndex(fixture.nativeElement)).toBe(0);
    expect(panel(fixture.nativeElement).hasAttribute('tabindex')).toBe(false);
  });

  it('gives the grid the tab stop when bounds move every option out of range', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.min.set(new Date(2026, 0, 1));
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();
    expect(activeIndex(fixture.nativeElement)).toBe(3);

    // Bounds tightened while the drill-down is open: no button can hold an
    // inert tab stop, so the grid takes it and stays dismissable.
    fixture.componentInstance.min.set(new Date(2030, 0, 1));
    fixture.detectChanges();

    const options = panelOptions(fixture.nativeElement);
    expect(options.every((option) => option.disabled)).toBe(true);
    expect(options.some((option) => option.getAttribute('tabindex') === '0')).toBe(false);
    expect(panel(fixture.nativeElement).getAttribute('tabindex')).toBe('0');

    pressPanelKey(fixture.nativeElement, 'Escape');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-slot="panel"]')).toBeNull();
  });

  it('pages the month grid by the target year, not by the same month next year', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.max.set(new Date(2027, 1, 15));
    fixture.detectChanges();

    trigger(fixture.nativeElement, 'month').click();
    fixture.detectChanges();

    // April 2027 is out of range but January and February 2027 are not.
    pressPanelKey(fixture.nativeElement, 'PageDown');
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('February 2027');
    const reachable = panelOptions(fixture.nativeElement)
      .filter((option) => !option.disabled)
      .map((option) => option.textContent?.trim());
    expect(reachable).toEqual(['Jan', 'Feb']);
  });

  it('renders locale-ordered heading triggers on the range picker too', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DateRangePickerHost);
    fixture.detectChanges();

    expect(trigger(fixture.nativeElement, 'month').textContent?.trim()).toBe('April');
    expect(trigger(fixture.nativeElement, 'year').textContent?.trim()).toBe('2026');

    trigger(fixture.nativeElement, 'year').click();
    fixture.detectChanges();

    const option2029 = panelOptions(fixture.nativeElement).find(
      (candidate) => candidate.textContent?.trim() === '2029',
    );
    option2029?.click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2029');
    expect(rangePicker(fixture.nativeElement).getAttribute('data-view')).toBe('day');
  });

  it('moves the focused month by one year with previous and next year buttons', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2026');

    button(fixture.nativeElement, 'Previous year').click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2025');

    button(fixture.nativeElement, 'Next year').click();
    button(fixture.nativeElement, 'Next year').click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2027');
  });

  it('disables year navigation when the picker is disabled or the target month is outside bounds', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'Previous year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous year').getAttribute('data-disabled')).toBe('');
    expect(button(fixture.nativeElement, 'Next year').disabled).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.min.set(new Date(2026, 3, 1));
    fixture.componentInstance.max.set(new Date(2026, 11, 31));
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'Previous year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous year').getAttribute('data-disabled')).toBe('');
    expect(button(fixture.nativeElement, 'Next year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Next year').getAttribute('data-disabled')).toBe('');
  });

  it('marks date ranges complete independently of the focused month', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DateRangePickerHost);
    fixture.componentInstance.ui.set('w-[23rem] border-hell-danger');
    fixture.detectChanges();

    const picker = rangePicker(fixture.nativeElement);
    expect(picker.getAttribute('data-slot')).toBe('root');
    // The consumer ui class is the test's own contract fixture.
    expect(picker.classList.contains('w-[23rem]')).toBe(true);
    expect(label(fixture.nativeElement)).toBe('April 2026');
    expect(picker.getAttribute('data-range-complete')).toBe('');

    fixture.componentInstance.endDate.set(undefined);
    fixture.detectChanges();

    expect(picker.hasAttribute('data-range-complete')).toBe(false);
  });
});

function label(root: HTMLElement): string {
  const element = labelElement(root);
  return element.textContent?.trim() ?? '';
}

function labelElement(root: HTMLElement): HTMLElement {
  const element = root.querySelector('h2');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date picker label.');
  return element;
}

function weekdayHeaders(root: HTMLElement): { abbr: string; text: string }[] {
  return [...root.querySelectorAll('th')].map((header) => ({
    abbr: header.getAttribute('abbr') ?? '',
    text: header.textContent?.trim() ?? '',
  }));
}

function grid(root: HTMLElement): HTMLTableElement {
  const element = root.querySelector('table[ngpdatepickergrid]');
  if (!(element instanceof HTMLTableElement)) throw new Error('Expected date picker grid.');
  return element;
}

function button(root: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const element = root.querySelector(`button[aria-label="${ariaLabel}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${ariaLabel} button.`);
  return element;
}

function trigger(root: HTMLElement, kind: 'month' | 'year'): HTMLButtonElement {
  const element = root.querySelector(`button[data-slot="${kind}Trigger"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${kind} trigger.`);
  return element;
}

function panel(root: HTMLElement): HTMLTableElement {
  const element = root.querySelector('[data-slot="panel"]');
  if (!(element instanceof HTMLTableElement)) throw new Error('Expected drill-down panel.');
  return element;
}

function panelCells(root: HTMLElement): HTMLTableCellElement[] {
  return [...root.querySelectorAll<HTMLTableCellElement>('[data-slot="panelCell"]')];
}

function panelOptions(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>('button[data-slot="panelOption"]')];
}

function activeIndex(root: HTMLElement): number {
  const active = panelOptions(root).find((option) => option.getAttribute('tabindex') === '0');
  if (!active) throw new Error('Expected one roving tab stop in the drill-down panel.');
  return Number(active.getAttribute('data-index'));
}

function pressPanelKey(root: HTMLElement, key: string): void {
  panel(root).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function dateButtons(root: HTMLElement): HTMLButtonElement[] {
  const buttons = [...root.querySelectorAll('button[ngpDatePickerDateButton]')];
  if (!buttons.every((button) => button instanceof HTMLButtonElement)) {
    throw new Error('Expected date buttons.');
  }
  return buttons;
}

function datePicker(root: HTMLElement): HTMLElement {
  const element = root.querySelector('hell-date-picker');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date picker.');
  return element;
}

function rangePicker(root: HTMLElement): HTMLElement {
  const element = root.querySelector('hell-date-range-picker');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date range picker.');
  return element;
}
