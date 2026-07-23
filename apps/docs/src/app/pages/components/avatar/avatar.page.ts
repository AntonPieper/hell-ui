import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AvatarBasicExample } from './examples/basic.example';
import avatarBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AvatarSizesExample } from './examples/sizes.example';
import avatarSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { AvatarShapeExample } from './examples/shape.example';
import avatarShapeExampleCodeRaw from './examples/shape.example.ts?raw' with {
  loader: 'text',
};
import { AvatarBrokenImageExample } from './examples/broken-image.example';
import avatarBrokenImageExampleCodeRaw from './examples/broken-image.example.ts?raw' with {
  loader: 'text',
};
import { AvatarWithCardProfileExample } from './examples/with-card-profile.example';
import avatarWithCardProfileExampleCodeRaw from './examples/with-card-profile.example.ts?raw' with {
  loader: 'text',
};
import { AvatarStylingExample } from './examples/styling.example';
import avatarStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    AvatarBasicExample,
    AvatarSizesExample,
    AvatarShapeExample,
    AvatarBrokenImageExample,
    AvatarWithCardProfileExample,
    AvatarStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Avatar"
        icon="faSolidUser"
        category="Styled primitive"
        importPath="hell-ui/avatar"
        stylesPath="hell-ui/avatar/styles.css"
      >
        Identifies a person or entity with a photo, falling back to initials the instant the image is
        missing or fails to load.
      </hd-page-header>

      <p>
        <code>HellAvatar</code> wraps ng-primitives' <code>NgpAvatar</code> family
        (<code>NgpAvatar</code>, <code>NgpAvatarImage</code>, <code>NgpAvatarFallback</code>) with a
        default look and a Part Style Map. The primitive tracks image load state for you — while the
        photo is loading or errors out, the initials fallback is shown; once it loads, the fallback is
        hidden and the image takes over. You never coordinate that swap yourself.
      </p>
      <p>
        Reach for it anywhere a business app represents a person or entity compactly: table rows, list
        items, comment threads, assignee pickers, profile headers. For stacks of overlapping avatars
        (an assignee list, "who's online"), compose several <code>hell-avatar</code> elements inside
        the group directives from the same entry point instead of hand-rolling the overlap.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="avatarBasicExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> scales the avatar diameter and its fallback text together. Defaults to
        <code>md</code>.
      </p>
      <hd-example-tabs [code]="avatarSizesExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-sizes-example />
      </hd-example-tabs>

      <h2>Shape</h2>
      <p>
        <code>shape</code> switches between a fully rounded avatar (the default, for people) and a
        rounded-square avatar (useful for organizations, bots, or other non-person entities).
      </p>
      <hd-example-tabs [code]="avatarShapeExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-shape-example />
      </hd-example-tabs>

      <h2>Missing and broken images</h2>
      <p>
        You never need to branch your template on load state. Point <code>image</code> at a URL that
        404s, leave it <code>null</code>, or let it load normally — <code>HellAvatar</code> reflects
        the outcome as <code>data-status="idle" | "loading" | "loaded" | "error"</code> on the host and
        shows the <code>fallback</code> initials whenever the status isn't <code>loaded</code>.
      </p>
      <hd-example-tabs [code]="avatarBrokenImageExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-broken-image-example />
      </hd-example-tabs>

      <h2>With card and tag</h2>
      <p>
        Avatars rarely stand alone in product UI. Pairing one with
        <code>hell-ui/card</code> and <code>hell-ui/chip</code> builds a compact
        profile header for a settings page, a people directory, or a detail panel.
      </p>
      <hd-example-tabs [code]="avatarWithCardProfileExampleCode" previewClass="flex">
        <app-avatar-with-card-profile-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellAvatar</code> exposes one Public Part per rendered element. Pass a plain string to
        <code>ui</code> as shorthand for the default <code>root</code> part, or pass a
        <code>HellAvatarUi</code> map to refine parts individually. Either form merges your Tailwind
        classes into the component's default Part Recipe through one deterministic pipeline, so
        conflicting utilities reliably win over the built-in styling.
      </p>
      <ul>
        <li><code>root</code> — the host element: border, background, size, and shape.</li>
        <li><code>image</code> — the <code>&lt;img&gt;</code> rendered once a <code>src</code> is set.</li>
        <li><code>fallback</code> — the initials <code>&lt;span&gt;</code> shown when there's no loaded image.</li>
      </ul>
      <hd-example-tabs [code]="avatarStylingExampleCode" previewClass="flex items-center gap-3">
        <app-avatar-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>image</code>: <code>string | null</code> — avatar image source. Defaults to <code>null</code>.</li>
        <li><code>fallback</code>: <code>string</code> — initials shown when no image is loaded. Defaults to <code>''</code>.</li>
        <li><code>alt</code>: <code>string | null</code> — image alt text, falls back to <code>fallback</code> when omitted, then to an empty string. Defaults to <code>null</code>.</li>
        <li><code>size</code>: <code>HellSize</code> (<code>xs | sm | md | lg | xl</code>). Defaults to <code>md</code>.</li>
        <li><code>shape</code>: <code>round | square</code>. Defaults to <code>round</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellAvatarPart&gt;</code> — string shorthand for <code>root</code>, or a <code>HellAvatarUi</code> part map.</li>
        <li><code>HellAvatarPart</code>: <code>'root' | 'image' | 'fallback'</code> — the exported union of stylable parts.</li>
        <li><code>HellAvatarUi</code>: <code>HellUi&lt;HellAvatarPart&gt;</code> — the part-to-class-string map accepted by <code>[ui]</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The host reflects load state as <code>data-status</code>: <code>idle</code>, <code>loading</code>, <code>loaded</code>, or <code>error</code>.</li>
        <li>The image is visually hidden (not removed) until it finishes loading, so the fallback and image never render on top of each other.</li>
        <li>The fallback <code>&lt;span&gt;</code> is plain text; it carries no implicit role or live region, so it works with any surrounding label.</li>
        <li>When <code>alt</code> is omitted, the image falls back to the <code>fallback</code> text so screen readers still get a name instead of silence.</li>
        <li><code>size</code> and <code>shape</code> are exposed as <code>data-size</code>/<code>data-shape</code> attributes for CSS, not ARIA — they carry no accessibility semantics on their own.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Always set <code>alt</code> to the person or entity's name when the image is meaningful content.</li>
        <li>Always provide <code>fallback</code> initials — they're also the accessible fallback when the image never loads.</li>
        <li>Use <code>shape="square"</code> for organizations and bots, round for people, and stay consistent within one list.</li>
        <li>Use <code>ui</code> instead of conflicting <code>class</code> utilities when you need a one-off visual refinement.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't leave <code>fallback</code> empty — a blank circle gives users nothing to read while the image loads or if it fails.</li>
        <li>Don't encode status (online, verified, at-risk) through avatar color alone; pair it with a tag or label.</li>
        <li>Don't hand-roll avatar stacking; compose <code>hell-avatar</code> with <code>hell-avatar-group</code> from the same entry point instead.</li>
      </ul>
    </article>
  `,
})
export class AvatarPage {
  protected readonly avatarBasicExampleCode = avatarBasicExampleCodeRaw;
  protected readonly avatarSizesExampleCode = avatarSizesExampleCodeRaw;
  protected readonly avatarShapeExampleCode = avatarShapeExampleCodeRaw;
  protected readonly avatarBrokenImageExampleCode = avatarBrokenImageExampleCodeRaw;
  protected readonly avatarWithCardProfileExampleCode = avatarWithCardProfileExampleCodeRaw;
  protected readonly avatarStylingExampleCode = avatarStylingExampleCodeRaw;
}
