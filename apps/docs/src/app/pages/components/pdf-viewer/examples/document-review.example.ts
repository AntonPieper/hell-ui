import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleCheck, faSolidFilePdf } from '@ng-icons/font-awesome/solid';
import { HellPdfViewer } from '@hell-ui/angular/features/pdf-viewer';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_MASTER_DETAIL_IMPORTS } from '@hell-ui/angular/master-detail';
import { HellChip } from '@hell-ui/angular/chip';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

interface ReviewDoc {
  readonly id: string;
  readonly title: string;
  readonly submitter: string;
  readonly status: 'Pending' | 'Approved';
}

const DOCS: readonly ReviewDoc[] = [
  { id: 'INV-2041', title: 'Acme Logistics — March', submitter: 'Ada Lovelace', status: 'Pending' },
  { id: 'INV-2042', title: 'Northwind Freight — March', submitter: 'Grace Hopper', status: 'Pending' },
  { id: 'INV-2039', title: 'Contoso Haulage — Feb', submitter: 'Katherine Johnson', status: 'Approved' },
];

@Component({
  selector: 'app-pdf-viewer-document-review-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellPdfViewer,
    HellButton,
    HellIcon,
    HellChip,
    ...HELL_CARD_IMPORTS,
    ...HELL_MASTER_DETAIL_IMPORTS,
  ],
  providers: [provideIcons({ faSolidCircleCheck, faSolidFilePdf })],
  template: `
    <div
      hellMasterDetail
      data-testid="pdf-master-detail"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      ui="grid h-[520px] min-w-0 grid-cols-[minmax(16rem,2fr)_minmax(0,3fr)] overflow-hidden rounded-hell-md border border-hell-border bg-hell-surface data-[compact=true]:grid-cols-1"
    >
      <section
        hellMasterPane="primary"
        ui="min-h-0 min-w-0 overflow-auto border-e border-hell-border"
      >
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-3">
          <div class="flex items-center justify-between">
            <strong class="text-sm font-semibold text-hell-foreground">Review queue</strong>
            <span class="text-xs text-hell-foreground-muted">{{ pendingCount() }} pending</span>
          </div>
          <div class="grid gap-1">
            @for (doc of docs(); track doc.id) {
              <button
                hellButton
                size="sm"
                block
                variant="ghost"
                type="button"
                [ui]="rowUi"
                [attr.data-current]="doc.id === selectedId() ? 'true' : null"
                [attr.aria-current]="doc.id === selectedId() ? 'true' : null"
                (click)="select(doc.id)"
              >
                <hell-icon name="faSolidFilePdf" />
                <span class="min-w-0 flex-1 truncate">{{ doc.title }}</span>
                @if (doc.status === 'Approved') {
                  <hell-icon name="faSolidCircleCheck" class="text-hell-success" />
                }
              </button>
            }
          </div>
        </div>
      </section>

      <section hellMasterPane="detail" ui="min-h-0 min-w-0 overflow-auto">
        @if (selected(); as doc) {
          <div hellCard class="m-3 flex min-h-0 flex-1" [ui]="{ root: 'flex-1' }">
            <div hellCardHeader ui="flex-wrap gap-2">
              <button
                hellMasterDetailBack
                hellButton
                variant="ghost"
                size="sm"
                type="button"
                class="basis-full justify-self-start"
              >
                Back to review queue
              </button>
              <div class="grid gap-0.5">
                <strong class="text-sm font-semibold text-hell-foreground">{{ doc.title }}</strong>
                <span class="text-xs font-normal text-hell-foreground-muted">
                  {{ doc.id }} · submitted by {{ doc.submitter }}
                </span>
              </div>
              <span hellChip [variant]="doc.status === 'Approved' ? 'success' : 'warning'">
                {{ doc.status }}
              </span>
            </div>
            <div hellCardBody [ui]="{ root: 'flex min-h-0 flex-1 p-0' }">
              <hell-pdf-viewer
                class="min-h-0 flex-1"
                [src]="src"
                [worker]="worker"
                [fileName]="doc.id + '.pdf'"
                [ui]="{ root: 'rounded-none border-0' }"
              />
            </div>
            <div hellCardFooter>
              <button hellButton size="sm" variant="ghost" type="button">Request changes</button>
              <button
                hellButton
                size="sm"
                variant="primary"
                type="button"
                [disabled]="doc.status === 'Approved'"
                (click)="approve(doc.id)"
              >
                {{ doc.status === 'Approved' ? 'Approved' : 'Approve' }}
              </button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class PdfViewerDocumentReviewExample {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  protected readonly docs = signal<readonly ReviewDoc[]>(DOCS);
  protected readonly selectedId = signal(DOCS[0].id);
  protected readonly detailOpen = signal(true);

  protected readonly rowUi = {
    root: 'justify-start gap-2 data-[current=true]:border-hell-border data-[current=true]:bg-hell-primary-soft data-[current=true]:text-hell-primary-soft-foreground',
  };

  protected readonly selected = computed(
    () => this.docs().find((doc) => doc.id === this.selectedId()) ?? null,
  );
  protected readonly pendingCount = computed(
    () => this.docs().filter((doc) => doc.status === 'Pending').length,
  );

  constructor() {
    usePdfViewerStyles();
  }

  protected select(id: string): void {
    this.selectedId.set(id);
    this.detailOpen.set(true);
  }

  protected approve(id: string): void {
    this.docs.update((docs) =>
      docs.map((doc) => (doc.id === id ? { ...doc, status: 'Approved' as const } : doc)),
    );
  }
}
