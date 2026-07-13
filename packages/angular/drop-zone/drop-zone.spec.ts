import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDropZone } from './drop-zone';

@Component({
  imports: [HellDropZone],
  template: `
    <div
      hellDropzone
      [multiple]="multiple()"
      [accept]="accept()"
      [disabled]="disabled()"
      (files)="drops.push($event)"
    >
      <span data-child class="inner">inner</span>
      Upload files
    </div>
  `,
})
class DropZoneHost {
  readonly multiple = signal(true);
  readonly accept = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly drops: File[][] = [];
}

@Component({
  imports: [HellDropZone],
  template: `
    <input data-native-input type="file" #nativeInput />

    <div
      hellDropzone
      [nativeInput]="nativeInput"
      [multiple]="multiple()"
      [accept]="accept()"
      [disabled]="disabled()"
      (files)="drops.push($event)"
    >
      <span data-child class="inner">inner</span>
      Upload files
    </div>
  `,
})
class DropZoneHostWithNativeInput {
  readonly multiple = signal(true);
  readonly accept = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly drops: File[][] = [];
}

@Component({
  imports: [HellDropZone],
  template: `
    <input data-native-input type="file" id="drop-zone-native-input-id" />

    <div
      hellDropzone
      [nativeInput]="'drop-zone-native-input-id'"
      [multiple]="multiple()"
      [accept]="accept()"
      [disabled]="disabled()"
      (files)="drops.push($event)"
    >
      <span data-child class="inner">inner</span>
      Upload files
    </div>
  `,
})
class DropZoneHostWithNativeInputId {
  readonly multiple = signal(true);
  readonly accept = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly drops: File[][] = [];
}

@Component({
  imports: [HellDropZone],
  template: `
    <input data-native-input="a" type="file" #nativeInputA />
    <input data-native-input="b" type="file" #nativeInputB />

    <div
      hellDropzone
      [nativeInput]="nativeMode() === 'a' ? nativeInputA : nativeMode() === 'b' ? nativeInputB : null"
      (files)="drops.push($event)"
    >
      Upload files
    </div>
  `,
})
class DropZoneHostWithDynamicNativeInput {
  readonly nativeMode = signal<'a' | 'b' | null>('a');
  readonly drops: File[][] = [];
}

@Component({
  imports: [HellDropZone],
  template: `
    <div
      id="drop-string"
      hellDropzone
      [disabled]="disabled()"
      ui="grid min-h-hell-10 border-hell-danger bg-hell-danger text-hell-foreground-inverse"
      (files)="drops.push($event)"
    >
      Upload files
    </div>

    <div id="drop-map" hellDropzone [ui]="dropZoneUi">Upload files</div>
  `,
})
class DropZonePartStyleHost {
  readonly disabled = signal(false);
  readonly drops: File[][] = [];

  readonly dropZoneUi = {
    root: 'grid min-h-hell-8 border-hell-info bg-hell-info-soft text-hell-info-strong',
  };
}

describe('HellDropZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DropZoneHost,
        DropZoneHostWithNativeInput,
        DropZoneHostWithNativeInputId,
        DropZoneHostWithDynamicNativeInput,
        DropZonePartStyleHost,
      ],
    }).compileComponents();
  });

  it('applies string shorthand through hellTwMerge while preserving host behavior', () => {
    const fixture = TestBed.createComponent(DropZonePartStyleHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const zone = byId(fixture.nativeElement, 'drop-string');
    const classes = zone.className.split(/\s+/);

    expect(zone.getAttribute('data-slot')).toBe('root');
    expect(zone.getAttribute('role')).toBe('button');
    expect(zone.getAttribute('tabindex')).toBe('0');
    expect(classes).toContain('grid');
    expect(classes).toContain('min-h-hell-10');
    expect(classes).toContain('border-hell-danger');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).not.toContain('flex');
    expect(classes).not.toContain('min-h-[140px]');
    expect(classes).not.toContain('border-hell-border-strong');
    expect(classes).not.toContain('bg-hell-surface-subtle');

    const over = dragEvent('dragover');
    zone.dispatchEvent(over);
    fixture.detectChanges();

    expect(over.defaultPrevented).toBe(true);
    expect(zone.getAttribute('data-active')).toBe('true');

    host.disabled.set(true);
    fixture.detectChanges();

    expect(zone.getAttribute('data-disabled')).toBe('true');
    expect(zone.getAttribute('aria-disabled')).toBe('true');
    expect(zone.getAttribute('tabindex')).toBe('-1');
  });

  it('applies object maps to the DropZone root', () => {
    const fixture = TestBed.createComponent(DropZonePartStyleHost);
    fixture.detectChanges();

    const zone = byId(fixture.nativeElement, 'drop-map');

    expect(zone.getAttribute('data-slot')).toBe('root');
    expect(zone.className).toContain('grid');
    expect(zone.className).toContain('min-h-hell-8');
    expect(zone.className).toContain('border-hell-info');
    expect(zone.className).toContain('bg-hell-info-soft');
    expect(zone.className).toContain('text-hell-info-strong');
  });

  it('creates a hidden file input on click with the configured picker options', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.accept.set('image/*');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();

    const input = zone.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect((input as HTMLInputElement).multiple).toBe(true);
    expect((input as HTMLInputElement).accept).toBe('image/*');
    expect((input as HTMLInputElement).hidden).toBe(true);
    expect((input as HTMLInputElement).ownerDocument).toBe(zone.ownerDocument);
    expect(click).toHaveBeenCalledOnce();
  });

  it('does not re-enter the host click handler when the hidden input click bubbles', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    fileInput(zone).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(click).toHaveBeenCalledOnce();
  });

  it('uses a provided native input element instead of creating one', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHostWithNativeInput);
    const host = fixture.componentInstance;
    host.accept.set('image/*');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();

    const input = providedFileInput(fixture.nativeElement);
    expect(input.multiple).toBe(true);
    expect(input.accept).toBe('image/*');
    expect(zone.querySelector('input[type="file"]')).toBeNull();
    expect(input.hidden).toBe(false);
    expect(click).toHaveBeenCalledOnce();
  });

  it('emits when a provided native input changes directly', () => {
    const fixture = TestBed.createComponent(DropZoneHostWithNativeInput);
    const host = fixture.componentInstance;
    host.accept.set('text/plain');
    fixture.detectChanges();

    const text = new File(['a'], 'a.txt', { type: 'text/plain' });
    const png = new File(['b'], 'b.png', { type: 'image/png' });
    const input = providedFileInput(fixture.nativeElement);
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: fileList([text, png]),
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.accept).toBe('text/plain');
    expect(host.drops).toEqual([[text]]);
  });

  it('unbinds stale consumer-owned inputs when nativeInput changes', () => {
    const fixture = TestBed.createComponent(DropZoneHostWithDynamicNativeInput);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const inputA = fixture.nativeElement.querySelector('[data-native-input="a"]') as HTMLInputElement;
    const inputB = fixture.nativeElement.querySelector('[data-native-input="b"]') as HTMLInputElement;
    const first = new File(['a'], 'a.txt', { type: 'text/plain' });
    const second = new File(['b'], 'b.txt', { type: 'text/plain' });
    const stale = new File(['c'], 'c.txt', { type: 'text/plain' });

    Object.defineProperty(inputA, 'files', { configurable: true, value: fileList([first]) });
    inputA.dispatchEvent(new Event('change', { bubbles: true }));

    host.nativeMode.set('b');
    fixture.detectChanges();

    Object.defineProperty(inputA, 'files', { configurable: true, value: fileList([stale]) });
    inputA.dispatchEvent(new Event('change', { bubbles: true }));
    Object.defineProperty(inputB, 'files', { configurable: true, value: fileList([second]) });
    inputB.dispatchEvent(new Event('change', { bubbles: true }));

    host.nativeMode.set(null);
    fixture.detectChanges();

    Object.defineProperty(inputB, 'files', { configurable: true, value: fileList([stale]) });
    inputB.dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([[first], [second]]);
  });

  it('resolves a provided native input id from the host document', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHostWithNativeInputId);
    const host = fixture.componentInstance;
    host.accept.set('application/pdf');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();

    const input = providedFileInput(fixture.nativeElement);
    expect(zone.querySelector('input[type="file"]')).toBeNull();
    expect(input.accept).toBe('application/pdf');
    expect(click).toHaveBeenCalledOnce();
  });

  it('syncs picker options on every click with a provided native input', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHostWithNativeInput);
    const host = fixture.componentInstance;
    host.accept.set('image/*');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const input = providedFileInput(fixture.nativeElement);

    host.multiple.set(false);
    host.accept.set('application/pdf');
    fixture.detectChanges();
    zone.click();

    expect(providedFileInput(fixture.nativeElement)).toBe(input);
    expect(input.multiple).toBe(false);
    expect(input.accept).toBe('application/pdf');
    expect(click).toHaveBeenCalledTimes(2);

    host.accept.set(null);
    fixture.detectChanges();
    zone.click();

    expect(input.accept).toBe('');
    expect(input.hasAttribute('accept')).toBe(false);
  });

  it('syncs picker options on every click', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.accept.set('image/*');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const input = fileInput(zone);

    host.multiple.set(false);
    host.accept.set('application/pdf');
    fixture.detectChanges();
    zone.click();

    expect(fileInput(zone)).toBe(input);
    expect(input.multiple).toBe(false);
    expect(input.accept).toBe('application/pdf');
    expect(click).toHaveBeenCalledTimes(2);

    host.accept.set(null);
    fixture.detectChanges();
    zone.click();

    expect(input.accept).toBe('');
    expect(input.hasAttribute('accept')).toBe(false);
  });

  it('filters dropped files by accept and single-file mode', () => {
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.accept.set('image/*,.txt');
    fixture.detectChanges();

    const image = new File(['a'], 'a.PNG', { type: 'image/png' });
    const pdf = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    const text = new File(['c'], 'notes.TXT');
    dispatchDrop(dropZone(fixture.nativeElement), image, pdf, text);

    expect(host.drops).toEqual([[image, text]]);

    host.drops.length = 0;
    host.multiple.set(false);
    fixture.detectChanges();
    dispatchDrop(dropZone(fixture.nativeElement), pdf, image, text);

    expect(host.drops).toEqual([[image]]);
  });

  it('filters files selected through the hidden input', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.accept.set('image/png');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const image = new File(['a'], 'a.png', { type: 'image/png' });
    const text = new File(['b'], 'b.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput(zone), 'files', {
      configurable: true,
      value: fileList([image, text]),
    });
    fileInput(zone).dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([[image]]);
  });

  it('does not emit all-rejected file selections', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.accept.set('image/png');
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    dispatchDrop(zone, new File(['a'], 'a.txt', { type: 'text/plain' }));
    zone.click();
    Object.defineProperty(fileInput(zone), 'files', {
      configurable: true,
      value: fileList([new File(['b'], 'b.pdf', { type: 'application/pdf' })]),
    });
    fileInput(zone).dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([]);
  });

  it('does not emit from an existing hidden input after becoming disabled', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    host.disabled.set(true);
    fixture.detectChanges();

    Object.defineProperty(fileInput(zone), 'files', {
      configurable: true,
      value: fileList([new File(['a'], 'a.txt', { type: 'text/plain' })]),
    });
    fileInput(zone).dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([]);
  });

  it('removes generated input and listeners on destroy', () => {
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const input = fileInput(zone);
    expect(input.ownerDocument.contains(input)).toBe(true);

    fixture.destroy();
    expect(input.ownerDocument.contains(input)).toBe(false);

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: fileList([new File(['a'], 'a.txt', { type: 'text/plain' })]),
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([]);
  });

  it('does not remove or keep a consumer-owned input listeners on destroy', () => {
    const fixture = TestBed.createComponent(DropZoneHostWithNativeInput);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const input = providedFileInput(fixture.nativeElement);
    const removeSpy = vi.spyOn(input, 'remove');

    fixture.destroy();

    expect(removeSpy).not.toHaveBeenCalled();

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: fileList([new File(['a'], 'a.txt', { type: 'text/plain' })]),
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.drops).toEqual([]);
  });

  it('emits dropped files and honors single-file mode', () => {
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.multiple.set(false);
    fixture.detectChanges();

    const first = new File(['a'], 'a.txt', { type: 'text/plain' });
    const second = new File(['b'], 'b.txt', { type: 'text/plain' });
    dispatchDrop(dropZone(fixture.nativeElement), first, second);

    expect(host.drops).toEqual([[first]]);
  });

  it('tracks active drag state while enabled', () => {
    const fixture = TestBed.createComponent(DropZoneHost);
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    const over = dragEvent('dragover');
    zone.dispatchEvent(over);
    fixture.detectChanges();

    expect(over.defaultPrevented).toBe(true);
    expect(zone.getAttribute('data-active')).toBe('true');

    const leave = dragEvent('dragleave');
    zone.dispatchEvent(leave);
    fixture.detectChanges();

    expect(zone.hasAttribute('data-active')).toBe(false);
  });

  it('keeps active during nested child dragleave events', () => {
    const fixture = TestBed.createComponent(DropZoneHost);
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    const inner = zone.querySelector('[data-child]');
    if (!(inner instanceof HTMLElement)) throw new Error('Expected inner child.');

    zone.dispatchEvent(dragEvent('dragenter'));
    fixture.detectChanges();
    expect(zone.getAttribute('data-active')).toBe('true');

    inner.dispatchEvent(dragEvent('dragleave', [], zone));
    fixture.detectChanges();
    expect(zone.getAttribute('data-active')).toBe('true');

    zone.dispatchEvent(dragEvent('dragleave', [], null));
    fixture.detectChanges();
    expect(zone.hasAttribute('data-active')).toBe(false);
  });

  it('does not create inputs, activate, or emit while disabled', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(DropZoneHost);
    const host = fixture.componentInstance;
    host.disabled.set(true);
    fixture.detectChanges();

    const zone = dropZone(fixture.nativeElement);
    zone.click();
    const over = dragEvent('dragover');
    zone.dispatchEvent(over);
    dispatchDrop(zone, new File(['a'], 'a.txt'));
    fixture.detectChanges();

    expect(zone.querySelector('input[type="file"]')).toBeNull();
    expect(zone.getAttribute('aria-disabled')).toBe('true');
    expect(zone.getAttribute('tabindex')).toBe('-1');
    expect(click).not.toHaveBeenCalled();
    expect(over.defaultPrevented).toBe(false);
    expect(zone.hasAttribute('data-active')).toBe(false);
    expect(host.drops).toEqual([]);
  });
});

function dropZone(root: HTMLElement): HTMLElement {
  const zone = root.querySelector('[hellDropzone]');
  if (!(zone instanceof HTMLElement)) throw new Error('Expected drop zone.');
  return zone;
}

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function fileInput(zone: HTMLElement): HTMLInputElement {
  const input = zone.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected hidden file input.');
  return input;
}

function providedFileInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('[data-native-input]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected native input binding target.');
  return input;
}

function dragEvent(
  type: string,
  files: File[] = [],
  relatedTarget: EventTarget | null = null,
): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: { files: fileList(files) },
  });
  if (relatedTarget !== null) {
    Object.defineProperty(event, 'relatedTarget', {
      value: relatedTarget,
    });
  }
  return event;
}

function dispatchDrop(zone: HTMLElement, ...files: File[]): DragEvent {
  const event = dragEvent('drop', files);
  zone.dispatchEvent(event);
  return event;
}

function fileList(files: readonly File[]): FileList {
  const list: Partial<FileList> & { [index: number]: File } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
  };
  files.forEach((file, index) => {
    list[index] = file;
  });
  return list as FileList;
}
