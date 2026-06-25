import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ToastActionExample } from './examples/action.example';
import toastActionExampleCodeRaw from './examples/action.example.ts?raw' with {
  loader: 'text',
};
import { ToastPersistentCustomContentExample } from './examples/persistent-custom-content.example';
import toastPersistentCustomContentExampleCodeRaw from './examples/persistent-custom-content.example.ts?raw' with {
  loader: 'text',
};
import { ToastStackingExample } from './examples/stacking.example';
import toastStackingExampleCodeRaw from './examples/stacking.example.ts?raw' with {
  loader: 'text',
};
import { ToastVariantsExample } from './examples/variants.example';
import toastVariantsExampleCodeRaw from './examples/variants.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ToastVariantsExample,
    ToastActionExample,
    ToastPersistentCustomContentExample,
    ToastStackingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Toast</h1>
      <p>
        Stacked, dismissable, non-blocking notifications. Drop a single
        <code>&lt;hell-toaster /&gt;</code> near the root of your app and call
        <code>HellToastService</code> from anywhere. Newest toasts pile at the front; hover (or
        focus) the stack to fan it out, scroll longer stacks, and clear them at once.
      </p>
      <p>
        The toaster renders a labeled visual <code>region</code> for the toast stack. Screen-reader
        announcements are sent through Angular CDK <code>LiveAnnouncer</code> instead of through a
        dynamic <code>aria-live</code> region.
      </p>

      <h2>Anatomy</h2>
      <ul>
        <li>
          <code>HellToastService</code> &mdash; programmatic API (<code>show()</code>,
          <code>success()</code>, <code>error()</code>, <code>info()</code>, <code>warning()</code>,
          <code>message()</code>, <code>dismiss()</code>, <code>dismissAll()</code>)
        </li>
        <li>
          <code>&lt;hell-toaster /&gt;</code> &mdash; one mount point. Inputs:
          <code>position</code>, <code>maxVisible</code>
        </li>
      </ul>

      <h2>Variants</h2>
      <hd-example-tabs [code]="toastVariantsExampleCode" previewClass="flex flex-wrap gap-2">
        <app-toast-variants-example />
      </hd-example-tabs>

      <h2>Action</h2>
      <p>
        Pair a toast with a single action button. The handler receives the
        <code>dismiss</code> callback so it can close the toast after acting.
      </p>
      <hd-example-tabs [code]="toastActionExampleCode">
        <app-toast-action-example />
      </hd-example-tabs>

      <h2>Persistent + custom content</h2>
      <p>
        Pass <code>duration: 0</code> for a sticky toast. Provide a <code>template</code> for fully
        custom layouts &mdash; the template receives <code>{{ '{' }} id, dismiss {{ '}' }}</code> as
        its implicit context.
      </p>
      <hd-example-tabs [code]="toastPersistentCustomContentExampleCode">
        <app-toast-persistent-custom-content-example />
      </hd-example-tabs>

      <h2>Stacking</h2>
      <p>
        Send a burst and the stack collapses behind the front-most toast. Hover or focus the stack
        to fan it out into a scrollable column with a built-in dismiss-all action &mdash; the
        auto-dismiss timer pauses while you do.
      </p>
      <hd-example-tabs [code]="toastStackingExampleCode">
        <app-toast-stacking-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>HellToastService</code></h3>
      <ul>
        <li><code>show(options)</code>: render a toast; returns its numeric id.</li>
        <li>
          Shortcuts: <code>message()</code>, <code>success()</code>, <code>info()</code>,
          <code>warning()</code>, <code>error()</code>.
        </li>
        <li><code>dismiss(id)</code>, <code>dismissAll()</code>.</li>
        <li>
          <code>pauseAll()</code>, <code>resumeAll()</code>: used by the toaster hover/focus
          handling.
        </li>
      </ul>
      <h3><code>HellToastOptions</code></h3>
      <ul>
        <li><code>title</code>, <code>description</code>.</li>
        <li><code>variant</code>: <code>default | success | info | warning | danger</code>.</li>
        <li><code>duration</code>: milliseconds; <code>0</code> disables auto-dismiss.</li>
        <li>
          <code>action</code>: one action button with <code>label</code> and
          <code>onClick(dismiss)</code>.
        </li>
        <li><code>dismissible</code>: show / hide the close button.</li>
        <li>
          <code>template</code>: custom body template with
          <code>{{ '{' }} id, dismiss {{ '}' }}</code
          >.
        </li>
        <li>
          <code>announcement</code>: explicit announcement text sent via <code>LiveAnnouncer</code>;
          overrides default title/description fallback. Useful for template toasts with non-text
          visuals.
        </li>
        <li><code>id</code>: update an existing toast in place.</li>
      </ul>
      <h3><code>&lt;hell-toaster&gt;</code></h3>
      <ul>
        <li>
          <code>position</code>:
          <code>top-left | top-center | top-right | bottom-left | bottom-center | bottom-right</code
          >.
        </li>
        <li><code>maxVisible</code>: number of cards visible before overflow collapse.</li>
        <li><code>unstyled</code>: opt out of stack styling.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use toasts for non-blocking feedback after an action.</li>
        <li>Keep messages short and include an action only when useful.</li>
        <li>Set <code>maxVisible</code> to avoid notification stacks.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use toasts for errors that require correction in a form.</li>
        <li>Don't make important information disappear without another place to find it.</li>
      </ul>
    </article>
  `,
})
export class ToastPage {
  protected readonly toastVariantsExampleCode = toastVariantsExampleCodeRaw;
  protected readonly toastActionExampleCode = toastActionExampleCodeRaw;
  protected readonly toastPersistentCustomContentExampleCode =
    toastPersistentCustomContentExampleCodeRaw;
  protected readonly toastStackingExampleCode = toastStackingExampleCodeRaw;
}
