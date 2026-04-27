import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChevronDown, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_AVATAR_GROUP_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../../shared/example-tabs';
import { AvatarGroupBasicExample } from './examples/basic.example';
import avatarGroupBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupInteractionHooksExample } from './examples/interaction-hooks.example';
import avatarGroupInteractionHooksExampleCodeRaw from './examples/interaction-hooks.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupOverflowMenuExample } from './examples/overflow-menu.example';
import avatarGroupOverflowMenuExampleCodeRaw from './examples/overflow-menu.example.ts?raw' with {
  loader: 'text',
};

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'hd-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidChevronDown, faSolidUsers })],
  imports: [
    ExampleTabs,
    ...HELL_AVATAR_GROUP_DIRECTIVES,
    AvatarGroupBasicExample,
    AvatarGroupInteractionHooksExample,
    AvatarGroupOverflowMenuExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Avatar group</h1>
      <p>
        A small composite for stacking avatar-like content. Use <code>hell-avatar</code> for
        visuals, project any trigger you need, and wire clicks in the consuming template.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="avatarGroupBasicExampleCode">
        <app-avatar-group-basic-example />
      </hd-example-tabs>

      <h2>Interaction hooks</h2>
      <hd-example-tabs [code]="avatarGroupInteractionHooksExampleCode" previewClass="grid gap-3">
        <app-avatar-group-interaction-hooks-example />
      </hd-example-tabs>

      <h2>Overflow menu</h2>
      <hd-example-tabs [code]="avatarGroupOverflowMenuExampleCode">
        <app-avatar-group-overflow-menu-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hell-avatar-group</code>: stack container; <code>size</code>, <code>unstyled</code>
        </li>
        <li>
          <code>hellAvatarGroupItem</code>: projected avatar/item; <code>selected</code>,
          <code>unstyled</code>
        </li>
        <li>
          <code>hellAvatarGroupOverflow</code>: projected overflow item; <code>unstyled</code>
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use a small <code>max</code> and an overflow item for dense lists.</li>
        <li>
          Mark selected people with <code>selected</code> only when selection changes behavior.
        </li>
        <li>Keep avatars the same <code>size</code> within one group.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't mix unrelated users and actions in one group.</li>
        <li>Don't use overflow as a menu unless it is keyboard reachable.</li>
      </ul>
    </article>
  `,
})
export class AvatarGroupPage {
  protected readonly avatarGroupBasicExampleCode = avatarGroupBasicExampleCodeRaw;
  protected readonly avatarGroupInteractionHooksExampleCode =
    avatarGroupInteractionHooksExampleCodeRaw;
  protected readonly avatarGroupOverflowMenuExampleCode = avatarGroupOverflowMenuExampleCodeRaw;
}
