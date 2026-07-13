import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellBadge, HellKbd, HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-tag-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTag, HellBadge, HellKbd],
  template: `
    <span hellTag variant="primary" ui="rounded-hell-sm bg-hell-primary px-hell-3 text-hell-foreground-inverse">
      Priority
    </span>
    <span hellTag variant="success" [ui]="tagUi">Verified</span>

    <span class="relative inline-flex pr-6">
      Alerts
      <span hellBadge ui="min-w-hell-6 bg-hell-primary">7</span>
    </span>
    <span class="relative inline-flex pr-6">
      Errors
      <span hellBadge [ui]="badgeUi">!</span>
    </span>

    <kbd hellKbd ui="rounded-hell-sm border-hell-primary text-hell-primary">Esc</kbd>
    <kbd hellKbd [ui]="kbdUi">Enter</kbd>
  `,
})
export class TagStylingExample {
  protected readonly tagUi = {
    root: 'rounded-hell-md bg-hell-success-strong text-hell-foreground-inverse',
  };

  protected readonly badgeUi = {
    root: 'rounded-hell-sm bg-hell-danger-strong',
  };

  protected readonly kbdUi = {
    root: 'h-hell-6 min-w-hell-6 rounded-hell-md bg-hell-surface-elevated text-hell-foreground',
  };
}
