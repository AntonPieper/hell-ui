import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellSpinner, HellButton } from 'hell';

@Component({
  selector: 'hd-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner, HellButton, RouterLink],
  template: `
    <article class="hd-prose">
      <h1>Spinner</h1>
      <p>Indeterminate loading indicator. Use for short, in-flight operations
        — submit buttons, refresh, polling. For layout-preserving placeholders
        prefer <a routerLink="/components/skeleton">Skeleton</a>.</p>

      <h2>Variants</h2>
      <p>Four built-in variants. All inherit <code>currentColor</code>, so they
        adapt to surrounding text and themed buttons automatically.</p>
      <div class="hd-example flex flex-wrap items-center gap-8">
        <div class="flex flex-col items-center gap-2">
          <span hellSpinner variant="ring" size="lg"></span>
          <code>ring</code>
        </div>
        <div class="flex flex-col items-center gap-2">
          <span hellSpinner variant="dots" size="lg"></span>
          <code>dots</code>
        </div>
        <div class="flex flex-col items-center gap-2">
          <span hellSpinner variant="bars" size="lg"></span>
          <code>bars</code>
        </div>
        <div class="flex flex-col items-center gap-2">
          <span hellSpinner variant="pulse" size="lg"></span>
          <code>pulse</code>
        </div>
      </div>

      <h2>Sizes</h2>
      <p>Five preset sizes (<code>xs sm md lg xl</code>). Or set any
        <code>font-size</code>: spinners are sized in <code>em</code>.</p>
      <div class="hd-example flex items-end gap-6">
        <span hellSpinner size="xs"></span>
        <span hellSpinner size="sm"></span>
        <span hellSpinner size="md"></span>
        <span hellSpinner size="lg"></span>
        <span hellSpinner size="xl"></span>
        <span hellSpinner class="text-[64px]"></span>
      </div>

      <h2>Colour</h2>
      <p>Inherits <code>currentColor</code>. Wrap in any text utility.</p>
      <div class="hd-example flex items-center gap-6">
        <span hellSpinner size="lg" class="text-hell-primary"></span>
        <span hellSpinner size="lg" variant="dots" class="text-hell-success"></span>
        <span hellSpinner size="lg" variant="bars" class="text-hell-danger"></span>
        <span hellSpinner size="lg" variant="pulse" class="text-hell-warning"></span>
      </div>

      <h2>Inside a button</h2>
      <div class="hd-example flex flex-wrap items-center gap-3">
        <button hellButton variant="primary" disabled>
          <span hellSpinner size="sm"></span>
          Saving…
        </button>
        <button hellButton variant="default" disabled>
          <span hellSpinner size="sm" variant="dots"></span>
          Loading
        </button>
        <button hellButton variant="ghost" disabled>
          <span hellSpinner size="sm" variant="pulse"></span>
        </button>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>variant</code>: <code>ring | dots | bars | pulse</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>unstyled</code>: opt out of the host class</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Pair the spinner with a label when the action is non-trivial
          (e.g. <em>Saving…</em>).</li>
        <li>Match the spinner colour to the button it sits inside —
          <code>currentColor</code> handles this automatically.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use a spinner where the result will arrive in &lt; 200 ms;
          flicker is worse than no feedback.</li>
        <li>Don't use a spinner to mask a layout shift — use a Skeleton.</li>
      </ul>
    </article>
  `,
})
export class SpinnerPage {}
