import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAlignCenter,
  faSolidAlignLeft,
  faSolidAlignRight,
  faSolidBold,
  faSolidItalic,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_IMPORTS } from '@hell-ui/angular/toolbar';
import { HellTooltip } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-toolbar-icon-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidBold,
      faSolidItalic,
      faSolidAlignLeft,
      faSolidAlignCenter,
      faSolidAlignRight,
    }),
  ],
  imports: [HellButton, HellIcon, HellTooltip, ...HELL_TOOLBAR_IMPORTS],
  template: `
    <div class="flex flex-col gap-hell-3">
      <div hellToolbar label="Text formatting">
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Bold"
          hellTooltip="Bold"
          (click)="run('bold')"
        >
          <hell-icon name="faSolidBold" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Italic"
          hellTooltip="Italic"
          (click)="run('italic')"
        >
          <hell-icon name="faSolidItalic" size="13px" />
        </button>

        <span
          class="mx-hell-1 h-5 w-px bg-hell-border"
          role="separator"
          aria-orientation="vertical"
        ></span>

        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align left"
          hellTooltip="Align left"
          (click)="run('align-left')"
        >
          <hell-icon name="faSolidAlignLeft" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align center"
          hellTooltip="Align center"
          (click)="run('align-center')"
        >
          <hell-icon name="faSolidAlignCenter" size="13px" />
        </button>
        <button
          hellButton
          hellToolbarItem
          iconOnly
          size="sm"
          type="button"
          aria-label="Align right"
          hellTooltip="Align right"
          (click)="run('align-right')"
        >
          <hell-icon name="faSolidAlignRight" size="13px" />
        </button>
      </div>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Each item is the same consumer-owned <code>hellButton</code>, string
        <code>hellTooltip</code>, and click handler it would be outside the toolbar.
        <code>hellToolbarItem</code> adds only focus registration, so the tooltip and button
        directives compose on one host without competing bindings.
        Last action: <strong>{{ lastAction() }}</strong>.
      </p>
    </div>
  `,
})
export class ToolbarIconOnlyExample {
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
