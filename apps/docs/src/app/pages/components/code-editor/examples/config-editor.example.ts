import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';

type ConfigLanguage = 'TypeScript' | 'JavaScript' | 'JSX';

const INITIAL_CONFIG = `export default {
  region: 'eu-central-1',
  replicas: 3,
  autoscale: { min: 2, max: 8 },
};
`;

@Component({
  selector: 'app-code-editor-config-editor-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellCodeEditor,
    HellButton,
    ...HELL_CARD_DIRECTIVES,
    ...HELL_SELECT_DIRECTIVES,
  ],
  template: `
    <div hellCard class="max-w-140">
      <div hellCardHeader class="flex items-center justify-between gap-4">
        <div class="flex flex-col">
          <strong>service.config.ts</strong>
          <span class="text-sm text-hell-foreground-muted">Environment: production</span>
        </div>
        <button
          hellSelect
          type="button"
          ui="w-40"
          aria-label="Editor language"
          [value]="language()"
          (valueChange)="language.set($any($event) ?? 'TypeScript')"
        >
          <span hellSelectValue>{{ language() }}</span>
          <ng-template hellSelectPortal>
            <div hellSelectDropdown>
              @for (option of languages; track option) {
                <div hellSelectOption [value]="option">{{ option }}</div>
              }
            </div>
          </ng-template>
        </button>
      </div>

      <div hellCardBody class="p-0">
        <hell-code-editor
          class="min-h-44"
          [value]="draft()"
          [extensions]="extensions()"
          ariaLabel="Service configuration"
          [ui]="{ root: 'rounded-none border-x-0' }"
          (valueChange)="draft.set($event)"
        />
      </div>

      <div hellCardFooter class="flex items-center justify-between gap-2">
        <span class="text-sm text-hell-foreground-muted">
          {{ dirty() ? 'Unsaved changes' : 'Saved' }}
        </span>
        <div class="flex gap-2">
          <button hellButton variant="ghost" type="button" [disabled]="!dirty()" (click)="reset()">
            Reset
          </button>
          <button hellButton variant="primary" type="button" [disabled]="!dirty()" (click)="apply()">
            Apply
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CodeEditorConfigEditorExample {
  protected readonly languages: readonly ConfigLanguage[] = ['TypeScript', 'JavaScript', 'JSX'];
  protected readonly language = signal<ConfigLanguage>('TypeScript');

  protected readonly saved = signal(INITIAL_CONFIG);
  protected readonly draft = signal(INITIAL_CONFIG);
  protected readonly dirty = computed(() => this.draft() !== this.saved());

  protected readonly extensions = computed<Extension>(() =>
    javascript({
      typescript: this.language() === 'TypeScript',
      jsx: this.language() === 'JSX',
    }),
  );

  protected reset(): void {
    this.draft.set(this.saved());
  }

  protected apply(): void {
    this.saved.set(this.draft());
  }
}
