import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-overlays',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header title="Overlays" icon="faSolidLayerGroup">
        Hell ships several surfaces that render outside their logical host. They look similar but
        differ on the axes that matter — focus trapping, modality, and dismissal. This page is the
        map for choosing the right one.
      </hd-page-header>

      <p>
        Every one of these is a <strong>Floating Interaction</strong>: content rendered outside,
        beside, or above its trigger. They share positioning (Floating UI), a shared Floating Scope
        for nested dismissal, and — for the elevated ones — a single shared surface treatment. What
        separates them is behavior, not looks. Pick by answering three questions: does the content
        need a <em>focus trap</em>, should it <em>block the page</em>, and how should it
        <em>dismiss</em>?
      </p>

      <h2>At a glance</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Trigger</th>
            <th>Focus trap</th>
            <th>Modality</th>
            <th>Dismissal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a routerLink="/components/tooltip">Tooltip</a></td>
            <td>Hover / focus</td>
            <td>No</td>
            <td>Non-modal</td>
            <td>Pointer / focus leaves</td>
          </tr>
          <tr>
            <td><a routerLink="/components/popover">Popover</a></td>
            <td>Click</td>
            <td>Yes (default) / No with <code>trapFocus="false"</code></td>
            <td>Non-modal</td>
            <td>Outside click, Escape; non-modal panels also dismiss on outside focus</td>
          </tr>
          <tr>
            <td><a routerLink="/components/dialog">Dialog</a></td>
            <td>Click / imperative</td>
            <td>Yes</td>
            <td>Modal (page-blocking)</td>
            <td>Escape, backdrop, explicit close</td>
          </tr>
          <tr>
            <td>
              <a routerLink="/components/menu">Menu</a> /
              <a routerLink="/components/select">select</a> /
              <a routerLink="/components/combobox">combobox</a>
            </td>
            <td>Click / typing</td>
            <td>Roving focus</td>
            <td>Non-modal</td>
            <td>Select, outside click, Escape</td>
          </tr>
        </tbody>
      </table>

      <h2>Tooltip</h2>
      <p>
        A short, <strong>plain-text hint</strong> anchored to its trigger, shown on hover and
        keyboard focus. It has <code>role="tooltip"</code>, no focus trap, and no interactive
        content — it can never hold the one thing a user actually needs. Use it for an icon button's
        name, a truncated label's full text, or a keyboard shortcut. The trigger must make sense on
        its own; the tooltip is supplementary. Anything interactive belongs in a popover.
      </p>

      <h2>Popover</h2>
      <p>
        An <strong>anchored</strong> surface with <code>role="dialog"</code>, richer than a tooltip
        and lighter than a modal dialog. By default it <strong>traps focus</strong> while open —
        reach for that whenever the anchored content itself needs keyboard interaction: a profile
        summary with actions, an inline confirmation, a small settings form. It stays non-modal, so
        the page underneath is not blocked; dismissal is outside click and Escape.
      </p>
      <p>
        With <code>[trapFocus]="false"</code> the same surface becomes a
        <strong>light-dismiss panel that does not trap focus</strong>
        (<code>aria-modal="false"</code>). Reach for it precisely when the surrounding context must
        stay interactive while the panel is open — a toolbar filter panel, a volume slider, an
        inspector pinned beside a row. Pass <code>boundary</code> so sibling controls count as
        inside, and <code>anchor</code> to position against a different element than the trigger.
        Because a stray click elsewhere dismisses it, never place a critical confirmation flow in a
        non-modal panel.
      </p>

      <h2>Dialog</h2>
      <p>
        A <strong>modal, page-blocking</strong> card that traps focus and dims the rest of the page
        until the user resolves it. Use it for deliberate decisions and self-contained tasks —
        delete a record, edit a row, resolve a conflict. For the common yes/no confirmation, prefer
        the <a routerLink="/components/confirm">confirm service</a> rather than hand-building a
        dialog each time; an optional scoped mode blocks one content region while the app shell
        stays live.
      </p>

      <h2>Menu, select, and combobox dropdowns</h2>
      <p>
        These are <strong>composed pickers</strong>, not general-purpose surfaces. Their panels
        share the elevated floating look but exist to present a list of options with roving focus,
        typeahead, and selection semantics: <a routerLink="/components/menu">menu</a> for command and
        action lists, <a routerLink="/components/select">select</a> for choosing one option from a
        closed set, and <a routerLink="/components/combobox">combobox</a> for filtering a set as you
        type. Don't reach for them to render arbitrary anchored content — that's what popover is
        for.
      </p>

      <h2>How to choose</h2>
      <ul>
        <li>Just a text label on hover? <a routerLink="/components/tooltip">Tooltip</a>.</li>
        <li>
          Interactive content anchored to a trigger, and focus should stay inside it?
          <a routerLink="/components/popover">Popover</a>.
        </li>
        <li>
          Anchored content, but nearby controls must stay usable?
          <a routerLink="/components/popover">Popover</a> with <code>[trapFocus]="false"</code>.
        </li>
        <li>
          A decision or task that should block everything else until resolved?
          <a routerLink="/components/dialog">Dialog</a> (or the
          <a routerLink="/components/confirm">confirm service</a> for yes/no).
        </li>
        <li>
          Picking from a list of options?
          <a routerLink="/components/menu">Menu</a>,
          <a routerLink="/components/select">select</a>, or
          <a routerLink="/components/combobox">combobox</a>.
        </li>
      </ul>
    </article>
  `,
})
export class OverlaysPage {}
