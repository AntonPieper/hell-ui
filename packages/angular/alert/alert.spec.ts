import { provideHellLabels } from '@hell-ui/angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_ALERT_IMPORTS, HellAlertUi, type HellAlertVariant, HELL_ALERT_LABELS } from './alert';

/**
 * Alert specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */

@Component({
  imports: [...HELL_ALERT_IMPORTS],
  template: `
    <hell-alert
      [variant]="variant()"
      [showIcon]="showIcon()"
      [ui]="ui()"
      (dismissed)="onDismissed()"
    >
      @if (customIcon()) {
        <span hellAlertIcon id="custom-icon">★</span>
      }
      <h3 hellAlertTitle id="title">Storage almost full</h3>
      <p hellAlertDescription id="description">Free up space to keep syncing.</p>
      <div hellAlertActions id="actions">
        <button type="button" id="retry">Retry</button>
      </div>
      @if (dismissible()) {
        <button hellAlertDismiss id="dismiss" [aria-label]="dismissLabel()"></button>
      }
    </hell-alert>
  `,
})
class AlertHost {
  readonly variant = signal<HellAlertVariant>('info');
  readonly showIcon = signal(true);
  readonly customIcon = signal(false);
  readonly dismissible = signal(true);
  readonly dismissLabel = signal<string | null>(null);
  readonly ui = signal<HellAlertUi | string | undefined>(undefined);
  dismissedCount = 0;

  onDismissed(): void {
    this.dismissedCount += 1;
  }
}

describe('HellAlert', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlertHost] }).compileComponents();
  });

  it('marks every alert part with its public data-slot', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    expect(queryAlert(fixture.nativeElement).getAttribute('data-slot')).toBe('root');
    for (const slot of ['icon', 'content']) {
      expect(fixture.nativeElement.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    for (const id of ['title', 'description', 'actions', 'dismiss']) {
      expect(
        fixture.nativeElement.querySelector(`#${id}`)?.getAttribute('data-slot'),
      ).toBe('root');
    }
  });

  it('reflects the variant as a data attribute without a live-region role', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const alert = queryAlert(fixture.nativeElement);
    expect(alert.getAttribute('data-variant')).toBe('info');
    expect(alert.getAttribute('role')).toBeNull();
    expect(alert.getAttribute('aria-live')).toBeNull();

    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();

    expect(alert.getAttribute('data-variant')).toBe('danger');
    expect(alert.getAttribute('role')).toBeNull();
  });

  it('renders a decorative default glyph in the icon part and removes it on demand', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const icon = () => fixture.nativeElement.querySelector('[data-slot="icon"]') as HTMLElement | null;
    expect(icon()).not.toBeNull();
    expect(icon()!.getAttribute('aria-hidden')).toBe('true');
    expect(icon()!.querySelector('svg')).not.toBeNull();

    fixture.componentInstance.showIcon.set(false);
    fixture.detectChanges();

    expect(icon()).toBeNull();
  });

  it('replaces the default glyph with projected hellAlertIcon content', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.customIcon.set(true);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('[data-slot="icon"]') as HTMLElement;
    expect(icon.querySelector('#custom-icon')).not.toBeNull();
    expect(icon.querySelector('svg')).toBeNull();
  });

  it('places title, description, and actions inside the content part', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('[data-slot="content"]') as HTMLElement;
    expect(content.querySelector('#title')).not.toBeNull();
    expect(content.querySelector('#description')).not.toBeNull();
    expect(content.querySelector('#actions #retry')).not.toBeNull();
  });

  it('gives the dismiss button an accessible name and emits without self-removing', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const dismiss = fixture.nativeElement.querySelector('#dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('type')).toBe('button');
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');

    dismiss.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.dismissedCount).toBe(1);
    // The alert owns no visibility state: it stays in the DOM after dismissal.
    expect(queryAlert(fixture.nativeElement)).not.toBeNull();
  });

  it('honors a per-instance aria-label override on the dismiss button', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.dismissLabel.set('Dismiss update notice');
    fixture.detectChanges();

    const dismiss = fixture.nativeElement.querySelector('#dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss update notice');

    fixture.componentInstance.dismissLabel.set(null);
    fixture.detectChanges();
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('routes ui part maps through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const alert = queryAlert(fixture.nativeElement);
    const icon = fixture.nativeElement.querySelector('[data-slot="icon"]') as HTMLElement;
    const content = fixture.nativeElement.querySelector('[data-slot="content"]') as HTMLElement;
    const defaults = {
      root: alert.className,
      icon: icon.className,
      content: content.className,
    };

    fixture.componentInstance.ui.set({
      root: 'rounded-hell-xl',
      icon: 'text-hell-primary',
      content: 'gap-hell-4',
    });
    fixture.detectChanges();

    expectUiRouting(defaults.root, alert.className, 'rounded-hell-xl');
    expectUiRouting(defaults.icon, icon.className, 'text-hell-primary');
    expectUiRouting(defaults.content, content.className, 'gap-hell-4');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(AlertHost);
      fixture.detectChanges();

      expect({
        root: renderedClasses(fixture, 'hell-alert'),
        icon: renderedClasses(fixture, '[data-slot="icon"]'),
        content: renderedClasses(fixture, '[data-slot="content"]'),
        title: renderedClasses(fixture, '#title'),
        description: renderedClasses(fixture, '#description'),
        actions: renderedClasses(fixture, '#actions'),
        dismiss: renderedClasses(fixture, '#dismiss'),
      }).toMatchSnapshot('alert');
    });
  });
});

describe('HellAlert Label Contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertHost],
      providers: [provideHellLabels(HELL_ALERT_LABELS, { dismiss: 'Verwerfen' })],
    }).compileComponents();
  });

  it('applies the overridden dismiss label as the accessible name', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const dismiss = fixture.nativeElement.querySelector('#dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('aria-label')).toBe('Verwerfen');
  });
});

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

/** Rendered classes as a sorted list; class attribute order carries no styling meaning. */
function renderedClasses(fixture: { nativeElement: HTMLElement }, selector: string): string[] {
  const element = fixture.nativeElement.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return sortClasses(element.className);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function queryAlert(root: HTMLElement): HTMLElement {
  const alert = root.querySelector('hell-alert');
  if (!(alert instanceof HTMLElement)) throw new Error('Expected a hell-alert host.');
  return alert;
}
