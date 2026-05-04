import { AfterRenderRef, DestroyRef, Injector, afterNextRender, signal } from '@angular/core';

export interface HellOmnibarPositionAdapterOptions {
  readonly host: () => HTMLElement;
  readonly control: () => HTMLElement | null | undefined;
  readonly minWidth: () => number;
  readonly isOpen: () => boolean;
  readonly destroyRef: DestroyRef;
  readonly injector: Injector;
  readonly ownerWindow?: () => Window | null | undefined;
}

/**
 * Visual Adapter for Omnibar panel geometry. It owns viewport listeners,
 * after-render scheduling, DOM measurement, and CSS-variable state while the
 * Composite template remains a pure consumer of the exposed signals.
 */
export class HellOmnibarPositionAdapter {
  readonly anchorTop = signal(0);
  readonly anchorLeft = signal(0);
  readonly anchorWidth = signal(0);

  private posUpdater?: AfterRenderRef;

  constructor(private readonly options: HellOmnibarPositionAdapterOptions) {
    this.anchorWidth.set(options.minWidth());
  }

  connect(): void {
    const win = this.window();
    this.options.destroyRef.onDestroy(() => this.posUpdater?.destroy());
    if (!win) return;

    const onChange = () => this.scheduleUpdate();
    const scrollOpts: AddEventListenerOptions = { passive: true, capture: true };
    win.addEventListener('resize', onChange, { passive: true });
    win.addEventListener('scroll', onChange, scrollOpts);
    this.options.destroyRef.onDestroy(() => {
      win.removeEventListener('resize', onChange);
      win.removeEventListener('scroll', onChange, scrollOpts);
    });
  }

  scheduleUpdate(): void {
    if (!this.options.isOpen()) return;
    this.posUpdater?.destroy();
    this.posUpdater = afterNextRender(() => this.updateNow(), { injector: this.options.injector });
  }

  updateNow(): void {
    const el = this.options.control() ?? this.options.host();
    const rect = el.getBoundingClientRect();
    const min = this.options.minWidth();
    this.anchorTop.set(rect.bottom + 4);
    this.anchorLeft.set(rect.left);
    this.anchorWidth.set(Math.max(rect.width, min));
  }

  private window(): Window | null {
    if (this.options.ownerWindow) return this.options.ownerWindow() ?? null;
    if (typeof window === 'undefined') return null;
    return window;
  }
}
