import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import type { HellTagVariant } from '@hell-ui/angular/core';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HellTag } from '@hell-ui/angular/tag';

interface TeamMember {
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly status: string;
  readonly variant: HellTagVariant;
}

const MEMBERS: readonly TeamMember[] = [
  { name: 'Heinrich Klaas', initials: 'HK', role: 'Platform lead', status: 'Active', variant: 'success' },
  { name: 'Priya Natarajan', initials: 'PN', role: 'Backend', status: 'On call', variant: 'info' },
  { name: 'Omar Delacroix', initials: 'OD', role: 'Support', status: 'Away', variant: 'warning' },
  { name: 'Sofia Marchetti', initials: 'SM', role: 'Design', status: 'Offline', variant: 'default' },
];

@Component({
  selector: 'app-tag-with-table-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES, HellAvatar, HellTag],
  template: `
    <div hellTableContainer>
      <table hellTableRoot>
        <thead hellTableHeader>
          <tr hellTableRow>
            <th hellTableHeaderCell>Member</th>
            <th hellTableHeaderCell>Role</th>
            <th hellTableHeaderCell>Status</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          @for (member of members; track member.name) {
            <tr hellTableRow>
              <td hellTableCell>
                <div class="flex items-center gap-hell-2">
                  <hell-avatar size="sm" [fallback]="member.initials" [alt]="member.name" />
                  {{ member.name }}
                </div>
              </td>
              <td hellTableCell>{{ member.role }}</td>
              <td hellTableCell>
                <span hellTag [variant]="member.variant">{{ member.status }}</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TagWithTableExample {
  protected readonly members = MEMBERS;
}
