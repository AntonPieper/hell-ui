import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';

@Component({
  selector: 'app-dialog-unstyled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_DIALOG_DIRECTIVES],
  template: `
    <button
      type="button"
      class="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      [hellDialogTrigger]="unstyledDialog"
    >
      Open unstyled dialog
    </button>

    <ng-template #unstyledDialog let-close="close">
      <div
        hellDialogOverlay
        unstyled
        class="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 p-6"
      >
        <section
          hellDialog
          unstyled
          class="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-950 shadow-2xl ring-1 ring-zinc-200"
        >
          <h2 hellDialogTitle unstyled class="m-0 text-xl font-semibold">Unstyled confirmation</h2>
          <p hellDialogDescription unstyled class="mt-3 text-sm leading-6 text-zinc-600">
            The dialog behavior stays intact while consumer CSS owns the presentation.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              (click)="close()"
            >
              Keep editing
            </button>
            <button
              type="button"
              class="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              (click)="close()"
            >
              Send unstyled
            </button>
          </div>
        </section>
      </div>
    </ng-template>
  `,
})
export class DialogUnstyledExample {}
