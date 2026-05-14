import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

import { HellButton } from '../lib/primitives/button/button';
import { HELL_DIALOG_DIRECTIVES } from '../lib/primitives/dialog/dialog';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '../lib/features/table-utilities/table-utilities';
import {
  HellButtonHarness,
  HellDialogDescriptionHarness,
  HellDialogHarness,
  HellDialogOverlayHarness,
  HellDialogTitleHarness,
  HellDialogTriggerHarness,
  HellTableContainerHarness,
} from './public-api';

const nativeGetAnimations = HTMLElement.prototype.getAnimations;

beforeAll(() => {
  if (!nativeGetAnimations) {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  }
});

afterAll(() => {
  if (!nativeGetAnimations) {
    delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  }
});

@Component({
  imports: [HellButton],
  template: `
    <button id="button-native" hellButton type="button">Native</button>
    <a id="button-anchor" hellButton href="#next" [disabled]="disabled()">Anchor</a>
  `,
})
class ButtonHarnessHost {
  readonly disabled = signal(false);
}

@Component({
  imports: [...HELL_DIALOG_DIRECTIVES, HellButton],
  template: `
    <button id="open-dialog" type="button" [hellDialogTrigger]="dialogTemplate">
      Open dialog
    </button>

    <ng-template #dialogTemplate let-close="close">
      <div id="overlay" hellDialogOverlay>
        <div hellDialog>
          <h2 id="title" hellDialogTitle>Dialog title</h2>
          <p id="description" hellDialogDescription>
            Dialog description
          </p>
          <button id="close-dialog" hellButton type="button" (click)="close()">Close dialog</button>
        </div>
      </div>
    </ng-template>
  `,
})
class DialogHarnessHost {}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="table-container" hellTableContainer>
      <table hellTable>
        <thead hellTableHead>
          <tr>
            <th
              id="name-header"
              hellTableHeaderCell
              [columnId]="nameColumnId()"
              [sortable]="sortable()"
              [sort]="sortValue()"
            >
              <button hellTableSortButton id="sort-name" type="button">Name</button>
              <button
                id="name-resizer"
                hellTableColumnResizer
                aria-label="Resize name column"
                [minWidth]="40"
              ></button>
            </th>
            <th id="role-header" hellTableHeaderCell columnId="role" [sort]="null">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr id="person-row" hellTableRow interactive [selected]="selected()" (rowSelect)="onRowSelect()">
            <td hellTableCell id="person-name">Alice</td>
            <td hellTableCell>Admin</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
class TableHarnessHost {
  readonly nameColumnId = signal('name');
  readonly selected = signal(true);
  readonly sortable = signal(true);
  readonly sortValue = signal<'asc' | 'desc' | null>(null);

  rowSelectEvents = 0;

  onRowSelect(): void {
    this.rowSelectEvents += 1;
  }
}

describe('hell testing harness entrypoint', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonHarnessHost, DialogHarnessHost, TableHarnessHost],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('finds button harnesses by directive selector', async () => {
    const fixture = TestBed.createComponent(ButtonHarnessHost);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const buttons = await loader.getAllHarnesses(HellButtonHarness);

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].isAnchor()).toBe(false);
    expect(await buttons[1].isAnchor()).toBe(true);

    const anchor = await loader.getHarness(HellButtonHarness.with({ text: 'Anchor' }));

    expect(await anchor.isDisabled()).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(await anchor.isDisabled()).toBe(true);
  });

  it('loads dialog harnesses from the document root overlay', async () => {
    const fixture = TestBed.createComponent(DialogHarnessHost);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    const trigger = await loader.getHarness(HellDialogTriggerHarness.with({ text: 'Open dialog' }));
    await trigger.click();

    const overlay = await documentRootLoader.getHarness(HellDialogOverlayHarness);
    const title = (await documentRootLoader.getAllHarnesses(HellDialogTitleHarness))[0];
    const description = (await documentRootLoader.getAllHarnesses(HellDialogDescriptionHarness))[0];
    const dialog = await documentRootLoader.getHarness(HellDialogHarness);

    expect(await overlay.isScoped()).toBe(false);
    expect(await title.getText()).toBe('Dialog title');
    expect(await description.getText()).toBe('Dialog description');
    expect(await dialog.getText()).toContain('Dialog title');
  });

  it('interacts with table utility harnesses', async () => {
    const fixture = TestBed.createComponent(TableHarnessHost);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const container = await loader.getHarness(HellTableContainerHarness);
    const table = await container.getTable();
    const headers = await table.getHeaderCells();
    const body = await table.getBody();
    expect(body).not.toBeNull();
    const rows = await body!.getRows();
    const row = rows[0];

    expect(headers).toHaveLength(2);

    const nameHeader = await table.getHeaderCellByColumnId('name');

    expect(nameHeader).not.toBeNull();
    expect(await nameHeader!.isSortable()).toBe(true);
    expect(await nameHeader!.getColumnId()).toBe('name');
    expect(await nameHeader!.getSortState()).toBeNull();

    const sortButton = await nameHeader!.getSortButton();
    expect(sortButton).not.toBeNull();

    expect(await sortButton!.getText()).toBe('Name');
    expect(await sortButton!.isDisabled()).toBe(false);

    const resizer = await nameHeader!.getColumnResizer();
    expect(resizer).not.toBeNull();
    expect(await resizer!.getAriaLabel()).toBe('Resize name column');
    expect(await resizer!.getAriaValueNow()).toBe('50');

    const roleHeader = await table.getHeaderCellByColumnId('role');
    expect(roleHeader).not.toBeNull();
    expect(await roleHeader!.isSortable()).toBe(false);

    const rowCells = await row.getCells();
    expect(rowCells).toHaveLength(2);
    expect(await rowCells[0].getText()).toBe('Alice');
    expect(await rowCells[1].getText()).toBe('Admin');

    const selectedRows = await table.getRows();
    expect(selectedRows).toHaveLength(1);
    expect(await selectedRows[0].isSelected()).toBe(true);

    await selectedRows[0].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.rowSelectEvents).toBe(1);
  });
});
