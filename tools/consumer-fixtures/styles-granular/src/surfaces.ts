import { afterNextRender, Component, viewChild } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HELL_PAGE_HEADER_IMPORTS } from 'hell-ui/page-header';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';
import { HellToolbar, HellToolbarItem } from 'hell-ui/toolbar';

// The representative primitive (button, card), composite (page header,
// toolbar), and overlay (popover) surfaces shared by the aggregate and
// granular style-mode fixtures. Both fixtures render this exact component so
// the shared computed-style smoke steps compare like for like; only the
// stylesheet imports in src/styles.css differ between the two modes.
@Component({
  selector: 'app-style-mode-surfaces',
  imports: [
    HellButton,
    ...HELL_CARD_IMPORTS,
    ...HELL_PAGE_HEADER_IMPORTS,
    HellPopover,
    HellPopoverTrigger,
    HellToolbar,
    HellToolbarItem,
  ],
  template: `
    <button hellButton type="button" variant="primary" data-test-id="mode-button">Save</button>

    <div hellCard data-test-id="mode-card">
      <div hellCardHeader>Card header</div>
      <div hellCardBody>Card body</div>
    </div>

    <hell-page-header [level]="2" data-test-id="mode-page-header">
      <span hellPageHeaderTitle data-test-id="mode-page-header-title">Style modes</span>
      <p hellPageHeaderDescription>Aggregate and granular standard styles stay equivalent.</p>
    </hell-page-header>

    <div hellToolbar label="Formatting" data-test-id="mode-toolbar">
      <button hellToolbarItem type="button" data-test-id="mode-toolbar-item">Bold</button>
      <button hellToolbarItem type="button">Italic</button>
    </div>

    <button type="button" [hellPopoverTrigger]="popover" data-test-id="mode-popover-trigger">
      Profile
    </button>
    <ng-template #popover>
      <div hellPopover data-test-id="mode-popover">Popover surface</div>
    </ng-template>
  `,
})
export class StyleModeSurfaces {
  private readonly popoverTrigger = viewChild.required(HellPopoverTrigger);

  constructor() {
    // The smoke asserts computed styles on the open popover panel, so the
    // fixture opens it deterministically instead of scripting a click.
    afterNextRender(() => void this.popoverTrigger().show());
  }
}
