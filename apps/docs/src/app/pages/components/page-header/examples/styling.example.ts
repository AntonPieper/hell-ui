import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidPlus } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_PAGE_HEADER_IMPORTS, type HellPageHeaderUi } from '@hell-ui/angular/page-header';
import { HellChip } from '@hell-ui/angular/chip';
import { HELL_TOOLBAR_IMPORTS } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-page-header-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidPlus })],
  imports: [HellIcon, HellChip, ...HELL_PAGE_HEADER_IMPORTS, ...HELL_TOOLBAR_IMPORTS],
  template: `
    <hell-page-header [ui]="headerUi">
      <span hellPageHeaderTitle>Billing</span>
      <span hellChip hellPageHeaderMeta variant="warning">Past due</span>
      <p hellPageHeaderDescription>Invoices and payment methods for your organization.</p>

      <hell-overflow-toolbar hellPageHeaderToolbar label="Billing actions">
        <ng-template hellToolbarAction label="New invoice" overflow="never" variant="primary">
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Export"></ng-template>
      </hell-overflow-toolbar>
    </hell-page-header>
  `,
})
export class PageHeaderStylingExample {
  protected readonly headerUi = {
    root: 'rounded-hell-xl border border-hell-border bg-hell-surface-elevated p-hell-5 shadow-hell-xs',
    titleGroup: 'gap-hell-2',
    title: 'text-2xl',
    meta: 'gap-hell-1',
    description: 'text-hell-foreground-subtle',
    toolbar: 'sm:justify-end',
  } satisfies HellPageHeaderUi;
}
