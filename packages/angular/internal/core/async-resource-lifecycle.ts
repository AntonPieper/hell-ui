/** Work dispatched by an async resource lifecycle. */
export type HellAsyncResourceDispatch<T> = (signal: AbortSignal) => Promise<T>;

/** State callbacks invoked only for the lifecycle's active dispatch. */
export interface HellAsyncResourceLifecycleCallbacks<T> {
  /** Invoked immediately before a dispatch starts. */
  readonly onStart: () => void;
  /** Publishes the active dispatch's value. */
  readonly onSuccess: (value: T) => void;
  /** Publishes the active dispatch's failure. */
  readonly onError: (error: unknown) => void;
  /** Settles active loading state after completion or cancellation. */
  readonly onSettled: () => void;
}

/**
 * Shared debounce, cancellation, and stale-result lifecycle for async resources.
 * Result ownership stays with the caller through callbacks.
 */
export class HellAsyncResourceLifecycle<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private generation = 0;

  constructor(private readonly callbacks: HellAsyncResourceLifecycleCallbacks<T>) {}

  /**
   * Replace pending work and invalidate active work before arming the debounce
   * timer, so an older dispatch cannot publish during the debounce window.
   */
  schedule(dispatch: HellAsyncResourceDispatch<T>, delay: number): void {
    this.clearTimer();
    this.supersedeActive();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.run(dispatch);
    }, Math.max(0, delay));
  }

  /** Run immediately, resolving whether this dispatch published its outcome. */
  async run(dispatch: HellAsyncResourceDispatch<T>): Promise<boolean> {
    this.clearTimer();
    this.supersedeActive();

    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.callbacks.onStart();

    try {
      const value = await dispatch(controller.signal);
      if (!this.isActive(generation, controller)) return false;
      this.callbacks.onSuccess(value);
      return true;
    } catch (error) {
      if (!this.isActive(generation, controller)) return false;
      this.callbacks.onError(error);
      return true;
    } finally {
      if (this.isActive(generation, controller)) {
        this.controller = null;
        this.callbacks.onSettled();
      }
    }
  }

  /** Cancel pending and active work without owning or clearing result data. */
  cancel(): void {
    this.clearTimer();
    if (!this.supersedeActive()) this.callbacks.onSettled();
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private supersedeActive(): boolean {
    this.generation += 1;
    const controller = this.controller;
    this.controller = null;
    if (controller === null) return false;
    controller.abort();
    this.callbacks.onSettled();
    return true;
  }

  private isActive(generation: number, controller: AbortController): boolean {
    return (
      generation === this.generation &&
      controller === this.controller &&
      !controller.signal.aborted
    );
  }
}
