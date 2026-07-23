import { Component } from '@angular/core';
import { HELL_ACCORDION_IMPORTS } from '@hell-ui/angular/accordion';
import { HellAvatar, type HellAvatarUi } from '@hell-ui/angular/avatar';
import { HELL_BREADCRUMBS_IMPORTS } from '@hell-ui/angular/breadcrumbs';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellCheckbox, HellNativeCheckbox, type HellCheckboxUi } from '@hell-ui/angular/checkbox';
import { HellBadge, HellChip, HellKbd } from '@hell-ui/angular/chip';
import { HELL_COMBOBOX_IMPORTS } from '@hell-ui/angular/combobox';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput, HellSearch, HellSearchClear } from '@hell-ui/angular/input';
import { HELL_LISTBOX_IMPORTS } from '@hell-ui/angular/listbox';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HELL_PAGINATION_IMPORTS, type HellPaginationStripUi } from '@hell-ui/angular/pagination';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HellProgress, HellProgressBar } from '@hell-ui/angular/progress';
import {
  HellNativeRadio,
  HellNativeRadioGroup,
  HellRadio,
  HellRadioGroup,
} from '@hell-ui/angular/radio';
import { HELL_SELECT_IMPORTS } from '@hell-ui/angular/select';
import { HellSeparator } from '@hell-ui/angular/separator';
import { HellSkeleton } from '@hell-ui/angular/skeleton';
import { HellSlider, type HellSliderUi } from '@hell-ui/angular/slider';
import { HellSpinner } from '@hell-ui/angular/spinner';
import { HellNativeSwitch, HellSwitch, type HellSwitchUi } from '@hell-ui/angular/switch';
import { HELL_TABS_IMPORTS } from '@hell-ui/angular/tabs';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from '@hell-ui/angular/toggle';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

interface SelectPriority {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface ComboboxFruit {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly disabled?: boolean;
}

interface MenuChannel {
  readonly id: string;
  readonly label: string;
  readonly unavailable?: boolean;
}

@Component({
  selector: 'app-styled-primitives',
  imports: [
    ...HELL_ACCORDION_IMPORTS,
    HellAvatar,
    ...HELL_BREADCRUMBS_IMPORTS,
    HellButton,
    ...HELL_CARD_IMPORTS,
    HellCheckbox,
    HellNativeCheckbox,
    ...HELL_FIELD_IMPORTS,
    HellInput,
    ...HELL_LISTBOX_IMPORTS,
    ...HELL_MENU_IMPORTS,
    ...HELL_PAGINATION_IMPORTS,
    HellPopover,
    HellPopoverTrigger,
    HellProgress,
    HellProgressBar,
    HellRadioGroup,
    HellRadio,
    HellNativeRadioGroup,
    HellNativeRadio,
    HellSearch,
    HellSearchClear,
    ...HELL_SELECT_IMPORTS,
    HellSeparator,
    HellSlider,
    HellSkeleton,
    HellSpinner,
    HellSwitch,
    HellNativeSwitch,
    HellBadge,
    HellKbd,
    HellChip,
    ...HELL_TABS_IMPORTS,
    HellToggle,
    HellToggleGroup,
    HellToggleGroupItem,
    HellTooltip,
    HellTooltipSurface,
    ...HELL_COMBOBOX_IMPORTS,
  ],
  template: `
    <button hellButton type="button" ui="bg-hell-danger border-hell-danger">Save</button>
    <a
      hellButton
      href="#details"
      variant="link"
      data-test-id="primary-link"
      [disabled]="disabled"
      [ui]="linkUi"
    >
      Details
    </a>
    <input hellInput aria-label="Name" [ui]="inputUi" />
    <button hellCheckbox aria-label="Accepted" [checked]="true" [ui]="checkboxUi"></button>
    <input
      type="checkbox"
      hellNativeCheckbox
      aria-label="Native accepted"
      [ui]="nativeCheckboxUi"
      checked
    />

    <div hellRadioGroup value="email" [ui]="radioGroupUi">
      <button hellRadio value="email" type="button" [ui]="radioUi">Email</button>
      <button hellRadio value="sms" type="button">SMS</button>
    </div>
    <div hellNativeRadioGroup [ui]="nativeRadioGroupUi">
      <input
        type="radio"
        hellNativeRadio
        name="native-contact"
        aria-label="Native email"
        value="email"
        [ui]="nativeRadioUi"
        checked
      />
    </div>
    <button hellSwitch aria-label="Notifications" [checked]="true" [ui]="switchUi"></button>
    <input type="checkbox" hellNativeSwitch aria-label="Native switch" [ui]="nativeSwitchUi" checked />
    <hell-slider aria-label="Volume" [value]="42" [ui]="sliderUi" />
    <button hellToggle type="button" [selected]="true" [ui]="toggleUi">Bold</button>
    <div hellToggleGroup type="single" [value]="'left'" [ui]="toggleGroupUi">
      <button hellToggleGroupItem value="left" type="button" [ui]="toggleGroupItemUi">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>

    <span hellChip [ui]="tagUi">Ready</span>
    <span hellBadge [ui]="badgeUi">3</span>
    <kbd hellKbd [ui]="kbdUi">K</kbd>

    <div hellSeparator [ui]="separatorUi"></div>
    <div hellProgress [ui]="progressUi">
      <div hellProgressBar [ui]="progressBarUi"></div>
    </div>

    <div hellSkeleton [ui]="skeletonUi"></div>
    <span hellSpinner [ui]="spinnerUi"></span>
    <hell-avatar fallback="AP" [ui]="avatarUi" />

    <nav hellBreadcrumbs [ui]="breadcrumbsUi">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Home</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>Current</span>
        </li>
        <li>
          <button hellBreadcrumbEllipsis></button>
        </li>
      </ol>
    </nav>

    <div hellSearch [ui]="searchUi">
      <input hellInput type="search" aria-label="Search" />
      <button hellSearchClear [ui]="searchClearUi">Clear</button>
    </div>

    <hell-pagination [page]="2" [pageCount]="6" [ui]="paginationStripUi" />
    <nav hellPagination [page]="1" [pageCount]="3" ui="gap-hell-4">
      <button hellPageLink="previous" type="button">Previous</button>
      <button type="button" [hellPageLink]="2" [ui]="pageButtonUi">2</button>
      <button hellPageLink="next" type="button" ui="text-hell-danger">Next</button>
    </nav>

    <button type="button" [hellMenuTrigger]="menu">Actions</button>
    <ng-template #menu>
      <div hellMenu aria-label="Package actions" [ui]="menuUi">
        <button hellMenuItem type="button" [ui]="menuItemUi">Rename</button>
        @for (channel of menuChannels; track channel.id) {
          <button
            hellMenuItemCheckbox
            type="button"
            [checked]="selectedMenuChannels.includes(channel)"
            [disabled]="channel.unavailable ?? false"
            (checkedChange)="setMenuChannelChecked(channel, $event)"
          >
            <span hellMenuItemIndicator></span>
            <span>{{ channel.label }}</span>
          </button>
        }
      </div>
    </ng-template>

    <div hellListbox [value]="listboxValue" [ui]="listboxUi">
      <button hellListboxOption type="button" value="ada" [ui]="listboxOptionUi">Ada</button>
    </div>

    <button type="button" [hellPopoverTrigger]="popover">Profile</button>
    <ng-template #popover>
      <div hellPopover [ui]="popoverUi">Summary</div>
    </ng-template>

    <button type="button" hellTooltip="One-binding string hint">Hint</button>
    <button type="button" [hellTooltip]="tooltip">Hint</button>
    <ng-template #tooltip>
      <span hellTooltipSurface [ui]="tooltipUi">Helpful hint</span>
    </ng-template>

    <button
      hellSelect
      type="button"
      aria-label="Priority"
      [value]="selectValue"
      (valueChange)="selectValue = $any($event)"
      [compareWith]="compareSelectPriorities"
      [ui]="selectUi"
    >
      @if (selectValue; as priority) {
        <span hellSelectValue>{{ priority.label }}</span>
      } @else {
        <span hellSelectPlaceholder>Pick priority</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown [ui]="selectDropdownUi">
          @for (option of selectOptions; track option.id) {
            <div
              hellSelectOption
              [value]="option"
              [disabled]="option.disabled ?? false"
              [ui]="selectOptionUi"
            >
              {{ option.label }}
            </div>
          }
        </div>
      </ng-template>
    </button>
    <div
      hellCombobox
      [value]="comboboxValue"
      (valueChange)="comboboxValue = $any($event)"
      [options]="comboboxOptions"
      [compareWith]="compareComboboxFruits"
      [ui]="comboboxUi"
    >
      <input hellComboboxInput placeholder="Search fruit…" [ui]="comboboxInputUi" />
      <button
        hellComboboxButton
        type="button"
        aria-label="Toggle combobox options"
        [ui]="comboboxButtonUi"
      ></button>
      <div *hellComboboxPortal hellComboboxDropdown [ui]="comboboxDropdownUi">
        @for (option of comboboxOptions; track option.id) {
          <div
            hellComboboxOption
            [value]="option"
            [disabled]="option.disabled ?? false"
            [ui]="comboboxOptionUi"
          >
            <strong>{{ option.label }}</strong>
            <span> — {{ option.kind }}</span>
          </div>
        } @empty {
          <div hellComboboxEmpty [ui]="comboboxEmptyUi">No matches</div>
        }
      </div>
    </div>

    <section hellCard ui="shadow-none">
      <header hellCardHeader [ui]="cardHeaderUi">Account</header>
      <div hellCardBody>
        <div hellField orientation="horizontal">
          <label hellFieldLabel for="card-name">Name</label>
          <input hellInput id="card-name" aria-label="Card name" />
          <p hellFieldDescription>Shown to collaborators.</p>
        </div>
        <div hellTabset value="overview">
          <div hellTabList>
            <button hellTab value="overview" [ui]="activeTabUi">Overview</button>
            <button hellTab value="settings">Settings</button>
          </div>
          <div hellTabPanel value="overview">Overview content</div>
          <div hellTabPanel value="settings">Settings content</div>
        </div>
        <div hellAccordion type="single" value="details">
          <div hellAccordionItem value="details">
            <button hellAccordionTrigger [ui]="accordionTriggerUi">Details</button>
            <div hellAccordionContent>Details content</div>
          </div>
        </div>
      </div>
      <footer hellCardFooter>Ready</footer>
    </section>
  `,
})
export class StyledPrimitives {
  protected readonly disabled = true;
  protected readonly linkUi = { root: 'text-hell-primary underline-offset-[3px]' };
  protected readonly accordionTriggerUi = { root: 'bg-hell-surface-subtle' };
  protected readonly activeTabUi = { root: 'text-hell-primary' };
  protected readonly avatarUi = { root: 'bg-hell-info-soft' } satisfies HellAvatarUi;
  protected readonly badgeUi = { root: 'bg-hell-info' };
  protected readonly breadcrumbsUi = { root: 'text-hell-info' };
  protected readonly cardHeaderUi = { root: 'items-start' };
  protected readonly checkboxUi = { root: 'border-hell-info' } satisfies HellCheckboxUi;
  protected readonly inputUi = { root: 'border-hell-info' };
  protected readonly kbdUi = { root: 'border-hell-info' };
  protected readonly nativeCheckboxUi = { root: 'border-hell-info' };
  protected readonly nativeRadioGroupUi = { root: 'gap-hell-2' };
  protected readonly nativeRadioUi = { root: 'border-hell-info' };
  protected readonly nativeSwitchUi = { root: 'bg-hell-info-soft' };
  protected readonly listboxValue = ['ada'];
  protected readonly listboxOptionUi = { root: 'bg-hell-primary-soft' };
  protected readonly listboxUi = { root: 'gap-hell-4' };
  protected readonly menuItemUi = { root: 'bg-hell-primary-soft' };
  protected readonly menuUi = { root: 'rounded-hell-pill' };
  protected readonly menuChannels: readonly MenuChannel[] = [
    { id: 'email', label: 'Email' },
    { id: 'push', label: 'Push' },
    { id: 'webhook', label: 'Webhook', unavailable: true },
  ];
  protected selectedMenuChannels: readonly MenuChannel[] = [this.menuChannels[0]!];
  protected readonly paginationStripUi = {
    root: 'gap-hell-4',
    control: 'rounded-hell-pill',
  } satisfies HellPaginationStripUi;
  protected readonly pageButtonUi = { root: 'rounded-hell-pill bg-hell-primary' };
  protected readonly popoverUi = { root: 'rounded-hell-pill' };
  protected readonly progressBarUi = { root: 'bg-hell-info' };
  protected readonly progressUi = { root: 'bg-hell-info-soft' };
  protected readonly radioGroupUi = { root: 'gap-hell-2' };
  protected readonly radioUi = { root: 'text-hell-info' };
  protected readonly searchClearUi = { root: 'text-hell-info' };
  protected readonly searchUi = { root: 'grid gap-hell-2' };
  protected readonly selectDropdownUi = { root: 'rounded-hell-pill' };
  protected readonly selectOptionUi = { root: 'bg-hell-primary-soft' };
  protected readonly selectOptions: readonly SelectPriority[] = [
    { id: 'low', label: 'Low' },
    { id: 'high', label: 'High' },
    { id: 'urgent', label: 'Urgent', disabled: true },
  ];
  protected selectValue: SelectPriority | null = this.selectOptions[0] ?? null;
  protected readonly compareSelectPriorities = (a: SelectPriority, b: SelectPriority): boolean =>
    a.id === b.id;
  protected readonly selectUi = { root: 'rounded-hell-pill' };
  protected readonly separatorUi = { root: 'bg-hell-info' };
  protected readonly sliderUi = {
    range: 'bg-hell-info',
    thumb: 'border-hell-info',
  } satisfies HellSliderUi;
  protected readonly skeletonUi = { root: 'bg-hell-info-soft' };
  protected readonly spinnerUi = { root: 'text-hell-info' };
  protected readonly switchUi = {
    root: 'bg-hell-info-soft',
    thumb: 'shadow-none',
  } satisfies HellSwitchUi;
  protected readonly tagUi = { root: 'bg-hell-info-soft' };
  protected readonly toggleGroupItemUi = { root: 'text-hell-info' };
  protected readonly toggleGroupUi = { root: 'gap-hell-2' };
  protected readonly toggleUi = { root: 'text-hell-info' };
  protected readonly tooltipUi = { root: 'rounded-hell-pill' };
  protected comboboxValue: ComboboxFruit | null = null;
  protected readonly comboboxOptions: ComboboxFruit[] = [
    { id: 'apple', label: 'Apple', kind: 'Pome' },
    { id: 'apricot', label: 'Apricot', kind: 'Stone fruit' },
    { id: 'blackberry', label: 'Blackberry', kind: 'Berry', disabled: true },
  ];
  protected readonly compareComboboxFruits = (
    left: ComboboxFruit | null,
    right: ComboboxFruit | null,
  ): boolean => left?.id === right?.id;
  protected readonly comboboxUi = { root: 'rounded-hell-pill' };
  protected readonly comboboxButtonUi = { root: 'text-hell-info' };
  protected readonly comboboxDropdownUi = { root: 'rounded-hell-pill' };
  protected readonly comboboxEmptyUi = { root: 'text-hell-info' };
  protected readonly comboboxInputUi = { root: 'text-hell-info' };
  protected readonly comboboxOptionUi = { root: 'bg-hell-primary-soft' };

  protected setMenuChannelChecked(channel: MenuChannel, checked: boolean): void {
    const without = this.selectedMenuChannels.filter((candidate) => candidate !== channel);
    this.selectedMenuChannels = checked ? [...without, channel] : without;
  }
}
