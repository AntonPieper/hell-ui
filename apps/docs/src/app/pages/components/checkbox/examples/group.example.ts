import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellCheckbox } from 'hell-ui/checkbox';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';

interface Permission {
  id: string;
  label: string;
  granted: boolean;
}

@Component({
  selector: 'app-checkbox-group-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField orientation="horizontal">
      <button
        id="permissions-all"
        hellCheckbox
        [checked]="allGranted()"
        [indeterminate]="someGranted()"
        (checkedChange)="setAll($event)"
      ></button>
      <label hellFieldLabel for="permissions-all">All permissions</label>
    </div>

    <div class="ml-6 grid gap-2">
      @for (permission of permissions(); track permission.id) {
        <div hellField orientation="horizontal">
          <button
            [id]="permission.id"
            hellCheckbox
            [checked]="permission.granted"
            (checkedChange)="setOne(permission.id, $event)"
          ></button>
          <label hellFieldLabel [for]="permission.id">{{ permission.label }}</label>
        </div>
      }
    </div>
  `,
})
export class CheckboxGroupExample {
  protected readonly permissions = signal<Permission[]>([
    { id: 'perm-read', label: 'Read records', granted: true },
    { id: 'perm-write', label: 'Write records', granted: true },
    { id: 'perm-delete', label: 'Delete records', granted: false },
  ]);

  protected readonly allGranted = computed(() => this.permissions().every((p) => p.granted));
  protected readonly someGranted = computed(
    () => !this.allGranted() && this.permissions().some((p) => p.granted),
  );

  protected setAll(granted: boolean): void {
    this.permissions.update((list) => list.map((p) => ({ ...p, granted })));
  }

  protected setOne(id: string, granted: boolean): void {
    this.permissions.update((list) => list.map((p) => (p.id === id ? { ...p, granted } : p)));
  }
}
