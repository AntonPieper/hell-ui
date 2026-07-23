import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellSaveBar } from 'hell-ui/save-bar';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-save-bar-sticky-scroll-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellInput, HellSaveBar],
  template: `
    <!-- The bar renders in normal flow at the end of the scrolled content and
         sticks to the bottom of the nearest scroll container — no portal, no
         fixed positioning, and the last field is never hidden behind it. -->
    <div class="h-72 overflow-y-auto rounded-hell-lg border border-hell-border bg-hell-surface">
      <div class="flex flex-col gap-hell-4 p-hell-5">
        @for (field of fields; track field.id) {
          <div hellField>
            <label hellFieldLabel [for]="field.id">{{ field.label }}</label>
            <input
              hellInput
              [id]="field.id"
              type="text"
              [value]="field.value"
              (input)="dirty.set(true)"
            />
          </div>
        }
      </div>

      <hell-save-bar [dirty]="dirty()" (saved)="dirty.set(false)" (discarded)="dirty.set(false)" />
    </div>
  `,
})
export class SaveBarStickyScrollExample {
  protected readonly dirty = signal(false);

  protected readonly fields = [
    { id: 'trunk-name', label: 'Trunk name', value: 'Main office' },
    { id: 'trunk-host', label: 'Host', value: 'sip.example.com' },
    { id: 'trunk-port', label: 'Port', value: '5060' },
    { id: 'trunk-user', label: 'Username', value: 'office-01' },
    { id: 'trunk-proxy', label: 'Outbound proxy', value: 'proxy.example.com' },
    { id: 'trunk-prefix', label: 'Dial prefix', value: '0' },
    { id: 'trunk-clip', label: 'CLIP number', value: '+49 30 1234567' },
    { id: 'trunk-notes', label: 'Notes', value: 'Failover to trunk B' },
  ];
}
