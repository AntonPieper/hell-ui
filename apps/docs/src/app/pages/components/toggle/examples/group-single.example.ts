import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidAlignCenter, faSolidAlignLeft, faSolidAlignRight } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';

@Component({
  selector: 'app-toggle-group-single-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggleGroup, HellToggleGroupItem, HellIcon],
  providers: [provideIcons({ faSolidAlignCenter, faSolidAlignLeft, faSolidAlignRight })],
  template: `
    <div hellToggleGroup type="single" [value]="align()" (valueChange)="align.set($event)" aria-label="Text align">
      <button hellToggleGroupItem value="left" type="button" aria-label="Align left">
        <hell-icon name="faSolidAlignLeft" />
      </button>
      <button hellToggleGroupItem value="center" type="button" aria-label="Align center">
        <hell-icon name="faSolidAlignCenter" />
      </button>
      <button hellToggleGroupItem value="right" type="button" aria-label="Align right">
        <hell-icon name="faSolidAlignRight" />
      </button>
    </div>
    <p class="mt-2 text-sm text-hell-foreground-muted">
      Aligned: <code>{{ align().join(', ') || 'none' }}</code>
    </p>
  `,
})
export class ToggleGroupSingleExample {
  // The raw [value]/(valueChange) template bindings always carry a string
  // array, even in type="single" mode (see the API section) — only the
  // Angular Forms ControlValueAccessor maps single mode to a scalar string.
  protected readonly align = signal<string[]>(['left']);
}
