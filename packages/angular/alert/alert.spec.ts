import { provideHellLabels } from '@hell-ui/angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_ALERT_DIRECTIVES, HellAlertUi, type HellAlertLayout, type HellAlertVariant, HELL_ALERT_LABELS } from './alert';

@Component({
  imports: [...HELL_ALERT_DIRECTIVES],
  template: `
    <hell-alert
      [variant]="variant()"
      [layout]="layout()"
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
  readonly layout = signal<HellAlertLayout>('inline');
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

  it('reflects variant and layout as data attributes without a live-region role', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const alert = queryAlert(fixture.nativeElement);
    expect(alert.getAttribute('data-slot')).toBe('root');
    expect(alert.getAttribute('data-variant')).toBe('info');
    expect(alert.getAttribute('data-layout')).toBe('inline');
    expect(alert.getAttribute('role')).toBeNull();
    expect(alert.getAttribute('aria-live')).toBeNull();

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.layout.set('banner');
    fixture.detectChanges();

    expect(alert.getAttribute('data-variant')).toBe('danger');
    expect(alert.getAttribute('data-layout')).toBe('banner');
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
    expect(content.querySelector('#title')?.getAttribute('data-slot')).toBe('root');
    expect(content.querySelector('#description')?.getAttribute('data-slot')).toBe('root');
    expect(content.querySelector('#actions')?.getAttribute('data-slot')).toBe('root');
    expect(content.querySelector('#actions #retry')).not.toBeNull();
  });

  it('gives the dismiss button an accessible name and emits without self-removing', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.detectChanges();

    const dismiss = fixture.nativeElement.querySelector('#dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('type')).toBe('button');
    expect(dismiss.getAttribute('data-slot')).toBe('root');
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

  it('refines owned and projected parts through Part Style Maps', () => {
    const fixture = TestBed.createComponent(AlertHost);
    fixture.componentInstance.ui.set({
      root: 'rounded-hell-xl',
      icon: 'text-hell-primary',
      content: 'gap-hell-4',
    });
    fixture.detectChanges();

    const alert = queryAlert(fixture.nativeElement);
    const icon = fixture.nativeElement.querySelector('[data-slot="icon"]') as HTMLElement;
    const content = fixture.nativeElement.querySelector('[data-slot="content"]') as HTMLElement;

    expect(alert.className).toContain('rounded-hell-xl');
    expect(alert.className).not.toContain('rounded-hell-md');
    expect(icon.className).toContain('text-hell-primary');
    expect(content.className).toContain('gap-hell-4');
    expect(content.className).not.toContain('gap-hell-1');
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

function queryAlert(root: HTMLElement): HTMLElement {
  const alert = root.querySelector('hell-alert');
  if (!(alert instanceof HTMLElement)) throw new Error('Expected a hell-alert host.');
  return alert;
}
