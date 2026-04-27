import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES, HELL_MENU_DIRECTIVES, HellIcon } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
  imports: [ExampleTabs, ...HELL_BREADCRUMBS_DIRECTIVES, ...HELL_MENU_DIRECTIVES, HellIcon],
  template: `
    <article class="hd-prose">
      <h1>Breadcrumbs</h1>
      <p>
        Hierarchical trail showing the user's location, built on
        <code>ng-primitives/breadcrumbs</code>. Use <code>hellBreadcrumbLink</code> for navigable
        crumbs and <code>hellBreadcrumbPage</code> for the current page (which receives
        <code>aria-current="page"</code> automatically). The separator paints a chevron-right by
        default — provide custom content to override.
      </p>

      <h2>Standard</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <nav hellBreadcrumbs aria-label="Breadcrumb">
          <ol hellBreadcrumbList>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Home</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Projects</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Heinrich UI</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <span hellBreadcrumbPage>Settings</span>
            </li>
          </ol>
        </nav>
      </hd-example-tabs>

      <h2>With icons</h2>
      <p>
        Use <code>hell-icon</code> inside any link or page. The library provides a default chevron
        separator but consumers can drop in their own icon by writing into the separator element.
      </p>
      <hd-example-tabs [code]="exampleCodes[1]">
        <nav hellBreadcrumbs aria-label="Breadcrumb with icons">
          <ol hellBreadcrumbList>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">
                <hell-icon name="faSolidHouse" size="12px" />
                Home
              </a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">
                <hell-icon name="faSolidFolderOpen" size="12px" />
                Projects
              </a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <span hellBreadcrumbPage>
                <hell-icon name="faSolidGear" size="12px" />
                Settings
              </span>
            </li>
          </ol>
        </nav>
      </hd-example-tabs>

      <h2>Long path with ellipsis</h2>
      <p>
        For deeply nested trails, collapse the middle with <code>hellBreadcrumbEllipsis</code>. Pair
        it with a menu (e.g. <code>hellMenu</code>) to surface the hidden crumbs on click.
      </p>
      <hd-example-tabs [code]="exampleCodes[2]">
        <nav hellBreadcrumbs aria-label="Long breadcrumb">
          <ol hellBreadcrumbList>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Home</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <button
                type="button"
                hellBreadcrumbEllipsis
                [hellMenuTrigger]="hiddenBreadcrumbs"
                placement="bottom-start"
              ></button>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Heinrich UI</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Components</a>
            </li>
            <li hellBreadcrumbSeparator></li>
            <li hellBreadcrumbItem>
              <span hellBreadcrumbPage>Breadcrumbs</span>
            </li>
          </ol>
        </nav>

        <ng-template #hiddenBreadcrumbs>
          <div hellMenu>
            <a hellMenuItem href="#">Design systems</a>
            <a hellMenuItem href="#">Angular</a>
          </div>
        </ng-template>
      </hd-example-tabs>

      <h2>Custom separator</h2>
      <p>
        Provide content inside <code>[hellBreadcrumbSeparator]</code> to override the default
        chevron.
      </p>
      <hd-example-tabs [code]="exampleCodes[3]">
        <nav hellBreadcrumbs aria-label="Slash separator">
          <ol hellBreadcrumbList>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Org</a>
            </li>
            <li hellBreadcrumbSeparator>/</li>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">Repo</a>
            </li>
            <li hellBreadcrumbSeparator>/</li>
            <li hellBreadcrumbItem>
              <span hellBreadcrumbPage>main</span>
            </li>
          </ol>
        </nav>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>nav[hellBreadcrumbs]</code> — landmark wrapper (host directive
          <code>NgpBreadcrumbs</code>)
        </li>
        <li><code>ol|ul[hellBreadcrumbList]</code> — list wrapper</li>
        <li><code>li[hellBreadcrumbItem]</code> — apply once per crumb</li>
        <li>
          <code>a|button[hellBreadcrumbLink]</code> — navigable crumb (host directive
          <code>NgpBreadcrumbLink</code>)
        </li>
        <li>
          <code>[hellBreadcrumbPage]</code> — current page; sets
          <code>aria-current="page"</code> automatically (host directive
          <code>NgpBreadcrumbPage</code>)
        </li>
        <li>
          <code>li[hellBreadcrumbSeparator]</code> — divider; renders a chevron-right by default,
          override with content
        </li>
        <li><code>[hellBreadcrumbEllipsis]</code> — collapsed middle indicator for long trails</li>
        <li>Import the bundle via <code>HELL_BREADCRUMBS_DIRECTIVES</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Use <code>hellBreadcrumbPage</code> for the leaf crumb so screen readers announce the
          current location.
        </li>
        <li>Collapse with an ellipsis once the trail exceeds ~5 levels.</li>
      </ul>
      <h2>Don't</h2>
      <ul>
        <li>Don't make the current page a link — it confuses users and fails WCAG 2.4.8.</li>
        <li>
          Don't render breadcrumbs for flat hierarchies; they only help when there's a parent to
          return to.
        </li>
      </ul>
    </article>
  `,
})
export class BreadcrumbsPage {
  protected readonly exampleCodes = [
    '<nav hellBreadcrumbs aria-label="Breadcrumb">\n  <ol hellBreadcrumbList>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Home</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Projects</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Heinrich UI</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <span hellBreadcrumbPage>Settings</span>\n    </li>\n  </ol>\n</nav>\n',
    '<nav hellBreadcrumbs aria-label="Breadcrumb with icons">\n  <ol hellBreadcrumbList>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">\n        <hell-icon name="faSolidHouse" size="12px" />\n        Home\n      </a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">\n        <hell-icon name="faSolidFolderOpen" size="12px" />\n        Projects\n      </a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <span hellBreadcrumbPage>\n        <hell-icon name="faSolidGear" size="12px" />\n        Settings\n      </span>\n    </li>\n  </ol>\n</nav>\n',
    '<nav hellBreadcrumbs aria-label="Long breadcrumb">\n  <ol hellBreadcrumbList>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Home</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <button\n        type="button"\n        hellBreadcrumbEllipsis\n        [hellMenuTrigger]="hiddenBreadcrumbs"\n        placement="bottom-start"\n      ></button>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Heinrich UI</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Components</a>\n    </li>\n    <li hellBreadcrumbSeparator></li>\n    <li hellBreadcrumbItem>\n      <span hellBreadcrumbPage>Breadcrumbs</span>\n    </li>\n  </ol>\n</nav>\n\n<ng-template #hiddenBreadcrumbs>\n  <div hellMenu>\n    <a hellMenuItem href="#">Design systems</a>\n    <a hellMenuItem href="#">Angular</a>\n  </div>\n</ng-template>\n',
    '<nav hellBreadcrumbs aria-label="Slash separator">\n  <ol hellBreadcrumbList>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Org</a>\n    </li>\n    <li hellBreadcrumbSeparator>/</li>\n    <li hellBreadcrumbItem>\n      <a hellBreadcrumbLink href="#">Repo</a>\n    </li>\n    <li hellBreadcrumbSeparator>/</li>\n    <li hellBreadcrumbItem>\n      <span hellBreadcrumbPage>main</span>\n    </li>\n  </ol>\n</nav>\n',
  ] as const;
}
