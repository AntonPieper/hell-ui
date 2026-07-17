import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellSaveBar } from '@hell-ui/angular/save-bar';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

interface MailSettings {
  readonly greeting: string;
  readonly signature: string;
}

const DEFAULT_SETTINGS: MailSettings = { greeting: 'Hello', signature: 'The support team' };

@Component({
  selector: 'app-save-bar-persistent-settings-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellInput, HellSaveBar, HellButton],
  template: `
    <div class="flex flex-col gap-hell-4">
      <div hellField>
        <label hellFieldLabel for="mail-greeting">Greeting</label>
        <input
          hellInput
          id="mail-greeting"
          type="text"
          [value]="draft().greeting"
          (input)="patch({ greeting: greetingInput.value })"
          #greetingInput
        />
      </div>
      <div hellField>
        <label hellFieldLabel for="mail-signature">Signature</label>
        <input
          hellInput
          id="mail-signature"
          type="text"
          [value]="draft().signature"
          (input)="patch({ signature: signatureInput.value })"
          #signatureInput
        />
      </div>

      <!-- Persistent mode keeps the footer stable; the message still tracks dirtiness. -->
      <hell-save-bar
        mode="persistent"
        [dirty]="dirty()"
        (saved)="save()"
        (discarded)="discard()"
      >
        <button hellButton variant="ghost" size="sm" type="button" (click)="resetDefaults()">
          Reset to defaults
        </button>
      </hell-save-bar>
    </div>
  `,
})
export class SaveBarPersistentSettingsExample {
  protected readonly saved = signal<MailSettings>(DEFAULT_SETTINGS);
  protected readonly draft = signal<MailSettings>(DEFAULT_SETTINGS);

  protected readonly dirty = computed(
    () =>
      this.draft().greeting !== this.saved().greeting ||
      this.draft().signature !== this.saved().signature,
  );

  protected patch(partial: Partial<MailSettings>): void {
    this.draft.update((draft) => ({ ...draft, ...partial }));
  }

  protected save(): void {
    this.saved.set(this.draft());
  }

  protected discard(): void {
    this.draft.set(this.saved());
  }

  protected resetDefaults(): void {
    this.draft.set(DEFAULT_SETTINGS);
  }
}
