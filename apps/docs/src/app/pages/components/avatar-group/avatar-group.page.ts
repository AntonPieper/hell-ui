import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidUsers } from '@ng-icons/font-awesome/solid';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AvatarGroupBasicExample } from './examples/basic.example';
import avatarGroupBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupSizesExample } from './examples/sizes.example';
import avatarGroupSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupSelectionExample } from './examples/selection.example';
import avatarGroupSelectionExampleCodeRaw from './examples/selection.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupWithTooltipMenuExample } from './examples/with-tooltip-menu.example';
import avatarGroupWithTooltipMenuExampleCodeRaw from './examples/with-tooltip-menu.example.ts?raw' with {
  loader: 'text',
};
import { AvatarGroupStylingExample } from './examples/styling.example';
import avatarGroupStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidUsers })],
  imports: [
    ExampleTabs,
    AvatarGroupBasicExample,
    AvatarGroupSizesExample,
    AvatarGroupSelectionExample,
    AvatarGroupWithTooltipMenuExample,
    AvatarGroupStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Avatar group"
        icon="faSolidUsers"
        category="Composite"
        importPath="hell-ui/avatar"
        stylesPath="hell-ui/avatar/styles.css"
      >
        Overlaps avatars into a single stack with a shared size scale and an overflow slot for
        whoever doesn't fit.
      </hd-page-header>
      <p>
        <code>hell-avatar-group</code> owns stacking layout and the shared
        <code>--_hell-av-size</code>/overlap variables that every projected item reads; it renders
        no visuals of its own. Project <code>hell-avatar</code>, buttons, or anchors marked with
        <code>hellAvatarGroupItem</code>, and cap the visible list with a
        <code>hellAvatarGroupOverflow</code> marker — the component does not compute "how many fit"
        for you.
      </p>
      <p>
        Reach for it wherever a business app shows "who's involved" compactly: assignees on a
        ticket, reviewers on a document, participants in a thread. Keep interaction wiring
        (selection, tooltips, opening a menu) in the consuming template, since the group itself is
        layout-only.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="avatarGroupBasicExampleCode">
        <app-avatar-group-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> on <code>hell-avatar-group</code> sets the shared avatar diameter and
        overlap for everything it contains; pass the same <code>size</code> to each projected
        <code>hell-avatar</code> so image and fallback content scale with it. Defaults to
        <code>md</code>.
      </p>
      <hd-example-tabs
        [code]="avatarGroupSizesExampleCode"
        previewClass="flex flex-wrap items-center gap-6"
      >
        <app-avatar-group-sizes-example />
      </hd-example-tabs>

      <h2>Selection</h2>
      <p>
        Render items as <code>&lt;button&gt;</code> and toggle <code>selected</code> to mark
        membership in a filter or a picked set. Selection draws a primary-colored ring; it carries
        no built-in exclusivity, so multi-select is the default — constrain it yourself if you need
        single-select.
      </p>
      <hd-example-tabs [code]="avatarGroupSelectionExampleCode">
        <app-avatar-group-selection-example />
      </hd-example-tabs>

      <h2>With tooltip &amp; menu</h2>
      <p>
        A realistic assignee stack: each visible avatar is a <code>hellTooltip</code> that
        names the person on hover, and the overflow badge is a <code>hellMenuTrigger</code> that
        lists whoever didn't fit. The visual stack alone never carries the full list — the menu
        does.
      </p>
      <hd-example-tabs [code]="avatarGroupWithTooltipMenuExampleCode">
        <app-avatar-group-with-tooltip-menu-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        This entry point exports three separately styleable modules, each with its own Part Style
        Map. Pass a class string to a module's <code>ui</code> input to refine its default
        <code>root</code> part, or a <code>[ui]="&#123; root: '...' &#125;"</code> map for the
        equivalent explicit form.
      </p>
      <ul>
        <li>
          <code>hell-avatar-group</code> — <code>root</code>: the
          stacking container. Owns the shared size and overlap CSS variables.
        </li>
        <li>
          <code>[hellAvatarGroupItem]</code> —
          <code>root</code>: the projected item itself (an avatar, button, or anchor). Carries the
          selection ring.
        </li>
        <li>
          <code>[hellAvatarGroupOverflow]</code> —
          <code>root</code>: the trailing "+N" indicator.
        </li>
      </ul>
      <p>Every part refined at once, with Hell tokens:</p>
      <hd-example-tabs [code]="avatarGroupStylingExampleCode">
        <app-avatar-group-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hell-avatar-group</code> (<code>HellAvatarGroup</code>):
          <ul>
            <li>
              <code>size</code>: <code>HellSize</code> (<code>xs | sm | md | lg | xl</code>),
              default <code>md</code>
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>, part union
              <code>'root'</code>
            </li>
          </ul>
        </li>
        <li>
          <code>[hellAvatarGroupItem]</code> (<code>HellAvatarGroupItem</code>):
          <ul>
            <li>
              <code>selected</code>: <code>boolean</code> (<code>booleanAttribute</code>), default
              <code>false</code>
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>, part union
              <code>'root'</code>
            </li>
          </ul>
        </li>
        <li>
          <code>[hellAvatarGroupOverflow]</code> (<code>HellAvatarGroupOverflow</code>):
          <ul>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>, part
              union <code>'root'</code>
            </li>
          </ul>
        </li>
        <li>
          <code>HELL_AVATAR_GROUP_IMPORTS</code>: bundle of all three, for bulk
          <code>imports</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The group host carries no ARIA role of its own; it is a plain stacking container around
          whatever you project.
        </li>
        <li>
          <code>hellAvatarGroupItem</code> and <code>hellAvatarGroupOverflow</code> render no
          implicit label — give interactive items (buttons, anchors, menu/tooltip triggers) an
          <code>aria-label</code> naming the person or the hidden count, since a bare image or "+3"
          is not an accessible name.
        </li>
        <li>
          Selection is exposed only through <code>data-selected</code> and your own
          <code>aria-pressed</code>/<code>aria-checked</code> binding on the item; the directive
          does not set ARIA selection state for you.
        </li>
        <li>
          Focus-visible on an interactive item or the overflow trigger draws a ring that cuts
          through neighboring avatars via <code>z-index</code>, so keyboard focus stays legible
          inside the overlap.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Keep every avatar in one group at the same <code>size</code>.</li>
        <li>
          Use <code>hellAvatarGroupOverflow</code> with a menu trigger when the hidden people need
          to stay reachable, not just visible as a count.
        </li>
        <li>Label interactive items and the overflow trigger with <code>aria-label</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mix unrelated people or actions in a single stack.</li>
        <li>
          Don't render the overflow badge as static text if the hidden entries matter — wire a menu
          or tooltip instead.
        </li>
        <li>
          Don't rely on <code>selected</code> for anything screen readers must announce; pair it
          with real ARIA state.
        </li>
      </ul>
    </article>
  `,
})
export class AvatarGroupPage {
  protected readonly avatarGroupBasicExampleCode = avatarGroupBasicExampleCodeRaw;
  protected readonly avatarGroupSizesExampleCode = avatarGroupSizesExampleCodeRaw;
  protected readonly avatarGroupSelectionExampleCode = avatarGroupSelectionExampleCodeRaw;
  protected readonly avatarGroupWithTooltipMenuExampleCode =
    avatarGroupWithTooltipMenuExampleCodeRaw;
  protected readonly avatarGroupStylingExampleCode = avatarGroupStylingExampleCodeRaw;
}
