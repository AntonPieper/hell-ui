import { Component, inject, signal, viewChild, type TemplateRef } from '@angular/core';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { hellSearchResource, type HellSearchField } from 'hell-ui/core';
import { HELL_DIALOG_IMPORTS } from 'hell-ui/dialog';
import { HELL_OMNIBAR_IMPORTS, type HellOmnibarUi } from 'hell-ui/omnibar';
import { HELL_PAGE_HEADER_IMPORTS, type HellPageHeaderUi } from 'hell-ui/page-header';
import {
  HELL_TOAST_IMPORTS,
  HellToastService,
  type HellToastRef,
  type HellToastUpdate,
  type HellToasterUi,
} from 'hell-ui/toast';
import { HELL_TOOLBAR_IMPORTS, type HellOverflowToolbarUi } from 'hell-ui/toolbar';

interface SearchItem {
  readonly label: string;
  readonly section: string;
}

// App shell page with overlay surfaces: dialog, omnibar, toast, and the
// overflow toolbar all render from the packed composite entry points.
@Component({
  selector: 'app-composite-shell',
  imports: [
    ...HELL_APP_SHELL_IMPORTS,
    ...HELL_DIALOG_IMPORTS,
    ...HELL_OMNIBAR_IMPORTS,
    ...HELL_PAGE_HEADER_IMPORTS,
    ...HELL_TOAST_IMPORTS,
    ...HELL_TOOLBAR_IMPORTS,
  ],
  template: `
    <div hellAppShell ui="bg-hell-surface-muted">
      <header hellAppTopbar>
        <button hellSidenavToggle type="button" ui="text-hell-primary"></button>
      </header>
      <nav hellAppSidenav>Navigation</nav>
      <main
        hellAppContent
        data-test-id="app-shell-content"
        ui="[--hell-app-content-max-width:960px]"
      >
        <hell-page-header [level]="2" [ui]="pageHeaderUi">
          <hell-page-header-back (back)="backCount += 1" />
          <span hellPageHeaderTitle>Consumer fixture</span>
          <span hellPageHeaderMeta>Beta</span>
          <p hellPageHeaderDescription>Composite recipes compile from the packed entrypoints.</p>
          <div hellPageHeaderToolbar>Actions</div>
        </hell-page-header>

        <button type="button" [hellDialogTrigger]="dialog">Open dialog</button>
        <ng-template #dialog>
          <div hellDialogOverlay scoped [ui]="dialogOverlayUi">
            <section hellDialog [ui]="dialogUi">
              <h2 hellDialogTitle>Consumer fixture dialog</h2>
              <p hellDialogDescription>Dialog recipe classes compile in consumers.</p>
            </section>
          </div>
        </ng-template>

        <hell-omnibar
          ariaLabel="Search consumer fixture"
          placeholder="Search"
          [(query)]="searchQuery"
          [ui]="omnibarUi"
        >
          <div hellOmnibarGroup label="Docs">
            @for (item of search.items(); track item.label) {
              <button hellOmnibarItem type="button" [value]="item">
                <span hellOmnibarItemText>
                  {{ item.label }}
                  <span hellOmnibarItemSubtext>{{ item.section }}</span>
                </span>
                <span hellOmnibarItemTrailing>docs</span>
              </button>
            } @empty {
              <span role="status">No package features match</span>
            }
          </div>
        </hell-omnibar>

        <button type="button" (click)="showToast()">Show toast</button>
        <button type="button" [disabled]="!toastRef" (click)="updateToast()">Update toast</button>
        <button type="button" [disabled]="!toastRef" (click)="dismissToast()">Dismiss toast</button>
        <ng-template #toastBody let-toast>
          <span>Consumer fixture toast</span>
          <button type="button" (click)="toast.dismiss()">Dismiss template toast</button>
        </ng-template>
        <hell-toaster [ui]="toasterUi" />

        <div hellToolbar label="Formatting" ui="w-fit">
          <button hellToolbarItem type="button" (click)="toolbarActivations += 1">Bold</button>
          <button hellToolbarItem type="button" disabled>Locked</button>
          <button hellToolbarItem type="button" (click)="toolbarActivations += 1">Share</button>
        </div>

        <hell-overflow-toolbar label="Package actions" [ui]="overflowToolbarUi">
          <ng-template
            hellToolbarAction
            label="Create"
            overflow="never"
            (activated)="toolbarActivations += 1"
          ></ng-template>
          <ng-template
            hellToolbarAction
            label="Duplicate"
            overflow="auto"
            (activated)="toolbarActivations += 1"
          ></ng-template>
          <ng-template hellToolbarSeparator></ng-template>
          <ng-template
            hellToolbarAction
            label="Settings"
            overflow="always"
            (activated)="toolbarActivations += 1"
          ></ng-template>
        </hell-overflow-toolbar>
      </main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>
          <button hellSecondaryToggle type="button">Details</button>
          <p>Secondary</p>
        </div>
      </aside>
    </div>
  `,
})
export class CompositeShell {
  private readonly toast = inject(HellToastService);
  private readonly toastBody =
    viewChild.required<TemplateRef<{ $implicit: HellToastRef }>>('toastBody');
  protected backCount = 0;
  protected readonly dialogOverlayUi = { root: 'p-hell-4' };
  protected readonly dialogUi = { root: 'max-w-[520px]' };
  protected readonly omnibarUi = { root: 'max-w-[360px]' } satisfies HellOmnibarUi;
  protected readonly overflowToolbarUi = { root: 'max-w-[480px]' } satisfies HellOverflowToolbarUi;
  protected readonly pageHeaderUi = {
    root: 'border border-hell-border p-hell-4',
    title: 'text-2xl',
  } satisfies HellPageHeaderUi;
  protected readonly toasterUi = { toast: 'ring-1 ring-hell-border' } satisfies HellToasterUi;
  protected toolbarActivations = 0;
  protected toastRef: HellToastRef | null = null;
  protected readonly searchFields: readonly HellSearchField<SearchItem>[] = [
    { name: 'label', weight: 4, get: (item) => item.label },
    { name: 'section', weight: 1, get: (item) => item.section },
  ];
  protected readonly searchQuery = signal('');
  protected readonly search = hellSearchResource({
    query: this.searchQuery,
    items: [
      { label: 'Dialog', section: 'Feedback' },
      { label: 'Toast', section: 'Feedback' },
      { label: 'Omnibar', section: 'Search' },
    ] satisfies readonly SearchItem[],
    fields: this.searchFields,
  });

  protected showToast(): void {
    this.toastRef = this.toast.show({
      template: this.toastBody(),
      announcement: 'Consumer fixture toast',
      duration: 0,
    });
  }

  protected updateToast(): void {
    const patch = {
      template: null,
      title: 'Consumer fixture toast updated',
      description: null,
      variant: 'success',
      duration: 4_000,
    } satisfies HellToastUpdate;
    this.toastRef?.update(patch);
  }

  protected dismissToast(): void {
    this.toastRef?.dismiss();
  }
}
