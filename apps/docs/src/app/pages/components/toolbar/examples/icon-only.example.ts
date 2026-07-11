import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAlignCenter,
  faSolidAlignLeft,
  faSolidAlignRight,
  faSolidBold,
  faSolidItalic,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

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
  imports: [HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-hell-3">
      <hell-toolbar label="Text formatting">
        <ng-template hellToolbarAction label="Bold" iconOnly (activated)="run('bold')">
          <hell-icon name="faSolidBold" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Italic" iconOnly (activated)="run('italic')">
          <hell-icon name="faSolidItalic" size="13px" />
        </ng-template>

        <ng-template hellToolbarSeparator />

        <ng-template hellToolbarAction label="Align left" iconOnly (activated)="run('align-left')">
          <hell-icon name="faSolidAlignLeft" size="13px" />
        </ng-template>
        <ng-template
          hellToolbarAction
          label="Align center"
          iconOnly
          (activated)="run('align-center')"
        >
          <hell-icon name="faSolidAlignCenter" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Align right" iconOnly (activated)="run('align-right')">
          <hell-icon name="faSolidAlignRight" size="13px" />
        </ng-template>
      </hell-toolbar>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Each action sets <code>iconOnly</code>: the inline button hides its text, takes its accessible
        name from <code>label</code> (so screen readers still announce “Bold”), and exposes the label
        as a native <code>title</code> tooltip on hover. A <code>hellToolbarSeparator</code> groups the
        two clusters; the overflow menu always shows the full label. Last action:
        <strong>{{ lastAction() }}</strong>.
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
