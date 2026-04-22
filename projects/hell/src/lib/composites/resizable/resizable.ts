import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  QueryList,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HellOrientation } from '../../core/types';

/**
 * Resizable pane. Wrap two or more `[hellResizablePane]` children inside a
 * `[hellResizable]` host with explicit `hellResizableHandle` siblings between
 * them. The handle persists pane sizes in a local signal so dragging is
 * pixel-accurate and works for both horizontal and vertical orientations.
 */
@Directive({
  selector: '[hellResizable]',
  host: {
    '[class.hell-resizable]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
  exportAs: 'hellResizable',
})
export class HellResizable {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
}

@Directive({
  selector: '[hellResizablePane]',
  host: {
    '[class.hell-resizable-pane]': '!unstyled()',
    '[style.--hell-pane-flex]': 'flex()',
    '[style.min-width.px]': 'orientation() === "horizontal" ? minSize() : null',
    '[style.min-height.px]': 'orientation() === "vertical" ? minSize() : null',
  },
})
export class HellResizablePane {
  readonly unstyled = input(false, { transform: booleanAttribute });
  /** Initial flex grow factor — ignored after the user starts dragging. */
  readonly initialFlex = input<number>(1);
  /** Minimum pane size in pixels. */
  readonly minSize = input<number>(120);

  // exposed signals for the handle to write into
  readonly _flex = signal<number | null>(null);
  flex = computed(() => (this._flex() ?? this.initialFlex()).toString());

  // injected by host parent
  private readonly resizable = inject(HellResizable);
  protected orientation = this.resizable.orientation;
}

@Component({
  selector: '[hellResizableHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-resizable-handle]': '!unstyled()',
    '[attr.data-active]': 'dragging() ? "true" : null',
    role: 'separator',
    'aria-orientation': 'vertical',
    tabindex: '0',
  },
  template: '',
})
export class HellResizableHandle {
  readonly unstyled = input(false, { transform: booleanAttribute });

  protected readonly dragging = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly resizable = inject(HellResizable);

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(e: PointerEvent) {
    e.preventDefault();
    this.dragging.set(true);
    const horizontal = this.resizable.orientation() === 'horizontal';
    const prev = this.host.previousElementSibling as HTMLElement | null;
    const next = this.host.nextElementSibling as HTMLElement | null;
    if (!prev || !next) return;
    const startA = horizontal ? prev.offsetWidth : prev.offsetHeight;
    const startB = horizontal ? next.offsetWidth : next.offsetHeight;
    const startCoord = horizontal ? e.clientX : e.clientY;

    const move = (ev: PointerEvent) => {
      const delta = (horizontal ? ev.clientX : ev.clientY) - startCoord;
      const newA = Math.max(40, startA + delta);
      const newB = Math.max(40, startB - delta);
      prev.style.setProperty('--hell-pane-flex', `${newA}`);
      next.style.setProperty('--hell-pane-flex', `${newB}`);
    };
    const up = () => {
      this.dragging.set(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
}

export const HELL_RESIZABLE_DIRECTIVES = [
  HellResizable,
  HellResizablePane,
  HellResizableHandle,
] as const;
