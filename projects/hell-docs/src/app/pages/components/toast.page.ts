import { ChangeDetectionStrategy, Component, inject, viewChild, TemplateRef } from '@angular/core';
import { HellButton, HellToastService } from 'hell';

@Component({
  selector: 'hd-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <article class="hd-prose">
      <h1>Toast</h1>
      <p>
        Stacked, dismissable, non-blocking notifications. Drop a single
        <code>&lt;hell-toaster /&gt;</code> near the root of your app and
        call <code>HellToastService</code> from anywhere. Newest toasts pile
        at the front; hover (or focus) the stack to fan it out.
      </p>

      <h2>Anatomy</h2>
      <ul>
        <li><code>HellToastService</code> &mdash; programmatic API
          (<code>show()</code>, <code>success()</code>, <code>error()</code>,
          <code>info()</code>, <code>warning()</code>, <code>message()</code>,
          <code>dismiss()</code>, <code>dismissAll()</code>)</li>
        <li><code>&lt;hell-toaster /&gt;</code> &mdash; one mount point.
          Inputs: <code>position</code>, <code>maxVisible</code></li>
      </ul>

      <h2>Variants</h2>
      <div class="hd-example flex flex-wrap gap-2">
        <button hellButton variant="ghost"
          (click)="svc.message('Saved as draft', { description: 'Your changes are stored locally.' })">
          Default
        </button>
        <button hellButton variant="primary"
          (click)="svc.success('Article published', { description: 'Visible to readers in a few seconds.' })">
          Success
        </button>
        <button hellButton variant="ghost"
          (click)="svc.info('Background sync running', { description: 'Updating your library in the background.' })">
          Info
        </button>
        <button hellButton variant="ghost"
          (click)="svc.warning('Quota almost full', { description: '92% of your storage is used.' })">
          Warning
        </button>
        <button hellButton variant="danger"
          (click)="svc.error('Upload failed', { description: 'Network unreachable. We will retry shortly.' })">
          Danger
        </button>
      </div>

      <h2>Action</h2>
      <p>Pair a toast with a single action button. The handler receives the
        <code>dismiss</code> callback so it can close the toast after acting.</p>
      <div class="hd-example">
        <button hellButton variant="primary"
          (click)="undoExample()">
          Delete &mdash; with Undo
        </button>
      </div>

      <h2>Persistent + custom content</h2>
      <p>
        Pass <code>duration: 0</code> for a sticky toast. Provide a
        <code>template</code> for fully custom layouts &mdash; the template
        receives <code>{{ '{' }} id, dismiss {{ '}' }}</code> as its implicit context.
      </p>
      <div class="hd-example">
        <button hellButton variant="ghost" (click)="customExample()">
          Show custom toast
        </button>

        <ng-template #custom let-ctx>
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-full bg-(--hell-color-info-soft) grid place-items-center text-(--hell-color-info-strong) font-semibold">
              SS
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-(--hell-color-text)">Sara Severin</div>
              <div class="hd-muted">commented on “Q4 plan”</div>
            </div>
            <button hellButton size="sm" variant="primary" (click)="ctx.dismiss()">View</button>
          </div>
        </ng-template>
      </div>

      <h2>Stacking</h2>
      <p>
        Spam the buttons above and the stack collapses behind the front-most
        toast. Hover or focus the stack to fan it out into a column &mdash;
        the auto-dismiss timer pauses while you do.
      </p>
      <div class="hd-example">
        <button hellButton variant="ghost" (click)="burst()">
          Send 5 toasts
        </button>
        <button hellButton variant="ghost" (click)="svc.dismissAll()">
          Dismiss all
        </button>
      </div>
    </article>
  `,
})
export class ToastPage {
  protected readonly svc = inject(HellToastService);
  private readonly customTpl = viewChild<TemplateRef<{ $implicit: { id: number; dismiss: () => void } }>>('custom');

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
      ['Build started',  'main @ 7c9a02b'],
      ['Tests passed',   '482 specs in 14.2s'],
      ['Bundle ready',   'main.js — 142kb gzipped'],
      ['Deployed',       'preview-42.heinrich.app'],
      ['Notified team',  '#release on Slack'],
    ] as const;
    lines.forEach(([t, d], i) => {
      setTimeout(() => this.svc.success(t, { description: d }), i * 220);
    });
  }
}
