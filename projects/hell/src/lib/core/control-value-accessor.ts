/**
 * Shared callback holder for Hell controls that bridge headless widget state
 * into Angular Forms without making the low-level primitive the public seam.
 */
export class HellControlValueAccessorBridge<T> {
  private onControlChange: (value: T) => void = () => {};
  private onControlTouched: () => void = () => {};

  registerOnChange(fn: (value: T) => void): void {
    this.onControlChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  emitValue(value: T): void {
    this.onControlChange(value);
  }

  markTouched(): void {
    this.onControlTouched();
  }
}
