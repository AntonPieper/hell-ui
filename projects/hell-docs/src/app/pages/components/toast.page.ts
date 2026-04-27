import { ChangeDetectionStrategy, Component, inject, viewChild, TemplateRef } from '@angular/core';
import { HellButton, HellToastService } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellButton],
  template: `
    <article class="hd-prose">
      <h1>Toast</h1>
      <p>
        Stacked, dismissable, non-blocking notifications. Drop a single
        <code>&lt;hell-toaster /&gt;</code> near the root of your app and call
        <code>HellToastService</code> from anywhere. Newest toasts pile at the front; hover (or
        focus) the stack to fan it out.
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
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap gap-2">
        <button
          hellButton
          variant="ghost"
          (click)="
            svc.message('Saved as draft', { description: 'Your changes are stored locally.' })
          "
        >
          Default
        </button>
        <button
          hellButton
          variant="primary"
          (click)="
            svc.success('Article published', {
              description: 'Visible to readers in a few seconds.',
            })
          "
        >
          Success
        </button>
        <button
          hellButton
          variant="ghost"
          (click)="
            svc.info('Background sync running', {
              description: 'Updating your library in the background.',
            })
          "
        >
          Info
        </button>
        <button
          hellButton
          variant="ghost"
          (click)="
            svc.warning('Quota almost full', { description: '92% of your storage is used.' })
          "
        >
          Warning
        </button>
        <button
          hellButton
          variant="danger"
          (click)="
            svc.error('Upload failed', {
              description: 'Network unreachable. We will retry shortly.',
            })
          "
        >
          Danger
        </button>
      </hd-example-tabs>

      <h2>Action</h2>
      <p>
        Pair a toast with a single action button. The handler receives the
        <code>dismiss</code> callback so it can close the toast after acting.
      </p>
      <hd-example-tabs [code]="exampleCodes[1]">
        <button hellButton variant="primary" (click)="undoExample()">
          Delete &mdash; with Undo
        </button>
      </hd-example-tabs>

      <h2>Persistent + custom content</h2>
      <p>
        Pass <code>duration: 0</code> for a sticky toast. Provide a <code>template</code> for fully
        custom layouts &mdash; the template receives <code>{{ '{' }} id, dismiss {{ '}' }}</code> as
        its implicit context.
      </p>
      <hd-example-tabs [code]="exampleCodes[2]">
        <button hellButton variant="ghost" (click)="customExample()">Show custom toast</button>

        <ng-template #custom let-ctx>
          <div class="flex items-center gap-3">
            <div
              class="grid size-9 place-items-center rounded-full bg-hell-info-soft font-semibold text-hell-info-strong"
            >
              SS
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-hell-foreground">Sara Severin</div>
              <div class="hd-muted">commented on “Q4 plan”</div>
            </div>
            <button hellButton size="sm" variant="primary" (click)="ctx.dismiss()">View</button>
          </div>
        </ng-template>
      </hd-example-tabs>

      <h2>Stacking</h2>
      <p>
        Spam the buttons above and the stack collapses behind the front-most toast. Hover or focus
        the stack to fan it out into a column &mdash; the auto-dismiss timer pauses while you do.
      </p>
      <hd-example-tabs [code]="exampleCodes[3]">
        <button hellButton variant="ghost" (click)="burst()">Send 5 toasts</button>
        <button hellButton variant="ghost" (click)="svc.dismissAll()">Dismiss all</button>
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
  protected readonly exampleCodes = [
    'import { Component, inject } from \'@angular/core\';\nimport { HellButton, HellToaster, HellToastService } from \'hell\';\n\n@Component({\n  selector: \'app-toast-variants\',\n  imports: [HellButton, HellToaster],\n  template: `\n    <button hellButton variant="primary" (click)="toast.success(\'Article published\')">\n      Success\n    </button>\n    <button hellButton variant="ghost" (click)="toast.info(\'Background sync running\')">\n      Info\n    </button>\n    <button hellButton variant="danger" (click)="toast.error(\'Upload failed\')">\n      Danger\n    </button>\n    <hell-toaster position="bottom-right" />\n  `,\n})\nexport class ToastVariants {\n  readonly toast = inject(HellToastService);\n}\n',
    "import { Component, inject } from '@angular/core';\nimport { HellButton, HellToaster, HellToastService } from 'hell';\n\n@Component({\n  selector: 'app-toast-action',\n  imports: [HellButton, HellToaster],\n  template: `\n    <button hellButton variant=\"primary\" (click)=\"deleteArticle()\">\n      Delete \u2014 with Undo\n    </button>\n    <hell-toaster />\n  `,\n})\nexport class ToastAction {\n  readonly toast = inject(HellToastService);\n\n  deleteArticle(): void {\n    this.toast.show({\n      title: 'Article moved to trash',\n      action: {\n        label: 'Undo',\n        onClick: (dismiss) => {\n          this.toast.success('Restored');\n          dismiss();\n        },\n      },\n    });\n  }\n}\n",
    'import { Component, TemplateRef, inject, viewChild } from \'@angular/core\';\nimport { HellButton, HellToaster, HellToastService } from \'hell\';\n\n@Component({\n  selector: \'app-custom-toast\',\n  imports: [HellButton, HellToaster],\n  template: `\n    <button hellButton variant="ghost" (click)="showCustomToast()">\n      Show custom toast\n    </button>\n\n    <ng-template #custom let-ctx>\n      <div class="flex items-center gap-3">\n        <strong>Sara Severin</strong>\n        <span>commented on \u201cQ4 plan\u201d</span>\n        <button hellButton size="sm" variant="primary" (click)="ctx.dismiss()">View</button>\n      </div>\n    </ng-template>\n\n    <hell-toaster />\n  `,\n})\nexport class CustomToast {\n  readonly toast = inject(HellToastService);\n  readonly custom = viewChild<TemplateRef<unknown>>(\'custom\');\n\n  showCustomToast(): void {\n    this.toast.show({ template: this.custom(), duration: 0 });\n  }\n}\n',
    "import { Component, inject } from '@angular/core';\nimport { HellButton, HellToaster, HellToastService } from 'hell';\n\n@Component({\n  selector: 'app-toast-stack',\n  imports: [HellButton, HellToaster],\n  template: `\n    <button hellButton variant=\"ghost\" (click)=\"sendToasts()\">Send 5 toasts</button>\n    <button hellButton variant=\"ghost\" (click)=\"toast.dismissAll()\">Dismiss all</button>\n    <hell-toaster [maxVisible]=\"3\" />\n  `,\n})\nexport class ToastStack {\n  readonly toast = inject(HellToastService);\n\n  sendToasts(): void {\n    ['Build started', 'Tests passed', 'Bundle ready', 'Deployed', 'Notified team']\n      .forEach((title) => this.toast.success(title));\n  }\n}\n",
  ] as const;
  protected readonly svc = inject(HellToastService);
  private readonly customTpl =
    viewChild<TemplateRef<{ $implicit: { id: number; dismiss: () => void } }>>('custom');

  protected undoExample() {
    this.svc.show({
      title: 'Article moved to trash',
      description: '“Roadmap Q4”',
      variant: 'default',
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: (dismiss) => {
          this.svc.success('Restored', { description: '“Roadmap Q4” is back where it was.' });
          dismiss();
        },
      },
    });
  }

  protected customExample() {
    const tpl = this.customTpl();
    if (!tpl) return;
    this.svc.show({ template: tpl, duration: 0 });
  }

  protected burst() {
    const lines = [
      ['Build started', 'main @ 7c9a02b'],
      ['Tests passed', '482 specs in 14.2s'],
      ['Bundle ready', 'main.js — 142kb gzipped'],
      ['Deployed', 'preview-42.heinrich.app'],
      ['Notified team', '#release on Slack'],
    ] as const;
    lines.forEach(([t, d], i) => {
      setTimeout(() => this.svc.success(t, { description: d }), i * 220);
    });
  }
}
