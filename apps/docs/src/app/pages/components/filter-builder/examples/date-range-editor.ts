import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
} from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellDateInput } from '@hell-ui/angular/date-input';
import type {
  HellFilter,
  HellFilterBuilderEditorContext,
} from '@hell-ui/angular/features/filter-builder';

interface DateRange {
  readonly from: string | null;
  readonly to: string | null;
}

export interface CreatedFilter extends HellFilter<'created', 'between', DateRange> {
  readonly id: string;
}

@Component({
  selector: 'app-filter-builder-date-range-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellDateInput],
  template: `
    <div class="flex min-w-72 flex-wrap items-end gap-hell-2" data-testid="date-range-editor">
      <div class="grid gap-hell-1 text-xs font-medium">
        <span>Created from</span>
        <input
          hellDateInput
          size="sm"
          aria-label="Created from"
          [value]="from()"
          (valueChange)="from.set($event)"
        />
      </div>
      <div class="grid gap-hell-1 text-xs font-medium">
        <span>Created to</span>
        <input
          hellDateInput
          size="sm"
          aria-label="Created to"
          [value]="to()"
          (valueChange)="to.set($event)"
        />
      </div>
      <div class="flex gap-hell-1">
        <button hellButton type="button" size="sm" variant="soft" (click)="commit()">
          Apply range
        </button>
        <button hellButton type="button" size="sm" variant="ghost" (click)="editor().cancel()">
          Cancel
        </button>
      </div>
    </div>
  `,
})
export class FilterBuilderDateRangeEditor {
  readonly editor = input.required<HellFilterBuilderEditorContext<CreatedFilter>>();

  protected readonly from = signal<Date | null>(null);
  protected readonly to = signal<Date | null>(null);
  private syncedSession = '';
  private nextIdentity = 0;

  constructor() {
    effect(() => {
      const editor = this.editor();
      const filter = editor.filter;
      const session = `${editor.mode}:${filter?.id ?? 'new'}:${filter?.value.from ?? ''}:${filter?.value.to ?? ''}`;
      if (session === this.syncedSession) return;
      this.syncedSession = session;
      this.from.set(parseLocalDate(filter?.value.from ?? null));
      this.to.set(parseLocalDate(filter?.value.to ?? null));
    });
  }

  protected commit(): void {
    const editor = this.editor();
    this.nextIdentity += 1;
    editor.commit({
      id: editor.filter?.id ?? `created-filter-${this.nextIdentity}`,
      field: 'created',
      operator: 'between',
      value: {
        from: formatLocalDate(this.from()),
        to: formatLocalDate(this.to()),
      },
    });
  }
}

function parseLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(value: Date | null): string | null {
  if (!value) return null;
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
