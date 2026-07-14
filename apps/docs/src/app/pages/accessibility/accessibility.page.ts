import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';

import { PageHeader } from '../../shared/page-header';

interface AccessibilityOwnership {
  readonly owner: string;
  readonly examples: string;
  readonly path: string;
  readonly libraryContract: string;
  readonly consumerContract: string;
}

const ACCESSIBILITY_OWNERSHIP: readonly AccessibilityOwnership[] = [
  {
    owner: 'Browser platform',
    examples: 'Button, input, native checkbox/radio/switch, audio',
    path: '/components/button',
    libraryContract:
      'Hell preserves native elements, disabled behavior, form state, focusability, and visible focus styling.',
    consumerContract:
      'Choose the correct native element, provide labels and validation messages, and test the completed form or workflow.',
  },
  {
    owner: 'ng-primitives and Angular CDK',
    examples: 'Accordion, select, combobox, menu, dialog, popover, tooltip, tabs',
    path: '/components/select',
    libraryContract:
      'Hell adapts delegated roles, state attributes, overlays, focus management, and keyboard behavior without creating a second interaction model.',
    consumerContract:
      'Name triggers and floating surfaces, keep projected markup semantic, and verify focus order with the app content around the component.',
  },
  {
    owner: 'Hell runtime adapters',
    examples: 'Omnibar, resizable, date/time input, audio player captions',
    path: '/components/omnibar',
    libraryContract:
      'Hell owns the documented behavior that cannot be delegated: scoped dismissal, active-item movement, separator resizing, and typed draft state.',
    consumerContract:
      'Test app-specific boundaries, shortcut collisions, localization, error announcements, and pointer plus keyboard operation.',
  },
  {
    owner: 'Feature dependency',
    examples: 'TanStack table shell, CodeMirror, PDF viewer, speech transcript',
    path: '/components/table',
    libraryContract:
      'Hell provides integration chrome and narrow adapters; TanStack, CodeMirror, pdf.js, or browser speech APIs remain the behavior engines.',
    consumerContract:
      'Validate the configured engine, document content, worker/runtime support, and assistive-technology flow. Speech transcript is not captions.',
  },
];

@Component({
  selector: 'hd-accessibility',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ...HELL_TABLE_UTILITIES_DIRECTIVES, PageHeader],
  styles: [
    `
      :host {
        display: block;
      }

      .hd-a11y-callout {
        display: grid;
        gap: var(--spacing-hell-2);
        margin-block: var(--spacing-hell-4);
        padding: var(--spacing-hell-4);
        border: 1px solid var(--color-hell-border);
        border-radius: var(--radius-hell-lg);
        background: var(--color-hell-surface);
      }

      .hd-a11y-table-wrap {
        max-width: 100%;
        overflow: auto;
        margin-block: var(--spacing-hell-4);
      }

      .hd-a11y-table {
        min-width: 760px;
        font-size: var(--text-sm);
        line-height: var(--leading-normal);
      }

      .hd-a11y-table [data-hell-table-header-cell][data-slot='root'],
      .hd-a11y-table [data-hell-table-cell][data-slot='root'] {
        vertical-align: top;
        padding: var(--spacing-hell-3);
        overflow-wrap: break-word;
        white-space: normal;
      }

      .hd-a11y-owner {
        font-weight: 700;
      }
    `,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <hd-page-header title="Accessibility responsibilities" icon="faSolidUniversalAccess">
          What Hell owns, what it delegates, and what remains part of your application.
        </hd-page-header>

        <p>
          Accessibility is a shared contract. Hell can provide semantic defaults, state wiring,
          keyboard behavior, and focus management, but it cannot certify the names, content,
          workflow, or assistive-technology behavior of a consuming application.
        </p>

        <div class="hd-a11y-callout">
          <strong>Release status: internal beta.</strong>
          <span>
            Treat component documentation as the supported interface and validate every production
            flow in the browsers and assistive technologies your users rely on.
          </span>
        </div>

        <h2>Ownership model</h2>
        <p>
          Hell delegates whenever a platform or established dependency owns the interaction
          better. Custom runtime is limited to the documented seams where delegation would change
          the component contract.
        </p>
      </div>

      <div
        hellTableContainer
        class="hd-a11y-table-wrap"
        role="region"
        aria-label="Accessibility ownership model"
        tabindex="0"
      >
        <table hellTable class="hd-a11y-table">
          <thead hellTableHead>
            <tr hellTableRow>
              <th hellTableHeaderCell scope="col">Behavior owner</th>
              <th hellTableHeaderCell scope="col">Representative surfaces</th>
              <th hellTableHeaderCell scope="col">Hell contract</th>
              <th hellTableHeaderCell scope="col">Consumer contract</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (row of ownership; track row.owner) {
              <tr hellTableRow>
                <td hellTableCell class="hd-a11y-owner">{{ row.owner }}</td>
                <td hellTableCell><a [routerLink]="row.path">{{ row.examples }}</a></td>
                <td hellTableCell>{{ row.libraryContract }}</td>
                <td hellTableCell>{{ row.consumerContract }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="hd-prose">
        <h2>Motion preferences</h2>
        <p>
          Importing <code>@hell-ui/angular/tokens.css</code> makes Hell's semantic duration tokens
          collapse to 1 ms under <code>prefers-reduced-motion: reduce</code>, preserving lifecycle
          events while making token-driven transitions and entrances effectively instant.
          Entrypoints with hardcoded keyframes — currently Spinner, Skeleton, and Audio Player —
          disable that motion in their own recipes or stylesheets. Those guards target Hell-owned
          surfaces only; generic consumer or third-party <code>data-slot</code> elements are not
          rewritten.
        </p>

        <h2>Evidence policy</h2>
        <p>
          Browser contracts assert observable roles, names, state, keyboard movement, dismissal,
          and focus behavior. Axe smoke checks representative rendered states. Unit tests cover
          pure state and adapter behavior at the same interfaces consumers use.
        </p>
        <p>
          Broad accessibility-tree snapshots are intentionally not a release contract. They
          duplicate explicit behavior checks and turn harmless documentation copy or delegated DOM
          changes into snapshot churn.
        </p>

        <h2>Consumer checklist</h2>
        <ul>
          <li>Give every control and floating surface an accessible name.</li>
          <li>Prefer native form controls when browser validation or autofill is required.</li>
          <li>Test Tab order, initial focus, Escape, dismissal, and focus restoration in context.</li>
          <li>Verify disabled, invalid, loading, empty, and error states are perceivable.</li>
          <li>Keep global shortcuts opt-in and test collisions with the application shortcut layer.</li>
          <li>Test zoom, reflow, forced colors, reduced motion, and touch input where relevant.</li>
          <li>Run automated checks, then complete keyboard and screen-reader testing of key flows.</li>
          <li>Do not treat speech transcript or PDF text rendering as certified captions or reading order.</li>
        </ul>
      </div>
    </article>
  `,
})
export class AccessibilityPage {
  protected readonly ownership = ACCESSIBILITY_OWNERSHIP;
}
