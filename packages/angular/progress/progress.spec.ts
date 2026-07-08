import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellProgress,
  HellProgressBar,
  type HellProgressBarUi,
  type HellProgressUi,
} from './progress';

@Component({
  imports: [HellProgress, HellProgressBar],
  template: `
    <div data-test="progress-string" hellProgress value="40" max="80" ui="h-hell-4 bg-hell-danger">
      <div id="bar-string" hellProgressBar ui="bg-hell-success-strong transition-none"></div>
    </div>

    <div data-test="progress-map" hellProgress value="20" max="100" [ui]="progressUi">
      <div id="bar-map" hellProgressBar [ui]="barUi"></div>
    </div>
  `,
})
class ProgressPartStyleHost {
  readonly progressUi = {
    root: 'h-hell-3 rounded-hell-md bg-hell-info-soft',
  } satisfies HellProgressUi;

  readonly barUi = {
    root: 'bg-hell-info transition-none',
  } satisfies HellProgressBarUi;
}

describe('HellProgress Part Style Maps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgressPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to progress and bar root parts', () => {
    const fixture = TestBed.createComponent(ProgressPartStyleHost);
    fixture.detectChanges();

    const progress = byTest(fixture.nativeElement, 'progress-string');
    const bar = byId(fixture.nativeElement, 'bar-string');
    const progressClasses = progress.className.split(/\s+/);
    const barClasses = bar.className.split(/\s+/);

    expect(progress.getAttribute('data-slot')).toBe('root');
    expect(bar.getAttribute('data-slot')).toBe('root');
    expect(progressClasses).toContain('h-hell-4');
    expect(progressClasses).toContain('bg-hell-danger');
    expect(progressClasses).not.toContain('h-[calc(var(--spacing)*1.5)]');
    expect(progressClasses).not.toContain('bg-hell-surface-muted');
    expect(barClasses).toContain('bg-hell-success-strong');
    expect(barClasses).toContain('transition-none');
    expect(barClasses).not.toContain('bg-hell-primary');
    expect(barClasses).not.toContain('transition-[width]');
  });

  it('applies object maps and preserves progress accessibility attributes', () => {
    const fixture = TestBed.createComponent(ProgressPartStyleHost);
    fixture.detectChanges();

    const progress = byTest(fixture.nativeElement, 'progress-map');
    const bar = byId(fixture.nativeElement, 'bar-map');

    expect(progress.getAttribute('data-slot')).toBe('root');
    expect(progress.getAttribute('role')).toBe('progressbar');
    expect(progress.getAttribute('aria-valuenow')).toBe('20');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.className).toContain('h-hell-3');
    expect(progress.className).toContain('rounded-hell-md');
    expect(progress.className).toContain('bg-hell-info-soft');

    expect(bar.getAttribute('data-slot')).toBe('root');
    expect(bar.className).toContain('bg-hell-info');
    expect(bar.className).toContain('transition-none');
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function byTest(root: HTMLElement, testId: string): HTMLElement {
  const element = root.querySelector(`[data-test="${testId}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected [data-test="${testId}"].`);
  return element;
}
