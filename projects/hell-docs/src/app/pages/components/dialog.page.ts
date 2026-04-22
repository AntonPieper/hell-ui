import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HELL_DIALOG_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_DIALOG_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Dialog</h1>
      <p>A floating window for short, focused tasks. Built on the
        <code>NgpDialog</code> primitive — overlay, focus trap, escape-to-close
        and outside-click-to-close are all handled for you.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <button hellButton variant="primary" [hellDialogTrigger]="confirm">
          Publish article
        </button>

        <ng-template #confirm let-close="close">
          <div hellDialogOverlay>
            <div hellDialog size="md">
              <div hellDialogHeader>
                <h2 hellDialogTitle>Publish this article?</h2>
              </div>
              <div hellDialogBody>
                <p hellDialogDescription>
                  Once published, the article will be visible to everyone.
                </p>
              </div>
              <div hellDialogFooter>
                <button hellButton variant="ghost" (click)="close()">Cancel</button>
                <button hellButton variant="primary" (click)="close()">Publish</button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <h2>Anatomy</h2>
      <ul>
        <li><code>[hellDialogTrigger]</code> — the element that opens the dialog</li>
        <li><code>hellDialogOverlay</code> — the dimmed backdrop</li>
        <li><code>hellDialog</code> — the dialog box itself</li>
        <li><code>hellDialogHeader</code>, <code>hellDialogTitle</code>,
          <code>hellDialogDescription</code>, <code>hellDialogBody</code>,
          <code>hellDialogFooter</code> — semantic regions</li>
      </ul>
    </article>
  `,
})
export class DialogPage {}
