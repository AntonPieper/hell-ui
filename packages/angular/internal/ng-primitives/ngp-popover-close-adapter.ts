import { DestroyRef, effect } from '@angular/core';
import type { NgpPopoverTrigger } from 'ng-primitives/popover';

export const HELL_NGP_POPOVER_CLOSE_ADAPTER_VERSION = 'ng-primitives@0.123.0';

export const HELL_NGP_POPOVER_CLOSE_ADAPTER_REASON =
  'ng-primitives@0.123.0 still wires popover overlay onClose to openChange.emit(false) and destroys that overlay from ngOnDestroy, causing Angular NG0953 warnings after the trigger OutputRef is destroyed. Keep this adapter only until ng-primitives guards overlay destroy callbacks or exposes a public close callback hook.';

/**
 * Version-bound ng-primitives popover close adapter.
 *
 * Local source confirms ng-primitives owns normal open/close/outside/Escape behavior,
 * but its overlay destroy path still calls the internal close callback after the
 * trigger output is destroyed. This keeps the public output quiet during teardown.
 */
export function hellConnectNgpPopoverCloseAdapter(
  trigger: NgpPopoverTrigger,
  destroyRef: DestroyRef,
): void {
  let destroyed = false;
  destroyRef.onDestroy(() => {
    destroyed = true;
  });

  effect(() => {
    const overlay = popoverOverlay(trigger);
    if (!overlay) return;

    overlay.updateConfig({
      onClose: () => {
        if (!destroyed) {
          trigger.openChange.emit(false);
        }
      },
    });
  });
}

interface HellNgpPopoverOverlayConfig {
  onClose?: (origin: unknown) => void;
}

interface HellNgpPopoverOverlay {
  updateConfig(config: HellNgpPopoverOverlayConfig): void;
}

interface HellNgpPopoverTriggerWithOverlayState {
  state?: {
    overlay?: () => unknown;
  };
  overlay?: () => unknown;
}

function popoverOverlay(trigger: NgpPopoverTrigger): HellNgpPopoverOverlay | null {
  const candidate = trigger as unknown as HellNgpPopoverTriggerWithOverlayState;
  const overlay = candidate.state?.overlay?.() ?? candidate.overlay?.();
  return isPopoverOverlay(overlay) ? overlay : null;
}

function isPopoverOverlay(overlay: unknown): overlay is HellNgpPopoverOverlay {
  return (
    !!overlay &&
    (typeof overlay === 'object' || typeof overlay === 'function') &&
    typeof (overlay as { updateConfig?: unknown }).updateConfig === 'function'
  );
}
