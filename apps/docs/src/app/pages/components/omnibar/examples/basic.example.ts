import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

@Component({
  selector: 'app-omnibar-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Search actions"
      ariaLabel="Search actions"
      [(value)]="query"
      (submit)="lastAction.set($any($event.item))"
    >
      <div hellOmnibarGroup label="Actions">
        <div hellOmnibarGroupLabel>Actions</div>
        <button hellOmnibarItem type="button" [value]="'new-invoice'">
          <span hellOmnibarItemText>Create invoice</span>
        </button>
        <button hellOmnibarItem type="button" [value]="'export'">
          <span hellOmnibarItemText>Export report</span>
        </button>
        <button hellOmnibarItem type="button" [value]="'archive'">
          <span hellOmnibarItemText>Archive project</span>
        </button>
      </div>
    </hell-omnibar>

    @if (lastAction(); as action) {
      <p class="mt-3 text-sm hd-muted">Submitted: {{ action }}</p>
    }
  `,
})
export class OmnibarBasicExample {
  protected readonly query = signal('');
  protected readonly lastAction = signal<string | null>(null);
}
