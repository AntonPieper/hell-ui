import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

@Component({
  selector: 'app-omnibar-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <!-- HellOmnibarPart names owned anatomy: control, inputWrap, input, panel, … -->
    <hell-omnibar
      class="max-w-90"
      placeholder="Search runbooks"
      ariaLabel="Search runbooks"
      [ui]="{
        control: 'border-hell-primary',
        input: 'font-mono',
        panel: 'border-hell-primary',
      }"
      [(value)]="query"
    >
      <div hellOmnibarGroup label="Runbooks">
        <div hellOmnibarGroupLabel>Runbooks</div>
        <button hellOmnibarItem type="button" [value]="'incident'">
          <span hellOmnibarItemText>Incident response</span>
        </button>
        <button hellOmnibarItem type="button" [value]="'oncall'">
          <span hellOmnibarItemText>On-call rotation</span>
        </button>
      </div>
    </hell-omnibar>
  `,
})
export class OmnibarStylingExample {
  protected readonly query = signal('');
}
