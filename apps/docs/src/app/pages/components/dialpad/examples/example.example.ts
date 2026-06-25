import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { HellDialpad, type HellDialpadUi } from '@hell-ui/angular/dialpad';
import {
  HellToggleGroup,
  HellToggleGroupItem,
  type HellToggleGroupValue,
} from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-dialpad-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div class="grid gap-4 md:grid-cols-[minmax(260px,300px)_minmax(220px,1fr)]">
      <div class="grid gap-3">
        <hell-dialpad
          [ui]="dialpadUi"
          [disabled]="disabled()"
          [readOnly]="readOnly()"
          [invalid]="invalid()"
          (digit)="onDigit($event)"
          (valueChange)="onValue($event)"
          (call)="called.set($event)"
        />
        <div
          hellToggleGroup
          type="multiple"
          class="flex flex-wrap"
          aria-label="Dialpad states"
          [value]="states()"
          (valueChange)="onStatesChange($event)"
        >
          <button hellToggleGroupItem type="button" value="disabled">Disabled</button>
          <button hellToggleGroupItem type="button" value="readonly">Readonly</button>
          <button hellToggleGroupItem type="button" value="invalid">Invalid</button>
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
  protected readonly states = signal<string[]>([]);
  protected readonly disabled = computed(() => this.states().includes('disabled'));
  protected readonly readOnly = computed(() => this.states().includes('readonly'));
  protected readonly invalid = computed(() => this.states().includes('invalid'));
  protected readonly dialpadUi = {
    root: 'max-w-[320px]',
    display: 'bg-hell-primary-soft',
    numberInput: 'text-hell-primary',
    keyButton: 'rounded-full',
    callButton: 'rounded-full shadow-lg',
  } satisfies HellDialpadUi;

  protected onDigit(d: string) {
    this.last.set(d);
  }

  protected onValue(value: string) {
    this.number.set(value);
  }

  protected onStatesChange(value: HellToggleGroupValue) {
    this.states.set(Array.isArray(value) ? [...value] : value ? [value] : []);
  }
}
