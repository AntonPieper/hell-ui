import { ChangeDetectionStrategy, Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellNativeCheckbox } from '@hell-ui/angular/checkbox';
import { HellConfirmService, type HellConfirmContentContext } from '@hell-ui/angular/confirm';

interface DeleteOptions {
  deleteImportedGroups: boolean;
}

@Component({
  selector: 'app-confirm-content-template-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellNativeCheckbox],
  template: `
    <div class="flex flex-col items-start gap-hell-3">
      <button hellButton variant="danger" type="button" (click)="removeContact()">
        Delete contact
      </button>
      <p class="text-[13px] text-hell-foreground-muted" aria-live="polite">{{ status() }}</p>
    </div>

    <!-- The template's state signal is seeded from contentState and rides back in the result. -->
    <ng-template #extra let-state>
      <label class="flex items-center gap-hell-2 text-[13px] text-hell-foreground">
        <input
          type="checkbox"
          hellNativeCheckbox
          [checked]="state().deleteImportedGroups"
          (checkedChange)="state.set({ deleteImportedGroups: $event === true })"
        />
        Also delete imported groups
      </label>
    </ng-template>
  `,
})
export class ConfirmContentTemplateExample {
  private readonly confirm = inject(HellConfirmService);
  protected readonly status = signal('The contact is safe.');

  private readonly extra =
    viewChild.required<TemplateRef<HellConfirmContentContext<DeleteOptions>>>('extra');

  protected async removeContact(): Promise<void> {
    const result = await this.confirm.confirm<DeleteOptions>({
      title: 'Delete this contact?',
      description: 'Choose whether groups imported with the contact go too.',
      severity: 'danger',
      confirmLabel: 'Delete contact',
      content: this.extra(),
      contentState: { deleteImportedGroups: false },
    });

    if (!result.confirmed) {
      this.status.set('The contact is safe.');
      return;
    }
    this.status.set(
      result.content?.deleteImportedGroups
        ? 'Contact and imported groups deleted.'
        : 'Contact deleted; imported groups kept.',
    );
  }
}
