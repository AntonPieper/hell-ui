import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  HellBreadcrumbs,
  HellBreadcrumbList,
  HellBreadcrumbItem,
  HellBreadcrumbSeparator,
} from 'hell';

@Component({
  selector: 'hd-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellBreadcrumbs,
    HellBreadcrumbList,
    HellBreadcrumbItem,
    HellBreadcrumbSeparator,
  ],
  template: `
    <article class="hd-prose">
      <h1>Breadcrumbs</h1>
      <p>Hierarchical trail showing the user's location. Mark the current
        page with <code>aria-current="page"</code>.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <nav hellBreadcrumbs aria-label="Breadcrumb">
          <ol hellBreadcrumbList>
            <li><a hellBreadcrumbItem href="#">Home</a></li>
            <li><span hellBreadcrumbSeparator>/</span></li>
            <li><a hellBreadcrumbItem href="#">Projects</a></li>
            <li><span hellBreadcrumbSeparator>/</span></li>
            <li><a hellBreadcrumbItem href="#">Heinrich UI</a></li>
            <li><span hellBreadcrumbSeparator>/</span></li>
            <li><span hellBreadcrumbItem aria-current="page">Settings</span></li>
          </ol>
        </nav>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>nav[hellBreadcrumbs]</code> — landmark wrapper</li>
        <li><code>ol[hellBreadcrumbList]</code> — flex layout</li>
        <li><code>a[hellBreadcrumbItem]</code> / <code>span[hellBreadcrumbItem]</code> — entry</li>
        <li><code>hellBreadcrumbSeparator</code> — decorative divider</li>
      </ul>
    </article>
  `,
})
export class BreadcrumbsPage {}
