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

describe('HellDropZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropZoneHost],
    }).compileComponents();
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

function fileInput(zone: HTMLElement): HTMLInputElement {
  const input = zone.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected hidden file input.');
  return input;
}

function dragEvent(type: string, files: File[] = []): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: { files: fileList(files) },
  });
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
