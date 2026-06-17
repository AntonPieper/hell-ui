import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellDialpad } from '@hell-ui/angular/dialpad';

@Component({
  selector: 'app-dialpad-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellDialpad],
  template: `
    <div class="grid gap-4 md:grid-cols-[minmax(260px,300px)_minmax(220px,1fr)]">
      <div class="grid gap-3">
        <hell-dialpad
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [invalid]="invalid()"
          (digit)="onDigit($event)"
          (valueChange)="onValue($event)"
          (call)="called.set($event)"
        />
        <div class="flex flex-wrap gap-2">
          <button
            hellButton
            type="button"
            size="sm"
            variant="soft"
            [attr.aria-pressed]="disabled()"
            (click)="disabled.update(toggle)"
          >
            Disabled
          </button>
          <button
            hellButton
            type="button"
            size="sm"
            variant="soft"
            [attr.aria-pressed]="readOnly()"
            (click)="readOnly.update(toggle)"
          >
            Readonly
          </button>
          <button
            hellButton
            type="button"
            size="sm"
            variant="soft"
            [attr.aria-pressed]="invalid()"
            (click)="invalid.update(toggle)"
          >
            Invalid
          </button>
        </div>
      </div>

      <dl class="grid content-start gap-2">
        <div>
          <dt class="text-xs font-semibold">Last digit</dt>
          <dd>
            <code>{{ last() || '—' }}</code>
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold">Current number</dt>
          <dd>
            <code>{{ number() || '—' }}</code>
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold">Last call</dt>
          <dd>
            <code>{{ called() || '—' }}</code>
          </dd>
        </div>
      </dl>
    </div>
  `,
})
export class DialpadExampleExample {
  protected readonly last = signal('');
  protected readonly number = signal('');
  protected readonly called = signal('');
  protected readonly disabled = signal(false);
  protected readonly readOnly = signal(false);
  protected readonly invalid = signal(false);
  protected readonly toggle = (value: boolean) => !value;

  protected onDigit(d: string) {
    this.last.set(d);
  }

  protected onValue(value: string) {
    this.number.set(value);
  }
}
