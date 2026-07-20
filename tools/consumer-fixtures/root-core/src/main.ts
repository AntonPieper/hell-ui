import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  hellPartStyler,
  hellSearchResource,
  hellTwMerge,
  type HellPartStyler,
  type HellRecipe,
  type HellSearchResource,
  type HellSize,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular';

interface SearchItem {
  readonly label: string;
}

const size: HellSize = 'md';
const recipe: HellRecipe<'root'> = { root: 'block' };
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const merged = hellTwMerge('px-hell-4', 'px-hell-7');
const styler: HellPartStyler<'root'> = hellPartStyler(() => uiInput, {
  defaultPart: 'root',
  recipe: () => recipe,
});
const styledRoot = styler('root');
void size;
void ui;
void merged;
void styledRoot;

@Component({
  selector: 'app-root',
  template: `<p>Root core contract: {{ search.items().length }} result</p>`,
})
class App {
  protected readonly query = signal('core');
  protected readonly search: HellSearchResource<SearchItem> = hellSearchResource({
    query: this.query,
    items: [{ label: 'Core contracts' }, { label: 'Visual primitive' }],
  });
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
