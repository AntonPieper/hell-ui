import { Component, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgpMenuTrigger } from 'ng-primitives/menu';

import { HellButton } from '@hell-ui/angular/button';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';
import { HellDatePicker } from '@hell-ui/angular/date-picker';
import { HELL_DIALOG_DIRECTIVES } from '@hell-ui/angular/dialog';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { HellSlider } from '@hell-ui/angular/slider';
import { HELL_TABS_DIRECTIVES } from '@hell-ui/angular/tabs';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HellDropZone } from '@hell-ui/angular/drop-zone';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HellTimeInput } from '@hell-ui/angular/time-input';
import { HellToaster, HellToastService } from '@hell-ui/angular/toast';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import {
  HellButtonHarness,
  HellDialogDescriptionHarness,
  HellDialogHarness,
  HellDialogOverlayHarness,
  HellDialogTitleHarness,
  HellDialogTriggerHarness,
  HellAccordionHarness,
  HellComboboxHarness,
  HellDateInputHarness,
  HellDatePickerHarness,
  HellDropZoneHarness,
  HellMenuHarness,
  HellMenuTriggerHarness,
  HellOmnibarHarness,
  HellOmnibarPanelHarness,
  HellSelectHarness,
  HellSliderHarness,
  HellTabsetHarness,
  HellTableContainerHarness,
  HellTableRowActionHarness,
  HellTableRowCheckboxHarness,
  HellTableRowRadioHarness,
  HellTimeInputHarness,
  HellToasterHarness,
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
              <button hellTableSortTrigger id="sort-name" type="button">Name</button>
              <button
                id="name-resizer"
                hellTableResizeHandle
                aria-label="Resize name column"
                [minWidth]="40"
              ></button>
            </th>
            <th id="role-header" hellTableHeaderCell columnId="role" [sort]="null">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr id="person-row" hellTableRow [active]="active()" [selected]="selected()">
            <td hellTableCell hellTableSelectionCell>
              <input
                id="person-checkbox"
                hellTableRowCheckbox
                type="checkbox"
                [checked]="selected()"
                (checkedChange)="onRowCheck($event)"
              />
            </td>
            <td hellTableCell id="person-name">Alice</td>
            <td hellTableCell>Admin</td>
            <td hellTableCell>
              <button id="person-action" hellTableRowAction type="button" (click)="onRowAction()">
                Open
              </button>
              <input
                id="person-radio"
                hellTableRowRadio
                type="radio"
                name="person-choice"
                [checked]="primary()"
                (checkedChange)="onRowRadio($event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
class TableHarnessHost {
  readonly nameColumnId = signal('name');
  readonly active = signal(true);
  readonly selected = signal(true);
  readonly primary = signal(false);
  readonly sortable = signal(true);
  readonly sortValue = signal<'asc' | 'desc' | null>(null);

  rowActionEvents = 0;

  onRowAction(): void {
    this.rowActionEvents += 1;
  }

  onRowCheck(checked: boolean): void {
    this.selected.set(checked);
  }

  onRowRadio(checked: boolean): void {
    this.primary.set(checked);
  }
}

@Component({
  imports: [...HELL_SELECT_DIRECTIVES],
  template: `
    <button hellSelect type="button" [value]="selected()" (valueChange)="selected.set($any($event))">
      <span hellSelectValue>Priority</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
  `,
})
class SelectHarnessHost {
  readonly selected = signal<string | null>(null);
}

@Component({
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div hellCombobox [value]="selected()" (valueChange)="selected.set($any($event))">
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxHarnessHost {
  readonly selected = signal<string | null>(null);
}

@Component({
  imports: [...HELL_MENU_DIRECTIVES],
  template: `
    <ng-template #menu>
      <div hellMenu><button hellMenuItem type="button" (click)="count += 1">Run</button></div>
    </ng-template>
    <button type="button" [hellMenuTrigger]="menu">Open menu</button>
  `,
})
class MenuHarnessHost {
  readonly trigger = viewChild.required(NgpMenuTrigger);
  count = 0;
}

@Component({
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <div hellTabset [value]="value()" (valueChange)="value.set($any($event))">
      <div hellTabList>
        <button hellTab value="one">One</button>
        <button hellTab value="two">Two</button>
      </div>
      <div hellTabPanel value="one">One panel</div>
      <div hellTabPanel value="two">Two panel</div>
    </div>
  `,
})
class TabsHarnessHost {
  readonly value = signal('one');
}

@Component({
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <div hellAccordion type="single" collapsible>
      <div hellAccordionItem value="details">
        <button hellAccordionTrigger>Details</button>
        <div hellAccordionContent>Hidden details</div>
      </div>
    </div>
  `,
})
class AccordionHarnessHost {}

@Component({
  imports: [HellSlider],
  template: `<hell-slider [value]="value()" aria-label="Volume" (valueChange)="value.set($event)" />`,
})
class SliderHarnessHost {
  readonly value = signal(25);
}

@Component({
  host: { 'data-harness-host': 'date-picker' },
  imports: [HellDatePicker],
  template: `<hell-date-picker [date]="date()" (dateChange)="date.set($event)" />`,
})
class DatePickerHarnessHost {
  readonly date = signal<Date | null>(new Date(2024, 0, 15));
}

@Component({
  host: { 'data-harness-host': 'date-input' },
  imports: [HellDateInput],
  template: `<hell-date-input [date]="date()" (dateChange)="date.set($event)" />`,
})
class DateInputHarnessHost {
  readonly date = signal<Date | null>(null);
}

@Component({
  imports: [HellTimeInput],
  template: `<hell-time-input [value]="value()" (valueChange)="value.set($event)" />`,
})
class TimeInputHarnessHost {
  readonly value = signal<{ hour: number; minute: number; second: number } | null>(null);
}

@Component({
  imports: [HellToaster],
  template: `<hell-toaster position="bottom-right" />`,
})
class ToastHarnessHost {
  readonly toast = inject(HellToastService);
}

@Component({
  imports: [HellDropZone],
  template: `<div hellDropzone [disabled]="disabled()" (files)="files = $event">Drop files</div>`,
})
class DropZoneHarnessHost {
  readonly disabled = signal(false);
  files: File[] = [];
}

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar [openOnFocus]="true" [value]="value()" (valueChange)="value.set($event)" (submit)="submitted = $event.item">
      <button hellOmnibarItem value="alpha">Alpha</button>
      <button hellOmnibarItem value="beta">Beta</button>
    </hell-omnibar>
  `,
})
class OmnibarHarnessHost {
  readonly value = signal('');
  submitted: unknown = null;
}

describe('hell testing harness entrypoint', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ButtonHarnessHost,
        DialogHarnessHost,
        TableHarnessHost,
        SelectHarnessHost,
        ComboboxHarnessHost,
        MenuHarnessHost,
        TabsHarnessHost,
        AccordionHarnessHost,
        SliderHarnessHost,
        DatePickerHarnessHost,
        DateInputHarnessHost,
        TimeInputHarnessHost,
        ToastHarnessHost,
        DropZoneHarnessHost,
        OmnibarHarnessHost,
      ],
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

    const sortTrigger = await nameHeader!.getSortTrigger();
    expect(sortTrigger).not.toBeNull();

    expect(await sortTrigger!.getText()).toBe('Name');
    expect(await sortTrigger!.isDisabled()).toBe(false);

    const resizer = await nameHeader!.getResizeHandle();
    expect(resizer).not.toBeNull();
    expect(await resizer!.getAriaLabel()).toBe('Resize name column');
    expect(await resizer!.getAriaValueNow()).toBe('50');

    const roleHeader = await table.getHeaderCellByColumnId('role');
    expect(roleHeader).not.toBeNull();
    expect(await roleHeader!.isSortable()).toBe(false);

    const rowCells = await row.getCells();
    expect(rowCells).toHaveLength(4);
    expect(await rowCells[1].getText()).toBe('Alice');
    expect(await rowCells[2].getText()).toBe('Admin');

    const selectedRows = await table.getRows();
    expect(selectedRows).toHaveLength(1);
    expect(await selectedRows[0].isActive()).toBe(true);
    expect(await selectedRows[0].isSelected()).toBe(true);
    expect(await selectedRows[0].getSelectionCells()).toHaveLength(1);

    const action = await loader.getHarness(HellTableRowActionHarness.with({ text: 'Open' }));
    await action.click();
    expect(fixture.componentInstance.rowActionEvents).toBe(1);

    const checkbox = await loader.getHarness(HellTableRowCheckboxHarness.with({ checked: true }));
    await checkbox.uncheck();
    fixture.detectChanges();
    expect(await checkbox.isChecked()).toBe(false);
    expect(fixture.componentInstance.selected()).toBe(false);

    const radio = await loader.getHarness(HellTableRowRadioHarness.with({ checked: false }));
    await radio.check();
    fixture.detectChanges();
    expect(await radio.isChecked()).toBe(true);
    expect(fixture.componentInstance.primary()).toBe(true);
  });

  it('interacts with select and combobox harnesses', async () => {
    const selectFixture = TestBed.createComponent(SelectHarnessHost);
    selectFixture.detectChanges();
    const selectLoader = TestbedHarnessEnvironment.loader(selectFixture);
    const select = await selectLoader.getHarness(HellSelectHarness.with({ text: 'Priority' }));

    await select.click();
    selectFixture.detectChanges();

    expect(await select.isDisabled()).toBe(false);

    const comboFixture = TestBed.createComponent(ComboboxHarnessHost);
    comboFixture.detectChanges();
    const comboLoader = TestbedHarnessEnvironment.loader(comboFixture);
    const combo = await comboLoader.getHarness(HellComboboxHarness);
    const input = await combo.getInput();

    await input.setValue('nov');
    expect(comboFixture.nativeElement.querySelector('input').value).toBe('nov');

    await (await combo.getButton())!.click();
    comboFixture.detectChanges();

    expect(await combo.isDisabled()).toBe(false);
  });

  it('interacts with menu, tabs, and accordion harnesses', async () => {
    const menuFixture = TestBed.createComponent(MenuHarnessHost);
    menuFixture.detectChanges();
    const menuLoader = TestbedHarnessEnvironment.loader(menuFixture);
    const menuTrigger = await menuLoader.getHarness(HellMenuTriggerHarness.with({ text: 'Open menu' }));
    expect(await menuTrigger.isDisabled()).toBe(false);
    menuFixture.componentInstance.trigger().show();
    await menuFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    menuFixture.detectChanges();
    const menuRootLoader = TestbedHarnessEnvironment.documentRootLoader(menuFixture);
    const menu = await menuRootLoader.getHarness(HellMenuHarness);
    const item = (await menu.getItems())[0];
    expect(await item.getText()).toBe('Run');
    await item.click();
    await menuFixture.whenStable();
    expect(menuFixture.componentInstance.count).toBe(1);

    const tabsFixture = TestBed.createComponent(TabsHarnessHost);
    tabsFixture.detectChanges();
    const tabset = await TestbedHarnessEnvironment.loader(tabsFixture).getHarness(HellTabsetHarness);
    const tabs = await tabset.getTabs();
    expect(await tabset.getOrientation()).toBe('horizontal');
    expect(await tabs[0].isSelected()).toBe(true);
    await tabs[1].click();
    await tabsFixture.whenStable();
    expect(tabsFixture.componentInstance.value()).toBe('two');

    const accordionFixture = TestBed.createComponent(AccordionHarnessHost);
    accordionFixture.detectChanges();
    const accordion = await TestbedHarnessEnvironment.loader(accordionFixture).getHarness(HellAccordionHarness);
    const accordionTrigger = await (await accordion.getItems())[0].getTrigger();
    expect(await accordionTrigger.getText()).toBe('Details');
    await accordionTrigger.click();
    await accordionFixture.whenStable();
    expect(await accordionTrigger.isExpanded()).toBe(true);
  });

  it('queries slider and date picker harness state', async () => {
    const sliderFixture = TestBed.createComponent(SliderHarnessHost);
    sliderFixture.detectChanges();
    const slider = await TestbedHarnessEnvironment.loader(sliderFixture).getHarness(HellSliderHarness);

    expect(await slider.getDataSize()).toBe('md');
    expect(await slider.getValue()).toBe('25');

    const datePickerFixture = TestBed.createComponent(DatePickerHarnessHost);
    datePickerFixture.detectChanges();
    const datePicker = await TestbedHarnessEnvironment.loader(datePickerFixture).getHarness(HellDatePickerHarness);

    expect(await datePicker.getLabel()).toMatch(/\w+ \d{4}/);
    expect((await datePicker.getDateButtons()).length).toBeGreaterThan(20);
  });

  it('interacts with date input and time input harnesses', async () => {
    const dateFixture = TestBed.createComponent(DateInputHarnessHost);
    dateFixture.detectChanges();
    const dateInput = await TestbedHarnessEnvironment.loader(dateFixture).getHarness(HellDateInputHarness);

    await dateInput.setInputValue('2024-02-03');
    expect(await dateInput.getInputValue()).toBe('2024-02-03');

    const timeFixture = TestBed.createComponent(TimeInputHarnessHost);
    timeFixture.detectChanges();
    const timeInput = await TestbedHarnessEnvironment.loader(timeFixture).getHarness(HellTimeInputHarness);

    await timeInput.setInputValue('09:30');
    expect(await timeInput.getInputValue()).toBe('09:30');
  });

  it('interacts with toast and drop zone harnesses', async () => {
    const toastFixture = TestBed.createComponent(ToastHarnessHost);
    toastFixture.detectChanges();
    toastFixture.componentInstance.toast.success('Saved', { description: 'Profile updated', duration: 0 });
    toastFixture.detectChanges();

    const toaster = await TestbedHarnessEnvironment.loader(toastFixture).getHarness(HellToasterHarness);
    expect(await toaster.getPosition()).toBe('bottom-right');
    const toast = (await toaster.getToasts())[0];
    expect(await toast.getVariant()).toBe('success');
    expect(await toast.getText()).toContain('Saved');
    await toast.close();
    toastFixture.detectChanges();
    expect(await toast.getState()).toBe('closed');

    const dropFixture = TestBed.createComponent(DropZoneHarnessHost);
    dropFixture.detectChanges();
    const dropzone = await TestbedHarnessEnvironment.loader(dropFixture).getHarness(HellDropZoneHarness);
    expect(await dropzone.getText()).toContain('Drop files');
    expect(await dropzone.isDisabled()).toBe(false);
    dropFixture.componentInstance.disabled.set(true);
    dropFixture.detectChanges();
    expect(await dropzone.getAriaDisabled()).toBe('true');
  });

  it('interacts with omnibar harnesses', async () => {
    const fixture = TestBed.createComponent(OmnibarHarnessHost);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const omnibar = await loader.getHarness(HellOmnibarHarness);

    await omnibar.focus();
    fixture.detectChanges();
    expect(await omnibar.isOpen()).toBe(true);

    await omnibar.setInputValue('alp');
    fixture.detectChanges();
    expect(await omnibar.getInputValue()).toBe('alp');

    const panel = await documentRootLoader.getHarness(HellOmnibarPanelHarness);
    const items = await panel.getItems();
    expect(await items[0].getText()).toBe('Alpha');
    await items[0].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.submitted).toBe('alpha');
  });
});
