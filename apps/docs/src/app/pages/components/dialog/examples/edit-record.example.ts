import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HELL_DIALOG_IMPORTS } from '@hell-ui/angular/dialog';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput, HellTextarea } from '@hell-ui/angular/input';

interface Customer {
  name: string;
  notes: string;
}

@Component({
  selector: 'app-dialog-edit-record-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellInput,
    HellTextarea,
    ...HELL_CARD_IMPORTS,
    ...HELL_DIALOG_IMPORTS,
    ...HELL_FIELD_IMPORTS,
  ],
  template: `
    <div class="flex items-center gap-hell-4">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-hell-foreground">{{ customer().name }}</div>
        <div class="truncate text-sm text-hell-foreground-muted">{{ customer().notes }}</div>
      </div>
      <button
        hellButton
        variant="soft"
        [hellDialogData]="customer()"
        [hellDialogTrigger]="edit"
        (closed)="applyEdit($event)"
      >
        Edit
      </button>
    </div>

    <!-- The template context exposes the passed record via ref.data and a typed close(). -->
    <ng-template #edit let-ref let-close="close">
      <div hellDialogOverlay>
        <form
          hellDialog
          (submit)="
            $event.preventDefault();
            close({ name: name.value.trim(), notes: notes.value.trim() })
          "
        >
          <div hellCardHeader>
            <h2 hellDialogTitle>Edit customer</h2>
          </div>
          <div hellCardBody class="grid gap-hell-4">
            <div hellField>
              <label hellFieldLabel for="edit-name">Name</label>
              <input #name id="edit-name" hellInput [value]="ref.data.name" />
            </div>
            <div hellField>
              <label hellFieldLabel for="edit-notes">Notes</label>
              <textarea #notes id="edit-notes" hellTextarea rows="3">{{ ref.data.notes }}</textarea>
              <div hellFieldDescription>Shown on the account overview.</div>
            </div>
          </div>
          <div hellCardFooter>
            <button hellButton variant="ghost" type="button" (click)="close()">Cancel</button>
            <button hellButton variant="primary" type="submit">Save</button>
          </div>
        </form>
      </div>
    </ng-template>
  `,
})
export class DialogEditRecordExample {
  protected readonly customer = signal<Customer>({
    name: 'Acme Logistics',
    notes: 'Net-30 terms; primary contact is billing@acme.test.',
  });

  /** `closed` fires with the result the footer passed to `close()`, or `undefined` on cancel. */
  protected applyEdit(result: unknown): void {
    if (result) this.customer.set(result as Customer);
  }
}
